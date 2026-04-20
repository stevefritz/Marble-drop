# Marble Drop

My daughter handed me a drawing when she was 7 — a game where you build obstacle courses and then fire rockets at the marbles. This is that game.

## What it is

A canvas-based sandbox where you draw walls, curves, and bumpers on a grid, place a cannon, and blast marbles with rockets and lasers. No levels, no objectives, just physics and destruction.

**[Play it →](https://stevefritz.github.io/Marble-drop/)**

## How to play

**Build your course**
- Draw **walls** and **curves** by clicking and dragging on the grid
- Place **bumpers** (pegs) that knock marbles around
- Place your **cannon** on the grid — this is where marbles fire from
- Use the **eraser** to remove anything
- Pick a **line color** — purely cosmetic, choose your favorite

**Aim and fire**
- Drag the cannon to aim
- Adjust **Weight** and **Bounce** sliders to tune ball physics — color is computed from the slider values
- Set the **Power** slider to control launch velocity
- Hit **FIRE!** to launch marbles from the cannon

**Use weapons**
- **Rockets** start with 1 loaded and recharge every 5s (3-round magazine). Click to fire.
- **Laser** is instant and fires through everything, but overheats after 12 shots — 2s cooldown before you can fire again.

**Score**
- Each marble destroyed = 10 points
- The only way to win is to have fun

**Mobile note:** Best on desktop or tablet. Small screens get a friendly message instead of the game.

## Tech stack

- Zero-build static site — no bundler, no npm, no install step
- Vanilla JS ES modules (`<script type="module">`)
- Canvas 2D for all rendering
- Web Audio API for sound synthesis (no audio files)
- Deployed on GitHub Pages

## Docs

Full architecture breakdown, state map, physics notes, and module dependency graph: [docs/CODEBASE_ANALYSIS.md](docs/CODEBASE_ANALYSIS.md)
