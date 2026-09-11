-- Offline (Step 16): le scritture fatte senza rete restano in coda sul
-- dispositivo e arrivano al database anche molto dopo. Il last-write-wins per
-- singola voce resta, ma "ultima" diventa la modifica fatta più di recente, non
-- l'ultima arrivata: altrimenti una coda svuotata tardi vincerebbe su modifiche
-- più nuove fatte dall'altro dispositivo (doc/07).
--
-- - Ogni voce ricorda l'ora dell'ultima modifica che l'ha scritta
--   (`modificata_il`, l'ora del dispositivo). Una scrittura più vecchia di
--   quella salvata non la tocca.
-- - Una voce eliminata non torna: il suo id resta in `voci_eliminate`, e una
--   modifica rimasta in coda da prima dell'eliminazione non la ricrea.

-- Null per le voci scritte da salva_lista (la generazione): qualunque modifica
-- vince su quella.
alter table public.voci add column modificata_il timestamptz;

create table public.voci_eliminate (
  lista_id  text not null references public.liste (id) on delete cascade,
  id        text not null,
  primary key (lista_id, id)
);

alter table public.voci_eliminate enable row level security;
create policy "solo la sessione autenticata" on public.voci_eliminate
  for all to authenticated using (true) with check (true);
revoke all on public.voci_eliminate from anon;
grant select, insert, update, delete on public.voci_eliminate to authenticated;

/**
 * Come prima scrive solo le voci toccate, e solo sulla lista corrente. In più:
 * - `quando` è l'ora della modifica sul dispositivo: una voce già scritta da una
 *   modifica più recente resta com'è;
 * - le eliminate lasciano il loro id in `voci_eliminate`, e da lì in poi nessuna
 *   scrittura le ricrea: l'eliminazione vince sempre.
 */
drop function public.salva_voci(text, jsonb, text[]);

create function public.salva_voci(
  id_lista text, modificate jsonb, eliminate text[], quando timestamptz
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Il campanello del realtime, il controllo sulla lista corrente e il lock
  -- che mette in fila le scritture concorrenti, come nello Step 15.
  update public.liste set aggiornata_il = now()
  where id = id_lista and stato = 'corrente';
  if not found then
    return;
  end if;

  insert into public.voci_eliminate (lista_id, id)
  select id_lista, unnest(eliminate)
  on conflict do nothing;

  delete from public.voci where lista_id = id_lista and id = any (eliminate);

  insert into public.voci (lista_id, id, posizione, nome, reparto, categoria, origine, comprata, alternative, modificata_il)
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
         end,
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
    alternative   = excluded.alternative,
    modificata_il = excluded.modificata_il
  where public.voci.modificata_il is null
     or public.voci.modificata_il <= excluded.modificata_il;
end;
$$;

revoke execute on function public.salva_voci(text, jsonb, text[], timestamptz) from public, anon;
grant execute on function public.salva_voci(text, jsonb, text[], timestamptz) to authenticated;
