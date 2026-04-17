from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
import os
from pathlib import Path
from urllib.parse import urlparse


HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
ROOT = Path(__file__).resolve().parent


HTML = """<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>5G NR Uplink Protocol Stack Explorer</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #14212f;
      --muted: #5f6f82;
      --line: #d8e0ea;
      --blue: #245fd6;
      --green: #11865a;
      --purple: #6b43bd;
      --orange: #c86414;
      --red: #d94242;
      --yellow: #d9991d;
      font-family: "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,251,0.98)),
        radial-gradient(circle at 18% 12%, rgba(36,95,214,0.10), transparent 30%),
        radial-gradient(circle at 82% 80%, rgba(17,134,90,0.10), transparent 26%);
    }

    button, input, select { font: inherit; }

    .app-shell {
      width: min(1720px, 100%);
      min-height: 100vh;
      margin: 0 auto;
      padding: 24px clamp(14px, 3vw, 42px) 34px;
    }

    .loading,
    .error {
      min-height: 80vh;
      display: grid;
      place-items: center;
      padding: 24px;
      text-align: center;
      font-size: 21px;
      font-weight: 900;
      color: var(--muted);
    }

    .error {
      color: var(--red);
    }

    .vis-panel {
      display: grid;
      gap: 16px;
      color: var(--ink);
    }

    .vis-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      padding: 16px;
      box-shadow: 0 8px 22px rgba(20,33,47,0.06);
    }

    .vis-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .vis-button {
      border: 1px solid #cad5e3;
      border-radius: 8px;
      background: #fff;
      color: var(--ink);
      min-height: 42px;
      padding: 9px 13px;
      cursor: pointer;
      font-weight: 900;
    }

    .vis-button.primary { background: var(--blue); border-color: var(--blue); color: #fff; }
    .vis-button.green { background: var(--green); border-color: var(--green); color: #fff; }
    .vis-button.red { background: var(--red); border-color: var(--red); color: #fff; }
    .vis-button.orange { background: var(--orange); border-color: var(--orange); color: #fff; }

    .bit,
    .packet-chip {
      display: inline-grid;
      place-items: center;
      min-width: 34px;
      min-height: 34px;
      padding: 6px 9px;
      border-radius: 7px;
      background: #e9eef6;
      color: #172536;
      font-weight: 900;
      border: 1px solid #d4deea;
    }

    .packet-chip {
      min-width: auto;
      color: #fff;
      border: 0;
      background: var(--blue);
    }

    .logbox {
      min-height: 180px;
      max-height: 340px;
      overflow: auto;
      border-radius: 8px;
      background: #101722;
      color: #8ff0ad;
      padding: 14px;
      font-family: Consolas, "Cascadia Mono", monospace;
      white-space: pre-wrap;
      line-height: 1.45;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <main class="app-shell" id="app">
    <div class="loading">프로토콜 스택 개요도를 불러오는 중입니다.</div>
  </main>

  <script type="module">
    const root = document.getElementById("app");
    try {
      const module = await import(`/scripts/protocol_stack_overview.js?v=${Date.now()}`);
      if (typeof module.mount !== "function") {
        throw new Error("protocol_stack_overview.js 파일에 mount(root) 함수가 없습니다.");
      }
      root.innerHTML = "";
      module.mount(root);
    } catch (error) {
      root.innerHTML = `<div class="error">개요도 실행 실패<br>${error.message}</div>`;
      console.error(error);
    }
  </script>
</body>
</html>
"""


class VisualizationHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/", "/index.html"):
            self.send_html()
            return

        if parsed.path.startswith("/scripts/"):
            self.send_script(parsed.path.removeprefix("/scripts/"))
            return

        self.send_error(404, "Not found")

    def send_html(self):
        payload = HTML.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def send_script(self, filename):
        target = (ROOT / filename).resolve()
        try:
            target.relative_to(ROOT)
        except ValueError:
            self.send_error(404, "Script not found")
            return

        if target.suffix != ".js" or not target.exists():
            self.send_error(404, "Script not found")
            return

        payload = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/javascript"
        if target.suffix == ".js":
            content_type = "application/javascript"

        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format, *args):
        print("%s - - [%s] %s" % (self.address_string(), self.log_date_time_string(), format % args))


class AppServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    server = AppServer((HOST, PORT), VisualizationHandler)
    print(f"5G NR Uplink Protocol Stack Explorer: http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.")
        server.server_close()
