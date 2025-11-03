-- Revert approval_status default back to 'approved'

ALTER TABLE testimonial_artifacts
  ALTER COLUMN approval_status SET DEFAULT 'approved';

ALTER TABLE testimonials
  ALTER COLUMN approval_status SET DEFAULT 'approved';
