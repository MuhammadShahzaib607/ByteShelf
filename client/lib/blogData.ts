// ─── Blog content types ────────────────────────────────────────────────────────

export type BlogContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "takeaways"; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: "guides" | "news" | "product" | "stories";
  categoryLabel: string;
  readTime: string;
  date: string;
  /** Cover image for the listing card */
  cover: string;
  /** Full set of topic images for the detail-page carousel */
  images: string[];
  content: BlogContentBlock[];
  featured?: boolean;
}

// ─── Posts ─────────────────────────────────────────────────────────────────────

export const blogPosts: BlogPost[] = [
  {
    slug: "complete-guide-to-micro-warehousing",
    title: "The Complete Guide to Micro-Warehousing for Growing Brands",
    excerpt:
      "Stop renting entire warehouses. Learn how per-shelf storage works, when to make the switch, and how it can cut your logistics costs by up to 40%.",
    category: "guides",
    categoryLabel: "Guides",
    readTime: "8 min read",
    date: "July 28, 2026",
    cover:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413063-1f0911d7d7c7?q=80&w=1200&auto=format&fit=crop",
    ],
    featured: true,
    content: [
      {
        type: "p",
        text: "For most growing brands, storage is the last thing that scales gracefully. You either squeeze everything into an overstuffed corner or sign a lease for a warehouse you'll fill up in two years. Micro-warehousing fixes this by breaking storage into per-shelf units you can book month by month.",
      },
      { type: "h2", text: "What Is Micro-Warehousing?" },
      {
        type: "p",
        text: "Micro-warehousing is the practice of renting shelf space inside a shared, verified warehouse instead of leasing an entire facility. You pay for the exact number of shelves you use, so unused square footage never shows up on your invoice.",
      },
      {
        type: "quote",
        text: "You shouldn't pay for aisles you walk past. You should pay for the shelves you actually use.",
      },
      { type: "h2", text: "When to Make the Switch" },
      {
        type: "list",
        items: [
          "Your inventory outgrows a home office or spare room",
          "Your order volumes fluctuate month to month",
          "You're paying for empty space in a dedicated lease",
          "You need a professional delivery/return address",
        ],
      },
      { type: "h2", text: "The Real Cost Difference" },
      {
        type: "p",
        text: "A typical micro-warehousing setup costs a fraction of a conventional lease. You only commit to the shelves you need, scale up during peak season, and scale back down the moment demand softens.",
      },
      {
        type: "takeaways",
        items: [
          "Per-shelf pricing means zero wasted spend on empty space",
          "Bookings are flexible — add or release shelves monthly",
          "Verified owners + real-time QR tracking keep inventory safe",
          "Switching usually takes less than a week",
        ],
      },
    ],
  },
  {
    slug: "signs-you-are-overpaying-for-storage",
    title: "5 Signs You're Overpaying for Storage Space",
    excerpt:
      "If you're paying for empty aisles, you're bleeding money. Here are the five most common signs your storage setup is costing you more than it should.",
    category: "guides",
    categoryLabel: "Guides",
    readTime: "5 min read",
    date: "July 22, 2026",
    cover:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    ],
    content: [
      {
        type: "p",
        text: "Storage costs creep up quietly. A shelf here, a corridor there — and suddenly a huge share of your warehouse bill is paying for space you never touch. Here are five tell-tale signs it's time to rethink your setup.",
      },
      { type: "h2", text: "1. Your Lease Is Bigger Than Your Stock" },
      {
        type: "p",
        text: "If a visual walk-through of your facility shows more empty aisles than pallets, you're paying a premium for square footage you don't need. Per-shelf storage lets you right-size instantly.",
      },
      { type: "h2", text: "2. You Pay a Fixed Rate Every Month" },
      {
        type: "p",
        text: "Fixed leases make you pay the same amount in a quiet January as in a busy November. Flexible micro-warehousing scales the bill with your actual usage.",
      },
      { type: "h2", text: "3. You Can't Locate Inventory Fast" },
      {
        type: "p",
        text: "Disorganized storage means wasted labour hours hunting for cartons. Real-time QR tracking removes the guesswork completely.",
      },
      {
        type: "takeaways",
        items: [
          "Monthly cost per shelf is easy to compare and audit",
          "Empty space should cost you nothing",
          "Tracking beats guessing — every carton, every time",
        ],
      },
    ],
  },
  {
    slug: "real-time-qr-tracking-launch",
    title: "ByteShelf Raises the Bar with Real-Time QR Tracking",
    excerpt:
      "Our new inbound-plan and QR-scan pipeline lets merchants track every carton from dock to shelf — in real time.",
    category: "news",
    categoryLabel: "News",
    readTime: "4 min read",
    date: "July 18, 2026",
    cover:
      "https://images.unsplash.com/photo-1553413063-1f0911d7d7c7?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1553413063-1f0911d7d7c7?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    ],
    content: [
      {
        type: "p",
        text: "Tracking a carton from the moment it hits the dock to the moment it rests on a shelf used to mean clipboards and guesswork. Not anymore.",
      },
      { type: "h2", text: "Scan Once, Know Everything" },
      {
        type: "p",
        text: "Workers scan a QR code at arrival, and the carton instantly appears in the merchant's inbound plan — with location, quantity, and timestamp. Every scan updates the dashboard in real time.",
      },
      {
        type: "quote",
        text: "Real-time visibility is the difference between running logistics and reacting to them.",
      },
      {
        type: "takeaways",
        items: [
          "Cartons update the dashboard the moment they're scanned",
          "Inbound plans make receiving a guided, carton-by-carton flow",
          "Workers and owners see the same live data",
        ],
      },
    ],
  },
  {
    slug: "inside-verification-process",
    title: "Inside Our Verification Process: Trust Built Line by Line",
    excerpt:
      "Every warehouse owner on ByteShelf passes identity and facility checks. Here's what actually happens behind the scenes.",
    category: "product",
    categoryLabel: "Product",
    readTime: "6 min read",
    date: "July 12, 2026",
    cover:
      "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=1200&auto=format&fit=crop",
    ],
    content: [
      {
        type: "p",
        text: "Anyone can claim to run a warehouse. Proving it — that's the part that protects every merchant on the platform. Here's the verification pipeline every owner goes through before going live.",
      },
      { type: "h2", text: "1. Identity Check" },
      {
        type: "p",
        text: "Owners submit their NIC (front and back) plus a live photo. Admins review each document against national records to confirm the person behind the account.",
      },
      { type: "h2", text: "2. Facility Confirmation" },
      {
        type: "p",
        text: "A live video walkthrough confirms the space exists, matches the listing photos, and meets basic safety standards — clear aisles, secure access, and accurate shelf counts.",
      },
      {
        type: "takeaways",
        items: [
          "Every owner is identity-verified before listing",
          "Facility walkthroughs confirm the space is real",
          "Verified badges let merchants trust at a glance",
        ],
      },
    ],
  },
  {
    slug: "from-garage-to-500-shelves",
    title: "From Garage to 500 Shelves: How One Seller Scaled Up",
    excerpt:
      "Meet Sara — an e-commerce founder who turned unused shelf space into the backbone of a five-figure monthly operation.",
    category: "stories",
    categoryLabel: "Stories",
    readTime: "7 min read",
    date: "July 5, 2026",
    cover:
      "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1200&auto=format&fit=crop",
    ],
    content: [
      {
        type: "p",
        text: "Eighteen months ago, Sara was packing orders from her garage. Today she manages over 500 shelves across three verified warehouses — and she never signed a single lease.",
      },
      { type: "h2", text: "The Breaking Point" },
      {
        type: "p",
        text: "Peak season pushed her garage past its limit. Boxes stacked in the hallway, a return address she was embarrassed to print, and hiring someone to help cost more than the margins allowed.",
      },
      { type: "h2", text: "The ByteShelf Pivot" },
      {
        type: "p",
        text: "Sara started with 20 shelves at a nearby verified warehouse. Two weeks later she added 40 more. By month three, inbound planning and QR tracking meant her team could locate any carton in seconds.",
      },
      {
        type: "quote",
        text: "It grew with me. When sales doubled, my storage was ready the same week.",
      },
      {
        type: "takeaways",
        items: [
          "Start small — scale shelves as demand grows",
          "Verified space replaces the need for a personal facility",
          "Inbound plans keep fulfilment fast during peak season",
        ],
      },
    ],
  },
  {
    slug: "warehouse-owners-passive-income",
    title: "Warehouse Owners: Turn Empty Shelves Into Passive Income",
    excerpt:
      "You have the space. ByteShelf has the merchants. Here's how listing your unused shelves can generate steady monthly revenue.",
    category: "guides",
    categoryLabel: "Guides",
    readTime: "5 min read",
    date: "June 28, 2026",
    cover:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413063-1f0911d7d7c7?q=80&w=1200&auto=format&fit=crop",
    ],
    content: [
      {
        type: "p",
        text: "Most warehouses run at 60–70% capacity. The remaining shelves earn nothing while you still pay rent on the space they occupy. Listing them on ByteShelf turns that dead space into a revenue stream.",
      },
      { type: "h2", text: "Set Your Own Rates" },
      {
        type: "p",
        text: "You define the price per shelf, decide how many shelves to list, and manage availability in real time from your dashboard. No middlemen, no surprise fees.",
      },
      { type: "h2", text: "Accept Bookings on Your Terms" },
      {
        type: "p",
        text: "Every booking request comes to you for approval. You control who stores what, and merchant payments are tracked automatically.",
      },
      {
        type: "takeaways",
        items: [
          "Unused shelves become recurring monthly income",
          "You set pricing and approve every booking",
          "Dashboard tracks earnings and occupancy in real time",
        ],
      },
    ],
  },
  {
    slug: "whats-new-merchant-dashboard",
    title: "What's New in the Merchant Dashboard This Quarter",
    excerpt:
      "A roundup of the latest dashboard upgrades — live inbound lists, mark-as-paid flows, and a cleaner revenue overview.",
    category: "product",
    categoryLabel: "Product",
    readTime: "3 min read",
    date: "June 20, 2026",
    cover:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1553413063-1f0911d7d7c7?q=80&w=1200&auto=format&fit=crop",
    ],
    content: [
      {
        type: "p",
        text: "This quarter we focused on the moments that matter most: receiving stock, getting paid, and knowing where everything is. Here's what shipped.",
      },
      { type: "h2", text: "Live Inbound Lists" },
      {
        type: "p",
        text: "Inbound plans now stream updates in real time as workers scan cartons. Watch your shipment move from dock to shelf without refreshing a thing.",
      },
      { type: "h2", text: "Mark-as-Paid, Simplified" },
      {
        type: "p",
        text: "The new payment flow lets owners mark bookings as paid in one tap, with the revenue overview updating instantly.",
      },
      {
        type: "takeaways",
        items: [
          "Inbound plans update live as cartons are scanned",
          "One-tap mark-as-paid keeps books accurate",
          "Revenue overview is cleaner and always current",
        ],
      },
    ],
  },
  {
    slug: "inbound-planning-saves-hours",
    title: "How Inbound Planning Saves You 3 Hours Per Shipment",
    excerpt:
      "Plan shipments carton-by-carton before they arrive. A step-by-step workflow that logistics teams swear by.",
    category: "guides",
    categoryLabel: "Guides",
    readTime: "6 min read",
    date: "June 12, 2026",
    cover:
      "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1200&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=1200&auto=format&fit=crop",
    ],
    content: [
      {
        type: "p",
        text: "Receiving day used to mean guessing what's inside each box. With inbound planning, everything is known before the truck arrives — and the receiving flow becomes a checklist, not a puzzle.",
      },
      { type: "h2", text: "Plan Before the Truck Arrives" },
      {
        type: "p",
        text: "Create an inbound plan, list every carton, assign quantities, and generate QR labels. Your warehouse team scans each carton on arrival — no clipboards required.",
      },
      {
        type: "quote",
        text: "Every hour spent planning inbound saves three hours at the dock.",
      },
      {
        type: "takeaways",
        items: [
          "Carton-level planning removes receiving guesswork",
          "QR labels tie each box to its planned slot",
          "Discrepancies surface at the dock, not after",
        ],
      },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

export const blogCategories = [
  { id: "all", label: "All" },
  { id: "guides", label: "Guides" },
  { id: "news", label: "News" },
  { id: "product", label: "Product" },
  { id: "stories", label: "Stories" },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getFeaturedPost(): BlogPost {
  return blogPosts.find((p) => p.featured) ?? blogPosts[0];
}
