-- Rename enum values in place (preserves existing rows, unlike drop/recreate)
ALTER TYPE "ClientStatus" RENAME VALUE 'due' TO 'treatment';
ALTER TYPE "ClientStatus" RENAME VALUE 'paid' TO 'settled';

-- New archive flag, separate from the treatment/settled phase
ALTER TABLE "clients" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- Match the new default now that "due" no longer exists
ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'treatment';
