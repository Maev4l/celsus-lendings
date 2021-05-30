#!/bin/sh
HOST=$1

echo "Waiting for localstack at address http://$HOST:4566/health, attempting every 5s"
until $(curl --silent --fail http://$HOST:4566/health | grep "\"initScripts\": \"initialized\"" > /dev/null); do
    printf 'localstack not up.\n'
    sleep 5s
done
echo ' Success: Reached localstack'