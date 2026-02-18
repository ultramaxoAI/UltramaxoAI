#!/bin/bash
# Script Setup GPT4All di Ubuntu VPS

echo "Updating system..."
sudo apt update && sudo apt upgrade -y

echo "Installing Python and dependencies..."
sudo apt install python3-pip python3-venv -y

# Setup directory
mkdir -p ~/ultramaxo-ai
mv ~/main.py ~/requirements.txt ~/ultramaxo-ai/ 2>/dev/null

cd ~/ultramaxo-ai
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install requirements
pip install fastapi uvicorn gpt4all pydantic python-dotenv

echo "Setup COMPLETE! Ready for files."
