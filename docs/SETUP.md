# Law Mithra — Setup & Execution Guide (Phase 0)

**Tagline**: *Understand the Law. Understand Your Rights.*  
**Project Phase**: Phase 0 — Foundation & Design System  

This guide provides Windows-friendly instructions for setting up and running Law Mithra locally or via Docker Compose.

---

## 1. Prerequisites & Toolchain Versions

| Component | Tested Version | Purpose |
|---|---|---|
| **Operating System** | Windows 10/11 / Linux / macOS | Host OS |
| **Node.js** | `v20.x` or `v24.x` (Tested: `v24.21.0`) | Frontend runtime |
| **npm** | `v10.x` or `v11.x` (Tested: `11.19.0`) | Package manager |
| **Python** | `3.12+` / `3.14+` (Tested: `3.14.7`) | Backend runtime |
| **Git** | `2.44+` (Tested: `2.44.0.windows.1`) | Version control |
| **PostgreSQL** | `16-alpine` (Docker) | Primary relational database |
| **Redis** | `7-alpine` (Docker) | Caching and message broker |
| **Docker & Compose** | Docker Desktop `4.28+` / Compose `v2.24+` | Containerized orchestration |

---

## 2. Option A: Running with Docker Compose (Recommended)

Docker Compose starts PostgreSQL, Redis, Django Backend, and Vite Frontend with live hot-reloading in one command.

### Step 1: Copy Environment Variables
In the project root directory (`law-mithra/`):
```powershell
Copy-Item .env.example .env
```

### Step 2: Build and Start Containers
```powershell
docker compose up --build
```

### Step 3: Access the Services
- **Frontend Web Application**: [http://localhost:5173](http://localhost:5173)
- **Django Health Endpoint**: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- **OpenAPI 3 / Swagger Documentation**: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **OpenAPI Schema (JSON)**: [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)
- **PostgreSQL Database**: `localhost:5432` (`lawmithra_db`, user: `lawmithra`)
- **Redis**: `localhost:6379`

### Stopping Containers
```powershell
docker compose down
# Or to wipe database volumes:
docker compose down -v
```

---

## 3. Option B: Running Natively on Windows (Local Development)

If you prefer running the backend and frontend directly on your Windows machine without Docker:

### Step 1: Configure Environment Variables
```powershell
Copy-Item .env.example .env
```

---

### Step 2: Backend Setup (Django + DRF)

1. Open PowerShell and navigate to `backend`:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
   *(If you encounter a PowerShell execution policy error, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

3. Upgrade pip and install dependencies:
   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Run unit tests with `pytest`:
   ```powershell
   pytest -v
   ```
   *(Verifies GET `/api/health/` and `/api/schema/`)*

5. Apply initial database migrations (optional for Phase 0 health endpoint):
   ```powershell
   python manage.py migrate
   ```

6. Start Django development server:
   ```powershell
   python manage.py runserver 127.0.0.1:8000
   ```
   The backend will be live at `http://127.0.0.1:8000/`.

---

### Step 3: Frontend Setup (Vite + React + Tailwind)

1. Open a new PowerShell terminal and navigate to `frontend`:
   ```powershell
   cd frontend
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. (Optional) Validate TypeScript and build bundle:
   ```powershell
   npm run build
   ```

4. Start Vite development server:
   ```powershell
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Verifying Phase 0 Deliverables

| Requirement | Test Method | Expected Result |
|---|---|---|
| **Health Check** | Open `http://localhost:8000/api/health/` or observe badge in UI | `{"status":"ok","service":"law-mithra-api"}` (Badge shows green "API Online") |
| **OpenAPI Docs** | Open `http://localhost:8000/api/docs/` | Interactive Swagger UI displaying endpoints and schemas |
| **Design System** | Open `http://localhost:5173` | Rich Ivory/Navy/Gold theme, 8 Indic language selector, legal status badges, dark mode toggle |
| **Safety Contract** | Click "Safety Contract" in Navbar or view `docs/AI_SAFETY_CONTRACT.md` | Clear display of 6 mandatory safety and non-advocate rules |
| **Test Suite** | Run `pytest` inside `backend/` | `2 passed in <1s` |
