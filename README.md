# 🤖 Invoice AI - Intelligent Invoice Processing System

> *"Built with 🥂, 💧, 🌿 & Next.js"*

**Invoice AI** is an AI-powered invoice processing application that automates data extraction from PDF invoices using both cloud-based (OpenAI) and on-premise (privacy mode) processing options.

## 📖 Overview

Transform PDF invoices into structured, searchable data in seconds. Built as a full-stack TypeScript application with Next.js 15, featuring real-time processing, project management, and comprehensive analytics.

## ✨ Key Features

### 📄 Dual Processing Modes

**OpenAI Cloud Processing**
- Fast, high-accuracy extraction using GPT-4
- Ideal for quick processing and best results
- Requires OpenAI API key and credits

**Privacy Mode (On-Premise)**
- Local LLM processing (model selection in progress)
- Pytesseract OCR for scanned documents
- Real-time progress tracking with Server-Sent Events
- Cancellable processing
- Data stays on your infrastructure
- Slower than OpenAI but fully private

### 🧠 Data Extraction

Automatically extracts:
- **Seller Information**: Name, address, tax ID, email, phone
- **Buyer Information**: Name, address, tax ID
- **Invoice Details**: Number, issue date, fulfillment date, due date, payment method
- **Line Items**: Description, quantity, unit price, total, VAT rate
- **Totals**: Net amount, VAT amount, gross amount (by currency)

### 📊 Project Management

- Organize invoices into projects
- Filter and search across all data
- Track extraction methods and processing times
- Monitor user edits and changes
- Multi-currency support (HUF, EUR, USD, GBP)
- Export to CSV/JSON

### 🎨 User Interface

- Real-time PDF preview alongside editing
- Collapsible sections for better organization
- Dirty field tracking for change monitoring
- Add/remove invoice line items
- Live financial calculations
- Responsive design for mobile and desktop
- Dark theme optimized UI

## 🛠 Technology Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19** with Server Components
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend & Infrastructure
- **Supabase** (PostgreSQL, Authentication, Row Level Security)
- **OpenAI API** (GPT-4 for cloud processing)
- **Custom Privacy API** (Local LLM + Pytesseract OCR)
- **Server-Sent Events** for real-time progress streaming

### Processing Pipeline
- **PDF.js** for PDF rendering
- **OpenAI GPT-4** for intelligent extraction
- **Pytesseract** for OCR on scanned documents
- **Local LLM** (in evaluation - privacy mode backend)

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **pnpm** (recommended) or npm/yarn
- **Git**
- **Supabase account** (free tier available)
- **OpenAI API key** (for cloud processing)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/your-username/invoice-ai.git
cd invoice-ai
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
- **Supabase account** (free tier available)
- **OpenAI API key** (for cloud processing)

### Installation

#### 1. Clone the Repository
```bash

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
- **Supabase account** (free tier available)
- **OpenAI API key** (for cloud processing)

### Installation

#### 1. Clone the Repository
```bash

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Privacy Processing API (local LLM with Pytesseract OCR)
PRIVACY_API_URL=http://localhost:5000
PRIVACY_API_KEY=your_privacy_api_key

# Optional: Custom API endpoints
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**Configuration Guide:**

**Supabase**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Navigate to Project Settings → API
4. Copy Project URL and anon key
5. Copy service role key from Service Role Keys section

**OpenAI**
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys section
3. Create new secret key
4. Add credits to your account

#### 4. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed invoices table
CREATE TABLE processed_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  seller_address TEXT,
  seller_tax_id TEXT,
  seller_email TEXT,
  seller_phone TEXT,
  buyer_name TEXT,
  buyer_address TEXT,
  buyer_tax_id TEXT,
  invoice_number TEXT,
  issue_date DATE,
  fulfillment_date DATE,
  due_date DATE,
  payment_method TEXT,
  currency TEXT,
  raw_data JSONB,
  extraction_method TEXT CHECK (extraction_method IN ('openai', 'privacy')),
  extraction_time REAL,
  user_changes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processed_data_extraction_method ON processed_data(extraction_method);
CREATE INDEX IF NOT EXISTS idx_processed_data_project_id ON processed_data(project_id);
CREATE INDEX IF NOT EXISTS idx_processed_data_user_id ON processed_data(user_id);

-- Create trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_processed_data_updated_at
    BEFORE UPDATE ON processed_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_data ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for processed_data
CREATE POLICY "Users can view their own processed data" ON processed_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own processed data" ON processed_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processed data" ON processed_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processed data" ON processed_data
  FOR DELETE USING (auth.uid() = user_id);
```

#### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🚀 Production Deployment

#### Render Environment Configuration

**Build-time Environment Variables** (required during build):
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (client-side)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key (client-side)
- `NEXT_PUBLIC_SITE_URL` - Your production site URL (client-side)

**Runtime Environment Variables** (injected at runtime by Render):
- `SUPABASE_URL` - Supabase URL for server-side operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only, sensitive)
- `SUPABASE_JWT_SECRET` - JWT secret for auth (server-only, sensitive)
- `OPENAI_API_KEY` - OpenAI API key (server-only, sensitive)
- `POSTGRES_URL` - Database connection string (server-only, sensitive)
- `POSTGRES_PRISMA_URL` - Prisma database URL (server-only, sensitive)
- `POSTGRES_URL_NON_POOLING` - Non-pooling database URL (server-only, sensitive)
- `POSTGRES_USER` - Database user (server-only, sensitive)
- `POSTGRES_PASSWORD` - Database password (server-only, sensitive)
- `POSTGRES_DATABASE` - Database name (server-only, sensitive)
- `POSTGRES_HOST` - Database host (server-only, sensitive)
- `PRIVACY_API_URL` - Privacy API endpoint for local processing (server-only)
- `PRIVACY_API_KEY` - Privacy API authentication key (server-only, sensitive)

#### Docker Deployment

Build locally and test:
```bash
docker build -t invoice-ai:standalone .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_SITE_URL=RENDER_ENV_AT_RUNTIME \
  -e NEXT_PUBLIC_SUPABASE_URL=RENDER_ENV_AT_RUNTIME \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=RENDER_ENV_AT_RUNTIME \
  -e SUPABASE_URL=RENDER_ENV_AT_RUNTIME \
  -e SUPABASE_SERVICE_ROLE_KEY=RENDER_ENV_AT_RUNTIME \
  -e SUPABASE_JWT_SECRET=RENDER_ENV_AT_RUNTIME \
  -e OPENAI_API_KEY=RENDER_ENV_AT_RUNTIME \
  -e POSTGRES_URL=RENDER_ENV_AT_RUNTIME \
  invoice-ai:standalone
```

**Security Notes:**
- Server secrets are NOT baked into the Docker image
- All sensitive env vars are injected at runtime by Render
- Client-side env vars (`NEXT_PUBLIC_*`) are compiled into the build

## 📝 Usage

### Processing an Invoice

1. **Upload**: Navigate to Upload page and drag-drop a PDF invoice
2. **Choose Method**: Select OpenAI (fast) or Privacy Mode (secure)
3. **Review**: Check extracted data in the edit interface
4. **Edit**: Modify any incorrect fields or line items
5. **Save**: Assign to a project and save

### Managing Projects

- Create projects to organize invoices by client, period, or category
- View financial summaries and analytics per project
- Search and filter invoices across all fields
- Export data to CSV for external analysis

## 🏗️ Project Structure

```
invoice-ai/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── components/           # React components
│   ├── dashboard/            # Dashboard page
│   ├── edit/                 # Invoice editing page
│   ├── projects/             # Project management
│   └── upload/               # Upload interface
├── lib/                      # Utility functions
└── public/                   # Static assets
```

## 🔒 Privacy & Security

- **Row Level Security (RLS)**: All database queries are user-scoped
- **Authentication**: Supabase Auth with Google OAuth
- **Privacy Mode**: Optional on-premise processing without external API calls
- **Data Isolation**: Each user can only access their own data

## 📊 Analytics & Tracking

The system tracks:
- **Extraction Method**: Which AI model processed each invoice (OpenAI/Privacy)
- **Processing Time**: How long extraction took
- **User Changes**: Number of manual edits made to extracted data
- **Extraction Accuracy**: Metrics for improvement analysis

## 🐛 Known Limitations

- PDF size limit: 10MB per file
- Supported currencies: HUF, EUR, USD, GBP
- Privacy mode requires separate backend service
- OCR quality depends on scan resolution
- Does not process invoices written in Comic Sans (this is a feature, not a bug)

## 📄 License

This project is open source under the MIT License.

---

**Built with 🥂, 💧, 🌿 & Next.js**