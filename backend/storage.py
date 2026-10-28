import json
import os
import tempfile
from pathlib import Path
from threading import RLock
from typing import Any

from backend.config import PORTFOLIO

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = PROJECT_ROOT / "backend" / "data" / "portfolio.json"
_lock = RLock()


def load_portfolio() -> dict[str, Any]:
    with _lock:
        if DATA_FILE.exists():
            saved_data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
            portfolio = {**PORTFOLIO, **saved_data}
            if not portfolio["logo_dark_path"]:
                portfolio["logo_dark_path"] = portfolio["logo_path"]
            return portfolio
        return dict(PORTFOLIO)


def save_portfolio(updates: dict[str, Any]) -> dict[str, Any]:
    with _lock:
        current_data = load_portfolio()
        updated_data = {**current_data, **updates}
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        handle, temporary_path = tempfile.mkstemp(
            prefix="portfolio-", suffix=".json", dir=DATA_FILE.parent
        )
        try:
            with os.fdopen(handle, "w", encoding="utf-8") as file:
                json.dump(updated_data, file, ensure_ascii=False, indent=2)
                file.write("\n")
            os.replace(temporary_path, DATA_FILE)
        finally:
            Path(temporary_path).unlink(missing_ok=True)
        return updated_data
