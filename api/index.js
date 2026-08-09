// Vercel single-function adapter that re-exports the Express app from the built server bundle.
// This file is intentionally minimal: it imports the bundled server (dist/index.js)
// and re-exports the `app` or default export so Vercel can mount the Express app
// as a single function that handles all /api/* routes.
import serverBundle from "../dist/index.js";

const exportedApp = serverBundle?.default ?? serverBundle?.app ?? serverBundle;

export default exportedApp;
