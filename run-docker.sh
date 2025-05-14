#!/bin/bash

# Make sure Docker is running
echo "Checking if Docker is running..."
docker info > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
  echo "No .env file found. Creating one from example..."
  cp .env.example .env
  echo "Please edit .env with your API keys and try again."
  exit 1
fi

# Build and start the containers in detached mode
echo "Building and starting Docker containers..."
docker-compose up -d --build

echo "🚀 Invoice AI is running at http://localhost:3000"
echo "To view logs: docker-compose logs -f"
echo "To stop: docker-compose down" 