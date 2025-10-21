export function getGuidelines(): string {
  return `
Extract all relevant data from the invoice and return only the JSON result in the exact format shown below, in English.

CRITICAL INSTRUCTIONS:
1. You MUST return a valid JSON object in the exact format specified below, even if some fields are empty
2. If any field cannot be found, use an empty string "" for that field - NEVER omit the field entirely
3. The response must be ONLY the JSON object - no explanations, notes, or additional text

Data Extraction Instructions:
1. Identify all invoice line items from the document. Do not skip any, even if they are spread across multiple pages or if product data is split across lines or pages. Each appearance of a product must be a separate entry; do not merge duplicates.
2. If a product's data is split (for example, the name is on one page, the price is on another), combine the information as needed to reconstruct the full item.
3. For each line item, extract:
   - "name": product or service name (reconstruct multi-line or split names)
   - "quantity": quantity (numeric, formatted as described below)
   - "unit_price": unit price (numeric, formatted as described below)
   - "net": net value (numeric, formatted as described below)
   - "gross": gross value (numeric, formatted as described below)
   - "currency": as stated in the document (use "HUF" if you see "Ft" or "ft")
4. For the document itself, also extract:
   - "seller": name, address, tax_id, email, phone (if available, else leave as empty string)
   - "buyer": name, address, tax_id (if available, else leave as empty string)
   - "invoice_number", "issue_date", "fulfillment_date", "due_date", "payment_method", "currency" (if available, else leave as empty string)
5. For all numeric values ("quantity", "unit_price", "net", "gross"):
   - Remove all spaces and currency symbols (e.g., "Ft", "HUF", "EUR")
   - If a comma is used as a decimal separator, replace it with a period (e.g., "4 565,12" becomes "4565.12")
   - For example: "5 991 Ft" becomes "5991", "1,200 EUR" becomes "1200", "4 565,12" becomes "4565.12"
   - Negative values are allowed for discounts, refunds, or credits (e.g., "-500" for a discount)
   - Return as string
6. Currency normalization:
   - If you see "Ft", "ft", or "FT", convert to "HUF"
   - If you see "€" or "eur", convert to "EUR"
   - If you see "$" or "usd", convert to "USD"
7. If any field is missing or cannot be found, leave it as an empty string. Always include the key.
8. Ignore all non-product text, such as headers, footers, page numbers, or disclaimers.
9. Return every invoice line item present in the document, even if there are many.
10. At the end, check if any product line is missing information, and search through the document to fill in missing fields if possible.
11. If no invoice items are found, still return the structure with an empty invoice_data array.

MANDATORY JSON format (you MUST use this exact structure):
{
  "seller": {
    "name": "",
    "address": "",
    "tax_id": "",
    "email": "",
    "phone": ""
  },
  "buyer": {
    "name": "",
    "address": "",
    "tax_id": ""
  },
  "invoice_number": "",
  "issue_date": "",
  "fulfillment_date": "",
  "due_date": "",
  "payment_method": "",
  "currency": "",
  "invoice_data": [
    {
      "name": "",
      "quantity": "",
      "unit_price": "",
      "net": "",
      "gross": "",
      "currency": ""
    }
  ]
}

Example:
{
  "seller": {
    "name": "Dell Hungary Ltd.",
    "address": "Budapest, Infopark Promenade 1.",
    "tax_id": "11223344-2-13",
    "email": "info@dell.hu",
    "phone": "+36 1 555 1234"
  },
  "buyer": {
    "name": "Peter Nagy",
    "address": "Szeged, József Attila Street 3.",
    "tax_id": "22334455-1-22"
  },
  "invoice_number": "INV-2024-104",
  "issue_date": "2024-06-01",
  "fulfillment_date": "2024-06-02",
  "due_date": "2024-06-15",
  "payment_method": "Cash",
  "currency": "HUF",
  "invoice_data": [
    {
      "name": "Dell laptop",
      "quantity": "1",
      "unit_price": "220000",
      "net": "220000",
      "gross": "279400",
      "currency": "HUF"
    }
  ]
}

REMEMBER: Return ONLY the JSON object, nothing else. The response must be valid JSON that can be parsed directly.
`.trim();
}
