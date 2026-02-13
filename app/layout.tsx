import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import ClientProvider from './client-provider';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Invoice AI - Automate Your Invoicing',
    template: '%s | Invoice AI',
  },
  description: 'AI-driven invoice processing that feels like magic - from PDF to structured data in seconds. Extract data from invoices with zero manual entry.',
  keywords: [
    'invoice processing',
    'AI invoice',
    'OCR invoice',
    'invoice automation',
    'PDF to data',
    'invoice extraction',
    'automated invoicing',
    'invoice AI',
    'document processing',
  ],
  authors: [{ name: 'Invoice AI Team' }],
  creator: 'Invoice AI',
  publisher: 'Invoice AI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Invoice AI - Automate Your Invoicing',
    description: 'AI-driven invoice processing that feels like magic - from PDF to structured data in seconds.',
    url: '/',
    siteName: 'Invoice AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Invoice AI - Automate Your Invoicing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invoice AI - Automate Your Invoicing',
    description: 'AI-driven invoice processing that feels like magic - from PDF to structured data in seconds.',
    images: ['/og-image.png'],
    creator: '@invoiceai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification tokens here when ready
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white min-h-screen flex flex-col`}
      >
        <Providers>
          <ClientProvider>
            <div className="flex-grow flex flex-col">{children}</div>
          </ClientProvider>
        </Providers>
      </body>
    </html>
  );
}
