from html import escape
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from backend.routes import router
from backend.storage import load_portfolio

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
ASSETS_DIR = FRONTEND_DIR / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Md Rabbi Mia Portfolio", docs_url="/api/docs")
app.include_router(router)
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
PROJECT_DASHBOARD_DIR = PROJECT_ROOT / "personal-cost-manager"
app.mount(
    "/projects/personal-cost-manager",
    StaticFiles(directory=PROJECT_DASHBOARD_DIR, html=True),
    name="personal-cost-manager",
)


@app.get("/", include_in_schema=False)
def home(request: Request) -> HTMLResponse:
    portfolio = load_portfolio()
    title = f"{portfolio['display_name']} | {portfolio['role']}"
    description = portfolio["introduction"]
    favicon_path = (
        portfolio["favicon_path"]
        or portfolio["logo_dark_path"]
        or portfolio["logo_path"]
        or portfolio["logo_light_path"]
        or "/assets/favicon.svg"
    )
    og_image_path = portfolio["og_image_path"]
    base_url = str(request.base_url).rstrip("/")

    content = (FRONTEND_DIR / "index.html").read_text(encoding="utf-8")
    content = content.replace("__PAGE_TITLE__", escape(title, quote=True))
    content = content.replace("__PAGE_DESCRIPTION__", escape(description, quote=True))
    content = content.replace("__FAVICON_URL__", escape(favicon_path, quote=True))
    og_image_url = f"{base_url}{og_image_path}" if og_image_path else ""
    content = content.replace("__OG_IMAGE_URL__", escape(og_image_url, quote=True))
    return HTMLResponse(content)


@app.get("/myterminal", include_in_schema=False)
def admin() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "admin.html")


@app.get("/myterminal/", include_in_schema=False)
def admin_slash() -> RedirectResponse:
    return RedirectResponse("/myterminal", status_code=307)


@app.get("/myterminal/editor", include_in_schema=False)
def admin_editor() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "editor.html")