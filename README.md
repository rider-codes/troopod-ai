# Troopod AI - Landing Page Personalizer

A Next.js 14 web application designed to automatically align landing page hero copy with ad creatives. By using AI to ensure a strong message match, this tool improves conversion clarity, engages visitors immediately, and reduces bounce rates.

## 🚀 Features

- **Smart Scraping Strategy**: Utilizes Firecrawl for advanced content extraction on modern websites, with graceful fallbacks to standard HTTP fetch and Cheerio.
- **AI-Powered Analysis**: Uses Google Gemini to analyze your ad text or image creatives to extract the core value proposition.
- **CRO-Safe Personalization**: Intelligently rewrites only the high-impact hero areas (headline, sub-headline, body, and CTA) while seamlessly preserving the page's original structure and intent.
- **Side-by-Side Preview & Scorecards**: Instantly view the original page copy next to the AI-personalized version, complete with message match and CRO quality scoring.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini SDK (Gemini 2.5 Flash)
- **Data Scraping**: Firecrawl / Cheerio
- **Data Validation**: Zod

## ⚙️ Local Development

### Prerequisites

Create a `.env.local` file at the root of the project with the following environment variables:

```bash
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
FIRECRAWL_API_KEY=your_firecrawl_key
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## 🚢 Deployment

This application is ready to be deployed on [Vercel](https://vercel.com).
After pushing the code to GitHub, connect the repository to your Vercel account and ensure the environment variables from your `.env.local` are added to the Vercel project's environment settings.
