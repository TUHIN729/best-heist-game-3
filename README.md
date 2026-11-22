# The Midnight Gala

[![Best Heist Game](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![Rank](https://make.fun/badge/best-heist-game-20261122-0559/TUHIN729/best-heist-game-3/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard)
[![Reward](https://make.fun/badge/best-heist-game-20261122-0559/TUHIN729/best-heist-game-3/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down museum gala art heist that plays offline in a desktop browser.

**The job:** Vesper, a thief in evening dress, crashes a museum gala to steal
the **Star of Meridian** diamond. Guards patrol with vision cones, cameras
sweep the galleries, and a laser grid guards the vault corridor.

**What's new:**
- **Blend into the crowd** — walk slow (Shift) near gala guests and the
  guards can barely see you; move fast and you stand out.
- **Cycling laser grid** — three beams across the vault corridor switch on
  and off out of phase; time your crossing or trip the alarm.
- **Getaway countdown** — the moment the diamond is taken, a 90-second
  timer starts. Reach the exit before the driver leaves.
- **Loot has weight** — every painting you pocket slows you down, so greed
  costs speed when the alarm is rising.
- **Tools** — a smoke bomb blinds the guards, an EMP kills the cameras.

**Controls:** WASD / arrows to move, Shift to walk slow (blend), E smoke
bomb, Q EMP, Enter to start, R to play again.

**How to play:** open `game/index.html` in a desktop browser (or serve the
folder with `node serve.ts` and open http://localhost:8080). No network,
no build step — the game is plain static files.

**How to hand it in:** `MAKEFUN_OUTPUT_DIR=out node main.ts` copies the
game and screenshots to `/output` and writes `dossier.json`.
