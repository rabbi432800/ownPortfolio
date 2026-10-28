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

function renderPortfolio(data) {
  data = translatePortfolioData(data);
  document.title = `${data.display_name} | ${data.role}`;
  document.querySelector('meta[name="description"]').content = data.introduction;
  const githubDisplay = data.github.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  const darkLogo = data.logo_dark_path || data.logo_path || data.logo_light_path;
  document.querySelectorAll(".brand-mark").forEach((mark) => {
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
      "/assets/favicon.svg";
  }
  const socialImage = data.og_image_path
    ? new URL(data.og_image_path, window.location.origin).href
    : "";
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content = data.introduction;
  document.querySelector('meta[property="og:image"]').content = socialImage;
  document.querySelector('meta[name="twitter:title"]').content = document.title;
  document.querySelector('meta[name="twitter:description"]').content = data.introduction;
  document.querySelector('meta[name="twitter:image"]').content = socialImage;
  document.querySelector("#hero-name").innerHTML = `${escapeHtml(data.display_name)}<span>.</span>`;
  document.querySelectorAll(".brand").forEach((brand) => {
    brand.setAttribute("aria-label", `${data.display_name} ${translateText("home")}`);
  });
  document.querySelector("#hero-role").textContent = data.role;
  document.querySelector("#hero-tagline").textContent = data.tagline;
  document.querySelector("#hero-introduction").textContent = data.introduction;
  document.querySelector("#hero-location").textContent = data.location;
  document.querySelectorAll("[data-name]").forEach((element) => {
    element.textContent = data.display_name;
  });
  document.querySelector("#github-link").href = data.github;
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
    .map(
      (item) => `
        <div class="highlight">
          <strong>${escapeHtml(item.value)}</strong>
          <span>${escapeHtml(item.label)}</span>
        </div>`,
    )
    .join("");

  document.querySelector("#about-copy").innerHTML = `
    ${data.about.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
    <a class="text-link" href="#experience">Explore my experience <span aria-hidden="true">↗</span></a>`;

  document.querySelector("#experience-list").innerHTML = data.experience
    .map(
      (job, index) => `
        <article class="timeline-item">
          <div class="timeline-marker">${String(index + 1).padStart(2, "0")}</div>
          <div class="experience-card">
            <div class="experience-meta"><span class="tag">${escapeHtml(job.type)}</span><span class="experience-period">${escapeHtml(job.period)}</span></div>
            <h3>${escapeHtml(job.role)}</h3>
            <h4>${escapeHtml(job.company)}</h4>
            <p>${escapeHtml(job.description)}</p>
            <ul class="check-list">${job.responsibilities.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            ${renderTags(job.technologies)}
          </div>
        </article>`,
    )
    .join("");

  document.querySelector("#skills-list").innerHTML = data.skills
    .map(
      (group, index) => `
        <article class="skill-card">
          <div class="skill-card-top"><span class="skill-number">${String(index + 1).padStart(2, "0")}</span><span class="skill-symbol" aria-hidden="true">${["⌘", "⌁", "▤", "⌬"][index % 4]}</span></div>
          <h3>${escapeHtml(group.category)}</h3>
          <p>${escapeHtml(group.description)}</p>
          ${renderTags(group.items)}
        </article>`,
    )
    .join("");

  document.querySelector("#projects-list").innerHTML = data.projects
    .map(
      (project, index) => `
        <article class="project-card">
          <div class="project-art project-art-${(index % 4) + 1}">
            <span class="project-art-index">PROJECT / ${String(index + 1).padStart(2, "0")}</span>
            <span class="project-art-shape" aria-hidden="true">${["↗", "⌘", "◷", "⌬"][index % 4]}</span>
            <span class="project-category">${escapeHtml(project.category)}</span>
          </div>
          <div class="project-content">
            <span class="tag">${escapeHtml(project.status)}</span>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.description)}</p>
            <ul class="project-features">${project.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
            ${renderTags(project.stack)}
            ${
              project.link
                ? `<a class="text-link project-link" href="${escapeHtml(project.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(project.link_label)} <span aria-hidden="true">↗</span></a>`
                : '<span class="project-private-note">No public project link</span>'
            }
          </div>
        </article>`,
    )
    .join("");

  document.querySelector("#education-list").innerHTML = data.education
    .map(
      (item) => `
        <article class="education-card">
          <span class="education-period">${escapeHtml(item.period)}</span>
          <h4>${escapeHtml(item.qualification)}</h4>
          <p class="education-institution">${escapeHtml(item.institution)}</p>
          <p>${escapeHtml(item.details)}</p>
          <span class="education-result">${escapeHtml(item.result)}</span>
        </article>`,
    )
    .join("");

  document.querySelector("#training-list").innerHTML = data.training
    .map(
      (item) => `
        <article class="education-card training-card">
          <span class="training-symbol" aria-hidden="true">↗</span>
          <h4>${escapeHtml(item.name)}</h4>
          <p class="education-institution">${escapeHtml(item.provider)}</p>
          <p>${escapeHtml(item.details)}</p>
        </article>`,
    )
    .join("");

  document.querySelector("#knowledge-list").innerHTML = data.knowledge_sharing
    .map(
      (item, index) => `
        <article class="knowledge-card">
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
  document.querySelector("#contact-methods").innerHTML = methods.join("");

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
  const commandHistory = [];
  let historyIndex = 0;
  let currentDirectory = "~";

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
      ]
        .filter(Boolean)
        .join("\n"),
    history: () =>
      commandHistory
        .map((command, index) => `${String(index + 1).padStart(4, " ")}  ${command}`)
        .join("\n") || "No commands in history.",
    myterminal: () => {
      window.location.assign("/myterminal");
      return "Opening the private portfolio panel...";
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

fetch("/api/portfolio")
  .then((response) => {
    if (!response.ok) throw new Error(`Portfolio API returned ${response.status}`);
    return response.json();
  })
  .then(renderPortfolio)
  .catch((error) => {
    console.error("Could not load portfolio content:", error);
    document.querySelector("#load-error").hidden = false;
  });