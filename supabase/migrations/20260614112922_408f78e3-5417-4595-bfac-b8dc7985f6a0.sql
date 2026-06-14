
CREATE TYPE public.app_role AS ENUM ('lector', 'superadmin');

CREATE TABLE public.app_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'lector',
  created_by TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
-- No client policies: only service_role (edge functions) can access.

CREATE TABLE public.login_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.login_codes TO service_role;
ALTER TABLE public.login_codes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_login_codes_email ON public.login_codes(email);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_users (email, role, created_by)
VALUES ('datos@hablamosde.com', 'superadmin', 'system')
ON CONFLICT (email) DO NOTHING;
