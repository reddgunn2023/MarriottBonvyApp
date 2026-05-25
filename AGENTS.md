# AGENTS.md

## Cursor Cloud specific instructions

- This is a single React/Vite frontend for a Marriott Bonvoy amenities and services dashboard. It uses static/local data from `src/data/amenitiesData.js`; no backend, database, queue, emulator, or Docker service is required for local development.
- Standard commands are documented in `README.md` and `package.json`: use `npm run dev` for the Vite dev server, `npm run lint` for ESLint, and `npm run build` for the production build. There is currently no committed automated test script.
- The Vite dev server defaults to `http://localhost:5173`. If that port is occupied, Vite will choose the next free port; check the terminal output before running browser-based checks.
