# Christmas on Mistletoe Lane

*Every Christmas has a love story.*

A short, original pixel-art romance adventure set in Evergreen Falls, Michigan. Help Emily Bennett rescue her grandmother’s bakery and the town’s Christmas festival, then decide what comes after Christmas. The six chapters are designed for a roughly five-minute first playthrough.

## Run locally

Use Node.js 22 LTS and npm.

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite.

```sh
npm test                 # Story and movement tests
npm run build             # Production files in dist/
npm run preview           # Serve the production build locally
npx playwright install chromium
npm run test:browser     # Run against the production files
```

The Playwright suite mounts the built files under a repository-style URL and blocks requests outside that directory. It exercises all three endings, every chapter, keyboard controls, touchscreen controls, persistence, and clean restarts. Representative screenshots are written to `test-results/`. Set `CHROMIUM_PATH` if using an existing Chromium executable.

## Play

| Action | Keyboard | Touchscreen |
| --- | --- | --- |
| Walk | A / D or ← / → | Hold ◀ / ▶ |
| Jump | W, ↑, or Space | Jump |
| Interact or continue | E or Enter | Interact or tap Continue |
| Choose a response | 1, 2, 3, or focus and activate a choice | Tap a response |
| Pause or resume | Esc | Pause or Resume |

Walk through sparkling items to collect them. Their icons and counts appear in the chapter HUD. Once the objective is ready, follow the arrow to your destination. If you spend about 15 seconds without finding an item, an arrow points toward the next one. Holding a direction against an obstacle triggers a gentle jump assist.

Sound and reduced-motion settings are stored in your browser. Music starts after an interaction. Play Again starts a fresh story, and reloading returns to the main menu. Your ending choice determines the epilogue, and every ending can complete the 16-square Christmas Movie Bingo card.

## Deploy to GitHub Pages

1. Create an empty GitHub repository, for example `christmas-romance-adventure`.
2. Open **Settings → Pages** in the repository. Under **Build and deployment**, select **GitHub Actions** as the source.
3. From this project directory, initialize Git if needed, replace `YOUR-ACCOUNT` in the remote URL, and publish to `main`.

```sh
git init -b main
git add .
git commit -m "Build Christmas on Mistletoe Lane"
git remote add origin https://github.com/YOUR-ACCOUNT/christmas-romance-adventure.git
git push -u origin main
```

For an existing checkout, use its configured remote and skip initialization. The workflow runs the unit and browser tests, builds the site, uploads `dist/`, and deploys it. You can also run the workflow manually from the **Actions** tab. The deployment URL appears in that workflow’s deploy job. Vite builds with a relative base to support repository subdirectories.

## Project structure

- `src/story.js` contains chapter data, character palettes, dialogue, branching choices, endings, and bingo entries.
- `src/session.js` manages collectible and story progress, achievements, ending selection, and saved preferences.
- `src/world.js` updates movement, obstacles, companions, hints, camera position, and scripted events.
- `src/stage.js` connects the simulation and artwork to Phaser’s Canvas renderer and frame loop.
- `src/art.js` draws scenery, characters, props, portraits, and effects at the game’s pixel resolution.
- `src/main.js` connects input, dialogue, chapter cards, HUD, and ending screens. `src/audio.js` synthesizes the soundtrack and effects.

To add a story, supply another catalog of chapter definitions and ending data. Existing scene types can reuse their movement, collectible, and interaction mechanics. Add new environment art or event animations only where the new story requires them.

The game uses system fonts and generates its artwork and soundtrack locally. Gameplay runs entirely in the browser.
