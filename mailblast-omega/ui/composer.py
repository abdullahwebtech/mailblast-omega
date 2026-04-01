import customtkinter as ctk

class ComposerView(ctk.CTkFrame):
    def __init__(self, parent, db):
        super().__init__(parent, fg_color="transparent")
        self.db = db
        
        # 4 Column Layout Spec
        self.grid_columnconfigure(0, weight=1, minsize=260)  # Config
        self.grid_columnconfigure(1, weight=3)               # Body
        self.grid_columnconfigure(2, weight=1, minsize=220)  # Variables
        self.grid_columnconfigure(3, weight=1, minsize=260)  # Preview
        self.grid_rowconfigure(0, weight=1)

        # Col 1
        col1 = ctk.CTkFrame(self, fg_color="#0E0E14", corner_radius=0, border_color="#1A1A28", border_width=1)
        col1.grid(row=0, column=0, sticky="nsew", padx=2, pady=2)
        ctk.CTkLabel(col1, text="Campaign Name", font=("JetBrains Mono", 11)).pack(anchor="w", padx=10, pady=10)
        self.camp_name = ctk.CTkEntry(col1, placeholder_text="Name...")
        self.camp_name.pack(fill="x", padx=10)
        
        ctk.CTkLabel(col1, text="Upload Contacts", font=("JetBrains Mono", 11)).pack(anchor="w", padx=10, pady=10)
        ctk.CTkButton(col1, text="📁 Drop file or browse", fg_color="#1C1C25", hover_color="#1A1A2E").pack(fill="x", padx=10)
        
        ctk.CTkLabel(col1, text="Send Speed", font=("JetBrains Mono", 11)).pack(anchor="w", padx=10, pady=10)
        self.speed = ctk.CTkSlider(col1, from_=0, to=10, button_color="#00E5FF", progress_color="#00B4CC")
        self.speed.pack(fill="x", padx=10)
        self.speed.set(10)

        # Col 2
        col2 = ctk.CTkFrame(self, fg_color="#060608", corner_radius=0)
        col2.grid(row=0, column=1, sticky="nsew", padx=2, pady=2)
        ctk.CTkLabel(col2, text="Subject", font=("JetBrains Mono", 12)).pack(anchor="w", padx=15, pady=(15, 5))
        self.subject = ctk.CTkEntry(col2, placeholder_text="Enter subject...", font=("SF Pro Text", 14), height=40)
        self.subject.pack(fill="x", padx=15)
        
        ctk.CTkLabel(col2, text="Body", font=("JetBrains Mono", 12)).pack(anchor="w", padx=15, pady=(15, 5))
        self.body = ctk.CTkTextbox(col2, font=("SF Pro Text", 13), border_width=1, border_color="#1A1A28", fg_color="#0A0A0E")
        self.body.pack(fill="both", expand=True, padx=15, pady=(0, 15))

        # Col 3
        col3 = ctk.CTkFrame(self, fg_color="#0A0A0E", corner_radius=0, border_color="#1A1A28", border_width=1)
        col3.grid(row=0, column=2, sticky="nsew", padx=2, pady=2)
        ctk.CTkLabel(col3, text="VARIABLES", font=("JetBrains Mono", 12, "bold"), text_color="#00E5FF").pack(anchor="w", padx=10, pady=10)
        self.vars_list = ctk.CTkScrollableFrame(col3, fg_color="transparent")
        self.vars_list.pack(fill="both", expand=True)
        # Dummy vars
        for v in ["{Website}", "{Company}", "{FirstName}", "{Industry}", "{SenderName}"]:
            ctk.CTkLabel(self.vars_list, text=v, font=("JetBrains Mono", 11), text_color="#A0FFA0").pack(anchor="w", padx=5, pady=2)

        # Col 4
        col4 = ctk.CTkFrame(self, fg_color="#0E0E14", corner_radius=0, border_color="#1A1A28", border_width=1)
        col4.grid(row=0, column=3, sticky="nsew", padx=2, pady=2)
        ctk.CTkLabel(col4, text="LIVE PREVIEW", font=("JetBrains Mono", 12, "bold")).pack(anchor="w", padx=10, pady=10)
        self.preview = ctk.CTkTextbox(col4, font=("SF Pro Text", 12), fg_color="#121218", state="disabled")
        self.preview.pack(fill="both", expand=True, padx=10, pady=(0, 10))

        # Bottom Bar
        bottom = ctk.CTkFrame(self, height=60, fg_color="#18181F", corner_radius=0, border_color="#1A1A28", border_width=1)
        bottom.grid(row=1, column=0, columnspan=4, sticky="ew")
        
        ctk.CTkButton(bottom, text="▶▶ SEND ALL NOW", font=("JetBrains Mono", 13, "bold"), fg_color="#00E5FF", text_color="#060608", hover_color="#00B4CC").pack(side="right", padx=20, pady=15)
        ctk.CTkButton(bottom, text="📅 Schedule", fg_color="#1C1C25").pack(side="right", padx=10)
        ctk.CTkButton(bottom, text="🧪 Test Send", fg_color="#1C1C25").pack(side="right", padx=10)
