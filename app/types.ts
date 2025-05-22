export interface InvoiceData {
  name: string;
  quantity: string;
  unit_price: string;
  net: string;
  gross: string;
  currency?: string;
}

export interface EditableInvoice {
  id: string;
  seller: {
    name: string;
    address?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
  };
  buyer: {
    name: string;
    address?: string;
    tax_id?: string;
  };
  invoice_number?: string;
  issue_date?: string;
  fulfillment_date?: string;
  due_date?: string;
  payment_method?: string;
  currency?: string;
  invoice_data: InvoiceData[];
}