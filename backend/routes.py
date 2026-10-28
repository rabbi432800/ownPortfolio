import secrets
from pathlib import Path
from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile
from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.auth import (
    SESSION_COOKIE,
    SESSION_DURATION,
    cookie_is_secure,
    create_session,
    credentials_match,
    is_authenticated,
    require_admin,
)
from backend.config import PORTFOLIO
from backend.storage import load_portfolio, save_portfolio

router = APIRouter(prefix="/api")
PROJECT_ROOT = Path(__file__).resolve().parent.parent
UPLOAD_DIR = PROJECT_ROOT / "frontend" / "assets" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=256)


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str = Field(min_length=1, max_length=100)
    role: str = Field(min_length=1, max_length=140)
    tagline: str = Field(min_length=1, max_length=240)
    location: str = Field(min_length=1, max_length=100)
    email: str = Field(max_length=254)
    github: str = Field(max_length=300)
    linkedin: str = Field(max_length=300)
    facebook: str = Field(max_length=300)
    introduction: str = Field(min_length=1, max_length=1200)
    about: list[str] = Field(min_length=1, max_length=8)
    photo_path: str = Field(max_length=300)
    logo_path: str = Field(max_length=300)
    logo_dark_path: str = Field(max_length=300)
    logo_light_path: str = Field(max_length=300)
    favicon_path: str = Field(max_length=300)
    og_image_path: str = Field(max_length=300)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if value and ("@" not in value or value.startswith("@") or value.endswith("@")):
            raise ValueError("Enter a valid email address.")
        return value

    @field_validator("github", "linkedin", "facebook")
    @classmethod
    def validate_profile_url(cls, value: str) -> str:
        if value and not value.startswith(("https://", "http://")):
            raise ValueError("Profile links must start with http:// or https://.")
        return value

    @field_validator(
        "photo_path",
        "logo_path",
        "logo_dark_path",
        "logo_light_path",
        "favicon_path",
        "og_image_path",
    )
    @classmethod
    def validate_upload_path(cls, value: str) -> str:
        if value and (
            not value.startswith("/assets/uploads/")
            or Path(value).name != value.removeprefix("/assets/uploads/")
        ):
            raise ValueError("Images must use an uploaded portfolio asset.")
        return value


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/portfolio")
def get_portfolio() -> dict[str, Any]:
    return load_portfolio()


@router.get("/admin/session")
def admin_session(request: Request) -> dict[str, bool]:
    return {"authenticated": is_authenticated(request)}


@router.post("/admin/login")
def admin_login(credentials: LoginRequest, request: Request, response: Response) -> dict[str, str]:
    if not credentials_match(credentials.username, credentials.password):
        raise HTTPException(status_code=401, detail="Username or password is incorrect.")

    client_host = request.client.host if request.client else ""
    if credentials.password == "admin" and client_host not in {"127.0.0.1", "::1"}:
        raise HTTPException(
            status_code=403,
            detail="The temporary admin password is allowed only from this computer. Change it before deployment.",
        )

    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_session(credentials.username),
        max_age=SESSION_DURATION,
        httponly=True,
        secure=cookie_is_secure(),
        samesite="strict",
        path="/api/admin",
    )
    return {"message": "Signed in."}


@router.post("/admin/logout", dependencies=[Depends(require_admin)])
def admin_logout(response: Response) -> dict[str, str]:
    response.delete_cookie(
        key=SESSION_COOKIE,
        path="/api/admin",
        httponly=True,
        secure=cookie_is_secure(),
        samesite="strict",
    )
    return {"message": "Signed out."}


@router.get("/admin/profile", dependencies=[Depends(require_admin)])
def admin_profile() -> dict[str, Any]:
    return load_portfolio()


@router.put("/admin/profile", dependencies=[Depends(require_admin)])
def update_admin_profile(profile: ProfileUpdate) -> dict[str, Any]:
    updates = profile.model_dump()
    updates["about"] = [paragraph.strip() for paragraph in updates["about"] if paragraph.strip()]
    if not updates["about"]:
        raise HTTPException(status_code=422, detail="Add at least one About paragraph.")
    return save_portfolio(updates)


def validate_full_portfolio(value: Any, template: Any, path: str = "portfolio") -> None:
    if isinstance(template, dict):
        if not isinstance(value, dict) or value.keys() != template.keys():
            raise HTTPException(
                status_code=422,
                detail=f"{path} must keep the existing portfolio fields.",
            )
        for key, child_template in template.items():
            validate_full_portfolio(value[key], child_template, f"{path}.{key}")
        return

    if isinstance(template, list):
        if not isinstance(value, list) or len(value) > 50:
            raise HTTPException(
                status_code=422,
                detail=f"{path} must be a list with no more than 50 entries.",
            )
        if value and not template:
            raise HTTPException(
                status_code=422,
                detail=f"{path} does not have a supported item structure.",
            )
        if template:
            for index, child in enumerate(value):
                validate_full_portfolio(child, template[0], f"{path}[{index}]")
        return

    if isinstance(template, str):
        if not isinstance(value, str) or len(value) > 5000:
            raise HTTPException(
                status_code=422,
                detail=f"{path} must be text of at most 5000 characters.",
            )
        return

    if type(value) is not type(template):
        raise HTTPException(status_code=422, detail=f"{path} has an invalid value.")


@router.put("/admin/full-portfolio", dependencies=[Depends(require_admin)])
def update_full_portfolio(profile: dict[str, Any]) -> dict[str, Any]:
    validate_full_portfolio(profile, PORTFOLIO)
    if not any(paragraph.strip() for paragraph in profile["about"]):
        raise HTTPException(status_code=422, detail="Add at least one About paragraph.")
    if profile["email"] and (
        "@" not in profile["email"]
        or profile["email"].startswith("@")
        or profile["email"].endswith("@")
    ):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    for field in ("github", "linkedin", "facebook"):
        if profile[field] and not profile[field].startswith(("https://", "http://")):
            raise HTTPException(
                status_code=422,
                detail=f"{field} must start with http:// or https://.",
            )
    for field in (
        "photo_path",
        "logo_path",
        "logo_dark_path",
        "logo_light_path",
        "favicon_path",
        "og_image_path",
    ):
        path = profile[field]
        if path and (
            not path.startswith("/assets/uploads/")
            or Path(path).name != path.removeprefix("/assets/uploads/")
        ):
            raise HTTPException(
                status_code=422,
                detail=f"{field} must use an uploaded portfolio image.",
            )
    return save_portfolio(profile)


@router.post("/admin/upload/{image_kind}", dependencies=[Depends(require_admin)])
async def upload_admin_image(
    image_kind: str,
    file: Annotated[UploadFile, File()],
) -> dict[str, str]:
    if image_kind not in {"logo", "logo-dark", "logo-light", "photo", "favicon", "og-image"}:
        raise HTTPException(status_code=404, detail="Unknown image type.")

    content = await file.read(5 * 1024 * 1024 + 1)
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller.")

    formats = (
        (".png", lambda data: data.startswith(b"\x89PNG\r\n\x1a\n")),
        (".jpg", lambda data: data.startswith(b"\xff\xd8\xff")),
        (".webp", lambda data: data.startswith(b"RIFF") and data[8:12] == b"WEBP"),
    )
    image_extension = next(
        (extension for extension, matches in formats if matches(content)), None
    )
    if image_extension is None:
        raise HTTPException(
            status_code=415,
            detail="Upload a valid PNG, JPEG, or WebP image.",
        )

    filename = f"{image_kind}-{secrets.token_hex(12)}{image_extension}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(content)
    return {"path": f"/assets/uploads/{filename}"}