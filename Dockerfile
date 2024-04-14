# Use the official Node.js runtime as a parent image
FROM node:18

RUN mkdir -p /app
# Set the working directory to /app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app
RUN rm -rf node_modules

# Install app dependencies
RUN npm install --production

# Run the app when the container launches
CMD ["node", "bot.js"]