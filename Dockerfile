# Use the official Node.js runtime as a parent image
FROM node:20-slim

RUN mkdir -p /app
# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app
RUN rm -rf node_modules

# Install app dependencies
RUN npm install
RUN apt-get update && apt-get install ffmpeg libsm6 libxext6  -y

# Make port 8080 available to the world outside this container
# EXPOSE 8080

# Run the app when the container launches
CMD ["npm", "start"]