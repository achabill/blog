#!/bin/bash

#back to root dir
cd ..

docker-compose -f docker-compose.test.yml  up --build --exit-code-from api