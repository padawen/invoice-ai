export function getGuidelinesImage(): string {
  return `
Please extract all relevant data from the image-based invoice below and return the result in the exact JSON format shown, in English:

1️⃣ First, identify all invoice line items in the document, even if they are split across multiple pages or partially written.
2️⃣ If the same product appears more than once (e.g., multiple lines for the same product), **do NOT combine them**. Each occurrence should remain as a separate entry in the "invoice_data" array.
3️⃣ If product data is **split due to page breaks** or **incomplete formatting**, reconstruct the full item (e.g., name on one page, price on another).
4️⃣ Then, return the items as JSON objects in the invoice_data array. The final number of items should reflect the total number of invoice lines (including duplicates if present).

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

🔁 Repeat the items in the array for every invoice line, even if the same product appears multiple times.
🧾 If any field is missing, leave it empty.
⚠️ There may be more than 20 items. You MUST extract EVERY item, even if the list is very long. Do NOT stop at 20. The output array MUST contain every invoice line from the invoice, even if there are 21, 30, or more. After extracting, double-check that the number of items in your JSON matches the number of invoice lines in the document.
⚠️ Items may be split across page breaks (e.g., the name is on one page, the price is on the next). If you find partial information for an item on one page and the rest on another, combine them into a single entry in the JSON.
⚠️ Ignore repeated headers, footers, and page numbers. Only extract actual invoice data.
✅ Before finishing, check if any items are missing key fields (name, price, etc.) and try to find their missing parts elsewhere in the document. If you find such cases, reconstruct the full item as best as possible.
⚠️ Only return the JSON — no explanation or extra text!

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
Please extract all relevant data from the text-based invoice PDF below and return the result in the exact JSON format shown, in English:

1️⃣ First, identify all invoice line items in the document, even if they are split across multiple pages or partially written.
2️⃣ If the same product appears more than once (e.g., multiple lines for the same product), **do NOT combine them**. Each occurrence should remain as a separate entry in the "invoice_data" array.
3️⃣ If product data is **split due to page breaks** or **incomplete formatting**, reconstruct the full item (e.g., name on one page, price on another).
4️⃣ Then, return the items as JSON objects in the invoice_data array. The final number of items should reflect the total number of invoice lines (including duplicates if present).

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

🔁 Repeat the items in the array for every invoice line, even if the same product appears multiple times.
🧾 If any field is missing, leave it empty.
⚠️ There may be more than 20 items. You MUST extract EVERY item, even if the list is very long. Do NOT stop at 20. The output array MUST contain every invoice line from the invoice, even if there are 21, 30, or more. After extracting, double-check that the number of items in your JSON matches the number of invoice lines in the document.
⚠️ Items may be split across page breaks (e.g., the name is on one page, the price is on the next). If you find partial information for an item on one page and the rest on another, combine them into a single entry in the JSON.
⚠️ Ignore repeated headers, footers, and page numbers. Only extract actual invoice data.
✅ Before finishing, check if any items are missing key fields (name, price, etc.) and try to find their missing parts elsewhere in the document. If you find such cases, reconstruct the full item as best as possible.
❌ Do not return any explanation, only the JSON.
📄 The data may appear in a table or in text form in the invoice.

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
