# Law Mithra — AI-Powered Multilingual Legal Document Assistant

> **"Understand the Law. Understand Your Rights."**

Law Mithra is an AI-powered legal document comprehension and assistance platform tailored specifically for Indian citizens, litigants, and legal researchers. It demystifies convoluted legal notices, petitions, court orders, and contracts into plain, verified language across 8 Indian languages (Kannada, Hindi, Telugu, Tamil, Malayalam, Marathi, Bengali, and English).

---

## 🏗️ Monorepo Architecture

```text
law-mithra/
├── .env.example              # Centralized environment variable template
├── .gitignore                # Root gitignore (Python, Node, DB, OS)
├── README.md                 # Project overview and roadmap checklist
├── docker-compose.yml        # Orchestration (PostgreSQL, Redis, Django, Vite)
├── ai/                       # AI pipelines, RAG, and model weights (Phase 1+)
│   └── README.md             # AI module roadmap
├── backend/                  # Django REST Framework backend
│   ├── Dockerfile            # Container definition for Django
│   ├── manage.py             # Django CLI
│   ├── pytest.ini            # Pytest configuration
│   ├── requirements.txt      # Python dependencies (Phase 0)
│   ├── config/               # Project configuration & settings
│   │   ├── asgi.py           # ASGI entry point
│   │   ├── settings.py       # Environ-based configuration (Zero hardcoded secrets)
│   │   ├── urls.py           # Routing (/api/health/, /api/docs/, /api/schema/)
│   │   ├── views.py          # Operational health view
│   │   └── wsgi.py           # WSGI entry point
│   ├── accounts/             # User authentication & roles (Phase 0 app)
│   ├── documents/            # Document vault & storage (Phase 0 app)
│   ├── analysis/             # Simplification & legal entity extraction (Phase 0 app)
│   ├── story/                # Case chronologies & timelines (Phase 0 app)
│   ├── knowledge/            # Legal statutes & precedent vectors (Phase 0 app)
│   ├── reports/              # Court dossier & advocate question builder (Phase 0 app)
│   └── tests/                # Test suite
│       └── test_health.py    # Health & OpenAPI schema pytest tests
├── frontend/                 # React (Vite + TypeScript) + Tailwind CSS + shadcn/ui
│   ├── Dockerfile            # Container definition for Vite
│   ├── index.html            # Web entry point with Google Fonts preconnect
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Design tokens (Navy, Gold, Ivory, Charcoal, etc.)
│   ├── tsconfig.json         # TypeScript configuration
│   ├── vite.config.ts        # Vite configuration & backend proxy
│   └── src/
│       ├── App.tsx           # Main app layout with dark mode & ToastProvider
│       ├── main.tsx          # React DOM root
│       ├── index.css         # Tailwind base & CSS variables
│       ├── lib/utils.ts      # Classnames merger (clsx + tailwind-merge)
│       ├── components/
│       │   ├── Navbar.tsx    # Header with status badge, language dropdown, theme toggle
│       │   ├── Hero.tsx      # Hero with tagline, disabled upload, and privacy line
│       │   ├── ExplainerSteps.tsx # 3-step workflow
│       │   ├── LanguageSelector.tsx # 8-language switcher (UI only)
│       │   ├── ApiStatusBadge.tsx   # TanStack Query live health badge
│       │   ├── DesignSystemShowcase.tsx # Component and token showcase
│       │   ├── SafetyContractSection.tsx # 6 AI safety principles in UI
│       │   ├── Footer.tsx    # Legal disclaimers & reference links
│       │   └── ui/           # Reusable UI component library
│       │       ├── Badge.tsx # verified, needs-verification, alleged, missing
│       │       ├── Button.tsx# primary, gold, secondary, outline, destructive
│       │       ├── Card.tsx  # Card, Header, Title, Content, Footer
│       │       ├── Skeleton.tsx # Loading placeholders
│       │       └── Toast.tsx # Toast provider and notification hook
└── docs/
    ├── SETUP.md              # Complete installation & run guide (Windows-friendly)
    └── AI_SAFETY_CONTRACT.md # Mandatory 6 legal ethics and safety rules
```

---

## 🎨 Phase 0 Design System Tokens

| Token Name | Hex Code | Semantic Role |
|---|---|---|
| **Navy** | `#0B1F3A` | Primary brand color, authoritative legal headers |
| **Gold** | `#C9A227` | Accent color, highlights, buttons, interactive accents |
| **Ivory** | `#FAF7F0` | Light background, parchment-inspired reading surface |
| **Charcoal** | `#0F141B` | Dark background, high-contrast night mode |
| **Teal** | `#1F8A70` | Semantic status: **Verified Fact / Verified Citation** |
| **Amber** | `#D98E04` | Semantic status: **Needs Verification** |
| **Soft Red** | `#C0392B` | Semantic status: **Allegation / Contested Claim / Error** |

- **Typography**: Inter (Latin) paired with Noto Sans (Devanagari, Kannada, Telugu, Tamil, Malayalam, Bengali).
- **Rhythm & Geometry**: 8-point spacing system, 12–16px border radii, soft elevation shadows.
- **Theme Support**: Class-based dark mode (`class="dark"`) with automatic preference detection and persistence.

---

## ⚖️ AI Safety Contract Highlights

As detailed in [`docs/AI_SAFETY_CONTRACT.md`](./docs/AI_SAFETY_CONTRACT.md), the system implements 6 invariant safety rules:
1. **Informational Assistant Only**: Not a replacement for an advocate; does not provide formal legal advice.
2. **Mandatory Citations**: Every claim requires an explicit statutory citation or a `[Needs Verification]` badge.
3. **Zero Invention**: Never hallucinate judgments, statutes, case citations, or filing deadlines.
4. **Allegations ≠ Facts**: Allegations in complaints or plaints are never presented as established facts.
5. **Truthful Court Prep**: Preparation tools exclusively organize truthful chronological facts and advocate questions.
6. **Data Sovereignty**: Permanent one-click deletion of user documents and accounts.

---

## 🚀 Quick Start

### Option 1: Docker Compose
```powershell
Copy-Item .env.example .env
docker compose up --build
```

### Option 2: Local Windows Development
```powershell
# 1. Backend (Terminal 1)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
pytest -v
python manage.py runserver 127.0.0.1:8000

# 2. Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **API Health**: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- **Swagger Docs**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

---

## 📋 Project Phases & Progress Roadmap

- [x] **Phase 0: Foundation & Design System**
  - [x] Monorepo structure (`frontend`, `backend`, `ai`, `docs`, `docker-compose.yml`)
  - [x] Django REST Framework with 6 empty apps (`accounts`, `documents`, `analysis`, `story`, `knowledge`, `reports`)
  - [x] Environment variable configuration (no secrets in code)
  - [x] PostgreSQL connection, CORS restricted to frontend, Swagger docs at `/api/docs/`
  - [x] Operational health endpoint `GET /api/health/` with passing `pytest` suite
  - [x] Vite + React + TypeScript + Tailwind design tokens & Noto Sans multilingual fonts
  - [x] Reusable UI components (`Button`, `Badge`, `Card`, `Skeleton`, `Toast`)
  - [x] Premium landing page with hero, 8-language switcher, disabled upload tooltip, 3-step explainer, privacy notice, and live API status badge
  - [x] Docker Compose multi-container setup with hot reload
  - [x] Comprehensive documentation (`SETUP.md`, `AI_SAFETY_CONTRACT.md`, `README.md`)
- [ ] **Phase 1: Document Vault & OCR Pipeline** (Celery, Redis, Tesseract OCR, PDF parsing)
- [ ] **Phase 2: Plain Language Simplification & Legal Entity Extraction** (Ollama, Local LLM)
- [ ] **Phase 3: Legal Knowledge Retrieval & RAG** (LangChain, FAISS, BNS/IPC/CrPC Section Indexing)
- [ ] **Phase 4: Indic Multilingual Translation & Voice Query** (IndicTrans2, Whisper)
- [ ] **Phase 5: Case Chronology & Visual Story Builder**
- [ ] **Phase 6: Court Dossier Export & Advocate Question Generator**
- [ ] **Phase 7: End-to-End Evaluation, Security Hardening & Deployment**
