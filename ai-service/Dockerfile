# --------- Stage 1: Build ---------
FROM python:3.11-slim AS builder

# Install essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    gcc \
    g++ \
    curl \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
ENV POETRY_VERSION=1.8.2
RUN curl -sSL https://install.python-poetry.org | python3 -
ENV PATH="/root/.local/bin:$PATH"

# Create virtualenv inside project
WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.in-project true \
 && poetry install --no-root --only main

# Copy app code
COPY . .

# --------- Stage 2: Runtime ---------
FROM python:3.11-slim

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy environment from builder
COPY --from=builder /app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONHOME="/app/.venv" \
    PYTHONPATH="/app" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    HF_HOME=/root/.cache/huggingface \
    TORCH_HOME=/root/.cache/torch

# Create cache directories
RUN mkdir -p /root/.cache/huggingface /root/.cache/torch && \
    chmod -R 777 /root/.cache

# Create necessary directories
RUN mkdir -p /app/services /app/utils /app/config /app/logs /app/storage /app/storage/temp /app/models

# Entrypoint
RUN echo '#!/bin/bash\n\
poetry run python /app/init.py\n\
exec poetry run python /app/main.py\n'\
> /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 50052

ENTRYPOINT ["/app/entrypoint.sh"]
