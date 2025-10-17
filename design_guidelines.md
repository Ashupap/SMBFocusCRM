# CRM SaaS Application Design Guidelines

## Design Approach: Material Design System
**Rationale:** Data-rich enterprise applications benefit from Material's strong visual hierarchy, robust component library, and proven patterns for complex workflows. The elevated surfaces and shadow system create clear information architecture essential for dashboard-heavy applications.

## Core Design Elements

### A. Color Palette
**Light Mode:**
- Primary: 220 85% 55% (Professional blue for trust/tech)
- Primary Variant: 220 85% 45% (Darker for hover states)
- Surface: 0 0% 98% (Near-white backgrounds)
- Surface Variant: 220 15% 96% (Cards, elevated components)
- Text Primary: 220 20% 15%
- Text Secondary: 220 15% 45%

**Dark Mode:**
- Primary: 220 85% 60% (Brighter for contrast)
- Surface: 220 20% 12% (Deep blue-gray)
- Surface Variant: 220 18% 16% (Elevated cards)
- Text Primary: 0 0% 95%
- Text Secondary: 220 10% 70%

**Accent/Status:**
- Success: 142 76% 36%
- Warning: 38 92% 50%
- Error: 0 84% 60%
- Info: 199 89% 48%

### B. Typography
**Font Stack:** Inter (primary), system-ui (fallback)
- Display: 32px/700 (Dashboard headers)
- H1: 24px/600 (Section titles)
- H2: 20px/600 (Card headers)
- H3: 16px/600 (Subsections)
- Body: 14px/400 (Default text)
- Caption: 12px/400 (Metadata, labels)
- Mono: JetBrains Mono for data/code

### C. Layout System
**Spacing Units:** Tailwind primitives of 1, 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Container margins: mx-4 md:mx-8
- Max widths: max-w-7xl for dashboards, max-w-4xl for forms

### D. Component Library

**Navigation:**
- Persistent sidebar: 280px wide, collapsible to 72px (icon-only)
- Top bar: 64px height with search, notifications, user menu
- Breadcrumbs for deep navigation
- Tabs for section switching within views

**Dashboard Components:**
- Metric Cards: Elevated surfaces (shadow-md) with icon, value, trend indicator, sparkline
- Chart Containers: White/dark cards with headers, filters, export options
- Data Tables: Sticky headers, row hover states, inline actions, pagination
- Quick Stats Bar: Horizontal metrics strip below header

**Data Visualization:**
- Use Chart.js or Recharts with Material color palette
- Chart types: Line (trends), Bar (comparisons), Donut (composition), Area (cumulative)
- Consistent 16:9 or 4:3 aspect ratios

**Workflow Builder:**
- Node-based canvas (React Flow pattern)
- Drag-drop nodes with color-coded categories
- Connectors with animated flow indicators
- Properties panel (right sidebar 360px)

**Email Editor:**
- WYSIWYG toolbar (top-fixed)
- Live preview toggle
- Template library sidebar
- Drag-drop content blocks

**Forms & Inputs:**
- Outlined style with floating labels
- Helper text below inputs
- Inline validation with icon indicators
- Multi-step forms with progress stepper

**Overlays:**
- Modals: Centered, max-w-2xl, backdrop blur
- Slide-overs: Right-side panels for details (480px)
- Dropdown menus: Shadow-lg, rounded-lg
- Tooltips: Dark background, white text, arrow pointer

### E. Interaction Patterns

**No Heavy Animations:** Minimal, purposeful motion only
- Micro-interactions: 150ms ease-in-out for hovers
- Page transitions: Fade only (200ms)
- Loading states: Skeleton screens (no spinners unless necessary)

**Focus States:**
- 2px ring with primary color
- Visible keyboard navigation throughout

## Page-Specific Layouts

**Dashboard Home:**
- Top metrics bar (4 key KPIs in grid)
- 2-column layout: Main chart (60%) + Activity feed (40%)
- Recent items table below
- Quick actions floating button (bottom-right)

**Contacts/Leads List:**
- Filters sidebar (left, 240px, collapsible)
- Main table with sortable columns
- Bulk actions toolbar appears on selection
- Detail slide-over on row click

**Pipeline/Kanban View:**
- Horizontal columns with drag-drop cards
- Column headers with totals/values
- Card design: Compact with avatar, title, metadata, tags

**Analytics Dashboard:**
- Full-width charts grid (2-3 columns)
- Date range selector (top-right)
- Export/share button group
- Drill-down modal for detailed views

**Email Campaign Editor:**
- 3-panel layout: Templates (left) | Editor (center) | Preview (right)
- Top toolbar: Send, Schedule, Save buttons
- Recipient selector with segment builder

**Calendar Integration:**
- Week/month/agenda views
- Event cards with color-coded categories
- Sync status indicator
- Quick add button with time slot selection

## Images

**No Hero Image Required:** This is a utility application - login directly to dashboard.

**Dashboard Imagery:**
- Empty state illustrations: Use Undraw or similar for "No contacts yet" screens
- User avatars: Circular, 32px (lists) to 64px (profiles)
- Company logos: Square containers, max 40px
- Chart backgrounds: Subtle gradients (5% opacity) for visual interest

**Onboarding/Setup:**
- Setup wizard illustrations (isometric style) at 400x300px
- Feature announcement cards with 160x120px visuals

## Responsive Behavior
- Desktop: Full sidebar + main content
- Tablet (768px): Collapsible sidebar, stacked metrics
- Mobile (< 640px): Bottom navigation, hamburger menu, single column tables become cards

## Accessibility
- WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- Consistent dark mode across all inputs/fields
- Keyboard shortcuts documented
- Screen reader labels on all interactive elements