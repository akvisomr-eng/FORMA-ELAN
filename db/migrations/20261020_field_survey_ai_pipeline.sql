-- FORMA ELAN field-survey and AI pipeline schema
-- Additive migration. Apply to production only after reviewing the tested Neon branch.
BEGIN;

CREATE TABLE IF NOT EXISTS public.field_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  survey_code text NOT NULL,
  client_name text,
  surveyor_user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  surveyed_at timestamptz NOT NULL DEFAULT now(),
  site_address text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','analysis_pending','in_review','approved','archived')),
  consent_record jsonb NOT NULL DEFAULT '{}'::jsonb,
  schema_version text NOT NULL DEFAULT 'forma-elan-field-survey.v1',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, survey_code),
  UNIQUE (id, organization_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_field_surveys_project_date
  ON public.field_surveys (organization_id, project_id, surveyed_at DESC);

CREATE TABLE IF NOT EXISTS public.survey_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  survey_id uuid NOT NULL,
  room_code text NOT NULL,
  name text NOT NULL,
  room_type text,
  length_m numeric(10,3) CHECK (length_m IS NULL OR length_m >= 0),
  width_m numeric(10,3) CHECK (width_m IS NULL OR width_m >= 0),
  height_m numeric(10,3) CHECK (height_m IS NULL OR height_m >= 0),
  measurement_source text NOT NULL DEFAULT 'unknown'
    CHECK (measurement_source IN ('manual','scaled_drawing','client_report','visual_estimate','unknown')),
  measurement_status text NOT NULL DEFAULT 'unverified'
    CHECK (measurement_status IN ('unverified','verified','rejected')),
  openings jsonb NOT NULL DEFAULT '[]'::jsonb,
  condition_notes text,
  drawing_notes text,
  design_brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (survey_id, organization_id, project_id)
    REFERENCES public.field_surveys(id, organization_id, project_id) ON DELETE RESTRICT,
  UNIQUE (survey_id, room_code),
  UNIQUE (id, organization_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_rooms_project
  ON public.survey_rooms (organization_id, project_id, survey_id);

CREATE TABLE IF NOT EXISTS public.survey_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  survey_id uuid NOT NULL,
  room_id uuid,
  media_kind text NOT NULL
    CHECK (media_kind IN ('room_photo','hand_sketch','floor_plan','elevation','reference_image','other')),
  object_key text NOT NULL,
  original_filename text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp','application/pdf')),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 25165824),
  sha256_hex text,
  captured_at timestamptz,
  uploaded_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  processing_status text NOT NULL DEFAULT 'uploaded'
    CHECK (processing_status IN ('upload_pending','uploaded','quarantined','ready','rejected','deleted')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (survey_id, organization_id, project_id)
    REFERENCES public.field_surveys(id, organization_id, project_id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id, organization_id, project_id)
    REFERENCES public.survey_rooms(id, organization_id, project_id) ON DELETE RESTRICT,
  UNIQUE (object_key)
);

CREATE INDEX IF NOT EXISTS idx_survey_media_survey
  ON public.survey_media (organization_id, survey_id, created_at);

CREATE TABLE IF NOT EXISTS public.survey_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  survey_id uuid NOT NULL,
  room_id uuid NOT NULL,
  dimension_key text NOT NULL,
  value numeric(14,4) NOT NULL CHECK (value >= 0),
  unit text NOT NULL CHECK (unit IN ('m','m2','m3','mm','cm','count','degree','other')),
  source_kind text NOT NULL
    CHECK (source_kind IN ('field_measurement','scaled_drawing','client_report','vision_extraction','manual_correction')),
  source_media_id uuid REFERENCES public.survey_media(id) ON DELETE RESTRICT,
  source_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric(4,3) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  verification_status text NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified','verified','rejected')),
  verified_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (survey_id, organization_id, project_id)
    REFERENCES public.field_surveys(id, organization_id, project_id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id, organization_id, project_id)
    REFERENCES public.survey_rooms(id, organization_id, project_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_survey_measurements_room
  ON public.survey_measurements (organization_id, room_id, dimension_key, revision DESC);

-- AI job, design-option, take-off and rate-book tables will be added in a later migration.
-- RLS is enabled with no browser-facing policies yet. A trusted API must authorize every request.
ALTER TABLE public.field_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_measurements ENABLE ROW LEVEL SECURITY;

COMMIT;
