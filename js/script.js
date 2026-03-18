/* ==========================================
   CHARACTER COUNTER — script.js
   ========================================== */

"use strict";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const html          = document.documentElement;
const logo          = document.getElementById("logo");
const themeToggle   = document.getElementById("theme-toggle");
const themeIcon     = document.getElementById("theme-icon");
const textInput     = document.getElementById("text-input");
const excludeSpaces = document.getElementById("exclude-spaces");
const setLimit      = document.getElementById("set-limit");
const limitValue    = document.getElementById("limit-value");
const limitWarning  = document.getElementById("limit-warning");
const limitWarnText = document.getElementById("limit-warning-text");
const charCountEl   = document.getElementById("char-count");
const wordCountEl   = document.getElementById("word-count");
const sentenceCountEl = document.getElementById("sentence-count");
const readingTimeEl = document.getElementById("reading-time-value");
const densityList   = document.getElementById("density-list");
const densityEmpty  = document.getElementById("density-empty");
const seeMoreBtn    = document.getElementById("see-more-btn");

const DARK_LOGO  = "assets/logos/white-logo.png";
const LIGHT_LOGO = "assets/logos/dark-logo.png";
const MOON_ICON  = "assets/icons/moon-02.svg";
const SUN_ICON   = "assets/icons/settings Icon.svg";

const DENSITY_INITIAL_ROWS = 5;
let allDensityRows = [];
let showingAll = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Pad a number to at least 2 digits (e.g. 4 → "04", 278 → "278")
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return n < 10 ? "0" + n : String(n);
}

/**
 * Compute approx. reading time string from word count.
 * Average reading speed: ~200 words per minute.
 * @param {number} words
 * @returns {string}
 */
function readingTime(words) {
  if (words === 0) return "<1 minute";
  const mins = Math.ceil(words / 200);
  return mins === 1 ? "1 minute" : `${mins} minutes`;
}

/**
 * Count sentences: split on terminal punctuation sequences (. ! ?),
 * ignoring empty segments.
 * @param {string} text
 * @returns {number}
 */
function countSentences(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const segments = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return segments.length;
}

/**
 * Count words: non-whitespace sequences.
 * @param {string} text
 * @returns {number}
 */
function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Build letter frequency map from text (A–Z only, case-insensitive).
 * Returns array sorted by frequency descending.
 * @param {string} text
 * @returns {{ letter: string, count: number, percent: string }[]}
 */
function letterDensity(text) {
  const freq = {};
  const total = { count: 0 };

  for (const ch of text.toUpperCase()) {
    if (ch >= "A" && ch <= "Z") {
      freq[ch] = (freq[ch] || 0) + 1;
      total.count++;
    }
  }

  if (total.count === 0) return [];

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([letter, count]) => ({
      letter,
      count,
      percent: ((count / total.count) * 100).toFixed(2) + "%",
      raw: (count / total.count) * 100,
    }));
}

// ── Render letter density ─────────────────────────────────────────────────────

function renderDensity(rows, maxCount) {
  densityList.innerHTML = "";

  rows.forEach(({ letter, count, percent, raw }) => {
    const li = document.createElement("li");
    li.className = "density__item";

    const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

    li.innerHTML = `
      <span class="density__letter">${letter}</span>
      <div class="density__bar-track" role="presentation">
        <div
          class="density__bar-fill"
          style="width: ${barWidth}%"
          aria-label="${letter}: ${percent}"
        ></div>
      </div>
      <span class="density__count">${count} (${percent})</span>
    `;

    densityList.appendChild(li);
  });
}

function updateDensitySection(text) {
  allDensityRows = letterDensity(text);
  const maxCount = allDensityRows.length > 0 ? allDensityRows[0].count : 0;

  if (allDensityRows.length === 0) {
    densityList.innerHTML = "";
    densityEmpty.hidden = false;
    seeMoreBtn.hidden = true;
    showingAll = false;
    return;
  }

  densityEmpty.hidden = true;

  if (allDensityRows.length > DENSITY_INITIAL_ROWS) {
    seeMoreBtn.hidden = false;
    if (showingAll) {
      renderDensity(allDensityRows, maxCount);
    } else {
      renderDensity(allDensityRows.slice(0, DENSITY_INITIAL_ROWS), maxCount);
    }
  } else {
    seeMoreBtn.hidden = true;
    renderDensity(allDensityRows, maxCount);
  }
}

// ── Core analyze ──────────────────────────────────────────────────────────────

function analyze() {
  const text = textInput.value;

  // ── Character count ────────────────────────────────────────────────────────
  const charText = excludeSpaces.checked ? text.replace(/\s/g, "") : text;
  const chars = charText.length;
  charCountEl.textContent = pad(chars);

  // ── Word count ─────────────────────────────────────────────────────────────
  const words = countWords(text);
  wordCountEl.textContent = pad(words);

  // ── Sentence count ─────────────────────────────────────────────────────────
  const sentences = countSentences(text);
  sentenceCountEl.textContent = pad(sentences);

  // ── Reading time ───────────────────────────────────────────────────────────
  readingTimeEl.textContent = readingTime(words);

  // ── Character limit check ──────────────────────────────────────────────────
  if (setLimit.checked) {
    const limit = parseInt(limitValue.value, 10);
    if (!isNaN(limit) && limit > 0) {
      if (chars > limit) {
        textInput.classList.add("over-limit");
        limitWarning.hidden = false;
        limitWarnText.textContent = `Limit reached! Your text exceeds ${limit} characters.`;
      } else {
        textInput.classList.remove("over-limit");
        limitWarning.hidden = true;
      }
    } else {
      textInput.classList.remove("over-limit");
      limitWarning.hidden = true;
    }
  }

  // ── Letter density ─────────────────────────────────────────────────────────
  updateDensitySection(text);
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function applyTheme(theme) {
  html.dataset.theme = theme;
  const isDark = theme === "dark";
  logo.src = isDark ? DARK_LOGO : LIGHT_LOGO;
  themeIcon.src = isDark ? SUN_ICON : MOON_ICON;
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
  localStorage.setItem("cc-theme", theme);
}

function toggleTheme() {
  const current = html.dataset.theme === "dark" ? "dark" : "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ── Init theme from localStorage ──────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem("cc-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  // Priority: saved → OS preference → dark default
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);
})();

// ── Event listeners ───────────────────────────────────────────────────────────

// Theme toggle
themeToggle.addEventListener("click", toggleTheme);



// Text input
textInput.addEventListener("input", analyze);

// Exclude spaces checkbox
excludeSpaces.addEventListener("change", analyze);

// Set character limit checkbox
setLimit.addEventListener("change", () => {
  if (setLimit.checked) {
    limitValue.hidden = false;
    limitValue.focus();
  } else {
    limitValue.hidden = true;
    limitValue.value = "";
    textInput.classList.remove("over-limit");
    limitWarning.hidden = true;
  }
  analyze();
});

// Limit value input
limitValue.addEventListener("input", analyze);

// See more / see less
seeMoreBtn.addEventListener("click", () => {
  showingAll = !showingAll;
  const maxCount = allDensityRows.length > 0 ? allDensityRows[0].count : 0;

  const btnLabel = seeMoreBtn.querySelector(".see-more-btn__label");
  if (showingAll) {
    renderDensity(allDensityRows, maxCount);
    seeMoreBtn.setAttribute("aria-expanded", "true");
    if (btnLabel) btnLabel.textContent = "See less";
  } else {
    renderDensity(allDensityRows.slice(0, DENSITY_INITIAL_ROWS), maxCount);
    seeMoreBtn.setAttribute("aria-expanded", "false");
    if (btnLabel) btnLabel.textContent = "See more";
  }
});

// Run initial analysis to set "00" states
analyze();
