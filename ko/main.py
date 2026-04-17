from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
import os
from pathlib import Path
from urllib.parse import urlparse


HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
ROOT = Path(__file__).resolve().parent


LANDING_HTML = """<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Wireless Communication Visualizer</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #0f1b2b;
      --muted: #5f6f82;
      --line: #d8e0ea;
      --blue: #245fd6;
      --purple: #6b43bd;
      --teal: #1a8a9d;
      font-family: "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; color: var(--ink);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,251,0.98)),
        radial-gradient(circle at 14% 10%, rgba(36,95,214,0.10), transparent 30%),
        radial-gradient(circle at 86% 80%, rgba(107,67,189,0.10), transparent 28%);
      display: grid; place-items: center; padding: 40px 20px;
    }
    .wrap { width: min(1080px, 100%); display: grid; gap: 22px; }
    header h1 {
      margin: 0; font-size: clamp(30px, 3.6vw, 52px); line-height: 1.05;
    }
    header p {
      margin: 8px 0 0; color: var(--muted); font-size: clamp(15px, 1.3vw, 19px);
      font-weight: 800; line-height: 1.45;
    }
    .cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    @media (max-width: 820px) { .cards { grid-template-columns: 1fr; } }
    .card {
      display: grid; gap: 12px;
      padding: 22px; border: 1px solid var(--line); border-radius: 12px;
      background: #fff; box-shadow: 0 16px 42px rgba(20,33,47,0.10);
      text-decoration: none; color: inherit;
      transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
      border-left: 6px solid var(--accent, var(--blue));
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 22px 52px rgba(20,33,47,0.14); border-color: var(--accent, var(--blue)); }
    .card .tag {
      justify-self: start;
      padding: 4px 10px; border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 14%, #fff);
      color: var(--accent); font-weight: 900; font-size: 12px; letter-spacing: 0.4px;
    }
    .card h2 { margin: 0; font-size: 24px; line-height: 1.2; }
    .card p { margin: 0; color: #35475d; font-size: 14px; line-height: 1.5; font-weight: 800; }
    .card ul { margin: 4px 0 0; padding-left: 18px; color: #4f6073; font-size: 13px; font-weight: 800; line-height: 1.55; }
    .card .cta {
      margin-top: 6px; justify-self: start;
      padding: 9px 14px; border-radius: 8px;
      background: var(--accent); color: #fff; font-weight: 900; font-size: 13px;
    }
    .trad { --accent: var(--blue); }
    .sem  { --accent: var(--purple); }
    footer {
      color: var(--muted); font-size: 12px; font-weight: 800; text-align: center;
    }
    footer code { background: #eef3fa; padding: 2px 6px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Wireless Communication Visualizer</h1>
      <p>두 가지 통신 방식을 직관적으로 비교·학습할 수 있는 인터랙티브 플레이그라운드. 원하는 트랙을 선택해 시작하세요.</p>
    </header>

    <section class="cards">
      <a class="card trad" href="/traditional">
        <span class="tag">TRADITIONAL · 5G NR</span>
        <h2>전통 통신: 5G NR Uplink Protocol Stack</h2>
        <p>O-RU → O-DU → O-CU 전체 업링크 파이프라인을 블록 단위로 분해하여 각 물리·MAC·PDCP·SDAP 계층의 동작을 시뮬레이션합니다.</p>
        <ul>
          <li>RF 샘플링 · CP 제거 · OFDM FFT · 디지털 빔포밍</li>
          <li>채널 추정/등화 · QAM 복조 · LDPC 복호 · HARQ</li>
          <li>PDCP 재정렬/해독 · SDAP QoS 매핑</li>
        </ul>
        <span class="cta">Explore Traditional →</span>
      </a>

      <a class="card sem" href="/semcom">
        <span class="tag">SEMANTIC · sLLM + KB</span>
        <h2>시맨틱 통신: Semantic Communication Explorer</h2>
        <p>비트가 아닌 '의미'를 전송하는 차세대 하이브리드 통신. sLLM 인코더, VQ, World Model, KB 기반 디코더를 직접 조작해봅니다.</p>
        <ul>
          <li>sLLM Encoder · Vector Quantization · World Model</li>
          <li>기존 RAN 파이프라인 재활용 (하이브리드 스택)</li>
          <li>KB 복호기 · Bit-Com vs Sem-Com 벤치마크</li>
        </ul>
        <span class="cta">Explore Sem-Com →</span>
      </a>
    </section>

    <footer>
      실행: <code>python main.py</code> · 주소: __ORIGIN__
    </footer>
  </div>
</body>
</html>
"""


def _app_html(entry_script: str, title: str, accent: str, loading_msg: str) -> str:
    return f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{title}</title>
  <style>
    :root {{
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
      --accent: {accent};
      font-family: "Segoe UI", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0; min-height: 100vh; color: var(--ink);
      background:
        linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,247,251,0.98)),
        radial-gradient(circle at 14% 10%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 30%),
        radial-gradient(circle at 86% 80%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 28%);
    }}
    button, input, select {{ font: inherit; }}
    .app-shell {{
      width: min(1720px, 100%);
      min-height: 100vh;
      margin: 0 auto;
      padding: 24px clamp(14px, 3vw, 42px) 34px;
    }}
    .topbar {{
      display: flex; justify-content: space-between; align-items: center; gap: 10px;
      margin-bottom: 14px;
    }}
    .topbar a {{
      text-decoration: none; color: var(--accent); font-weight: 900; font-size: 13px;
      padding: 7px 12px; border-radius: 8px; border: 1px solid color-mix(in srgb, var(--accent) 30%, #fff);
      background: #fff;
    }}
    .topbar a:hover {{ background: color-mix(in srgb, var(--accent) 10%, #fff); }}
    .loading, .error {{
      min-height: 70vh;
      display: grid; place-items: center; padding: 24px; text-align: center;
      font-size: 21px; font-weight: 900; color: var(--muted);
    }}
    .error {{ color: var(--red); }}
    .vis-panel {{ display: grid; gap: 16px; color: var(--ink); }}
    .vis-card {{
      border: 1px solid var(--line); border-radius: 8px;
      background: #fff; padding: 16px; box-shadow: 0 8px 22px rgba(20,33,47,0.06);
    }}
    .vis-row {{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }}
    .vis-button {{
      border: 1px solid #cad5e3; border-radius: 8px; background: #fff; color: var(--ink);
      min-height: 42px; padding: 9px 13px; cursor: pointer; font-weight: 900;
    }}
    .vis-button.primary {{ background: var(--accent); border-color: var(--accent); color: #fff; }}
    .vis-button.green {{ background: var(--green); border-color: var(--green); color: #fff; }}
    .vis-button.red {{ background: var(--red); border-color: var(--red); color: #fff; }}
    .vis-button.orange {{ background: var(--orange); border-color: var(--orange); color: #fff; }}
    .vis-button.teal {{ background: var(--teal); border-color: var(--teal); color: #fff; }}
    .bit, .packet-chip {{
      display: inline-grid; place-items: center;
      min-width: 34px; min-height: 34px; padding: 6px 9px; border-radius: 7px;
      background: #e9eef6; color: #172536; font-weight: 900; border: 1px solid #d4deea;
    }}
    .packet-chip {{ min-width: auto; color: #fff; border: 0; background: var(--blue); }}
    .logbox {{
      min-height: 180px; max-height: 340px; overflow: auto;
      border-radius: 8px; background: #101722; color: #8ff0ad; padding: 14px;
      font-family: Consolas, "Cascadia Mono", monospace;
      white-space: pre-wrap; line-height: 1.45; font-size: 14px;
    }}
  </style>
</head>
<body>
  <main class="app-shell" id="app">
    <div class="topbar">
      <a href="/">← 홈 (트랙 선택)</a>
      <span style="color:var(--muted); font-weight:900; font-size:12px">{title}</span>
    </div>
    <div class="loading">{loading_msg}</div>
  </main>

  <script type="module">
    const root = document.getElementById("app");
    const appEl = document.createElement("div");
    appEl.id = "app-body";
    try {{
      const module = await import(`/scripts/{entry_script}?v=${{Date.now()}}`);
      if (typeof module.mount !== "function") {{
        throw new Error("{entry_script} 파일에 mount(root) 함수가 없습니다.");
      }}
      const loading = root.querySelector(".loading");
      if (loading) loading.remove();
      root.appendChild(appEl);
      module.mount(appEl);
    }} catch (error) {{
      const loading = root.querySelector(".loading");
      if (loading) loading.remove();
      const err = document.createElement("div");
      err.className = "error";
      err.innerHTML = `실행 실패<br>${{error.message}}`;
      root.appendChild(err);
      console.error(error);
    }}
  </script>
</body>
</html>
"""


TRADITIONAL_HTML = _app_html(
    entry_script="protocol_stack_overview.js",
    title="5G NR Uplink Protocol Stack Explorer",
    accent="#245fd6",
    loading_msg="프로토콜 스택 개요도를 불러오는 중입니다.",
)

SEMCOM_HTML = _app_html(
    entry_script="semcom/semcom_overview.js",
    title="Semantic Communication Explorer",
    accent="#6b43bd",
    loading_msg="Semantic Communication Explorer를 불러오는 중입니다.",
)


class AppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ("/", "/index.html"):
            origin = f"http://{self.headers.get('Host', f'{HOST}:{PORT}')}"
            self._send_html(LANDING_HTML.replace("__ORIGIN__", origin))
            return

        if path in ("/traditional", "/traditional/"):
            self._send_html(TRADITIONAL_HTML)
            return

        if path in ("/semcom", "/semcom/"):
            self._send_html(SEMCOM_HTML)
            return

        if path.startswith("/scripts/"):
            self._send_script(path.removeprefix("/scripts/"))
            return

        self.send_error(404, "Not found")

    def _send_html(self, body: str):
        payload = body.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def _send_script(self, filename: str):
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
    server = AppServer((HOST, PORT), AppHandler)
    url = f"http://{HOST}:{PORT}"
    print("=" * 60)
    print("Wireless Communication Visualizer")
    print("=" * 60)
    print(f"  홈 (트랙 선택):  {url}/")
    print(f"  전통 통신:        {url}/traditional")
    print(f"  시맨틱 통신:      {url}/semcom")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.")
        server.server_close()
