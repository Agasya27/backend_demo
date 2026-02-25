#!/usr/bin/env bash
# exit on error
set -o errexit

# Change to backend directory
cd backend

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
