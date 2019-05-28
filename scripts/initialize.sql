BEGIN;
CREATE SCHEMA IF NOT EXISTS "celsus_lendings" AUTHORIZATION postgres;
SET search_path TO celsus_lendings, public;
\i scripts/lending.sql
COMMIT;