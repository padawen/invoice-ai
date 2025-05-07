import { Download } from 'lucide-react';

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

interface InvoiceData {
  name: string;
  quantity: string;
  unit_price: string;
  net: string;
  gross: string;
}

interface ExportCSVButtonProps {
  data: ProcessedData[];
  fileName?: string;
}

function flattenProcessedData(data: ProcessedData[]): Record<string, string>[] {
  // For each processed item, output one row per invoice item
  const rows: Record<string, string>[] = [];
  let netSum = 0;
  let grossSum = 0;
  data.forEach((item) => {
    // Support both real and fake data structures
    const invoiceData = item.raw_data || item.invoice_data || [];
    const seller = item.seller || {};
    const buyer = item.buyer || {};
    // For real data, seller/buyer fields are flat
    const seller_name = item.seller_name || seller.name || '';
    const seller_address = item.seller_address || seller.address || '';
    const seller_tax_id = item.seller_tax_id || seller.tax_id || '';
    const seller_email = item.seller_email || seller.email || '';
    const seller_phone = item.seller_phone || seller.phone || '';
    const buyer_name = item.buyer_name || buyer.name || '';
    const buyer_address = item.buyer_address || buyer.address || '';
    const buyer_tax_id = item.buyer_tax_id || buyer.tax_id || '';
    const invoice_number = item.invoice_number || '';
    const issue_date = item.issue_date || '';
    (invoiceData.length ? invoiceData : [{} as InvoiceData]).forEach((inv: InvoiceData) => {
      const net = parseFloat(inv.net) || 0;
      const gross = parseFloat(inv.gross) || 0;
      netSum += net;
      grossSum += gross;
      rows.push({
        szamlaszam: invoice_number,
        kiallitasi_datum: issue_date,
        elado_neve: seller_name,
        elado_cime: seller_address,
        elado_adoszam: seller_tax_id,
        elado_email: seller_email,
        elado_telefon: seller_phone,
        vevo_neve: buyer_name,
        vevo_cime: buyer_address,
        vevo_adoszam: buyer_tax_id,
        tetel_neve: inv.name || '',
        tetel_mennyiseg: inv.quantity || '',
        tetel_egyseg_ar: inv.unit_price || '',
        tetel_netto: inv.net || '',
        tetel_brutto: inv.gross || '',
      });
    });
  });
  // Add summary row
  if (rows.length) {
    rows.push({
      szamlaszam: 'Összesen',
      kiallitasi_datum: '',
      elado_neve: '',
      elado_cime: '',
      elado_adoszam: '',
      elado_email: '',
      elado_telefon: '',
      vevo_neve: '',
      vevo_cime: '',
      vevo_adoszam: '',
      tetel_neve: '',
      tetel_mennyiseg: '',
      tetel_egyseg_ar: '',
      tetel_netto: netSum.toFixed(2),
      tetel_brutto: grossSum.toFixed(2),
    });
  }
  return rows;
}

function toCSV(data: Record<string, string>[]): string {
  if (!data.length) return '';
  const keys = Object.keys(data[0]);
  const csvRows = [keys.join(';')];
  for (const row of data) {
    csvRows.push(
      keys.map(k => {
        const val = row[k] ?? '';
        // Force Excel to treat as text if not empty
        if (val === '') return '';
        // Escape quotes
        const safe = String(val).replace(/"/g, '""');
        return `="${safe}"`;
      }).join(';')
    );
  }
  // Add UTF-8 BOM for Excel compatibility
  return '\uFEFF' + csvRows.join('\n');
}

const ExportCSVButton = ({ data, fileName = 'export.csv' }: ExportCSVButtonProps) => {
  const handleExport = () => {
    const flat = flattenProcessedData(data);
    const csv = toCSV(flat);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-lg font-semibold shadow transition border border-green-800"
    >
      <Download size={18} />
      <span>Export CSV</span>
    </button>
  );
};

export default ExportCSVButton; 