"use strict";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginMessage = document.querySelector("#login-message");
const settingsMessage = document.querySelector("#settings-message");
const settingsForm = document.querySelector("#settings-form");

document.querySelectorAll(".project-menu").forEach((menu) => {
  menu.addEventListener("mouseenter", () => {
    menu.open = true;
  });
  menu.addEventListener("mouseleave", () => {
    menu.open = false;
  });
  menu.addEventListener("click", (event) => {
    if (
      event.target.closest("summary") &&
      window.matchMedia("(hover: hover)").matches &&
      menu.matches(":hover")
    ) {
      event.preventDefault();
    }
  });
});

const showMessage = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
  element.hidden = false;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const payload = response.status === 204 ? {} : await response.json();
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status}).`);
  return payload;
};

const showDashboard = (profile) => {
  loginView.hidden = true;
  dashboardView.hidden = false;
  for (const [name, value] of Object.entries(profile)) {
    const field =
      settingsForm.elements.namedItem(name) ??
      document.querySelector(`[name="${name}"]`);
    if (!field) continue;
    if (name === "about") {
      field.value = value.join("\n\n");
    } else if (
      name === "photo_path" ||
      name === "logo_path" ||
      name === "logo_dark_path" ||
      name === "logo_light_path" ||
      name === "favicon_path" ||
      name === "og_image_path"
    ) {
      field.value = value;
      updateImagePreview(name, value);
    } else if (typeof value === "string") {
      field.value = value;
    }
  }
  document.querySelectorAll('input[type="file"][data-image-kind]').forEach((input) => {
    input.value = "";
    document.querySelector(`[data-upload-kind="${input.dataset.imageKind}"]`).disabled = true;
    const label = document.querySelector(`[data-choose-label="${input.dataset.imageKind}"]`);
    label.textContent = input.dataset.imageKind.startsWith("logo-") ? "Choose logo" :
      input.dataset.imageKind === "og-image" ? "Choose image" :
      `Choose ${input.dataset.imageKind}`;
    label.title = "";
  });
};

const updateImagePreview = (fieldName, path) => {
  const imageIds = {
    logo_path: "#logo-preview",
    logo_dark_path: "#logo-dark-preview",
    logo_light_path: "#logo-light-preview",
    photo_path: "#photo-preview",
    favicon_path: "#favicon-preview",
    og_image_path: "#og-image-preview",
  };
  const image = document.querySelector(imageIds[fieldName]);
  if (!image) return;
  image.hidden = !path;
  if (path) image.src = path;
  else image.removeAttribute("src");
};

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const loginForm = event.currentTarget;
  loginMessage.hidden = true;
  const form = new FormData(loginForm);
  try {
    await request("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    loginForm.reset();
    showDashboard(await request("/api/admin/profile"));
  } catch (error) {
    showMessage(loginMessage, error.message, true);
  }
});

document.querySelectorAll('input[type="file"][data-image-kind]').forEach((input) => {
  const imageKind = input.dataset.imageKind;
  const uploadButton = document.querySelector(`[data-upload-kind="${imageKind}"]`);
  const chooseLabel = document.querySelector(`[data-choose-label="${imageKind}"]`);
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    uploadButton.disabled = !file;
    chooseLabel.textContent = file ? file.name : `Choose ${imageKind}`;
    chooseLabel.title = file?.name || "";
  });

  uploadButton.addEventListener("click", async () => {
    const file = input.files?.[0];
    if (!file) return;
    const fieldNames = {
      logo: "logo_path",
      "logo-dark": "logo_dark_path",
      "logo-light": "logo_light_path",
      photo: "photo_path",
      favicon: "favicon_path",
      "og-image": "og_image_path",
    };
    const fieldName = fieldNames[imageKind];
    const uploadData = new FormData();
    uploadData.append("file", file);
    input.disabled = true;
    uploadButton.disabled = true;
    uploadButton.textContent = "Uploading…";
    showMessage(settingsMessage, `Uploading ${imageKind}…`);
    try {
      const result = await request(`/api/admin/upload/${imageKind}`, {
        method: "POST",
        body: uploadData,
      });
      document.querySelector(`[name="${fieldName}"]`).value = result.path;
      updateImagePreview(fieldName, result.path);
      const imageName = {
        logo: "Logo",
        "logo-dark": "Dark website logo",
        "logo-light": "Light website logo",
        photo: "Profile photo",
        favicon: "Favicon",
        "og-image": "Open Graph image",
      }[imageKind];
      showMessage(settingsMessage, `${imageName} uploaded. Save settings to publish it.`);
    } catch (error) {
      showMessage(settingsMessage, error.message, true);
    } finally {
      input.disabled = false;
      uploadButton.disabled = true;
      uploadButton.textContent = "Upload";
    }
  });
});

settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  settingsMessage.hidden = true;
  const form = new FormData(settingsForm);
  const profile = Object.fromEntries(form.entries());
  profile.logo_path = document.querySelector('[name="logo_path"]').value;
  profile.logo_dark_path = document.querySelector('[name="logo_dark_path"]').value;
  profile.logo_light_path = document.querySelector('[name="logo_light_path"]').value;
  profile.photo_path = document.querySelector('[name="photo_path"]').value;
  profile.favicon_path = document.querySelector('[name="favicon_path"]').value;
  profile.og_image_path = document.querySelector('[name="og_image_path"]').value;
  profile.about = String(profile.about)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  try {
    const savedProfile = await request("/api/admin/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    showDashboard(savedProfile);
    showMessage(settingsMessage, "Settings saved and published.");
  } catch (error) {
    showMessage(settingsMessage, error.message, true);
  }
});

document.querySelector("#reset-settings-button").addEventListener("click", async (event) => {
  if (!window.confirm("Discard your unsaved changes and reset settings to the last saved version?")) {
    return;
  }
  const resetButton = event.currentTarget;
  resetButton.disabled = true;
  settingsMessage.hidden = true;
  try {
    const savedProfile = await request("/api/admin/profile");
    settingsForm.reset();
    showDashboard(savedProfile);
    showMessage(settingsMessage, "Settings reset to the last saved version.");
  } catch (error) {
    showMessage(settingsMessage, error.message, true);
  } finally {
    resetButton.disabled = false;
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  try {
    await request("/api/admin/logout", { method: "POST" });
    dashboardView.hidden = true;
    loginView.hidden = false;
    showMessage(loginMessage, "You have signed out.");
  } catch (error) {
    showMessage(settingsMessage, error.message, true);
  }
});

request("/api/admin/session")
  .then(({ authenticated }) =>
    authenticated ? request("/api/admin/profile").then(showDashboard) : undefined,
  )
  .catch((error) => {
    if (!error.message.includes("401")) {
      showMessage(loginMessage, error.message, true);
    }
  });
