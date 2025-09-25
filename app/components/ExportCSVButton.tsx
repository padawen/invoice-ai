'use client';

import { Download } from 'lucide-react';

interface InvoiceData {
  name: string;
  quantity: string;
  unit_price: string;
  net: string;
  gross: string;
}

interface ProcessedData {
  raw_data?: InvoiceData[];
  invoice_data?: InvoiceData[];
  seller?: {
    name?: string;
    address?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
  };
  buyer?: {
    name?: string;
    address?: string;
    tax_id?: string;
  };
  seller_name?: string;
  seller_address?: string;
  seller_tax_id?: string;
  seller_email?: string;
  seller_phone?: string;
  buyer_name?: string;
  buyer_address?: string;
  buyer_tax_id?: string;
  invoice_number?: string;
  issue_date?: string;
}

interface ExportCSVButtonProps {
  data: ProcessedData[];
  fileName?: string;
}

function flattenProcessedData(data: ProcessedData[]): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  let netSum = 0;
  let grossSum = 0;

  data.forEach((item) => {
    const invoiceData = item.raw_data || item.invoice_data || [];
    const seller = item.seller || {};
    const buyer = item.buyer || {};

    const sellerName = item.seller_name || seller.name || '';
    const sellerAddress = item.seller_address || seller.address || '';
    const sellerTaxId = item.seller_tax_id || seller.tax_id || '';
    const sellerEmail = item.seller_email || seller.email || '';
    const sellerPhone = item.seller_phone || seller.phone || '';

    const buyerName = item.buyer_name || buyer.name || '';
    const buyerAddress = item.buyer_address || buyer.address || '';
    const buyerTaxId = item.buyer_tax_id || buyer.tax_id || '';

    const invoiceNumber = item.invoice_number || '';
    const issueDate = item.issue_date || '';

    const safeItems = invoiceData.length > 0 ? invoiceData : [{} as InvoiceData];

    safeItems.forEach((inv) => {
      const net = parseFloat(inv.net) || 0;
      const gross = parseFloat(inv.gross) || 0;
      netSum += net;
      grossSum += gross;

      rows.push({
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        seller_name: sellerName,
        seller_address: sellerAddress,
        seller_tax_id: sellerTaxId,
        seller_email: sellerEmail,
        seller_phone: sellerPhone,
        buyer_name: buyerName,
        buyer_address: buyerAddress,
        buyer_tax_id: buyerTaxId,
        item_name: inv.name || '',
        item_quantity: inv.quantity || '',
        item_unit_price: inv.unit_price || '',
        item_net: inv.net || '',
        item_gross: inv.gross || '',
      });
    });
  });

  if (rows.length > 0) {
    rows.push({
      invoice_number: 'Total',
      issue_date: '',
      seller_name: '',
      seller_address: '',
      seller_tax_id: '',
      seller_email: '',
      seller_phone: '',
      buyer_name: '',
      buyer_address: '',
      buyer_tax_id: '',
      item_name: '',
      item_quantity: '',
      item_unit_price: '',
      item_net: netSum.toFixed(2),
      item_gross: grossSum.toFixed(2),
    });
  }

  return rows;
}

function toCSV(data: Record<string, string>[]): string {
  if (!data.length) return '';

  const headers = Object.keys(data[0]);
  const csvLines = [headers.join(';')];

  for (const row of data) {
    const line = headers
      .map((key) => {
        const val = row[key] ?? '';
        const safe = String(val).replace(/"/g, '""');
        return `="${safe}"`;
      })
      .join(';');

    csvLines.push(line);
  }

  return '\uFEFF' + csvLines.join('\n');
}

const ExportCSVButton = ({
  data,
  fileName = 'invoices-export.csv',
}: ExportCSVButtonProps) => {
  const handleExport = () => {
    const flat = flattenProcessedData(data);
    const csv = toCSV(flat);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-lg hover:shadow-green-900/20 transition-all duration-300 border border-green-700/50 relative overflow-hidden group cursor-pointer"
    >
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-green-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
      <Download size={18} className="relative z-10" />
      <span className="relative z-10">Export CSV</span>
    </button>
  );
};

export default ExportCSVButton;
