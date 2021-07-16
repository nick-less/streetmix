# use a specific version known to work
FROM node:14.17.3-alpine3.14 as streetmix-base
# define folder where app will be placed
WORKDIR /usr/src/app
# this is a bit tricky, while the frontend bundling needs development enviroment,
# the backend should run in production mode, we could just install everthing, but this gives a *huge* image
# since we cant refactor the two parts into seperate modules (as it should be), we build the frontend using
# development enviroment, and start over with production enviroment
ENV NODE_ENV=development
# package install first, so we get an extra layer to speed up building later on
COPY package*.json ./
# install everything
RUN npm install --no-optional
# copy app source
COPY . /usr/src/app/
# set environment to prod, because we want to bundle prod using development tools
ENV NODE_ENV=production 
RUN npm run postinstall
# we have now our frontend bundle in "build" and lots of development dependencies in node_module, so start over with a clean image
FROM node:14.17.3-alpine3.14
# need to set workdir again, since we started from scratch
WORKDIR /usr/src/app
# copy app
COPY . . 
# get the bundle we just built
COPY --from=streetmix-base /usr/src/app/build /usr/src/app/build
# set production mode
ENV NODE_ENV=production 
ENV ENV=production
RUN npm install --only=production --no-optional
# at this point, we should have a much smaller image
# publish app using entry script
RUN chmod +x docker/entrypoint.sh
EXPOSE 8000
ENTRYPOINT [ "docker/entrypoint.sh" ]
