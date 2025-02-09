# Use lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install necessary system dependencies
RUN apk add --no-cache git chromium

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (only production, no devDependencies)
RUN npm install --legacy-peer-deps --force

# Copy all project files
COPY . .

# Ensure Puppeteer works properly
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install puppeteer --force

# Use `--omit=dev` instead of `prune`
RUN npm install --omit=dev --force

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create a non-root user and switch to it
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Expose port
EXPOSE 5000

# Start both Next.js and Telegram bot
CMD ["sh", "-c", "npm run startbot & npm start"]