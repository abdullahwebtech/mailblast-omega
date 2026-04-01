import sqlite3
import os

db_path = "database/omega.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("ALTER TABLE campaigns ADD COLUMN is_test INTEGER DEFAULT 0")
        conn.commit()
        print("Successfully added is_test column to campaigns table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column is_test already exists.")
        else:
            print(f"Error migrating database: {e}")
    finally:
        conn.close()
else:
    print(f"Database not found at {db_path}. Skipping migration.")
