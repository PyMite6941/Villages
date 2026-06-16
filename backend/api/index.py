"""Vercel serverless entrypoint for the Villages FastAPI backend.

Vercel's @vercel/python runtime auto-detects an ASGI ``app`` in files under
``api/``. We add the project root (``backend/``) to ``sys.path`` so the existing
``app`` package imports resolve unchanged, then re-export the FastAPI instance.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402

# Vercel looks for a module-level ``app`` (ASGI) callable.
__all__ = ["app"]
