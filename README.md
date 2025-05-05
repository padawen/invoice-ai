# 🧠 Invoice AI

A modern, AI-powered invoice processing application that automatically extracts and processes data from PDF invoices. Built with Next.js, Supabase, and OpenAI.

![Invoice AI](https://i.imgur.com/placeholder.png)

## ✨ Features

- 🤖 **AI-Powered Processing**: Automatically extract data from both text and image-based PDF invoices
- 📱 **Modern UI**: Beautiful, responsive interface with dark mode support
- 🔄 **Real-time Preview**: Preview and edit extracted data before saving
- 📊 **Project Management**: Organize invoices by projects
- 🔒 **Authentication**: Secure login with Google OAuth
- 🎯 **Smart Detection**: Automatically detects PDF type (text/image) for optimal processing
- ✏️ **Easy Editing**: Intuitive interface for reviewing and editing extracted data

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/invoice-ai.git
cd invoice-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Database**: [Supabase](https://supabase.com/)
- **Authentication**: [Supabase Auth](https://supabase.com/auth)
- **AI Processing**: [OpenAI API](https://openai.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide Icons](https://lucide.dev/)
- **PDF Processing**: [PDF.js](https://mozilla.github.io/pdf.js/)

## 📝 Usage

1. **Upload**: Drag and drop or select a PDF invoice
2. **Detect**: The system automatically detects the PDF type
3. **Process**: AI extracts relevant data from the invoice
4. **Review**: Edit and verify the extracted data
5. **Save**: Store the processed invoice in your project

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- Supabase for the backend infrastructure
- Next.js team for the amazing framework
- All contributors who have helped shape this project

---

Made with ❤️ and Next.js
