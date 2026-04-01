import customtkinter as ctk
from ui.widgets.stat_card import StatCard
from ui.widgets.terminal_log import TerminalLog
import threading
import time

class DashboardView(ctk.CTkFrame):
    def __init__(self, parent, db):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        
        # Header Stats
        stats_frame = ctk.CTkFrame(self, fg_color="transparent")
        stats_frame.pack(fill="x", pady=20, padx=20)
        
        self.cards = {}
        for i, (title, color) in enumerate([("Total Sent", "#00E5FF"), ("Open Rate", "#00FF9D"), 
                                            ("Click Rate", "#FFB800"), ("Today Sent", "#00E5FF")]):
            self.cards[title] = StatCard(stats_frame, title, "0", color)
            self.cards[title].pack(side="left", fill="x", expand=True, padx=5)

        # Body Split
        body_frame = ctk.CTkFrame(self, fg_color="transparent")
        body_frame.pack(fill="both", expand=True, padx=20, pady=(0, 20))
        
        # Left Panel (Charts / Campaigns)
        left_panel = ctk.CTkFrame(body_frame, fg_color="#0E0E14", corner_radius=8, border_width=1, border_color="#1A1A28")
        left_panel.pack(side="left", fill="both", expand=True, padx=(0, 10))
        
        ctk.CTkLabel(left_panel, text="Active Campaigns", font=("JetBrains Mono", 12, "bold")).pack(anchor="w", pady=10, padx=15)
        self.campaign_list = ctk.CTkScrollableFrame(left_panel, fg_color="transparent")
        self.campaign_list.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Right Panel (Live Terminal)
        right_panel = ctk.CTkFrame(body_frame, fg_color="#060608", corner_radius=8, width=400)
        right_panel.pack(side="right", fill="y", expand=False)
        right_panel.pack_propagate(False)
        
        ctk.CTkLabel(right_panel, text="LIVE TERMINAL FEED", font=("JetBrains Mono", 10), text_color="#707088").pack(anchor="w", pady=10, padx=10)
        self.terminal = TerminalLog(right_panel)
        self.terminal.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        self.refresh_stats()

    def refresh_stats(self):
        stats = self.db.get_global_stats()
        self.cards["Total Sent"].update_value(f"{stats['total_sent']:,}")
        self.cards["Open Rate"].update_value(f"{stats['open_rate']}%")
        self.cards["Click Rate"].update_value(f"{stats['click_rate']}%")
        self.cards["Today Sent"].update_value(f"{stats['today_sent']:,}")
        
        # Poll DB every 5s
        self.after(5000, self.refresh_stats)

    def log_event(self, status, email, website, error=""):
        self.terminal.append_log(status, email, website, error)
