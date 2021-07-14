#!/bin/sh
# execute latest migration
npx sequelize db:migrate
# run app
node index.js
