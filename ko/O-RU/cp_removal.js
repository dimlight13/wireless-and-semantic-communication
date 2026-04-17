export const metadata = {
  title: "Cyclic Prefix 제거",
};

export function mount(root) {
  const state = {
    cpLength: 16,
    symbolLength: 64,
    multipathDelay: 8,
    enableCp: true,
    phase: 0,
    timer: null,
    animating: true,
  };

  function render() {
    const totalWithCp = state.symbolLength + state.cpLength;
    const ispSafe = state.enableCp && state.cpLength >= state.multipathDelay;

    const cpCells = Array.from({ length: state.cpLength }, (_, i) => i + (state.symbolLength - state.cpLength));
    const symCells = Array.from({ length: state.symbolLength }, (_, i) => i);

    function cell(idx, variant) {
      return `<div class="cp-cell ${variant}"><span>${idx}</span></div>`;
    }

    const totalCells = state.enableCp
      ? [...cpCells.map((i) => ({ i, variant: "cp" })), ...symCells.map((i) => ({ i, variant: "sym" }))]
      : symCells.map((i) => ({ i, variant: "sym" }));

    const delayCells = state.enableCp
      ? [...Array(state.multipathDelay).fill(null).map(() => ({ variant: "echo", label: "↩" })), ...totalCells]
      : [...Array(state.multipathDelay).fill(null).map(() => ({ variant: "echo", label: "↩" })), ...totalCells];

    const fftInput = symCells.map((i) => ({ i, variant: "sym" }));

    root.innerHTML = `
      <style>
        .cp-demo h2 { margin:0; font-size:28px; }
        .cp-demo .hint { color:var(--muted); font-weight:800; margin:6px 0 0; line-height:1.45; }
        .cp-card { border:1px solid var(--line); border-radius:8px; background:#fff; padding:14px; margin-top:12px; box-shadow:0 4px 12px rgba(20,33,47,.05); }
        .cp-card h3 { margin:0 0 8px; font-size:18px; color:#1d2c3f; }
        .cp-row { display:flex; gap:3px; align-items:center; overflow-x:auto; padding:8px 4px; background:#f7faff; border-radius:6px; }
        .cp-cell { flex:0 0 auto; width:24px; height:36px; display:grid; place-items:center; border-radius:4px; font-size:10px; font-weight:900; color:#fff; }
        .cp-cell.cp { background:#c86414; box-shadow:inset 0 -3px 0 rgba(0,0,0,.2); }
        .cp-cell.sym { background:#245fd6; }
        .cp-cell.echo { background:#d94242; opacity:.6; color:#fff; }
        .cp-cell.fft-in { background:#11865a; }
        .cp-cell.removed { background:#d8e0ea; color:#8ea0b7; text-decoration:line-through; }
        .cp-controls { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px; margin-top:10px; }
        .cp-controls label { display:grid; gap:4px; font-weight:900; color:#35475d; font-size:13px; }
        .cp-legend { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; font-weight:900; font-size:12px; }
        .cp-legend span { display:flex; align-items:center; gap:6px; padding:4px 8px; border-radius:6px; background:#f1f5fa; }
        .cp-legend i { display:inline-block; width:12px; height:12px; border-radius:3px; }
        .cp-arrow { text-align:center; color:#718198; font-size:22px; font-weight:900; margin:6px 0; }
        .cp-verdict { padding:10px 12px; border-radius:8px; font-weight:900; margin-top:8px; }
        .cp-verdict.ok { background:#e4f8ec; color:#0d6744; border:1px solid #11865a; }
        .cp-verdict.bad { background:#ffe8e8; color:#a02828; border:1px solid #d94242; }
        .cp-note { font-size:12px; color:#607083; font-weight:800; margin-top:6px; line-height:1.4; }
      </style>

      <div class="vis-panel cp-demo">
        <section>
          <h2>Cyclic Prefix (CP) 제거</h2>
          <p class="hint">OFDM 심볼 앞에 붙은 CP는 다중경로 지연으로 인한 심볼 간 간섭(ISI)을 흡수합니다. 수신단은 CP 구간만큼 잘라내고 유효 심볼만 FFT로 넘깁니다.</p>
        </section>

        <section class="cp-card">
          <div class="cp-controls">
            <label>CP 길이 (샘플): <b>${state.cpLength}</b>
              <input type="range" min="0" max="32" step="1" value="${state.cpLength}" data-control="cpLength" />
            </label>
            <label>다중경로 지연 (샘플): <b>${state.multipathDelay}</b>
              <input type="range" min="0" max="32" step="1" value="${state.multipathDelay}" data-control="multipathDelay" />
            </label>
            <label style="flex-direction:row;align-items:center;gap:8px">
              <input type="checkbox" ${state.enableCp ? "checked" : ""} data-toggle="enableCp" />
              CP 보호 구간 사용
            </label>
          </div>

          <div class="cp-legend">
            <span><i style="background:#c86414"></i>CP 복사본 (마지막 ${state.cpLength}샘플)</span>
            <span><i style="background:#245fd6"></i>유효 OFDM 심볼 (${state.symbolLength}샘플)</span>
            <span><i style="background:#d94242;opacity:.6"></i>다중경로 에코</span>
            <span><i style="background:#11865a"></i>FFT 입력</span>
          </div>

          <h3 style="margin-top:14px">① 송신: CP + 유효 심볼</h3>
          <div class="cp-row">${totalCells.map((c) => cell(c.i, c.variant)).join("")}</div>
          <div class="cp-note">유효 심볼의 마지막 ${state.cpLength}샘플이 앞에 복사되어 총 ${state.enableCp ? totalWithCp : state.symbolLength} 샘플이 전송됩니다.</div>

          <div class="cp-arrow">↓ 무선 채널: 다중경로로 에코 ${state.multipathDelay} 샘플만큼 밀림</div>

          <h3>② 수신: 에코가 겹친 파형</h3>
          <div class="cp-row">${delayCells.map((c) => c.label ? `<div class="cp-cell ${c.variant}"><span>${c.label}</span></div>` : cell(c.i, c.variant)).join("")}</div>
          <div class="cp-note">이전 심볼의 꼬리가 현재 CP 영역까지 침범합니다. CP가 에코 지연보다 길면 유효 심볼은 오염되지 않습니다.</div>

          <div class="cp-arrow">↓ CP 제거 (앞 ${state.enableCp ? state.cpLength : 0} 샘플 폐기)</div>

          <h3>③ FFT 입력: 유효 심볼만</h3>
          <div class="cp-row">${fftInput.map((c) => cell(c.i, "fft-in")).join("")}</div>

          <div class="cp-verdict ${ispSafe ? "ok" : "bad"}">
            ${ispSafe
              ? `CP 길이(${state.cpLength}) ≥ 채널 지연(${state.multipathDelay}): 유효 심볼은 ISI로부터 보호되었습니다.`
              : `CP 길이(${state.cpLength}) &lt; 채널 지연(${state.multipathDelay}): 에코가 유효 심볼을 침범해 ISI가 발생합니다. CP를 늘리거나 채널 지연을 줄여야 합니다.`}
          </div>
        </section>
      </div>
    `;

    root.querySelectorAll("[data-control]").forEach((el) => {
      el.addEventListener("input", (e) => {
        state[el.dataset.control] = Number(e.target.value);
        render();
      });
    });
    root.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", (e) => {
        state[el.dataset.toggle] = e.target.checked;
        render();
      });
    });
  }

  render();
  return () => {};
}
