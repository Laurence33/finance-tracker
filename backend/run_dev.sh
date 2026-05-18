#!/bin/bash

cd layers/ft-common-layer
npm run build
cd ../../

CONTAINER_IDS=$(docker ps --filter "label=com.amazonaws.sam.resource" -q)

if [ -z "$CONTAINER_IDS" ]; then
  echo "No SAM containers running."
else
  echo "Stopping SAM containers..."
  echo "$CONTAINER_IDS" | xargs docker stop
  echo "Done."
fi

sam build
sam local start-api --env-vars env.json