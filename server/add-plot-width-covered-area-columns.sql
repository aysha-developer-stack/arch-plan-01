-- Add min/max columns for plot width and covered area to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plotWidthMin DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plotWidthMax DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS coveredAreaMin DECIMAL(10,3);
ALTER TABLE plans ADD COLUMN IF NOT EXISTS coveredAreaMax DECIMAL(10,3);

-- Create indexes for better performance on range queries
CREATE INDEX IF NOT EXISTS idx_plans_plot_width_min ON plans (plotWidthMin);
CREATE INDEX IF NOT EXISTS idx_plans_plot_width_max ON plans (plotWidthMax);
CREATE INDEX IF NOT EXISTS idx_plans_covered_area_min ON plans (coveredAreaMin);
CREATE INDEX IF NOT EXISTS idx_plans_covered_area_max ON plans (coveredAreaMax);

-- Create composite indexes for range queries
CREATE INDEX IF NOT EXISTS idx_plans_plot_width_range ON plans (plotWidthMin, plotWidthMax);
CREATE INDEX IF NOT EXISTS idx_plans_covered_area_range ON plans (coveredAreaMin, coveredAreaMax);