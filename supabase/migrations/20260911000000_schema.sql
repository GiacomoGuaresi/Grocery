-- Schema dello stato su Supabase: le tabelle di doc/06 (liste, voci, rotazioni),
-- con date vere, booleani veri, elenchi come text[].
-- Nessuna migrazione dal passato (elementi, surgelati, salumi_formaggi): questo
-- database nasce dopo.

create table public.liste (
  id         text primary key,
  creata_il  timestamptz not null,
  stato      text not null check (stato in ('corrente', 'archiviata'))
);

-- Una sola lista corrente alla volta (doc/06): la tiene salva_lista, e la
-- garantisce anche il database.
create unique index liste_una_corrente on public.liste (stato) where stato = 'corrente';

create table public.voci (
  lista_id     text not null references public.liste (id) on delete cascade,
  id           text not null,
  posizione    integer not null,
  nome         text not null,
  reparto      text not null,
  categoria    text,
  origine      text not null check (origine in ('generata', 'manuale')),
  comprata     boolean not null default false,
  alternative  text[],
  primary key (lista_id, id)
);

create table public.rotazioni (
  categoria  text primary key,
  ultimi     text[] not null
);

-- L'elenco dell'archivio con i conteggi, senza tirare su le voci (F11).
-- security_invoker: la vista legge con i permessi di chi chiede, quindi valgono
-- le policy delle tabelle sotto.
create view public.archivio with (security_invoker = true) as
select liste.id,
       liste.creata_il,
       count(voci.id)::integer                              as quante_voci,
       count(voci.id) filter (where voci.comprata)::integer as quante_comprate
from public.liste
left join public.voci on voci.lista_id = liste.id
where liste.stato = 'archiviata'
group by liste.id;

-- Il client di Supabase non apre transazioni: le scritture composte passano da
-- funzioni, che Postgres esegue tutte o niente.

/**
 * Salva la lista per intero: le voci sparite
 * dall'oggetto spariscono, le altre si aggiornano sul posto (non si cancellano
 * e reinseriscono, così al realtime dello Step 15 arrivano solo le voci toccate).
 * Salvando una lista corrente le altre correnti passano ad archiviate.
 */
create function public.salva_lista(lista jsonb) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if lista->>'stato' = 'corrente' then
    update public.liste set stato = 'archiviata'
    where stato = 'corrente' and id <> lista->>'id';
  end if;

  insert into public.liste (id, creata_il, stato)
  values (lista->>'id', (lista->>'creataIl')::timestamptz, lista->>'stato')
  on conflict (id) do update set creata_il = excluded.creata_il, stato = excluded.stato;

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

/** Sostituisce la memoria della rotazione con quella passata. */
create function public.salva_rotazioni(rotazioni jsonb) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- `where true`: PostgREST rifiuta i DELETE senza WHERE (pg_safeupdate).
  delete from public.rotazioni where true;

  insert into public.rotazioni (categoria, ultimi)
  select rotazione->>'categoria',
         array(select jsonb_array_elements_text(rotazione->'ultimi'))
  from jsonb_array_elements(rotazioni) as rotazione;
end;
$$;

-- Accesso: un solo account condiviso (doc/07), quindi nessun filtro per utente.
-- Basta essere la sessione autenticata; chi non lo è non vede e non scrive niente.

alter table public.liste enable row level security;
alter table public.voci enable row level security;
alter table public.rotazioni enable row level security;

create policy "solo la sessione autenticata" on public.liste
  for all to authenticated using (true) with check (true);
create policy "solo la sessione autenticata" on public.voci
  for all to authenticated using (true) with check (true);
create policy "solo la sessione autenticata" on public.rotazioni
  for all to authenticated using (true) with check (true);

-- Oltre alle policy, i permessi: anon non tocca niente, nemmeno le funzioni.
revoke all on public.liste, public.voci, public.rotazioni, public.archivio from anon;
grant select, insert, update, delete on public.liste, public.voci, public.rotazioni to authenticated;
grant select on public.archivio to authenticated;

revoke execute on function public.salva_lista(jsonb), public.salva_rotazioni(jsonb) from public, anon;
grant execute on function public.salva_lista(jsonb), public.salva_rotazioni(jsonb) to authenticated;
