# Md Rabbi Mia Portfolio

A portfolio website built with plain HTML, CSS, vanilla JavaScript, and FastAPI.
It does not use a JavaScript framework or require a frontend build step.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
cp .env.example .env
# Set username/password and a random ADMIN_SESSION_SECRET (at least 32 characters) in .env.
uvicorn backend.server:app --reload --port 8012
```

Open <http://127.0.0.1:8012>. FastAPI serves the static frontend and provides
the portfolio data at `/api/portfolio` and a health check at `/api/health`.
Interactive API documentation is available at `/api/docs`.

## Private admin panel

Open <http://127.0.0.1:8012/myterminal> and sign in with `ADMIN_USERNAME` and
`ADMIN_PASSWORD` from the ignored local `.env` file. The panel can update the
public profile text and links, upload a website logo and profile photo, and
save changes across restarts. Data is stored in `backend/data/portfolio.json`;
uploaded PNG, JPEG, and WebP files are stored under `frontend/assets/uploads/`.
Choose **Edit full portfolio** to edit the text in every current portfolio
section from one protected editor page. Existing list entries are editable;
use the **Add** and **Remove** controls to manage projects, experience, courses
and other entries (up to 50 items in each list). New items are published on
the portfolio with the rest of the saved content. Drag an item's handle or use
its up/down buttons to reorder it within its section; the saved order is used
on the public portfolio. Use **Reset** beside the save button to discard
unsaved changes and reload the last saved portfolio.

The temporary `admin` / `admin` credentials are accepted only from localhost.
Change them in `.env` before exposing the app to any network. Use a unique
password and random session secret, and set `ADMIN_COOKIE_SECURE=true` when
serving the site over HTTPS. Admin sessions use an HttpOnly, SameSite cookie
and expire after eight hours.
For Docker or other networked setups, configure non-default credentials before
signing in; the temporary password is intentionally refused for non-local clients.

## Edit portfolio details

Use the admin panel to update public profile details. Initial/default content
is defined in `backend/config.py`. The contact form opens the visitor's email
application; it does not send or store messages.

## Docker

```bash
docker compose up --build
```

The local site is available at <http://127.0.0.1:8012>.