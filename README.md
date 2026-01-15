## What this app does
Generates short, brand-ready taglines using OpenAI based on your input.

## Run locally
1) Install dependencies:
```bash
npm install
```
2) Create `./.env.local` with your API key (do not commit this file):
```bash
OPENAI_API_KEY=your_key_here
```
3) Start the dev server:
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment variables
- `OPENAI_API_KEY` (required): OpenAI API key used by the app. Add it to `.env.local` and do not commit that file.

## Deploy to Vercel (GitHub)
1) Push this repo to GitHub.
2) In Vercel, click "New Project" and import the repo.
3) Set `OPENAI_API_KEY` in the Vercel project environment variables.
4) Deploy. Vercel will build and host the app.

## Troubleshooting
- 400 validation errors: check required fields and request inputs from the UI; empty or malformed values will be rejected.
- 500 OpenAI errors: verify your API key, account quota, and OpenAI status; retry after fixing.
