# SFG Tool Box

SFG (Sum Frequency Generation) spectroscopy data processing and analysis toolbox. A one-stop web application covering raw spectral data normalization, SFG parameter calculation (Fresnel factors, second-order nonlinear susceptibility χ², focusing parameters), and spectral database management with visualization.

---

## Features

| Module | Route | Description |
|--------|-------|-------------|
| **Data Processing** | `/data-processing` | Batch SFG spectral data processing: normalization, spike removal, wavenumber conversion |
| **SFG Calculator** | `/calculator` | Three sub-tabs: Quartz calculation, Focus calculation, Fresnel calculation + IR wavenumber scan |
| **Database** | `/database` | SFG spectral database: upload/edit/delete, three visualization views (Intensity Ranking / Database View / Spectrum View) |

### Data Processing

- Upload four CSV files (sample signal, sample background, quartz signal, quartz background)
- Optional spike removal (sliding window + MAD algorithm)
- Output normalized SFG intensity and wavenumber, generate CSV and PNG charts
- Charts rendered with Recharts, supporting configurable colors and titles

### SFG Calculator

| Sub-tab | Input | Output |
|---------|-------|--------|
| **Quartz Calculation** | Vis/IR incident angle, visible wavelength, IR wavenumber | SFG wavelength/angle, quartz refractive indices, coherence length, Fresnel factors (Lxx/Lyy), χ² (SSP/SPS/PSS/PPP) and \|χ²\|² |
| **Focus Calculation** | Wavelength, beam diameter, lens focal length, defocus distance, spectrometer focal length | Focal spot diameter (μm), focal depth (mm), defocused spot size, SFG spot size, slit focal size |
| **Fresnel Calculation** | SFG/Vis/IR refractive indices, angles, wavelength, wavenumber | Full Fresnel Lxx/Lyy/Lzz + 7 achiral combinations + 6 chiral combinations |

- Quartz calculation supports **IR wavenumber scanning**: set a range to plot Fresnel factor / χ² curves vs wavenumber
- All formulas derived from published Sellmeier equations and SFG theory by Shen et al.

### Database

| View | Description |
|------|-------------|
| **Intensity Ranking** | Horizontal bar chart, ranked by normalized intensity or effective χ² (descending), with intensity range filtering |
| **Database View** | Card list + fuzzy search (name/formula/functional group) + click to view/edit details |
| **Spectrum View** | Wavenumber vs intensity vertical line chart, customizable X/Y axis range, hover to display record name and peak info |

- **Record fields**: Name, Formula, Normalized Intensity, Effective χ², Peak Position, Peak Width, Vibrational Mode, Functional Group, Visible/IR Incident Angle, Laser Energy, Instrument, Reference, Uploader, Spectrum Image
- Supports single-record upload (Modal form + image file) and TXT batch import
- Click any entry in any view to open a detail popup, with edit and save support (PATCH API)
- Full data export as TXT dictionary format for easy backup and sharing

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + React Router + Recharts |
| Backend | Python 3.10+ + FastAPI + Uvicorn |
| Scientific Computing | NumPy + SciPy |
| Database | SQLite (local file storage) |
| Image Storage | File system (`backend/uploads/`) |

---

## Quick Start

### Requirements

- **Python** 3.10+ (Anaconda environment `D:\Anaconda\envs\py310` recommended)
- **Node.js** 18+
- Windows / Linux / macOS

### Windows Local Run

```batch
# Double-click run.bat in the project root
run.bat
```

`run.bat` automatically checks the environment (Python/Node.js), installs dependencies, and starts the backend (FastAPI, port 8000) and frontend (Vite Dev Server, port 5173).

After startup, visit:
- Frontend dev: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

### Linux / macOS Local Run

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Production Mode

In production, FastAPI serves the built frontend assets directly — only one Python process is needed:

```bash
cd frontend && npm run build && cd ..
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000 to use the full application.

---

## Project Structure

```
SFG Tool Box/
├── backend/
│   ├── main.py                    # FastAPI entry point, lifespan DB initialization
│   ├── requirements.txt           # Python dependencies
│   ├── routers/
│   │   ├── health.py              # /api/health
│   │   ├── data_processing.py     # /api/data-processing/process
│   │   ├── calculator.py          # /api/calculator/quartz|focus|fresnel
│   │   └── database.py            # /api/database/records|export|import|images
│   ├── services/
│   │   ├── spike_remove.py        # Spike removal algorithm (sliding window + MAD)
│   │   ├── sfg_calculator.py      # SFG optical calculation engine (Sellmeier/Fresnel/χ²)
│   │   └── database.py            # SQLite CRUD + image file management
│   ├── sfg_database.db            # SQLite database (auto-created)
│   └── uploads/                   # Spectrum image storage directory
├── frontend/
│   ├── src/
│   │   ├── components/            # Navbar, Footer
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # Home page (feature entry cards)
│   │   │   ├── DataProcessingPage.tsx  # Data processing page
│   │   │   ├── CalculatorPage.tsx      # SFG calculator (three sub-tabs)
│   │   │   └── DatabasePage.tsx        # SFG database (three sub-tabs + Modal)
│   │   ├── App.tsx                # React Router configuration
│   │   └── index.css              # CSS variables and global styles
│   ├── package.json
│   └── vite.config.ts             # Vite config (with API proxy)
├── run.bat                        # Windows one-click startup script
├── deploy.sh                      # Linux server one-click deploy script
├── sfg-toolbox.service            # Systemd service template
└── .gitignore
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/data-processing/process` | SFG data processing (CSV upload, normalization, spike removal) |
| POST | `/api/calculator/quartz` | Quartz calculation (single-point and wavenumber scan) |
| POST | `/api/calculator/focus` | Focus parameter calculation |
| POST | `/api/calculator/fresnel` | Full Fresnel factor calculation |
| GET | `/api/database/records` | Get all database records |
| POST | `/api/database/records` | Create new record (multipart, JSON + image) |
| PATCH | `/api/database/records/{id}` | Update a record |
| DELETE | `/api/database/records/{id}` | Delete a record |
| GET | `/api/database/images/{filename}` | Get spectrum image |
| GET | `/api/database/export` | Export all records as TXT |
| POST | `/api/database/import` | Batch import records from TXT |

---

## Database Import/Export

### Export Format

Click the "Export Data" button to download `sfg_backup.txt`, one record per line in dictionary format:

```
{Name:DMSO, Formula:C2H6OS, Normalized Intensity:0.5000, Effective χ²:1.2300e-04, Peak Position:2900, Peak Width:50, Vibrational Mode:CH3 stretch, Functional Group:methyl, Visible Incident Angle:45, IR Incident Angle:55, Laser Energy:10μJ, Instrument:SFG setup, Reference:Ref 1, Uploader:Zhang}
```

### Import Format

Prepare a TXT file in the same format, click "Import Data" to select the file for batch import. Empty lines and lines starting with `#` are ignored. Images need to be uploaded separately through the edit popup.

---

## Cloud Deployment

Recommended: Tencent Cloud Lighthouse server (2 vCPU, 2 GB RAM, ~$8-12/month). After purchase:

1. Open ports `22`, `80`, `443`, `8000` in the security group
2. Upload code: `scp -r ./* root@IP:/opt/sfg-toolbox/`
3. One-click deploy: `cd /opt/sfg-toolbox && chmod +x deploy.sh && sudo ./deploy.sh`

After deployment, visit `http://<server-IP>:8000`. The service starts on boot and auto-restarts on crash.

See `deploy.sh` script comments and `sfg-toolbox.service` configuration in the project for detailed steps.

---

## Development

```bash
# Frontend dev (with HMR)
cd frontend && npm run dev

# Backend dev (with auto-reload)
cd backend && python -m uvicorn main:app --reload --port 8000

# Build frontend
cd frontend && npm run build

# TypeScript type check
cd frontend && tsc -b
```

---

## Specification Documents

Detailed specification documents for all feature modules are located in the `.trae/specs/` directory:

| Directory | Content |
|-----------|---------|
| `sfg-toolbox-setup/` | Project initialization, routing, navbar |
| `sfg-data-processing/` | Data processing page feature design |
| `sfg-calculator/` | SFG calculator three tabs + wavenumber scan |
| `sfg-database/` | SQLite database, three views, upload modal |
| `sfg-database-edit/` | Record detail popup, edit/save, import/export |
