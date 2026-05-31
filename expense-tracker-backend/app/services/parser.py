import re
from typing import Dict, Any

def parse_receipt_text(text: str) -> Dict[str, Any]:
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    merchant = "Unknown Merchant"
    if lines:
        merchant = lines[0] # Often the first line is the merchant name
    
    date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
    date_match = re.search(date_pattern, text)
    date_str = date_match.group(0) if date_match else None
    
    amount_pattern = r'[$£€]?\s*(\d+\.\d{2})\b'
    amount_matches = re.findall(amount_pattern, text)
    
    amount = 0.0
    if amount_matches:
        amounts = [float(a) for a in amount_matches]
        amount = max(amounts) # Usually the largest number is the total
        
    return {
        "merchant": merchant,
        "date": date_str,
        "amount": amount
    }
