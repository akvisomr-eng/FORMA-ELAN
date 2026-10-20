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

CREATE TABLE IF NOT EXISTS public.vision_analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  survey_id uuid NOT NULL,
  room_id uuid,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','running','needs_input','completed','failed','cancelled')),
  provider text,
  model_name text,
  prompt_version text,
  idempotency_key text NOT NULL,
  input_media_ids uuid[] NOT NULL DEFAULT '{}',
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  error_code text,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (survey_id, organization_id, project_id)
    REFERENCES public.field_surveys(id, organization_id, project_id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id, organization_id, project_id)
    REFERENCES public.survey_rooms(id, organization_id, project_id) ON DELETE RESTRICT,
  UNIQUE (organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_vision_jobs_queue
  ON public.vision_analysis_jobs (status, created_at)
  WHERE status IN ('queued','running');

CREATE TABLE IF NOT EXISTS public.interior_design_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  survey_id uuid NOT NULL,
  room_id uuid NOT NULL,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  title text NOT NULL,
  style text,
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_object_key text,
  render_provider text,
  render_model text,
  render_status text NOT NULL DEFAULT 'draft'
    CHECK (render_status IN ('draft','queued','generated','failed','rejected')),
  concept_disclaimer text NOT NULL DEFAULT 'Visual concept only; not construction documentation.',
  assumptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (survey_id, organization_id, project_id)
    REFERENCES public.field_surveys(id, organization_id, project_id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id, organization_id, project_id)
    REFERENCES public.survey_rooms(id, organization_id, project_id) ON DELETE RESTRICT,
  UNIQUE (room_id, revision, title)
);

CREATE TABLE IF NOT EXISTS public.quantity_takeoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  survey_id uuid NOT NULL,
  room_id uuid NOT NULL,
  design_option_id uuid REFERENCES public.interior_design_options(id) ON DELETE RESTRICT,
  item_code text NOT NULL,
  description text NOT NULL,
  unit text NOT NULL,
  quantity numeric(16,4) CHECK (quantity IS NULL OR quantity >= 0),
  formula text,
  formula_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_measurement_ids uuid[] NOT NULL DEFAULT '{}',
  source_media_ids uuid[] NOT NULL DEFAULT '{}',
  waste_factor numeric(8,5) NOT NULL DEFAULT 0 CHECK (waste_factor >= 0 AND waste_factor <= 1),
  confidence numeric(4,3) CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','needs_input','review','approved','rejected')),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  reviewed_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (survey_id, organization_id, project_id)
    REFERENCES public.field_surveys(id, organization_id, project_id) ON DELETE RESTRICT,
  FOREIGN KEY (room_id, organization_id, project_id)
    REFERENCES public.survey_rooms(id, organization_id, project_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_quantity_takeoffs_project
  ON public.quantity_takeoffs (organization_id, project_id, status, revision DESC);

CREATE TABLE IF NOT EXISTS public.rate_book_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  name text NOT NULL,
  region text NOT NULL,
  currency char(3) NOT NULL DEFAULT 'IDR',
  effective_from date NOT NULL,
  effective_to date,
  source_description text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  approved_by uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  UNIQUE (organization_id, name, effective_from)
);

CREATE TABLE IF NOT EXISTS public.rate_book_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  rate_book_version_id uuid NOT NULL REFERENCES public.rate_book_versions(id) ON DELETE RESTRICT,
  item_code text NOT NULL,
  description text NOT NULL,
  unit text NOT NULL,
  material_rate numeric(16,2) NOT NULL DEFAULT 0 CHECK (material_rate >= 0),
  labour_rate numeric(16,2) NOT NULL DEFAULT 0 CHECK (labour_rate >= 0),
  equipment_rate numeric(16,2) NOT NULL DEFAULT 0 CHECK (equipment_rate >= 0),
  source_reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rate_book_version_id, item_code)
);

CREATE INDEX IF NOT EXISTS idx_rate_book_active
  ON public.rate_book_versions (organization_id, status, region, effective_from DESC);

-- RLS is enabled with no browser-facing policies yet: direct client access is denied
-- until a trusted server API and organization-scoped authorization are implemented.
ALTER TABLE public.field_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interior_design_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quantity_takeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_book_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_book_items ENABLE ROW LEVEL SECURITY;

COMMIT;