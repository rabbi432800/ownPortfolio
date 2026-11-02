"use strict";

const supportedLanguages = ["ENG", "DE", "BN"];
const savedLanguage = localStorage.getItem("portfolio-language");
const activeLanguage = supportedLanguages.includes(savedLanguage) ? savedLanguage : "ENG";
const translations = window.PORTFOLIO_TRANSLATIONS;

const translateText = (text, language = activeLanguage) =>
  language === "ENG" ? text : translations[language]?.[text] || text;

const translatePortfolioData = (value) => {
  if (typeof value === "string") return translateText(value);
  if (Array.isArray(value)) return value.map(translatePortfolioData);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, translatePortfolioData(item)]),
    );
  }
  return value;
};

const applyPageLanguage = () => {
  document.documentElement.lang = activeLanguage === "BN" ? "bn" : activeLanguage === "DE" ? "de" : "en";
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === activeLanguage));
  });

  const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (textNodes.nextNode()) {
    const node = textNodes.currentNode;
    const original = node.nodeValue;
    const trimmed = original.trim();
    if (!trimmed) continue;
    const translated = translateText(trimmed);
    if (translated !== trimmed) {
      const start = original.indexOf(trimmed);
      node.nodeValue = `${original.slice(0, start)}${translated}${original.slice(start + trimmed.length)}`;
    }
  }

  document.querySelectorAll("[aria-label], [title], [placeholder], [alt]").forEach((element) => {
    for (const attribute of ["aria-label", "title", "placeholder", "alt"]) {
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, translateText(value));
    }
  });
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const renderTags = (items) =>
  `<div class="tag-list">${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;

const renderDetails = (content) => `
  <details class="card-details">
    <summary><span class="details-show">${escapeHtml(translateText("View details"))}</span><span class="details-hide">${escapeHtml(translateText("Hide details"))}</span><span class="details-chevron" aria-hidden="true">⌄</span></summary>
    <div class="card-details-body">${content}</div>
  </details>`;


const renderLearningIcon = (title, education = false, watermarkOnly = false) => {
  if (!education && /CCNA/i.test(title)) {
    const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3v7m0-7-3 3m3-3 3 3M16 29v-7m0 7-3-3m3 3 3-3M3 16h7m-7 0 3-3m-3 3 3 3M29 16h-7m7 0-3-3m3 3-3 3"/><rect x="9" y="10" width="14" height="12" rx="3"/><path d="M12 14h8M12 18h3"/><circle cx="19" cy="18" r=".7" fill="currentColor" stroke="none"/></svg>`;
    return `${watermarkOnly ? "" : `<span class="learning-icon ccna-icon" aria-hidden="true">${icon}</span>`}<span class="learning-watermark" aria-hidden="true">${icon}</span>`;
  }
  if (!education && /linux/i.test(title)) {
    const logo = '<img src="./assets/technologies/linux.svg" alt="" width="24" height="24" aria-hidden="true">';
    return `${watermarkOnly ? "" : `<span class="learning-icon" aria-hidden="true">${logo}</span>`}<span class="learning-watermark" aria-hidden="true">${logo}</span>`;
  }
  const paths = education
    ? '<path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 9v7"/>'
    : /database|billing|oracle|sql|datenbank|ডেটাবেস|বিলিং/i.test(title)
      ? '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>'
    : /automation|monitor|appointment|automatis|অটোমেশন|অটোমেশন/i.test(title)
      ? '<path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z"/>'
    : /development|html|css|javascript|python|fastapi|code|entwicklung|ডেভেলপ|উন্নয়ন/i.test(title)
      ? '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>'
    : /cost|expense|finance|খরচ|ব্যয়/i.test(title)
      ? '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2m4 0h2m-8 4h2m4 0h2M8 18h2m4 0h2"/>'
    : /github/i.test(title)
      ? '<path d="M9 19c-5 1-5-3-7-3m14 6v-4c0-1-.3-2-1-2 4-.5 6-2 6-6 0-1.5-.5-3-1.5-4 .3-1 .3-2 0-3-2 0-3 1-4 1-2-.5-4-.5-6 0-1-1-2-1-4-1-.3 1-.3 2 0 3C4.5 7 4 8.5 4 10c0 4 2 5.5 6 6-.7.5-1 1-1 2v4"/>'
    : /mail|contact|যোগাযোগ/i.test(title)
      ? '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'
    : /CCNA|Linux|network|netzwerk|নেটওয়ার্ক/i.test(title)
      ? '<rect x="8" y="3" width="8" height="6" rx="1.5"/><path d="M12 9v5M5 14h14M5 14v3M19 14v3"/><rect x="2" y="17" width="6" height="4" rx="1"/><rect x="16" y="17" width="6" height="4" rx="1"/>'
      : /B1|German|Deutsch|language|জার্মান|ভাষা/i.test(title)
        ? '<path d="M4 4h16v12H9l-5 4V4Z"/><path d="M8 8h8M8 12h5"/>'
        : '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4M10 10h4v4h-4z"/>';
  const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  return `${watermarkOnly ? "" : `<span class="learning-icon" aria-hidden="true">${svg}</span>`}<span class="learning-watermark" aria-hidden="true">${svg}</span>`;
};

const technologyHighlights = [{"value": "Networking", "label": "Network Operations"}, {"value": "Linux", "label": "Server Operations"}, {"value": "Oracle Database", "label": "SQL & Data"}, {"value": "HTML", "label": "Web Structure"}, {"value": "CSS", "label": "Interface Styling"}, {"value": "JavaScript", "label": "Web Interactions"}, {"value": "Python", "label": "Scripting & Tools"}, {"value": "FastAPI", "label": "Backend APIs"}];

const highlightLogoPaths = {
  "Networking": "./assets/technologies/networking.svg",
  "Linux": "./assets/technologies/linux.svg",
  "Oracle Database": "./assets/technologies/oracle.svg",
  "HTML": "./assets/technologies/html5.svg",
  "CSS": "./assets/technologies/css3.svg",
  "JavaScript": "./assets/technologies/javascript.svg",
  "Python": "./assets/technologies/python.svg",
  "FastAPI": "./assets/technologies/fastapi.svg"
};


const renderInstituteLinks = (item) => {
  const icons = {
    location_url: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    website_url: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
    facebook_url: '<path d="M14 21v-8h3l.5-4H14V7c0-1.2.5-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8"/>',
  };
  return `<div class="institute-links">${Object.entries(icons).map(([field, path]) => {
    const label = translateText({location_url: "Location", website_url: "Website", facebook_url: "Facebook"}[field]);
    const icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
    let valid = false;
    try { const url = new URL(item[field]); valid = ["http:", "https:"].includes(url.protocol); } catch {}
    return valid
      ? `<a class="institute-link" href="${escapeHtml(item[field])}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${icon}</a>`
      : `<span class="institute-link is-unavailable" aria-disabled="true" title="${escapeHtml(label)} — ${escapeHtml(translateText("Link not added yet"))}">${icon}<span class="institute-link-label">${escapeHtml(label)} — ${escapeHtml(translateText("Link not added yet"))}</span></span>`;
  }).join("")}</div>`;
};

function renderPortfolio(data) {
  const highlightLogos = technologyHighlights.map((item) => highlightLogoPaths[item.value] || "");
  data = translatePortfolioData(data);
  document.title = `${data.display_name} | ${data.role}`;
  document.querySelector('meta[name="description"]').content = data.introduction;
  const githubDisplay = data.github.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const darkLogo = data.logo_dark_path || data.logo_path || data.logo_light_path;
  document.querySelectorAll(".brand-mark").forEach((mark) => {
    mark.hidden = data.show_logo === false;
    if (!mark.dataset.fallback) mark.dataset.fallback = mark.textContent;
    mark.replaceChildren();
    if (darkLogo) {
      const picture = document.createElement("picture");
      picture.className = "brand-mark-picture";
      if (data.logo_light_path) {
        const lightSource = document.createElement("source");
        lightSource.media = "(prefers-color-scheme: light)";
        lightSource.srcset = data.logo_light_path;
        picture.append(lightSource);
      }
      const image = document.createElement("img");
      image.src = darkLogo;
      image.alt = "";
      picture.append(image);
      mark.append(picture);
      mark.classList.add("brand-mark-image");
    } else {
      mark.textContent = mark.dataset.fallback;
      mark.classList.remove("brand-mark-image");
    }
  });
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href =
      data.favicon_path ||
      data.logo_dark_path ||
      data.logo_path ||
      data.logo_light_path ||
      "./assets/favicon.svg";
  }
  const socialImage = data.og_image_path
    ? new URL(data.og_image_path, document.baseURI).href
    : "";
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content = data.introduction;
  document.querySelector('meta[property="og:image"]').content = socialImage;
  document.querySelector('meta[name="twitter:title"]').content = document.title;
  document.querySelector('meta[name="twitter:description"]').content = data.introduction;
  document.querySelector('meta[name="twitter:image"]').content = socialImage;
  document.querySelector("#hero-name").textContent = data.display_name;
  document.querySelectorAll(".brand").forEach((brand) => {
    brand.setAttribute("aria-label", `${data.display_name} ${translateText("home")}`);
  });
  document.querySelector("#hero-role").textContent = translateText("Network Engineer");
  document.querySelector("#hero-tagline").textContent = data.tagline;
  document.querySelector("#hero-location").textContent = data.location;
  const heroPhoto = document.querySelector("#hero-photo");
  heroPhoto.src = data.photo_path || "./assets/uploads/photo-d68944b15c611e99f717b273.jpg";
  heroPhoto.alt = `${data.display_name} ${translateText("profile")}`;
  document.querySelectorAll("[data-name]").forEach((element) => {
    element.textContent = data.display_name;
  });
  document.querySelector("#github-link").href = data.github;
  const footerWhatsApp = document.querySelector("#footer-whatsapp");
  footerWhatsApp.hidden = !data.whatsapp;
  if (data.whatsapp) footerWhatsApp.href = data.whatsapp;
  const footerFacebook = document.querySelector("#footer-facebook");
  if (data.facebook) {
    footerFacebook.href = data.facebook;
    footerFacebook.hidden = false;
  }
  document.querySelector("#footer-github").href = data.github;
  const footerLinkedIn = document.querySelector("#footer-linkedin");
  if (data.linkedin) {
    footerLinkedIn.href = data.linkedin;
    footerLinkedIn.hidden = false;
  }
  const footerEmail = document.querySelector("#footer-email");
  if (data.email) {
    footerEmail.href = `mailto:${data.email}`;
  } else {
    footerEmail.hidden = true;
  }
  document.querySelector("#current-year").textContent = new Date().getFullYear();
  initializePortfolioTerminal(data);

  document.querySelector("#highlights-list").innerHTML = data.highlights
    .map((item) => `<div class="highlight"><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.label)}</span></div>`)
    .join("");

  document.querySelector("#technologies-list").innerHTML = translatePortfolioData(technologyHighlights)
    .map(
      (item, index) => `
        <div class="highlight">
          ${highlightLogos[index] ? `<img class="highlight-logo" src="${highlightLogos[index]}" alt="" aria-hidden="true" width="28" height="28">` : ""}
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.label)}</span>
        </div>`,
    )
    .join("");

  document.querySelector("#about-copy").innerHTML = `
    ${data.about.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    <a class="text-link" href="#experience">Explore my experience <span aria-hidden="true">↗</span></a>`;

  document.querySelector("#experience-list").innerHTML = data.experience
    .map((job, index) => `
      <article class="timeline-item">
        <details class="experience-card education-disclosure">
          <summary>
            ${renderLearningIcon("network", false, true)}
            <span class="experience-role">${escapeHtml(job.role)}</span>
            <span class="experience-company">${escapeHtml(job.company)}</span>
            <span class="experience-meta"><span class="tag">${escapeHtml(job.type)}</span><span class="experience-period">${escapeHtml(job.period)}</span></span>
            <span class="education-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div class="card-details-body">
            <p>${escapeHtml(job.description)}</p>
            <ul class="check-list">${job.responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            ${renderTags(job.technologies)}
          </div>
        </details>
      </article>`)
    .join("");

  document.querySelector("#skills-list").innerHTML = data.skills
    .map((group, index) => `
      <details class="skill-card education-disclosure">
        <summary>
          <span class="skill-card-top"><span class="skill-number">${String(index + 1).padStart(2, "0")}</span><span class="skill-symbol" aria-hidden="true">${["⌘", "⌁", "▤", "⌬"][index % 4]}</span></span>
          ${renderLearningIcon(group.category, false, true)}
          <span class="skill-card-title">${escapeHtml(group.category)}</span>
          <span class="education-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="card-details-body">
          <p>${escapeHtml(group.description)}</p>
          ${renderTags(group.items)}
        </div>
      </details>`)
    .join("");

  document.querySelector("#projects-list").innerHTML = data.projects
    .map((project, index) => `
      <details class="project-card education-disclosure">
        <summary>
          <span class="project-art project-art-${(index % 4) + 1}">
            <span class="project-art-index">PROJECT / ${String(index + 1).padStart(2, "0")}</span>
            ${renderLearningIcon([project.title, project.category, ...project.stack].join(" "), false, true)}
            <span class="project-category">${escapeHtml(project.category)}</span>
          </span>
          <span class="project-content">
            <span class="tag">${escapeHtml(project.status)}</span>
            <span class="project-card-title">${escapeHtml(project.title)}</span>
          </span>
          <span class="education-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="card-details-body">
          <p>${escapeHtml(project.description)}</p>
          <ul class="project-features">${project.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
          ${renderTags(project.stack)}
          ${project.link === "https://github.com/rabbi432800/ownPortfolio"
            ? `<a class="button button-secondary project-link project-live-demo" href="https://rabbi432800.github.io/ownPortfolio/" target="_blank" rel="noopener noreferrer">${escapeHtml(translateText("Live Demo"))} <span aria-hidden="true">↗</span></a>`
            : ""}
          ${project.link
            ? `<a class="${project.link === "https://github.com/rabbi432800/ownPortfolio" ? "button button-secondary project-link" : "text-link project-link"}" href="${escapeHtml(project.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.link_label)} <span aria-hidden="true">↗</span></a>`
            : '<span class="project-private-note">No public project link</span>'}
        </div>
      </details>`)
    .join("");

  document.querySelector("#education-list").innerHTML = data.education
    .map((item) => `
      <details class="education-card education-disclosure">
        <summary>
          ${renderLearningIcon(item.qualification, true)}
          <span class="education-period">${escapeHtml(item.period)}</span>
          <span class="education-card-title">${escapeHtml(item.qualification)}</span>
          <span class="education-institution">${escapeHtml(item.institution)}</span>
          <span class="education-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="card-details-body">
          ${renderInstituteLinks(item)}
          <p>${escapeHtml(item.details)}</p>
          <span class="education-result">${escapeHtml(item.result)}</span>
        </div>
      </details>`)
    .join("");

  document.querySelector("#training-list").innerHTML = data.training
    .map((item) => `
      <details class="education-card training-card education-disclosure">
        <summary>
          ${renderLearningIcon(item.name)}
          <span class="education-card-title">${escapeHtml(item.name)}</span>
          <span class="education-institution">${escapeHtml(item.provider)}</span>
          <span class="education-chevron" aria-hidden="true">⌄</span>
        </summary>
        <div class="card-details-body">${renderInstituteLinks(item)}
          <p>${escapeHtml(item.details)}</p></div>
      </details>`)
    .join("");

  document.querySelector("#knowledge-list").innerHTML = data.knowledge_sharing
    .map(
      (item, index) => `
        <article class="knowledge-card">
          ${renderLearningIcon(item.title, false, true)}
          <span class="knowledge-number">${String(index + 1).padStart(2, "0")}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
        </article>`,
    )
    .join("");

  const methods = [];
  if (data.email) {
    methods.push(`<a class="contact-method" href="mailto:${escapeHtml(data.email)}"><span aria-hidden="true">@</span><div><small>EMAIL</small><strong>${escapeHtml(data.email)}</strong></div><b aria-hidden="true">↗</b></a>`);
  } else {
    methods.push('<div class="contact-method"><span aria-hidden="true">@</span><div><small>EMAIL</small><strong>Email address not added yet</strong></div></div>');
  }
  methods.push(`<a class="contact-method" href="${escapeHtml(data.github)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span><div><small>GITHUB</small><strong>${escapeHtml(githubDisplay)}</strong></div><b aria-hidden="true">↗</b></a>`);
  if (data.linkedin) {
    methods.push(`<a class="contact-method" href="${escapeHtml(data.linkedin)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">in</span><div><small>LINKEDIN</small><strong>View LinkedIn profile</strong></div><b aria-hidden="true">↗</b></a>`);
  }
  if (data.facebook) {
    methods.push(`<a class="contact-method" href="${escapeHtml(data.facebook)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">f</span><div><small>FACEBOOK</small><strong>View Facebook profile</strong></div><b aria-hidden="true">↗</b></a>`);
  }
  if (data.whatsapp) {
    methods.push(`<a class="contact-method" href="${escapeHtml(data.whatsapp)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a9 9 0 0 1-13.3 8L3 21l1.5-4.7A9 9 0 1 1 21 11.5Z"/><path d="m8.2 7.3-1 1.2c-.8 2 3.5 6.4 5.8 6.6l1.6-.8.5-1.8-2.4-1.1-.9 1c-1.3-.6-2.2-1.6-2.8-2.8l1-.9-1-2.1Z"/></svg></span><div><small>WHATSAPP</small><strong>${escapeHtml(translateText("Chat on WhatsApp"))}</strong></div><b aria-hidden="true">↗</b></a>`);
  }
  document.querySelector("#contact-methods").innerHTML = methods.join("");
  document.querySelectorAll(".contact-method").forEach((card) => {
    card.insertAdjacentHTML("beforeend", renderLearningIcon("contact", false, true));
  });
  for (const [selector, topic] of [[".about-panel", "education"], [".contact-form", "mail"], [".github-banner", "github"]]) {
    const panel = document.querySelector(selector);
    panel.querySelector(":scope > .learning-watermark")?.remove();
    panel.insertAdjacentHTML("beforeend", renderLearningIcon(topic, selector === ".about-panel", true));
  }


  document.querySelector("#contact-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const feedback = document.querySelector("#form-feedback");
    if (!data.email) {
      feedback.hidden = false;
      feedback.classList.add("form-feedback-warning");
      feedback.textContent = translateText("Contact email is not configured. Add your email in backend/config.py before using this form.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const query = new URLSearchParams({
      subject: form.get("subject"),
      body: `Name: ${form.get("name")}\nReply email: ${form.get("email")}\n\n${form.get("message")}`,
    });
    window.location.href = `mailto:${encodeURIComponent(data.email)}?${query}`;
    feedback.hidden = false;
    feedback.classList.remove("form-feedback-warning");
    feedback.textContent = translateText("Your email application should open with the message prepared.");
  });

  applyPageLanguage();
}

function initializePortfolioTerminal(data) {
  const form = document.querySelector("#terminal-form");
  const input = document.querySelector("#terminal-input");
  const output = document.querySelector("#terminal-output");
  const prompt = document.querySelector(".terminal-prompt");
  const shell = document.querySelector("#terminal-shell");
  const launcher = document.querySelector("#terminal-launcher");
  const maximizeButton = document.querySelector("#terminal-maximize");
  const minimizeButton = document.querySelector("#terminal-minimize");
  const titlebar = document.querySelector(".terminal-titlebar");
  const commandHistory = [];
  let historyIndex = 0;
  let currentDirectory = "~";
  let dragState = null;
  let restoredPosition = null;

  titlebar.addEventListener("pointerdown", (event) => {
    if (
      event.button !== 0 ||
      event.target.closest("button") ||
      shell.classList.contains("is-maximized")
    ) {
      return;
    }

    const bounds = shell.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    titlebar.setPointerCapture(event.pointerId);
  });

  titlebar.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const maxLeft = Math.max(0, window.innerWidth - shell.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - shell.offsetHeight);
    const left = Math.min(maxLeft, Math.max(0, event.clientX - dragState.offsetX));
    const top = Math.min(maxTop, Math.max(0, event.clientY - dragState.offsetY));
    shell.style.left = `${left}px`;
    shell.style.top = `${top}px`;
    shell.style.right = "auto";
    shell.style.bottom = "auto";
  });

  const stopDragging = (event) => {
    if (dragState?.pointerId === event.pointerId) dragState = null;
  };
  titlebar.addEventListener("pointerup", stopDragging);
  titlebar.addEventListener("pointercancel", stopDragging);

  const setTerminalOpen = (open) => {
    shell.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    const actionLabel = translateText(open ? "Minimize terminal" : "Open terminal");
    launcher.setAttribute("aria-label", actionLabel);
    launcher.title = actionLabel;
    if (open) {
      input.focus({ preventScroll: true });
    } else {
      shell.classList.remove("is-maximized");
      shell.style.left = "";
      shell.style.top = "";
      shell.style.right = "";
      shell.style.bottom = "";
      restoredPosition = null;
      maximizeButton.setAttribute("aria-pressed", "false");
      maximizeButton.setAttribute("aria-label", translateText("Maximize terminal"));
      maximizeButton.title = translateText("Maximize terminal");
      launcher.focus({ preventScroll: true });
    }
  };

  launcher.addEventListener("click", () => setTerminalOpen(shell.hidden));
  minimizeButton.addEventListener("click", () => setTerminalOpen(false));
  maximizeButton.addEventListener("click", () => {
    const maximized = !shell.classList.contains("is-maximized");
    if (maximized) {
      const bounds = shell.getBoundingClientRect();
      restoredPosition = { left: bounds.left, top: bounds.top };
      shell.style.left = "";
      shell.style.top = "";
      shell.style.right = "";
      shell.style.bottom = "";
    } else if (restoredPosition) {
      shell.style.left = `${restoredPosition.left}px`;
      shell.style.top = `${restoredPosition.top}px`;
      shell.style.right = "auto";
      shell.style.bottom = "auto";
      restoredPosition = null;
    }
    shell.classList.toggle("is-maximized", maximized);
    maximizeButton.setAttribute("aria-pressed", String(maximized));
    maximizeButton.setAttribute(
      "aria-label",
      translateText(maximized ? "Restore terminal" : "Maximize terminal"),
    );
    maximizeButton.title = translateText(maximized ? "Restore terminal" : "Maximize terminal");
  });

  const clearTerminal = () => {
    output.replaceChildren(form);
    output.scrollTop = output.scrollHeight;
  };

  const print = (text, className = "terminal-result") => {
    const line = document.createElement("p");
    line.className = className;
    line.textContent = text.split("\n").map((part) => translateText(part)).join("\n");
    output.insertBefore(line, form);
    output.scrollTop = output.scrollHeight;
  };

  const printCommandLine = (command) => {
    const line = document.createElement("p");
    line.className = "terminal-entry";
    const promptText = document.createElement("span");
    promptText.className = "terminal-entry-prompt";
    promptText.textContent = `[rabbi@portfolio ${currentDirectory}]$`;
    line.append(promptText);
    if (command) {
      const commandText = document.createElement("span");
      commandText.textContent = ` ${command}`;
      line.append(commandText);
    }
    output.insertBefore(line, form);
    output.scrollTop = output.scrollHeight;
  };

  const projectDirectoryNames = data.projects.map((project, index) => {
    const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `project-${String(index + 1).padStart(2, "0")}-${slug}`;
  });

  const updatePrompt = () => {
    prompt.querySelector(".prompt-path").textContent = currentDirectory;
  };

  const formatSkills = (groups) =>
    groups
      .map((group) => `${group.category}\n  ${group.items.join(" · ")}`)
      .join("\n\n");

  const printFastfetch = () => {
    const block = document.createElement("div");
    block.className = "fastfetch-block";

    const logo = document.createElement("pre");
    logo.className = "fastfetch-logo";
    logo.setAttribute("aria-label", translateText("Portfolio logo in terminal dot-matrix art"));
    logo.innerHTML = [
      "...........          rr",
      "        .......       .....     ..r",
      "      ....       .rr      ..  ...",
      "    ...        ...        .....",
      "   ..         ...   ........",
      "   ..        ...   ..    ..",
      "   ........  ..    .. ....",
      "     ...... ................",
      "      ........ ...       ........",
      "    ....   ..    ..            ...",
      "   ..     ..      ...            ..",
      "  ...    ..         ...         ...",
      "   .......            ...... .....",
      "    ....                 ......",
    ]
      .map((row) => row.replaceAll("r", "<span>·</span>"))
      .join("\n");

    const info = document.createElement("div");
    info.className = "fastfetch-info";
    const heading = document.createElement("p");
    heading.className = "fastfetch-heading";
    const identity = document.createElement("strong");
    const separator = document.createElement("span");
    identity.textContent = "rabbi@portfolio";
    separator.textContent = "----------------";
    heading.append(identity, separator);
    info.append(heading);

    const rows = [
      ["OS", "Linux-inspired portfolio shell (simulated)"],
      ["User", data.display_name],
      ["Role", data.role],
      ["Focus", translateText("Network · Linux · Technical Support")],
      ["Location", data.location],
      ["GitHub", data.github.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")],
      ["Shell", "portfolio-shell 1.0 (simulated)"],
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("p");
      const key = document.createElement("strong");
      const detail = document.createElement("span");
      key.textContent = translateText(label);
      detail.textContent = translateText(value);
      row.append(key, detail);
      info.append(row);
    });

    block.append(logo, info);
    if (data.photo_path) {
      const photo = document.createElement("img");
      photo.className = "fastfetch-photo";
      photo.src = data.photo_path;
      photo.alt = `${data.display_name} ${translateText("profile")}`;
      block.replaceChild(photo, logo);
    }
    output.insertBefore(block, form);
    output.scrollTop = output.scrollHeight;
  };

  const publicCommandList = [
    ["about", "show introduction and background"],
    ["automation", "show automation skills"],
    ["cat <file>", "read a virtual portfolio file"],
    ["cd <folder>", "browse a virtual portfolio folder"],
    ["clear", "clear terminal output"],
    ["contact", "show public contact links"],
    ["database", "show database skills"],
    ["education", "show education and training"],
    ["experience", "show career history"],
    ["fastfetch", "show profile overview"],
    ["facebook", "open Facebook profile"],
    ["github", "open GitHub profile"],
    ["help [command]", "show command help"],
    ["history", "show entered commands"],
    ["linkedin", "open LinkedIn profile"],
    ["linux", "show Linux skills"],
    ["location", "show location"],
    ["ls", "list virtual portfolio files"],
    ["network", "show networking skills"],
    ["projects", "show project list"],
    ["pwd", "show virtual working directory"],
    ["show", "list all available public commands"],
    ["skills [topic]", "show skills, optionally filtered by topic"],
    ["whoami", "show name and current role"],
  ];

  const formatPublicCommandList = () =>
    `RABBI@PORTFOLIO SHELL · COMMANDS\n\n${publicCommandList
      .map(([name, description]) => `${name.padEnd(22)} ${translateText(description)}`)
      .join("\n")}`;

  const openSocialProfile = (name, url) => {
    if (!url) return `${name}${translateText(" profile URL is not configured yet.")}`;
    const dialog = document.querySelector("#social-dialog");
    const mark = document.querySelector("#social-dialog-mark");
    const openLink = document.querySelector("#social-dialog-open");
    const icons = {
      Facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.6 1.6-1.6h1.7V3.5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.2H7.3V13h2.8v8h3.4Z"/></svg>',
      GitHub: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.7 2.62 1.21 3.26.92.1-.72.39-1.21.71-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.04-1.15 3.04-1.15.61 1.54.23 2.68.12 2.96.71.78 1.14 1.78 1.14 3.01 0 4.29-2.61 5.23-5.1 5.5.4.35.76 1.02.76 2.06v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg>',
      LinkedIn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.9H4.96V9.34h2.97v9.56ZM6.45 8.03a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44Zm12.49 10.87h-2.97v-4.65c0-1.11-.02-2.54-1.55-2.54-1.56 0-1.8 1.21-1.8 2.46v4.73H9.65V9.34h2.85v1.3h.04c.4-.75 1.37-1.54 2.82-1.54 3.01 0 3.58 1.98 3.58 4.55v5.25Z"/></svg>',
    };
    document.querySelector("#social-dialog-title").textContent = translateText(`Rabbi's ${name} profile`);
    document.querySelector("#social-dialog-url").textContent = url;
    document.querySelector("#social-dialog-copy-status").textContent = "";
    mark.dataset.network = name.toLowerCase();
    mark.innerHTML = icons[name] || "";
    openLink.href = url;
    if (!dialog.open) dialog.showModal();
    return `${name}${translateText(" profile link ready. Choose Profile or View later.")}`;
  };

  const socialDialog = document.querySelector("#social-dialog");
  document.querySelector("#social-dialog-close").addEventListener("click", () => socialDialog.close());
  document.querySelector("#social-dialog-cancel").addEventListener("click", () => socialDialog.close());
  document.querySelector("#social-dialog-copy").addEventListener("click", async () => {
    const url = document.querySelector("#social-dialog-url").textContent;
    const status = document.querySelector("#social-dialog-copy-status");
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = translateText("Profile link copied.");
    } catch (error) {
      console.error("Could not copy the social profile link:", error);
      status.textContent = translateText("Could not copy the link. Select and copy the URL above.");
    }
  });
  socialDialog.addEventListener("click", (event) => {
    if (event.target === socialDialog) socialDialog.close();
  });

  const commands = {
    help: () => `${formatPublicCommandList()}\n\nKeyboard: ↑ / ↓ command history · Tab command completion · Ctrl+L clear\nThis is a portfolio simulator; it is not a real shell.`,
    show: () => formatPublicCommandList(),
    github: () => openSocialProfile("GitHub", data.github),
    facebook: () => openSocialProfile("Facebook", data.facebook),
    linkedin: () => openSocialProfile("LinkedIn", data.linkedin),
    whoami: () =>
      `${data.display_name} — ${data.role}\n${data.tagline}`,
    about: () =>
      `${data.introduction}\n\n${data.about.join("\n\n")}`,
    skills: (topic) => {
      if (!topic) return formatSkills(data.skills);
      const query = topic.toLowerCase();
      const groups = data.skills.filter((group) =>
        `${group.category} ${group.description} ${group.items.join(" ")}`
          .toLowerCase()
          .includes(query),
      );
      return groups.length
        ? formatSkills(groups)
        : `${translateText("No portfolio skills matched")} "${topic}". ${translateText("Try: linux, network, database, automation.")}`;
    },
    linux: () => {
      const group = data.skills.find((item) =>
        item.category.toLowerCase().includes("linux"),
      );
      return group
        ? `${group.category}\n${group.description}\n${group.items.join(", ")}`
        : "No Linux skill details are listed.";
    },
    network: () => {
      const group = data.skills.find((item) =>
        item.category.toLowerCase().includes("network"),
      );
      return group
        ? `${group.category}\n${group.description}\n${group.items.join(", ")}`
        : "No network skill details are listed.";
    },
    database: () => {
      const group = data.skills.find((item) =>
        item.category.toLowerCase().includes("database"),
      );
      return group
        ? `${group.category}\n${group.description}\n${group.items.join(", ")}`
        : "No database skill details are listed.";
    },
    automation: () => {
      const group = data.skills.find((item) =>
        item.category.toLowerCase().includes("automation"),
      );
      return group
        ? `${group.category}\n${group.description}\n${group.items.join(", ")}`
        : "No automation skill details are listed.";
    },
    experience: () =>
      data.experience
        .map(
          (job) =>
            `${job.role} — ${job.company} (${job.period})\n${job.description}`,
        )
        .join("\n\n"),
    projects: () =>
      data.projects
        .map(
          (project) =>
            `${project.title} [${project.status}]\n${project.description}`,
        )
        .join("\n\n"),
    education: () =>
      [
        ...data.education.map(
          (item) =>
            `${item.qualification} — ${item.institution} (${item.period}; ${item.result})`,
        ),
        ...data.training.map(
          (item) => `${item.name} — ${item.provider}`,
        ),
      ].join("\n"),
    contact: () =>
      [
        `GitHub: ${data.github}`,
        data.email ? `Email: ${data.email}` : "Email: not configured yet",
        data.linkedin ? `LinkedIn: ${data.linkedin}` : "",
        data.facebook ? `Facebook: ${data.facebook}` : "",
        data.whatsapp ? `WhatsApp: ${data.whatsapp}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    history: () =>
      commandHistory
        .map((command, index) => `${String(index + 1).padStart(4, " ")}  ${command}`)
        .join("\n") || "No commands in history.",
    myterminal: () => {
      return "Admin access is unavailable in this public demo.";
    },
    location: () => data.location,
    pwd: () => `/home/rabbi/${currentDirectory === "~" ? "" : currentDirectory}`.replace(/\/$/, ""),
    ls: () => {
      if (currentDirectory === "projects") {
        return projectDirectoryNames.map((name) => `${name}/`).join("   ");
      }
      if (projectDirectoryNames.includes(currentDirectory)) {
        return "README.md";
      }
      if (currentDirectory === "skills") {
        return data.skills.map((group) => group.category).join("   ");
      }
      if (currentDirectory === "experience") {
        return data.experience.map((job) => job.company).join("   ");
      }
      if (currentDirectory === "education") {
        return [...data.education, ...data.training]
          .map((item) => item.qualification || item.name)
          .join("   ");
      }
      return ["about.txt", "skills/", "experience/", "projects/", "education/", "contact.txt"].join("   ");
    },
    cat: (filename) => {
      const target = (filename || "").toLowerCase();
      if (target === "about.txt") return commands.about();
      if (target === "contact.txt") return commands.contact();
      if (target === "skills.txt") return commands.skills();
      return `cat: ${filename || "(missing file)"}: file not found\nTry: cat about.txt, cat skills.txt, cat contact.txt`;
    },
  };

  const aliases = new Map([
    ["name", "whoami"],
    ["profile", "whoami"],
    ["bio", "about"],
    ["skill", "skills"],
    ["networking", "network"],
    ["noc", "experience"],
    ["maestro", "experience"],
    ["support", "experience"],
    ["job", "experience"],
    ["work", "experience"],
    ["project", "projects"],
    ["monthly cost", "projects"],
    ["study", "education"],
    ["sql", "database"],
    ["email", "contact"],
    ["git", "github"],
    ["where", "location"],
  ]);

  const runCommand = (rawCommand, recordHistory = true) => {
    const trimmedCommand = rawCommand.trim();
    if (!trimmedCommand) {
      printCommandLine("");
      return;
    }
    if (recordHistory) {
      commandHistory.push(trimmedCommand);
      historyIndex = commandHistory.length;
    }

    printCommandLine(trimmedCommand);
    const [commandName, ...args] = trimmedCommand.split(/\s+/);
    const command = commandName.toLowerCase();
    const normalizedCommand = aliases.get(command) || command;
    const argument = args.join(" ");

    if (normalizedCommand === "clear") {
      clearTerminal();
      return;
    }

    if (normalizedCommand === "fastfetch") {
      printFastfetch();
      return;
    }

    if (normalizedCommand === "cd") {
      if (!argument || argument === "~" || argument === "/home/rabbi" || argument === "..") {
        currentDirectory = "~";
      } else {
        const directory = argument.replace(/^~\/?/, "").replace(/\/$/, "");
        const isKnownDirectory = ["skills", "experience", "projects", "education"].includes(directory) ||
          projectDirectoryNames.includes(directory);
        if (!isKnownDirectory) {
          print(`${translateText("cd:")} ${argument}: ${translateText("no such portfolio directory")}`, "terminal-error");
          return;
        }
        currentDirectory = directory;
      }
      updatePrompt();
      return;
    }

    if (normalizedCommand === "help" && argument) {
      const helpTopic = aliases.get(argument.toLowerCase()) || argument.toLowerCase();
      const helpText = {
        fastfetch: "fastfetch — show the portfolio profile with its dot-matrix logo.",
        skills: "skills [linux|network|database|automation] — list skills, optionally filtered by topic.",
        projects: "projects — show personal, learning, and planned projects.",
        cd: "cd <folder> — change the simulated directory. Use ls to see available folders.",
        cat: "cat about.txt | skills.txt | contact.txt — display a virtual portfolio file.",
        history: "history — show commands entered in this terminal session.",
        show: "show — list every available public portfolio command.",
      };
      print(helpText[helpTopic] || `${translateText("No detailed help for")} "${argument}". ${translateText("Run help to list commands.")}`);
      return;
    }

    if (Object.hasOwn(commands, normalizedCommand)) {
      print(commands[normalizedCommand](argument));
      return;
    }

    print(`${translateText("zsh: command not found:")} ${commandName}\n${translateText('Type "help" to see available portfolio commands.')}`, "terminal-error");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const command = input.value;
    runCommand(command);
    input.value = "";
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp" && commandHistory.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = commandHistory[historyIndex];
    } else if (event.key === "ArrowDown" && commandHistory.length) {
      event.preventDefault();
      historyIndex = Math.min(commandHistory.length, historyIndex + 1);
      input.value = commandHistory[historyIndex] || "";
    } else if (event.key === "Tab") {
      event.preventDefault();
      const entered = input.value.trim().toLowerCase();
      if (!entered) return;
      const commandNames = [
        ...Object.keys(commands).filter((name) => name !== "myterminal"),
        "name", "profile", "bio", "skill", "networking", "noc",
        "maestro", "support", "job", "work", "project", "study",
        "sql", "email", "github", "git", "linkedin", "where",
        "facebook",
      ];
      const matches = [...new Set(commandNames)].filter((name) => name.startsWith(entered));
      if (matches.length === 1) input.value = matches[0];
      else if (matches.length > 1) print(matches.join("   "), "terminal-hint");
    } else if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      clearTerminal();
    }
  });

  document.querySelectorAll(".terminal-hints [data-command]").forEach((button) => {
    button.addEventListener("click", () => {
      runCommand(button.dataset.command);
      input.value = "";
      input.focus();
    });
  });

}

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#main-navigation");

menuButton.addEventListener("click", () => {
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  menuButton.setAttribute("aria-label", translateText(expanded ? "Open navigation" : "Close navigation"));
  navigation.classList.toggle("navigation-open", !expanded);
});

document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.language === activeLanguage) return;
    localStorage.setItem("portfolio-language", button.dataset.language);
    window.location.reload();
  });
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("navigation-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", translateText("Open navigation"));
  });
});

fetch("./portfolio.json")
  .then((response) => {
    if (!response.ok) throw new Error(`Portfolio API returned ${response.status}`);
    return response.json();
  })
  .then(renderPortfolio)
  .catch((error) => {
    console.error("Could not load portfolio content:", error);
    document.querySelector("#load-error").hidden = false;
  });

// Animate both directions without snapping native details shut mid-transition.
const disclosureAnimations = new WeakMap();
const toggleCardDetails = (card) => {
  const previous = disclosureAnimations.get(card);
  const expanding = previous ? !previous.expanding : !card.open;
  const startHeight = card.getBoundingClientRect().height;
  const body = card.querySelector(":scope > .card-details-body");
  const summary = card.querySelector(":scope > summary");
  const originalHeight = previous?.originalHeight ?? card.style.height;
  const originalOverflow = previous?.originalOverflow ?? card.style.overflow;
  previous?.heightAnimation.cancel();
  previous?.bodyAnimation?.cancel();
  card.dataset.expanded = String(expanding);
  summary.setAttribute("aria-expanded", String(expanding));
  if (!card.animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    card.open = expanding;
    card.style.height = originalHeight;
    card.style.overflow = originalOverflow;
    disclosureAnimations.delete(card);
    return;
  }
  card.open = true;
  card.style.height = originalHeight;
  const endHeight = expanding ? card.getBoundingClientRect().height
    : summary.getBoundingClientRect().height + card.clientTop * 2;
  card.style.height = `${startHeight}px`;
  card.style.overflow = "hidden";
  const timing = {duration: expanding ? 340 : 280, easing: "cubic-bezier(.22,.7,.25,1)", fill: "both"};
  const heightAnimation = card.animate([{height: `${startHeight}px`}, {height: `${endHeight}px`}], timing);
  const bodyAnimation = body?.animate(expanding
    ? [{opacity: 0, transform: "translateY(5px)"}, {opacity: 1, transform: "translateY(0)"}]
    : [{opacity: 1, transform: "translateY(0)"}, {opacity: 0, transform: "translateY(3px)"}], timing);
  const state = {expanding, heightAnimation, bodyAnimation, originalHeight, originalOverflow};
  disclosureAnimations.set(card, state);
  heightAnimation.onfinish = () => {
    if (disclosureAnimations.get(card) !== state) return;
    card.open = expanding;
    card.style.height = originalHeight;
    card.style.overflow = originalOverflow;
    heightAnimation.cancel();
    bodyAnimation?.cancel();
    disclosureAnimations.delete(card);
  };
};
for (const listId of ["education-list", "training-list", "experience-list", "skills-list", "projects-list"]) {
  document.getElementById(listId).addEventListener("click", (event) => {
    const card = event.target.closest(".education-disclosure");
    if (!card || event.target.closest("a, button, input, textarea, select, .institute-link")) return;
    if (window.getSelection()?.toString()) return;
    event.preventDefault();
    toggleCardDetails(card);
  });
}

// Language disclosure supports pointer hover, touch, keyboard, and Escape.
const languageDropdown = document.querySelector(".language-dropdown");
const languageTrigger = languageDropdown.querySelector(".language-trigger");
const languageOptions = document.querySelector("#language-options");
document.querySelector("#current-language").textContent = activeLanguage;
const setLanguageOpen = (open) => {
  languageTrigger.setAttribute("aria-expanded", String(open));
  languageOptions.hidden = !open;
};
languageDropdown.addEventListener("pointerenter", (event) => {
  if (event.pointerType === "mouse") setLanguageOpen(true);
});
languageDropdown.addEventListener("pointerleave", (event) => {
  if (event.pointerType === "mouse") setLanguageOpen(false);
});
languageTrigger.addEventListener("click", (event) => {
  // Pointer hover has already opened the dropdown: keep it open on mouse click.
  setLanguageOpen(event.detail > 0 && window.matchMedia("(hover: hover)").matches
    ? true : languageOptions.hidden);
});
languageTrigger.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    event.preventDefault(); setLanguageOpen(true);
    languageOptions.querySelector("button").focus();
  }
});
languageDropdown.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault(); setLanguageOpen(false); languageTrigger.focus();
  }
});
languageDropdown.addEventListener("focusout", (event) => {
  if (!languageDropdown.contains(event.relatedTarget)) setLanguageOpen(false);
});
document.addEventListener("click", (event) => {
  if (!languageDropdown.contains(event.target)) setLanguageOpen(false);
});

// The underline follows each link's actual text bounds, not its padded hit area.
const navLine = navigation.querySelector(".nav-hover-line");
const navLinks = [...navigation.querySelectorAll(":scope > a:not(.nav-cta)")];
let hoveredNavLink = null;
const hideNavLine = () => { navLine.style.opacity = "0"; };
const placeNavLine = (link) => {
  if (!link || !link.getClientRects().length) { hideNavLine(); return; }
  const navRect = navigation.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(link);
  const textRect = range.getBoundingClientRect();
  if (!textRect.width) { hideNavLine(); return; }
  navLine.style.width = `${textRect.width}px`;
  navLine.style.transform = `translate3d(${textRect.left - navRect.left - navigation.clientLeft}px, ${textRect.bottom - navRect.top - navigation.clientTop + 4}px, 0)`;
  navLine.style.opacity = "1";
};
navigation.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  const link = event.target.closest("a");
  const next = navLinks.includes(link) ? link : null;
  if (hoveredNavLink === next) return;
  hoveredNavLink = next;
  if (next) placeNavLine(next); else hideNavLine();
});
navigation.addEventListener("pointerleave", () => {
  hoveredNavLink = null;
  hideNavLine();
});
navigation.addEventListener("focusin", (event) => {
  if (navLinks.includes(event.target)) placeNavLine(event.target);
  else hideNavLine();
});
navigation.addEventListener("focusout", (event) => {
  if (!navLinks.includes(event.relatedTarget)) hideNavLine();
});
navigation.addEventListener("click", (event) => {
  if (event.target.closest("a")) { hoveredNavLink = null; hideNavLine(); }
});
window.addEventListener("resize", () => {
  const focusedLink = navLinks.includes(document.activeElement) ? document.activeElement : null;
  if (hoveredNavLink || focusedLink) placeNavLine(hoveredNavLink || focusedLink);
  else hideNavLine();
});
if (document.fonts?.ready) document.fonts.ready.then(() => {
  if (hoveredNavLink) placeNavLine(hoveredNavLink);
});
