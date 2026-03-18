
-- Create triggers for depenses date parts
DROP TRIGGER IF EXISTS fill_depense_date_parts_trigger ON public.depenses;
CREATE TRIGGER fill_depense_date_parts_trigger
BEFORE INSERT OR UPDATE ON public.depenses
FOR EACH ROW EXECUTE FUNCTION public.fill_depense_date_parts();

-- Create triggers for entrees date parts
DROP TRIGGER IF EXISTS fill_entree_date_parts_trigger ON public.entrees;
CREATE TRIGGER fill_entree_date_parts_trigger
BEFORE INSERT OR UPDATE ON public.entrees
FOR EACH ROW EXECUTE FUNCTION public.fill_entree_date_parts();

-- Create trigger for updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on coffre_fort
DROP TRIGGER IF EXISTS update_coffre_fort_updated_at ON public.coffre_fort;
CREATE TRIGGER update_coffre_fort_updated_at
BEFORE UPDATE ON public.coffre_fort
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on app_users
DROP TRIGGER IF EXISTS update_app_users_updated_at ON public.app_users;
CREATE TRIGGER update_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for mes-secrets-media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read mes-secrets-media' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public read mes-secrets-media" ON storage.objects
    FOR SELECT USING (bucket_id = 'mes-secrets-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public insert mes-secrets-media' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public insert mes-secrets-media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'mes-secrets-media');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public delete mes-secrets-media' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Public delete mes-secrets-media" ON storage.objects
    FOR DELETE USING (bucket_id = 'mes-secrets-media');
  END IF;
END $$;
