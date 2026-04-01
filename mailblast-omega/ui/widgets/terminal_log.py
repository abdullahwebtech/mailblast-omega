import customtkinter as ctk
from datetime import datetime
from ui.widgets.pulse_dot import ACCENT, STATUS_SUCCESS, STATUS_ERROR, TEXT_PRIMARY, TEXT_MUTED, BORDER, BG_ROOT

class TerminalLog(ctk.CTkTextbox):
    def __init__(self, parent, **kwargs):
        super().__init__(parent, fg_color=BG_ROOT, text_color=TEXT_PRIMARY, 
                         font=("Consolas", 11), border_color=BORDER, border_width=1, **kwargs)
        
        self.configure(state="disabled")

    def append_log(self, status: str, email: str, website: str, error: str = ""):
        self.configure(state="normal")
        
        now = datetime.now().strftime("%H:%M:%S")
        prefix = f"[{now}] "
        
        if status == "sent":
            symbol = "→ SENT     "
            color = ACCENT
        elif status == "opened":
            symbol = "★ OPENED   "
            color = STATUS_SUCCESS
        elif status == "failed":
            symbol = "✗ FAILED   "
            color = STATUS_ERROR
        else:
            symbol = "· SKIPPED  "
            color = TEXT_MUTED

        if error:
            error = f" reason: {error[:30]}"
            
        website_str = f"({website})" if website else ""
        
        line = f"{prefix}{symbol}{email:<25} {website_str:<15}{error}\n"
        self.insert("end", line)
        self.see("end")
        self.configure(state="disabled")
