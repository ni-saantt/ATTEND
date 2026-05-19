#!/usr/bin/env python3
"""Seed a Platform Admin user. Run: python scripts/seed_platform_admin.py your@email.com yourpassword"""
import sys
import os

# Add app to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.auth.jwt import hash_password

if len(sys.argv) < 3:
    print("Usage: python seed_platform_admin.py <email> <password>")
    sys.exit(1)

email = sys.argv[1].strip().lower()
password = sys.argv[2]
hashed = hash_password(password)
print(f"Run this SQL in Supabase:")
print(f"""
INSERT INTO users (email, password_hash, role, college_id, department_id, email_verified)
VALUES ('{email}', '{hashed}', 'PLATFORM_ADMIN', NULL, NULL, TRUE)
ON CONFLICT (email) DO NOTHING;
""")
