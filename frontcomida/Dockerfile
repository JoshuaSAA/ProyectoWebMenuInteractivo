FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

# Limpieza más robusta antes de instalar
RUN rm -rf /root/.npm && npm cache clean --force

# Usa una versión estable de npm compatible
RUN npm install -g npm@10.8.2

# Instalar MQTT en la versión adecuada
RUN npm uninstall mqtt && npm install mqtt@4.3.7

# Instala dependencias
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]