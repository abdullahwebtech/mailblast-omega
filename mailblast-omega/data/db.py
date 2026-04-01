import os

if os.environ.get("DATABASE_URL", "").startswith("postgres"):
    print("DB_ROUTER: Detected DATABASE_URL, using PostgreSQL (db_postgres.py)")
    from data.db_postgres import *
else:
    print("DB_ROUTER: No PostgreSQL URL, defaulting to local SQLite (db_sqlite.py)")
    from data.db_sqlite import *
