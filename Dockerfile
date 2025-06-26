FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install # 这会安装包括 nodemon 在内的所有依赖
COPY . .
EXPOSE 3000
CMD ["npm", "start"] # 这个 CMD 会被 docker-compose.yml 中的 command 覆盖