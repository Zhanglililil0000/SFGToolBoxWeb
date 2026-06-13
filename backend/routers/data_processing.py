from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import io

from services.spike_remove import remove_spikes

router = APIRouter(prefix="/api/data-processing", tags=["data-processing"])


class ProcessRequest(BaseModel):
    sample_signal: str
    sample_background: str
    quartz_signal: str
    quartz_background: str
    visible_wavelength: float
    sample_exposure_time: float
    quartz_exposure_time: float
    data_name: str
    remove_spikes: bool
    window_size: int = 15
    threshold_mult: int = 3


def _parse_csv(csv_str: str):
    f = io.StringIO(csv_str)
    first_line = f.readline().strip()
    f.seek(0)

    skiprows = 0
    if first_line:
        try:
            float(first_line.split(',')[0].strip())
        except (ValueError, IndexError):
            skiprows = 1

    try:
        data = np.loadtxt(f, delimiter=',', skiprows=skiprows)
    except Exception:
        raise HTTPException(status_code=400, detail="CSV解析失败，请检查数据格式")

    if data.ndim != 2 or data.shape[1] < 2:
        raise HTTPException(status_code=400, detail="CSV需要至少两列数据（波长 和 强度）")

    return data


@router.get("/")
async def data_processing_info():
    return {"name": "SFG数据处理", "status": "active"}


@router.post("/process")
async def process_data(request: ProcessRequest):
    try:
        ss = _parse_csv(request.sample_signal)
        sb = _parse_csv(request.sample_background)
        qs = _parse_csv(request.quartz_signal)
        qb = _parse_csv(request.quartz_background)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV解析失败: {str(e)}")

    n = len(ss)
    if not (len(sb) == n and len(qs) == n and len(qb) == n):
        raise HTTPException(status_code=400, detail="所有数据长度必须一致")

    ss_intensity = ss[:, 1].copy()
    sb_intensity = sb[:, 1].copy()
    qs_intensity = qs[:, 1].copy()
    qb_intensity = qb[:, 1].copy()
    quartz_wavelength = qs[:, 0].copy()

    if request.remove_spikes:
        ss_intensity = remove_spikes(ss_intensity, request.window_size, request.threshold_mult)
        sb_intensity = remove_spikes(sb_intensity, request.window_size, request.threshold_mult)
        qs_intensity = remove_spikes(qs_intensity, request.window_size, request.threshold_mult)
        qb_intensity = remove_spikes(qb_intensity, request.window_size, request.threshold_mult)

    Ts = request.sample_exposure_time
    Tq = request.quartz_exposure_time

    numerator = (ss_intensity - sb_intensity) / Ts
    denominator = (qs_intensity - qb_intensity) / Tq
    denominator_safe = np.where(denominator == 0, np.nan, denominator)
    Y = numerator / denominator_safe

    lambda_vis = request.visible_wavelength
    wavenumber = (1.0 / quartz_wavelength - 1.0 / lambda_vis) * 1e7

    return {
        "wavenumber": wavenumber.tolist(),
        "intensity": Y.tolist(),
        "name": request.data_name,
    }
