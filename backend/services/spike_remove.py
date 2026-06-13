import numpy as np
from scipy.interpolate import interp1d


def remove_spikes(intensity, window_size=15, threshold_mult=3):
    n = len(intensity)
    is_outlier = np.zeros(n, dtype=bool)

    for i in range(n):
        start = max(0, i - window_size // 2)
        end = min(n, i + window_size // 2 + 1)

        window_data = np.concatenate([intensity[start:i], intensity[i + 1:end]])

        if len(window_data) > 0:
            window_median = np.median(window_data)
            window_mad = np.median(np.abs(window_data - window_median))

            threshold = window_median + threshold_mult * 1.4826 * window_mad
            if intensity[i] > threshold:
                is_outlier[i] = True

    x = np.arange(n)
    f = interp1d(x[~is_outlier], intensity[~is_outlier],
                 kind='linear', fill_value='extrapolate')
    intensity[is_outlier] = f(x[is_outlier])

    return intensity
