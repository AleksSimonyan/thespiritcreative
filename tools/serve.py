#!/usr/bin/env python3

import base64
import hashlib
import hmac
import json
import mimetypes
import os
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

        if path == "/api/works":
            if method == "GET":
                data = read_json("works.json") or {"version": 2, "updatedAt": "", "works": []}
                return json_response(self, 200, data)
            if method == "PUT":
                if not verify_token(self.headers.get("Authorization")):
                    return json_response(self, 401, {"error": "Unauthorized"})
                body = self.parse_json_body()
                if not isinstance(body.get("works"), list):
                    return json_response(self, 400, {"error": "Invalid payload"})
                payload = {
                    "version": 2,
                    "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "works": body["works"],
                }
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
