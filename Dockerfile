FROM node:20-slim
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
