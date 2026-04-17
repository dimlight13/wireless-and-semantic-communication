import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent

MODULE_PATHS = [
    "protocol_stack_overview.js",
    "O-RU/rf_adc_sampling.js",
    "O-RU/cp_removal.js",
    "O-RU/fft_ofdm.js",
    "O-RU/digital_beamforming.js",
    "O-DU/channel_estimation_equalization.js",
    "O-DU/qam_demodulation_llr.js",
    "O-DU/scrambling_descrambling_llr.js",
    "O-DU/5g_rate_matching_dematchning.js",
    "O-DU/ldpc_decoding.js",
    "O-DU/parity_crc_comparison.js",
    "O-DU/MAC_HARQ_RLC_ARQ_comparison.js",
    "O-DU/rlc_mac_multiplexing.js",
    "O-CU/pdcp_reordering_deciphering.js",
    "O-CU/sdap_qos_mapping.js",
    "semcom/semcom_overview.js",
    "semcom/semantic_encoder.js",
    "semcom/vector_quantization.js",
    "semcom/world_model_channel.js",
    "semcom/semantic_decoder.js",
    "semcom/semcom_vs_bitcom.js",
]


def module_source(path: str) -> str:
    source = (ROOT / path).read_text(encoding="utf-8")
    if path == "protocol_stack_overview.js":
        source = source.replace(
            "await import(new URL(selected.file, import.meta.url).href);",
            "await globalThis.__loadStandaloneModule(selected.file);",
        )
        source = source.replace(
            "await import(`/scripts/${selected.file}?v=${Date.now()}`);",
            "await globalThis.__loadStandaloneModule(selected.file);",
        )
    if path == "semcom/semcom_overview.js":
        source = source.replace(
            "await import(new URL(`../${sel.file}`, import.meta.url).href);",
            "await globalThis.__loadStandaloneModule(sel.file);",
        )
        source = source.replace(
            "await import(`/scripts/${sel.file}?v=${Date.now()}`);",
            "await globalThis.__loadStandaloneModule(sel.file);",
        )
    return source


def main() -> None:
    modules = {path: module_source(path) for path in MODULE_PATHS}
    payload = json.dumps(modules, ensure_ascii=False)
    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Wireless Communication Visualizer Standalone</title>
  <style>
    :root {{
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
      --teal: #1a8a9d;
      --pink: #c93e7a;
      --accent: var(--blue);
      font-family: "Segoe UI", Arial, sans-serif;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      background:
        linear-gradient(180deg, rgba(255,255,255,.92), rgba(244,247,251,.98)),
        radial-gradient(circle at 18% 12%, rgba(36,95,214,.10), transparent 30%),
        radial-gradient(circle at 82% 80%, rgba(107,67,189,.10), transparent 26%);
    }}
    button, input, select {{ font: inherit; }}
    .app-shell {{ width: min(1720px, 100%); min-height: 100vh; margin: 0 auto; padding: 20px clamp(14px, 3vw, 42px) 34px; }}
    .standalone-top {{
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      box-shadow: 0 8px 22px rgba(20,33,47,.06);
    }}
    .standalone-title {{ display: grid; gap: 2px; }}
    .standalone-title strong {{ font-size: 17px; }}
    .standalone-title span {{ color: var(--muted); font-size: 12px; font-weight: 800; }}
    .standalone-actions {{ display: flex; flex-wrap: wrap; gap: 8px; }}
    .standalone-actions button {{
      min-height: 38px;
      border: 1px solid #cad5e3;
      border-radius: 8px;
      background: #fff;
      color: var(--ink);
      padding: 8px 12px;
      cursor: pointer;
      font-weight: 900;
    }}
    .standalone-actions button.active {{ background: var(--accent); border-color: var(--accent); color: #fff; }}
    .loading, .error {{ min-height: 70vh; display: grid; place-items: center; padding: 24px; text-align: center; font-size: 21px; font-weight: 900; color: var(--muted); }}
    .error {{ color: var(--red); }}
    .vis-panel {{ display: grid; gap: 16px; color: var(--ink); }}
    .vis-card {{ border: 1px solid var(--line); border-radius: 8px; background: #fff; padding: 16px; box-shadow: 0 8px 22px rgba(20,33,47,.06); }}
    .vis-row {{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }}
    .vis-button {{ border: 1px solid #cad5e3; border-radius: 8px; background: #fff; color: var(--ink); min-height: 42px; padding: 9px 13px; cursor: pointer; font-weight: 900; }}
    .vis-button.primary {{ background: var(--accent); border-color: var(--accent); color: #fff; }}
    .vis-button.green {{ background: var(--green); border-color: var(--green); color: #fff; }}
    .vis-button.red {{ background: var(--red); border-color: var(--red); color: #fff; }}
    .vis-button.orange {{ background: var(--orange); border-color: var(--orange); color: #fff; }}
    .vis-button.teal {{ background: var(--teal); border-color: var(--teal); color: #fff; }}
    .bit, .packet-chip {{ display: inline-grid; place-items: center; min-width: 34px; min-height: 34px; padding: 6px 9px; border-radius: 7px; background: #e9eef6; color: #172536; font-weight: 900; border: 1px solid #d4deea; }}
    .packet-chip {{ min-width: auto; color: #fff; border: 0; background: var(--blue); }}
    .logbox {{ min-height: 180px; max-height: 340px; overflow: auto; border-radius: 8px; background: #101722; color: #8ff0ad; padding: 14px; font-family: Consolas, "Cascadia Mono", monospace; white-space: pre-wrap; line-height: 1.45; font-size: 14px; }}
  </style>
</head>
<body>
  <main class="app-shell">
    <nav class="standalone-top">
      <div class="standalone-title">
        <strong>Wireless Communication Visualizer</strong>
        <span>Standalone browser file. All code runs on your device.</span>
      </div>
      <div class="standalone-actions">
        <button type="button" data-entry="protocol_stack_overview.js">Traditional 5G NR</button>
        <button type="button" data-entry="semcom/semcom_overview.js">Semantic Communication</button>
      </div>
    </nav>
    <div id="app"><div class="loading">Loading visualizer...</div></div>
  </main>

  <script type="module">
    const moduleSources = {payload};
    const moduleUrls = new Map();
    let cleanup = null;

    function moduleUrl(path) {{
      if (!moduleSources[path]) throw new Error(`Missing embedded module: ${{path}}`);
      if (!moduleUrls.has(path)) {{
        const blob = new Blob([moduleSources[path]], {{ type: "text/javascript" }});
        moduleUrls.set(path, URL.createObjectURL(blob));
      }}
      return moduleUrls.get(path);
    }}

    globalThis.__loadStandaloneModule = (path) => import(moduleUrl(path));

    async function mount(entry) {{
      const root = document.getElementById("app");
      root.innerHTML = '<div class="loading">Loading visualizer...</div>';
      if (typeof cleanup === "function") cleanup();
      cleanup = null;
      document.querySelectorAll("[data-entry]").forEach((button) => {{
        button.classList.toggle("active", button.dataset.entry === entry);
      }});
      try {{
        const module = await import(moduleUrl(entry));
        if (typeof module.mount !== "function") throw new Error(`${{entry}} does not export mount(root).`);
        root.innerHTML = "";
        cleanup = module.mount(root) || null;
      }} catch (error) {{
        root.innerHTML = `<div class="error">Failed to load visualizer<br>${{error.message}}</div>`;
        console.error(error);
      }}
    }}

    document.querySelectorAll("[data-entry]").forEach((button) => {{
      button.addEventListener("click", () => mount(button.dataset.entry));
    }});

    mount("protocol_stack_overview.js");
  </script>
</body>
</html>
"""
    (ROOT / "standalone.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
