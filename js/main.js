/**
 * Entry point. Wires the theme button and starts the app.
 * Loaded by index.html as an ES module.
 */
import { App } from './core/App.js';
import { catalog } from './catalog.js';
import { ThemeToggle } from './ui/ThemeToggle.js';

new ThemeToggle(document.getElementById('theme-toggle'));

const app = new App({
  catalog,
  subjectNav: document.getElementById('subject-nav'),
  benchNav: document.getElementById('bench-nav'),
  root: document.getElementById('bench-root'),
  searchInput: document.getElementById('search'),
  searchResults: document.getElementById('search-results'),
});
app.start();

// Tells the safety-net script in index.html that modules loaded fine.
window.__modelLabBooted = true;
