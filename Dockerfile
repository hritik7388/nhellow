# Use official Node.js image
FROM node:18

# Create app directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all project files
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Start your application
CMD ["npm", "start"]
