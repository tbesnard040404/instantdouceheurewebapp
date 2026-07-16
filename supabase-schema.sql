-- À exécuter dans Supabase > SQL Editor

create table if not exists clients (
  id                uuid primary key default gen_random_uuid(),
  nom               text not null,
  email             text not null unique,
  type_forfait      text not null,
  seances_totales   int  not null,
  seances_restantes int  not null,
  qr_token          text not null unique,
  stripe_payment_id text not null unique,
  expires_at        timestamptz,
  actif             boolean not null default true,
  created_at        timestamptz not null default now()
);
