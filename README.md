# Bhavna J — Personal Portfolio

A personal portfolio exploring the intersection of development, artificial intelligence, and design.

I'm Bhavna Jayakumar, a Computer Science Engineering student specialising in AI & Machine Learning. I enjoy building useful applications, experimenting with AI-powered solutions, and creating digital experiences that bring functionality and visual design together.

## About the Portfolio

This portfolio is a reflection of my work, interests, and growth across software development, AI/ML, and creative design. It brings my projects, skills, experience, and achievements together in an interactive website designed to feel as personal as the work it showcases.

From custom 3D interactions to scroll-based animations and an interactive achievements flipbook, my personal assistant, each section combines thoughtful design with hands-on development.

## Tech Stack

- Framework: Next.js (App Router)
- Frontend: React 19, TypeScript
- 3D Graphics: Three.js, React Three Fiber, Drei
- Animation: Motion for React
- Interactive Flipbook: react-pageflip
- Icons: Lucide
- Styling: CSS Modules, custom CSS

## Key Features

- Interactive 3D ID Badge: A custom-built hanging badge with an acrylic-style body, metal clip, ribbon lanyard, and front-and-back interaction.
- Scroll-Based Animations: Motion and transitions that bring the portfolio experience to life.
- Project Showcase: A dedicated space for exploring my technical projects, creative work, and implementations.
- Achievements Flipbook: An animated, page-turning presentation of milestones and accomplishments.
- Responsive Design: Layouts designed to work across different screen sizes, with reduced-motion support and a fallback for devices that cannot render the 3D scene.


## What's Inside

- About: My background, interests, and professional journey.
- Skills: My toolkit across development, AI/ML, design, and visual communication.
- Projects: Selected technical and creative work.
- Experience & Achievements: My professional journey and key milestones.
- Resume & Contact: Information for connecting and exploring collaboration opportunities.

## AI Portfolio Assistant

The portfolio includes **Bhavna's AI**, a Gemini-powered assistant that helps visitors learn more about my background, skills, projects, experience, and achievements.

It uses structured portfolio data as its knowledge source, with instructions designed to keep responses grounded in the information provided rather than inventing personal details.

### How It Works

The chat interface sends questions to a Next.js API route, which applies the assistant's instructions and supplies relevant portfolio information to Gemini. The API key stays on the server rather than being exposed in the frontend.

The current implementation uses portfolio context provided through a `retrieve()` function. It can be extended with a retrieval-augmented generation (RAG) pipeline as the knowledge base grows.

### Run Locally

1. Install dependencies

```bash
npm install
```

2. Configure environment variables

Create a `.env.local` file based on `.env.example` and add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Get a key from [Google AI Studio](https://aistudio.google.com/apikey). Keep `.env.local` private and never commit API keys to version control.

3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Assistant Configuration

- API route: `src/app/api/chat/route.ts`
- Assistant instructions: `src/lib/assistantInstructions.ts`
- Knowledge source: Portfolio data files in `src/data/`

Update the portfolio data files to change the information available to the assistant, and edit the instruction file to adjust its behaviour.

### Deployment Notes

The chat API requires a server-side runtime, such as local Next.js development, `next start`, or a suitable Vercel deployment. Static hosting alone cannot execute the API route.

If deploying the frontend to GitHub Pages, configure `CHAT_API_URL` to point to a separately deployed chat API and configure `CHAT_ALLOWED_ORIGINS` on that server to allow the deployed frontend's origin.

For rate limiting shared across serverless instances, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without these, the implementation falls back to per-instance in-memory rate limiting.

## Connect

I'm always interested in exploring new ideas, learning from others, and collaborating on projects that bring technology and creativity together.

- Portfolio: [bhavna-j.vercel.app](https://bhavna-j.vercel.app/)
- Email: [bhavnajayakumar@gmail.com](mailto:bhavnajayakumar@gmail.com)
- Behance: [My design work](https://www.behance.net/bhavnaj10-h8)

--------------------------------------------------------------------

Designed and built by Bhavna Jayakumar.