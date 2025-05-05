export function getGuidelinesImage(): string {
  return `
Please extract all relevant data from the image-based invoice below and return the result in the exact JSON format shown, in English:

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

🔁 Repeat the items in the array if there are multiple products.
🧾 If any field is missing, leave it empty.
⚠️ There may be 20 or more items. You must extract EVERY item, even if the list is long. Do NOT stop early or summarize. The output array must contain every row from the invoice.
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

✅ Work in English.
🧾 If there are multiple products, expand the JSON array.
⚠️ There may be 20 or more items. You must extract EVERY item, even if the list is long. Do NOT stop early or summarize. The output array must contain every row from the invoice.
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
