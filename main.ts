// BALLAST — best-game-01 entry program (Node 22, standard library only).
// The game itself is the static files under game/ (game/index.html plus its
// ES modules, no library, no network request). This program hands it in: it
// copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with the vendored make.fun
// library, which is the summary the judge reads. Run it twice and both runs
// must write the same bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly on a broken entry instead of copying nothing and writing a
// dossier that claims success: the game entrypoint and the screenshots the
// judge reads must both be present beside this file.
const gameEntry = join(repoRoot, 'game', 'index.html');
if (!existsSync(gameEntry)) {
  throw new Error(`BALLAST entry is missing its game entrypoint: ${gameEntry}`);
}
if (!existsSync(join(repoRoot, 'screenshots'))) {
  throw new Error('BALLAST entry is missing its screenshots/ directory (3-4 required)');
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The gate's own caps: only text_max_bytes shapes the dossier's bytes; the
// rest refuse an entry the sealed scorer would refuse (too many or too large
// screenshots, too many game files, game/ too large, a game path too long).
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
