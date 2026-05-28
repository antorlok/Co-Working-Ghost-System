# Build stage
FROM rust:1-bookworm AS builder

WORKDIR /app

# Cache dependency layer
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs \
    && cargo build --release \
    && rm -rf src

# Build application (migrations embedded via sqlx::migrate!)
COPY migrations ./migrations
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        libssl3 \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/reservations-service /usr/local/bin/reservations-service

EXPOSE 8003

CMD ["reservations-service"]
