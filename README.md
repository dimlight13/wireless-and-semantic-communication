# Wireless Communication Visualizer

Click and try the simulator in your browser:

## [Open the Visualizer](https://dimlight13.github.io/wireless-and-semantic-communication/)

No VS Code, Python, npm, or installation is needed when using the link above.

If the link shows `404 There isn't a GitHub Pages site here`, the site has not been enabled yet. The repository owner only needs to enable GitHub Pages once: `Settings` -> `Pages` -> `Source: GitHub Actions`.

## Choose a Simulator

- [Traditional 5G NR Uplink Stack](https://dimlight13.github.io/wireless-and-semantic-communication/traditional.html)  
  Explore RF/ADC, CP removal, FFT, beamforming, equalization, QAM demodulation, LDPC, CRC, HARQ, PDCP, and SDAP.

- [Semantic Communication Explorer](https://dimlight13.github.io/wireless-and-semantic-communication/semcom.html)  
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

You can also open the static pages directly through GitHub Pages:

- `index.html`
- `traditional.html`
- `semcom.html`

## For Maintainers

This project is designed to work as a static GitHub Pages site. The HTML files load ES module JavaScript directly with relative paths.

To enable GitHub Pages:

1. Go to the repository `Settings`.
2. Open `Pages`.
3. Set `Source` to `GitHub Actions`.
4. Save.
5. Open the `Actions` tab and run the `Deploy static site to GitHub Pages` workflow if it has not run automatically.

The public simulator URL will be:

```text
https://dimlight13.github.io/wireless-and-semantic-communication/
```
