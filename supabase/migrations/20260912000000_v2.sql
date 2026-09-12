-- v2 (doc/13-piano-v2.md, Step V2): lista per categorie con contatore.
--
-- - Via le rotazioni e l'archivio: tabella, funzione, vista e liste archiviate.
--   CANCELLA DATI: in produzione solo dopo conferma.
-- - Una lista sola: niente più `stato`; salva_lista cancella le altre.
-- - Le voci perdono `alternative` e prendono `quantita` e `presi` (solo le
--   generate v2). La lista corrente resta com'è: le sue voci v1 non hanno
--   `quantita` e continuano a spuntarsi.

drop function public.salva_rotazioni(jsonb);
drop table public.rotazioni;
drop view public.archivio;

-- Le voci e le eliminate se ne vanno con le loro liste (on delete cascade).
delete from public.liste where stato = 'archiviata';

drop index public.liste_una_corrente;
alter table public.liste drop column stato;

-- Una lista sola alla volta (doc/06): la tiene salva_lista, e la garantisce
-- anche il database.
create unique index liste_una_sola on public.liste ((true));

alter table public.voci drop column alternative;
alter table public.voci add column quantita integer check (quantita > 0);
alter table public.voci add column presi integer;
alter table public.voci add constraint voci_presi_nel_totale
  check ((quantita is null and presi is null) or (presi between 0 and quantita));

/**
 * Salva la lista per intero e cancella le altre: le voci sparite dall'oggetto
 * spariscono, le altre si aggiornano sul posto. Suona il campanello del
 * realtime (`aggiornata_il`).
 */
create or replace function public.salva_lista(lista jsonb) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  delete from public.liste where id <> lista->>'id';

  insert into public.liste (id, creata_il)
  values (lista->>'id', (lista->>'creataIl')::timestamptz)
  on conflict (id) do update set
    creata_il     = excluded.creata_il,
    aggiornata_il = now();

  delete from public.voci
  where lista_id = lista->>'id'
    and id not in (select voce->>'id' from jsonb_array_elements(lista->'voci') as voce);

  insert into public.voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, quantita, presi)
  select lista->>'id',
         voce->>'id',
         (posizione - 1)::integer,
         voce->>'nome',
         voce->>'reparto',
         voce->>'categoria',
         voce->>'origine',
         (voce->>'comprata')::boolean,
         (voce->>'quantita')::integer,
         (voce->>'presi')::integer
  from jsonb_array_elements(lista->'voci') with ordinality as t (voce, posizione)
  on conflict (lista_id, id) do update set
    posizione = excluded.posizione,
    nome      = excluded.nome,
    reparto   = excluded.reparto,
    categoria = excluded.categoria,
    origine   = excluded.origine,
    comprata  = excluded.comprata,
    quantita  = excluded.quantita,
    presi     = excluded.presi;
end;
$$;

/**
 * Come nello Step 16: solo le voci toccate, vince la modifica più recente, le
 * eliminate non tornano. `presi` segue la stessa regola della spunta. Scrive
 * solo sulla lista che c'è: una scrittura rimasta in coda per una lista già
 * sostituita non fa niente. I campi che non conosce (`alternative` delle
 * scritture v1 rimaste sul dispositivo) li ignora.
 */
create or replace function public.salva_voci(
  id_lista text, modificate jsonb, eliminate text[], quando timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.liste set aggiornata_il = now() where id = id_lista;
  if not found then
    return;
  end if;

  insert into public.voci_eliminate (lista_id, id)
  select id_lista, unnest(eliminate)
  on conflict do nothing;

  delete from public.voci where lista_id = id_lista and id = any (eliminate);

  insert into public.voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, quantita, presi, modificata_il)
  select id_lista,
         voce->>'id',
         (select coalesce(max(posizione), -1) from public.voci where lista_id = id_lista) + n::integer,
         voce->>'nome',
         voce->>'reparto',
         voce->>'categoria',
         voce->>'origine',
         (voce->>'comprata')::boolean,
         (voce->>'quantita')::integer,
         (voce->>'presi')::integer,
         quando
  from jsonb_array_elements(modificate) with ordinality as t (voce, n)
  where not exists (
    select 1 from public.voci_eliminate as via
    where via.lista_id = id_lista and via.id = voce->>'id'
  )
  on conflict (lista_id, id) do update set
    nome          = excluded.nome,
    reparto       = excluded.reparto,
    categoria     = excluded.categoria,
    origine       = excluded.origine,
    comprata      = excluded.comprata,
    quantita      = excluded.quantita,
    presi         = excluded.presi,
    modificata_il = excluded.modificata_il
  where public.voci.modificata_il is null
     or public.voci.modificata_il <= excluded.modificata_il;
end;
$$;
