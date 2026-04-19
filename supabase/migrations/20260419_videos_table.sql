CREATE TABLE IF NOT EXISTS videos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id text NOT NULL,
  user_id uuid NOT NULL,
  prompt text NOT NULL,
  model text DEFAULT 'minimax/video-01',
  aspect_ratio text DEFAULT '16:9',
  duration_seconds integer DEFAULT 6,
  status text DEFAULT 'pending',
  video_url text,
  error_message text,
  cost_usd numeric DEFAULT 0,
  latency_ms integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages videos" ON videos FOR ALL TO service_role USING (true);
