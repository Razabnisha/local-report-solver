ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'awaiting_verification';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'verified_resolved';
ALTER TYPE public.report_status ADD VALUE IF NOT EXISTS 'reopened';