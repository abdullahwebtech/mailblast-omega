from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
import openpyxl

class ExportEngine:
    def __init__(self, db):
        self.db = db

    def export_campaign_pdf(self, campaign_id: int, output_path: str):
        """Generates a detailed campaign report PDF."""
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        campaign = self.db.get_campaign(campaign_id)
        if not campaign:
            return False
            
        elements.append(Paragraph(f"Campaign Report: {campaign['name']}", styles['Title']))
        elements.append(Paragraph(f"Status: {campaign['status']}", styles['Normal']))
        elements.append(Paragraph(f"Total Sent: {campaign['sent']}", styles['Normal']))
        elements.append(Paragraph(f"Total Opened: {campaign['opened']}", styles['Normal']))
        
        doc.build(elements)
        return True

    def export_campaign_excel(self, campaign_id: int, output_path: str):
        """Exports full send log to Excel with formatting."""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Campaign Log"
        headers = ["Recipient", "Website", "Status", "Opened", "Open Count",
                   "First Opened", "Sent At", "Error"]
        ws.append(headers)
        
        logs = self.db.get_send_log(campaign_id, limit=100000)
        for log in logs:
            ws.append([
                log.get("recipient"),
                log.get("website"),
                log.get("status"),
                "Yes" if log.get("opened") else "No",
                log.get("open_count"),
                log.get("first_opened_at"),
                log.get("sent_at"),
                log.get("error_msg")
            ])
            
        wb.save(output_path)
        return True
