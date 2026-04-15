const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

function callClaude(systemPrompt, userMessage, retries = 2) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            if (retries > 0) {
              setTimeout(() => callClaude(systemPrompt, userMessage, retries - 1).then(resolve).catch(reject), 2000);
              return;
            }
            reject(new Error(`Claude API: ${parsed.error.message}`));
            return;
          }
          resolve(parsed.content?.[0]?.text || '');
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      if (retries > 0) {
        setTimeout(() => callClaude(systemPrompt, userMessage, retries - 1).then(resolve).catch(reject), 2000);
        return;
      }
      reject(e);
    });

    req.write(body);
    req.end();
  });
}

const SYSTEM_PROMPT = `You are a software architecture analyst. You analyze GitHub repositories and extract their functional feature blocks.

For each feature, evaluate:
- name: short feature name in English (e.g., "Discord Integration", "OAuth Authentication")
- name_ko: Korean name for the feature (e.g., "디스코드 연동", "OAuth 인증")
- description: one-line English description
- description_ko: Korean explanation (2-3 sentences). Explain what this feature does, why it matters, and how complete it is. Write for a non-developer audience.
- maturity: score 1-10 (1-3: experimental/stub, 4-6: functional but incomplete, 7-9: production-ready, 10: battle-tested)
- category: one of [auth, messaging, api, ui, storage, ai-model, tool-execution, memory, scheduling, deployment, testing, docs, config, plugin-system, monitoring, search, media, other]
- loc_estimate: rough LOC for this feature
- key_files: array of 1-3 most relevant file paths

IMPORTANT:
- Extract 5-20 features per repo (not too granular, not too coarse)
- Score maturity honestly based on code evidence
- description_ko must be helpful and specific, not generic. Explain the actual implementation.
- Return ONLY valid JSON array, no markdown, no explanation`;

async function extractFeatures(repoData) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not set. Run: export ANTHROPIC_API_KEY=sk-ant-...');
  }

  const sampleText = repoData.samples
    .map(s => `--- ${s.path} ---\n${s.content}`)
    .join('\n\n');

  const userMessage = `Analyze this repository and extract its feature blocks as JSON.

## README
${repoData.readme.slice(0, 5000)}

## Directory Structure
${repoData.structure.slice(0, 2000)}

## Stats
Total files: ${repoData.totalFiles} | Total LOC: ${repoData.totalLoc}

## Key Source Files
${sampleText.slice(0, 6000)}

## File List (top 50 by LOC)
${repoData.files
  .sort((a, b) => b.loc - a.loc)
  .slice(0, 50)
  .map(f => `${f.path} (${f.loc} LOC)`)
  .join('\n')}

Return a JSON array of feature objects. Only JSON, no markdown fences.`;

  const response = await callClaude(SYSTEM_PROMPT, userMessage);

  // Parse JSON from response (handle potential markdown fences)
  let jsonStr = response.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  }

  // Attempt to fix truncated JSON
  if (!jsonStr.endsWith(']')) {
    const lastComplete = jsonStr.lastIndexOf('},');
    if (lastComplete > 0) {
      jsonStr = jsonStr.slice(0, lastComplete + 1) + ']';
    } else if (jsonStr.includes('{')) {
      const lastObj = jsonStr.lastIndexOf('}');
      if (lastObj > 0) jsonStr = jsonStr.slice(0, lastObj + 1) + ']';
    }
  }

  try {
    const features = JSON.parse(jsonStr);
    if (!Array.isArray(features)) throw new Error('Expected array');
    return features.map(f => ({
      name: f.name || 'Unknown',
      name_ko: f.name_ko || f.name || 'Unknown',
      description: f.description || '',
      description_ko: f.description_ko || f.description || '',
      maturity: Math.min(10, Math.max(1, Number(f.maturity) || 5)),
      category: f.category || 'other',
      loc_estimate: Number(f.loc_estimate) || 0,
      key_files: Array.isArray(f.key_files) ? f.key_files : [],
    }));
  } catch (e) {
    throw new Error(`Failed to parse features: ${e.message}\nResponse: ${jsonStr.slice(0, 200)}`);
  }
}

module.exports = { extractFeatures, callClaude };
