Create a polished, responsive, multi-page reverse-marketplace web application called “EMBER,” with the slogan “Where demand sparks opportunity.” The experience should help consumers publish local needs and help sellers or aspiring entrepreneurs discover, evaluate, and bid on aggregated demand.

Use the clean, cinematic product storytelling and disciplined palette of the Insta360 Luna Ultra product page as visual inspiration:
https://www.insta360.com/product/insta360-luna-ultra

Reinterpret its precise monochrome composition, oversized geometric typography, art-directed imagery, generous whitespace, asymmetric layouts, technical detail blocks, subtle parallax, and restrained motion. Do not reproduce Insta360’s branding, copy, products, layouts, or copyrighted assets.

The result must feel like a premium demand-intelligence product—not a generic SaaS dashboard, classifieds site, or admin template.

## PRODUCT MODEL

This is a demand-first marketplace:

1. A consumer posts a product or service they want.
2. The request enters the public request catalog.
3. Its approximate location contributes to a geographic demand map.
4. Semantically similar nearby requests are grouped into opportunity clusters.
5. Sellers discover individual requests or aggregated opportunities.
6. A seller submits a bid containing price, timing, experience, and a message.
7. The consumer compares bids and accepts or declines one.
8. The request becomes “Matched,” then “Fulfilled.”
9. Only applicable active demand remains represented on the map.

## DESIGN SYSTEM — REQUIRED

- Platform: Responsive web application
- Approach: Desktop-first with complete tablet and mobile adaptations
- Mood: Precise, cinematic, trustworthy, local, entrepreneurial, and modern
- Page background: Cloud White (#F5F5F7)
- Primary text and dark sections: Absolute Black (#000000) and Graphite (#1D1D1F)
- Card and overlay surface: Studio White (#FFFFFF)
- Borders and secondary surfaces: Precision Divider (#D2D2D7) and Instrument Gray (#EEEEF0)
- Primary demand accent: Ember Red (#FF3B30), used on less than 10% of each screen
- Pressed demand accent: Deep Ember (#D92D20)
- Error state: Error Crimson (#A61B16), always paired with explicit text or an icon
- Display typography: Poppins or a similar geometric sans-serif
- Interface typography: Manrope or a similar clean modern sans-serif
- Grid: 12-column desktop grid with a maximum content width around 1440px
- Spacing: Generous section spacing and deliberate negative space
- Cards: 12px radius, thin cool-gray borders, minimal shadows
- Form controls: 6px radius, strong focus indicators, clear labels
- Badges: Compact, softly rounded, never oversized
- Imagery: Premium community, craft, food, service, and local-business photography
- Icons: Minimal outlined icons with consistent stroke width
- Motion: 180–280ms transitions, subtle image scaling, gentle content reveals, and restrained parallax
- Accessibility: WCAG-conscious contrast, visible keyboard focus, semantic labels, and 44px minimum touch targets

Avoid yellow and orange brand accents, neon colors, glassmorphism, heavy gradients, cartoon illustrations, excessive pill-shaped elements, floating gradient blobs, generic bento grids, and corporate-dashboard styling.

## HEAT-MAP SYSTEM

Use one Ember Red hue representing demand quantity, not positive or negative sentiment:

- Low demand: Ember Red at 35% opacity
- Moderate demand: Ember Red at 55% opacity
- High demand: Ember Red at 75% opacity
- Very high demand: Ember Red (#FF3B30) at full opacity

Increase both bubble size and color intensity as request volume rises. Include a visible legend, numeric counts, and text labels so demand is not communicated by color alone.

## GLOBAL NAVIGATION

Create a minimal sticky navigation bar with:

- Brand logo
- Explore Requests
- Demand Map
- Categories
- How It Works
- Search
- Saved
- Messages
- Profile
- Primary “Post a Request” button

For logged-out users, replace Saved, Messages, and Profile with “Sign In” and “Join.”

On mobile, use a compact header with a menu drawer and keep “Post a Request” prominent.

## REQUIRED ROUTES AND SCREENS

### 1. Home — `/`

Build an art-directed editorial homepage rather than a conventional marketplace landing page.

1. Hero:
   - Full-width premium lifestyle image
   - Subtle parallax movement
   - Oversized serif headline: “See what your community is asking for.”
   - Supporting copy: “Post what you need, discover local demand, or turn nearby requests into your next opportunity.”
   - Primary CTA: “Post a Request”
   - Secondary CTA: “Explore Local Demand”
   - Include a small location indicator such as “Showing demand near Austin, Texas”

2. Trending Demand Categories:
   - Present categories like premium e-commerce collections
   - Use large editorial imagery, request counts, and directional arrows
   - Include Food & Meal Prep, Home Services, Tutoring, Personal Care, Events, and Handmade Goods

3. Most Requested Near You:
   - Responsive request-card grid
   - Mix individual requests with clearly labeled aggregated opportunities

4. Demand Map Preview:
   - Large interactive map with clustered demand bubbles
   - Include category filters and a CTA to open the full map
   - Selecting a cluster updates an adjacent summary card

5. How It Works:
   - Asymmetric editorial split section
   - Explain “Post what you need” and “Respond to visible demand”
   - Use photography, oversized step numbers, and concise copy

6. Aggregated Opportunities:
   - Feature opportunities such as:
     - “18 people want homemade meals within 5 miles”
     - “12 households need recurring lawn care”
     - “8 students are searching for calculus tutoring”

7. AI Opportunity Assistant:
   - Show an elegant assistant preview with a sample local-demand recommendation
   - CTA: “Analyze Opportunities Near Me”

8. Final CTA:
   - Full-width Charcoal section
   - Serif headline: “What could your community ask for next?”
   - Actions for posting a request and exploring opportunities

### 2. Explore Requests — `/requests`

Create a premium collection-page experience.

Include:

- Search with recent and suggested searches
- Category filters
- Distance radius
- Budget range
- Desired timeframe
- Urgency
- Demand level
- Request status
- Individual versus aggregated request toggle
- Grid/list view switcher
- Sort by newest, closest, highest demand, highest budget, or fewest bids
- Active-filter chips
- Results count
- “Load More” or infinite loading
- Mobile filter drawer

Filters, sorting, view toggles, saving, and loading must visibly work in the prototype.

### 3. Request Cards

Style requests like refined editorial product cards.

Each card should include:

- Category image or tasteful icon
- Request or opportunity label
- Request title
- Approximate location and distance
- Budget or budget range
- Desired timeframe
- Number of bids
- Similar nearby request count
- Demand-level badge
- Save control
- “View Request” action

Use subtle image zoom, staggered metadata reveals, and restrained hover elevation.

Example:

- Homemade Italian meals
- Austin, Texas · Within 3 miles
- $15–$25 per meal
- Needed weekly
- 18 similar requests nearby
- High Demand · 4 bids

### 4. Request Detail — `/requests/[id]`

Adapt the hierarchy of a luxury product-detail page.

Include:

- Large consumer-provided image gallery
- Request title and category
- Approximate location
- Budget and timeframe
- Created date
- Full description
- Bid count
- Similar-request count
- Compact demand-trend visualization
- Consumer profile summary
- Privacy notice explaining that the location is approximate
- Sticky “Submit a Bid” action
- Related requests nearby

On desktop, use an asymmetric two-column layout. On mobile, use a sticky bottom bid action.

The bid form must collect:

- Proposed price
- Estimated completion or delivery time
- Seller message
- Relevant experience
- Optional portfolio image or URL
- Bid expiration date

Include validation, progress feedback, a confirmation state, and a clear cancellation path.

For the request owner, display submitted bids as polished offer cards with comparison controls. Allow bids to be saved, accepted, or declined.

### 5. Post a Request — `/post`

Create a calm, guided multi-step form:

1. Category and request type
2. Title and detailed description
3. Optional reference images
4. Budget type, minimum, and maximum
5. Desired date, frequency, and urgency
6. Approximate location and preferred radius
7. Privacy and visibility settings
8. Review and publish

Include autosave feedback, inline validation, back/next navigation, image previews, a completed progress indicator, and a publication-success screen.

Never expose an exact public street address.

### 6. Demand Map — `/map`

Create a full-screen interactive map with a synchronized, collapsible request panel.

Requirements:

- Plot active requests using approximate locations
- Cluster nearby and semantically similar requests
- Scale bubble size by request count
- Scale bubble color by demand intensity
- Switch between all demand and individual categories
- Filter by radius, timeframe, budget, urgency, and status
- Allow map/list switching on small screens
- Synchronize map selection, hovered list items, and active filters

Clicking a bubble should open a preview containing:

- Leading categories
- Total active requests
- Average budget
- Current seller activity
- Most requested subcategories
- “Explore This Opportunity” action

Example cluster:

“18 requests for homemade meals”  
Average budget: $21  
Most requested: Italian, meal prep, baked goods  
6 sellers currently bidding

### 7. Consumer Dashboard — `/dashboard/consumer`

Use an editorial account workspace rather than a dense admin dashboard.

Include:

- Active requests
- Bids received
- Accepted bids
- Fulfilled requests
- Saved sellers
- Request performance
- Recent messages
- Create another request action

Use a mixture of spacious tables, status cards, and request imagery.

### 8. Seller Dashboard — `/dashboard/seller`

Include:

- Recommended local opportunities
- Submitted bids
- Accepted and declined bids
- Saved requests
- Demand trends
- AI recommendations
- Messages
- Profile and portfolio management

Prioritize opportunity discovery over analytics. Keep charts minimal, readable, and editorially styled.

### 9. AI Entrepreneur Assistant — `/assistant`

Create a guided opportunity-analysis interface using visible marketplace demand.

Recommendations should explain:

- What product or service could be tested
- Where demand is concentrated
- Typical budgets
- Suggested starting prices
- Which requests could be fulfilled together
- A low-risk validation plan
- Legal, licensing, food-safety, insurance, or regulatory subjects to investigate

Example insight:

“Eighteen people within five miles are requesting homemade meals. Most budgets fall between $15 and $25. Test the opportunity with a limited weekly menu and bid on five compatible requests before investing in a larger operation.”

Clearly label legal, licensing, tax, and safety information as general guidance—not professional advice.

## DEMAND AGGREGATION

Group requests only when they:

- Share the same or a semantically related category
- Fall within a configurable local radius
- Have overlapping timeframes
- Remain active

Opportunity cards must show:

- Aggregated request count
- Geographic radius
- Common need
- Budget range or average
- Timeframe overlap
- Seller competition
- Demand trend
- CTA to inspect every original request

Users must always be able to open the individual requests behind an aggregate.

## INTERACTION AND SYSTEM STATES

Create realistic states for:

- Loading and skeleton content
- Empty results
- Filter combinations with no matches
- Network or service errors
- Form validation
- Successful publication
- Successful bid submission
- Saved and unsaved items
- Matched and fulfilled requests
- AI analysis in progress
- Permission or authentication requirements

Do not create dead buttons, empty destination pages, or decorative controls without visible behavior.

## RESPONSIVE BEHAVIOR

- Desktop: Wide editorial compositions, asymmetric grids, map/list split view
- Tablet: Reduced columns, compact navigation, preserved hierarchy
- Mobile: Single-column content, horizontal category rails, filter drawers, stacked cards, and sticky primary actions
- Do not simply shrink desktop layouts
- Keep typography fluid using responsive clamp sizing
- Prevent clipped content, overlapping controls, and horizontal page overflow

## TECHNICAL DIRECTION

Use:

- Next.js with TypeScript
- Tailwind CSS
- Reusable accessible components
- PostgreSQL or Supabase
- Supabase Authentication
- MapLibre for the prototype, or Mapbox when credentials are available
- Realistic seed data centered on Austin, Texas

Create clearly structured entities for:

- Users
- Consumer profiles
- Seller profiles
- Categories
- Requests
- Request locations
- Bids
- Saved requests
- Demand clusters
- AI recommendations
- Request statuses

If a live backend, map service, or AI integration is unavailable, create a complete interactive prototype using realistic seeded data and clean mock-service boundaries. Persist important prototype actions locally so saving, filtering, publishing, and bid submission feel functional.

## MVP LIMITS

Do not build:

- Integrated payments
- Nationwide coverage
- Delivery logistics
- Advanced review or reputation systems
- Automated legal approval
- Full business-registration services

Prioritize:

- Creating and managing requests
- Browsing local demand
- Viewing demand clusters on the map
- Inspecting original requests
- Submitting and comparing bids
- Updating request status
- Receiving practical opportunity recommendations

## SEED CONTENT

Populate the application with realistic Austin-area examples across neighborhoods without exposing exact addresses. Include requests for:

- Homemade Italian meals
- Weekly lawn care
- Calculus tutoring
- Custom shelving
- Furniture assembly
- Gluten-free birthday cakes
- Pet sitting
- Event photography
- Clothing alterations
- Mobile bicycle repair

Include realistic seller profiles, portfolios, bids, budgets, timestamps, demand clusters, saved items, and status history.

## FINAL QUALITY BAR

The application should feel like a premium demand-discovery marketplace presented with the visual sophistication of an editorial décor store.

Every screen must be visually consistent, responsive, keyboard accessible, populated with believable content, and connected through a coherent functional flow. Preserve generous whitespace and art direction even in data-heavy views.
