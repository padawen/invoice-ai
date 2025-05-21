export function getGuidelinesImage(): string {
  return `
Extract all relevant data from the image-based invoice and return only the JSON result in the exact format shown below, in English.

Instructions:
1. Identify all invoice line items from the document. Do not skip any, even if they are spread across multiple pages or if product data is split across lines or pages. Each appearance of a product must be a separate entry; do not merge duplicates.
2. If a product's data is split (for example, the name is on one page, the price is on another), combine the information as needed to reconstruct the full item.
3. For each line item, extract:
   - "name": product or service name (reconstruct multi-line or split names)
   - "quantity": quantity (numeric, formatted as described below)
   - "unit_price": unit price (numeric, formatted as described below)
   - "net": net value (numeric, formatted as described below)
   - "gross": gross value (numeric, formatted as described below)
   - "currency": as stated in the document
4. For the document itself, also extract:
   - "seller": name, address, tax_id, email, phone (if available, else leave as empty string)
   - "buyer": name, address, tax_id (if available, else leave as empty string)
   - "invoice_number", "issue_date", "fulfillment_date", "due_date", "payment_method", "currency" (if available, else leave as empty string)
5. For all numeric values ("quantity", "unit_price", "net", "gross"):
   - Remove all spaces and currency symbols (e.g., "Ft", "HUF", "EUR")
   - If a comma is used as a decimal separator, replace it with a period (e.g., "4 565,12" becomes "4565.12")
   - For example: "5 991 Ft" becomes "5991", "1,200 EUR" becomes "1200", "4 565,12" becomes "4565.12"
   - Return as string
6. If any field is missing or cannot be found, leave it as an empty string. Always include the key.
7. Ignore all non-product text, such as headers, footers, page numbers, or disclaimers.
8. Return every invoice line item present in the document, even if there are many.
9. At the end, check if any product line is missing information, and search through the document to fill in missing fields if possible.
10. Return only valid JSON as shown below, and do not include any explanations, notes, or extra text.

JSON format:
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
    "name": "Apple Ltd.",
    "address": "Budapest, Apple Street 1.",
    "tax_id": "12345678-1-12",
    "email": "apple@company.com",
    "phone": "+36 1 234 5678"
  },
  "buyer": {
    "name": "John Kiss",
    "address": "Debrecen, Kossuth Street 10.",
    "tax_id": "87654321-1-42"
  },
  "invoice_number": "A-2024/001",
  "issue_date": "2024-06-01",
  "fulfillment_date": "2024-06-02",
  "due_date": "2024-06-15",
  "payment_method": "Bank transfer",
  "currency": "HUF",
  "invoice_data": [
    {
      "name": "iPhone 13",
      "quantity": "2",
      "unit_price": "350000",
      "net": "700000",
      "gross": "889000",
      "currency": "HUF"
    },
    {
      "name": "Lightning cable",
      "quantity": "1",
      "unit_price": "3990",
      "net": "3990",
      "gross": "5067",
      "currency": "HUF"
    }
  ]
}
`.trim();
}

export function getGuidelinesText(): string {
  return `
Extract all relevant data from the text-based invoice PDF and return only the JSON result in the exact format shown below, in English.

Instructions:
1. Identify all invoice line items from the document. Do not skip any, even if they are spread across multiple pages or if product data is split across lines or pages. Each appearance of a product must be a separate entry; do not merge duplicates.
2. If a product's data is split (for example, the name is on one page, the price is on another), combine the information as needed to reconstruct the full item.
3. For each line item, extract:
   - "name": product or service name (reconstruct multi-line or split names)
   - "quantity": quantity (numeric, formatted as described below)
   - "unit_price": unit price (numeric, formatted as described below)
   - "net": net value (numeric, formatted as described below)
   - "gross": gross value (numeric, formatted as described below)
   - "currency": as stated in the document
4. For the document itself, also extract:
   - "seller": name, address, tax_id, email, phone (if available, else leave as empty string)
   - "buyer": name, address, tax_id (if available, else leave as empty string)
   - "invoice_number", "issue_date", "fulfillment_date", "due_date", "payment_method", "currency" (if available, else leave as empty string)
5. For all numeric values ("quantity", "unit_price", "net", "gross"):
   - Remove all spaces and currency symbols (e.g., "Ft", "HUF", "EUR")
   - If a comma is used as a decimal separator, replace it with a period (e.g., "4 565,12" becomes "4565.12")
   - For example: "5 991 Ft" becomes "5991", "1,200 EUR" becomes "1200", "4 565,12" becomes "4565.12"
   - Return as string
6. If any field is missing or cannot be found, leave it as an empty string. Always include the key.
7. Ignore all non-product text, such as headers, footers, page numbers, or disclaimers.
8. Return every invoice line item present in the document, even if there are many.
9. At the end, check if any product line is missing information, and search through the document to fill in missing fields if possible.
10. Return only valid JSON as shown below, and do not include any explanations, notes, or extra text.

JSON format:
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
  "currency": "EUR",
  "invoice_data": [
    {
      "name": "Dell laptop",
      "quantity": "1",
      "unit_price": "220000",
      "net": "220000",
      "gross": "279400",
      "currency": "EUR"
    }
  ]
}
`.trim();
}
