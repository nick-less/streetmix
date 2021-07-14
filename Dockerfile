# source FVV
# use a specific version known to work
FROM node:14.17.3-alpine3.14 as streetmix-base

# define folder where app will be placed
WORKDIR /usr/src/app

# set environment variables
ENV NODE_ENV=production 
# just to be sure
ENV ENV=production

# Bundle app source
COPY . /usr/src/app/
RUN npm install --only=production && npm cache clean --only=production --force --loglevel=error
RUN npm run --only=production postinstall
#FROM streetmix-base AS streetmix

# publish app using entry script
RUN chmod +x docker/entrypoint.sh
EXPOSE 8000
ENTRYPOINT [ "docker/entrypoint.sh" ]
