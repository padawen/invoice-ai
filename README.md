# 🧾 Invoice AI

**Invoice AI** is a powerful PDF invoice processor built with [Next.js](https://nextjs.org).  
It allows users to upload invoice PDFs and extract structured data using **AI-powered techniques**.

## 🚀 Features

- 🔍 **PDF Upload & Preview** (with live iframe preview)
- 🧠 **AI-Powered Invoice Processing** via:
  - **OpenAI GPT** – for high-accuracy general extraction
  - **Local LLM** – for privacy-first, offline-compatible processing
  - **OCR (Optical Character Recognition)** – for scanned documents
- ✍️ Editable field interface with Tailwind styling
- 📂 Project selection & assignment
- 💾 Save to database
- 📜 TypeScript + Supabase + App Router + Tailwind CSS

---

## 🧠 Processing Options

| Option      | Description                                          |
|-------------|------------------------------------------------------|
| **OpenAI**  | Uses GPT-4 to extract structured invoice data        |
| **Local LLM** | Process using your own local language model        |
| **OCR**     | Extract text from scanned images in PDFs (via Tesseract or similar) |

---

## 💡 How It Works

1. **Upload a PDF** → instant preview
2. **Choose a processing method** (OpenAI, Local LLM, OCR)
3. **Review & edit extracted fields**
4. **Select or create a project**
5. **Save the result to the database**

---

## 🛠 Getting Started

```bash
npm install
npm run dev
