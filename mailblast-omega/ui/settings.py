import customtkinter as ctk

class SettingsView(ctk.CTkFrame):
    def __init__(self, parent, db):
        super().__init__(parent, fg_color="transparent")
        self.db = db

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=30, pady=20)
        ctk.CTkLabel(header, text="⚙️ Settings", font=("JetBrains Mono", 24, "bold")).pack(side="left")

        body = ctk.CTkFrame(self, fg_color="#0E0E14", corner_radius=8, border_width=1, border_color="#1A1A28")
        body.pack(fill="both", expand=True, padx=30, pady=(0, 30))
        
        # General Settings
        ctk.CTkLabel(body, text="GENERAL", font=("JetBrains Mono", 12, "bold"), text_color="#00E5FF").pack(anchor="w", padx=20, pady=(20, 10))
        
        sw1 = ctk.CTkSwitch(body, text="Enable Local API Bridge (Port 8000)", progress_color="#00E5FF", font=("SF Pro Text", 13))
        sw1.pack(anchor="w", padx=20, pady=10)
        sw1.select()
        
        sw2 = ctk.CTkSwitch(body, text="Start Tracking Server on Launch (Port 5500)", progress_color="#00E5FF", font=("SF Pro Text", 13))
        sw2.pack(anchor="w", padx=20, pady=10)
        sw2.select()

        # Database
        ctk.CTkLabel(body, text="DATABASE", font=("JetBrains Mono", 12, "bold"), text_color="#00E5FF").pack(anchor="w", padx=20, pady=(30, 10))
        path_frame = ctk.CTkFrame(body, fg_color="transparent")
        path_frame.pack(fill="x", padx=20, pady=5)
        
        ctk.CTkLabel(path_frame, text="SQLite Path:", font=("SF Pro Text", 13), width=100, anchor="w").pack(side="left")
        path_entry = ctk.CTkEntry(path_frame, width=300)
        path_entry.pack(side="left", padx=10)
        path_entry.insert(0, "database/omega.db")
        path_entry.configure(state="disabled")

        ctk.CTkButton(body, text="Backup Database", fg_color="#1C1C25").pack(anchor="w", padx=20, pady=20)
