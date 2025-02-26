# # # Use the official Python image
# FROM python:3.12-slim

# # Set working directory
# WORKDIR /app

# # Install system dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     gcc \
#     g++ \
#     libffi-dev \
#     libssl-dev \
#     libbz2-dev \
#     zlib1g-dev \
#     ffmpeg \
#     && apt-get clean && rm -rf /var/lib/apt/lists/*

# RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# COPY requirements.txt .

# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# # Expose the port FastAPI will run on
# EXPOSE 50052

# # Start the application
# CMD ["python", "main.py"]


# # Stage 1: Builder
# FROM python:3.12-slim AS builder

# WORKDIR /app

# # Install build dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     gcc g++ libffi-dev libssl-dev libbz2-dev zlib1g-dev \
#     && rm -rf /var/lib/apt/lists/*

# # Install Python dependencies directly into a target directory
# COPY requirements.txt .
# RUN pip install --upgrade pip && \
#     pip install --no-cache-dir --no-compile --target=/app/deps -r requirements.txt

# # Stage 2: Runtime
# FROM python:3.12-slim

# WORKDIR /app

# # Install runtime dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     ffmpeg libgomp1 \
#     && rm -rf /var/lib/apt/lists/*

# # Copy dependencies and application code
# COPY --from=builder /app/deps /usr/local/lib/python3.12/site-packages
# COPY . .

# # Set environment variables
# ENV PYTHONUNBUFFERED=1

# EXPOSE 50052

# CMD ["python", "main.py"]

# Stage 1: Builder
# FROM python:3.12-alpine AS builder

# WORKDIR /app

# # Install build dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     gcc g++ libjpeg-dev zlib1g-dev \
#     && rm -rf /var/lib/apt/lists/*

# # Install Python dependencies with verified versions
# COPY requirements.txt .
# RUN pip install --upgrade pip && \
#     pip install --no-cache-dir --user \
#     torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu \
#     --extra-index-url https://pypi.org/simple \
#     opencv-python-headless==4.10.0.84 \
#     -r requirements.txt


# # Stage 2: Runtime
# FROM python:3.12-alpine

# WORKDIR /app

# # Runtime dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libjpeg62-turbo zlib1g \
#     && rm -rf /var/lib/apt/lists/*

# # Copy dependencies
# COPY --from=builder /root/.local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
# COPY --from=builder /root/.local/bin /usr/local/bin

# # Application code
# COPY . .

# # Cleanup
# RUN find /usr/local/lib/python3.12/site-packages -depth \( \
#     -name '*.pyc' -o \
#     -name '*.pyo' -o \
#     -name '__pycache__' \) -exec rm -rf {} +

# ENV PYTHONUNBUFFERED=1

# EXPOSE 50052

# CMD ["python", "main.py"]



# Stage 1: Builder
# FROM python:3.12-slim as builder

# WORKDIR /app

# # Install build dependencies including those needed for gRPC
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     python3-dev \
#     gcc \
#     g++ \
#     && rm -rf /var/lib/apt/lists/*

# # Create virtual environment
# RUN python -m venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH"

# # Install dependencies with maximum constraints
# COPY requirements.txt .
# RUN pip install --no-cache-dir --upgrade pip && \
#     # First install grpcio and its tools
#     pip install --no-cache-dir \
#     grpcio==1.62.1 \
#     grpcio-tools==1.62.1 && \
#     # Install PyTorch CPU only with minimal features
#     pip install --no-cache-dir \
#     torch==2.2.1 --index-url https://download.pytorch.org/whl/cpu \
#     --extra-index-url https://pypi.org/simple \
#     --no-deps && \
#     # Install core dependencies separately with minimal features
#     pip install --no-cache-dir \
#     opencv-python-headless==4.10.0.84 \
#     numpy==1.26.0 \
#     transformers==4.38.2 \
#     protobuf==4.25.3 \
#     --only-binary=:all: \
#     --no-deps && \
#     # Install remaining requirements
#     pip install --no-cache-dir -r requirements.txt && \
#     # Cleanup while preserving essential files
#     find /opt/venv -depth \
#         \( \
#             -type d -a -name '__pycache__' -o \
#             -type f -a -name '*.pyc' -o \
#             -type f -a -name '*.pyo' -o \
#             -type d -a -name 'docs' -o \
#             -type d -a -name 'examples' -o \
#             -type d -a -name '.git' -o \
#             -type f -a -name '*.md' -o \
#             -type f -a -name '*.rst' -o \
#             -type f -a -name '*.txt' -o \
#             -type d -a -name 'wandb' -o \
#             -type d -a -name 'tensorboard' \
#         \) -exec rm -rf '{}' +

# # Stage 2: Runtime
# FROM python:3.12-slim

# WORKDIR /app

# # Install runtime dependencies needed for gRPC and ML libraries
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgomp1 \
#     libglib2.0-0 \
#     && rm -rf /var/lib/apt/lists/*

# # Copy only the necessary virtual environment
# COPY --from=builder /opt/venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH" \
#     PYTHONPATH="/opt/venv/lib/python3.12/site-packages" \
#     PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     OMP_NUM_THREADS=1 \
#     MKL_NUM_THREADS=1 \
#     TRANSFORMERS_CACHE=/root/.cache/huggingface

# # Copy application code
# COPY main.py ./

# EXPOSE 50052

# # Use the virtual environment Python
# CMD ["/opt/venv/bin/python", "main.py"]

# Stage 1: Builder
# FROM python:3.12-slim as builder

# WORKDIR /app

# # Install essential build dependencies and tools
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     python3-dev \
#     gcc \
#     g++ \
#     libgomp1 \
#     && apt-get clean && rm -rf /var/lib/apt/lists/*

# # Create a virtual environment
# RUN python -m venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH"

# # Upgrade pip and install only the necessary dependencies
# COPY requirements.txt .
# RUN pip install --no-cache-dir --upgrade pip && \
#     # Install core dependencies like PyTorch CPU and transformers
#     pip install --no-cache-dir \
#     torch==2.2.1 -f https://download.pytorch.org/whl/cpu \
#     #opencv-python-headless==4.10.0.84 \
#     transformers==4.38.2 \
#     numpy==1.26.0 \
#     grpcio==1.62.1 \
#     protobuf==4.25.3 \
#     && \
#     # Install remaining requirements
#     pip install --no-cache-dir -r requirements.txt && \
#     # Cleanup unnecessary files from the virtual environment
#     find /opt/venv -depth \
#         \( \
#             -type d -a -name '__pycache__' -o \
#             -type f -a -name '*.pyc' -o \
#             -type f -a -name '*.pyo' -o \
#             -type d -a -name 'tests' -o \
#             -type d -a -name 'docs' -o \
#             -type d -a -name 'examples' -o \
#             -type d -a -name '.git' \
#         \) -exec rm -rf '{}' +

# # Stage 2: Runtime
# FROM python:3.12-slim

# WORKDIR /app

# # Install runtime dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgomp1 \
#     libglib2.0-0 \
#     && apt-get clean && rm -rf /var/lib/apt/lists/*

# # Copy only the virtual environment from the builder stage
# COPY --from=builder /opt/venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH" \
#     PYTHONPATH="/opt/venv/lib/python3.12/site-packages" \
#     PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     OMP_NUM_THREADS=1 \
#     MKL_NUM_THREADS=1 \
#     TRANSFORMERS_CACHE=/root/.cache/huggingface

# # Copy application code
# COPY main.py ./

# EXPOSE 50052

# # Use the virtual environment Python
# CMD ["/opt/venv/bin/python", "main.py"]





# syntax=docker/dockerfile:1
# FROM python:3.12-slim AS builder

# # Install build dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     python3-dev \
#     gcc \
#     g++ \
#     libgomp1 \
#  && rm -rf /var/lib/apt/lists/*

# # Create a virtual environment
# RUN python -m venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH"

# # Upgrade pip
# RUN pip install --no-cache-dir --upgrade pip

# # Copy and install dependencies:
# # First install core libraries (with pinned versions) then the rest from requirements.txt
# COPY requirements.txt .
# RUN pip install --no-cache-dir \
#     torch==2.2.1 -f https://download.pytorch.org/whl/cpu \
#     transformers==4.38.2 \
#     numpy==1.26.0 \
#     grpcio==1.62.1 \
#     protobuf==4.25.3 && \
#     pip install --no-cache-dir -r requirements.txt && \
#     # Remove unnecessary files to slim the image
#     find /opt/venv -depth \( \
#         -type d -name '__pycache__' -o \
#         -type f -name '*.pyc' -o \
#         -type f -name '*.pyo' -o \
#         -type d -name 'tests' -o \
#         -type d -name 'docs' -o \
#         -type d -name 'examples' -o \
#         -type d -name '.git' \
#     \) -exec rm -rf '{}' +

# # Final runtime image
# FROM python:3.12-slim

# # Install runtime dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgomp1 \
#     libglib2.0-0 \
#  && rm -rf /var/lib/apt/lists/*

# WORKDIR /app

# # Copy the virtual environment from the builder stage
# COPY --from=builder /opt/venv /opt/venv

# # Set environment variables for reproducibility and performance
# ENV PATH="/opt/venv/bin:$PATH" \
#     PYTHONPATH="/opt/venv/lib/python3.12/site-packages" \
#     PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     OMP_NUM_THREADS=1 \
#     MKL_NUM_THREADS=1 \
#     # TRANSFORMERS_CACHE=/root/.cache/huggingface
#     HF_HOME=/root/.cache/huggingface

# # Copy application code (adjust as needed)
# COPY main.py ./

# EXPOSE 50052

# CMD ["/opt/venv/bin/python", "main.py"]


# Builder stage with minimal build dependencies

FROM python:3.12-slim AS builder

# Install only essential build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    gcc \
    g++ \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create and activate virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and install wheel for better package handling
RUN pip install --no-cache-dir --upgrade pip wheel setuptools

# Copy requirements and install dependencies in layers for better caching
COPY requirements.txt .

# Install PyTorch and core dependencies first
RUN pip install --no-cache-dir \
    torch==2.2.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu \
    transformers==4.38.2 \
    numpy==1.26.0 \
    grpcio==1.62.1 \
    protobuf==4.25.3

# Install remaining requirements
RUN pip install --no-cache-dir -r requirements.txt

# Cleanup pip cache and unnecessary files
RUN pip cache purge && \
    rm -rf /root/.cache/pip/* && \
    find /opt/venv -depth \( \
        -type d -name '__pycache__' -o \
        -type f -name '*.pyc' -o \
        -type f -name '*.pyo' -o \
        -type d -name 'tests' -o \
        -type d -name 'test' -o \
        -type d -name 'docs' -o \
        -type d -name 'examples' -o \
        -type d -name '.git' -o \
        -type f -name '*.md' -o \
        -type f -name 'LICENSE*' -o \
        -type f -name 'README*' \
    \) -exec rm -rf '{}' + && \
    find /opt/venv -type d -empty -delete

# Final stage
FROM python:3.12-slim

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

WORKDIR /app

# Copy virtual environment from builder
# COPY --from=builder /opt/venv /opt/venv
# RUN if [ -f /app/.env ]; then cp /opt/venv /opt/venv; else echo ".env not found, skipping"; fi


# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONPATH="/opt/venv/lib/python3.12/site-packages" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    HF_HOME=/root/.cache/huggingface \
    TRANSFORMERS_CACHE=/root/.cache/huggingface \
    TORCH_HOME=/root/.cache/torch

# Create cache directories with correct permissions
RUN mkdir -p /root/.cache/huggingface /root/.cache/torch && \
    chmod -R 777 /root/.cache

# Copy application code
COPY main.py ./

# Expose port for gRPC
EXPOSE 50052

# Set default command
# CMD ["/opt/venv/bin/python", "main.py"]
CMD ["sh", "-c", "if [ -f /app/.env ]; then source /app/.env; fi && /opt/venv/bin/python main.py"]

