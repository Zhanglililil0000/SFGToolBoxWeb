import json
import os
import re
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel

from services.database import get_all_records, add_record, update_record, delete_record, save_image, UPLOAD_DIR

router = APIRouter(prefix="/api/database", tags=["database"])

ADMIN_PASSWORD = "Xihu@323"


class AdminAuthRequest(BaseModel):
    password: str


@router.post("/admin/auth")
async def admin_auth(body: AdminAuthRequest):
    if body.password == ADMIN_PASSWORD:
        return {"success": True}
    raise HTTPException(status_code=401, detail="Incorrect password")


@router.get("/records")
async def list_records():
    records = get_all_records()
    return records


@router.post("/records")
async def create_record(
    data: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    try:
        record_data = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in data field")

    if 'name' not in record_data:
        raise HTTPException(status_code=400, detail="name field is required")

    image_path = None
    if image and image.filename:
        file_bytes = await image.read()
        image_path = save_image(file_bytes, image.filename)

    record_data['image_path'] = image_path
    record_id = add_record(record_data)
    return {"id": record_id, "message": "Record created successfully"}


@router.patch("/records/{record_id}")
async def update_record_endpoint(
    record_id: int,
    data: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    try:
        record_data = json.loads(data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON in data field")

    try:
        if image and image.filename:
            file_bytes = await image.read()
            new_image_path = save_image(file_bytes, image.filename)
            record_data['image_path'] = new_image_path

        updated = update_record(record_id, record_data)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/records/{record_id}")
async def remove_record(record_id: int):
    delete_record(record_id)
    return {"message": "Record deleted successfully"}


@router.get("/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)


FIELD_MAP = {
    'Name': 'name', 'Formula': 'formula', 'Normalized Intensity': 'normalized_intensity',
    'Effective χ²': 'effective_chi2', 'Peak Position': 'peak_position', 'Peak Width': 'peak_width',
    'Vibrational Mode': 'vibrational_mode', 'Functional Group': 'functional_group',
    'Visible Incident Angle': 'vis_angle', 'IR Incident Angle': 'ir_angle',
    'Laser Energy': 'laser_energy', 'Instrument': 'instrument',
    'Reference': 'reference', 'Uploader': 'uploader',
    'Polarization': 'polarization',
}

FIELD_MAP_CN = {
    '名称': 'name', '分子式': 'formula', '归一化强度': 'normalized_intensity',
    '有效χ²': 'effective_chi2', '峰位置': 'peak_position', '峰宽度': 'peak_width',
    '振动模式': 'vibrational_mode', '分子基团': 'functional_group',
    '可见入射角': 'vis_angle', '红外入射角': 'ir_angle',
    '实验能量': 'laser_energy', '测试仪器': 'instrument',
    '相关文献': 'reference', '上传者': 'uploader',
    '偏振': 'polarization',
}

ALL_FIELD_MAP = {**FIELD_MAP, **FIELD_MAP_CN}

REVERSE_MAP = {v: k for k, v in FIELD_MAP.items()}


@router.get("/export")
async def export_records():
    records = get_all_records()
    lines = []
    for r in records:
        parts = []
        for cn_key, en_key in FIELD_MAP.items():
            val = r.get(en_key)
            if val is not None and val != '' and val != 'None':
                if isinstance(val, float):
                    if abs(val) < 1e-4 and val != 0:
                        val = f"{val:.4e}"
                    else:
                        val = f"{val:.4f}"
                parts.append(f"{cn_key}:{val}")
        lines.append("{" + ", ".join(parts) + "}")
    return PlainTextResponse("\n".join(lines), headers={
        "Content-Disposition": "attachment; filename=sfg_backup.txt"
    })


@router.post("/import")
async def import_records(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode('utf-8-sig')
    lines = text.strip().split('\n')
    imported = 0
    errors = []

    for i, line in enumerate(lines):
        line = line.strip()
        if not line or line.startswith('#'):
            continue

        m = re.match(r'^\{(.+)\}$', line)
        if not m:
            errors.append(f"Line {i + 1}: invalid dict format")
            continue

        record_data = {}
        raw = m.group(1)
        pairs = re.findall(r'([^,]+?):(.+?)(?=,\s*[^,]+?:|$)', raw.strip() + ',')
        if not pairs:
            # fallback: split by ', ' then by first ':'
            parts = raw.split(', ')
            for part in parts:
                if ':' in part:
                    idx = part.index(':')
                    key_cn = part[:idx].strip()
                    val = part[idx + 1:].strip()
                    en_key = ALL_FIELD_MAP.get(key_cn)
                    if en_key:
                        record_data[en_key] = val

        for key_cn, val in pairs if pairs else []:
            en_key = ALL_FIELD_MAP.get(key_cn.strip())
            if en_key:
                record_data[en_key] = val.strip()

        if 'name' not in record_data and not pairs:
            record_data.clear()
            # second fallback: manual split by key names
            remaining = raw
            for cn_key in ALL_FIELD_MAP:
                if remaining.startswith(cn_key + ':'):
                    remaining = remaining[len(cn_key) + 1:]
                    end = len(remaining)
                    for other_key in ALL_FIELD_MAP:
                        idx = remaining.find(', ' + other_key + ':')
                        if idx != -1 and idx < end:
                            end = idx
                    val_str = remaining[:end].strip().rstrip(',')
                    record_data[ALL_FIELD_MAP[cn_key]] = val_str
                    remaining = remaining[end:]

        if 'name' not in record_data:
            errors.append(f"Line {i + 1}: no name field found")
            continue

        try:
            for num_key in ['normalized_intensity', 'effective_chi2', 'peak_position',
                            'peak_width', 'vis_angle', 'ir_angle']:
                if num_key in record_data:
                    val = record_data[num_key].strip()
                    if val:
                        record_data[num_key] = float(val)
                    else:
                        del record_data[num_key]
        except ValueError:
            errors.append(f"Line {i + 1}: invalid number value")
            continue

        add_record(record_data)
        imported += 1

    return {"imported": imported, "errors": errors}
