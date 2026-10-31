"use strict";

const themeStorageKey = "portfolio-theme";
const storedTheme = localStorage.getItem(themeStorageKey);
const initialTheme = storedTheme === "light" ? "light" : "dark";

document.documentElement.dataset.theme = initialTheme;

const updateThemeButtons = (theme) => {
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = nextTheme === "light" ? "Light" : "Dark";
    button.setAttribute("aria-label", `Switch to ${label.toLowerCase()} theme`);
    button.setAttribute("title", `Switch to ${label.toLowerCase()} theme`);
    button.setAttribute("aria-pressed", String(theme === "light"));
    button.querySelector("[data-theme-icon]").textContent = nextTheme === "light" ? "☼" : "☾";
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
