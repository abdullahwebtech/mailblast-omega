import customtkinter as ctk

class AIStudioView(ctk.CTkFrame):
    def __init__(self, parent, db):
        super().__init__(parent, fg_color="transparent")
        self.db = db

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=30, pady=20)
        ctk.CTkLabel(header, text="🤖 AI Studio", font=("JetBrains Mono", 24, "bold")).pack(side="left")
        ctk.CTkLabel(header, text="Powered by Groq • LLaMA 3.3 70B", font=("JetBrains Mono", 11), text_color="#00E5FF").pack(side="left", padx=15, pady=6)

        body = ctk.CTkFrame(self, fg_color="transparent")
        body.pack(fill="both", expand=True, padx=30, pady=(0,30))

        # Left / Input
        left = ctk.CTkFrame(body, fg_color="#0E0E14", corner_radius=8, width=400)
        left.pack(side="left", fill="y")
        left.pack_propagate(False)

        ctk.CTkLabel(left, text="BRIEF", font=("JetBrains Mono", 12)).pack(anchor="w", padx=20, pady=20)
        
        self.product = ctk.CTkEntry(left, placeholder_text="Product or Service...", height=35)
        self.product.pack(fill="x", padx=20, pady=(0,10))
        
        self.audience = ctk.CTkEntry(left, placeholder_text="Target Audience...", height=35)
        self.audience.pack(fill="x", padx=20, pady=(0,10))

        self.tone = ctk.CTkOptionMenu(left, values=["Professional", "Friendly", "Direct", "Casual"], fg_color="#1C1C25", button_color="#00E5FF")
        self.tone.pack(fill="x", padx=20, pady=(0,10))

        ctk.CTkButton(left, text="✨ Generate", fg_color="#00E5FF", text_color="#060608", hover_color="#00B4CC", font=("JetBrains Mono", 14, "bold"), height=45).pack(fill="x", padx=20, pady=20)

        # Right / Output
        right = ctk.CTkFrame(body, fg_color="#121218", corner_radius=8)
        right.pack(side="right", fill="both", expand=True, padx=(20, 0))

        ctk.CTkLabel(right, text="GENERATED OUTPUT", font=("JetBrains Mono", 12)).pack(anchor="w", padx=20, pady=20)
        
        self.out_subject = ctk.CTkEntry(right, placeholder_text="Subject line will appear here...", height=40, font=("SF Pro Text", 14))
        self.out_subject.pack(fill="x", padx=20, pady=(0, 15))
        
        self.out_body = ctk.CTkTextbox(right, font=("SF Pro Text", 13), fg_color="#060608", border_width=1, border_color="#1A1A28")
        self.out_body.pack(fill="both", expand=True, padx=20, pady=(0, 20))
