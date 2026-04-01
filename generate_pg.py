import os

with open("mailblast-omega/data/db.py", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "import sqlite3" in line:
        new_lines.append("import psycopg2\nimport psycopg2.extras\nfrom psycopg2.pool import ThreadedConnectionPool\n")
        continue

    # Setup the Database connection class overriding
    if "class Database:" in line:
        db_wrapper = """
DATABASE_URL = os.environ.get("DATABASE_URL", "")

class Database:
    def __init__(self, db_url: str = DATABASE_URL):
        self.db_url = db_url
        self.pool = ThreadedConnectionPool(1, 10, dsn=self.db_url)
        self._init_db()

    def _get_conn(self):
        class ConnWrapper:
            def __init__(self, pool):
                self.pool = pool
                self.conn = None
            def __enter__(self):
                self.conn = self.pool.getconn()
                self.conn.autocommit = False
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type:
                    self.conn.rollback()
                self.pool.putconn(self.conn)
            def execute(self, query, params=None):
                cur = self.conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
                query = query.replace("?", "%s")
                cur.execute(query, params or ())
                return cur
            def executescript(self, query):
                cur = self.conn.cursor()
                cur.execute(query)
            def commit(self):
                self.conn.commit()
        return ConnWrapper(self.pool)
"""
        new_lines.append(db_wrapper)
        continue
    
    # Skip original connection and init logic signatures
    if "def __init__" in line or "def _get_conn" in line and "class Database:" not in "".join(new_lines[-10:]):
        pass

    # Basic string replacements on the line level
    line = line.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
    line = line.replace("DATETIME('now', '-24 hours')", "NOW() - INTERVAL '24 hours'")
    line = line.replace("datetime('now', '-24 hours')", "NOW() - INTERVAL '24 hours'")
    line = line.replace("datetime('now', '-7 days')", "NOW() - INTERVAL '7 days'")
    line = line.replace("datetime('now', '-30 days')", "NOW() - INTERVAL '30 days'")
    line = line.replace("datetime('now', '-1 year')", "NOW() - INTERVAL '1 year'")
    line = line.replace("datetime('now', '-1 day')", "NOW() - INTERVAL '1 day'")
    line = line.replace("datetime('now', '-2 days')", "NOW() - INTERVAL '2 days'")
    line = line.replace("date('now', '-30 days')", "CURRENT_DATE - INTERVAL '30 days'")
    line = line.replace("date('now')", "CURRENT_DATE")
    line = line.replace("date(sent_at)", "DATE(sent_at)")
    line = line.replace("strftime('%Y-%m-%d %H:00:00', sent_at)", "date_trunc('hour', sent_at)")
    line = line.replace("strftime('%Y-%m', sent_at)", "date_trunc('month', sent_at)")

    # Conflict syntax
    line = line.replace("INSERT OR IGNORE INTO blacklist", "INSERT INTO blacklist")
    line = line.replace("INSERT OR REPLACE INTO internal_ips", "INSERT INTO internal_ips")
    if "VALUES (?, ?, CURRENT_TIMESTAMP)" in line and "internal_ips" in "".join(lines):
        line = line.replace("VALUES (?, ?, CURRENT_TIMESTAMP)", "VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(ip, user_agent) DO UPDATE SET last_seen = CURRENT_TIMESTAMP")
    if "VALUES (?, ?," in line and "blacklist" in "".join(lines) and "ON CONFLICT" not in line:
        pass # Wait, easiest is replace at the conn.execute level for blacklist
    
    # Returning ID
    line = line.replace('cursor.lastrowid if cursor.lastrowid else None', 'cursor.fetchone()[0] if cursor.rowcount > 0 else None')
    line = line.replace('return cursor.lastrowid', 'return cursor.fetchone()[0] if cursor.rowcount > 0 else None')
    
    if "ON CONFLICT(email, user_id) DO UPDATE SET {updates}" in line:
        line = line.replace("{updates}", "{updates} RETURNING id")
        
    if "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)" in line:
        line = line.replace("VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id")

    new_lines.append(line)

# Now fix the multi-line ON CONFLICT logic cleanly, wait, the simplest is handling the literal query blocks.
final_text = "".join(new_lines)
final_text = final_text.replace("INSERT INTO blacklist (email, reason) VALUES (?, ?)", "INSERT INTO blacklist (email, reason) VALUES (?, ?) ON CONFLICT (email, user_id) DO NOTHING")
final_text = final_text.replace("INSERT INTO blacklist (email, reason, user_id)\\n                VALUES (?, ?, ?)", "INSERT INTO blacklist (email, reason, user_id)\\n                VALUES (?, ?, ?) ON CONFLICT (email, user_id) DO NOTHING")
final_text = final_text.replace("INSERT INTO blacklist (email, reason, user_id)\n                VALUES (?, ?, ?)", "INSERT INTO blacklist (email, reason, user_id)\n                VALUES (?, ?, ?) ON CONFLICT (email, user_id) DO NOTHING")

# Clean up _get_conn and __init__ that was captured and inject cleanly
# We replaced class Database: with our chunk, but the original __init__ and _get_conn are still dumped!
import re
final_text = re.sub(r'    def __init__\(self, db_path: str = DB_PATH\):[\s\S]*?def _init_db\(self\):', r'    def _init_db(self):', final_text)

with open("mailblast-omega/data/db_postgres.py", "w") as f:
    f.write(final_text)
