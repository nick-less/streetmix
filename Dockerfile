# use a specific version known to work
FROM node:14.17.3-alpine3.14 as streetmix-base
# define folder where app will be placed
WORKDIR /usr/src/app
# this is a bit tricky, while the frontend bundling needs development enviroment,
# the backend should run in production mode, we got just install everthing, but this gives a *huge* image
# since we cant refactor the two parts into seperate modules (as it should be), we build the frontend using
# development enviroment, and start over with production enviroment
ENV NODE_ENV=development
# package install first, so we get an extra layer to speed up building later on
COPY package*.json . 
RUN npm install --no-optional
# set environment variables
ENV NODE_ENV=production 
# Bundle app source
COPY . /usr/src/app/
RUN npm run postinstall
# we have now our frontend bundle in "build" and lots of development dependencies in node_module, so startover
FROM node:14.17.3-alpine3.14
WORKDIR /usr/src/app
COPY . . 
# with our bundle
COPY --from=streetmix-base /usr/src/app/build /usr/src/app/build
# and production dependencies
ENV NODE_ENV=production 
ENV ENV=production
RUN npm install --only=production --no-optional
# at this point, we should have a much smaller image
# publish app using entry script
RUN chmod +x docker/entrypoint.sh
EXPOSE 8000
ENTRYPOINT [ "docker/entrypoint.sh" ]
