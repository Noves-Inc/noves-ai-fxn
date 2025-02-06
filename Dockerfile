# Use Node.js LTS version
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files and .env
COPY . .
COPY .env.example .env

# Build TypeScript files
RUN npm run build

# Set environment variables
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

