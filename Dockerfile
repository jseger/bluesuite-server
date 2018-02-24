FROM node:6
MAINTAINER Jesse Seger <jesse.seger@gmail.com>

RUN mkdir -p /usr/bluesuite/api
COPY . /usr/bluesuite/api
WORKDIR /usr/bluesuite/api
RUN npm install --production

ENV PORT 3000
EXPOSE  $PORT

CMD ["npm", "start"]