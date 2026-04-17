export const metadata = {
  title: "Parity Check vs CRC Check",
};

export function mount(root) {
  const originalData = [1, 0, 1, 1, 0, 0, 1, 0];
  const generator = [1, 0, 0, 1, 1]; // x^4 + x + 1
  const parityBit = originalData.reduce((sum, bit) => sum + bit, 0) % 2;
  const crcBits = computeCrcBits(originalData, generator);
  let receivedData = [...originalData];

  function mod2Divide(bits, divisor) {
    const work = [...bits];
    for (let i = 0; i <= work.length - divisor.length; i += 1) {
      if (work[i] === 1) {
        for (let j = 0; j < divisor.length; j += 1) {
          work[i + j] ^= divisor[j];
        }
      }
    }
    return work.slice(work.length - (divisor.length - 1));
  }

  function computeCrcBits(data, divisor) {
    const padded = [...data, ...Array(divisor.length - 1).fill(0)];
    return mod2Divide(padded, divisor);
  }

  function hasNonZero(bits) {
    return bits.some((bit) => bit !== 0);
  }

  function render() {
    const errorPositions = receivedData
      .map((bit, index) => bit !== originalData[index] ? index : null)
      .filter((index) => index !== null);
    const errorCount = errorPositions.length;
    const parityRemainder = [...receivedData, parityBit].reduce((sum, bit) => sum + bit, 0) % 2;
    const parityDetectsError = parityRemainder !== 0;
    const crcRemainder = mod2Divide([...receivedData, ...crcBits], generator);
    const crcDetectsError = hasNonZero(crcRemainder);
    const parityState = parityDetectsError ? "fail" : (errorCount > 0 ? "fatal" : "pass");
    const crcState = crcDetectsError ? "fail" : "pass";

    root.innerHTML = `
      <style>
        .crc-demo h2 { margin:0; font-size:32px; }
        .crc-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; }
        .error-panel h3, .result h3 { margin:0 0 12px; font-size:23px; }
        .bit-buttons { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
        .crc-bit {
          min-width:58px;
          min-height:58px;
          border:2px solid #cbd6e4;
          border-radius:8px;
          background:#eef3fa;
          color:#14212f;
          font-size:24px;
          font-weight:900;
          cursor:pointer;
          transition:transform 180ms ease, background 180ms ease, border-color 180ms ease;
        }
        .crc-bit:hover { transform:translateY(-2px); border-color:var(--blue); }
        .crc-bit.error { background:#d94242; border-color:#d94242; color:#fff; box-shadow:0 0 0 5px rgba(217,66,66,.15); }
        .code-row { display:flex; flex-wrap:wrap; gap:7px; align-items:center; margin-top:12px; }
        .code-row span { padding:8px 10px; border-radius:8px; background:#f1f5fa; border:1px solid #d5dfeb; font-weight:900; }
        .result-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        .result {
          border:3px solid #ccd7e4;
          border-radius:8px;
          padding:16px;
          min-height:230px;
          transition:background 200ms ease, border-color 200ms ease;
        }
        .result.pass { background:#edf9f2; border-color:#11865a; }
        .result.fail { background:#fff0f0; border-color:#d94242; }
        .result.fatal { background:#fff6db; border-color:#d9991d; }
        .result strong { display:block; margin:8px 0; font-size:26px; }
        .result.pass strong { color:#0d6744; }
        .result.fail strong { color:#a02828; }
        .result.fatal strong { color:#9a6510; }
        .result p { margin:8px 0; font-size:18px; line-height:1.42; font-weight:800; }
        .formula { padding:12px; border-radius:8px; background:#fff; border:1px solid #d5dfeb; font-family:Consolas, "Cascadia Mono", monospace; font-size:17px; font-weight:900; }
        .fatal-text { font-weight:900; color:#9a251f; }
        @media (max-width: 850px) { .result-grid { grid-template-columns:1fr; } }
      </style>

      <div class="vis-panel crc-demo">
        <section>
          <h2>Error Detection: Parity Check vs CRC Check</h2>
          <p class="hint">Click data bits to create radio-channel errors and see why parity can misjudge an even number of errors.</p>
        </section>

        <section class="vis-card error-panel">
          <h3>Radio Channel Error Generator</h3>
          <div class="bit-buttons">
            ${receivedData.map((bit, index) => `
              <button class="crc-bit ${bit !== originalData[index] ? "error" : ""}" data-index="${index}" type="button">${bit}</button>
            `).join("")}
          </div>
          <div class="code-row">
            <span>Original data: ${originalData.join(" ")}</span>
            <span>Current errors: ${errorCount}${errorCount ? ` (${errorPositions.map((i) => i + 1).join(", ")} bit positions)` : ""}</span>
            <span>Even parity bit: ${parityBit}</span>
            <span>CRC generator polynomial: 10011</span>
            <span>CRC bits: ${crcBits.join("")}</span>
          </div>
          <div class="vis-row" style="margin-top:12px">
            <button class="vis-button" data-action="reset" type="button">Clear Errors</button>
            <button class="vis-button red" data-action="two" type="button">Create 2-bit Error Example</button>
          </div>
        </section>

        <section class="result-grid">
          <article class="result ${parityState}">
            <h3>Parity Check Result</h3>
            <div class="formula">Received data + parity ones count mod 2 = ${parityRemainder}</div>
            <strong>${parityDetectsError ? "Error detected" : (errorCount > 0 ? "Pass (fatal miss!)" : "Pass")}</strong>
            <p>${errorCount === 2 && !parityDetectsError ? `<span class="fatal-text">With a 2-bit error, the parity of the number of ones is unchanged, so parity missed it.</span>` : "Even parity reacts to an odd number of errors but is weak against an even number of errors."}</p>
          </article>

          <article class="result ${crcState}">
            <h3>CRC Check Result</h3>
            <div class="formula">Remainder = ${crcRemainder.join("")}</div>
            <strong>${crcDetectsError ? "Error detected" : "Pass"}</strong>
            <p>Compute the actual remainder by dividing the received data and original CRC bits by generator polynomial 10011.</p>
          </article>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-index]").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        receivedData[index] = receivedData[index] === 1 ? 0 : 1;
        render();
      });
    });
    root.querySelector('[data-action="reset"]').addEventListener("click", () => {
      receivedData = [...originalData];
      render();
    });
    root.querySelector('[data-action="two"]').addEventListener("click", () => {
      receivedData = [...originalData];
      receivedData[1] ^= 1;
      receivedData[4] ^= 1;
      render();
    });
  }

  render();
}
