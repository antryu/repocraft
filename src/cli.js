#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0];
const flags = args.filter(a => a.startsWith('--'));
const positional = args.filter(a => !a.startsWith('--'));

const isJson = flags.includes('--json');
const isWeb = flags.includes('--web');
const isHelp = flags.includes('--help') || flags.includes('-h') || !command;

if (isHelp) {
  console.log(`
🔧 repocraft — LLM-powered repo feature analysis & synthesis

Usage:
  repocraft analyze <github-url>              Analyze a single repo's features
  repocraft analyze <url> --json              JSON output
  repocraft analyze <url> --web               Interactive feature map (HTML)

  repocraft compare <category>                Compare repos in a category
  repocraft compare <category> --web          Interactive comparison matrix (HTML)
  repocraft compare --list                    List available categories

  repocraft dashboard                         Full catalog dashboard (HTML)

  repocraft craft --web                       Interactive feature selector + synthesis

Categories:
  runtime, knowledge-pack, orchestration, autonomous-loop,
  cross-agent, dev-tools, ai-research, design, seo, finance, skills

Examples:
  repocraft analyze https://github.com/openclaw/openclaw
  repocraft compare runtime --web
  repocraft dashboard
  repocraft craft --web
`);
  process.exit(0);
}

async function main() {
  try {
    switch (command) {
      case 'analyze': {
        const target = positional[1];
        if (!target) { console.error('❌ URL required. Usage: repocraft analyze <url>'); process.exit(1); }
        const { analyzeRepo } = require('./analyze');
        await analyzeRepo(target, { json: isJson, web: isWeb });
        break;
      }
      case 'compare': {
        const category = positional[1];
        const isList = flags.includes('--list');
        const { compareCategory, listCategories } = require('./compare');
        if (isList || !category) { listCategories(); break; }
        await compareCategory(category, { web: isWeb });
        break;
      }
      case 'dashboard': {
        const { generateDashboard } = require('./dashboard');
        await generateDashboard();
        break;
      }
      case 'craft': {
        const { startCraft } = require('./craft');
        await startCraft({ web: isWeb });
        break;
      }
      default:
        console.error(`❌ Unknown command: ${command}. Run repocraft --help`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

main();
