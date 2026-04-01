import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(os.path.join(BASE_DIR, '..', 'database', 'omega.db'))

def run_migration():
    print(f"Opening database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys=off;")
    
    try:
        with conn:
            print("Beginning migration of 'accounts' table...")
            
            conn.execute("""
            CREATE TABLE accounts_new (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                provider        TEXT NOT NULL,
                email           TEXT NOT NULL,
                display_name    TEXT,
                token_path      TEXT,
                imap_host       TEXT,
                imap_port       INTEGER DEFAULT 993,
                smtp_host       TEXT,
                smtp_port       INTEGER DEFAULT 587,
                smtp_security   TEXT DEFAULT 'STARTTLS',
                username        TEXT,
                encrypted_pass  TEXT,           
                daily_limit     INTEGER DEFAULT 0,  
                warmup_mode     INTEGER DEFAULT 0,
                warmup_day      INTEGER DEFAULT 0,
                total_sent      INTEGER DEFAULT 0,
                reputation_score INTEGER DEFAULT 100,
                is_active       INTEGER DEFAULT 1,
                created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
                user_id         TEXT,
                deleted_at      TEXT DEFAULT NULL,
                UNIQUE(email, user_id)
            );
            """)
            
            print("Copying data into accounts_new...")
            conn.execute("""
            INSERT INTO accounts_new (
                id, provider, email, display_name, token_path,
                imap_host, imap_port, smtp_host, smtp_port, smtp_security,
                username, encrypted_pass, daily_limit, warmup_mode, warmup_day,
                total_sent, reputation_score, is_active, created_at, user_id, deleted_at
            )
            SELECT 
                id, provider, email, display_name, token_path,
                imap_host, imap_port, smtp_host, smtp_port, smtp_security,
                username, encrypted_pass, daily_limit, warmup_mode, warmup_day,
                total_sent, reputation_score, is_active, created_at, user_id, deleted_at
            FROM accounts;
            """)
            
            print("Dropping old 'accounts' table...")
            conn.execute("DROP TABLE accounts;")
            
            print("Renaming 'accounts_new' to 'accounts'...")
            conn.execute("ALTER TABLE accounts_new RENAME TO accounts;")
            
            print("Migration completed successfully!")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        try:
            conn.execute("DROP TABLE IF EXISTS accounts_new;")
        except:
            pass
    finally:
        conn.execute("PRAGMA foreign_keys=on;")
        conn.close()

if __name__ == "__main__":
    run_migration()
