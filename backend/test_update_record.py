import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/database"
BOUNDARY = "----TestBoundary123456"


def multipart_patch(url, fields, files=None):
    body = bytearray()
    for key, val in fields.items():
        body.extend(f"--{BOUNDARY}\r\n".encode())
        body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode())
        if isinstance(val, dict):
            body.extend(json.dumps(val).encode())
        else:
            body.extend(str(val).encode())
        body.extend(b"\r\n")

    if files:
        for field_name, (filename, filedata, content_type) in files.items():
            body.extend(f"--{BOUNDARY}\r\n".encode())
            body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode())
            body.extend(f"Content-Type: {content_type}\r\n\r\n".encode())
            body.extend(filedata)
            body.extend(b"\r\n")

    body.extend(f"--{BOUNDARY}--\r\n".encode())
    body = bytes(body)

    req = urllib.request.Request(url, data=body)
    req.add_header("Content-Type", f"multipart/form-data; boundary={BOUNDARY}")
    req.method = "PATCH"
    return req


def test_1_update_record_name():
    print("=" * 60)
    print("TEST 1: PATCH - 更新记录名称")
    print("=" * 60)

    url = f"{BASE_URL}/records/1"
    update_data = {"name": "DMSO-SS-Updated"}

    req = multipart_patch(url, {"data": update_data})

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            print(f"TEST 1: SUCCESS - 名称已更新为: {result.get('name')}")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Error: {e.read().decode()}")
        print("TEST 1: FAILED")


def test_2_update_record_formula():
    print("\n" + "=" * 60)
    print("TEST 2: PATCH - 更新记录化学式")
    print("=" * 60)

    url = f"{BASE_URL}/records/1"
    update_data = {"formula": "C2H6OS"}

    req = multipart_patch(url, {"data": update_data})

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            print(f"TEST 2: SUCCESS - 化学式已更新为: {result.get('formula')}")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Error: {e.read().decode()}")
        print("TEST 2: FAILED")


def test_3_update_record_not_found():
    print("\n" + "=" * 60)
    print("TEST 3: PATCH - 更新不存在的记录 (应该返回 404)")
    print("=" * 60)

    url = f"{BASE_URL}/records/99999"
    update_data = {"name": "NonExistent"}

    req = multipart_patch(url, {"data": update_data})

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            print(f"Response: {result}")
            print("TEST 3: FAILED - 应该返回 404 错误")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Error: {e.read().decode()}")
        if e.code == 404:
            print("TEST 3: SUCCESS - 正确返回 404")
        else:
            print("TEST 3: FAILED - 期望 404，实际返回其他错误码")


def test_4_update_with_image():
    print("\n" + "=" * 60)
    print("TEST 4: PATCH - 更新记录并上传图片")
    print("=" * 60)

    url = f"{BASE_URL}/records/1"
    update_data = {"name": "DMSO-SS-WithImage"}

    img_data = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100

    req = multipart_patch(
        url,
        {"data": update_data},
        {"image": ("test_image.png", img_data, "image/png")}
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode())
            print(f"Status: {resp.status}")
            print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
            img_path = result.get('image_path')
            if img_path:
                print(f"TEST 4: SUCCESS - 图片路径已更新为: {img_path}")
            else:
                print("TEST 4: FAILED - 未获取到图片路径")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Error: {e.read().decode()}")
        print("TEST 4: FAILED")


def test_5_verify_final_state():
    print("\n" + "=" * 60)
    print("TEST 5: GET - 验证记录最终状态")
    print("=" * 60)

    url = f"{BASE_URL}/records"

    try:
        with urllib.request.urlopen(url) as resp:
            result = json.loads(resp.read().decode())
            target = None
            for r in result:
                if r['id'] == 1:
                    target = r
                    break
            if target:
                print(f"Status: {resp.status}")
                print(f"Record id=1: {json.dumps(target, indent=2, ensure_ascii=False)}")
                print("TEST 5: SUCCESS")
            else:
                print("TEST 5: FAILED - 未找到记录 id=1")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(f"Error: {e.read().decode()}")
        print("TEST 5: FAILED")


if __name__ == "__main__":
    test_1_update_record_name()
    test_2_update_record_formula()
    test_3_update_record_not_found()
    test_4_update_with_image()
    test_5_verify_final_state()
    print("\n" + "=" * 60)
    print("所有测试完成!")
