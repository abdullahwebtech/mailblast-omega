import os
import re

FRONTEND_DIR = "mailblast-web/src"

# This regex matches 'http://localhost:8000/api/...' OR "http://localhost:8000/api/..." OR `http://localhost:8000/api/...`
# and captures the trailing part of the string
pattern_http = re.compile(r"(['\"`])http://localhost:8000(.*?)\1")
pattern_ws = re.compile(r"(['\"`])ws://localhost:8000(.*?)\1")

for root, dirs, files in os.walk(FRONTEND_DIR):
    for name in files:
        if name.endswith((".ts", ".tsx")):
            filepath = os.path.join(root, name)
            with open(filepath, "r") as f:
                content = f.read()
            
            # Sub with a proper template literal wrapping the entire string
            # e.g. `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\2`
            # Where \2 is the rest of the path, e.g. /api/accounts
            
            new_content = pattern_http.sub(r"`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}\2`", content)
            new_content = pattern_ws.sub(r"`${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}\2`", new_content)

            if new_content != content:
                with open(filepath, "w") as f:
                    f.write(new_content)
                print(f"Updated {filepath}")
