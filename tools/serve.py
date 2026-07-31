#!/usr/bin/env python3

import base64
import cgi
import hashlib
import hmac
import json
import mimetypes
import os
import re
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
PORT = 8787
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "spirit2026")

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
}


def json_response(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def read_json(name):
    path = DATA_DIR / name
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(name, payload):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / name
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def create_token():
    exp = int(time.time() * 1000) + 86400000
    sig = hmac.new(ADMIN_PASSWORD.encode(), str(exp).encode(), hashlib.sha256).hexdigest()
    payload = json.dumps({"exp": exp, "sig": sig}).encode("utf-8")
    return base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")


def verify_token(header):
    if not header or not header.startswith("Bearer "):
        return False
    token = header[7:]
    padding = "=" * (-len(token) % 4)
    try:
        payload = json.loads(base64.urlsafe_b64decode(token + padding).decode("utf-8"))
        exp = payload["exp"]
        sig = payload["sig"]
    except (KeyError, ValueError, json.JSONDecodeError):
        return False
    if int(time.time() * 1000) > exp:
        return False
    expected = hmac.new(ADMIN_PASSWORD.encode(), str(exp).encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected)


DATA_URL_PATTERN = re.compile(r"^data:(image/(?:jpeg|jpg|png|webp)|video/(?:mp4|quicktime));base64,(.+)$", re.I)


def extension_for_mime(mime, filename=""):
    mime = (mime or "").lower()
    name = (filename or "").lower()
    if "mp4" in mime or "video" in mime or "quicktime" in mime or name.endswith(".mp4") or name.endswith(".mov"):
        return "mp4"
    if "png" in mime:
        return "png"
    if "webp" in mime:
        return "webp"
    return "jpg"


def write_asset(relative_path, payload):
    normalized = relative_path.lstrip("/")
    file_path = ROOT / normalized
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_bytes(payload)
    return f"/{normalized}"


class SiteHandler(BaseHTTPRequestHandler):
    server_version = "SpiritCreative/1.1"

    def log_message(self, format, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), format % args))

    def read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0:
            return b""
        return self.rfile.read(length)

    def parse_json_body(self):
        raw = self.read_body()
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def handle_api(self, method):
        path = unquote(urlparse(self.path).path)

        if path == "/api/auth" and method == "POST":
            body = self.parse_json_body()
            if body.get("password") != ADMIN_PASSWORD:
                return json_response(self, 401, {"error": "Unauthorized"})
            return json_response(self, 200, {"token": create_token()})

        if path == "/api/upload-chunk" and method == "POST":
            if not verify_token(self.headers.get("Authorization")):
                return json_response(self, 401, {"error": "Unauthorized"})
            body = self.parse_json_body()
            upload_id = str(body.get("uploadId", "")).strip()
            index = int(body.get("index", -1))
            total = int(body.get("total", 0))
            chunk = str(body.get("chunk", ""))
            if not upload_id or index < 0 or total < 1 or index >= total or not chunk:
                return json_response(self, 400, {"error": "Invalid chunk payload"})
            payload = base64.b64decode(chunk)
            filename = f"assets/uploads/.chunks/{upload_id}/{index}.part"
            write_asset(filename, payload)
            return json_response(self, 200, {"ok": True, "index": index})

        if path == "/api/upload-complete" and method == "POST":
            if not verify_token(self.headers.get("Authorization")):
                return json_response(self, 401, {"error": "Unauthorized"})
            body = self.parse_json_body()
            upload_id = str(body.get("uploadId", "")).strip()
            total = int(body.get("total", 0))
            mime = str(body.get("mime", "application/octet-stream"))
            if not upload_id or total < 1:
                return json_response(self, 400, {"error": "Invalid upload payload"})
            parts = []
            for index in range(total):
                part_path = ROOT / f"assets/uploads/.chunks/{upload_id}/{index}.part"
                if not part_path.exists():
                    return json_response(self, 400, {"error": f"Missing upload chunk {index + 1}"})
                parts.append(part_path.read_bytes())
            ext = extension_for_mime(mime)
            filename = f"assets/uploads/{int(time.time() * 1000)}-{os.urandom(4).hex()}.{ext}"
            url = write_asset(filename, b"".join(parts))
            chunk_dir = ROOT / f"assets/uploads/.chunks/{upload_id}"
            if chunk_dir.exists():
                for part_file in chunk_dir.iterdir():
                    part_file.unlink(missing_ok=True)
                chunk_dir.rmdir()
            return json_response(self, 200, {"url": url})

        if path == "/api/upload" and method == "POST":
            if not verify_token(self.headers.get("Authorization")):
                return json_response(self, 401, {"error": "Unauthorized"})

            content_type = self.headers.get("Content-Type", "")
            if "multipart/form-data" in content_type:
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={
                        "REQUEST_METHOD": "POST",
                        "CONTENT_TYPE": content_type,
                        "CONTENT_LENGTH": self.headers.get("Content-Length", "0"),
                    },
                )
                file_item = form["file"] if "file" in form else None
                if not file_item or not getattr(file_item, "file", None):
                    return json_response(self, 400, {"error": "Missing media file"})
                payload = file_item.file.read()
                mime = file_item.type or "image/jpeg"
                filename_field = getattr(file_item, "filename", "") or ""
                ext = extension_for_mime(mime, filename_field)
                filename = f"assets/uploads/{int(time.time() * 1000)}-{os.urandom(4).hex()}.{ext}"
                url = write_asset(filename, payload)
                return json_response(self, 200, {"url": url})

            body = self.parse_json_body()
            match = DATA_URL_PATTERN.match(body.get("dataUrl") or "")
            if not match:
                return json_response(self, 400, {"error": "Invalid media payload"})
            mime = match.group(1).lower()
            ext = extension_for_mime(mime)
            payload = base64.b64decode(match.group(2))
            filename = f"assets/uploads/{int(time.time() * 1000)}-{os.urandom(4).hex()}.{ext}"
            url = write_asset(filename, payload)
            return json_response(self, 200, {"url": url})

        if path == "/api/works":
            if method == "GET":
                data = read_json("works.json") or {"version": 2, "updatedAt": "", "works": []}
                return json_response(self, 200, data)
            if method == "PUT":
                if not verify_token(self.headers.get("Authorization")):
                    return json_response(self, 401, {"error": "Unauthorized"})
                body = self.parse_json_body()
                if body.get("merge") and isinstance(body.get("work"), dict):
                    data = read_json("works.json") or {"version": 2, "updatedAt": "", "works": []}
                    works = list(data.get("works") or [])
                    work = body["work"]
                    index = next((i for i, item in enumerate(works) if item.get("id") == work.get("id")), -1)
                    if index >= 0:
                        works[index] = work
                    else:
                        works.insert(0, work)
                    payload = {
                        "version": 2,
                        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "works": works,
                    }
                elif isinstance(body.get("works"), list):
                    payload = {
                        "version": 2,
                        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "works": body["works"],
                    }
                else:
                    return json_response(self, 400, {"error": "Invalid payload"})
                write_json("works.json", payload)
                return json_response(self, 200, payload)

        if path == "/api/inquiries":
            if method == "GET":
                if not verify_token(self.headers.get("Authorization")):
                    return json_response(self, 401, {"error": "Unauthorized"})
                data = read_json("inquiries.json") or {"version": 2, "inquiries": []}
                return json_response(self, 200, data)

            if method == "POST":
                body = self.parse_json_body()
                if "inquiries" in body and isinstance(body["inquiries"], list):
                    if not verify_token(self.headers.get("Authorization")):
                        return json_response(self, 401, {"error": "Unauthorized"})
                    payload = {
                        "version": 2,
                        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "inquiries": body["inquiries"],
                    }
                    write_json("inquiries.json", payload)
                    return json_response(self, 200, payload)

                inquiry = {
                    "id": body.get("id") or f"inq-{int(time.time() * 1000)}",
                    "fullName": body.get("fullName", ""),
                    "company": body.get("company", ""),
                    "email": body.get("email", ""),
                    "phone": body.get("phone", ""),
                    "projectType": body.get("projectType", ""),
                    "budget": body.get("budget", ""),
                    "message": body.get("message", ""),
                    "createdAt": body.get("createdAt") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "read": False,
                }
                data = read_json("inquiries.json") or {"version": 2, "inquiries": []}
                inquiries = [inquiry] + list(data.get("inquiries", []))
                payload = {
                    "version": 2,
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "inquiries": inquiries,
                }
                write_json("inquiries.json", payload)
                return json_response(self, 201, {"inquiry": inquiry, **payload})

            if method == "PUT":
                if not verify_token(self.headers.get("Authorization")):
                    return json_response(self, 401, {"error": "Unauthorized"})
                body = self.parse_json_body()
                if not isinstance(body.get("inquiries"), list):
                    return json_response(self, 400, {"error": "Invalid payload"})
                payload = {
                    "version": 2,
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "inquiries": body["inquiries"],
                }
                write_json("inquiries.json", payload)
                return json_response(self, 200, payload)

            if method == "PATCH":
                if not verify_token(self.headers.get("Authorization")):
                    return json_response(self, 401, {"error": "Unauthorized"})
                body = self.parse_json_body()
                inquiry_id = body.get("id")
                if not inquiry_id:
                    return json_response(self, 400, {"error": "Missing inquiry id"})
                data = read_json("inquiries.json") or {"version": 2, "inquiries": []}
                inquiries = [
                    {**item, "read": bool(body.get("read"))} if item.get("id") == inquiry_id else item
                    for item in data.get("inquiries", [])
                ]
                payload = {
                    "version": 2,
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "inquiries": inquiries,
                }
                write_json("inquiries.json", payload)
                return json_response(self, 200, payload)

            if method == "DELETE":
                if not verify_token(self.headers.get("Authorization")):
                    return json_response(self, 401, {"error": "Unauthorized"})
                inquiry_id = parse_qs(urlparse(self.path).query).get("id", [None])[0]
                if not inquiry_id:
                    return json_response(self, 400, {"error": "Missing inquiry id"})
                data = read_json("inquiries.json") or {"version": 2, "inquiries": []}
                inquiries = [item for item in data.get("inquiries", []) if item.get("id") != inquiry_id]
                payload = {
                    "version": 2,
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "inquiries": inquiries,
                }
                write_json("inquiries.json", payload)
                return json_response(self, 200, payload)

        self.send_error(404)

    def do_GET(self):
        if unquote(urlparse(self.path).path).startswith("/api/"):
            return self.handle_api("GET")
        self.serve_static()

    def do_POST(self):
        if unquote(urlparse(self.path).path).startswith("/api/"):
            return self.handle_api("POST")
        self.send_error(405)

    def do_PUT(self):
        if unquote(urlparse(self.path).path).startswith("/api/"):
            return self.handle_api("PUT")
        self.send_error(405)

    def do_PATCH(self):
        if unquote(urlparse(self.path).path).startswith("/api/"):
            return self.handle_api("PATCH")
        self.send_error(405)

    def do_DELETE(self):
        if unquote(urlparse(self.path).path).startswith("/api/"):
            return self.handle_api("DELETE")
        self.send_error(405)

    def serve_static(self):
        request_path = unquote(urlparse(self.path).path)
        if request_path == "/":
            request_path = "/index.html"

        file_path = (ROOT / request_path.lstrip("/")).resolve()
        if not str(file_path).startswith(str(ROOT.resolve())):
            self.send_error(403)
            return

        if not file_path.exists() or not file_path.is_file():
            self.send_error(404)
            return

        content_type, _ = mimetypes.guess_type(str(file_path))
        content_type = MIME_TYPES.get(file_path.suffix.lower(), content_type or "application/octet-stream")
        data = file_path.read_bytes()

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        self.wfile.write(data)


def main():
    server = ThreadingHTTPServer(("127.0.0.1", PORT), SiteHandler)
    print(f"The Spirit Creative site running at http://localhost:{PORT}")
    print(f"Admin panel: http://localhost:{PORT}/admin.html")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
