# SoundFlare

SoundFlare is an open-source observability and validation platform designed primarily for **[Trillet AI](https://trillet.ai)** integration and **LiveKit** compatible Voice AI agents. It acts as a "flight recorder" for your voice assistants, providing real-time monitoring, automated evaluation, and deep analysis to ensure reliable and accurate voice experiences.

## 🚀 Key Features

- **AI Validation Engine**: Automatically detects hallucinations, incorrect actions, and API failures in real-time.
- **Real-Time Metrics**: Track latency (TTFT), token costs, and success rates across your voice stack.
- **Automated Evaluations**: Stress-test your agents with AI-generated callers that mimic human behavior and edge cases.
- **Voice Bug Reporting**: Flag issues naturally using custom voice commands during live testing.
- **Deep Integration**: Purpose-built for [Trillet AI](https://trillet.ai) with native [LiveKit](https://livekit.io) compatibility.

## 🏁 Quick Start (Local Development)

We've designed the local setup to be as simple as possible using **Docker Compose**. This spins up a fully self-contained stack including the SoundFlare dashboard, a local Supabase backend (Auth, Database, API), and a gateway.

### 1. Prerequisites
- **Docker & Docker Compose** installed and running.

### 2. One-Command Setup
Simply run:

```bash
git clone https://github.com/TrilletAI/Soundflare.git
cd Soundflare
./scripts/docker-start.sh
```

That's it! The script will:
1. Auto-generate `.env.docker` with unique JWT keys (if not exists)
2. Display your credentials in the terminal
3. Save credentials to `.docker-credentials.txt` for later reference
4. Start all Docker services

**Your credentials are shown on first run and saved to `.docker-credentials.txt`**

- **Dashboard**: `http://localhost:8000`
- **Supabase API**: `http://localhost:54321`

### 🔐 Access Credentials

**Default Dashboard Login:**
- **Email**: `admin@soundflare.ai`
- **Password**: `password123`

**Your API Keys:**
Check `.docker-credentials.txt` in the project root for your unique Supabase keys (anon key & service role key). These are auto-generated on first run.

---

## ⚙️ Configuration & Environment

SoundFlare uses **two separate environment files** to avoid confusion between local Docker development and production deployments. We recommend using Docker for local testing to get going quickly, and a dedicated `.env` for production/Vercel hosting.

### Environment Files Explained

#### 1. `.env.docker` - Local Docker Development
- **Purpose**: Used exclusively by `docker-compose.yml` for local development
- **Auto-generated**: Created by `./scripts/docker-start.sh`
- **Contains**: Local Supabase URLs and JWT tokens signed with your custom secret
- **Why separate?**: Ensures everyone's local Docker environment has properly matched JWT keys
- **Git**: Ignored by `.gitignore` (never commit this file)

**Example `.env.docker`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
SUPABASE_INTERNAL_URL=http://kong:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... # Auto-generated
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Auto-generated
JWT_SECRET=your-custom-jwt-secret
```

#### 2. `.env` - Production / Vercel Hosting
- **Purpose**: Used for production deployments (Vercel, Cloud, etc.) and your own Supabase instance
- **Manual setup**: You configure this for your managed/self-hosted Supabase
- **Contains**: Remote Supabase URLs, API keys, and production secrets
- **Why separate?**: Prevents mixing local Docker configs with production credentials
- **Git**: Ignored by `.gitignore` (never commit this file)

**To create `.env`:**
```bash
cp .env.example .env
# Edit with your production Supabase credentials
```

**Required for Production:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your managed Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your managed Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Your managed Supabase Service Role Key

**Optional for AI Features:**
- `OPENAI_API_KEY`: For AI-powered transcript analysis

**Optional for AI Call Reviews (Vertex AI / Gemini):**

The AI Call Review feature uses Google Gemini via Vertex AI to automatically detect hallucinations, wrong actions, and API failures in your call logs. To enable it:

1. Create a [Google Cloud project](https://console.cloud.google.com/) and enable the **Vertex AI API**
2. Create a **service account** with the `Vertex AI User` role
3. Download the service account JSON key file
4. Provide credentials using **one** of the two options below:

**Option A — Vercel / Serverless (recommended for hosting):**

Base64-encode the JSON key and set it as an env var. This avoids needing a file on disk.

```bash
# Generate the base64 string:
cat your-credentials.json | base64 -w 0

# Then set in Vercel / .env:
GOOGLE_CREDENTIALS_JSON=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50Ii...
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
```

**Option B — File-based (local dev / VMs):**

Place the key file at `src/credentials/google-credentials.json`, or point to it with an env var:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-credentials.json
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
```

**Optional overrides (defaults shown):**
```bash
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GEMINI_MODEL=gemini-2.5-flash
```

> **Note**: The `src/credentials/` directory is git-ignored. Never commit credential files to the repository.

### Important Notes

- **Docker Compose** reads **only** `.env.docker` (auto-generated by `./scripts/docker-start.sh`)
- **Vercel / Next.js** reads `.env` for production deployments
- Your unique JWT keys are saved in `.docker-credentials.txt` for easy reference
- All credential files are git-ignored to protect your secrets
- To regenerate keys: delete `.env.docker` and run `./scripts/docker-start.sh` again

---

## 🐳 Docker Commands Reference

Use these commands from the project root. All Docker commands require `--env-file .env.docker` to avoid warnings about unset variables.

### First-Time Setup

```bash
./scripts/docker-start.sh
```

This handles everything: env generation, build, start, schema migration, and seeding.

### Common Scenarios

| Scenario | Command |
|----------|---------|
| **Changed application code** (components, API routes, etc.) | `docker compose --env-file .env.docker up -d --build web` |
| **Changed `.env.docker`** (runtime vars like API keys) | `docker compose --env-file .env.docker up -d web` |
| **Changed `NEXT_PUBLIC_*` env vars** | `docker compose --env-file .env.docker up -d --build web` |
| **Changed database schema** | `docker exec -i soundflare-db psql -U postgres -d postgres < database/setup-supabase.sql && docker restart soundflare-rest` |
| **Start all services** | `docker compose --env-file .env.docker up -d` |
| **Stop all services** | `docker compose down` |
| **Full reset (wipes database)** | `docker compose down -v && ./scripts/docker-start.sh` |
| **Regenerate JWT keys** | `rm .env.docker && ./scripts/docker-start.sh` |

> **Why `--build` for code changes?** The Next.js app is compiled at Docker build time into a standalone production bundle. Without `--build`, the container runs the old compiled code.

> **Why `--build` for `NEXT_PUBLIC_*` vars?** Variables prefixed with `NEXT_PUBLIC_` are inlined at build time by Next.js. Changing them at runtime has no effect — you must rebuild.

> **Why NO `--build` for other env vars?** Runtime-only vars (like `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `TRILLET_EVALS_MASTER_KEY`) are read at request time from the container environment. Restarting the container picks them up without a rebuild.

### Viewing Logs

```bash
# All services
docker compose --env-file .env.docker logs -f

# Web app only (API routes, errors)
docker compose --env-file .env.docker logs -f web

# Auth service
docker compose --env-file .env.docker logs -f auth

# Database
docker compose --env-file .env.docker logs -f db
```

> **Note:** The web container runs a production build. Only `console.error` and `console.warn` appear in the logs — `console.log` is stripped. Use `console.error` for important diagnostics.

### Service Overview

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| `web` | soundflare-web | 8000 | Next.js dashboard + API routes |
| `db` | soundflare-db | 5432 | PostgreSQL database |
| `auth` | soundflare-auth | 9999 | Supabase Auth (GoTrue) |
| `rest` | soundflare-rest | 3000 | Supabase API (PostgREST) |
| `kong` | soundflare-kong | 54321 | API gateway (unified Supabase URL) |

---

## 🛠️ Troubleshooting

### Login Issues or "Invalid Credentials"
If you cannot log in with the default credentials, or if the database container had issues starting:

1. **Reset the Environment**:
   ```bash
   docker compose down -v
   ./scripts/docker-start.sh
   ```

2. **Check Logs**:
   ```bash
   docker compose --env-file .env.docker logs -f web
   docker compose --env-file .env.docker logs -f auth
   docker compose --env-file .env.docker logs -f kong
   ```

3. **View Your Credentials**:
   ```bash
   cat .docker-credentials.txt
   ```

### "Invalid Refresh Token" Errors
If you see `AuthApiError: Invalid Refresh Token` in the web logs after regenerating JWT keys, clear your browser cookies for `localhost:8000` and log in again. Old session tokens are invalid after key rotation.

### CORS Errors
If you see network errors in the browser console, ensure you are accessing the dashboard at `http://localhost:8000` exactly. The local gateway is configured to allow requests from this origin.

---

## 🔌 Integrating Your Agent

Connect your Python-based LiveKit/Trillet agent using the [SoundFlare SDK](https://github.com/TrilletAI/soundflare-sdk).

### 1. Install the SDK
> **Coming Soon**: The `soundflare` pip package is being prepared for release.

```bash
pip install soundflare
```

### 2. Add Observability
```python
import os
from soundflare import LivekitObserve
from livekit.agents import AgentSession

# Initialize
soundflare = LivekitObserve(
    agent_id="YOUR_AGENT_ID",
    apikey="YOUR_API_KEY" # Generate this in the SoundFlare Dashboard
)

async def entrypoint(ctx: JobContext):
    session = AgentSession(...)
    
    # Start monitoring
    session_id = soundflare.start_session(session=session)
    
    # Export data on shutdown
    async def on_shutdown():
        await soundflare.export(session_id)
    ctx.add_shutdown_callback(on_shutdown)
    
    await session.start(...)
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support
- **GitHub**: [Report issues](https://github.com/TrilletAI/soundflare/issues)