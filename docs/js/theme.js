"use strict";

const themeStorageKey = "portfolio-theme";
const storedTheme = localStorage.getItem(themeStorageKey);
const initialTheme = storedTheme === "light" ? "light" : "dark";

document.documentElement.dataset.theme = initialTheme;

const themeIconMarkup = `
  <svg class="theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3.75"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>
  </svg>
  <svg class="theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20.6 14.1A8.7 8.7 0 0 1 9.9 3.4a8.7 8.7 0 1 0 10.7 10.7Z"/>
  </svg>`;

const updateThemeButtons = (theme) => {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = nextTheme === "light" ? "Light" : "Dark";
    button.setAttribute("aria-label", `Switch to ${label.toLowerCase()} theme`);
    button.setAttribute("title", `Switch to ${label.toLowerCase()} theme`);
    button.setAttribute("aria-pressed", String(theme === "light"));
    const icon = button.querySelector("[data-theme-icon]");
    if (!icon.querySelector("svg")) icon.innerHTML = themeIconMarkup;
    icon.dataset.nextTheme = nextTheme;
    button.querySelector("[data-theme-label]").textContent = label;
  });
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, theme);
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "light" ? "#e8eff1" : "#080d16";
  updateThemeButtons(theme);
};

document.addEventListener("DOMContentLoaded", () => {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = initialTheme === "light" ? "#e8eff1" : "#080d16";
  updateThemeButtons(initialTheme);
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentTheme = document.documentElement.dataset.theme;
      setTheme(currentTheme === "dark" ? "light" : "dark");
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === themeStorageKey && (event.newValue === "light" || event.newValue === "dark")) {
      document.documentElement.dataset.theme = event.newValue;
      const themeColor = document.querySelector('meta[name="theme-color"]');
      if (themeColor) themeColor.content = event.newValue === "light" ? "#e8eff1" : "#080d16";
      updateThemeButtons(event.newValue);
    }
  });
});
