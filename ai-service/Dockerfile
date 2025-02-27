
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

# FROM python:3.12-slim AS builder

# # Install only essential build dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     build-essential \
#     python3-dev \
#     gcc \
#     g++ \
#     libgomp1 \
#     && rm -rf /var/lib/apt/lists/* \
#     && apt-get clean

# # Create and activate virtual environment
# RUN python -m venv /opt/venv
# ENV PATH="/opt/venv/bin:$PATH"

# # Upgrade pip and install wheel for better package handling
# RUN pip install --no-cache-dir --upgrade pip wheel setuptools

# # Copy requirements and install dependencies in layers for better caching
# COPY requirements.txt .

# # Install PyTorch and core dependencies first
# RUN pip install --no-cache-dir \
#     torch==2.2.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu \
#     transformers==4.38.2 \
#     numpy==1.26.0 \
#     grpcio==1.62.1 \
#     protobuf==4.25.3

# # Install remaining requirements
# RUN pip install --no-cache-dir -r requirements.txt

# # Cleanup pip cache and unnecessary files
# RUN pip cache purge && \
#     rm -rf /root/.cache/pip/* && \
#     find /opt/venv -depth \( \
#         -type d -name '__pycache__' -o \
#         -type f -name '*.pyc' -o \
#         -type f -name '*.pyo' -o \
#         -type d -name 'tests' -o \
#         -type d -name 'test' -o \
#         -type d -name 'docs' -o \
#         -type d -name 'examples' -o \
#         -type d -name '.git' -o \
#         -type f -name '*.md' -o \
#         -type f -name 'LICENSE*' -o \
#         -type f -name 'README*' \
#     \) -exec rm -rf '{}' + && \
#     find /opt/venv -type d -empty -delete

# # Final stage
# FROM python:3.12-slim

# # Install only runtime dependencies
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgomp1 \
#     libglib2.0-0 \
#     && rm -rf /var/lib/apt/lists/* \
#     && apt-get clean

# WORKDIR /app

# # Copy virtual environment from builder
# COPY --from=builder /opt/venv /opt/venv
# COPY --from=builder /usr/local/lib/python3.12 /opt/venv/lib/python3.12
# # RUN if [ -f /app/.env ]; then cp /opt/venv /opt/venv; else echo ".env not found, skipping"; fi


# # Set environment variables
# ENV PATH="/opt/venv/bin:$PATH" \
#     PYTHONHOME="/opt/venv" \
#     PYTHONPATH="/opt/venv/lib/python3.12/site-packages" \
#     PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     OMP_NUM_THREADS=1 \
#     MKL_NUM_THREADS=1 \
#     HF_HOME=/root/.cache/huggingface \
#     TRANSFORMERS_CACHE=/root/.cache/huggingface \
#     TORCH_HOME=/root/.cache/torch

# # Create cache directories with correct permissions
# RUN mkdir -p /root/.cache/huggingface /root/.cache/torch && \
#     chmod -R 777 /root/.cache

# # Copy application code
# COPY main.py ./

# # Expose port for gRPC
# EXPOSE 50052

# # Set default command
# CMD ["/opt/venv/bin/python", "main.py"]
# # CMD ["sh", "-c", "if [ -f /app/.env ]; then source /app/.env; fi && /opt/venv/bin/python main.py"]


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
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /usr/local/lib/python3.12 /opt/venv/lib/python3.12

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONHOME="/opt/venv" \
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

# Copy ALL application code - make sure to include everything needed
COPY *.py ./
COPY *.json ./
# If you have module directories, copy them too
COPY modules/ ./modules/

# Expose port for gRPC
EXPOSE 50052

# Set default command
CMD ["/opt/venv/bin/python", "main.py"]