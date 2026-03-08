# Use Node.js base image
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY backend/ ./

# Expose the port (Hugging Face Spaces defaults to 7860)
ENV PORT=7860
EXPOSE 7860

# Start the application
CMD [ "node", "index.js" ]
