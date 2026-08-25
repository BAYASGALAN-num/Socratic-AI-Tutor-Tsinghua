# Socratic AI Tutor

A small web app that helps students learn by reasoning through a problem instead of getting handed the answer. You enter a problem, the AI asks a guiding question, you explain your thinking, and it nudges you toward the next step — Socratic-style.

Powered by Anthropic's Claude API (`claude-haiku-4-5`) via the `@anthropic-ai/sdk` SDK.

## How it works

- **Start Learning** — submit a problem; the tutor asks one guiding question to help you identify what matters in it.
- **Submit reasoning** — explain your thinking; the tutor evaluates it and asks the next guiding question.
- **I'm stuck** — get a small hint, never the final answer.

The tutor is instructed to never give the final answer outright, ask guiding questions, and never shame or criticize the student.

## Project structure

```
index.html       Frontend UI
script.js        Frontend logic (calls the local API)
style.css        Styling
server/
  server.js      Express server, calls the Claude API
  package.json   Server dependencies
  .env           ANTHROPIC_API_KEY (not committed — see Setup)
```

## Setup

### 1. Install server dependencies

```bash
cd server
npm install
```

### 2. Add your Anthropic API key

Create `server/.env`:

```
ANTHROPIC_API_KEY=your_key_here
```

Get a key from the [Anthropic Console](https://console.anthropic.com/settings/keys).

### 3. Start the server

```bash
npm start
```

The API listens on `http://localhost:3000`.

### 4. Open the app

Open `index.html` in your browser. It calls the API at `http://localhost:3000/api/ask`, so the server must be running first.

## Notes

- `server/.env` holds a real API key — keep it out of version control.
- If Claude returns an `overloaded_error` or rate-limit error, that's a transient issue on Anthropic's side; retry the request.
