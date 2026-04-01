import customtkinter as ctk
import sys
import threading
from data.db import get_db

from ui.dashboard import DashboardView
from ui.composer import ComposerView
from ui.ai_studio import AIStudioView
from ui.accounts import AccountsView
from ui.settings import SettingsView

# Stubs for incomplete views
class DummyView(ctk.CTkFrame):
    def __init__(self, parent, name="View"):
        super().__init__(parent, fg_color="transparent")
        ctk.CTkLabel(self, text=f"{name} View — Under Construction", font=("JetBrains Mono", 20)).pack(expand=True)

class Sidebar(ctk.CTkFrame):
    def __init__(self, parent, on_nav):
        super().__init__(parent, fg_color="#0A0A0E", width=240, corner_radius=0)
        self.pack_propagate(False)
        self.on_nav = on_nav
        
        # Left Accent Bar
        accent_bar = ctk.CTkFrame(self, fg_color="#00E5FF", width=2, corner_radius=0)
        accent_bar.pack(side="left", fill="y")
        
        title = ctk.CTkLabel(self, text="⚡ OMEGA", font=("JetBrains Mono", 18, "bold"), text_color="#00E5FF")
        title.pack(pady=(20, 2), padx=20, anchor="w")
        
        subtitle = ctk.CTkLabel(self, text="Private Build", font=("JetBrains Mono", 10), text_color="#707088")
        subtitle.pack(pady=(0, 20), padx=20, anchor="w")

        nav_items = ["Dashboard", "Compose", "Rotation", "Scheduler", "AI Studio", 
                     "Analytics", "Warm-Up", "Accounts", "Templates", "Blacklist", "Settings"]
        
        self.buttons = []
        for item in nav_items:
            btn = ctk.CTkButton(self, text=item, fg_color="transparent", text_color="#707088",
                                hover_color="#1E1E28", anchor="w", font=("SF Pro Text", 13),
                                command=lambda name=item: self._click(name))
            btn.pack(pady=2, padx=10, fill="x")
            self.buttons.append((item, btn))
            
    def _click(self, name):
        for n, btn in self.buttons:
            if n == name:
                btn.configure(fg_color="#1E1E28", text_color="#00E5FF")
            else:
                btn.configure(fg_color="transparent", text_color="#707088")
        self.on_nav(name)

class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        self.title("OMEGA // Private Build")
        self.geometry("1400x900")
        self.configure(fg_color="#060608")
        
        self.db = get_db()
        
        # Initialize tracking server in background
        from tracking.server import start_tracking_server
        self.tracking_url = start_tracking_server()

        # Layout
        self.sidebar = Sidebar(self, self.show_view)
        self.sidebar.pack(side="left", fill="y")
        
        self.main_container = ctk.CTkFrame(self, fg_color="#060608", corner_radius=0)
        self.main_container.pack(side="right", fill="both", expand=True)

        self.views = {
            "Dashboard": DashboardView(self.main_container, self.db),
            "Compose": ComposerView(self.main_container, self.db),
            "AI Studio": AIStudioView(self.main_container, self.db),
            "Rotation": DummyView(self.main_container, "Rotation"),
            "Scheduler": DummyView(self.main_container, "Scheduler"),
            "Analytics": DummyView(self.main_container, "Analytics"),
            "Warm-Up": DummyView(self.main_container, "Warm-Up"),
            "Accounts": AccountsView(self.main_container, self.db),
            "Templates": DummyView(self.main_container, "Templates"),
            "Blacklist": DummyView(self.main_container, "Blacklist"),
            "Settings": SettingsView(self.main_container, self.db)
        }
            
        self.current_view = None
        self.sidebar._click("Dashboard")

    def show_view(self, name):
        if self.current_view:
            self.current_view.pack_forget()
        self.current_view = self.views[name]
        self.current_view.pack(fill="both", expand=True)

