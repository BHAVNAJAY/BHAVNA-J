# Bhavna J - Personal Portfolio

A personal portfolio exploring the intersection of development, artificial intelligence, and design.

I'm Bhavna Jayakumar, a Computer Science Engineering student specialising in AI & Machine Learning. I enjoy building useful applications, experimenting with AI-powered solutions, and creating digital experiences that bring functionality and visual design together.

## About the Portfolio

This portfolio brings together my projects, skills, achievements, creative work, and professional journey in one interactive experience.

From a custom-built 3D hanging ID badge and scroll-based animations to an interactive achievements flipbook and a personal AI assistant, each feature reflects my interest in combining thoughtful design with hands-on development.

## Tech Stack

- Framework: Next.js (App Router)
- Frontend: React 19, TypeScript
- 3D Graphics: Three.js, React Three Fiber, Drei
- Animation: Motion for React
- Interactive Flipbook: react-pageflip
- Icons: Lucide
- Styling: CSS Modules and custom CSS
- AI Integration: Gemini API
- Retrieval: Embeddings, cosine similarity, semantic search, and Retrieval-Augmented Generation (RAG)

## Key Features

- Interactive 3D ID badge with a custom acrylic-style body, metal clip, animated ribbon lanyard, and front-and-back interaction.
- Scroll-based animations and interactive transitions throughout the portfolio.
- Project gallery showcasing my technical projects and creative work.
- Animated achievements flipbook with page-turning interactions.
- Responsive layouts with reduced-motion support and a fallback for devices that cannot render the 3D scene.
- Personal AI assistant that answers questions about my background, skills, projects, experience, and achievements using a curated portfolio knowledge base.

The 3D badge is built directly in code using Three.js and React Three Fiber, without Spline or paid 3D services.

## What's Inside

- About: My background, interests, and professional journey.
- Skills: My toolkit across development, AI/ML, design, and visual communication.
- Projects: Selected technical and creative work.
- Experience & Achievements: My professional journey and key milestones.
- Resume & Contact: Information for connecting and exploring collaboration opportunities.

## AI Portfolio Assistant — Bhavna's AI

Bhavna's AI is a Gemini-powered assistant designed to help visitors explore my portfolio through natural-language questions. Instead of relying on a fixed set of questions and answers, it retrieves relevant information from my portfolio before generating a response.

### How the RAG Pipeline Works

The assistant uses Retrieval-Augmented Generation (RAG) to find relevant portfolio information before sending context to Gemini.

1. Knowledge preparation: The `npm run build:knowledge` command splits portfolio data into 34 focused chunks covering areas such as skills, projects, roles, and achievements. These chunks are generated from the existing data files to avoid maintaining a separate copy of the portfolio content.

2. Embedding generation: Gemini converts each chunk into a 768-dimensional embedding that represents its semantic meaning. The embeddings are saved in `knowledge-embeddings.json`.

3. Question embedding: When a visitor asks a question, the server generates an embedding for that question using the same embedding approach.

4. Semantic retrieval: The system compares the question embedding against the stored chunk embeddings using cosine similarity and selects the five most relevant chunks. This allows the assistant to retrieve information based on meaning rather than relying only on exact keyword matches.

5. Pinned context: Two additional chunks are always included: a portfolio map summarising the available information and a contact-details chunk.

6. Answer generation: Gemini receives the assistant instructions, retrieved context, and visitor's question. This keeps the prompt focused on the most relevant information instead of sending the entire portfolio every time.

7. Grounded responses: The assistant is instructed to answer using the supplied portfolio information. When the requested details are not documented, it should acknowledge the limitation instead of inventing personal facts. Questions about tools or technologies outside my established expertise are handled with wording that distinguishes current knowledge from areas I'm still learning.

8. Fallback handling: If semantic retrieval cannot run, the system falls back to supplying the full portfolio context, helping the assistant remain usable when retrieval is unavailable.

The retrieval process uses cosine similarity over stored embeddings, without requiring a separate vector database. The selected context is approximately 3–4 KB in typical cases, compared with around 14 KB for the full portfolio context.

### Run Locally

1. Install dependencies.

```bash
npm install
```

2. Configure environment variables.

Create a `.env.local` file based on `.env.example` and add your Gemini API key.

```env
GEMINI_API_KEY=your_gemini_api_key
```

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey).

Keep `.env.local` private and never commit API keys to version control.

3. Build the knowledge embeddings.

```bash
npm run build:knowledge
```

This prepares the portfolio chunks and generates `knowledge-embeddings.json`. Ensure the generated knowledge file is available to the application in the expected location.

4. Start the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and use the AI assistant.

### Assistant Configuration

- API route: `src/app/api/chat/route.ts`
- Assistant instructions: `src/lib/assistantInstructions.ts`
- Portfolio knowledge source: Data files in `src/data/`
- Knowledge preparation: `npm run build:knowledge`
- Generated embeddings: `knowledge-embeddings.json`

Update the original portfolio data files when your skills, projects, or experience change, then rebuild the knowledge embeddings so the assistant can retrieve the updated information.

### Deployment Notes

The chat API requires a server-side runtime, such as local Next.js development, `next start`, or a suitable Vercel deployment. Static hosting alone cannot execute the API route.

If the frontend is deployed on GitHub Pages, configure `CHAT_API_URL` to point to a separately deployed chat API. Set `CHAT_ALLOWED_ORIGINS` on the API server to allow the deployed frontend's origin.

For shared rate limiting across serverless instances, configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without these variables, the implementation falls back to per-instance in-memory rate limiting.

Keep the Gemini API key on the server and never expose it in client-side code.

## Connect

I'm always interested in exploring new ideas, learning from others, and collaborating on projects that bring technology and creativity together.

- Portfolio: [bhavna-j.vercel.app](https://bhavna-j.vercel.app/)
- Email: [bhavnajayakumar@gmail.com](mailto:bhavnajayakumar@gmail.com)
- Behance: [My design work](https://www.behance.net/bhavna-jayakumar)

----------------------------------------------------------

Designed and built by Bhavna Jayakumar.