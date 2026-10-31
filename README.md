<div align="center">

# Md Rabbi Mia · Personal Portfolio

**Network operations. Linux infrastructure. Practical development.**

A responsive portfolio with multilingual content, an interactive terminal, and a private content editor — built with vanilla JavaScript and FastAPI.

**HTML · CSS · JavaScript · Python · FastAPI · Docker**

[Getting started](#getting-started) · [Admin guide](#admin-guide) · [Architecture](#architecture-and-file-guide) · [Docker](#docker) · [Troubleshooting](#troubleshooting)

</div>

---

## Overview

This project presents Md Rabbi Mia's professional experience, technical skills, projects, education, training, and knowledge-sharing topics. FastAPI serves both the frontend and the JSON API from one origin.

There is no frontend framework, Node.js build pipeline, or database dependency. Portfolio changes are saved to a local JSON file; uploaded images are stored on disk.

### Features

- Responsive public portfolio with expandable details and contact links.
- English by default, with German and Bengali translations.
- Dark and light themes shared across the portfolio, admin, editor, and project page.
- Browser-persisted language and theme preferences.
- Interactive, draggable portfolio terminal with commands such as `help`, `about`, `skills`, `projects`, and `contact`.
- Admin login with signed, eight-hour session cookies.
- Profile settings and image uploads, including theme-specific logos, favicon, and social-sharing image.
- Full content editor with add/remove controls, drag ordering, up/down controls, and reset to the last saved version.
- Server-rendered page title, description, favicon URL, and Open Graph image URL.
- Docker Compose configuration with persistent data and upload volumes.

> The contact form opens the visitor's email application through `mailto:`. It does not send email through the server or store messages. The public terminal is a browser simulation, not a server shell.

## Getting started

### Prerequisites

- Python **3.12 recommended**, matching the Docker image.
- Python `pip` and `venv` support.
- A modern web browser.
- Optional: Docker Engine/Desktop with Docker Compose for container deployment.

Run the commands below from the repository root: the folder containing `backend/`, `frontend/`, and `compose.yaml`.

### 1. Create and activate a virtual environment

Linux / macOS:

```bash
cd /path/to/portfolio-project
python3 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell:

```powershell
cd C:\path\to\portfolio-project
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 2. Install backend dependencies

```bash
python -m pip install -r backend/requirements.txt
```

This installs FastAPI, Uvicorn, environment-file support, and multipart upload support. No `npm install` or frontend build is required.

### 3. Configure the environment

Linux / macOS:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, edit it rather than overwriting your configuration. Generate a session secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Open `.env`, choose your credentials, and paste the generated secret:

```dotenv
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=replace-with-a-unique-password
ADMIN_SESSION_SECRET=replace-with-the-generated-secret
ADMIN_COOKIE_SECURE=false
```

| Variable | Purpose | Requirement |
| --- | --- | --- |
| `ADMIN_USERNAME` | Username accepted by the admin login | Non-empty |
| `ADMIN_PASSWORD` | Password accepted by the admin login | Non-empty; use a unique password |
| `ADMIN_SESSION_SECRET` | Signs and verifies admin sessions | At least 32 characters |
| `ADMIN_COOKIE_SECURE` | Restricts the session cookie to HTTPS when `true` | `false` for local HTTP; `true` for HTTPS deployment |

The supplied template contains **no configured credentials**. Missing credentials or a short session secret prevent admin access. A password literally equal to `admin` is accepted only when the backend sees the client as `127.0.0.1` or `::1`; use a different password for Docker and network deployments.

`.env` is excluded from Git and Docker build context. Docker Compose supplies it to the container at runtime. Restart the server/container after changing environment settings.

### 4. Start the development server

```bash
python -m uvicorn backend.server:app --reload --port 8012
```

Keep this terminal open. Stop the server with `Ctrl+C`. Use `--reload` for development only.

### 5. Open and verify

| Page or endpoint | Local URL |
| --- | --- |
| Public portfolio | <http://127.0.0.1:8012/> |
| Admin login and dashboard | <http://127.0.0.1:8012/myterminal> |
| Full portfolio editor | <http://127.0.0.1:8012/myterminal/editor> |
| Interactive API documentation | <http://127.0.0.1:8012/api/docs> |
| Health check | <http://127.0.0.1:8012/api/health> |
| Public portfolio JSON | <http://127.0.0.1:8012/api/portfolio> |
| Personal Cost Manager placeholder | <http://127.0.0.1:8012/projects/personal-cost-manager/> |

Optional command-line checks:

```bash
curl http://127.0.0.1:8012/api/health
curl http://127.0.0.1:8012/api/portfolio
```

The health endpoint should return `{"status":"ok"}`. Open the site through FastAPI; opening `index.html` directly bypasses API serving and metadata replacement.

## Admin guide

### Update profile information

1. Open `/myterminal` and sign in using your `.env` credentials.
2. Edit your name, role, tagline, location, introduction, About paragraphs, and social/contact links.
3. Save settings to publish the changes.
4. Reload the public portfolio to confirm the result.

Separate About paragraphs with a blank line. Social URLs must start with `http://` or `https://`. Reset discards unsaved settings and reloads the saved version.

### Upload branding and profile images

The backend supports `photo`, `logo`, `logo-dark`, `logo-light`, `favicon`, and `og-image` uploads.

1. Choose an image using the relevant dashboard control.
2. Click **Upload** and wait for the preview/success message.
3. **Save settings** to publish the uploaded image's path.

| Upload rule | Supported value |
| --- | --- |
| Image formats | PNG, JPEG, WebP |
| Maximum file size | 5 MiB per image |
| Storage directory | `frontend/assets/uploads/` |
| Public URL prefix | `/assets/uploads/` |

Uploading a file alone does not publish it. The default bundled favicon is SVG, but the upload API accepts only the raster formats above. Uploaded assets are publicly accessible; upload images intended for public display.

### Edit every portfolio section

Choose **Edit full portfolio**, or open `/myterminal/editor` after signing in.

- Edit profile content, highlights, experience, skills, projects, education, training, and knowledge-sharing entries.
- Use **Add** and **Remove** to manage list entries, with a maximum of 50 entries per list.
- Drag an entry's handle or use its up/down buttons to change its order within the same list.
- Save to publish the content and ordering.
- Use **Reset** to discard unsaved changes and reload the last saved portfolio.

Keep at least one non-empty About paragraph. The full-update API validates the existing field structure; changing the portfolio schema requires corresponding code changes. Keep professional facts accurate and clearly distinguish planned projects, ongoing study, training, and completed certifications.

Admin APIs require authentication even though the HTML pages themselves can be opened publicly. Sessions use HttpOnly, SameSite=Strict cookies and expire after eight hours. Changing the session secret invalidates existing sessions.

## Content, languages, and themes

### Where portfolio information comes from

`backend/config.py` contains the default `PORTFOLIO` dictionary. On each load, `backend/storage.py` merges saved top-level fields from `backend/data/portfolio.json` over those defaults.

```text
config.py defaults + saved JSON overrides → /api/portfolio → app.js → public page
```

Consequently, editing a default field in `config.py` may not change the website if that field already has a saved override. Use the admin editor to update saved content. To restore all defaults, stop the server, back up and move the saved JSON out of `backend/data/`, then restart; uploaded images remain on disk.

### Translation workflow

English is the source/default language. German and Bengali translations live in `frontend/js/translations.js`; `app.js` applies the selected language. Add matching translations when introducing new English copy. Untranslated text falls back to the source text.

Language preference is stored under `portfolio-language` in browser `localStorage`. Theme preference is stored under `portfolio-theme`; `theme.js` applies it and `theme.css` defines shared theme styling. Browser preferences are separate from server-side portfolio data.

### Common customization tasks

| Change | Where to work |
| --- | --- |
| Profile text, experience, projects, education | Admin dashboard / full editor |
| Initial content and default schema | `backend/config.py` |
| Public page structure or new sections | `index.html` and `frontend/js/app.js` |
| Public layout and responsive design | `frontend/css/style.css` |
| Shared colours and theme styling | `frontend/css/theme.css` |
| Theme behaviour | `frontend/js/theme.js` |
| German/Bengali translations | `frontend/js/translations.js` |
| Admin/editor layout | `frontend/css/admin.css` and the relevant HTML |
| API validation or new backend features | `backend/routes.py` |

## Architecture and file guide

```text
portfolio-project/
├── index.html                     # Public portfolio structure and metadata placeholders
├── frontend/
│   ├── admin.html                 # Login and profile settings dashboard
│   ├── editor.html                # Full portfolio editor shell
│   ├── css/
│   │   ├── style.css              # Public portfolio styling
│   │   ├── admin.css              # Admin and editor styling
│   │   └── theme.css              # Shared dark/light theme rules
│   ├── js/
│   │   ├── app.js                 # Public rendering, interactions, and terminal
│   │   ├── admin.js               # Login, profile settings, and uploads
│   │   ├── editor.js              # Full editor, list management, and ordering
│   │   ├── translations.js        # German and Bengali dictionaries
│   │   └── theme.js               # Theme selection and persistence
│   └── assets/
│       ├── favicon.svg            # Default browser-tab icon
│       └── uploads/               # Runtime uploads; excluded from Git
├── backend/
│   ├── __init__.py                # Python package marker
│   ├── server.py                  # FastAPI app, HTML responses, static mounts
│   ├── routes.py                  # API endpoints, validation, and uploads
│   ├── auth.py                    # Credentials and signed session cookies
│   ├── config.py                  # Default portfolio content
│   ├── storage.py                 # JSON loading and atomic file replacement
│   ├── requirements.txt           # Python dependencies
│   └── data/
│       └── portfolio.json         # Created on save; excluded from Git
├── inner-project/
│   └── personal-cost-manager/
│       └── index.html             # Placeholder for a future project dashboard
├── .env.example                   # Environment template
├── .gitignore                     # Git exclusions
├── .dockerignore                  # Docker build exclusions
├── Dockerfile                     # Python container image
├── compose.yaml                   # Service, port, environment, and volumes
├── AGENTS.md                      # Coding-agent project instructions
└── README.md                      # Setup and maintenance guide
```

`/static` serves the frontend directory; `/assets` serves its asset directory. The Personal Cost Manager route currently displays a placeholder, not a working expense-management application. It is separate from any standalone cost-management repository.

## API reference

All application API routes use the `/api` prefix. See `/api/docs` for request schemas and interactive examples.

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Check server status |
| `GET` | `/api/portfolio` | Public | Read portfolio content |
| `GET` | `/api/admin/session` | Public | Check whether the current session is authenticated |
| `POST` | `/api/admin/login` | Credentials in request body | Create session cookie |
| `POST` | `/api/admin/logout` | Admin cookie | Clear browser session cookie |
| `GET` | `/api/admin/profile` | Admin cookie | Read content for editing |
| `PUT` | `/api/admin/profile` | Admin cookie | Update profile and image settings |
| `PUT` | `/api/admin/full-portfolio` | Admin cookie | Update the complete portfolio structure |
| `POST` | `/api/admin/upload/{image_kind}` | Admin cookie | Upload an image as multipart field `file` |

The session cookie is scoped to `/api/admin`. Login accepts JSON containing `username` and `password`. Upload responses contain a `path` to use in a later settings save.

## Docker

### Image contents

The Dockerfile copies the root `index.html`, `backend/`, `frontend/`, and `inner-project/` into the image. The project dashboard directory is required because FastAPI mounts it at startup.

### Build and run

Create and configure `.env` as described above, using a password other than `admin`. Then run:

```bash
docker compose up --build -d
docker compose logs -f portfolio
```

Open <http://127.0.0.1:8012/>. Compose maps host loopback port `8012` to container port `8000`, so this configuration does not directly expose the service on every host network interface.

| Operation | Command |
| --- | --- |
| View status | `docker compose ps` |
| Follow logs | `docker compose logs -f portfolio` |
| Stop and remove containers | `docker compose down` |
| Rebuild after code changes | `docker compose up --build -d` |
| Recreate after `.env` changes | `docker compose up -d --force-recreate` |

### Persistent storage

| Named volume | Container path | Contents |
| --- | --- | --- |
| `portfolio-data` | `/app/backend/data` | Saved portfolio JSON |
| `portfolio-uploads` | `/app/frontend/assets/uploads` | Uploaded images |

Regular `docker compose down` preserves these volumes. **`docker compose down -v` deletes the volumes and their saved content.** Host-side local data is not automatically migrated into named volumes; copy it deliberately when moving from local execution to Docker.

### Hosting considerations

Use an HTTPS reverse proxy for a public deployment and set `ADMIN_COOKIE_SECURE=true`. Preserve the hostname/protocol information forwarded to the app so generated absolute social-image URLs match the public site. Keep `.env` private and back up persistent storage.

The storage layer uses a process-local lock and local JSON files. Use a single application worker with this design; concurrent writes from multiple workers/replicas need shared coordination or a database. The application does not currently include login rate limiting, password recovery, or multiple admin accounts.

## Backup and restore

Back up these items together:

- `backend/data/portfolio.json` — saved content, if it exists.
- `frontend/assets/uploads/` — uploaded images referenced by that content.
- `.env` — private configuration, stored securely and separately from public source code.

For local execution, stop the app while copying data to obtain a consistent backup. Restore the JSON and uploads to the same relative paths, then start the app and verify text and image URLs.

For Docker, stop the service while copying data, and back up/restore the two named volumes. One way to extract their contents from an existing container is:

```bash
mkdir -p backups/data backups/uploads
docker compose stop portfolio
docker compose cp portfolio:/app/backend/data/. backups/data/
docker compose cp portfolio:/app/frontend/assets/uploads/. backups/uploads/
docker compose start portfolio
```

To restore into an existing container, stop it, copy your backup contents back to the corresponding paths using `docker compose cp`, and start it again. Copying merges files; remove obsolete files only after reviewing them and keeping a backup. Do not commit backups containing credentials or personal data.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| `No module named fastapi` or `uvicorn` | Activate `.venv` and install `backend/requirements.txt` using that environment's Python. |
| `No module named backend` | Run Uvicorn from the repository root. |
| Page opens with missing content or unresolved placeholders | Use the FastAPI URL, not `file://` or a separate static-only server. Check `/api/portfolio` and the browser console. |
| Admin reports missing configuration / HTTP 503 | Set all three admin values in `.env`; the secret must contain at least 32 characters. Restart the app. |
| Login returns HTTP 401 | Check the username/password. Protected API requests also return 401 when the session is missing or expired. |
| Temporary password rejected / HTTP 403 | Replace the literal password `admin`; it is restricted to clients the backend sees as localhost. |
| Login succeeds but authentication does not persist on local HTTP | Use `ADMIN_COOKIE_SECURE=false` locally. Secure cookies require HTTPS. Use the same hostname throughout the session. |
| Image upload returns HTTP 413 or 415 | Use a valid PNG/JPEG/WebP file no larger than 5 MiB. Renaming an extension does not convert the image. |
| New image preview appears but public site is unchanged | Save settings after uploading, then reload the public page. |
| Content save returns HTTP 422 | Check required fields, email/social URLs, image paths, list limits, and the full portfolio structure. |
| Editing `config.py` does not change existing content | Saved JSON overrides the same top-level defaults. Update through the editor. |
| New content stays English after switching languages | Add its translations to `frontend/js/translations.js`. |
| Port `8012` is already in use | Stop the conflicting process or choose another Uvicorn host port; for Docker, change the host side of the port mapping. |
| Docker exits with a missing project-directory error | Confirm `inner-project/personal-cost-manager/` exists in the build context, then rebuild the image. |
| CSS/JS changes are not visible | Hard-refresh the browser; review the asset query-string versions in the relevant HTML. Rebuild if using Docker. |
| Saved JSON cannot be read | Check file permissions and JSON validity; restore a known-good backup if the file is malformed. |

## Verification after changes

Use a focused manual check after making changes:

1. Confirm `/api/health` and `/api/portfolio` respond successfully.
2. Check the public page at desktop and mobile widths, including navigation and expandable details.
3. Switch languages and themes, then reload to confirm browser preferences persist.
4. Open the terminal and try `help` and `projects`.
5. Sign in, edit and save content, then verify it on the public page.
6. Check uploads, list ordering, reset, and logout when changing admin/editor behaviour.
7. Restart the app and confirm saved content and images remain available.

There is currently no automated test suite in this repository. The checks above describe manual verification, not pre-existing test results.

---

<div align="center">

**Md Rabbi Mia** · NOC Engineer | Linux & Network Operations

[GitHub](https://github.com/rabbi432800) · [Email](mailto:mdrabbimia432800@gmail.com)

</div>
