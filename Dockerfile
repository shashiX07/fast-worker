FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Expose the port your app runs on (change if needed)
EXPOSE 3000

# Start the app (change if needed)
CMD ["npm", "run", "dev"]