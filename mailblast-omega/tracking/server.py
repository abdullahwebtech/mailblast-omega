from flask import Flask, send_file, request, redirect
from flask_cors import CORS
import sqlite3
import io
import os
from datetime import datetime
from plyer import notification

app = Flask(__name__)
CORS(app)

PIXEL_GIF = bytes([
    0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,
    0x80,0x00,0x00,0xff,0xff,0xff,0x00,0x00,0x00,0x21,
    0xf9,0x04,0x00,0x00,0x00,0x00,0x00,0x2c,0x00,0x00,
    0x00,0x00,0x01,0x00,0x01,0x00,0x00,0x02,0x02,0x44,
    0x01,0x00,0x3b
])

def _get_db_path():
    return os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database", "omega.db")

@app.route("/p/<tracking_id>.gif")
def track_open(tracking_id):
    from data.db import mark_opened
    event_type = mark_opened(tracking_id, request.remote_addr, request.user_agent.string)
    
    if event_type and event_type.startswith("ignored_"):
        print(f"Flask Tracking: Ignored {tracking_id} - {event_type} (IP: {request.remote_addr})")
    return send_file(
        io.BytesIO(PIXEL_GIF),
        mimetype="image/gif"
    )

@app.route("/c/<tracking_id>")
def track_click(tracking_id):
    dest_url = request.args.get("url", "https://google.com")
    conn = sqlite3.connect(_get_db_path())
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, recipient, website FROM send_log WHERE tracking_id=?", (tracking_id,))
    row = cursor.fetchone()
    
    if row:
        now = datetime.utcnow().isoformat()
        cursor.execute("""
            UPDATE send_log 
            SET clicked=1, click_count=click_count+1
            WHERE tracking_id=?
        """, (tracking_id,))
        
        cursor.execute("""
            INSERT INTO tracking_events (tracking_id, event_type, ip_address, user_agent, url_clicked)
            VALUES (?, 'click', ?, ?, ?)
        """, (tracking_id, request.remote_addr, request.user_agent.string, dest_url))
        
        conn.commit()
        
    conn.close()
    return redirect(dest_url)

@app.route("/unsub/<tracking_id>")
def unsubscribe(tracking_id):
    conn = sqlite3.connect(_get_db_path())
    cursor = conn.cursor()
    cursor.execute("SELECT recipient FROM send_log WHERE tracking_id=?", (tracking_id,))
    row = cursor.fetchone()
    if row:
        cursor.execute("INSERT OR IGNORE INTO blacklist (email, reason) VALUES (?, 'unsubscribed')", (row[0], ))
        conn.commit()
    conn.close()
    return "<h2>You've been unsubscribed. You won't receive further emails.</h2>"

def start_tracking_server(port: int = 5500):
    import threading
    t = threading.Thread(target=lambda: app.run(port=port, debug=False, use_reloader=False), daemon=True)
    t.start()
    return f"http://localhost:{port}"

if __name__ == "__main__":
    app.run(port=5500, debug=True)
