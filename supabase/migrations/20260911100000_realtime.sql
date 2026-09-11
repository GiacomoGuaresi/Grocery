-- Realtime (Step 15): le modifiche di un dispositivo compaiono sull'altro, e i
-- conflitti si risolvono last-write-wins per singola voce (doc/07).
--
-- Nella pubblicazione del realtime entra solo `liste`, che fa da campanello:
-- ogni scrittura sulla lista ne aggiorna `aggiornata_il`, il client riceve
-- l'UPDATE e rilegge. Le voci restano fuori: le cancellazioni Postgres le manda
-- a chiunque sia in ascolto senza guardare le policy, e dal canale non deve
-- passare niente del contenuto della lista.

alter table public.liste add column aggiornata_il timestamptz not null default now();

alter publication supabase_realtime add table public.liste;

/**
 * Scrive solo le voci toccate: le altre restano come sono, quindi due
 * dispositivi che spuntano cose diverse si sommano invece di sovrascriversi, e
 * sulla stessa voce vince l'ultima scrittura. Le voci nuove vanno in fondo;
 * quelle già presenti tengono la loro posizione. Scrive solo sulla lista
 * corrente: un dispositivo rimasto indietro non tocca l'archivio.
 */
create function public.salva_voci(id_lista text, modificate jsonb, eliminate text[]) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Suona il campanello e fa da controllo: se la lista non è la corrente non
  -- aggiorna niente, e ci si ferma. Il lock sulla riga mette in fila le
  -- scritture concorrenti, così le posizioni nuove non si accavallano.
  update public.liste set aggiornata_il = now()
  where id = id_lista and stato = 'corrente';
  if not found then
    return;
  end if;

  insert into public.voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, alternative)
  select id_lista,
         voce->>'id',
         (select coalesce(max(posizione), -1) from public.voci where lista_id = id_lista) + n::integer,
         voce->>'nome',
         voce->>'reparto',
         voce->>'categoria',
         voce->>'origine',
         (voce->>'comprata')::boolean,
         case when voce ? 'alternative'
              then array(select jsonb_array_elements_text(voce->'alternative'))
         end
  from jsonb_array_elements(modificate) with ordinality as t (voce, n)
  on conflict (lista_id, id) do update set
    nome        = excluded.nome,
    reparto     = excluded.reparto,
    categoria   = excluded.categoria,
    origine     = excluded.origine,
    comprata    = excluded.comprata,
    alternative = excluded.alternative;

  delete from public.voci where lista_id = id_lista and id = any (eliminate);
end;
$$;

revoke execute on function public.salva_voci(text, jsonb, text[]) from public, anon;
grant execute on function public.salva_voci(text, jsonb, text[]) to authenticated;

-- salva_lista com'era, più `aggiornata_il`: anche il salvataggio intero (la
-- generazione) suona il campanello.
create or replace function public.salva_lista(lista jsonb) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if lista->>'stato' = 'corrente' then
    update public.liste set stato = 'archiviata', aggiornata_il = now()
    where stato = 'corrente' and id <> lista->>'id';
  end if;

  insert into public.liste (id, creata_il, stato)
  values (lista->>'id', (lista->>'creataIl')::timestamptz, lista->>'stato')
  on conflict (id) do update set
    creata_il     = excluded.creata_il,
    stato         = excluded.stato,
    aggiornata_il = now();

  delete from public.voci
  where lista_id = lista->>'id'
    and id not in (select voce->>'id' from jsonb_array_elements(lista->'voci') as voce);

  insert into public.voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, alternative)
  select lista->>'id',
         voce->>'id',
         (posizione - 1)::integer,
         voce->>'nome',
         voce->>'reparto',
         voce->>'categoria',
         voce->>'origine',
         (voce->>'comprata')::boolean,
         case when voce ? 'alternative'
              then array(select jsonb_array_elements_text(voce->'alternative'))
         end
  from jsonb_array_elements(lista->'voci') with ordinality as t (voce, posizione)
  on conflict (lista_id, id) do update set
    posizione   = excluded.posizione,
    nome        = excluded.nome,
    reparto     = excluded.reparto,
    categoria   = excluded.categoria,
    origine     = excluded.origine,
    comprata    = excluded.comprata,
    alternative = excluded.alternative;
end;
$$;
