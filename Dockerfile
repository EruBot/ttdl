FROM node:18

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund --prefer-offline

COPY . .

CMD ["node", "index.js"]
