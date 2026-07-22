-- ============================================================
-- Instant Douce'Heure — Schéma complet
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- Table clients
CREATE TABLE IF NOT EXISTS clients (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               text NOT NULL,
  email             text NOT NULL UNIQUE,
  type_forfait      text NOT NULL,
  seances_totales   int  NOT NULL,
  seances_restantes int  NOT NULL,
  qr_token          text NOT NULL UNIQUE,
  stripe_payment_id text NOT NULL UNIQUE,
  expires_at        timestamptz,
  actif             boolean NOT NULL DEFAULT true,
  notes             text DEFAULT '',
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Historique des séances validées
CREATE TABLE IF NOT EXISTS seances_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid REFERENCES clients(id) ON DELETE CASCADE,
  validated_at timestamptz NOT NULL DEFAULT now()
);

-- Désactiver le RLS (Row Level Security) — accès uniquement côté serveur
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE seances_log DISABLE ROW LEVEL SECURITY;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_clients_qr_token ON clients(qr_token);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_seances_log_client ON seances_log(client_id);
