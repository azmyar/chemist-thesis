-- Refactor: collapse ke 1 tabel `student_progress`.
-- `milestone_events` di-drop. Informasi per-step (yang terakhir) disimpan
-- sebagai kolom granular langsung di `student_progress` — tiap milestone
-- update row yg sama, tidak ada append history. Untuk kebutuhan skripsi
-- (state akhir per siswa), 1 tabel sudah cukup.

DROP TABLE IF EXISTS milestone_events;

-- Tambah kolom granular: step terakhir + judulnya + waktu pencapaiannya.
-- ALTER ADD COLUMN aman di SQLite/D1; default NULL tidak memengaruhi row lama.
ALTER TABLE student_progress ADD COLUMN last_milestone_step INTEGER;
ALTER TABLE student_progress ADD COLUMN last_milestone_title TEXT;
ALTER TABLE student_progress ADD COLUMN last_milestone_at INTEGER;
