import sys
import os
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.spike_remove import remove_spikes

np.random.seed(42)

x = np.linspace(0, 10, 100)
base_signal = np.sin(x) * 10 + 50

intensity = base_signal.copy()
intensity[20] = 200
intensity[70] = 180

spike_indices = [20, 70]

print("=== Spike Removal Test ===")
print(f"Input length: {len(intensity)}")
print(f"Original intensity (first 10): {intensity[:10]}")
print(f"Spike at index 20: {intensity[20]} (base was ~{base_signal[20]:.2f})")
print(f"Spike at index 70: {intensity[70]} (base was ~{base_signal[70]:.2f})")

cleaned = remove_spikes(intensity, window_size=15, threshold_mult=3)

print(f"\nOutput length: {len(cleaned)}")
print(f"Cleaned intensity (first 10): {cleaned[:10]}")
print(f"Cleaned index 20: {cleaned[20]:.4f} (expected ~{base_signal[20]:.4f})")
print(f"Cleaned index 70: {cleaned[70]:.4f} (expected ~{base_signal[70]:.4f})")

error_20 = abs(cleaned[20] - base_signal[20])
error_70 = abs(cleaned[70] - base_signal[70])

print(f"\nAbsolute errors: [{error_20:.4f}, {error_70:.4f}]")

if error_20 < 10 and error_70 < 10:
    print("\n*** TEST PASSED: Spikes were successfully removed! ***")
else:
    print("\n*** TEST FAILED: Spikes were not removed properly! ***")
