import uuid
import re

def inject_tracking_pixel(body_html: str, tracking_id: str, server_url: str) -> str:
    pixel_url = f"{server_url}/p/{tracking_id}.gif"
    pixel_tag = f'<img src="{pixel_url}" width="1" height="1" alt="" style="display:none!important;"/>'
    
    if "</body>" in body_html.lower():
        body_html = re.sub(r'</body>', f'{pixel_tag}</body>', body_html, flags=re.IGNORECASE)
    else:
        body_html += pixel_tag
    
    return body_html

def inject_click_tracking(body_html: str, tracking_id: str, server_url: str) -> str:
    def replace_link(match):
        original_url = match.group(1)
        if "unsubscribe" in original_url.lower():
            return match.group(0)
        tracked = f"{server_url}/c/{tracking_id}?url={original_url}"
        return f'href="{tracked}"'
    
    return re.sub(r'href="(https?://[^"]+)"', replace_link, body_html)

def generate_tracking_id() -> str:
    return str(uuid.uuid4()).replace("-", "")

def get_unsub_link(tracking_id: str, server_url: str) -> str:
    return f"{server_url}/unsub/{tracking_id}"
