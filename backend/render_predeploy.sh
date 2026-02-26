#!/usr/bin/env bash
set -euo pipefail

python manage.py migrate

python manage.py shell -c "
import os
from django.contrib.auth import get_user_model

username = os.getenv('ADMIN_USERNAME')
password = os.getenv('ADMIN_PASSWORD')
email = os.getenv('ADMIN_EMAIL', '')

if username and password:
    User = get_user_model()
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f'Created superuser: {username}')
    else:
        print(f'Superuser already exists: {username}')
else:
    print('ADMIN_USERNAME/ADMIN_PASSWORD not set; skipping superuser creation.')
"
