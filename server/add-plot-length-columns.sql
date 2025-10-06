-- Add missing plot length columns to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plotLengthMin DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plotLengthMax DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plotWidth DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS coveredArea DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS lotSizeMin DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS lotSizeMax DECIMAL(10,3);

-- Add other missing columns that are referenced in the schema
ALTER TABLE plans ADD COLUMN IF NOT EXISTS planType TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS storeys INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS lotSize TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS orientation TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS siteType TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS foundationType TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS councilArea TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS roadPosition TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS builderName TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS jobAddress TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS houseType TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS bedrooms INTEGER DEFAULT 3;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS toilets INTEGER DEFAULT 2;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS livingAreas INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS numberOfUnits INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS constructionType TEXT[];
ALTER TABLE plans ADD COLUMN IF NOT EXISTS totalBuildingHeight DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS roofPitch DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS outdoorFeatures TEXT[];
ALTER TABLE plans ADD COLUMN IF NOT EXISTS indoorFeatures TEXT[];
ALTER TABLE plans ADD COLUMN IF NOT EXISTS extractedKeywords TEXT[];
ALTER TABLE plans ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS uploadedBy UUID REFERENCES auth.users(id);

-- Add indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_plans_plotLengthMin ON plans (plotLengthMin);
CREATE INDEX IF NOT EXISTS idx_plans_plotLengthMax ON plans (plotLengthMax);
CREATE INDEX IF NOT EXISTS idx_plans_plotWidth ON plans (plotWidth);
CREATE INDEX IF NOT EXISTS idx_plans_coveredArea ON plans (coveredArea);
CREATE INDEX IF NOT EXISTS idx_plans_planType ON plans (planType);
CREATE INDEX IF NOT EXISTS idx_plans_storeys ON plans (storeys);
CREATE INDEX IF NOT EXISTS idx_plans_bedrooms ON plans (bedrooms);
CREATE INDEX IF NOT EXISTS idx_plans_status ON plans (status);