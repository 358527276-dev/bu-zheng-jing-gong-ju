FROM node:20-slim

WORKDIR /workspace

# 先装依赖（利用 Docker 层缓存）
COPY package.json package-lock.json ./
RUN npm install --omit=dev --registry=https://mirrors.tencent.com/npm/

# 再拷业务代码
COPY . .

# 数据目录
RUN mkdir -p data

EXPOSE 3000

CMD ["node", "server.js"]
