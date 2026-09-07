# Design Brief

## Direction
MediCare+ — a premium, calm healthcare SaaS dashboard: royal-blue primary with cyan accents on clean white surfaces, sidebar rail (bottom bar on mobile), card-based vitals and patient tables.

## Tone
Refined clinical calm — clean white surfaces with a confident royal-blue brand voice and cyan highlights; trustworthy, precise, and reassuring without feeling sterile.

## Differentiation
The "clinical pulse" signature: metric cards with live trend sparklines, mono-set vitals (JetBrains Mono), and cyan accent reserved strictly for active states and highlights so the royal-blue brand stays dominant.

## Color Palette
| Token      | OKLCH        | Role                                   |
| ---------- | ------------ | -------------------------------------- |
| background | 0.99 0.006 245 | app canvas, cool off-white           |
| foreground | 0.16 0.02 250 | primary text                          |
| card       | 1.0 0.004 245 | elevated surfaces                      |
| primary    | 0.45 0.16 256 | royal blue — brand, CTAs, active nav   |
| accent     | 0.68 0.13 198 | cyan — links, highlights, sparklines   |
| muted      | 0.95 0.012 245 | subtle fills, secondary surfaces       |
| success    | 0.58 0.16 150 | Completed status                       |
| warning    | 0.72 0.15 85  | Pending status                         |
| destructive| 0.55 0.22 25  | errors, destructive actions            |

## Typography
- Display: Space Grotesk — headings, page titles, hero numbers
- Body: DM Sans — UI, labels, paragraphs
- Mono: JetBrains Mono — vitals, timestamps, trend values
- Scale: hero `text-3xl md:text-4xl font-bold tracking-tight`, h2 `text-xl font-semibold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-sm md:text-base`

## Elevation & Depth
Card-based hierarchy: flat `bg-card` surfaces with a soft `shadow-card` and 1px `border-border`; interactive/active elements lift to `shadow-elevated`; no glow or neon effects.

## Structural Zones
| Zone    | Background  | Border   | Notes                                 |
| ------- | ----------- | -------- | ------------------------------------- |
| Sidebar | `bg-sidebar`| `border-r`| fixed left rail desktop, `bg-card` bottom bar mobile |
| Header  | `bg-card/80`| `border-b`| backdrop-blur sticky top bar, search + dark toggle |
| Content | `bg-background` | —    | metric card grid, then chart + table sections |
| Footer  | `bg-muted/40`| `border-t`| minimal, app info only                 |

## Spacing & Rhythm
Section gaps `gap-6 md:gap-8`; card padding `p-5 md:p-6`; grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` for metrics; consistent `gap-4` between related controls.

## Component Patterns
- Buttons: rounded-lg; primary `bg-gradient-primary` white text; secondary `bg-secondary`; destructive red; hover lift + shadow
- Cards: `rounded-xl bg-card shadow-card border-border`; hover `shadow-elevated transition-smooth`
- Badges: pill `rounded-full`; success green for Completed, warning amber for Pending
- Segmented control: `bg-muted` track, active segment `bg-card shadow-subtle` with cyan active text
- Tables: sticky header, right-aligned numeric vitals in mono, status pill column

## Motion
- Entrance: `animate-fade-in-up` staggered 50–100ms on cards/sections
- Hover: `transition-smooth` 0.3s cubic-bezier — cards lift, buttons brighten
- Decorative: `pulse-soft` on live-vitals dot; `shimmer` on skeleton loaders; sparklines animate draw-in

## Constraints
- Light mode is the default and primary experience; dark mode tuned independently (not inverted)
- Token-only styling — no raw hex or arbitrary Tailwind color classes in components
- AA+ contrast in both modes; primary-foreground on primary ≥ 0.45 L-diff
- No admin portal or email-notification surfaces in this build

## Signature Detail
Mono-set live vitals (heart rate, BP, glucose) on gradient-primary metric cards with animated cyan sparklines — the "clinical pulse" that makes patient data feel alive and trustworthy.
