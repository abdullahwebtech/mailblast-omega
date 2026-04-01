import customtkinter as ctk

# Colors based on Spec
BG_ROOT = "#060608"
BG_SIDEBAR = "#0A0A0E"
BG_PANEL = "#0E0E14"
BG_CARD = "#121218"
BG_INPUT = "#1C1C25"
ACCENT = "#00E5FF"
ACCENT_DIM = "#00B4CC"
STATUS_IDLE = "#3A3A50"
STATUS_SUCCESS = "#00FF9D"
STATUS_ERROR = "#FF3B5C"
STATUS_WARN = "#FFB800"
TEXT_PRIMARY = "#E8E8F0"
TEXT_SECONDARY = "#707088"
TEXT_MUTED = "#3A3A50"
BORDER = "#1A1A28"

class PulseDot(ctk.CTkLabel):
    def __init__(self, parent):
        super().__init__(parent, text="●", font=("Arial", 12))
        self._is_accent = True
        self._pulse()
        
    def _pulse(self):
        next_color = ACCENT if self._is_accent else STATUS_IDLE
        self.configure(text_color=next_color)
        self._is_accent = not self._is_accent
        self.after(800, self._pulse)
