<!--
SYNC IMPACT REPORT
==================
- Version Change: 1.1.0 -> 1.2.0
- List of Modified Principles:
  - ADDED: VIII. Base Template Starting Point (teams MUST start from the root base files and edit them in place)
  - AMENDED: IV. Time-boxed Scope (45 minutes -> 75 minutes, to match the workshop's 1 hr 15 min session)
  - AMENDED: VI. Shared Interface (now names the concrete base element IDs shipped in `index.html`)
  - Unchanged: I. Simplicity First, II. Storage Constraint, III. No Authentication,
    V. Traceability, VII. Root-Level Entry Point
- Added Sections:
  - "Branch-per-Team Workflow" subsection under Spec-Driven Development Workflow
  - Base-template file list added to the "Project Structure" subsection
- Removed Sections: None
- Follow-up TODOs: None

Previous entry (1.1.0):
- Version Change: 1.0.0 -> 1.1.0
- List of Modified Principles:
  - ADDED: VII. Root-Level Entry Point (`index.html` MUST live at the repository root, outermost level)
  - Unchanged: I. Simplicity First, II. Storage Constraint, III. No Authentication,
    IV. Time-boxed Scope, V. Traceability, VI. Shared Interface
- Added Sections:
  - "Project Structure" subsection under Technical Stack & Constraints (flat, root-level file layout)
- Removed Sections: None
- Follow-up TODOs: None

Previous entry (1.0.0):
- Version Change: N/A -> 1.0.0
- Initial creation of the SDD Workshop Constitution with 6 core principles:
  1. Simplicity First (Vanilla HTML/CSS/JS only)
  2. Storage Constraint (LocalStorage only)
  3. No Authentication (No login/session)
  4. Time-boxed Scope (Max 45 mins per feature, trim scope if needed)
  5. Traceability (Every code change must trace to an Acceptance Criterion)
  6. Shared Interface (Pre-agreed HTML IDs, classes, and function names)
- Added Sections: Technical Stack & Constraints, Spec-Driven Development Workflow
-->

# Specification-Driven Development Workshop Constitution

## Core Principles

### I. Simplicity First
Developers MUST use only vanilla HTML5, CSS3, and modern standard JavaScript (ES6+). Developers MUST NOT use any frontend frameworks (e.g., React, Vue, Angular, Svelte), build steps, bundlers, compilers, or transpilers (e.g., Webpack, Vite, Parcel, Babel, TypeScript). All application code MUST run immediately by opening the index `.html` file directly in a web browser or deploying it as a static site.

### II. Storage Constraint
All persistent application data MUST be stored using the browser's `localStorage` API only. Developers MUST NOT use actual database servers, backend APIs, or external storage services of any kind. No remote network calls (using `fetch`, `XMLHttpRequest`, or external SDKs) are permitted for data persistence.

### III. No Authentication
The application MUST NOT include any login, registration, authentication, token validation, session management, or user-access control systems. The application MUST treat all users as a single, fully authorized local operator.

### IV. Time-boxed Scope
Every specification MUST be implementable within a strict 75-minute limit (the workshop's 1 hour 15 minute build session). If a specification is too complex to be fully built within this timeframe, the specification MUST be trimmed or split until it fits. No features beyond what is explicitly defined in each specification may be implemented, regardless of the project topic.

### V. Traceability
Every line of code written MUST be traceable back to a specific Acceptance Criterion (AC) defined in the active specification. Developers MUST NOT write code, features, or behaviors that are not directly mapped to a documented requirement.

### VI. Shared Interface
If a project contains multiple features that operate on the same underlying data structure (e.g., a shared list of items), all features MUST use the same predefined function names, data structures, and HTML element IDs/classes as agreed upon by the team in advance. Developers MUST NOT duplicate shared functions, rename key variables, or introduce conflicting element identifiers.

The base template already defines this shared contract, and teams SHOULD keep it: the element IDs `#item-form`, `#form-error`, `#summary-text`, `#filter-section`, `#item-list`, and `#empty-state`; the single `state` object in `app.js` as the only source of truth; and `render()` as the only function permitted to write to the DOM. A team MAY add IDs required by its own specification, but MUST NOT introduce a second, parallel way to store or render the same data.

### VII. Root-Level Entry Point
All generated code MUST follow a flat, root-level file layout. The application's entry point `index.html` MUST live at the outermost level of the repository (the repository root), never inside a subfolder such as `src/`, `app/`, `public/`, or a feature-named directory. Supporting assets (e.g. `style.css`, `app.js`) MUST sit next to `index.html` at the root and be referenced with plain relative paths (`./style.css`, `./app.js`) — no absolute paths, no path aliases, no nested asset trees. This guarantees the app opens by double-clicking the root `index.html` (`file://`) and deploys to static hosting (e.g. Vercel) with zero build or output-directory configuration. Any spec, plan, or task that places `index.html` anywhere but the root MUST be rejected and corrected before implementation.

### VIII. Base Template Starting Point
Every team MUST begin from the base template committed at the repository root (`index.html`, `style.css`, `app.js`) and edit those files in place on the team's own branch. Developers MUST NOT create a new entry file (e.g. `team-1.html`, `main.js`) alongside the base files, and MUST NOT keep base markup, styling, or comments that its specification does not use — every `TODO` marker in the base files MUST be either fulfilled or deleted before the work is considered done. The base template is scaffolding, not a requirement: any base section a specification does not call for MUST be removed rather than left empty, and any section the specification requires but the base lacks MUST be added. The template's structure is deliberately generic (create form, live summary, filter controls, item list, empty state) because every workshop specification shares that shape; a team whose specification needs a different shape (e.g. a board, a grid, a timer) MUST reshape the template rather than work around it.

## Technical Stack & Constraints

Development is entirely local. The allowed tech stack is restricted to:
- **Languages**: Standard HTML5, CSS3, and standard ECMAScript 2020+ (modern standard JavaScript).
- **External Assets**: Standard browser APIs only. No third-party NPM packages, bundlers, or CSS preprocessors (SASS/LESS) are allowed.
- **Hosting / Execution Compatibility**: The codebase MUST be fully compatible with direct file system execution (opening the `index.html` file using the `file://` protocol) or simple local HTTP hosting (e.g., running `python3 -m http.server` in the root).

### Project Structure

The generated application MUST match this layout exactly:

```
<repo root>/
├── index.html      # REQUIRED entry point — base template, outermost level, never nested
├── style.css       # base styling, root level, sibling of index.html
├── app.js          # base application logic, root level, sibling of index.html
└── specs/
    └── โจทย์/
        └── team-<n>.md   # the specification each team builds against
```

- `index.html` at the repository root is mandatory and is the single entry point.
- `style.css` and `app.js` are the only supporting application files; they are linked with plain relative paths (`./style.css`, `./app.js`).
- Additional HTML pages, if a spec requires them, MUST also sit at the root as siblings of `index.html`.
- Only non-code material (specs, docs, tooling) may live in subdirectories; application files MUST NOT.

## Spec-Driven Development Workflow

All development MUST adhere to the following workflow stages:
1. **Strict Conflict Resolution**: If any specification, implementation plan, or task list conflicts with the principles defined in this constitution, the developer or assistant MUST flag or reject it immediately. No development is permitted to proceed until the spec or plan is aligned.
2. **Specification First**: A detailed feature spec must be drafted, clarified, and approved before any coding tasks are generated.
3. **Acceptance Criteria Mapping**: All generated implementation tasks MUST map to specific acceptance criteria.
4. **Task-by-Task Implementation**: Code changes MUST be done incrementally, verified at each step, and tested locally by opening the application in the browser.

### Branch-per-Team Workflow

Each team works on its own branch and never on `main`:

1. **One branch per team**: create `team-<n>` from an up-to-date `main` before writing any code.
2. **One specification per branch**: a team implements only `specs/โจทย์/team-<n>.md`; it MUST NOT implement, modify, or borrow from another team's specification.
3. **No cross-team edits**: a team MUST NOT modify shared repository material (this constitution, `README.md`, another team's specification) on its branch. Every change on a team branch belongs to that team's own application files.
4. **The base template is the diff baseline**: because all teams start from identical root files, a team's branch diff IS its deliverable — reviewers read it to verify Principle V (Traceability), so the diff MUST contain nothing that its specification does not require.
5. **Deployable at all times**: the root `index.html` on every branch MUST open and run without errors, so that each branch produces a working preview deployment.

## Governance

- **Supremacy**: This constitution is the supreme authority of the project. All specifications, architecture plans, code implementations, and manual/automated checks MUST comply with this document.
- **Amendment Procedure**: Amendments to these principles may be proposed by any team member. To amend the constitution, the proposing party must document the rationale, update the version in accordance with the versioning policy, and obtain consent from the team and workshop facilitator.
- **Versioning Policy**:
  - **MAJOR**: Changes that modify or remove core principles (e.g., permitting a framework or backend server).
  - **MINOR**: Adding a new principle or significantly expanding/clarifying guidance.
  - **PATCH**: Fixing typos, clarifications, or non-semantic formatting.
- **Compliance Reviews**: At each stage of the development lifecycle (specifying, planning, implementing), the Spec Kit workflow tools MUST verify compliance with these rules. Any non-compliant artifact or code change must be rejected.
- **Guidance File**: Use `.specify/memory/constitution.md` as the source of truth for runtime development governance guidance.

**Version**: 1.2.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-12
