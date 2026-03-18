create table prets (
  id uuid primary key default uuid_generate_v4(),
  nom text,
  montant numeric,
  date_pret date,
  date_echeance date,
  temoin text,
  signature_preteur text,
  signature_emprunteur text,
  created_at timestamp default now()
);
