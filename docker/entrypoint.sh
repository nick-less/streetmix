#!/bin/bash

# build node app again with docker env variables
node app/bundle.js
echo "1"
# execute latest migration
npx sequelize db:migrate
echo "2"
# publish app
node index.js
