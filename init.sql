CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    path VARCHAR(1000),
    user_id VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    event_date DATE
);

-- Trigger function to set event_date
CREATE OR REPLACE FUNCTION set_event_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.event_date := NEW.timestamp::date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to populate event_date on insert
CREATE TRIGGER set_event_date_trigger
BEFORE INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION set_event_date();

CREATE INDEX IF NOT EXISTS idx_events_site_timestamp ON events(site_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_site_date ON events(site_id, event_date);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);