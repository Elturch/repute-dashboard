

# Plan: Upgrade v4.0 to match Looker v2.0 detail level

## What I learned from the Looker dashboards

The v2.0 "Grupo Quirón reputation life panel" has this structure visible in the sidebar:

```text
├── Vista general Privados + Gestión...
├── P-1 Grupos Hospitalarios
├── Vistas singulares
├── NEWS          ← dedicated full page per channel
├── FACEBOOK      ← with charts, tables, individual mentions
├── INSTAGRAM     ← broken down by group within each channel
├── X (Twitter)   ← date range filtering
├── TikTok
├── LinkedIn
├── My Business
└── Base de informes
```

Each channel page has: per-group breakdown, time series charts, individual mention tables with titulares/URLs, and date range filtering.

## What's missing in v4.0

1. **No dedicated per-channel pages** — Canales.tsx only shows summary badges, not the full detail the v2.0 has per platform
2. **No date range filtering** — v2.0 has date range selector on every page
3. **No individual mention listings** — no titulares, URLs, or drill-down to individual items
4. **Benchmarking still uses invented metrics** (fortaleza, riesgo, potencia) — these composite indices were supposed to be removed
5. **Explorador is a placeholder** — empty page
6. **No "Vistas singulares"** concept — per-hospital/entity views

## Changes

### 1. Create 7 dedicated channel pages (NEW)

Create `src/pages/dashboard/canales/` directory with:
- `NoticiasChannel.tsx` — Full noticias analysis: per-group table, top medios, time series chart, individual mention listing with titulares/URLs
- `FacebookChannel.tsx` — FB analysis per group, mention listing with captions
- `InstagramChannel.tsx` — IG analysis per group
- `TikTokChannel.tsx` — TikTok analysis per group
- `TwitterChannel.tsx` — X/Twitter analysis per group
- `LinkedInChannel.tsx` — LinkedIn analysis per group
- `MyBusinessChannel.tsx` — My Business with ratings

Each page will:
- Fetch data from ALL group views for that channel (e.g. NoticiasChannel fetches from `noticias_quironsalud`, `noticias_sermas`, `noticias_gh_privados`, etc.)
- Show KPI summary cards (total mentions, avg nota, % peligro alto)
- Show per-group comparison table with 9 real metrics
- Show time series chart (mentions over time)
- Show scrollable table of individual mentions (titular, medio, fecha, nota, peligro, URL link)
- Include date range filter (date picker component)

### 2. Add global date range filter component (NEW)

Create `src/components/DateRangeFilter.tsx` — reusable date range picker that can be placed on any page. Uses React state + context to filter data client-side.

### 3. Fix Benchmarking — remove invented metrics

Update `src/hooks/useBenchmarkData.ts` and `src/pages/dashboard/core/Benchmarking.tsx`:
- Remove `fortaleza`, `riesgo`, `potencia` composite fields
- Replace with the 9 real emotional metrics
- Radar chart shows all 9 metrics + nota
- Bar charts show individual real metrics, not composites
- Ranking based on `nota_media` (primary) and individual emotional metrics

### 4. Update Canales.tsx as channel index

Transform current `Canales.tsx` into a channel index/overview that links to each dedicated channel page. Each channel card becomes a navigation link showing summary KPIs.

### 5. Update routing and sidebar

- Add routes for `/dashboard/canales/noticias`, `/dashboard/canales/facebook`, etc.
- Update `AppSidebar.tsx` to show channel sub-items under "Canales" (collapsible, like Ayuso)

### 6. Build Explorador with real search

Replace the placeholder `Explorador.tsx` with:
- Text search across all views (filter by titular/text)
- Dropdown filters: grupo, canal, nivel de riesgo, date range
- Results table with clickable URLs

## Files to create/modify

| File | Action |
|------|--------|
| `src/pages/dashboard/canales/NoticiasChannel.tsx` | CREATE |
| `src/pages/dashboard/canales/FacebookChannel.tsx` | CREATE |
| `src/pages/dashboard/canales/InstagramChannel.tsx` | CREATE |
| `src/pages/dashboard/canales/TikTokChannel.tsx` | CREATE |
| `src/pages/dashboard/canales/TwitterChannel.tsx` | CREATE |
| `src/pages/dashboard/canales/LinkedInChannel.tsx` | CREATE |
| `src/pages/dashboard/canales/MyBusinessChannel.tsx` | CREATE |
| `src/components/DateRangeFilter.tsx` | CREATE |
| `src/components/ChannelPage.tsx` | CREATE (shared layout for all channel pages) |
| `src/hooks/useChannelData.ts` | CREATE (hook to fetch all groups for a specific channel) |
| `src/pages/dashboard/core/Canales.tsx` | REWRITE (index with links) |
| `src/pages/dashboard/core/Benchmarking.tsx` | REWRITE (remove invented metrics) |
| `src/hooks/useBenchmarkData.ts` | REWRITE (remove composites) |
| `src/pages/dashboard/core/Explorador.tsx` | REWRITE (real search) |
| `src/App.tsx` | ADD 7 new routes |
| `src/components/AppSidebar.tsx` | ADD channel sub-nav |

## Technical details

- `ChannelPage.tsx` is a shared component that takes a channel key and renders the full detail view. Each channel page file is a thin wrapper passing the right config.
- `useChannelData(channelKey)` hook fetches from all group views for that channel type, using the existing `GROUP_VIEWS` config from `useGroupChannels.ts`.
- Date filtering is client-side: the hook fetches all data, the `DateRangeFilter` filters the normalized rows by date field before aggregation.
- Individual mention table shows: fecha, titular (truncated), medio/plataforma, nota, peligro (badge), URL (external link icon).

