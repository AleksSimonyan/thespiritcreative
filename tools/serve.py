#!/usr/bin/env python3

import mimetypes
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent.parent
PORT = 8787

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


class SiteHandler(BaseHTTPRequestHandler):
    server_version = "SpiritCreative/1.0"

    def log_message(self, format, *args):
        sys.stdout.write("%s - %s\n" % (self.address_string(), format % args))

    def do_GET(self):
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
