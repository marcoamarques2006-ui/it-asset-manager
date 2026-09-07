import { createClient } from "@supabase/supabase-js";

// Anon key é segura pra expor no cliente — é o RLS que protege os
// dados, não o segredo da key. Default aponta pro projeto real
// (supabase/config.toml / migrations neste mesmo repo) pra funcionar
// sem exigir .env local; override via VITE_SUPABASE_URL/ANON_KEY se
// precisar apontar pra outro projeto.
const SUPABASE_URL =
  import.meta.env["VITE_SUPABASE_URL"] ??
  "https://uldqinjlhfrzunloigxw.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env["VITE_SUPABASE_ANON_KEY"] ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZHFpbmpsaGZyenVubG9pZ3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MDU2NDEsImV4cCI6MjEwNDM4MTY0MX0.ExNFHknRlvayFHIcnt_MHen_aEJne37VycZQ3UZCNJs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
