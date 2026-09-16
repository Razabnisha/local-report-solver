ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS verification_round INTEGER NOT NULL DEFAULT 1;

CREATE TABLE public.community_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('solved', 'still_exists')),
  verification_round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id, verification_round)
);
GRANT SELECT, INSERT ON public.community_verifications TO authenticated;
GRANT ALL ON public.community_verifications TO service_role;
ALTER TABLE public.community_verifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX community_verifications_report_idx ON public.community_verifications (report_id, verification_round);

CREATE POLICY "Users can read their own community verifications"
  ON public.community_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit their own community verification"
  ON public.community_verifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.prepare_community_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_round INTEGER;
  current_status public.report_status;
BEGIN
  SELECT r.verification_round, r.status
    INTO current_round, current_status
    FROM public.reports r
   WHERE r.id = NEW.report_id;

  IF current_round IS NULL OR current_status <> 'awaiting_verification'::public.report_status THEN
    RAISE EXCEPTION 'This report is not accepting community verification';
  END IF;

  NEW.verification_round := current_round;
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_verifications_prepare
  BEFORE INSERT ON public.community_verifications
  FOR EACH ROW EXECUTE FUNCTION public.prepare_community_verification();

CREATE OR REPLACE FUNCTION public.apply_community_verification_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.response = 'still_exists' THEN
    UPDATE public.reports
       SET status = 'reopened'::public.report_status
     WHERE id = NEW.report_id AND verification_round = NEW.verification_round;
  ELSE
    UPDATE public.reports
       SET status = 'verified_resolved'::public.report_status
     WHERE id = NEW.report_id AND verification_round = NEW.verification_round;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER community_verifications_apply_status
  AFTER INSERT ON public.community_verifications
  FOR EACH ROW EXECUTE FUNCTION public.apply_community_verification_status();

CREATE OR REPLACE FUNCTION public.prepare_report_workflow_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'awaiting_verification'::public.report_status
     AND OLD.status <> 'awaiting_verification'::public.report_status THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'::public.app_role
    ) THEN
      RAISE EXCEPTION 'Only administrators can mark reports as awaiting community verification';
    END IF;
    NEW.verification_round := OLD.verification_round + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reports_workflow_update
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.prepare_report_workflow_update();

CREATE OR REPLACE VIEW public.report_verification_counts AS
SELECT
  r.id AS report_id,
  r.verification_round,
  COUNT(v.id) FILTER (WHERE v.response = 'solved')::INTEGER AS solved_count,
  COUNT(v.id) FILTER (WHERE v.response = 'still_exists')::INTEGER AS still_exists_count
FROM public.reports r
LEFT JOIN public.community_verifications v
  ON v.report_id = r.id AND v.verification_round = r.verification_round
GROUP BY r.id, r.verification_round;
GRANT SELECT ON public.report_verification_counts TO anon, authenticated;
GRANT ALL ON public.report_verification_counts TO service_role;

REVOKE ALL ON FUNCTION public.prepare_community_verification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_community_verification_status() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prepare_report_workflow_update() FROM PUBLIC, anon, authenticated;