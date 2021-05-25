#!/bin/sh
echo "Waiting for localstack at address http://localhost:4566/health, attempting every 5s"
until $(curl --silent --fail http://localhost:4566/health | grep "\"initScripts\": \"initialized\"" > /dev/null); do
    printf 'localstack not up.\n'
    sleep 5s
done
echo ' Success: Reached localstack'