export const metadata = {
  title: "5G Rate Matching and Dematching",
};

export function mount(root) {
  const motherCode = [1, 0, 1, 1, 0, 0, 1, 0];
  let resourceSize = 8;

  function buildModel() {
    const physical = Array.from({ length: resourceSize }, (_, index) => ({
      bit: motherCode[index % motherCode.length],
      sourceIndex: index % motherCode.length,
      repeated: index >= motherCode.length,
    }));

    const dematched = motherCode.map((bit, index) => {
      const copies = physical.filter((item) => item.sourceIndex === index);
      if (copies.length === 0) {
        return { bit: "0 (Null)", index, status: "missing", detail: "Position removed by puncturing" };
      }
      if (copies.length > 1) {
        return { bit: `${bit} Combined`, index, status: "combined", detail: `${copies.length} LLR copies combined` };
      }
      return { bit, index, status: "normal", detail: "Received normally" };
    });

    const punctured = motherCode
      .map((bit, index) => ({ bit, index }))
      .filter((item) => item.index >= resourceSize);

    return { physical, dematched, punctured };
  }

  function bitBox(content, className, subText = "") {
    return `<span class="rate-bit ${className}">
      <b>${content}</b>
      ${subText ? `<small>${subText}</small>` : ""}
    </span>`;
  }

  function render() {
    const { physical, dematched, punctured } = buildModel();
    const hasPuncturing = resourceSize < motherCode.length;
    const hasRepetition = resourceSize > motherCode.length;

    root.innerHTML = `
      <style>
        .rate-demo h2 { margin:0; font-size:32px; }
        .rate-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; }
        .rate-control { display:grid; gap:12px; }
        .rate-control input { width:min(680px,100%); accent-color:var(--blue); }
        .rate-meter { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
        .rate-meter strong { font-size:24px; color:var(--blue); }
        .rate-section h3 { margin:0 0 12px; font-size:22px; }
        .rate-flow { display:grid; gap:14px; }
        .rate-arrow { text-align:center; color:#718198; font-size:34px; font-weight:900; line-height:1; }
        .bit-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; min-height:64px; }
        .rate-bit {
          position:relative;
          min-width:68px;
          min-height:58px;
          display:grid;
          place-items:center;
          gap:2px;
          padding:8px 8px 14px;
          border-radius:8px;
          border:2px solid #cbd6e4;
          background:#f1f5fa;
          color:#14212f;
          font-size:22px;
          font-weight:900;
          transform:translateY(0);
          transition:transform 260ms ease, background 260ms ease, border-color 260ms ease, opacity 260ms ease;
          animation:rateIn 260ms ease both;
        }
        .rate-bit small {
          position:absolute;
          left:6px;
          bottom:4px;
          color:#607083;
          font-size:11px;
          font-weight:900;
        }
        .rate-bit.repeated { background:#dff5ff; border-color:#2799ca; color:#0f5d7c; }
        .rate-bit.punctured, .rate-bit.missing { background:#ffe1e1; border-color:#d94242; color:#a02828; }
        .rate-bit.combined { background:#ddf7e8; border-color:#11865a; color:#0d6744; }
        .rate-bit.ghost { opacity:.78; transform:translateY(8px); }
        .status-line { display:flex; flex-wrap:wrap; gap:10px; }
        .status-line span { padding:10px 12px; border-radius:8px; background:#eef3fa; font-weight:900; }
        .status-line .red { color:#a02828; background:#ffe8e8; }
        .status-line .blue { color:#0f5d7c; background:#e0f6ff; }
        .status-line .green { color:#0d6744; background:#e3f8ed; }
        @keyframes rateIn {
          from { opacity:0; transform:translateY(10px) scale(.96); }
          to { opacity:1; transform:translateY(0) scale(1); }
        }
      </style>

      <div class="vis-panel rate-demo">
        <section>
          <h2>5G Rate Matching and Dematching Visualization</h2>
          <p class="hint">A fixed 8-bit Mother Code is punctured or repeated to fit radio resource size, then restored to 8 positions at the receiver.</p>
        </section>

        <section class="vis-card rate-control">
          <div class="rate-meter">
            <span>Radio resource size</span>
            <strong>${resourceSize}bits</strong>
            <span>Range: 4bits ~ 16bits</span>
          </div>
          <input id="resourceSlider" type="range" min="4" max="16" value="${resourceSize}" />
        </section>

        <section class="vis-card rate-section">
          <h3>Transmitter: Mother Code Bits</h3>
          <div class="bit-row">
            ${motherCode.map((bit, index) => bitBox(bit, "normal", `M${index}`)).join("")}
          </div>
        </section>

        <div class="rate-arrow">↓ Matching</div>

        <section class="vis-card rate-section">
          <h3>Radio Link: Physical Resource</h3>
          <div class="bit-row">
            ${physical.map((item, index) => bitBox(item.bit, item.repeated ? "repeated" : "normal", `R${index}←M${item.sourceIndex}`)).join("")}
          </div>
          ${punctured.length ? `
            <div class="bit-row" aria-label="Punctured bits">
              ${punctured.map((item) => bitBox(item.bit, "punctured ghost", `M${item.index} removed`)).join("")}
            </div>
          ` : ""}
        </section>

        <div class="rate-arrow">↓ Dematching</div>

        <section class="vis-card rate-section">
          <h3>Receiver: After Dematching</h3>
          <div class="bit-row">
            ${dematched.map((item) => bitBox(item.bit, item.status, `M${item.index}`)).join("")}
          </div>
        </section>

        <section class="vis-card">
          <div class="status-line">
            <span class="${hasPuncturing ? "red" : "green"}">${hasPuncturing ? "Puncturing occurred: missing positions filled with 0 (Null)" : "No puncturing"}</span>
            <span class="${hasRepetition ? "blue" : "green"}">${hasRepetition ? "Repetition occurred: repeated LLRs are combined" : "No repetition"}</span>
          </div>
        </section>
      </div>
    `;

    root.querySelector("#resourceSlider").addEventListener("input", (event) => {
      resourceSize = Number(event.target.value);
      render();
    });
  }

  render();
}
