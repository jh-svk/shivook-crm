FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci
# Placeholder so prisma generate can load prisma.config.ts without a real DB
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
