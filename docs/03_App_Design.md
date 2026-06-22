# SMRITI — App Design Specification

**Document Type:** UI/UX Design System & Layout Guide  
**Project:** SMRITI — Smart Maintenance & Retrieval Intelligence  
**Version:** 1.0  
**Date:** June 2026

---

## 1. Design Philosophy

SMRITI lives on a factory floor and in a boardroom. The design must hold both truths:

- A field technician needs it to be glanceable and fast, operable with one hand in low light
- A plant manager needs it to be authoritative and boardroom-presentable

The visual language is **industrial precision meets digital intelligence** — dark-mode first, data-dense but calm, with purposeful animation that communicates system state rather than decorating it.

**Signature element:** The Knowledge Debt Score ring — a circular progress arc that shifts color from green → amber → red. It appears on every asset card, every panel header, every 3D node tooltip. It is the heartbeat of the product.

---

## 2. Color System

### Base Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#0D0F14` | Main app background |
| `--bg-surface` | `#13161E` | Cards, panels, drawers |
| `--bg-elevated` | `#1A1E28` | Modals, hover states |
| `--bg-stroke` | `#252A38` | Borders, dividers |
| `--text-primary` | `#E8EAF0` | Main body text |
| `--text-secondary` | `#8A90A0` | Labels, metadata, hints |
| `--text-muted` | `#4A5060` | Disabled, placeholders |

### Brand Accent

| Token | Hex | Usage |
|---|---|---|
| `--accent-teal` | `#00C9A7` | Primary CTA, active state, logo mark |
| `--accent-teal-dim` | `#00C9A720` | Subtle fills, hover backgrounds |
| `--accent-teal-glow` | `#00C9A740` | Focus rings, animated pulse |

### Semantic — Knowledge Debt

| Severity | Token | Hex | Usage |
|---|---|---|---|
| OK | `--debt-ok` | `#22C55E` | Score 0–40 |
| WARNING | `--debt-warn` | `#F59E0B` | Score 41–70 |
| CRITICAL | `--debt-crit` | `#EF4444` | Score 71–100 |
| CRITICAL glow | `--debt-crit-glow` | `#EF444430` | Pulsing card border |

### Data Visualization

| Token | Hex | Usage |
|---|---|---|
| `--chart-1` | `#00C9A7` | Primary series |
| `--chart-2` | `#6366F1` | Secondary series |
| `--chart-3` | `#F59E0B` | Tertiary series |
| `--chart-grid` | `#252A38` | Grid lines |

---

## 3. Typography

### Type Scale

| Role | Font | Size | Weight | Line Height |
|---|---|---|---|---|
| Display | Inter | 48px | 700 | 1.1 |
| H1 | Inter | 32px | 600 | 1.2 |
| H2 | Inter | 24px | 600 | 1.3 |
| H3 | Inter | 18px | 500 | 1.4 |
| Body | Inter | 15px | 400 | 1.6 |
| Caption | Inter | 12px | 400 | 1.5 |
| Mono (IDs, scores) | JetBrains Mono | 13px | 500 | 1.4 |
| Badge | Inter | 11px | 600 | 1.0 |

### Typography Rules

- Equipment IDs (UPS-01, T-101) always render in `JetBrains Mono` — distinguishes them from prose at a glance
- Knowledge Debt Score numbers render in `JetBrains Mono 700` — 36px on dashboard cards
- All UI labels are sentence case, never all-caps (except badge labels: `CRITICAL`, `OK`, `WARNING`)
- Maximum line length: 64 characters for body text panels

### Font Loading

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
```

---

## 4. Spacing & Grid

### Base Unit

`4px` base unit. All spacing is multiples of 4.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Tight inline spacing |
| `--space-2` | 8px | Icon-to-label gap |
| `--space-3` | 12px | Input padding vertical |
| `--space-4` | 16px | Card internal padding |
| `--space-6` | 24px | Section gap |
| `--space-8` | 32px | Major section padding |
| `--space-12` | 48px | Page section spacing |

### Layout Grid

| Breakpoint | Name | Columns | Gutter | Margin |
|---|---|---|---|---|
| 390px | Mobile | 4 | 12px | 16px |
| 768px | Tablet | 8 | 16px | 24px |
| 1280px | Laptop | 12 | 20px | 32px |
| 1920px | Desktop | 12 | 24px | 48px |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Badges, tags |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Modals, panels |
| `--radius-full` | 9999px | Pills, avatars |

---

## 5. Component Library

### 5.1 Asset Card

The primary building block of the dashboard. Displays one equipment tag.

```
┌────────────────────────────────────────┐
│  ●  UPS-01              [CRITICAL]     │
│     Uninterruptible Power Supply       │
│                                        │
│  Knowledge Debt                   87   │
│  ████████████████████░░░░░░  87/100    │
│                                        │
│  127 items  ·  1 expert  ·  2h ago     │
│                                        │
│  [View Thread]        [Interview Expert]│
└────────────────────────────────────────┘
```

**States:**
- Default: subtle border `--bg-stroke`
- WARNING: amber left-border accent (3px)
- CRITICAL: red pulsing border with `--debt-crit-glow` background tint
- Hover: `--bg-elevated` fill, slight `translateY(-2px)` lift
- Loading (ingestion): skeleton shimmer animation

**Props:**
- `assetId`: string
- `assetType`: string
- `debtScore`: number (0–100)
- `severity`: "OK" | "WARNING" | "CRITICAL"
- `itemCount`: number
- `expertCount`: number
- `lastUpdated`: ISO timestamp

### 5.2 Debt Score Ring

Used inline in asset cards and as the hero element in detail panels.

```
      ┌─────┐
     / 87   \
    │  CRIT  │
     \      /
      └─────┘
```

- SVG arc: `stroke-dasharray` driven by score (0–100 maps to 0–251.2 circumference)
- Color: interpolated between `--debt-ok` → `--debt-warn` → `--debt-crit` based on score
- Animation: arc fills from 0 on mount (600ms ease-out)
- CRITICAL scores pulse: `opacity 1.5s ease-in-out infinite`

### 5.3 Thread Item

Used in the asset detail drawer to show each knowledge item.

```
┌────────────────────────────────────────────────┐
│  📄  Railtel_CDC_Level2_March.docx  · p.14     │
│      2026-03-12  ·  Maintenance Log            │
│                                                │
│  UPS-01 underwent scheduled bypass maintenance │
│  on 2026-03-12. Input voltage dropped to 380V  │
│  during the transition window...               │
│                                                │
│  [View Source]                                 │
└────────────────────────────────────────────────┘
```

### 5.4 Voice Query Bar

Persistent at the top of the query screen. Always visible.

```
┌──────────────────────────────────────────┬───┐
│  Ask anything about any asset...         │ 🎤 │
└──────────────────────────────────────────┴───┘
```

- Mic button: teal when idle, red pulsing ring when recording
- On recording: waveform animation replaces placeholder text
- Transcription appears in field in real time as speech is recognized
- Submit on silence (1.5s) or Enter key

### 5.5 Knowledge Debt Dashboard Table

Used in the boardroom view.

```
Asset       Type        Score   Severity   Experts   Last Updated
──────────────────────────────────────────────────────────────────
T-101       Transformer  87     CRITICAL    1 ⚠️      3 months ago
Pump P-207  Pump         64     WARNING     1         2 weeks ago
UPS-01      UPS          23     OK          3         2 hours ago
```

- Sortable by all columns
- Row click → opens asset detail panel
- Severity badge: pill shape, colored background, mono uppercase text
- `⚠️` expert count warning when expertCount === 1

### 5.6 Guru Mode Interview Panel

Full-screen overlay when Guru Mode session is active.

```
┌─────────────────────────────────────────────────────┐
│  Guru Mode  ·  T-101 (Transformer)                  │
│  Expert: Ramesh Kumar                               │
│  Knowledge Debt: 87 → 74 (updating...)              │
│──────────────────────────────────────────────────── │
│  SMRITI:  What is the typical vibration pattern     │
│           you notice in T-101 before a fault?       │
│                                                     │
│  Expert:  ___________________________________       │
│           ___________________________________       │
│           [Submit Answer]                           │
│                                                     │
│  Progress: ████████░░  4 of 8 questions             │
└─────────────────────────────────────────────────────┘
```

- Debt score arc animates down in real time as answers are submitted
- Each submitted answer gets embedded immediately (visible in "items added" counter)
- Session can be paused and resumed

### 5.7 Navigation

**Desktop sidebar (280px wide):**
```
┌──────────────────┐
│  ◈ SMRITI        │
│──────────────────│
│  Dashboard       │
│  Query           │
│  Graph (3D)      │
│  Guru Mode       │
│──────────────────│
│  Upload Docs     │
│──────────────────│
│  Settings        │
└──────────────────┘
```

**Mobile bottom nav (4 items):**
```
┌───────────────────────────────┐
│  ⊟ Home  🔍 Query  ◉ Graph  🧠 Guru  │
└───────────────────────────────┘
```

---

## 6. Screen Layouts

### 6.1 Dashboard — Desktop (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (280px)          │  MAIN CONTENT (fluid)                     │
│                          │                                           │
│  ◈ SMRITI               │  Knowledge Debt Overview                  │
│                          │  ┌──────┐ ┌──────┐ ┌──────┐             │
│  Dashboard    ←          │  │CRIT  │ │WARN  │ │  OK  │             │
│  Query                   │  │  2   │ │  3   │ │  8   │             │
│  Graph                   │  └──────┘ └──────┘ └──────┘             │
│  Guru Mode               │                                           │
│                          │  Asset Cards Grid (3 col)                 │
│  Upload Docs             │  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│                          │  │  T-101   │ │  P-207   │ │  UPS-01  │ │
│                          │  │  CRIT 87 │ │  WARN 64 │ │  OK  23  │ │
│                          │  └──────────┘ └──────────┘ └──────────┘ │
│                          │  ... more cards                           │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Dashboard — Mobile (390px)

```
┌─────────────────────┐
│  ◈ SMRITI      ☰   │
├─────────────────────┤
│  Knowledge Debt     │
│  2 CRITICAL · 3 WARN│
├─────────────────────┤
│  ┌──────────────┐   │
│  │  T-101 CRIT  │   │
│  │  Score: 87   │   │
│  └──────────────┘   │
│  ┌──────────────┐   │
│  │  P-207 WARN  │   │
│  │  Score: 64   │   │
│  └──────────────┘   │
│  ┌──────────────┐   │
│  │ UPS-01  OK   │   │
│  │  Score: 23   │   │
│  └──────────────┘   │
├─────────────────────┤
│  🏠   🔍   ◉   🧠   │
└─────────────────────┘
```

### 6.3 Query Screen — Desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ SIDEBAR            │  QUERY SCREEN                                    │
│                    │                                                  │
│                    │  ┌──────────────────────────────────┬───┐       │
│                    │  │  Ask anything about any asset...  │ 🎤│       │
│                    │  └──────────────────────────────────┴───┘       │
│                    │                                                  │
│                    │  Recent: "UPS-01 mein last month..."             │
│                    │                                                  │
│                    │  ─────────────────────────────────────          │
│                    │  RESULT (UPS-01 Thread — 3 items)               │
│                    │                                                  │
│                    │  ① 2026-03-12 — Bypass maintenance              │
│                    │     Source: Level2_March.docx p.14              │
│                    │                                                  │
│                    │  ② 2026-02-28 — Battery health check            │
│                    │     Source: Maintenance_Log_Feb.pdf p.6         │
│                    │                                                  │
│                    │  ③ 2026-01-15 — Input voltage dip               │
│                    │     Source: Incident_Report_Jan.docx p.2        │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.4 3D Graph Screen

```
┌──────────────────────────────────────────────────────────────────────┐
│ SIDEBAR            │  3D KNOWLEDGE GRAPH                              │
│                    │                                                  │
│                    │                 ●  (green, large)                │
│                    │           UPS-01                                 │
│                    │                                                  │
│                    │     ●  (red, pulsing)                            │
│                    │  T-101                   ●  (amber)              │
│                    │                       P-207                     │
│                    │                                                  │
│                    │                  ●  ●  ●  (green, small)         │
│                    │              other assets                        │
│                    │                                                  │
│                    │  [Filter: ALL ▼]  [Legend]  [Reset View]        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Animation Specifications

### Motion Principles

- **Purposeful only:** Every animation communicates system state — never decorative
- **Fast and snappy:** Default duration 200–300ms. Data-driven: 600ms for score arcs (communicates "calculating")
- **Reduced motion:** All animations wrapped in `@media (prefers-reduced-motion: reduce)` — static fallback required

### Specific Animations

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Asset card mount | `fadeInUp` (12px Y) | 200ms | ease-out |
| Debt score arc fill | `stroke-dashoffset` 0→value | 600ms | ease-out |
| CRITICAL card border | opacity 1→0.4→1 (pulse) | 1500ms | ease-in-out, infinite |
| Mic button recording | scale 1→1.15→1 (pulse) + red fill | 800ms | ease-in-out, infinite |
| 3D graph node hover | scale 1→1.2 | 150ms | ease-out |
| Thread item mount | `fadeIn` (staggered, 40ms per item) | 200ms | ease-out |
| Score update (Guru) | counter animates old→new value | 800ms | ease-in-out |
| Ingestion progress bar | width 0→100% | real-time | linear |

### Framer Motion Patterns

```tsx
// Card mount
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.2, ease: "easeOut" }
  })
}

// Debt score arc (SVG)
const circumference = 2 * Math.PI * 40; // r=40
const dashOffset = circumference - (score / 100) * circumference;
// Animate: initial dashOffset = circumference (empty), final = dashOffset

// CRITICAL pulse
const criticalPulse = {
  boxShadow: [
    "0 0 0 0 rgba(239,68,68,0)",
    "0 0 0 8px rgba(239,68,68,0.3)",
    "0 0 0 0 rgba(239,68,68,0)"
  ],
  transition: { duration: 1.5, repeat: Infinity }
}
```

---

## 8. Iconography

Use **Lucide React** for all UI icons. No icon fonts. No custom SVG icons except for the SMRITI logo mark.

| Context | Icon | Lucide Name |
|---|---|---|
| Asset thread | `FileText` | `file-text` |
| Voice query | `Mic` / `MicOff` | `mic`, `mic-off` |
| Guru Mode | `Brain` | `brain` |
| Upload | `Upload` | `upload` |
| Warning | `AlertTriangle` | `alert-triangle` |
| Critical | `AlertOctagon` | `alert-octagon` |
| OK | `CheckCircle` | `check-circle` |
| Expert | `User` | `user` |
| Knowledge graph | `Network` | `network` |
| Source citation | `ExternalLink` | `external-link` |

---

## 9. Responsive Behavior

### Breakpoint Behavior

**Mobile (< 768px):**
- Sidebar collapses to bottom tab bar (4 tabs)
- Asset cards stack single column, full width
- 3D graph pinch-zoom and pan via touch events
- Guru Mode: full-screen overlay

**Tablet (768px – 1279px):**
- Sidebar collapses to icon-only rail (64px wide)
- Asset cards: 2-column grid
- Query panel slides in from right as a drawer

**Desktop (≥ 1280px):**
- Full sidebar (280px) always visible
- Asset cards: 3-column grid
- Thread detail panel slides in from right (400px) without collapsing main content

### Touch Targets

All interactive elements: minimum 44×44px touch target on mobile (per WCAG 2.1 AA).

---

## 10. Accessibility

- Color is never the only indicator of state — every severity level also uses an icon and a text label
- All interactive elements have visible focus rings (2px `--accent-teal` outline, 2px offset)
- Debt Score ring includes `aria-label="Knowledge Debt Score: 87 out of 100, CRITICAL"`
- Voice query button: `aria-label` updates to "Recording in progress" when active
- Screen reader announces score changes when Guru Mode updates a score
- Keyboard navigable throughout (Tab, Enter, Escape, Arrow keys in graph)

---

*Document version 1.0 — SMRITI App Design Specification — ET AI Hackathon 2026*
