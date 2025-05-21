import type { EditableInvoice } from './types';

export interface FakeProcessedItem {
  id: string;
  fields: EditableInvoice;
}

export interface FakeProject {
  id: string;
  name: string;
  processed: FakeProcessedItem[];
}

export const fakeProjects: FakeProject[] = [
  {
    id: '1',
    name: 'Demo Project Alpha',
    processed: [
      {
        id: '1',
        fields: {
          id: '1',
          seller: {
            name: 'Alpha Seller Ltd.',
            address: '123 Alpha St, City',
            tax_id: '11111111-1-11',
            email: 'alpha@seller.com',
            phone: '+36 1 111 1111',
          },
          buyer: {
            name: 'Beta Buyer',
            address: '456 Beta Ave, Town',
            tax_id: '22222222-2-22',
          },
          invoice_number: 'A-1001',
          issue_date: '2024-06-01',
          fulfillment_date: '2024-06-02',
          due_date: '2024-06-15',
          payment_method: 'Bank transfer',
          currency: 'HUF',
          invoice_data: [
            { name: 'Widget', quantity: '10', unit_price: '100', net: '1000', gross: '1270' },
            { name: 'Gadget', quantity: '5', unit_price: '200', net: '1000', gross: '1270' },
          ],
        },
      },
      {
        id: '2',
        fields: {
          id: '2',
          seller: {
            name: 'Alpha Seller Ltd.',
            address: '123 Alpha St, City',
            tax_id: '11111111-1-11',
            email: 'alpha@seller.com',
            phone: '+36 1 111 1111',
          },
          buyer: {
            name: 'Gamma Buyer',
            address: '789 Gamma Rd, Village',
            tax_id: '33333333-3-33',
          },
          invoice_number: 'A-1002',
          issue_date: '2024-06-03',
          fulfillment_date: '2024-06-04',
          due_date: '2024-06-18',
          payment_method: 'Cash',
          currency: 'HUF',
          invoice_data: [
            { name: 'Thingamajig', quantity: '2', unit_price: '500', net: '1000', gross: '1270' },
          ],
        },
      },
      {
        id: '3',
        fields: {
          id: '3',
          seller: {
            name: 'Alpha Seller Ltd.',
            address: '123 Alpha St, City',
            tax_id: '11111111-1-11',
            email: 'alpha@seller.com',
            phone: '+36 1 111 1111',
          },
          buyer: {
            name: 'Delta Buyer',
            address: '101 Delta Blvd, Hamlet',
            tax_id: '44444444-4-44',
          },
          invoice_number: 'A-1003',
          issue_date: '2024-06-05',
          fulfillment_date: '2024-06-06',
          due_date: '2024-06-20',
          payment_method: 'Card',
          currency: 'HUF',
          invoice_data: [
            { name: 'Doohickey', quantity: '1', unit_price: '1500', net: '1500', gross: '1905' },
          ],
        },
      },
    ],
  },
  {
    id: '2',
    name: 'Demo Project Beta',
    processed: [
      {
        id: '1',
        fields: {
          id: '1',
          seller: {
            name: 'Beta Seller Ltd.',
            address: '222 Beta St, City',
            tax_id: '55555555-5-55',
            email: 'beta@seller.com',
            phone: '+36 1 555 5555',
          },
          buyer: {
            name: 'Epsilon Buyer',
            address: '202 Epsilon Ave, Town',
            tax_id: '66666666-6-66',
          },
          invoice_number: 'B-2001',
          issue_date: '2024-06-07',
          fulfillment_date: '2024-06-08',
          due_date: '2024-06-22',
          payment_method: 'Bank transfer',
          currency: 'HUF',
          invoice_data: [
            { name: 'Widget', quantity: '3', unit_price: '100', net: '300', gross: '381' },
          ],
        },
      },
      {
        id: '2',
        fields: {
          id: '2',
          seller: {
            name: 'Beta Seller Ltd.',
            address: '222 Beta St, City',
            tax_id: '55555555-5-55',
            email: 'beta@seller.com',
            phone: '+36 1 555 5555',
          },
          buyer: {
            name: 'Zeta Buyer',
            address: '303 Zeta Rd, Village',
            tax_id: '77777777-7-77',
          },
          invoice_number: 'B-2002',
          issue_date: '2024-06-09',
          fulfillment_date: '2024-06-10',
          due_date: '2024-06-24',
          payment_method: 'Cash',
          currency: 'HUF',
          invoice_data: [
            { name: 'Gadget', quantity: '7', unit_price: '200', net: '1400', gross: '1778' },
          ],
        },
      },
      {
        id: '3',
        fields: {
          id: '3',
          seller: {
            name: 'Beta Seller Ltd.',
            address: '222 Beta St, City',
            tax_id: '55555555-5-55',
            email: 'beta@seller.com',
            phone: '+36 1 555 5555',
          },
          buyer: {
            name: 'Eta Buyer',
            address: '404 Eta Blvd, Hamlet',
            tax_id: '88888888-8-88',
          },
          invoice_number: 'B-2003',
          issue_date: '2024-06-11',
          fulfillment_date: '2024-06-12',
          due_date: '2024-06-26',
          payment_method: 'Card',
          currency: 'EUR',
          invoice_data: [
            { name: 'Doohickey', quantity: '2', unit_price: '1500', net: '3000', gross: '3810' },
          ],
        },
      },
    ],
  },
  {
    id: '3',
    name: 'Demo Project Gamma',
    processed: [
      {
        id: '1',
        fields: {
          id: '1',
          seller: {
            name: 'Gamma Seller Ltd.',
            address: '333 Gamma St, City',
            tax_id: '99999999-9-99',
            email: 'gamma@seller.com',
            phone: '+36 1 999 9999',
          },
          buyer: {
            name: 'Theta Buyer',
            address: '505 Theta Ave, Town',
            tax_id: '10101010-1-10',
          },
          invoice_number: 'C-3001',
          issue_date: '2024-06-13',
          fulfillment_date: '2024-06-14',
          due_date: '2024-06-28',
          payment_method: 'Bank transfer',
          currency: 'HUF',
          invoice_data: [
            { name: 'Widget', quantity: '4', unit_price: '100', net: '400', gross: '508' },
          ],
        },
      },
      {
        id: '2',
        fields: {
          id: '2',
          seller: {
            name: 'Gamma Seller Ltd.',
            address: '333 Gamma St, City',
            tax_id: '99999999-9-99',
            email: 'gamma@seller.com',
            phone: '+36 1 999 9999',
          },
          buyer: {
            name: 'Iota Buyer',
            address: '606 Iota Rd, Village',
            tax_id: '11111112-1-11',
          },
          invoice_number: 'C-3002',
          issue_date: '2024-06-15',
          fulfillment_date: '2024-06-16',
          due_date: '2024-06-30',
          payment_method: 'Cash',
          currency: 'EUR',
          invoice_data: [
            { name: 'Gadget', quantity: '6', unit_price: '200', net: '1200', gross: '1524' },
          ],
        },
      },
      {
        id: '3',
        fields: {
          id: '3',
          seller: {
            name: 'Gamma Seller Ltd.',
            address: '333 Gamma St, City',
            tax_id: '99999999-9-99',
            email: 'gamma@seller.com',
            phone: '+36 1 999 9999',
          },
          buyer: {
            name: 'Kappa Buyer',
            address: '707 Kappa Blvd, Hamlet',
            tax_id: '12121212-1-12',
          },
          invoice_number: 'C-3003',
          issue_date: '2024-06-17',
          fulfillment_date: '2024-06-18',
          due_date: '2024-07-02',
          payment_method: 'Card',
          currency: 'HUF',
          invoice_data: [
            { name: 'Doohickey', quantity: '3', unit_price: '1500', net: '4500', gross: '5715' },
          ],
        },
      },
    ],
  },
]; 