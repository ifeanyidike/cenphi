DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database
      WHERE datname = 'cenphidb_test'
   ) THEN
      CREATE DATABASE cenphidb_test;
   END IF;
END
$$;


DO $$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database
      WHERE datname = 'cenphidb'
   ) THEN
      CREATE DATABASE cenphidb;
   END IF;
END
$$;
