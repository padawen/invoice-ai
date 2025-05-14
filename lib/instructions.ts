export function getGuidelinesImage(): string {
  return `
Please extract all relevant data from the image-based invoice and return the result in the exact JSON format shown, in English.

Follow these STEPS to extract data accurately:

STEP 1: Extract header information
- Identify the seller details (name, address, tax ID, contact information)
- Identify the buyer details (name, address, tax ID)
- Extract invoice metadata (number, dates, payment method)

STEP 2: Extract all line items 
- Identify all invoice line items in the document, even if split across multiple pages
- If the same product appears more than once, do NOT combine them
- If product data is split due to page breaks or incomplete formatting, reconstruct the complete item
- The final number of items should reflect the total number of invoice lines (including duplicates)

STEP 3: Format the data according to the JSON structure below
- Ensure all extracted information is properly organized
- Double-check that no items are missing

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
  "invoice_data": [
    {
      "name": "",
      "quantity": "",
      "unit_price": "",
      "net": "",
      "gross": ""
    }
  ]
}

Important guidelines:
- Repeat items in the array for every invoice line, even if the same product appears multiple times.
- If any field is missing, leave it empty.
- There may be more than 20 items. You MUST extract EVERY item, even if the list is very long.
- Items may be split across page breaks. If you find partial information for an item on one page and the rest on another, combine them into a single entry.
- Ignore repeated headers, footers, and page numbers. Only extract actual invoice data.
- Before finishing, check if any items are missing key fields and try to find their missing parts elsewhere in the document.
- Only return the JSON — no explanation or extra text!

Example of valid output:
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
  "invoice_data": [
    {
      "name": "iPhone 13",
      "quantity": "2",
      "unit_price": "350000",
      "net": "700000",
      "gross": "889000"
    },
    {
      "name": "Lightning cable",
      "quantity": "1",
      "unit_price": "3990",
      "net": "3990",
      "gross": "5067"
    }
  ]
}
  `.trim();
}

export function getGuidelinesText(): string {
  return `
Please extract all relevant data from the text-based invoice and return the result in the exact JSON format shown, in English.

Follow these STEPS to extract data accurately:

STEP 1: Extract header information
- Identify the seller details (name, address, tax ID, contact information)
- Identify the buyer details (name, address, tax ID)
- Extract invoice metadata (number, dates, payment method)

STEP 2: Extract all line items 
- Identify all invoice line items in the document, even if split across multiple pages
- If the same product appears more than once, do NOT combine them
- If product data is split due to page breaks or incomplete formatting, reconstruct the complete item
- The final number of items should reflect the total number of invoice lines (including duplicates)

STEP 3: Format the data according to the JSON structure below
- Ensure all extracted information is properly organized
- Double-check that no items are missing

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
  "invoice_data": [
    {
      "name": "",
      "quantity": "",
      "unit_price": "",
      "net": "",
      "gross": ""
    }
  ]
}

Important guidelines:
- Repeat items in the array for every invoice line, even if the same product appears multiple times.
- If any field is missing, leave it empty.
- There may be more than 20 items. You MUST extract EVERY item, even if the list is very long.
- Items may be split across page breaks. If you find partial information for an item on one page and the rest on another, combine them into a single entry.
- Ignore repeated headers, footers, and page numbers. Only extract actual invoice data.
- Before finishing, check if any items are missing key fields and try to find their missing parts elsewhere in the document.
- Do not return any explanation, only the JSON.
- The data may appear in a table or in text form in the invoice.

Example of valid output:
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
  "invoice_data": [
    {
      "name": "Dell laptop",
      "quantity": "1",
      "unit_price": "220000",
      "net": "220000",
      "gross": "279400"
    }
  ]
}
  `.trim();
}
