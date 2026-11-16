// BALLAST — A Weight-Thief's Tale: the hand-in program (Node 22, standard
// library only). The game is this directory's game/ folder: plain static
// files a desktop browser loads offline (game/index.html and its ES modules,
// no library, no network request). This program copies game/ and screenshots/
// from beside this file to /output and writes /output/dossier.json with the
// vendored make.fun library. Serve it locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The screenshots are the entry's face: refuse to hand in a set that breaks
// the caps or is not a real JPEG, rather than letting the grader find out.
// The rules require 3-4 screenshots, each a JPEG under the byte cap.
const shots = readdirSync(join(out, 'screenshots')).filter((name) => name.endsWith('.jpg')).sort();
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3-4 screenshots, found ${shots.length}`);
}
for (const name of shots) {
  const path = join(out, 'screenshots', name);
  const size = statSync(path).size;
  if (size > 262144) throw new Error(`${name} is ${size} bytes, over the 262144 cap`);
  const head = readFileSync(path, { flag: 'r' }).subarray(0, 3);
  if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) {
    throw new Error(`${name} does not start with a JPEG magic number`);
  }
}

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
