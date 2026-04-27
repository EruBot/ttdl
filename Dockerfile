FROM node:18

WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund --prefer-offline

COPY . .

CMD ["npm", "start"]
