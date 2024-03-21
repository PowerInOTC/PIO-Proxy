FROM node:latest

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

COPY . .

EXPOSE 3000

CMD ["npm", "start"]