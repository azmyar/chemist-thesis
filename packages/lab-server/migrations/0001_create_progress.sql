-- Migrasi D1: tabel progres siswa untuk penelitian.
-- Jalankan: wrangler d1 execute chemist-lab-progress --remote --file=migrations/0001_create_progress.sql

-- Snapshot status terkini per siswa (di-upsert tiap progres berubah).
CREATE TABLE IF NOT EXISTS student_progress (
	sid                   TEXT PRIMARY KEY,
	student_name          TEXT,
	room_id               TEXT,
	xp                    INTEGER NOT NULL DEFAULT 0,
	milestones_completed  INTEGER NOT NULL DEFAULT 0,
	total_milestones      INTEGER NOT NULL DEFAULT 14,
	finished              INTEGER NOT NULL DEFAULT 0,  -- 0/1
	started_at            INTEGER,                      -- epoch ms
	updated_at            INTEGER                       -- epoch ms
);

CREATE INDEX IF NOT EXISTS idx_progress_name ON student_progress(student_name);
CREATE INDEX IF NOT EXISTS idx_progress_room ON student_progress(room_id);

-- Riwayat event tiap milestone selesai (append-only) untuk analisis durasi & urutan.
CREATE TABLE IF NOT EXISTS milestone_events (
	id            INTEGER PRIMARY KEY AUTOINCREMENT,
	sid           TEXT NOT NULL,
	student_name  TEXT,
	room_id       TEXT,
	step          INTEGER NOT NULL,
	title         TEXT,
	completed_at  INTEGER NOT NULL,  -- epoch ms
	xp_after      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_sid ON milestone_events(sid);
CREATE INDEX IF NOT EXISTS idx_events_step ON milestone_events(step);
