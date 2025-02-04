# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Build TypeScript files
RUN npm run build

# Set environment variables from .env file at runtime
ENV NODE_ENV=production

# Expose any necessary ports (if needed)
EXPOSE 3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nodeuser \
    && chown -R nodeuser:nodejs /app

USER nodeuser

# Start the application
CMD ["npm", "start"] 