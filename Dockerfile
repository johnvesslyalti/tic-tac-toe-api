# Stage 1: Build the Node project
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only dependency files first (better caching)
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy rest of the code
COPY . .

# Build the TypeScript project
# (Note: we use build:node specifically to ensure /dist is created)
RUN npm run build:node

# Stage 2: Final minimal image for Production
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy built files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies and clean cache
RUN npm install --omit=dev && npm cache clean --force

# Security Hardening: Switch to the 'node' non-root user
USER node

# Expose app port
EXPOSE 5000

# Start the app
CMD ["node", "dist/index.js"]