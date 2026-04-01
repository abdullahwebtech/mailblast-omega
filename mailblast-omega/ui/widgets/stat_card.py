import customtkinter as ctk

class StatCard(ctk.CTkFrame):
    def __init__(self, parent, title: str, value: str, color: str, **kwargs):
        super().__init__(parent, fg_color="#121218", border_color="#1A1A28", border_width=1, corner_radius=8, **kwargs)
        
        self.title_label = ctk.CTkLabel(self, text=title, font=("SF Pro Text", 11), text_color="#707088")
        self.title_label.pack(pady=(15, 0), padx=20, anchor="w")
        
        self.value_label = ctk.CTkLabel(self, text=value, font=("JetBrains Mono", 24, "bold"), text_color=color)
        self.value_label.pack(pady=(5, 15), padx=20, anchor="w")

    def update_value(self, new_value):
        self.value_label.configure(text=str(new_value))
