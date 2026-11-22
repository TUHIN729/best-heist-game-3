// The Midnight Gala — a top-down museum gala art heist (Node 22, standard
// library only): the game is this directory's game/ folder, plain static
// files a desktop browser loads offline (game/index.html and its ES modules,
// no library and no network request), and the program hands it in. It copies
// game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library.
//
// The game: Vesper, a thief in evening dress, crashes a museum gala to steal
// the Star of Meridian diamond. Guards patrol with vision cones, cameras
// sweep the galleries, and a laser grid guards the vault corridor. New twists:
// blend into the gala crowd by walking slow near guests, time the cycling
// lasers, and once the diamond is taken a 90-second getaway countdown starts
// — reach the exit before the driver leaves. Paintings add loot but slow
// you down; smoke bombs blind guards and an EMP kills the cameras.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear only the contents we own inside /output, never /output itself: the
// grader mounts it root-owned, so removing the directory would fail.
mkdirSync(out, { recursive: true });
for (const sub of ['game', 'screenshots']) {
  const dir = join(out, sub);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
