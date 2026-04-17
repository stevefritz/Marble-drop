# Marble Drop

My son handed me a drawing when she was 7 — a game where you build obstacle courses and then fire rockets at the marbles. This is that game.

## What it is

A canvas-based sandbox where you draw walls, curves, and bumpers on a grid, drop a bunch of marbles, and try to blast them with rockets and lasers. No levels, no objectives, just physics and destruction.

**[Play it →](https://stevefritz.github.io/Marble-drop/)**

## How to play

**Build your course**
- Draw **walls** and **curves** by clicking and dragging on the grid
- Place **bumpers** (pegs) that knock marbles around
- Use the **eraser** to remove anything

**Drop marbles**
- Pick a marble color — each has different physics:
  - Yellow — normal
  - Red — fast
  - Blue — heavy
  - Green — bouncy
- Set count (1–50) with the +/− buttons and hit **DROP**

**Use weapons**
- **Rockets** charge up after your first drop — 15s for the first shot, then 10s per rocket (3-round magazine). Click to fire.
- **Laser** is instant and fires through everything, but overheats — watch the heat gauge in the top-right. Click to fire.

**Score**
- Each marble destroyed = 10 points
- The only way to win is to have fun

## Tech stack

- Zero-build static site — no bundler, no npm, no install step
- Vanilla JS ES modules (`<script type="module">`)
- Canvas 2D for all rendering
- Web Audio API for sound synthesis (no audio files)
- Deployed on GitHub Pages

## Docs

Full architecture breakdown, state map, physics notes, and module dependency graph: [docs/CODEBASE_ANALYSIS.md](docs/CODEBASE_ANALYSIS.md)
