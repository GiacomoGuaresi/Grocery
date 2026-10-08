-- Ricette (doc/14-piano-ricette.md): le ricette importate da un link e, nella
-- lista, gli ingredienti raggruppati sotto la loro ricetta.
--
-- - Tabella `ricette`: nome, link, foto (solo il link, l'immagine resta sul
--   sito), categorie del sito e ingredienti col testo originale.
-- - Le voci prendono `ricetta_id` e `ricetta_nome`. Niente chiave esterna: la
--   voce resta in lista anche se la ricetta si elimina, col nome copiato.
-- - salva_lista e salva_voci scrivono i due campi nuovi, che nel JSON della
--   voce arrivano come `ricetta: { id, nome }`.

create table public.ricette (
  id           text primary key,
  nome         text not null,
  url          text not null unique,
  immagine     text,
  categorie    text[] not null default '{}',
  ingredienti  text[] not null,
  creata_il    timestamptz not null default now()
);

alter table public.ricette enable row level security;

create policy "solo la sessione autenticata" on public.ricette
  for all to authenticated using (true) with check (true);

revoke all on public.ricette from anon;
grant select, insert, update, delete on public.ricette to authenticated;

alter table public.voci add column ricetta_id text;
alter table public.voci add column ricetta_nome text;
alter table public.voci add constraint voci_ricetta_intera
  check ((ricetta_id is null) = (ricetta_nome is null));

/** Come nella v2, con la ricetta della voce. */
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

  insert into public.voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, quantita, presi, ricetta_id, ricetta_nome)
  select lista->>'id',
         voce->>'id',
         (posizione - 1)::integer,
         voce->>'nome',
         voce->>'reparto',
         voce->>'categoria',
         voce->>'origine',
         (voce->>'comprata')::boolean,
         (voce->>'quantita')::integer,
         (voce->>'presi')::integer,
         voce->'ricetta'->>'id',
         voce->'ricetta'->>'nome'
  from jsonb_array_elements(lista->'voci') with ordinality as t (voce, posizione)
  on conflict (lista_id, id) do update set
    posizione    = excluded.posizione,
    nome         = excluded.nome,
    reparto      = excluded.reparto,
    categoria    = excluded.categoria,
    origine      = excluded.origine,
    comprata     = excluded.comprata,
    quantita     = excluded.quantita,
    presi        = excluded.presi,
    ricetta_id   = excluded.ricetta_id,
    ricetta_nome = excluded.ricetta_nome;
end;
$$;

/** Come nella v2, con la ricetta della voce. */
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

  insert into public.voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, quantita, presi, ricetta_id, ricetta_nome, modificata_il)
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
         voce->'ricetta'->>'id',
         voce->'ricetta'->>'nome',
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
    ricetta_id    = excluded.ricetta_id,
    ricetta_nome  = excluded.ricetta_nome,
    modificata_il = excluded.modificata_il
  where public.voci.modificata_il is null
     or public.voci.modificata_il <= excluded.modificata_il;
end;
$$;
