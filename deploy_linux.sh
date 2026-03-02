#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Starting deployment process for Vee...${NC}"

# 1. Check for Node.js and npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js (v18+ recommended).${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js and npm are installed.${NC}"

# 2. Check for PM2, install globally if not present
if ! command -v pm2 &> /dev/null; then
    echo -e "${BLUE}Installing PM2 globally...${NC}"
    sudo npm install -g pm2
    echo -e "${GREEN}PM2 installed.${NC}"
else
    echo -e "${GREEN}PM2 is already installed.${NC}"
fi

# 3. Install dependencies and build Frontend
echo -e "${BLUE}Setting up Frontend...${NC}"
cd frontend
npm install
echo -e "${BLUE}Building Frontend...${NC}"
npm run build
cd ..
echo -e "${GREEN}Frontend build complete.${NC}"

# 4. Install dependencies for Backend
echo -e "${BLUE}Setting up Backend...${NC}"
cd backend
npm install
cd ..
echo -e "${GREEN}Backend dependencies installed.${NC}"

# 5. Start or restart the application using PM2
echo -e "${BLUE}Starting application with PM2...${NC}"
cd backend

# Check if app is already running in PM2
if pm2 status | grep -q "vee-app"; then
    echo -e "${BLUE}Restarting existing PM2 process 'vee-app'...${NC}"
    pm2 restart vee-app
else
    echo -e "${BLUE}Starting new PM2 process 'vee-app'...${NC}"
    pm2 start server.js --name vee-app
fi

echo -e "${GREEN}Application started successfully!${NC}"

# 6. Save PM2 list so it restarts on system reboot
echo -e "${BLUE}Saving PM2 configuration...${NC}"
pm2 save

echo -e "--------------------------------------------------------"
echo -e "${GREEN}Deployment finished! Your application is now running globally via PM2.${NC}"
echo -e "To ensure PM2 starts on server boot, run the following command if you haven't already:"
echo -e "${BLUE}pm2 startup${NC}"
echo -e "And follow the instructions generated on screen."
echo -e "--------------------------------------------------------"
