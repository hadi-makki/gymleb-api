#! /bin/bash

yarn install

yarn build

pm2 restart gymleb-api