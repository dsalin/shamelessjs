FROM eu.gcr.io/kovan-1074/node:5.2.0

WORKDIR /app

COPY package.json /app/
RUN npm install --production --unsafe-perm
COPY . /app

EXPOSE 3000

CMD ["node", "/app/build/index.js"]
