# 🔧 repocraft

LLM-powered repo feature analysis, comparison & synthesis.

Analyze any GitHub repo's **functional features** (not just code structure), compare repos side-by-side, and compose new projects from selected features.

## Install

```bash
npx repocraft analyze <github-url>
```

Or install globally:

```bash
npm install -g repocraft
```

Requires `ANTHROPIC_API_KEY` environment variable.

## Usage

```bash
# Analyze a single repo's features
repocraft analyze https://github.com/openclaw/openclaw
repocraft analyze <url> --json
repocraft analyze <url> --web          # Interactive feature map

# Compare repos in a category
repocraft compare runtime --web        # Side-by-side feature matrix
repocraft compare --list               # List all categories

# Full catalog dashboard
repocraft dashboard                    # All 31 repos, grouped by category

# Compose new project from selected features
repocraft craft --web                  # Interactive feature selector
```

## How It Works

1. **Clone** — Shallow clone the target repo
2. **Scan** — Extract README, directory structure, key source files
3. **Extract** — Claude analyzes the code and identifies functional features
4. **Score** — Each feature gets a maturity score (1-10):
   - 🔴 1-3: Experimental / stub
   - 🟡 4-6: Functional but incomplete
   - 🟢 7-9: Production-ready
   - ⭐ 10: Battle-tested
5. **Visualize** — ECharts dashboard with feature boxes, treemaps, comparison matrices

## Catalog Categories

| Category | Repos | Description |
|---|---|---|
| runtime | 5 | AI coding agents (OpenClaude, OpenClaw, Goose, Hermes...) |
| knowledge-pack | 3 | Curated knowledge for AI agents |
| orchestration | 4 | Multi-agent orchestration frameworks |
| autonomous-loop | 2 | Self-driving agent loops |
| cross-agent | 2 | Cross-platform agent bridges |
| dev-tools | 3 | Developer productivity tools |
| ai-research | 2 | AI research and self-improvement |
| design | 2 | Design-focused tools |
| seo | 1 | SEO/marketing tools |
| finance | 5 | Trading and financial tools |
| skills | 2 | Agent skill catalogs |

## Feature Analysis Output

```
🔧 repocraft — https://github.com/openclaw/openclaw
   13399 files | 2,566,364 LOC | 18 features

  Feature                  Category          Maturity     LOC
  ─────────────────────────────────────────────────────────────
  Discord Integration      messaging         🟢 9/10    67261
  MCP Server               tool-execution    🟢 8/10    45000
  OAuth Authentication     auth              🟢 8/10    32000
  Plugin System            plugin-system     🟡 7/10    73868
  Telegram Support         messaging         🟡 6/10    62698
  ...
```

## Comparison Matrix

```
repocraft compare runtime --web
```

Opens interactive HTML showing which features each repo has, with maturity scores color-coded.

## Craft Mode

```
repocraft craft --web
```

Select feature boxes from different repos → generate a new project combining those features.

## License

MIT
