# source FVV
FROM node:latest as streetmix

# define folder where app will be placed
WORKDIR /usr/src/app

# set environment variables
ENV NODE_ENV=production 

# update the image, because of some timing difference temporaly disable it
# install additionally some debugging tools
RUN apt-get -o Acquire::Check-Valid-Until=false -o Acquire::Check-Date=false update
RUN apt-get upgrade -y
RUN apt-get install vim -y
RUN apt-get install net-tools -y

# Bundle app source
COPY . .
RUN npm install --only=production && npm cache clean --force --loglevel=error
RUN npm run postinstall

# publish app using entry script
RUN chmod +x docker/entrypoint.sh
EXPOSE 8000
ENTRYPOINT [ "docker/entrypoint.sh" ]
