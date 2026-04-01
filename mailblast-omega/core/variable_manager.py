class VariableManager:
    def __init__(self, db):
        self.db = db

    def get_system_variables(self, account, campaign, row_index: int) -> dict:
        from datetime import datetime
        now = datetime.now()
        return {
            "SenderName": account.get("display_name", account.get("email")),
            "SenderEmail": account.get("email", ""),
            "Date": now.strftime("%B %d, %Y"),
            "Day": now.strftime("%A"),
            "Time": now.strftime("%I:%M %p"),
            "Month": now.strftime("%B"),
            "Year": now.strftime("%Y"),
            "CampaignName": campaign.get("name", "Campaign"),
            "RowNumber": str(row_index + 1)
        }

    def get_custom_variables(self) -> dict:
        rows = self.db._get_conn().execute("SELECT name, default_val FROM variable_definitions").fetchall()
        return {r["name"]: r["default_val"] for r in rows}

    def add_custom_variable(self, name: str, default_val: str, description: str = ""):
        with self.db._get_conn() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO variable_definitions (name, default_val, description)
                VALUES (?, ?, ?)
            """, (name, default_val, description))
