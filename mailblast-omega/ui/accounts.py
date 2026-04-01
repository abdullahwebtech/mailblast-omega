import customtkinter as ctk

class AccountsView(ctk.CTkFrame):
    def __init__(self, parent, db):
        super().__init__(parent, fg_color="transparent")
        self.db = db

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=30, pady=20)
        ctk.CTkLabel(header, text="🛡️ Connected Accounts", font=("JetBrains Mono", 24, "bold")).pack(side="left")

        # Buttons
        btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        btn_frame.pack(fill="x", padx=30, pady=(0, 20))
        
        ctk.CTkButton(btn_frame, text="+ Add Gmail", fg_color="#EA4335", hover_color="#C5221F").pack(side="left", padx=(0, 10))
        ctk.CTkButton(btn_frame, text="+ Add Outlook", fg_color="#0078D4", hover_color="#005A9E").pack(side="left", padx=(0, 10))
        ctk.CTkButton(btn_frame, text="+ Add Generic SMTP", fg_color="#00E5FF", text_color="#000", hover_color="#00B4CC").pack(side="left", padx=(0, 10))

        # List
        self.list_frame = ctk.CTkScrollableFrame(self, fg_color="#0E0E14", corner_radius=8, border_width=1, border_color="#1A1A28")
        self.list_frame.pack(fill="both", expand=True, padx=30, pady=(0, 30))
        
        self.refresh()

    def refresh(self):
        for widget in self.list_frame.winfo_children():
            widget.destroy()
            
        headers = ["Provider", "Email", "Status", "Total Sent", "Reputation", "Warm-up"]
        for i, h in enumerate(headers):
            ctk.CTkLabel(self.list_frame, text=h, font=("JetBrains Mono", 12, "bold"), text_color="#707088").grid(row=0, column=i, padx=20, pady=10, sticky="w")
            
        accounts = self.db.get_all_accounts()
        if not accounts:
            ctk.CTkLabel(self.list_frame, text="No accounts connected.", font=("SF Pro Text", 14), text_color="#3A3A50").grid(row=1, column=0, columnspan=6, pady=40)
            return

        for row_idx, acc in enumerate(accounts, start=1):
            ctk.CTkLabel(self.list_frame, text=acc["provider"].upper(), font=("JetBrains Mono", 12)).grid(row=row_idx, column=0, padx=20, pady=10, sticky="w")
            ctk.CTkLabel(self.list_frame, text=acc["email"], font=("SF Pro Text", 13)).grid(row=row_idx, column=1, padx=20, pady=10, sticky="w")
            
            status_text = "🟢 Active" if acc["is_active"] else "🔴 Inactive"
            ctk.CTkLabel(self.list_frame, text=status_text).grid(row=row_idx, column=2, padx=20, pady=10, sticky="w")
            
            ctk.CTkLabel(self.list_frame, text=str(acc["total_sent"])).grid(row=row_idx, column=3, padx=20, pady=10, sticky="w")
            ctk.CTkLabel(self.list_frame, text=f"{acc['reputation_score']}/100").grid(row=row_idx, column=4, padx=20, pady=10, sticky="w")
            
            warmup = f"Day {acc['warmup_day']}" if acc['warmup_mode'] else "Inactive"
            ctk.CTkLabel(self.list_frame, text=warmup).grid(row=row_idx, column=5, padx=20, pady=10, sticky="w")
