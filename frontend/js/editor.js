"use strict";

const editorSections = document.querySelector("#editor-sections");
const editorForm = document.querySelector("#full-editor-form");
const editorMessage = document.querySelector("#editor-message");
let workingPortfolio;
let savedPortfolio;
let arrayItemTemplates = new Map();

const sectionDefinitions = [
  {
    title: "Profile & contact",
    description: "Name, role, introduction, and public contact details.",
    keys: [
      "display_name",
      "formal_name",
      "role",
      "tagline",
      "location",
      "email",
      "github",
      "linkedin",
      "facebook",
      "cv_path",
      "logo_dark_path",
      "logo_light_path",
      "favicon_path",
      "og_image_path",
      "introduction",
    ],
  },
  { title: "About", description: "Your about section paragraphs.", keys: ["about"] },
  {
    title: "Career highlights",
    description: "The summary cards shown beneath the home section.",
    keys: ["highlights"],
  },
  {
    title: "Experience",
    description: "Roles, employers, dates, responsibilities, and technologies.",
    keys: ["experience"],
  },
  {
    title: "Skills",
    description: "Skill group titles, descriptions, and items.",
    keys: ["skills"],
  },
  {
    title: "Projects",
    description: "Project descriptions, features, links, and technology stacks.",
    keys: ["projects"],
  },
  {
    title: "Education & training",
    description: "Education and professional training details.",
    keys: ["education", "training"],
  },
  {
    title: "Knowledge sharing",
    description: "Topics and descriptions in the knowledge section.",
    keys: ["knowledge_sharing"],
  },
];

const labels = {
  display_name: "Display name",
  formal_name: "Formal name",
  role: "Role / title",
  tagline: "Tagline",
  location: "Location",
  email: "Public email",
  github: "GitHub URL",
  linkedin: "LinkedIn URL",
  facebook: "Facebook URL",
  cv_path: "CV link",
  logo_dark_path: "Dark website logo",
  logo_light_path: "Light website logo",
  favicon_path: "Browser favicon",
  og_image_path: "Open Graph image",
  introduction: "Introduction",
  about: "About paragraphs",
  highlights: "Career highlights",
  experience: "Experience entries",
  skills: "Skill groups",
  projects: "Projects",
  education: "Education entries",
  training: "Training entries",
  knowledge_sharing: "Knowledge topics",
  company: "Company",
  qualification: "Qualification",
  institution: "Institution",
  period: "Period",
  result: "Result",
  details: "Details",
  provider: "Provider",
  category: "Category",
  status: "Status",
  description: "Description",
  responsibilities: "Responsibilities",
  technologies: "Technologies",
  items: "Items",
  features: "Features",
  stack: "Technology stack",
  link: "Project URL",
  link_label: "Project link label",
  value: "Value",
  label: "Label",
  title: "Title",
};

const addLabels = {
  about: "About paragraph",
  highlights: "highlight",
  experience: "experience",
  skills: "skill group",
  projects: "project",
  education: "education entry",
  training: "course / training",
  knowledge_sharing: "knowledge topic",
  responsibilities: "responsibility",
  technologies: "technology",
  items: "skill",
  features: "feature",
  stack: "technology",
};

const humanize = (value) =>
  labels[value] ||
  value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const showMessage = (message, isError = false) => {
  editorMessage.textContent = message;
  editorMessage.classList.toggle("is-error", isError);
  editorMessage.hidden = false;
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || `Request failed (${response.status}).`);
  return payload;
};

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

const rememberArrayTemplates = (value, path = []) => {
  if (Array.isArray(value)) {
    if (value.length) {
      arrayItemTemplates.set(JSON.stringify(path), cloneValue(value[0]));
      rememberArrayTemplates(value[0], [...path, 0]);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      rememberArrayTemplates(child, [...path, key]);
    }
  }
};

const emptyValue = (template) => {
  if (Array.isArray(template)) return [];
  if (template && typeof template === "object") {
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [key, emptyValue(value)]),
    );
  }
  return typeof template === "string" ? "" : template;
};

const templatePathKey = (path) =>
  JSON.stringify(path.map((part) => (Number.isInteger(part) ? 0 : part)));

const createTextField = (path, value, fieldName) => {
  const label = document.createElement("label");
  label.className = "editor-field";
  const index = path.at(-1);
  const fieldLabel = Number.isInteger(index)
    ? `${humanize(fieldName)} ${String(index + 1).padStart(2, "0")}`
    : humanize(fieldName);
  label.append(document.createTextNode(fieldLabel));

  const input =
    value.length > 100 || value.includes("\n")
      ? document.createElement("textarea")
      : document.createElement("input");
  input.value = value;
  input.dataset.path = JSON.stringify(path);
  input.maxLength = 5000;
  input.rows = Math.min(7, Math.max(3, Math.ceil(value.length / 95)));
  label.append(input);
  return label;
};

const appendEditableValue = (container, value, path, key) => {
  if (typeof value === "string") {
    container.append(createTextField(path, value, key));
    return;
  }

  if (Array.isArray(value)) {
    const list = document.createElement("div");
    list.className = "editor-list";
    list.setAttribute("aria-label", humanize(key));
    list.dataset.arrayPath = JSON.stringify(path);
    value.forEach((item, index) => {
      const itemCard = document.createElement("section");
      itemCard.className = "editor-item";
      const itemHeader = document.createElement("div");
      itemHeader.className = "editor-item-header";
      const itemActions = document.createElement("div");
      itemActions.className = "editor-item-actions";
      const heading = document.createElement("h3");
      heading.textContent = `${humanize(key)} ${String(index + 1).padStart(2, "0")}`;
      const moveUpButton = document.createElement("button");
      moveUpButton.className = "editor-move-button";
      moveUpButton.type = "button";
      moveUpButton.textContent = "↑";
      moveUpButton.title = "Move up";
      moveUpButton.setAttribute("aria-label", `Move ${humanize(key)} ${index + 1} up`);
      moveUpButton.dataset.movePath = JSON.stringify(path);
      moveUpButton.dataset.moveIndex = String(index);
      moveUpButton.dataset.moveDelta = "-1";
      moveUpButton.disabled = index === 0;
      const moveDownButton = document.createElement("button");
      moveDownButton.className = "editor-move-button";
      moveDownButton.type = "button";
      moveDownButton.textContent = "↓";
      moveDownButton.title = "Move down";
      moveDownButton.setAttribute("aria-label", `Move ${humanize(key)} ${index + 1} down`);
      moveDownButton.dataset.movePath = JSON.stringify(path);
      moveDownButton.dataset.moveIndex = String(index);
      moveDownButton.dataset.moveDelta = "1";
      moveDownButton.disabled = index === value.length - 1;
      const dragHandle = document.createElement("button");
      dragHandle.className = "editor-drag-handle";
      dragHandle.type = "button";
      dragHandle.textContent = "↕";
      dragHandle.title = "Drag to reorder";
      dragHandle.setAttribute("aria-label", `Drag to reorder ${humanize(key)} ${index + 1}`);
      const removeButton = document.createElement("button");
      removeButton.className = "editor-remove-button";
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.dataset.removePath = JSON.stringify(path);
      removeButton.dataset.removeIndex = String(index);
      removeButton.disabled =
        path.length === 1 && path[0] === "about" && value.length === 1;
      itemActions.append(moveUpButton, moveDownButton, dragHandle, removeButton);
      itemHeader.append(heading, itemActions);
      itemCard.append(itemHeader);
      itemCard.dataset.itemPath = JSON.stringify(path);
      itemCard.dataset.itemIndex = String(index);
      appendEditableValue(itemCard, item, [...path, index], key);
      list.append(itemCard);
    });
    const addButton = document.createElement("button");
    addButton.className = "editor-add-button";
    addButton.type = "button";
    addButton.textContent = `+ Add ${addLabels[key] || humanize(key).toLowerCase()}`;
    addButton.dataset.addPath = JSON.stringify(path);
    addButton.disabled = value.length >= 50;
    list.append(addButton);
    container.append(list);
    return;
  }

  if (value && typeof value === "object") {
    const fields = document.createElement("div");
    fields.className = "editor-field-grid";
    for (const [childKey, childValue] of Object.entries(value)) {
      appendEditableValue(fields, childValue, [...path, childKey], childKey);
    }
    container.append(fields);
  }
};

const readEditorValues = () => {
  editorForm.querySelectorAll("[data-path]").forEach((field) => {
    setPath(workingPortfolio, JSON.parse(field.dataset.path), field.value);
  });
};

const renderEditor = () => {
  for (const definition of sectionDefinitions) {
    const section = document.createElement("section");
    section.className = "editor-section";
    const heading = document.createElement("h2");
    heading.textContent = definition.title;
    const description = document.createElement("p");
    description.className = "editor-section-description";
    description.textContent = definition.description;
    const content = document.createElement("div");
    content.className = "editor-field-grid";
    section.append(heading, description);
    for (const key of definition.keys) {
      appendEditableValue(content, workingPortfolio[key], [key], key);
    }
    section.append(content);
    editorSections.append(section);
  }
};

const setPath = (object, path, value) => {
  const [key, ...remaining] = path;
  if (remaining.length === 0) {
    object[key] = value;
    return;
  }
  setPath(object[key], remaining, value);
};

const getArrayAtPath = (object, path) =>
  path.reduce((current, key) => current[key], object);

const reorderItems = (sourcePath, sourceIndex, destinationIndex) => {
  if (sourceIndex === destinationIndex) return;
  const pathKey = JSON.stringify(sourcePath);
  const currentList = [...editorForm.querySelectorAll(".editor-list")].find(
    (list) => list.dataset.arrayPath === pathKey,
  );
  if (!currentList) return;

  const oldPositions = [...currentList.querySelectorAll(":scope > .editor-item")].map(
    (item) => item.getBoundingClientRect().top,
  );
  const scrollTop = window.scrollY;
  const oldIndexes = oldPositions.map((_, index) => index);
  readEditorValues();
  const list = getArrayAtPath(workingPortfolio, sourcePath);
  const [movedItem] = list.splice(sourceIndex, 1);
  const [movedIndex] = oldIndexes.splice(sourceIndex, 1);
  list.splice(destinationIndex, 0, movedItem);
  oldIndexes.splice(destinationIndex, 0, movedIndex);

  editorSections.replaceChildren();
  renderEditor();
  window.scrollTo(0, scrollTop);
  showMessage("Item order changed. Save and publish to update your website.");
  const updatedList = [...editorForm.querySelectorAll(".editor-list")].find(
    (item) => item.dataset.arrayPath === pathKey,
  );
  if (!updatedList || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  [...updatedList.querySelectorAll(":scope > .editor-item")].forEach((item, index) => {
    const newTop = item.getBoundingClientRect().top;
    const offset = oldPositions[oldIndexes[index]] - newTop;
    if (offset) {
      item.animate(
        [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }],
        { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    }
    if (index === destinationIndex) {
      item.classList.remove("just-moved");
      requestAnimationFrame(() => item.classList.add("just-moved"));
    }
  });
};

let pointerDrag;
const clearDragStyles = () => {
  editorForm.querySelectorAll(".is-dragging, .is-drop-target, .drop-before, .drop-after").forEach((item) => {
    item.classList.remove("is-dragging", "is-drop-target", "drop-before", "drop-after");
  });
  document.body.classList.remove("is-reordering");
};

editorForm.addEventListener("pointerdown", (event) => {
  const handle = event.target.closest(".editor-drag-handle");
  if (!handle) return;
  const item = handle.closest(".editor-item");
  const label = item.querySelector(".editor-field input, .editor-field textarea")?.value.trim();
  const preview = document.createElement("div");
  preview.className = "editor-drag-preview";
  const previewLabel = document.createElement("span");
  previewLabel.textContent = "REORDERING";
  const previewTitle = document.createElement("strong");
  previewTitle.textContent = label || item.querySelector(".editor-item-header h3").textContent;
  preview.append(previewLabel, previewTitle);
  document.body.append(preview);
  pointerDrag = {
    path: JSON.parse(item.dataset.itemPath),
    pathKey: item.dataset.itemPath,
    index: Number(item.dataset.itemIndex),
    targetIndex: null,
    preview,
  };
  item.classList.add("is-dragging");
  document.body.classList.add("is-reordering");
  updateDragPreview(event.clientX, event.clientY);
  event.preventDefault();
});

const updateDragPreview = (clientX, clientY) => {
  const { width, height } = pointerDrag.preview.getBoundingClientRect();
  const left = Math.max(8, Math.min(clientX + 16, window.innerWidth - width - 8));
  const top = Math.max(8, Math.min(clientY + 16, window.innerHeight - height - 8));
  pointerDrag.preview.style.transform = `translate3d(${left}px, ${top}px, 0)`;
};

document.addEventListener("pointermove", (event) => {
  if (!pointerDrag) return;
  event.preventDefault();
  updateDragPreview(event.clientX, event.clientY);
  editorForm.querySelectorAll(".is-drop-target").forEach((item) => {
    item.classList.remove("is-drop-target", "drop-before", "drop-after");
  });
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(".editor-item");
  if (!target || target.dataset.itemPath !== pointerDrag.pathKey) {
    pointerDrag.targetIndex = null;
    return;
  }
  target.classList.add("is-drop-target");
  pointerDrag.targetIndex = Number(target.dataset.itemIndex);
  pointerDrag.targetRect = target.getBoundingClientRect();
  pointerDrag.clientY = event.clientY;
  const insertAfter = event.clientY >= pointerDrag.targetRect.top + pointerDrag.targetRect.height / 2;
  target.classList.add(insertAfter ? "drop-after" : "drop-before");
});

document.addEventListener("pointerup", () => {
  if (!pointerDrag) return;
  const drag = pointerDrag;
  pointerDrag = null;
  drag.preview.classList.add("is-releasing");
  window.setTimeout(() => drag.preview.remove(), 150);
  clearDragStyles();
  if (drag.targetIndex !== null) {
    const insertAfter = drag.clientY >= drag.targetRect.top + drag.targetRect.height / 2;
    let destinationIndex = drag.targetIndex + (insertAfter ? 1 : 0);
    if (drag.index < destinationIndex) destinationIndex -= 1;
    reorderItems(drag.path, drag.index, destinationIndex);
  }
});

document.addEventListener("pointercancel", () => {
  pointerDrag?.preview.remove();
  pointerDrag = null;
  clearDragStyles();
});

editorForm.addEventListener("click", (event) => {
  const moveButton = event.target.closest("[data-move-path]");
  const addButton = event.target.closest("[data-add-path]");
  const removeButton = event.target.closest("[data-remove-path]");
  if (!moveButton && !addButton && !removeButton) return;

  if (moveButton) {
    const path = JSON.parse(moveButton.dataset.movePath);
    const sourceIndex = Number(moveButton.dataset.moveIndex);
    const destinationIndex = sourceIndex + Number(moveButton.dataset.moveDelta);
    const list = getArrayAtPath(workingPortfolio, path);
    if (destinationIndex < 0 || destinationIndex >= list.length) return;
    reorderItems(path, sourceIndex, destinationIndex);
    return;
  }

  readEditorValues();
  if (addButton) {
    const path = JSON.parse(addButton.dataset.addPath);
    const list = getArrayAtPath(workingPortfolio, path);
    if (list.length >= 50) return;
    const template = arrayItemTemplates.get(templatePathKey(path));
    if (template === undefined) {
      showMessage("This list has no item template. Add an item to the list first.", true);
      return;
    }
    list.push(emptyValue(template));
  } else {
    const path = JSON.parse(removeButton.dataset.removePath);
    getArrayAtPath(workingPortfolio, path).splice(Number(removeButton.dataset.removeIndex), 1);
  }

  editorSections.replaceChildren();
  renderEditor();
  editorMessage.hidden = true;
});

request("/api/admin/session")
  .then(({ authenticated }) => {
    if (!authenticated) {
      window.location.replace("/myterminal");
      return null;
    }
    return request("/api/admin/profile");
  })
  .then((portfolio) => {
    if (portfolio) {
      workingPortfolio = portfolio;
      savedPortfolio = cloneValue(portfolio);
      rememberArrayTemplates(portfolio);
      renderEditor();
      editorForm.hidden = false;
    }
  })
  .catch((error) => {
    showMessage(error.message, true);
  });

  document.querySelector("#reset-editor-button").addEventListener("click", async (event) => {
    readEditorValues();
    if (
      JSON.stringify(workingPortfolio) !== JSON.stringify(savedPortfolio) &&
      !window.confirm("Discard your unsaved changes and reset the editor to the last saved portfolio?")
    ) {
      return;
    }

    const resetButton = event.currentTarget;
    resetButton.disabled = true;
    try {
      workingPortfolio = await request("/api/admin/profile");
      savedPortfolio = cloneValue(workingPortfolio);
      editorSections.replaceChildren();
      renderEditor();
      showMessage("Editor reset to the last saved portfolio.");
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      resetButton.disabled = false;
    }
  });

  editorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  editorMessage.hidden = true;
  const saveButton = editorForm.querySelector('button[type="submit"]');
  saveButton.disabled = true;

  try {
    readEditorValues();
    workingPortfolio = await request("/api/admin/full-portfolio", {
      method: "PUT",
      body: JSON.stringify(workingPortfolio),
    });
    savedPortfolio = cloneValue(workingPortfolio);
    showMessage("All portfolio text saved and published.");
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    saveButton.disabled = false;
  }
});
