CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 120),
  -- Descriptive label only. Never use it for authorization.
  account_type text NOT NULL DEFAULT 'candidate' CHECK (account_type IN ('candidate', 'partner')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.passports (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL CHECK (id ~ '^[A-Za-z0-9-]{4,40}$'),
  record jsonb NOT NULL CHECK (pg_column_size(record) < 100000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.passports TO authenticated;
GRANT ALL ON public.passports TO service_role;
ALTER TABLE public.passports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own passports" ON public.passports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert own passports" ON public.passports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update own passports" ON public.passports FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners delete own passports" ON public.passports FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, account_type)
  VALUES (
    NEW.id,
    left(coalesce(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''), 120),
    CASE WHEN NEW.raw_user_meta_data ->> 'account_type' = 'partner' THEN 'partner' ELSE 'candidate' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();