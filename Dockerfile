# Use an official Node.js image as the base
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Set NODE_PATH to /app to help with module resolution
ENV NODE_PATH=/app

# Increase npm fetch timeout and retry settings
RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-factor 5 \
    && npm config set fetch-retry-mintimeout 10000

# Copy package.json and package-lock.json to the working directory
# This allows Docker to cache these layers, speeding up subsequent builds
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port your Next.js app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
