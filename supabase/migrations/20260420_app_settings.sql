CREATE TABLE IF NOT EXISTS app_settings (
  id text PRIMARY KEY DEFAULT 'global',
  support_email text,
  support_url text,
  announcement text,
  announcement_active boolean DEFAULT false,
  maintenance_mode boolean DEFAULT false,
  maintenance_message text,
  default_model text DEFAULT 'gpt-4o',
  max_free_messages integer DEFAULT 50,
  max_free_images integer DEFAULT 5,
  welcome_message text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages app_settings" ON app_settings FOR ALL TO service_role USING (true);

-- Insert default row
INSERT INTO app_settings (id, support_email, support_url) VALUES ('global', 'rubengomezesp@gmail.com', 'https://www.operatoraiapp.com/support') ON CONFLICT DO NOTHING;
