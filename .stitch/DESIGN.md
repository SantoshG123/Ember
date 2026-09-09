---
name: EMBER Studio Monochrome
colors:
  background: '#F5F5F7'
  surface: '#FFFFFF'
  surface-muted: '#EEEEF0'
  surface-dark: '#000000'
  surface-dark-raised: '#1D1D1F'
  graphite: '#1D1D1F'
  text-inverse: '#F5F5F7'
  muted: '#86868B'
  divider: '#D2D2D7'
  ember-red: '#FF3B30'
  ember-red-pressed: '#D92D20'
  success: '#168653'
  warning: '#9A6700'
  error: '#A61B16'
typography:
  display-xl:
    fontFamily: Poppins
    fontSize: 120px
    fontWeight: '600'
    lineHeight: 90%
    letterSpacing: -0.05em
  display-lg:
    fontFamily: Poppins
    fontSize: 76px
    fontWeight: '600'
    lineHeight: 96%
    letterSpacing: -0.04em
  display-mobile:
    fontFamily: Poppins
    fontSize: 46px
    fontWeight: '600'
    lineHeight: 100%
    letterSpacing: -0.035em
  headline-md:
    fontFamily: Poppins
    fontSize: 52px
    fontWeight: '600'
    lineHeight: 102%
    letterSpacing: -0.035em
  stat:
    fontFamily: Poppins
    fontSize: 68px
    fontWeight: '500'
    lineHeight: 92%
    letterSpacing: -0.045em
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 155%
  body-md:
    fontFamily: Manrope
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 150%
  label:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 140%
    letterSpacing: 0.08em
rounded:
  control: 6px
  card: 12px
  media: 16px
  badge: 9999px
spacing:
  base: 8px
  gutter-desktop: 40px
  margin-desktop: 64px
  section-desktop: 160px
  section-mobile: 88px
---

# Design System: EMBER — Studio Monochrome

**Project ID:** 15548818311726621064  
**Brand:** EMBER  
**Slogan:** *Where demand sparks opportunity.*  
**Reference direction:** premium cinematic technology storytelling translated into an original reverse-marketplace product language.

## 1. Visual Theme & Atmosphere

EMBER should feel like a live signal from the local economy: precise, ambitious, cinematic, and immediately legible. The interface combines pure-black product-theater chapters with crisp white and cool silver-gray operational surfaces. Oversized geometric headlines, isolated focal visuals, compact navigation, sharp technical annotations, and generous negative space turn customer requests into opportunities worth noticing.

The visual system borrows structural ideas from premium launch pages—full-bleed chapters, dramatic light-to-dark transitions, pinned storytelling, and modular specification blocks—without copying another brand's identity, wording, product imagery, or exact composition. The marketplace's only expressive accent is a controlled Ember Red: a small, unmistakable pulse used for live demand, selected clusters, bid activity, and high-intent marketplace moments.

This replaces both the former warm editorial palette and the later multi-color demand treatment. Remove serif display typography, parchment tones, orange gradients, ornamental styling, and magazine-like card treatments. Preserve the marketplace's information architecture, genuine local-service imagery, demand semantics, and approachable tone.

Avoid generic SaaS dashboards, repetitive bento grids, heavy shadows, glassmorphism, decorative gradients, neon-on-black cyberpunk styling, glossy 3D icons, excessive pills, and dense boxed layouts. The atmosphere is high contrast and polished, but never cold or cryptic.

## 2. Color Palette & Roles

### Primary Foundation

- **Absolute Black (#000000):** Cinematic hero chapters, sticky navigation, dark seller-workspace regions, overlays, and premium high-attention surfaces.
- **Graphite (#1D1D1F):** Primary text on light backgrounds, raised surfaces on black, icons, dividers in dark mode, and dense controls.
- **Studio White (#FFFFFF):** Cards, forms, sheets, media captions, and inverse controls.
- **Cloud White (#F5F5F7):** Default light canvas. The cool tint separates page structure from white cards without creating a visible color cast.
- **Instrument Gray (#EEEEF0):** Alternating light sections, map chrome, skeletons, grouped controls, and comparison rows.
- **Precision Divider (#D2D2D7):** Hairline rules, field borders, table separators, and inactive structure.

### Accent & Interactive

- **Ember Red (#FF3B30):** The single brand accent. Use for live demand, selected clusters, active progress, notification dots, and rare marketplace opportunity actions. It works best against black or Graphite and should stay under 10% of a screen.
- **Deep Ember (#D92D20):** Pressed and selected accent state. Do not expand this into a decorative red palette.

Primary calls to action normally use a black-on-white or white-on-black inversion. Ember Red is reserved for moments whose meaning is genuinely tied to live demand or marketplace activity. Never use red for large page backgrounds, long text, decorative gradients, or several competing buttons.

### Typography

- **Graphite (#1D1D1F):** Primary text on light surfaces.
- **Inverse White (#F5F5F7):** Primary text on dark surfaces.
- **Muted Gray (#86868B):** Secondary text, metadata, inactive navigation, timestamps, and helper copy.
- On dark surfaces, secondary text may use **rgba(245, 245, 247, 0.62)** and dividers **rgba(245, 245, 247, 0.16)**.

### Functional States

- **Demand Signal (#FF3B30):** All demand levels share one hue. Encode intensity with bubble size, opacity, outline thickness, count, and a text label rather than a rainbow scale.
- **Success Green (#168653):** Fulfilled requests, accepted bids, and positive confirmations only. It is semantic feedback, never decorative brand color.
- **Warning Gold (#9A6700):** Expiring bids and attention-needed states only, normally paired with a pale neutral background.
- **Error Crimson (#A61B16):** Validation failure and destructive actions only, always paired with an explicit error label or icon.

The default state of the product is monochrome. Functional green, gold, and crimson appear only when their meaning is required, and every state is paired with a label, icon, count, pattern, or size difference. Color never carries meaning alone.

## 3. Typography Rules

### Hierarchy & Weights

**Poppins** is the display and high-impact interface face. Use it for hero statements, chapter headlines, large opportunity counts, prices, metrics, and short action labels. Headlines should use weight 600, tight tracking, compact line height, and deliberate two- or three-line breaks. Large display type may reach 120px on wide desktop but should use fluid sizing and never collide with imagery or navigation.

**Manrope** remains the reading and utility face. Use it for descriptions, navigation, metadata, forms, filters, tables, messages, and dashboard content. Favor weights 400–600; use 700 only for compact emphasis. Body copy should remain calm and highly readable against the more dramatic display scale.

Use sentence case for headings and controls. Reserve uppercase with 0.08em tracking for short technical eyebrows such as “LIVE DEMAND,” “12 REQUESTS,” “WITHIN 3 MI,” or “BID WINDOW.” Do not use uppercase for paragraphs or multi-line buttons.

Large numerals are a core motif. Aggregate request counts, average budget, response time, and seller activity may be treated like technical specifications: one large value, one short label, and one optional explanatory line.

### Spacing Principles

Headlines should breathe. Keep 24–40px between an eyebrow and display heading, 24–32px between a heading and body copy, and 32–48px before primary actions. Limit explanatory copy to roughly 42–62 characters per line. Use the 8px spacing system consistently, but allow 120–200px of vertical space around major desktop chapters.

## 4. Component Stylings

### Navigation

- Use a compact, sticky global bar on Absolute Black with inverse text and restrained 13–14px labels.
- Add a secondary contextual bar only when it helps orient users within a flow, such as Discover / Demand map / Requests / Seller workspace. It may be translucent over a dark hero but must settle into an opaque surface once content scrolls beneath it.
- Keep inactive items at reduced opacity and the active item fully opaque with a short underline or Ember Red marker.
- Desktop navigation is precise and horizontal. Mobile navigation becomes a focused full-height sheet with the primary action visible without scrolling.

### Buttons

- **Primary light:** Studio White fill, Graphite text, 6px radius, 48–52px height. Use on dark sections.
- **Primary dark:** Absolute Black fill, Studio White text, 6px radius, 48–52px height. Use on light sections.
- **Demand action:** Ember Red fill with Studio White text. Reserve for bidding, posting a request, or acting on live demand.
- **Secondary:** Transparent fill with a 1px current-color or Precision Divider border. No drop shadow.
- Hover states use a 2px rise, slight tonal shift, or directional icon motion. Avoid elastic scaling.

### Cards

- Use cards as clean modules, not decorative containers. Default surfaces are borderless or use one subtle hairline; radius is 12px and shadows are minimal.
- Media cards use 16px corners, edge-to-edge imagery, and short overlays only where contrast is guaranteed.
- Request cards prioritize title, distance, budget, time window, request count, and bid activity. Reveal secondary actions on hover for pointer devices, but keep them available to keyboard and touch users.
- Opportunity cards may use a dark surface with a large Ember Red count, one concise headline, and a technical two-column detail strip.

### Navigation Tabs & Chapter Controls

- Tabs use small type, generous horizontal spacing, and a 2px active indicator. Avoid enclosing every tab in a pill.
- Long pages may use numbered chapter navigation and a slim progress indicator. Map the chapters to marketplace concepts such as Discover, Demand, Compare, Bid, and Fulfill.
- Carousels and media chapters use compact arrows with 44px hit targets and visible disabled states.

### Inputs & Filters

- Inputs use Studio White or Graphite surfaces depending on context, 6px corners, 1px borders, persistent labels, and a high-contrast double focus ring: black with a white offset on light surfaces, reversed on dark surfaces.
- Search may be visually dominant, but filters stay compact. Use chips only for removable active filters and status badges.
- Bottom sheets, drawers, and modals use 16px outer corners, clear drag handles on mobile, and a focused action area.

### Demand Map

- Treat the map as a precision instrument rather than a decorative background. Use subdued map styling so demand clusters dominate.
- Cluster bubbles use Ember Red at controlled opacity, large centered counts, contrast rings, and scale by volume. Do not assign a different hue to each demand tier.
- Selected clusters gain full-opacity Ember Red, a thicker black or white ring, a dark detail card, and synchronized highlighting in the request list.
- Floating controls use compact white or graphite panels with 6–8px corners and restrained shadow.

### Metrics, Specs & Tables

- Translate product specification blocks into marketplace intelligence: request count, radius, median budget, active sellers, response time, and close rate.
- Use oversized numbers, short labels, hairline dividers, and alternating black/light chapters.
- Tables use spacious 56–64px rows, aligned numeric columns, sticky headers when useful, and no unnecessary outer border.

### Feedback & States

- Loading uses neutral skeletons with a soft linear shimmer; do not use spinning indicators for primary content.
- Success states use concise confirmation copy, a visible next step, and restrained green.
- Empty states should explain how demand will appear and offer one clear action.
- Bid submitted, accepted, expiring, and declined states must be distinguishable by text and icon as well as color.

### Icons & Media

- Use minimal outline icons with consistent 1.5–2px strokes. Directional arrows may be slightly animated.
- Product-like hero visuals must be original marketplace imagery: local services, objects requested, hands at work, neighborhood scenes, seller tools, and abstract demand signals. Never reuse reference-site product assets or branded photography.

## 5. Layout Principles

### Grid System

Use a fluid 12-column desktop grid with a maximum content width around 1440px, 40px gutters, and 64–96px outer margins. Use 24px tablet gutters and 20px mobile margins. Major chapters may break out to full viewport width while their copy remains aligned to the core grid.

### Whitespace Rhythm

Alternate focused, high-density operating surfaces with expansive cinematic chapters. Major desktop sections use 140–200px vertical spacing; supporting sections use 80–120px. Mobile chapter spacing is 72–96px. Negative space is part of the hierarchy, not unused room.

### Alignment & Composition

- Heroes use an asymmetric 5/7 or 4/8 split: concise copy on one side and a single dominant visual on the other.
- Use black-to-soft-light transitions as hard chapter changes or controlled tonal fades. Do not place decorative gradients behind every section.
- Feature sections may pin one visual while copy advances through two to four short chapters.
- Pair one dominant module with smaller technical annotations rather than repeating equal cards.
- Keep buttons, metadata, and stats on consistent vertical rails.

### Screen-Specific Translation

- **Homepage:** Replace the editorial serif opening with an oversized geometric statement, a black-to-soft-light hero, one original demand visualization, and a compact chapter nav. Convert category and trust sections into alternating cinematic and operational bands.
- **Demand map:** Preserve the split map/list model, but sharpen the list into an instrument panel with high-contrast counts, clean filters, and luminous demand clusters.
- **Request detail:** Treat the main request as a feature story with a dominant media surface, specification-like facts, seller confidence signals, and a sticky bid action.
- **Seller dashboard:** Use a dark command header and clean light work surfaces. Elevate opportunity metrics and live demand; keep tables readable and operational.
- **Transactional states:** Bid success, expanded rows, and planning drawers should feel like intentional chapters within the same system, not separate mini-apps.

### Responsive Behavior

Desktop compositions may be cinematic and asymmetric. Tablet reduces display scale, margins, and pinned duration while retaining contrast transitions. Mobile is recomposed into one focused narrative column: navigation becomes a sheet, chapter tabs become a horizontally scrollable rail, filters move to a bottom sheet, and high-intent actions become sticky.

Do not simply shrink 120px type or desktop split views. Use the dedicated mobile display size, crop media for portrait framing, keep map controls clear of device insets, and maintain 44px minimum touch targets.

## 6. Design System Notes for Stitch Generation

### Design Language

Use this recurring prompt language: **studio-clean monochrome interface, absolute black and cloud-white chapter transitions, cool silver-gray surfaces, oversized geometric sans typography, media-first composition, technical precision, one restrained ember-red accent, sparse premium navigation, generous negative space, original local-marketplace imagery, highly legible operating surfaces.**

### Colors

Start each screen with a clear dominant mode—Absolute Black or Cloud White—then introduce one contrasting chapter. Use Graphite for most text, Studio White for inverse content, and Instrument Gray for structure. Ember Red is the only decorative accent and should occupy well under 10% of any screen. Do not introduce orange, yellow, multicolor gradients, tinted cards, or a rainbow demand legend.

### Component Prompts

- “Compact black sticky navigation with reduced-opacity inactive links and one decisive inverse action.”
- “Oversized Poppins headline with tight tracking, short line breaks, and one isolated original marketplace visual.”
- “Specification-style demand metrics with large numerals, hairline dividers, and concise Manrope labels.”
- “Subdued grayscale map canvas with one-hue Ember Red volume clusters, synchronized request panel, and precise black-and-white floating controls.”
- “Border-light white request surface with edge-to-edge media, clear budget and distance, and restrained hover motion.”
- “Dark seller command header flowing into spacious light tables and opportunity modules.”

### Iteration Guidance

When updating existing screens, preserve content, routes, user intent, and marketplace semantics. Change the typography, color hierarchy, spatial rhythm, component geometry, imagery treatment, and motion direction. Replace copied or reference-specific details with original EMBER content.

Apply the system in this order: global navigation and typography; page background chapters; black-and-white primary actions; single-hue demand encoding and map clusters; cards, filters, and tables; imagery and motion; responsive refinements. Verify every screen in both light and dark contexts before finalizing.

## 7. Imagery & Motion Direction

Use original, high-resolution documentary imagery with studio-level crops: a cook plating a requested meal, a tutor working at a table, a repair tool isolated against dark space, a dog walker crossing a neighborhood, or hands making a local product. Favor one commanding visual over a collage. Use controlled contrast, directional lighting, deep blacks, and uncluttered backgrounds.

Motion is polished and purposeful: pinned visual chapters, subtle parallax, 12–24px text reveals, clip-path or mask transitions, media crossfades, count-up metrics, and synchronized map/list highlighting. Keep most UI transitions between 160–280ms; larger chapter transitions may use 500–900ms. Respect `prefers-reduced-motion` by replacing scroll-linked movement with static states and short fades.

## 8. Accessibility & Product Integrity

Maintain WCAG AA contrast for text and controls. Never place small gray text over busy media. Give keyboard focus a clearly visible dual-tone black-and-white ring with adequate offset. Ensure sticky bars do not trap content or obscure anchors. Provide accessible names for icon-only controls, descriptive alternative text for meaningful imagery, captions for video, and text equivalents for demand visualizations.

All interactions must remain functional in generated screens: navigation, filters, sort controls, map/list switching, request creation, save, bid submission, seller status updates, drawers, and success recovery paths. Visual drama should strengthen comprehension and momentum, never interrupt the marketplace task.
