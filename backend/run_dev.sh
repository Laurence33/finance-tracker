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
# Bind to every interface, not just 127.0.0.1, so a phone on the same network
# can reach the API. Without this the frontend is reachable at the machine's LAN
# address but the backend is not, and every request fails at the TCP level.
sam local start-api --env-vars env.json --host 0.0.0.0