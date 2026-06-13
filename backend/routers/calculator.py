import math
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.sfg_calculator import (
    calculate_quartz_refractive_index,
    calculate_refraction_angle,
    calculate_fresnel,
    calculate_sfg_wavelength,
    calculate_sfg_angle,
    calculate_coherence_length,
)

router = APIRouter(prefix="/api/calculator", tags=["calculator"])


class QuartzRequest(BaseModel):
    vis_angle: float = 45
    ir_angle: float = 55
    vis_wavelength: float = 532
    ir_wavenumber: float = 3000
    enable_sweep: bool = False
    sweep_start: float = 2800
    sweep_end: float = 3200
    sweep_step: float = 10


class FocusRequest(BaseModel):
    vis_wavelength: float
    ir_wavelength: float
    sfg_wavelength: float
    vis_spot_size: float
    ir_spot_size: float
    vis_focal: float
    ir_focal: float
    sfg_focal: float
    vis_defocus: float
    ir_defocus: float
    spectrometer_focal: float


class FresnelRequest(BaseModel):
    n_sfg: float
    n_vis: float
    n_ir: float
    vis_angle: float
    ir_angle: float
    vis_wavelength: float
    ir_wavenumber: float


def _compute_quartz_single(vis_angle, ir_angle, vis_wavelength, ir_wavenumber):
    n_air = 1.0

    ir_wavelength = 1e7 / ir_wavenumber
    sfg_wavelength = calculate_sfg_wavelength(vis_wavelength, ir_wavenumber)

    n_vis = calculate_quartz_refractive_index(vis_wavelength)
    n_ir = calculate_quartz_refractive_index(ir_wavelength)
    n_sfg = calculate_quartz_refractive_index(sfg_wavelength)

    vis_ref_angle = calculate_refraction_angle(vis_angle, n_air, n_vis)
    ir_ref_angle = calculate_refraction_angle(ir_angle, n_air, n_ir)
    sfg_angle = calculate_sfg_angle(sfg_wavelength, vis_angle, vis_wavelength, ir_angle, ir_wavelength)
    sfg_ref_angle = calculate_refraction_angle(sfg_angle, n_air, n_sfg)

    coherence_length = calculate_coherence_length(
        n_sfg, n_vis, n_ir, sfg_wavelength, sfg_angle, vis_wavelength, vis_angle, ir_angle, ir_wavenumber
    )

    lxx_sfg = calculate_fresnel(n_air, n_sfg, sfg_angle, sfg_ref_angle, 'xx')
    lyy_sfg = calculate_fresnel(n_air, n_sfg, sfg_angle, sfg_ref_angle, 'yy')
    lzz_sfg = calculate_fresnel(n_air, n_sfg, sfg_angle, sfg_ref_angle, 'zz')
    lxx_vis = calculate_fresnel(n_air, n_vis, vis_angle, vis_ref_angle, 'xx')
    lyy_vis = calculate_fresnel(n_air, n_vis, vis_angle, vis_ref_angle, 'yy')
    lzz_vis = calculate_fresnel(n_air, n_vis, vis_angle, vis_ref_angle, 'zz')
    lxx_ir = calculate_fresnel(n_air, n_ir, ir_angle, ir_ref_angle, 'xx')
    lyy_ir = calculate_fresnel(n_air, n_ir, ir_angle, ir_ref_angle, 'yy')
    lzz_ir = calculate_fresnel(n_air, n_ir, ir_angle, ir_ref_angle, 'zz')

    vis_angle_rad = math.radians(vis_angle)
    ir_angle_rad = math.radians(ir_angle)
    sfg_angle_rad = math.radians(sfg_angle)

    chi2_ssp = math.cos(ir_angle_rad) * lyy_sfg * lyy_vis * lzz_ir * coherence_length * 1e-9 * 1.6e-12
    chi2_ppp = math.cos(sfg_angle_rad) * math.cos(vis_angle_rad) * math.cos(ir_angle_rad) * \
        lxx_sfg * lxx_vis * lxx_ir * coherence_length * 1.6e-21
    chi2_sps = math.cos(vis_angle_rad) * lyy_sfg * lzz_vis * lyy_ir * coherence_length * 1.6e-21
    chi2_pss = math.cos(ir_angle_rad) * lzz_sfg * lyy_vis * lyy_ir * coherence_length * 1.6e-21

    return {
        "sfg_wavelength": sfg_wavelength,
        "sfg_angle": sfg_angle,
        "ir_wavelength": ir_wavelength,
        "n_vis": n_vis,
        "n_ir": n_ir,
        "n_sfg": n_sfg,
        "vis_ref_angle": vis_ref_angle,
        "ir_ref_angle": ir_ref_angle,
        "sfg_ref_angle": sfg_ref_angle,
        "coherence_length": coherence_length,
        "lxx_sfg": lxx_sfg,
        "lyy_sfg": lyy_sfg,
        "lxx_vis": lxx_vis,
        "lyy_vis": lyy_vis,
        "lxx_ir": lxx_ir,
        "lyy_ir": lyy_ir,
        "chi2_ssp": chi2_ssp,
        "chi2_sps": chi2_sps,
        "chi2_pss": chi2_pss,
        "chi2_ppp": chi2_ppp,
        "chi2_ssp_sq": abs(chi2_ssp) ** 2,
        "chi2_sps_sq": abs(chi2_sps) ** 2,
        "chi2_pss_sq": abs(chi2_pss) ** 2,
        "chi2_ppp_sq": abs(chi2_ppp) ** 2,
    }


@router.post("/quartz")
async def quartz_calculate(req: QuartzRequest):
    result = _compute_quartz_single(req.vis_angle, req.ir_angle, req.vis_wavelength, req.ir_wavenumber)

    if req.enable_sweep:
        n_air = 1.0
        vis_angle = req.vis_angle
        ir_angle = req.ir_angle
        vis_wavelength = req.vis_wavelength

        wavenumbers = []
        lxx_sfg_arr = []
        lyy_sfg_arr = []
        lxx_vis_arr = []
        lyy_vis_arr = []
        lxx_ir_arr = []
        lyy_ir_arr = []
        ssp_yyz_arr = []
        sps_yzy_arr = []
        pss_zyy_arr = []
        ppp_yyz_arr = []
        ssp_arr = []
        sps_arr = []
        pss_arr = []
        ppp_arr = []
        ssp_sq_arr = []
        sps_sq_arr = []
        pss_sq_arr = []
        ppp_sq_arr = []

        w = req.sweep_start
        while w <= req.sweep_end + 1e-9:
            ir_wavelength = 1e7 / w
            sfg_wavelength = 1.0 / (1.0 / vis_wavelength + 1.0 / ir_wavelength)

            n_vis_q = calculate_quartz_refractive_index(vis_wavelength)
            n_ir_q = calculate_quartz_refractive_index(ir_wavelength)
            n_sfg_q = calculate_quartz_refractive_index(sfg_wavelength)

            vis_ref_angle = calculate_refraction_angle(vis_angle, n_air, n_vis_q)
            ir_ref_angle = calculate_refraction_angle(ir_angle, n_air, n_ir_q)
            sfg_angle = calculate_sfg_angle(sfg_wavelength, vis_angle, vis_wavelength, ir_angle, ir_wavelength)
            sfg_ref_angle = calculate_refraction_angle(sfg_angle, n_air, n_sfg_q)

            lx_sfg = calculate_fresnel(n_air, n_sfg_q, sfg_angle, sfg_ref_angle, 'xx')
            ly_sfg = calculate_fresnel(n_air, n_sfg_q, sfg_angle, sfg_ref_angle, 'yy')
            lz_sfg = calculate_fresnel(n_air, n_sfg_q, sfg_angle, sfg_ref_angle, 'zz')
            lx_vis = calculate_fresnel(n_air, n_vis_q, vis_angle, vis_ref_angle, 'xx')
            ly_vis = calculate_fresnel(n_air, n_vis_q, vis_angle, vis_ref_angle, 'yy')
            lz_vis = calculate_fresnel(n_air, n_vis_q, vis_angle, vis_ref_angle, 'zz')
            lx_ir = calculate_fresnel(n_air, n_ir_q, ir_angle, ir_ref_angle, 'xx')
            ly_ir = calculate_fresnel(n_air, n_ir_q, ir_angle, ir_ref_angle, 'yy')
            lz_ir = calculate_fresnel(n_air, n_ir_q, ir_angle, ir_ref_angle, 'zz')

            coherence_len = calculate_coherence_length(
                n_sfg_q, n_vis_q, n_ir_q, sfg_wavelength, sfg_angle, vis_wavelength, vis_angle, ir_angle, w
            )

            vis_angle_rad = math.radians(vis_angle)
            ir_angle_rad = math.radians(ir_angle)
            sfg_angle_rad = math.radians(sfg_angle)

            ssp_yyz = ly_sfg * ly_vis * lz_ir * math.sin(ir_angle_rad)
            sps_yzy = ly_sfg * lz_vis * ly_ir * math.sin(vis_angle_rad)
            pss_zyy = lz_sfg * ly_vis * ly_ir * math.sin(sfg_angle_rad)
            ppp_yyz = lz_sfg * lz_vis * lz_ir * math.sin(sfg_angle_rad) * math.sin(vis_angle_rad) * math.sin(ir_angle_rad)

            chi2_ssp_val = math.cos(ir_angle_rad) * ly_sfg * ly_vis * lz_ir * coherence_len * 1e-9 * 1.6e-12
            chi2_ppp_val = math.cos(sfg_angle_rad) * math.cos(vis_angle_rad) * math.cos(ir_angle_rad) * \
                lx_sfg * lx_vis * lx_ir * coherence_len * 1.6e-21
            chi2_sps_val = math.cos(vis_angle_rad) * ly_sfg * lz_vis * ly_ir * coherence_len * 1.6e-21
            chi2_pss_val = math.cos(ir_angle_rad) * lz_sfg * ly_vis * ly_ir * coherence_len * 1.6e-21

            wavenumbers.append(w)
            lxx_sfg_arr.append(lx_sfg)
            lyy_sfg_arr.append(ly_sfg)
            lxx_vis_arr.append(lx_vis)
            lyy_vis_arr.append(ly_vis)
            lxx_ir_arr.append(lx_ir)
            lyy_ir_arr.append(ly_ir)
            ssp_yyz_arr.append(ssp_yyz)
            sps_yzy_arr.append(sps_yzy)
            pss_zyy_arr.append(pss_zyy)
            ppp_yyz_arr.append(ppp_yyz)
            ssp_arr.append(chi2_ssp_val)
            sps_arr.append(chi2_sps_val)
            pss_arr.append(chi2_pss_val)
            ppp_arr.append(chi2_ppp_val)
            ssp_sq_arr.append(abs(chi2_ssp_val) ** 2)
            sps_sq_arr.append(abs(chi2_sps_val) ** 2)
            pss_sq_arr.append(abs(chi2_pss_val) ** 2)
            ppp_sq_arr.append(abs(chi2_ppp_val) ** 2)

            w += req.sweep_step

        result["sweep"] = {
            "wavenumbers": wavenumbers,
            "lxx_sfg": lxx_sfg_arr,
            "lyy_sfg": lyy_sfg_arr,
            "lxx_vis": lxx_vis_arr,
            "lyy_vis": lyy_vis_arr,
            "lxx_ir": lxx_ir_arr,
            "lyy_ir": lyy_ir_arr,
            "ssp_yyz": ssp_yyz_arr,
            "sps_yzy": sps_yzy_arr,
            "pss_zyy": pss_zyy_arr,
            "ppp_yyz": ppp_yyz_arr,
            "ssp": ssp_arr,
            "sps": sps_arr,
            "pss": pss_arr,
            "ppp": ppp_arr,
            "ssp_sq": ssp_sq_arr,
            "sps_sq": sps_sq_arr,
            "pss_sq": pss_sq_arr,
            "ppp_sq": ppp_sq_arr,
        }

    return result


@router.post("/focus")
async def focus_calculate(req: FocusRequest):
    vis_focus_diameter = (4 * req.vis_focal * req.vis_wavelength * 1e-3) / (math.pi * req.vis_spot_size)
    ir_focus_diameter = (4 * req.ir_focal * req.ir_wavelength * 1e-3) / (math.pi * req.ir_spot_size)

    vis_focus_depth = (2 * math.pi * (vis_focus_diameter * 1e-3 / 2) ** 2) / (req.vis_wavelength * 1e-6)
    ir_focus_depth = (2 * math.pi * (ir_focus_diameter * 1e-3 / 2) ** 2) / (req.ir_wavelength * 1e-6)

    vis_spot_diameter = vis_focus_diameter * math.sqrt(1 + (req.vis_defocus / (vis_focus_depth / 2)) ** 2)
    ir_spot_diameter = ir_focus_diameter * math.sqrt(1 + (req.ir_defocus / (ir_focus_depth / 2)) ** 2)

    sfg_spot_diameter = req.vis_spot_size * (req.sfg_focal / req.vis_focal)
    slit_spot_size = (4 * req.spectrometer_focal * req.sfg_wavelength) / (math.pi * sfg_spot_diameter) * 1e-3

    return {
        "vis_focus_diameter": vis_focus_diameter,
        "ir_focus_diameter": ir_focus_diameter,
        "vis_focus_depth": vis_focus_depth,
        "ir_focus_depth": ir_focus_depth,
        "vis_spot_diameter": vis_spot_diameter,
        "ir_spot_diameter": ir_spot_diameter,
        "sfg_spot_diameter": sfg_spot_diameter,
        "slit_spot_size": slit_spot_size,
    }


@router.post("/fresnel")
async def fresnel_calculate(req: FresnelRequest):
    n_air = 1.0

    ir_wavelength = 1e7 / req.ir_wavenumber
    sfg_wavelength = 1.0 / (1.0 / req.vis_wavelength + 1.0 / ir_wavelength)

    sfg_angle = calculate_sfg_angle(sfg_wavelength, req.vis_angle, req.vis_wavelength, req.ir_angle, ir_wavelength)

    n_quartz_vis = calculate_quartz_refractive_index(req.vis_wavelength)
    n_quartz_ir = calculate_quartz_refractive_index(ir_wavelength)
    n_quartz_sfg = calculate_quartz_refractive_index(sfg_wavelength)

    vis_ref_angle = calculate_refraction_angle(req.vis_angle, n_air, n_quartz_vis)
    ir_ref_angle = calculate_refraction_angle(req.ir_angle, n_air, n_quartz_ir)
    sfg_ref_angle = calculate_refraction_angle(sfg_angle, n_air, n_quartz_sfg)

    sfg_lxx = calculate_fresnel(n_air, req.n_sfg, sfg_angle, sfg_ref_angle, 'xx')
    sfg_lyy = calculate_fresnel(n_air, req.n_sfg, sfg_angle, sfg_ref_angle, 'yy')
    sfg_lzz = calculate_fresnel(n_air, req.n_sfg, sfg_angle, sfg_ref_angle, 'zz')
    vis_lxx = calculate_fresnel(n_air, req.n_vis, req.vis_angle, vis_ref_angle, 'xx')
    vis_lyy = calculate_fresnel(n_air, req.n_vis, req.vis_angle, vis_ref_angle, 'yy')
    vis_lzz = calculate_fresnel(n_air, req.n_vis, req.vis_angle, vis_ref_angle, 'zz')
    ir_lxx = calculate_fresnel(n_air, req.n_ir, req.ir_angle, ir_ref_angle, 'xx')
    ir_lyy = calculate_fresnel(n_air, req.n_ir, req.ir_angle, ir_ref_angle, 'yy')
    ir_lzz = calculate_fresnel(n_air, req.n_ir, req.ir_angle, ir_ref_angle, 'zz')

    coherence_length = calculate_coherence_length(
        req.n_sfg, req.n_vis, req.n_ir, sfg_wavelength, sfg_angle,
        req.vis_wavelength, req.vis_angle, req.ir_angle, req.ir_wavenumber
    )

    vis_angle_rad = math.radians(req.vis_angle)
    ir_angle_rad = math.radians(req.ir_angle)
    sfg_angle_rad = math.radians(sfg_angle)

    ssp_yyz = sfg_lyy * vis_lyy * ir_lzz * math.sin(ir_angle_rad)
    sps_yzy = sfg_lyy * vis_lzz * ir_lyy * math.sin(vis_angle_rad)
    pss_zyy = sfg_lzz * vis_lyy * ir_lyy * math.sin(sfg_angle_rad)
    ppp_zxx = sfg_lzz * vis_lxx * ir_lxx * math.sin(sfg_angle_rad) * math.cos(vis_angle_rad) * math.cos(ir_angle_rad)
    ppp_xxz = sfg_lxx * vis_lxx * ir_lzz * math.cos(sfg_angle_rad) * math.cos(vis_angle_rad) * math.sin(ir_angle_rad)
    ppp_xzx = sfg_lxx * vis_lzz * ir_lxx * math.cos(sfg_angle_rad) * math.sin(vis_angle_rad) * math.cos(ir_angle_rad)
    ppp_zzz = sfg_lzz * vis_lzz * ir_lzz * math.sin(sfg_angle_rad) * math.sin(vis_angle_rad) * math.sin(ir_angle_rad)

    psp_zyx = sfg_lzz * vis_lyy * ir_lxx * math.sin(sfg_angle_rad) * math.cos(ir_angle_rad)
    psp_xyz = sfg_lxx * vis_lyy * ir_lzz * math.cos(sfg_angle_rad) * math.sin(ir_angle_rad)
    spp_yzx = sfg_lyy * vis_lzz * ir_lxx * math.sin(vis_angle_rad) * math.cos(ir_angle_rad)
    spp_yxz = sfg_lyy * vis_lxx * ir_lzz * math.cos(vis_angle_rad) * math.sin(ir_angle_rad)
    pps_zxy = sfg_lzz * vis_lxx * ir_lyy * math.sin(sfg_angle_rad) * math.cos(vis_angle_rad)
    pps_xzy = sfg_lxx * vis_lzz * ir_lyy * math.cos(sfg_angle_rad) * math.sin(vis_angle_rad)

    return {
        "coherence_length": coherence_length,
        "sfg_lxx": sfg_lxx,
        "sfg_lyy": sfg_lyy,
        "sfg_lzz": sfg_lzz,
        "vis_lxx": vis_lxx,
        "vis_lyy": vis_lyy,
        "vis_lzz": vis_lzz,
        "ir_lxx": ir_lxx,
        "ir_lyy": ir_lyy,
        "ir_lzz": ir_lzz,
        "ssp_yyz": ssp_yyz,
        "sps_yzy": sps_yzy,
        "pss_zyy": pss_zyy,
        "ppp_zxx": ppp_zxx,
        "ppp_xxz": ppp_xxz,
        "ppp_xzx": ppp_xzx,
        "ppp_zzz": ppp_zzz,
        "psp_zyx": psp_zyx,
        "psp_xyz": psp_xyz,
        "spp_yzx": spp_yzx,
        "spp_yxz": spp_yxz,
        "pps_zxy": pps_zxy,
        "pps_xzy": pps_xzy,
    }
