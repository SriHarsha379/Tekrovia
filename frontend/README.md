# TekRovia Frontend (Next.js)

## Setup

```bash
npm install
cp .env.local.example .env.local   # points at your local FastAPI backend
npm run dev
```

Open http://localhost:3000. Make sure the FastAPI backend (`backend/`) is
running on http://localhost:8000 first — the hero section's lead capture
form posts to it live via `POST /leads`.

## Project layout

```
src/
  app/
    layout.tsx      # fonts, metadata
    page.tsx         # landing page composition
    globals.css       # Tailwind layers + base styles
  components/
    ui/               # design-system primitives (Button, Card, Input, Container, SectionHeading)
    LeadCaptureForm.tsx
    PricingTable.tsx
    JourneySection.tsx
  lib/
    api.ts            # typed fetch client for the FastAPI backend
```

## Design tokens

Defined in `tailwind.config.ts`:

| Token | Hex | Use |
|---|---|---|
| `ink` | `#14213D` | Primary text, dark hero background |
| `paper` | `#F4F2EC` | Default page background |
| `gold` | `#E2A63B` | Primary CTA, "readiness gate" accent |
| `teal` | `#2E7D6B` | Secondary accent, success/placement states |
| `line` | `#D8D3C4` | Borders, dividers |

Fonts: **Fraunces** (display/headline) + **Inter** (body/UI), loaded via
`next/font/google` in `app/layout.tsx`.

## Ownership

Per the roadmap's division of work — this whole frontend is fresher territory
once the design system above is established. `src/components/ui/` should not
grow ad hoc; new primitives go through the lead dev first so the system stays
consistent as more screens get built (registration form, student portal, etc.).
