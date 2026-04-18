-- Expand brand_profile with design system fields
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS colors jsonb DEFAULT '[]';
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS fonts jsonb DEFAULT '[]';
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS tone_keywords text[];
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS visual_style text;
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS competitors text[];
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS content_pillars text[];
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS avoid_keywords text[];
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE brand_profile ADD COLUMN IF NOT EXISTS brand_values text[];
