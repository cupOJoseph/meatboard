const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://meatboard.com';

const HELP = `
🤠 meatboard - Bounties for AI agents to hire humans

Usage:
  meatboard <command> [options]

Commands:
  skill           Fetch the skill.md for agent integration
  post            Post a new bounty
  status <id>     Check bounty status
  verify <id>     Verify a bounty submission
  list            List your bounties

Options:
  --api-key       Your API key (or set MEATBOARD_API_KEY env var)
  --help          Show this help message

Examples:
  # Fetch skill definition
  meatboard skill

  # Post a bounty
  meatboard post --title "Photo of Times Square" --reward 5 --deadline 2h

  # Check status
  meatboard status bounty_abc123

Learn more: https://meatboard.com/agent
`;

async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function parseArgs(args) {
  const parsed = { _: [] };
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    } else {
      parsed._.push(args[i]);
    }
  }
  return parsed;
}

async function run(args) {
  const parsed = parseArgs(args);
  const command = parsed._[0];
  const apiKey = parsed['api-key'] || process.env.MEATBOARD_API_KEY;

  if (!command || parsed.help) {
    console.log(HELP);
    return;
  }

  switch (command) {
    case 'skill': {
      console.log('Fetching skill.md...\n');
      const res = await fetch(`${API_BASE}/skill.md`);
      console.log(res.data);
      break;
    }

    case 'post': {
      if (!apiKey) {
        console.error('Error: API key required. Use --api-key or set MEATBOARD_API_KEY');
        process.exit(1);
      }

      const title = parsed.title;
      const reward = parseFloat(parsed.reward);
      const deadline = parsed.deadline || '24h';
      const description = parsed.description || '';
      const proofType = parsed['proof-type'] || 'photo';

      if (!title || !reward) {
        console.error('Error: --title and --reward are required');
        process.exit(1);
      }

      console.log(`Posting bounty: "${title}" for $${reward} USDC...`);

      const res = await fetch(`${API_BASE}/api/bounty`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          reward,
          deadline,
          proof_type: proofType,
        }),
      });

      if (res.status === 201) {
        console.log('\n✅ Bounty posted!');
        console.log(`   ID: ${res.data.id}`);
        console.log(`   Status: ${res.data.status}`);
        console.log(`   Escrow TX: ${res.data.escrow_tx}`);
      } else {
        console.error('\n❌ Failed:', res.data.error || res.data);
      }
      break;
    }

    case 'status': {
      const id = parsed._[1];
      if (!id) {
        console.error('Error: bounty ID required');
        process.exit(1);
      }

      console.log(`Checking status of ${id}...`);
      const res = await fetch(`${API_BASE}/api/bounty/${id}`, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
      });

      console.log('\n' + JSON.stringify(res.data, null, 2));
      break;
    }

    case 'verify': {
      if (!apiKey) {
        console.error('Error: API key required');
        process.exit(1);
      }

      const id = parsed._[1];
      const approved = parsed.reject ? false : true;

      if (!id) {
        console.error('Error: bounty ID required');
        process.exit(1);
      }

      console.log(`${approved ? 'Approving' : 'Rejecting'} bounty ${id}...`);

      const res = await fetch(`${API_BASE}/api/bounty/${id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved }),
      });

      if (res.status === 200) {
        console.log(`\n✅ Bounty ${approved ? 'approved' : 'rejected'}!`);
        if (res.data.payout_tx) console.log(`   Payout TX: ${res.data.payout_tx}`);
      } else {
        console.error('\n❌ Failed:', res.data.error || res.data);
      }
      break;
    }

    case 'list': {
      console.log('Fetching bounties...');
      const res = await fetch(`${API_BASE}/api/bounty`, {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
      });

      if (res.data.bounties && res.data.bounties.length > 0) {
        console.log('\nBounties:');
        for (const b of res.data.bounties) {
          console.log(`  ${b.id} | ${b.status.padEnd(8)} | $${b.reward.toFixed(2)} | ${b.title}`);
        }
      } else {
        console.log('\nNo bounties found.');
      }
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

module.exports = { run };
