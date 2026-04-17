from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
import os
from pathlib import Path
from urllib.parse import urlparse


HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8001"))
ROOT = Path(__file__).resolve().parent


HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Semantic Communication Explorer</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #0f1b2b;
      --muted: #5f6f82;
      --line: #d8e0ea;
      --blue: #245fd6;
      --green: #11865a;
      --purple: #6b43bd;
      --orange: #c86414;
      --red: #d94242;
      --yellow: #d9991d;
      --teal: #1a8a9d;
      --pink: #c93e7a;
      font-family: "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,251,0.98)),
        radial-gradient(circle at 14% 10%, rgba(107,67,189,0.12), transparent 30%),
        radial-gradient(circle at 86% 80%, rgba(26,138,157,0.12), transparent 28%);
    }

    button, input, select { font: inherit; }

    .app-shell {
      width: min(1720px, 100%);
      min-height: 100vh;
      margin: 0 auto;
      padding: 24px clamp(14px, 3vw, 42px) 34px;
    }

    .loading, .error {
      min-height: 80vh;
      display: grid;
      place-items: center;
      padding: 24px;
      text-align: center;
      font-size: 21px;
      font-weight: 900;
      color: var(--muted);
    }

    .error { color: var(--red); }

    .vis-panel { display: grid; gap: 16px; color: var(--ink); }

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

    .vis-button.primary { background: var(--purple); border-color: var(--purple); color: #fff; }
    .vis-button.green { background: var(--green); border-color: var(--green); color: #fff; }
    .vis-button.red { background: var(--red); border-color: var(--red); color: #fff; }
    .vis-button.orange { background: var(--orange); border-color: var(--orange); color: #fff; }
    .vis-button.teal { background: var(--teal); border-color: var(--teal); color: #fff; }
  </style>
</head>
<body>
  <main class="app-shell" id="app">
    <div class="loading">Loading the Semantic Communication Explorer.</div>
  </main>

  <script type="module">
    const root = document.getElementById("app");
    try {
      const module = await import(`/scripts/semcom/semcom_overview.js?v=${Date.now()}`);
      if (typeof module.mount !== "function") {
        throw new Error("semcom/semcom_overview.js does not export a mount(root) function.");
      }
      root.innerHTML = "";
      module.mount(root);
    } catch (error) {
      root.innerHTML = `<div class="error">Overview execution failed<br>${error.message}</div>`;
      console.error(error);
    }
  </script>
</body>
</html>
"""


class SemComHandler(BaseHTTPRequestHandler):
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
    server = AppServer((HOST, PORT), SemComHandler)
    print(f"Semantic Communication Explorer: http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down the server.")
        server.server_close()
