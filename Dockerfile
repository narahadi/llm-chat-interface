# Use the official Bun image for the initial stages
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Combine install stages and use layer caching effectively
FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Production stage
FROM base AS release
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/.output ./.output
COPY --from=build /usr/src/app/package.json ./

# Ensure the container runs as a non-root user
USER bun

# Expose the port your app runs on
EXPOSE 3000

# Get Host from environment variable
ENV NUXT_HOST=0.0.0.0

CMD bun run .output/server/index.mjs --host $NUXT_HOST