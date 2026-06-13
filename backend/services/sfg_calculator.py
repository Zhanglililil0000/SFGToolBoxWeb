import math

def calculate_quartz_refractive_index(wavelength_nm):
    wavelength_um = wavelength_nm / 1000.0
    n_squared = 1.28604141 + \
                1.07044083 * wavelength_um**2 / (wavelength_um**2 - 0.0100585997) + \
                1.10202242 * wavelength_um**2 / (wavelength_um**2 - 100)
    return math.sqrt(n_squared)

def calculate_refraction_angle(incident_angle_deg, n1, n2):
    return math.degrees(math.asin(n1 * math.sin(math.radians(incident_angle_deg)) / n2))

def calculate_fresnel(n1, n2, theta1_deg, theta2_deg, polarization):
    theta1_rad = math.radians(theta1_deg)
    theta2_rad = math.radians(theta2_deg)
    cos_theta1 = math.cos(theta1_rad)
    cos_theta2 = math.cos(theta2_rad)

    n_prime = math.sqrt((n2**2 * (n2**2 + 5)) / (4 * n2**2 + 2))

    if polarization == 'xx':
        numerator = 2 * n1 * cos_theta2
        denominator = n1 * cos_theta2 + n2 * cos_theta1
        return numerator / denominator
    elif polarization == 'yy':
        numerator = 2 * n1 * cos_theta1
        denominator = n1 * cos_theta1 + n2 * cos_theta2
        return numerator / denominator
    elif polarization == 'zz':
        numerator = 2 * n2 * cos_theta1
        denominator = n1 * cos_theta2 + n2 * cos_theta1
        return (numerator / denominator) * (n1 / n_prime) ** 2
    else:
        return 0.0

def calculate_sfg_wavelength(vis_wavelength, ir_wavenumber):
    ir_wavelength = 1e7 / ir_wavenumber
    return 1.0 / (1.0 / vis_wavelength + 1.0 / ir_wavelength)

def calculate_sfg_angle(sfg_wavelength, vis_angle_deg, vis_wavelength, ir_angle_deg, ir_wavelength):
    return math.degrees(math.asin(
        sfg_wavelength * (math.sin(math.radians(vis_angle_deg)) / vis_wavelength +
                          math.sin(math.radians(ir_angle_deg)) / ir_wavelength)
    ))

def calculate_coherence_length(n_sfg, n_vis, n_ir, sfg_wavelength, sfg_angle_deg, vis_wavelength, vis_angle_deg, ir_angle_deg, ir_wavenumber):
    ir_wavelength = 1e7 / ir_wavenumber
    sfg_angle_rad = math.radians(sfg_angle_deg)
    vis_angle_rad = math.radians(vis_angle_deg)
    ir_angle_rad = math.radians(ir_angle_deg)

    sfg_term = math.sqrt(n_sfg**2 - math.sin(sfg_angle_rad)**2) / sfg_wavelength
    vis_term = math.sqrt(n_vis**2 - math.sin(vis_angle_rad)**2) / vis_wavelength
    ir_term = math.sqrt(n_ir**2 - math.sin(ir_angle_rad)**2) / ir_wavelength

    return 1.0 / (2 * math.pi * (sfg_term + vis_term + ir_term))
