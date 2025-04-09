# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS development

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install --only=development

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Production image
FROM node:18-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

# Copy built application from the build stage
COPY --from=development /usr/src/app/dist ./dist

# Expose port 3000 (or the port your NestJS app listens on)
EXPOSE 3000

# Define the command to run your app
CMD ["node", "dist/main"]
