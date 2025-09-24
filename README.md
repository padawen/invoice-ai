# 🤖 Invoice AI: Because Reading PDFs is for Peasants

> *"Built with 🥂, 💧, 🌿 & Next.js"* - Ancient Hungarian Proverb

**Welcome to Invoice AI**, the most sophisticated invoice processing system known to mankind! We've taught artificial intelligence to read invoices faster than your accountant can say "receipt"! 🧾✨

## 🎭 What This Magnificent Beast Does

This isn't just another boring invoice processor. Oh no, no, no. This is a **FULL-STACK ENGINEERING MASTERPIECE** that turns your crappy PDF invoices into beautiful, structured data faster than you can pour a proper fröccs!

### 🚀 Core Features (AKA "The Good Stuff")

**📄 PDF Upload & Processing**
- Drag & drop PDFs like you're DJ-ing at a Gödöllő club
- Automatic PDF type detection (text vs image) because we're fancy like that
- Support for multiple processing engines:
  - **OpenAI GPT-4** (when you want the good stuff)
  - **Local LLM** (when you're feeling rebellious)
  - **DocTR OCR** (for those sketchy scanned invoices)

**🧠 AI-Powered Data Extraction**
- Extracts seller info (name, address, tax ID, email, phone)
- Grabs buyer details (because we need to know who owes what)
- Invoice metadata (numbers, dates, payment methods)
- Line items with quantities, prices, and currencies
- Automatically calculates net/gross amounts

**🎨 Beautiful Editing Interface**
- Collapsible sections for seller, buyer, and invoice details
- Real-time dirty field tracking (we see your edits 👀)
- Add/remove invoice items with ease
- Live financial summaries
- Export to CSV because Excel is still king

**📊 Project Management & Analytics**
- Dashboard with all your projects
- Financial summaries by currency (supports HUF, EUR, USD, GBP)
- Monthly and quarterly breakdowns
- Top buyers/sellers analysis
- Beautiful charts that would make your CFO weep with joy

**🔐 Authentication & Data Storage**
- Supabase integration for user management
- Secure project storage
- Demo mode for commitment-phobic users

## 🛠 Tech Stack (The Magnificent Seven... Plus Some)

- **Next.js 15** - Because we live in the future
- **React 19** - Hooks everywhere!
- **TypeScript** - Type safety is not optional
- **Tailwind CSS** - Making things pretty since forever
- **Supabase** - Database + Auth + Everything
- **OpenAI API** - The brain of the operation
- **Playwright** - For those fancy PDF operations
- **Lucide React** - Icons that don't suck

## 🏗️ Environment Setup (Don't Skip This!)

### Prerequisites (Install These or Cry Later)

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **npm/yarn** - Should come with Node.js
3. **Git** - You know what this is
4. **A sense of humor** - Essential for debugging

### 🚦 Step-by-Step Setup Guide

#### 1. Clone This Magnificent Repository
```bash
git clone https://github.com/your-username/invoice-ai.git
cd invoice-ai
```

#### 2. Install Dependencies (The Fun Part)
```bash
npm install
# or if you're a yarn person
yarn install
```

This will also automatically install Playwright browsers (thanks to our postinstall script).

#### 3. Environment Variables Setup 🔑

Create a `.env.local` file in the root directory and add these secrets:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Logging (optional)
LOG_LEVEL=debug
NEXT_PUBLIC_LOG_LEVEL=debug

# Optional: Local LLM endpoint (if you're running your own)
LOCAL_LLM_ENDPOINT=http://localhost:8000

# Optional: Custom API endpoints
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

**Where to get these magical keys:**

**Supabase Setup:**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project (it's free!)
3. Go to Project Settings → API
4. Copy your Project URL and anon key
5. Go to Project Settings → API → Service Role Keys
6. Copy the service role key (keep this secret!)

**OpenAI Setup:**
1. Visit [platform.openai.com](https://platform.openai.com)
2. Create an account and get API credits
3. Go to API Keys section
4. Create a new secret key
5. Add some credits to your account (you'll need them)

#### 4. Database Setup (Supabase Magic) 🗃️

You'll need to create these tables in your Supabase database:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processed invoices table
CREATE TABLE processed_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  fields JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for processed_items...
```

#### 5. Run the Development Server 🏃‍♂️

```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) and witness the magic!

### 📜 Logging

We ship a lightweight [Pino](https://getpino.io/)-style logger that emits **structured JSON** events from both the API routes and client utilities.

- **Development**: keep the default `debug` level (set via `LOG_LEVEL` or `NEXT_PUBLIC_LOG_LEVEL`) and pretty-print the output with your favourite tool:
  ```bash
  npm run dev | npx pino-pretty
  # or
  npm run dev | jq
  ```
- **Production**: the logger automatically falls back to the `info` level. Forward the JSON lines straight to your log shipper (e.g. Loki, Datadog, ELK) for structured querying. Adjust verbosity with `LOG_LEVEL=warn` or `LOG_LEVEL=error` as needed.

Sensitive fields such as tokens and passwords are redacted automatically. Import `logger` from `@/lib/logger` anywhere in the codebase and call `logger.info`, `logger.warn`, or `logger.error` instead of `console.*`.

### 🚀 Production Deployment

- **Render**: Used for OpenAI processing backend services
- **Main App**: Can be deployed to your platform of choice
- **Docker**: Full Docker support available for containerized deployment

## 🎯 How to Use This Beast

### 1. **Upload Your First Invoice**
- Hit the "Upload" button
- Drag & drop a PDF invoice
- Watch the AI magic happen ✨

### 2. **Edit Like a Pro**
- Review extracted data
- Edit any fields that look wonky
- Add/remove invoice items
- Save your masterpiece

### 3. **Analyze Your Data**
- Check out the financial summary
- Filter by currency and date ranges
- Export to CSV for your spreadsheet addiction

### 4. **Organize with Projects**
- Group related invoices together
- Track different clients or time periods
- Delete projects when you're done

## 🐛 Troubleshooting (When Things Go Wrong)

### "OpenAI API Error"
- Check your API key is correct
- Make sure you have credits
- Verify your rate limits

### "Supabase Connection Failed"
- Double-check your environment variables
- Ensure your Supabase project is active
- Check if your database tables exist

### "PDF Processing Failed"
- Make sure the PDF isn't password-protected
- Check if it's under 10 pages (current limit)
- Try a different processing method

### "It's Not Working!"
- Turn it off and on again
- Check the browser console for errors
- Make sure you followed ALL the setup steps
- Drink some water, it helps

## 🤝 Contributing (Join the Party!)

Want to make this even more awesome? Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript (please!)
- Follow the existing code style
- Add comments for complex logic
- Test your changes

## 📜 License

This project is licensed under the "Do Whatever You Want But Don't Sue Me" License. See the LICENSE file for details.

## 🍺 Special Thanks

- **ChatGPT** - For helping debug those weird TypeScript errors
- **Hungarian Wine Industry** - For providing the inspiration (🥂)
- **Sparkling Water Companies** - Essential for staying hydrated (💧)
- **Mother Nature** - For the herbs (🌿)
- **Next.js Team** - For the incredible framework

## 📞 Support

If you need help, you can:
- Open an issue on GitHub
- Send smoke signals
- Pray to the JavaScript gods
- Actually read the documentation (revolutionary!)

## 🎉 Final Words

Remember: This tool is designed to make your life easier, not to replace your brain. Always double-check the extracted data, especially for important financial documents.

Now go forth and process those invoices like the data wizard you were meant to be! 🧙‍♂️✨

---

**Built with Hungarian wine, sparkling water, mysterious herbs, and an unhealthy amount of Next.js** 🇭🇺❤️