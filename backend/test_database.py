import sys
import os
import json
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.database import init_db, add_record, get_all_records, delete_record, DB_PATH, UPLOAD_DIR


def test_service_functions():
    print("=" * 60)
    print("TEST 1: Service Functions")
    print("=" * 60)

    print("\n[1.1] Initializing database...")
    init_db()
    print(f"  DB path: {DB_PATH}")
    print(f"  Upload dir: {UPLOAD_DIR}")
    print("  PASS: Database initialized successfully.")

    print("\n[1.2] Adding test record...")
    test_data = {
        "name": "测试样品",
        "formula": "C6H6",
        "normalized_intensity": 1.234,
        "effective_chi2": 0.95,
        "peak_position": 3050.5,
        "peak_width": 25.0,
        "vibrational_mode": "stretching",
        "functional_group": "CH",
        "vis_angle": 45.0,
        "ir_angle": 55.0,
        "laser_energy": "3.5 mJ",
        "instrument": "EKSPLA SFG",
        "reference": "Test Reference 2024",
        "image_path": None,
    }
    record_id = add_record(test_data)
    print(f"  Inserted record ID: {record_id}")
    assert record_id is not None and record_id > 0, "FAIL: record_id is invalid"
    print("  PASS: Record added successfully.")

    print("\n[1.3] Getting all records...")
    records = get_all_records()
    print(f"  Total records: {len(records)}")
    assert len(records) >= 1, "FAIL: Expected at least 1 record"
    found = [r for r in records if r["id"] == record_id]
    assert len(found) == 1, "FAIL: Inserted record not found"
    print(f"  Found record: name={found[0]['name']}, formula={found[0]['formula']}")
    print("  PASS: get_all_records works correctly.")

    print("\n[1.4] Deleting test record...")
    result = delete_record(record_id)
    assert result is True, "FAIL: delete_record did not return True"
    print(f"  Deleted record ID: {record_id}")
    records_after = get_all_records()
    found_after = [r for r in records_after if r["id"] == record_id]
    assert len(found_after) == 0, "FAIL: Record still exists after deletion"
    print("  PASS: Record deleted successfully.")

    print("\n" + "=" * 60)
    print("TEST 1: ALL PASSED")
    print("=" * 60)


def test_http_endpoints():
    print("\n\n" + "=" * 60)
    print("TEST 2: HTTP Endpoints")
    print("=" * 60)

    BASE_URL = "http://127.0.0.1:8000/api/database"

    print("\n[2.1] Testing GET /records (before inserting)...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/records")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read().decode())
        initial_count = len(data) if isinstance(data, list) else 0
        print(f"  Initial record count: {initial_count}")
        print("  PASS: GET /records succeeded.")
    except urllib.error.URLError as e:
        print(f"  FAIL: Cannot connect to server. Is uvicorn running? ({e})")
        print("  Skipping HTTP tests. Start server with: uvicorn main:app --reload")
        return
    except Exception as e:
        print(f"  FAIL: {e}")
        return

    print("\n[2.2] Testing POST /records...")
    test_payload = {
        "name": "HTTP测试样品",
        "formula": "H2O",
        "normalized_intensity": 2.5,
        "effective_chi2": 0.8,
        "peak_position": 3400.0,
        "peak_width": 100.0,
        "vibrational_mode": "OH stretch",
        "functional_group": "OH",
        "vis_angle": 60.0,
        "ir_angle": 60.0,
        "laser_energy": "5.0 mJ",
        "instrument": "Test Instrument",
        "reference": "Test Ref",
    }

    boundary = "----TestBoundary2024"
    body_lines = []

    body_lines.append(f"--{boundary}")
    body_lines.append('Content-Disposition: form-data; name="data"')
    body_lines.append("")
    body_lines.append(json.dumps(test_payload))

    body_lines.append(f"--{boundary}--")
    body = "\r\n".join(body_lines).encode("utf-8")

    try:
        req = urllib.request.Request(
            f"{BASE_URL}/records",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=5)
        result = json.loads(resp.read().decode())
        created_id = result.get("id")
        print(f"  Created record ID: {created_id}")
        print(f"  Response: {result}")
        assert created_id is not None, "FAIL: No ID returned"
        print("  PASS: POST /records succeeded.")
    except Exception as e:
        print(f"  FAIL: {e}")
        return

    print("\n[2.3] Testing GET /records (after inserting)...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/records")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read().decode())
        new_count = len(data) if isinstance(data, list) else 0
        print(f"  New record count: {new_count}")
        assert new_count > initial_count, "FAIL: Record count did not increase"
        print("  PASS: GET /records count increased correctly.")
    except Exception as e:
        print(f"  FAIL: {e}")
        return

    print("\n[2.4] Testing DELETE /records/{id}...")
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/records/{created_id}", method="DELETE"
        )
        resp = urllib.request.urlopen(req, timeout=5)
        result = json.loads(resp.read().decode())
        print(f"  Delete response: {result}")
        print("  PASS: DELETE /records/{id} succeeded.")
    except Exception as e:
        print(f"  FAIL: {e}")
        return

    print("\n[2.5] Verifying record was deleted...")
    try:
        req = urllib.request.Request(f"{BASE_URL}/records")
        resp = urllib.request.urlopen(req, timeout=5)
        data = json.loads(resp.read().decode())
        final_count = len(data) if isinstance(data, list) else 0
        print(f"  Final record count: {final_count}")
        assert final_count == initial_count, (
            f"FAIL: Expected {initial_count} records, got {final_count}"
        )
        print("  PASS: Record count returned to initial value.")
    except Exception as e:
        print(f"  FAIL: {e}")
        return

    print("\n" + "=" * 60)
    print("TEST 2: ALL PASSED")
    print("=" * 60)


if __name__ == "__main__":
    test_service_functions()
    test_http_endpoints()
    print("\n\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60)
