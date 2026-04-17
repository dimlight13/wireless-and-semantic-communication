# Wireless Communication Visualizer

Click and try the simulator in your browser:

## [Run the Simulator Now](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/standalone.html)

No download, VS Code, Python, npm, or GitHub Pages setup is needed. Click the link above while reading this README and the simulator runs in your browser, using your device just like a small web game.

If the main link is temporarily slow, try the backup link:

[Backup simulator link](https://htmlpreview.github.io/?https://github.com/dimlight13/wireless-and-semantic-communication/blob/main/standalone.html)

## Choose a Simulator

- [Traditional 5G NR Uplink Stack](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/traditional.html)  
  Explore RF/ADC, CP removal, FFT, beamforming, equalization, QAM demodulation, LDPC, CRC, HARQ, PDCP, and SDAP.

- [Semantic Communication Explorer](https://raw.githack.com/dimlight13/wireless-and-semantic-communication/main/semcom.html)  
  Compare bit-level communication with semantic communication using sLLM-style encoding, vector quantization, world-model channel adaptation, and KB-assisted decoding.

## What You Can Do

- Click each block to open its simulator.
- Move sliders and press buttons to see how signal-processing parameters change the result.
- Compare a traditional bit pipeline with a semantic meaning-based pipeline.

## Local Run

If you want to run it on your own computer:

```bash
python main.py
```

Then open:

```text
http://127.0.0.1:8000
```

You can also download and double-click the standalone file:

- `standalone.html`

## For Maintainers

This project can run in three simple ways:

1. `standalone.html`: one self-contained browser file.
2. `index.html`, `traditional.html`, `semcom.html`: static pages for GitHub Pages or any static host.
3. `python main.py`: local Python server for development.

When JavaScript modules change, rebuild the standalone file:

```bash
python build_standalone.py
```
