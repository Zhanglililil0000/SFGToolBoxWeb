import sys
import json
import urllib.request
import math

sys.path.insert(0, ".")

from services.sfg_calculator import (
    calculate_quartz_refractive_index,
    calculate_fresnel,
    calculate_refraction_angle,
    calculate_sfg_wavelength,
    calculate_sfg_angle,
    calculate_coherence_length,
)

PASS = 0
FAIL = 0

def test(name, condition):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS: {name}")
    else:
        FAIL += 1
        print(f"  FAIL: {name}")

def test_approx(name, actual, expected, tol=0.05):
    global PASS, FAIL
    if abs(actual - expected) < tol:
        PASS += 1
        print(f"  PASS: {name} (actual={actual:.4f}, expected~{expected:.4f})")
    else:
        FAIL += 1
        print(f"  FAIL: {name} (actual={actual:.4f}, expected~{expected:.4f}, diff={abs(actual-expected):.4f})")


print("=" * 60)
print("Test 1: calculate_quartz_refractive_index")
print("=" * 60)

n532 = calculate_quartz_refractive_index(532)
test_approx("n(532nm) ~1.547", n532, 1.547, 0.02)
print(f"  n(532nm) = {n532:.4f}")

n3300 = calculate_quartz_refractive_index(3300)
print(f"  n(3300nm) = {n3300:.4f}")

n458 = calculate_quartz_refractive_index(458)
print(f"  n(458nm) = {n458:.4f}")


print()
print("=" * 60)
print("Test 2: calculate_fresnel for xx, yy, zz")
print("=" * 60)

n_air = 1.0
n_quartz = calculate_quartz_refractive_index(532)
theta1 = 45.0
theta2 = calculate_refraction_angle(theta1, n_air, n_quartz)

lxx = calculate_fresnel(n_air, n_quartz, theta1, theta2, 'xx')
lyy = calculate_fresnel(n_air, n_quartz, theta1, theta2, 'yy')
lzz = calculate_fresnel(n_air, n_quartz, theta1, theta2, 'zz')

test("Lxx > 0", lxx > 0)
test("Lyy > 0", lyy > 0)
test("Lzz > 0", lzz > 0)
test("Lxx < 2.0", lxx < 2.0)
test("Lyy < 2.0", lyy < 2.0)

print(f"  Lxx(45deg, n_quartz@532) = {lxx:.4f}")
print(f"  Lyy(45deg, n_quartz@532) = {lyy:.4f}")
print(f"  Lzz(45deg, n_quartz@532) = {lzz:.4f}")


print()
print("=" * 60)
print("Test 3: SFG core functions")
print("=" * 60)

sfg_wl = calculate_sfg_wavelength(532, 3000)
test("SFG wavelength > 0", sfg_wl > 0)
print(f"  sfg_wavelength(532nm, 3000cm-1) = {sfg_wl:.2f} nm")

ir_wl = 1e7 / 3000
sfg_ang = calculate_sfg_angle(sfg_wl, 45, 532, 55, ir_wl)
test("SFG angle > 0", sfg_ang > 0)
test("SFG angle < 90", sfg_ang < 90)
print(f"  sfg_angle = {sfg_ang:.2f} deg")

coh = calculate_coherence_length(n458, n532, n3300, sfg_wl, sfg_ang, 532, 45, 55, 3000)
test("Coherence length > 0", coh > 0)
print(f"  coherence_length = {coh:.2f} nm")


print()
print("=" * 60)
print("Test 4: POST /api/calculator/quartz (single mode)")
print("=" * 60)

def post_json(path, data):
    url = f"http://127.0.0.1:8000{path}"
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return None, str(e)

status, result = post_json("/api/calculator/quartz", {
    "vis_angle": 45, "ir_angle": 55,
    "vis_wavelength": 532, "ir_wavenumber": 3000,
    "enable_sweep": False
})

if status == 200 and result:
    test("HTTP 200", True)
    test("sfg_wavelength exists", "sfg_wavelength" in result)
    test("sfg_angle exists", "sfg_angle" in result)
    test("ir_wavelength exists", "ir_wavelength" in result)
    test("n_vis exists", "n_vis" in result)
    test("n_ir exists", "n_ir" in result)
    test("n_sfg exists", "n_sfg" in result)
    test("coherence_length exists", "coherence_length" in result)
    test("lxx_sfg exists", "lxx_sfg" in result)
    test("lyy_sfg exists", "lyy_sfg" in result)
    test("lxx_vis exists", "lxx_vis" in result)
    test("lyy_vis exists", "lyy_vis" in result)
    test("lxx_ir exists", "lxx_ir" in result)
    test("lyy_ir exists", "lyy_ir" in result)
    test("chi2_ssp exists", "chi2_ssp" in result)
    test("chi2_sps exists", "chi2_sps" in result)
    test("chi2_pss exists", "chi2_pss" in result)
    test("chi2_ppp exists", "chi2_ppp" in result)
    test("chi2_ssp_sq exists", "chi2_ssp_sq" in result)
    test("chi2_sps_sq exists", "chi2_sps_sq" in result)
    test("chi2_pss_sq exists", "chi2_pss_sq" in result)
    test("chi2_ppp_sq exists", "chi2_ppp_sq" in result)
    test("vis_ref_angle exists", "vis_ref_angle" in result)
    test("ir_ref_angle exists", "ir_ref_angle" in result)
    test("sfg_ref_angle exists", "sfg_ref_angle" in result)
    print(f"  sfg_wavelength = {result.get('sfg_wavelength', '?'):.2f}")
    print(f"  sfg_angle = {result.get('sfg_angle', '?'):.2f}")
    print(f"  coherence_length = {result.get('coherence_length', '?'):.2f}")
else:
    test("HTTP 200", False)
    print(f"  Error: status={status}, result={result}")


print()
print("=" * 60)
print("Test 5: POST /api/calculator/quartz (sweep mode)")
print("=" * 60)

status, result = post_json("/api/calculator/quartz", {
    "vis_angle": 45, "ir_angle": 55,
    "vis_wavelength": 532, "ir_wavenumber": 3000,
    "enable_sweep": True,
    "sweep_start": 2900, "sweep_end": 3000, "sweep_step": 50
})

if status == 200 and result:
    test("HTTP 200", True)
    test("sweep data exists", "sweep" in result)
    sweep = result["sweep"]
    test("wavenumbers exists", "wavenumbers" in sweep)
    test("ssp exists", "ssp" in sweep)
    test("sps exists", "sps" in sweep)
    test("pss exists", "pss" in sweep)
    test("ppp exists", "ppp" in sweep)
    test("ssp_yyz exists", "ssp_yyz" in sweep)
    test("sps_yzy exists", "sps_yzy" in sweep)
    test("pss_zyy exists", "pss_zyy" in sweep)
    test("ppp_yyz exists", "ppp_yyz" in sweep)
    test("sweep array length >= 2", len(sweep["wavenumbers"]) >= 2)
    print(f"  sweep wavenumbers count: {len(sweep['wavenumbers'])}")
else:
    test("HTTP 200", False)
    print(f"  Error: status={status}, result={result}")


print()
print("=" * 60)
print("Test 6: POST /api/calculator/focus")
print("=" * 60)

status, result = post_json("/api/calculator/focus", {
    "vis_wavelength": 532, "ir_wavelength": 3300, "sfg_wavelength": 458,
    "vis_spot_size": 5, "ir_spot_size": 5,
    "vis_focal": 250, "ir_focal": 150, "sfg_focal": 200,
    "vis_defocus": 15, "ir_defocus": 7, "spectrometer_focal": 100
})

if status == 200 and result:
    test("HTTP 200", True)
    test("vis_focus_diameter exists", "vis_focus_diameter" in result)
    test("ir_focus_diameter exists", "ir_focus_diameter" in result)
    test("vis_focus_depth exists", "vis_focus_depth" in result)
    test("ir_focus_depth exists", "ir_focus_depth" in result)
    test("vis_spot_diameter exists", "vis_spot_diameter" in result)
    test("ir_spot_diameter exists", "ir_spot_diameter" in result)
    test("sfg_spot_diameter exists", "sfg_spot_diameter" in result)
    test("slit_spot_size exists", "slit_spot_size" in result)
    test("vis_focus_diameter > 0", result["vis_focus_diameter"] > 0)
    test("ir_focus_diameter > 0", result["ir_focus_diameter"] > 0)
    print(f"  vis_focus_diameter = {result.get('vis_focus_diameter', '?'):.4f} um")
    print(f"  ir_focus_diameter = {result.get('ir_focus_diameter', '?'):.4f} um")
    print(f"  sfg_spot_diameter = {result.get('sfg_spot_diameter', '?'):.4f} mm")
else:
    test("HTTP 200", False)
    print(f"  Error: status={status}, result={result}")


print()
print("=" * 60)
print("Test 7: POST /api/calculator/fresnel")
print("=" * 60)

status, result = post_json("/api/calculator/fresnel", {
    "n_sfg": 1.4727, "n_vis": 1.4727, "n_ir": 1.47,
    "vis_angle": 45, "ir_angle": 55,
    "vis_wavelength": 532.1, "ir_wavenumber": 2900
})

if status == 200 and result:
    test("HTTP 200", True)
    test("coherence_length exists", "coherence_length" in result)
    test("sfg_lxx exists", "sfg_lxx" in result)
    test("sfg_lyy exists", "sfg_lyy" in result)
    test("sfg_lzz exists", "sfg_lzz" in result)
    test("vis_lxx exists", "vis_lxx" in result)
    test("vis_lyy exists", "vis_lyy" in result)
    test("vis_lzz exists", "vis_lzz" in result)
    test("ir_lxx exists", "ir_lxx" in result)
    test("ir_lyy exists", "ir_lyy" in result)
    test("ir_lzz exists", "ir_lzz" in result)
    test("ssp_yyz exists", "ssp_yyz" in result)
    test("sps_yzy exists", "sps_yzy" in result)
    test("pss_zyy exists", "pss_zyy" in result)
    test("ppp_zxx exists", "ppp_zxx" in result)
    test("ppp_xxz exists", "ppp_xxz" in result)
    test("ppp_xzx exists", "ppp_xzx" in result)
    test("ppp_zzz exists", "ppp_zzz" in result)
    test("psp_zyx exists", "psp_zyx" in result)
    test("psp_xyz exists", "psp_xyz" in result)
    test("spp_yzx exists", "spp_yzx" in result)
    test("spp_yxz exists", "spp_yxz" in result)
    test("pps_zxy exists", "pps_zxy" in result)
    test("pps_xzy exists", "pps_xzy" in result)
    print(f"  coherence_length = {result.get('coherence_length', '?'):.4f}")
    print(f"  sfg_lxx = {result.get('sfg_lxx', '?'):.4f}")
    print(f"  ssp_yyz = {result.get('ssp_yyz', '?'):.4f}")
    print(f"  psp_zyx = {result.get('psp_zyx', '?'):.4f}")
else:
    test("HTTP 200", False)
    print(f"  Error: status={status}, result={result}")


print()
print("=" * 60)
print(f"RESULTS: {PASS} PASS, {FAIL} FAIL out of {PASS + FAIL} tests")
print("=" * 60)

if FAIL > 0:
    print("SOME TESTS FAILED!")
    sys.exit(1)
else:
    print("ALL TESTS PASSED!")
    sys.exit(0)
