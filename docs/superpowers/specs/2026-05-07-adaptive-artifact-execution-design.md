# Adaptive Artifact Execution Design

## Goal

Make the `buatkan landing page` flow trustworthy and visually clear:

- simple prompts default to HTML preview mode
- explicit app/framework prompts use full workspace mode
- agent status only reports success when real execution happened
- artifacts open in the right surface for the chosen mode
- preview-first HTML artifacts look polished instead of broken or placeholder-like

## Accepted Test Prompt

Primary acceptance prompt:

> `buatkan labding page`

This intentionally generic prompt should be treated as a normal landing-page build request.

## Success Criteria

For the acceptance prompt above, the system is considered successful only if:

1. real output files are created
2. preview opens successfully
3. the artifact appears automatically
4. the artifact UI looks intentional and usable
5. the agent does not show `completed` before file creation and preview are actually done

## Current Problems

### Product / UX

- agent surfaces can show `completed` or `needs attention` while execution is still incomplete or invalid
- the adaptive thinking UI and the old agent dock can disagree
- users can see an empty or misleading artifact state
- HTML-style outputs and Next.js-style outputs are not separated clearly enough

### Execution

- generic landing-page prompts can be routed into workspace mode too early
- the model sometimes reports progress without producing meaningful files
- preview flow is not strongly tied to successful file creation
- `0 files created` or equivalent empty workspace outcomes are not treated as hard execution failure

### Artifact Experience

- HTML output should behave like a preview-first deliverable, but the current artifact path is too workspace-oriented
- Next.js output should behave like a real project workspace with file tree and preview, but the current experience can stop before that state is valid

## Product Decisions

### 1. Adaptive build mode

Requests are routed into one of two build targets:

- `html-preview` for generic web-page requests
- `workspace-app` for explicit app/framework/project requests

#### Routing rule

Use `html-preview` when the prompt is generic, such as:

- `buatkan landing page`
- `buatkan homepage modern`
- `buatkan halaman promosi`

Use `workspace-app` when the prompt explicitly signals framework or app intent, such as:

- `buatkan landing page next.js`
- `buat dashboard react`
- `buat web app nextjs`
- `buat aplikasi admin`

This keeps generic requests fast and reliable while preserving the richer workspace flow for real app builds.

### 2. Truthful completion

`completed` means all required execution checkpoints succeeded for the selected mode.

For `html-preview`, completion requires:

- artifact content exists
- at least one meaningful file exists
- preview is renderable/openable

For `workspace-app`, completion requires:

- workspace contains meaningful files
- required create/update operations happened successfully
- preview server started successfully or returned a valid preview-ready state

If these conditions are not met, the status cannot become `completed`.

### 3. Different artifact behavior by mode

#### HTML preview mode

Default behavior:

- artifact opens automatically
- preview-first presentation
- code remains available but secondary

#### Workspace app mode

Default behavior:

- workspace opens as code project
- file tree is visible
- preview appears only after project becomes runnable

## Architecture

## A. Mode Classifier

Create a lightweight classifier that produces:

- `buildMode: "html-preview" | "workspace-app"`
- `reason: string`
- `confidence: low | medium | high`

The classifier should sit near the current auto-agent detection logic, but it answers a different question:

- not only `chat vs agent`
- also `what kind of artifact/execution target should this request use?`

### Signals for `html-preview`

- prompt mentions landing page, homepage, promo page, portfolio, company profile
- no explicit framework/runtime request
- no project structure or package-management intent

### Signals for `workspace-app`

- mentions Next.js, React, app, dashboard app, TypeScript project, routing, API, database, deployable app
- asks for multi-file project structure
- asks to install packages or run preview/dev server

## B. Execution Contract

Execution must become mode-aware.

### `html-preview` contract

The model should:

1. create or update one previewable artifact
2. produce actual HTML/CSS/JS content
3. open artifact automatically
4. avoid unnecessary workspace/project bootstrapping

### `workspace-app` contract

The model should:

1. use workspace tools immediately
2. create real project files
3. install dependencies when needed
4. start preview server
5. continue fixing until preview is actually ready

## C. Completion Gate

Introduce a backend-side completion gate before final agent status becomes `done`.

### Gate inputs

- file operation count
- resulting workspace file count
- artifact content length / presence
- preview readiness signal
- tool error state

### Gate outputs

- `done`
- `working`
- `needs_attention`
- `failed`

### Key rule

If file creation count is zero for a task that required files, the run cannot be marked successful.

## D. Artifact Opening Rules

### HTML preview mode

Open immediately when the first valid HTML artifact exists.

Preferred UX:

- large preview surface
- elegant preview framing
- code hidden behind secondary controls
- no empty workspace chrome

### Workspace app mode

Open project workspace when real files are present.

Preferred UX:

- file tree on the left
- active file/editor in center
- preview panel on the right or as toggle
- terminal/progress only when relevant

## UI Design

## 1. Adaptive Thinking Surface

Keep the new adaptive thinking model:

- simple bubble first
- upgrade to agent only from backend signal
- reasoning text only from real stream chunks

But it must not conflict with the old dock.

### Decision

There should be a single source of truth for active agent status.

The old bottom `Agent mode` dock should either:

- be removed for this flow, or
- become a secondary detail panel driven by the same execution state machine

It must not show `needs attention` when the main agent panel still says normal thinking unless the backend explicitly reports that state.

## 2. HTML Artifact Visual Direction

HTML artifacts should feel like a final presented deliverable, not a raw IDE shell.

### Requirements

- preview-first layout
- stronger spacing and framing
- minimal chrome
- clear `Open code` / `View source` secondary action
- no empty panes
- no placeholder `No content` state once artifact exists

## 3. Workspace Artifact Visual Direction

Workspace artifacts should feel operational and credible.

### Requirements

- visible file tree
- obvious active file
- preview readiness state
- terminal visibility only when executing commands
- useful empty states when preview has not started yet

## Data Flow

1. User sends prompt.
2. Backend determines `chat vs agent`.
3. Backend determines `buildMode`.
4. Backend emits initial thinking event.
5. If complex, backend emits upgrade-to-agent event.
6. Execution starts using the contract for the chosen mode.
7. Backend streams real reasoning chunks.
8. Backend streams file/tool/preview progress.
9. Completion gate evaluates whether execution actually succeeded.
10. UI shows final artifact surface based on `buildMode` and completion result.

## Error Handling

### If HTML artifact generation fails

- keep artifact closed or marked invalid
- show `needs attention`
- do not pretend preview exists

### If workspace file creation fails

- keep run in `working` or `failed`
- show actionable failure summary
- do not emit `completed`

### If preview startup fails

- keep workspace visible
- show preview error state
- allow retry/fix loop
- completion remains blocked

## Testing

## Primary acceptance test

Prompt:

> `buatkan labding page`

Expected:

- routed to `html-preview`
- creates real previewable artifact
- opens automatically
- shows polished preview-first artifact UI
- no false `completed` before output is valid

## Secondary tests

### HTML mode

- `buatkan landing page`
- `buat homepage portfolio modern`
- `buat halaman promosi produk`

### Workspace mode

- `buat landing page next.js`
- `buat dashboard react`
- `buat admin app nextjs`

### Failure tests

- file creation returns zero files
- preview server fails to start
- artifact content is empty
- agent stream stops early

## Rollout Plan

1. add build-mode classifier
2. enforce mode-specific execution contract
3. add completion gate
4. unify agent status source of truth
5. redesign HTML artifact presentation
6. refine workspace artifact presentation
7. validate against acceptance prompt and user-reported bug cases
