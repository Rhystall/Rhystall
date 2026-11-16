// Draws assets/stats.svg: Rhystall's GitHub activity in Trace Collective's style.
// Runs daily from .github/workflows/stats.yml. Node 20+, no dependencies.
// Token: STATS_TOKEN (a personal token, counts private work) or GITHUB_TOKEN.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const LOGIN = process.env.STATS_LOGIN || 'Rhystall';
const TOKEN = process.env.STATS_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!TOKEN) throw new Error('Set STATS_TOKEN or GITHUB_TOKEN');

async function gql(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-stats' },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

const { user } = await gql(`query($login:String!){user(login:$login){createdAt
  pullRequests{totalCount} issues{totalCount}
  repositoriesContributedTo(contributionTypes:[COMMIT,PULL_REQUEST,ISSUE,REPOSITORY]){totalCount}}}`, { login: LOGIN });

const start = new Date(user.createdAt);
const now = new Date();
let total = 0, commits = 0, privateCount = 0;
const days = new Map();
for (let y = start.getUTCFullYear(); y <= now.getUTCFullYear(); y++) {
  const from = new Date(Math.max(Date.UTC(y, 0, 1), start.getTime())).toISOString();
  const to = new Date(Math.min(Date.UTC(y, 11, 31, 23, 59, 59), now.getTime())).toISOString();
  const d = await gql(`query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){
    totalCommitContributions restrictedContributionsCount
    contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`, { login: LOGIN, from, to });
  const cc = d.user.contributionsCollection;
  total += cc.contributionCalendar.totalContributions;
  commits += cc.totalCommitContributions;
  privateCount += cc.restrictedContributionsCount;
  for (const w of cc.contributionCalendar.weeks) for (const day of w.contributionDays) days.set(day.date, day.contributionCount);
}

// Streaks, from the calendar.
const sorted = [...days.entries()].sort((a, b) => a[0].localeCompare(b[0]));
let longest = 0, run = 0;
for (const [, n] of sorted) { run = n > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
let current = 0;
for (let i = sorted.length - 1; i >= 0; i--) {
  if (sorted[i][1] > 0) current++;
  else if (i === sorted.length - 1) continue; // today can still be empty
  else break;
}

// The last 52 weeks, one bar per week.
const last = sorted.slice(-364);
const weeks = [];
for (let i = 0; i < last.length; i += 7) weeks.push(last.slice(i, i + 7).reduce((s, [, n]) => s + n, 0));
const months = [];
for (let i = 0; i < last.length; i += 7) {
  const dt = new Date(last[i][0] + 'T00:00:00Z');
  if (dt.getUTCDate() <= 7) months.push({ i: i / 7, label: dt.toLocaleString('en', { month: 'short', timeZone: 'UTC' }) });
}

/* ---------------- draw ---------------- */
const C = { ink: '#24232b', paper: '#fffbf3', cream: '#f8f4ec', teal: '#2f6f6a', mint: '#9cf0d4', coral: '#e8664f', grey: '#5d5c66', porcelain: '#efe8dc' };
const font = (fam, w, f) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${fs.readFileSync(path.join(HERE, 'fonts', f + '.woff2')).toString('base64')}) format('woff2')}`;
const fmt = (n) => n.toLocaleString('en-US');
const since = start.toLocaleString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const W = 900, chartW = 836, chartH = 92, gap = 4;
const bw = (chartW - gap * (weeks.length - 1)) / weeks.length;
const max = Math.max(1, ...weeks);
const top = weeks.indexOf(max);
const bars = weeks.map((v, i) => {
  const h = Math.max(4, Math.round((v / max) * chartH));
  return `<span class="b" style="left:${(i * (bw + gap)).toFixed(1)}px;width:${bw.toFixed(1)}px;height:${h}px;${i === top ? `background:${C.coral}` : ''};animation-delay:${(i * 0.012).toFixed(2)}s"></span>`;
}).join('');
const labels = months.map((m) => `<span class="m" style="left:${(m.i * (bw + gap)).toFixed(1)}px">${m.label}</span>`).join('');
const tiles = [
  ['Commits', commits, 'public'],
  ['Pull requests', user.pullRequests.totalCount, 'opened'],
  ['Issues', user.issues.totalCount, 'opened'],
  ['Private work', privateCount, 'contributions'],
  ['Repositories', user.repositoriesContributedTo.totalCount, 'contributed to'],
].map(([k, v, s], i) => `<div class="t" style="animation-delay:${0.2 + i * 0.06}s"><div class="v">${fmt(v)}</div><div class="k">${k}</div><div class="s">${s}</div></div>`).join('');

const css = font('Barlow Condensed', 800, 'barlow800') + font('Fredoka', 600, 'fredoka600') + font('Fredoka', 700, 'fredoka700') + font('Nunito', 700, 'nunito700') + `
*{box-sizing:border-box;margin:0;padding:0}
.root{padding:10px 10px 16px;font-family:Nunito,sans-serif;color:${C.ink}}
.card{width:${W}px;background:${C.paper};border:3px solid ${C.ink};border-radius:26px;box-shadow:0 8px 0 ${C.ink};padding:24px 29px 26px}
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
.kick{font:800 16px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase;color:${C.teal}}
.big{font:800 72px/0.95 'Barlow Condensed';text-shadow:3px 3px 0 ${C.coral};animation:up .7s cubic-bezier(.3,1.4,.5,1) both}
.streaks{display:flex;gap:10px}
.st{font:600 15px Fredoka;border:2px solid ${C.ink};border-radius:999px;padding:6px 14px;background:${C.cream}}
.st b{font:700 18px Fredoka;margin-right:4px}
.st.now{background:${C.mint}}
.chart{position:relative;height:${chartH + 22}px;margin:22px 0 18px;border-bottom:2px dashed ${C.porcelain}}
.b{position:absolute;bottom:22px;border-radius:3px 3px 0 0;background:${C.teal};transform-origin:bottom;animation:grow .6s cubic-bezier(.3,1.3,.5,1) both}
.chart::after{content:'';position:absolute;top:0;bottom:22px;width:140px;background:linear-gradient(90deg,transparent,rgba(255,251,243,.55),transparent);animation:sheen 7s ease-in-out infinite}
@keyframes sheen{0%{left:-160px}60%,100%{left:100%}}
.chart{overflow:hidden}
.m{position:absolute;bottom:0;font:700 12px Nunito;color:${C.grey}}
.t .v{display:inline-block}
.tiles{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
.t{border:2px solid ${C.ink};border-radius:18px;padding:12px 14px;background:${C.cream};animation:up .6s cubic-bezier(.3,1.4,.5,1) both}
.v{font:800 34px/1 'Barlow Condensed'}
.k{font:700 15px Fredoka;margin-top:4px}
.s{font:700 12px Nunito;color:${C.grey}}
@keyframes up{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

const body = `<div class="card"><div class="top"><div><div class="kick">Contributions since ${since}</div><div class="big">${fmt(total)}</div></div>
<div class="streaks"><span class="st now"><b>${current}</b>day${current === 1 ? '' : 's'} current streak</span><span class="st"><b>${longest}</b>days longest</span></div></div>
<div class="chart">${bars}${labels}</div><div class="tiles">${tiles}</div></div>`;

const H = 428; // measured: card plus its shadow and the root padding
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 20}" height="${H}" viewBox="0 0 ${W + 20} ${H}"><foreignObject x="0" y="0" width="${W + 20}" height="${H}"><div xmlns="http://www.w3.org/1999/xhtml" class="root"><style>${css}</style>${body}</div></foreignObject></svg>`;
fs.writeFileSync(path.join(ROOT, 'assets/stats.svg'), svg);
console.log({ total, commits, privateCount, prs: user.pullRequests.totalCount, issues: user.issues.totalCount, repos: user.repositoriesContributedTo.totalCount, current, longest });
