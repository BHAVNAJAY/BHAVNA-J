# Bhavna J — Personal Portfolio

A creative portfolio showcasing my journey across Design, Development, Artificial Intelligence, and Digital Marketing.

I'm Bhavna Jayakumar, a Computer Science Engineering student specializing in AI & Machine Learning. I enjoy transforming ideas into meaningful digital experiences by combining technical problem-solving with thoughtful design and creativity.

## About the Portfolio

This portfolio brings together my technical projects, creative work, skills, achievements, and professional journey in one interactive experience.

The website features a cinematic 3D hanging ID badge, interactive project showcases, an animated achievements flipbook, and dedicated sections highlighting my background, skills, interests, and contact information.

## Tech Stack

- Framework: Next.js (App Router)
- Frontend: React 19, TypeScript
- 3D Graphics: Three.js, React Three Fiber, Drei
- Animations: Motion for React
- Interactive Flipbook: react-pageflip
- Icons: Lucide
- Styling: CSS Modules and custom CSS

## Highlights

- Interactive 3D ID badge built entirely with code
- Custom acrylic badge geometry, metal clip, and animated ribbon lanyard
- Front-and-back badge rotation with interactive controls
- Smooth animations and scroll-based transitions
- Interactive project gallery with dedicated case studies
- Page-turning achievements flipbook
- Responsive layouts with accessibility and reduced-motion support
- WebGL fallback for devices that cannot render the 3D scene

The 3D badge is created using Three.js and React Three Fiber, without Spline or paid 3D services.

## Explore

- About Me: My background, interests, and professional journey
- Skills: My capabilities across design, development, AI/ML, and digital marketing
- Projects: Selected technical and creative projects
- Achievements: Milestones and accomplishments presented through an interactive flipbook
- Hobbies: Interests beyond technology
- Resume & Contact: My professional profile and ways to connect

## AI Portfolio Assistant

A Gemini-powered chat ("Bhavna's AI") answers visitors' questions using only the content already in
`src/data/` (profile, skills, experience, projects, achievements). It is not RAG yet: the whole portfolio
is passed as context, behind a single `retrieve()` function that a later RAG version can replace.

Setup:

1. Create a free key at https://aistudio.google.com/apikey
2. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY=...` (this file is git-ignored; never commit it).
3. `npm install` then `npm run dev` and open http://localhost:3000 — the button appears bottom-right.

Notes:

- The API lives in `src/app/api/chat/route.ts` and needs a Node server (local dev, `next start`, or Vercel).
  GitHub Pages only serves static files, so the Pages build leaves the route out and the chat says it is not connected
  yet, unless the repository variable `CHAT_API_URL` points at a deployment (for example on Vercel) that hosts it.
  On that server also set `CHAT_ALLOWED_ORIGINS=https://bhavnajay.github.io`.
- For rate limiting that holds across serverless instances, set `UPSTASH_REDIS_REST_URL` and
  `UPSTASH_REDIS_REST_TOKEN`; without them it falls back to per-instance memory.
- Edit what the assistant knows by editing the data files; edit how it behaves in `src/lib/assistantInstructions.ts`.

## Connect

I'm always open to meaningful collaborations, new ideas, and opportunities to learn, create, and grow.

Logic runs from A to Z. Creativity knows no limits.



Designed and built by Bhavna J.