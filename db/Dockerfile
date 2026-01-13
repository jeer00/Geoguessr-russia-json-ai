FROM postgis/postgis:15-3.3

# Install build tools including clang-11 (for bitcode generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ca-certificates \
    postgresql-server-dev-15 \
    clang-11 \
    llvm-11 \
    && rm -rf /var/lib/apt/lists/*

# Build and install pgvector
RUN cd /tmp && \
    git clone --depth 1 --branch v0.5.1 https://github.com/pgvector/pgvector.git && \
    cd pgvector && \
    make clean && \
    make && \
    make install && \
    rm -rf /tmp/pgvector

# Optional: Clean up build tools to reduce image size
RUN apt-get purge -y --auto-remove build-essential git postgresql-server-dev-15 clang-11 llvm-11 && \
    rm -rf /var/lib/apt/lists/*

# Optional: Create extension in template1 for all new databases
RUN echo "CREATE EXTENSION IF NOT EXISTS vector;" > /docker-entrypoint-initdb.d/10-vector.sql