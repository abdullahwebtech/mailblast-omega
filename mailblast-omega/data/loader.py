import pandas as pd
import os

def load_contacts(file_path: str):
    """
    Loads contacts from an Excel or CSV file.
    Implements Bug #8 fix to remove BOM.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Contacts file not found: {file_path}")
        
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.csv':
        df = pd.read_csv(file_path)
    elif ext in ['.xlsx', '.xls']:
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format. Use .csv, .xlsx, or .xls")
        
    # BUG #8 FIX: Silent failure when Excel has BOM encoding
    df.columns = [str(c).strip().lstrip('\ufeff').strip() for c in df.columns]
    
    return df
