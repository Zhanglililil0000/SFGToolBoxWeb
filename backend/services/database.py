import sqlite3
import os
import io
from datetime import datetime

from PIL import Image

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sfg_database.db')
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')


def init_db():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            formula TEXT,
            normalized_intensity REAL,
            effective_chi2 REAL,
            peak_position REAL,
            peak_width REAL,
            vibrational_mode TEXT,
            functional_group TEXT,
            vis_angle REAL,
            ir_angle REAL,
            laser_energy TEXT,
            instrument TEXT,
            reference TEXT,
            image_path TEXT,
            uploader TEXT,
            polarization TEXT,
            created_at TEXT
        )
    ''')
    try:
        conn.execute('ALTER TABLE records ADD COLUMN uploader TEXT')
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute('ALTER TABLE records ADD COLUMN polarization TEXT')
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()


def get_all_records():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute('SELECT * FROM records ORDER BY id DESC').fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_record(data: dict):
    conn = sqlite3.connect(DB_PATH)
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn.execute('''
        INSERT INTO records (name, formula, normalized_intensity, effective_chi2,
            peak_position, peak_width, vibrational_mode, functional_group,
            vis_angle, ir_angle, laser_energy, instrument, reference, image_path, uploader, polarization, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['name'], data.get('formula'), data.get('normalized_intensity'),
        data.get('effective_chi2'), data.get('peak_position'), data.get('peak_width'),
        data.get('vibrational_mode'), data.get('functional_group'),
        data.get('vis_angle'), data.get('ir_angle'), data.get('laser_energy'),
        data.get('instrument'), data.get('reference'), data.get('image_path'),
        data.get('uploader'),
        data.get('polarization'),
        now
    ))
    conn.commit()
    record_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    conn.close()
    return record_id


def delete_record(record_id: int):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute('SELECT image_path FROM records WHERE id = ?', (record_id,)).fetchone()
    if row and row[0]:
        img_path = os.path.join(UPLOAD_DIR, row[0])
        if os.path.exists(img_path):
            os.remove(img_path)
    conn.execute('DELETE FROM records WHERE id = ?', (record_id,))
    conn.commit()
    conn.close()
    return True


def update_record(record_id: int, data: dict):
    conn = sqlite3.connect(DB_PATH)

    row = conn.execute('SELECT image_path FROM records WHERE id = ?', (record_id,)).fetchone()
    if not row:
        conn.close()
        raise ValueError("Record not found")

    old_image_path = row[0]

    fields = [
        'name', 'formula', 'normalized_intensity', 'effective_chi2',
        'peak_position', 'peak_width', 'vibrational_mode', 'functional_group',
        'vis_angle', 'ir_angle', 'laser_energy', 'instrument', 'reference',
        'uploader', 'polarization', 'image_path'
    ]

    updates = []
    values = []
    for field in fields:
        if field in data and data[field] is not None:
            updates.append(f"{field} = ?")
            values.append(data[field])

    if 'image_path' in data and old_image_path and data['image_path'] != old_image_path:
        old_img = os.path.join(UPLOAD_DIR, old_image_path)
        if os.path.exists(old_img):
            os.remove(old_img)

    if updates:
        values.append(record_id)
        conn.execute(f"UPDATE records SET {', '.join(updates)} WHERE id = ?", values)

    conn.commit()

    conn.row_factory = sqlite3.Row
    updated = conn.execute('SELECT * FROM records WHERE id = ?', (record_id,)).fetchone()
    conn.close()
    return dict(updated)


MAX_DIM = 1200
JPEG_QUALITY = 45


def save_image(file_data: bytes, filename: str) -> str:
    img = Image.open(io.BytesIO(file_data))
    img = img.convert('L')

    w, h = img.size
    longest = max(w, h)
    if longest > MAX_DIM:
        ratio = MAX_DIM / longest
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    safe_name = f"{int(datetime.now().timestamp())}.jpg"
    path = os.path.join(UPLOAD_DIR, safe_name)
    img.save(path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
    return safe_name
