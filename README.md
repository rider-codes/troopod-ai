Troopod AI – Landing Page Personalizer

Troopod is a Next.js 14 app that helps align landing page hero copy with an ad creative. It uses AI to improve message match so the page feels more relevant and clear when someone lands on it.

What it does

It takes an ad creative as input, analyzes the core message with Google Gemini, scrapes the landing page using Firecrawl or fallback methods, and rewrites only the important hero content like the headline, subheadline, body, and CTA. The original page structure stays the same, and the result is shown side by side with the original.

Tech stack

Next.js 14, Tailwind CSS, Google Gemini, Firecrawl, Cheerio, and Zod.

Local setup

Create a .env.local file with:
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
FIRECRAWL_API_KEY=your_firecrawl_key

Then run:

npm install
npm run dev

Open http://localhost:3000
 in your browser.

Deployment
The app is ready to deploy on Vercel. After pushing to GitHub, add the same environment variables in your Vercel project settings.