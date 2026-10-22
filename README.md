# ByteVox "Show-Your-Work" Report Builder

> Built for the **ByteVox (an Aurigen Labs company)** Full Stack Intern Build Assignment.  
> An interactive web application where users upload messy spreadsheets, generate honest data profiles, build modular block-based reports, and share read-only links with zero data leaks.  
> **The Signature Twist:** Every number, chart bar, and table calculation has a **"How was this calculated?"** drawer revealing the plain-English explanation, exact server query, and complete audit of rows included vs. excluded with reasons.

---

## 🌐 Live Production Deployment
- **Live Demo Application:** [https://bytefox.onrender.com](https://bytefox.onrender.com)
- **One-Click Evaluator Sign-In:** Click the golden **"One-Click Demo Evaluator Sign In"** button on the login screen to test immediately with zero setup.
- **Pre-loaded Messy Dataset:** Available inside the app via **"Load Messy Sample CSV"** on the upload page or downloadable at [/samples/messy_sales_data.csv](https://bytefox.onrender.com/samples/messy_sales_data.csv).

---

## Quickstart (Run locally in 2 minutes)

### Prerequisites
- Node.js (v18+ or v20+, tested on Node v24)
- npm or pnpm

### 1. Install & Initialize Database
```bash
npm install
npx prisma db push
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm test
```
Executes the comprehensive Vitest test suite covering:
- **Aggregation logic**: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`, `MEDIAN`, negative numbers, category splits, and filter boundaries.
- **CSV Ingestion**: Jagged lines, unparseable quotes, dirty currencies (`$`, `€`), mixed date formats, and corrupted binary rejection.
- **Security & Multi-Tenant Isolation**: Cross-tenant data isolation, token validity, expiration, and instant revocation.

---

## One-Click Demo Mode for Evaluators
- On the login screen, click **"One-Click Demo Evaluator Sign In"** to instantly sign into a pre-configured sandbox session without needing to sign up.
- On the Upload screen, click **"Load Messy Sample CSV"** to immediately parse and profile our pre-built messy retail sales dataset (1,001 rows with deliberate blanks, mixed currencies, invalid dates, and jagged lines).

---

## "How My Report Builder Works" (Core Technical Write-up)

### 1. How Column Types Are Guessed & What Happens to Bad Rows
When a CSV is uploaded to `/api/datasets`:
1. **Sanitization & Syntax Validation**:
   - The server validates encoding and rejects binary files containing null bytes (`\0`).
   - We parse the raw stream with headerless delimiter detection to capture physical line numbers.
2. **Never Silently Drop Bad Rows (Honesty First)**:
   - If a line has fewer or more fields than the detected header (a jagged row), or contains unescaped quote syntax errors, it is **never silently discarded**.
   - Instead, the row is recorded in `unparseableRows` with its **exact 1-based line number in the source file, raw content string, and specific failure reason** (e.g. `Mismatched column count: expected 9 columns but found 10`).
   - Completely blank rows are also flagged rather than silently ignored.
3. **Type Inference Heuristic**:
   - For all structurally valid rows, each column's non-empty values are tested against four candidate types:
     - **`Number`**: Strips currencies (`$`, `€`, `£`, `₹`, `%`, `,`) and checks `!isNaN(parseFloat(val)) && isFinite(num)`. Explicitly rejects placeholders like `"N/A"`, `"-"`, or `"none"`.
     - **`Date`**: Validates strict regex for ISO-8601 (`YYYY-MM-DD`), slash format (`MM/DD/YYYY`), or dash format (`DD-MM-YYYY`), then parses with `Date.parse()` and bounds check (1920–2100) to reject impossible calendar dates (like `2024-02-31`).
     - **`Category`**: Evaluates distinct cardinality. If cardinality is $\le 30$ or ratio of distinct values to total rows is $< 20\%$ (for datasets $> 20$ rows), it is classified as a categorical dimension.
     - **`Text`**: Default fallback for descriptions, addresses, or IDs.
   - If numeric or date parsing succeeds on $\ge 75\%$ of non-empty cells, the column is typed as `number` or `date`. All inferred statistics (null counts, distinct counts, min, max, mean, sample values) are displayed in the interactive **Dataset Profile Drawer**.

---

### 2. How a Number Gets from the File to the Screen (And How Consistency Is Guaranteed)
1. **Server-Side Authoritative Calculation**:
   - Numbers are **never calculated on the client**. The client simply presents the UI and sends filter state to `/api/reports/[id]/calculate`.
   - The same calculation engine (`executeAndAuditBlock` in `src/lib/audit-engine.ts`) runs identically for:
     - The report builder canvas
     - The "How was this calculated?" inspection drawer
     - The public shared link viewer
     - Exported PDF and PNG snapshots
2. **Calculation & Audit Pipeline**:
   - **Step 1 (Global Filters)**: The report-level date range filter and category multiselect filters are applied to all valid rows. Rows failing date boundaries or category selections are diverted into `excludedByDate` or `excludedByCategory`.
   - **Step 2 (Metric Validation)**: Rows passing global filters are checked for the target numeric column. If a cell contains `"N/A"`, null, or dirty non-numeric data, it is diverted into `excludedByInvalidTarget` with a specific error message.
   - **Step 3 (Aggregation)**: The remaining valid numbers are processed through mathematical functions (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`, `MEDIAN`).
   - **Step 4 (Proof Compilation)**: The engine compiles:
     - The exact computed output
     - A plain-English explanation (e.g., *"Calculated SUM of 'profit' across 842 valid rows. Excluded 159 rows: 120 by date range, 25 by region, 10 missing/invalid profit, and 4 unparseable source lines."*)
     - The exact SQL query that represents the computation with bound parameters.
     - An exact audit tally of included vs. excluded rows, plus the first 5 included rows and first 5 excluded rows with their specific rejection reasons.

---

### 3. How the Share Link Works & Why It Is Safe
1. **Cryptographically Secure Tokens**:
   - When an owner shares a report, the server generates a 128-bit cryptographically secure random token (`crypto.randomBytes(16).toString('hex')`).
   - The owner can configure an expiration window (1 hour, 24 hours, 7 days, or never).
2. **Instant Revocation**:
   - The owner can revoke any share link with a single click. The database immediately marks `isRevoked: true`.
   - Any subsequent request to `/share/[token]` or `/api/share/[token]` instantly returns HTTP 403 / 410 with a dedicated "Link Revoked" view.
3. **Zero Data Leakage Guarantee**:
   - A viewer accessing `/share/[token]` has **no authenticated session** and no route to download raw CSV files or inspect unassociated tables.
   - The server only returns the report's presentation DTO and computed block values.
   - Database queries are isolated: User A cannot read or mutate User B's reports or datasets because all authenticated queries strictly enforce `where: { id, userId: session.id }` at the Prisma query level.

---

### 4. What Could Still Go Wrong (Edge Cases & Risks)
- **Ambiguous Date Formats**: `04/05/2024` could be April 5th (US format) or May 4th (UK/EU format). The current parser handles standard US slash format and ISO formats; a file with mixed locales could misinterpret days as months.
- **Mixed-Currency Arithmetic**: If a column has both `$100` and `€100`, the parser currently extracts `100` numerically. Without explicit currency conversion, summing mixed currency symbols could distort totals.
- **Scientific Notation & Extreme Decimals**: Floating-point additions in JavaScript (e.g. `0.1 + 0.2 = 0.30000000000000004`) are mitigated using `.toFixed(2)` rounding, but very large numbers ($> 2^{53}-1$) would require `BigInt` or `decimal.js`.

---

### 5. What Would Break First with Files 100 Times Larger (1M+ Rows)
If uploaded files scale from 10,000 rows to 1,000,000+ rows (~200MB+ CSVs):
1. **In-Memory Parsing & Request Timeouts**:
   - Loading the entire CSV into Node.js heap memory would exceed default V8 buffer limits (2GB heap) and HTTP request timeout windows.
   - *Fix*: Stream CSV uploads via multipart chunks to disk/object storage (S3), parse in a background worker (BullMQ/Redis), and stream rows directly to disk.
2. **Relational Database Row Insert Bottlenecks**:
   - Inserting 1M individual rows into SQLite or standard PostgreSQL tables with multiple indexes would take minutes.
   - *Fix*: Use embedded analytical columnar query engines like **DuckDB** or **ClickHouse**. DuckDB can read a 1M-row parquet or CSV file in milliseconds and compute `SUM`, `AVG`, `GROUP BY` in $< 50\text{ms}$ with zero memory footprint.
3. **Client-Side Data Overload in Tables**:
   - Rendering thousands of DOM table rows causes browser UI lag.
   - *Fix*: Virtualized list rendering (TanStack Virtual) and server-side cursor pagination.

---

## Live-Coding Walkthrough Readiness
The architecture is designed specifically for rapid live extensions:
- **Adding a new metric (e.g., `MEDIAN`, `PERCENTILE`, `STDDEV`)**:
  In `src/lib/audit-engine.ts`, `calculateAggregation()` has a clean `switch` statement. Adding `MEDIAN` was accomplished in 4 lines:
  ```ts
  case 'MEDIAN': {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  ```
- **Adding a new filter (e.g., numeric threshold `minPrice` / `maxPrice`)**:
  `GlobalFilters` interface and the filter loop in `executeAndAuditBlock()` are modularly structured to accept new conditions with instant cascade to all blocks.

---

## Decisions, Trade-offs & Time Management
- **Tech Stack Choice**: Selected unified Next.js 16 (App Router, TypeScript) with Prisma and SQLite.
  - *Trade-off*: Avoided multi-repo friction (separate backend/frontend dev servers, CORS issues, token syncing). Allowed evaluators to clone, run `npm install`, and immediately evaluate.
- **Optional Feature Picked**: **Export report as PDF / Image** (using `html2canvas-pro` and `jspdf`), enabling formatted executive downloads.
- **What Was Cut for Time**:
  - Drag-and-drop animated physics was replaced with reliable "Move Up" / "Move Down" controls to guarantee 100% bug-free block reordering on both mobile and desktop.
  - Complex custom regex formula builder was replaced with standard SQL aggregations (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`, `MEDIAN`) to keep the "Show Your Work" explanations crystal clear.
- **Hours Spent**: Approximately 4.5 hours from requirements analysis to deployment readiness.
- **AI Usage Reflection**:
  - AI was utilized to draft initial boilerplate and generate the 1,000-row realistic messy dataset.
  - *Where AI was wrong*: In Next.js 16 with Partial Prefetching enabled, client components using `usePathname()` or `use(params)` require explicit `<Suspense>` boundaries to allow prerendering. The AI originally omitted the Suspense wrapper, causing `next build` to fail during static page generation. I caught this during production build verification and properly wrapped `Navbar` and the dynamic routes in `<Suspense>` boundaries.

---

## 3-to-4 Minute Demo Recording Checklist
When recording your walkthrough video:
1. **Messy CSV Upload & Profile**:
   - Click "Load Messy Sample CSV" (or drop your own messy file).
   - Open the **Dataset Profile Drawer** to show:
     * Column type detection (`number`, `date`, `category`, `text`)
     * Missing values count and percentage
     * The **Unreadable Rows** tab showing line numbers and explicit reasons for bad rows.
2. **Build a Report with Every Block**:
   - Add a **Metric** block (e.g., SUM of `profit` split by `region`).
   - Add a **Chart** block (e.g., Bar chart of `quantity` by `product_category`).
   - Add a **Table** block (e.g., Top 10 orders sorted by `unit_price`).
   - Add a **Text Note** block explaining context.
3. **Show Your Work Twist (Inspect 2 Numbers)**:
   - Click the metric card: showcase the plain-English explanation, SQL query, copy button, and inclusion/exclusion meter.
   - Click a chart bar or table block: inspect the exact breakdown of excluded rows.
4. **Global Filters Cascade**:
   - Select a Date Range or toggle Category filters. Show that all blocks instantly update their numbers and recalculate their audit trails.
5. **Secure Link Sharing**:
   - Click "Share Link", select 24-hour expiry, copy the URL.
   - Open the URL in an **Incognito / Private Window** (no login required).
   - Demonstrate that the report loads, and clicking "Show Work" works for viewers too!
6. **Instant Revocation**:
   - In the owner window, click "Revoke Link".
   - Refresh the incognito window: observe the immediate **"Report Link Revoked"** screen.
7. **Bad File Validation**:
   - Attempt to upload an empty file or non-CSV file to demonstrate server validation and clear error messaging.

**Demonstration Link:** - https://drive.google.com/file/d/1ZIrZIsq2FKhlpzWA3sj2TlGHARmm7jIU/view?usp=drive_link
---

## Project Structure
```
g:/bytefox/
├── prisma/
│   ├── schema.prisma            # SQLite schema (User, Dataset, DatasetRow, Report, ReportBlock, ShareLink)
│   └── dev.db                   # SQLite database
├── public/
│   └── samples/
│       └── messy_sales_data.csv # 1,001-row messy retail sales dataset
├── src/
│   ├── app/
│   │   ├── (auth)/login/        # Login page with demo evaluator button
│   │   ├── (auth)/register/     # User registration
│   │   ├── datasets/            # Datasets manager & upload
│   │   ├── reports/             # Reports list & creation wizard
│   │   │   └── [id]/page.tsx    # Report Builder workspace
│   │   ├── share/[token]/       # Public read-only viewer
│   │   └── api/                 # Secure REST APIs (auth, datasets, reports, calculate, share)
│   ├── components/
│   │   ├── layout/Navbar.tsx    # Navigation bar
│   │   ├── dataset/             # FileUploadZone, DatasetProfileDrawer
│   │   └── report/
│   │       ├── GlobalFilterBar.tsx
│   │       ├── AddBlockModal.tsx
│   │       ├── blocks/          # MetricBlock, ChartBlock, TableBlock, TextNoteBlock
│   │       ├── audit/           # HowWasThisCalculatedDrawer (Signature Twist)
│   │       ├── export/          # ExportReportModal (PDF / Image)
│   │       └── share/           # ShareModal (Tokenized link generator & revoke)
│   ├── lib/
│   │   ├── auth.ts              # Session cookies, bcrypt hashing, jose JWT
│   │   ├── db.ts                # Prisma singleton
│   │   ├── csv-parser.ts        # Resilient CSV parser & type inference
│   │   └── audit-engine.ts      # Server calculation & show-your-work engine
│   └── tests/
│       ├── aggregation.test.ts  # Math & aggregation tests
│       ├── csv-parser.test.ts   # Messy CSV parsing & bad row tests
│       └── security.test.ts     # Multi-tenant isolation & share link tests
├── README.md
└── package.json
```
