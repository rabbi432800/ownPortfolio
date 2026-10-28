## Project architecture

- Frontend: plain HTML, CSS, and vanilla JavaScript in `frontend/`.
- Backend: FastAPI routes and portfolio data in `backend/`.
- The FastAPI app serves frontend assets and the same-origin JSON API.
- There is no database or frontend bundler in this portfolio project.

## Development

- Install Python dependencies with `python -m pip install -r backend/requirements.txt`.
- Run locally with `uvicorn backend.server:app --reload`.
- Check `/api/health` and `/api/portfolio`.
- Keep portfolio facts accurate; do not imply planned work or training is completed certification.
