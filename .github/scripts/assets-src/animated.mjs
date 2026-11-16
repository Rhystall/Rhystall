// Builds the animated, Trace-branded SVGs for github.com/Rhystall.
// Each SVG is HTML+CSS inside <foreignObject>, with its fonts (subset woff2)
// and images (webp) embedded, so it animates from a plain <img> on GitHub.
// Usage: node animated.mjs <dir with node_modules/playwright> <out dir>
// Inputs next to this file: img/og.webp (Trace HQ cover), img/mark.png (Trace logo), fonts/*.woff2.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(process.argv[2], 'package.json'));
const { chromium } = require('playwright');
const OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });

const b64 = (f) => fs.readFileSync(path.join(HERE, f)).toString('base64');
const img = (n) => `data:image/webp;base64,${b64('img/' + n + '.webp')}`;
const FONTS = {
  barlow: ['Barlow Condensed', 800, 'barlow800'],
  fredoka6: ['Fredoka', 600, 'fredoka600'],
  fredoka7: ['Fredoka', 700, 'fredoka700'],
  nunito7: ['Nunito', 700, 'nunito700'],
  nunito8: ['Nunito', 800, 'nunito800'],
};
const fontCss = (keys) =>
  keys.map((k) => { const [fam, w, f] = FONTS[k]; return `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${b64('fonts/' + f + '.woff2')}) format('woff2')}`; }).join('');

const C = { ink: '#24232b', cream: '#f8f4ec', paper: '#fffbf3', teal: '#2f6f6a', mint: '#9cf0d4', coral: '#e8664f', gold: '#dba646', yellow: '#f6c64f', grey: '#5d5c66', porcelain: '#efe8dc', sky: '#5fb8e0', heart: '#f0525a' };

const BASE = `*{box-sizing:border-box;margin:0;padding:0}.root{font-family:Nunito,sans-serif;color:${C.ink};padding:10px 10px 16px}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}}`;

const letters = (s, cls = 'l', step = 0.045) =>
  [...s].map((ch, i) => (ch === ' ' ? '<span class="sp"> </span>' : `<span class="${cls}" style="--i:${i};animation-delay:${(i * step).toFixed(2)}s,${(1.2 + i * 0.06).toFixed(2)}s">${ch}</span>`)).join('');

/* ---------------- components ---------------- */
const parts = [];
const add = (name, fonts, css, body, width) => parts.push({ name, fonts, css, body, width });

// HERO: the Trace HQ cover, slowly alive.
{
  const dots = Array.from({ length: 9 }, (_, i) => {
    const colors = [C.mint, C.yellow, C.paper, C.coral];
    const x = (i * 97) % 860 + 20, s = 8 + (i % 3) * 5, d = 12 + (i % 4) * 3, del = -(i * 2.1);
    return `<i class="dot" style="left:${x}px;width:${s}px;height:${s}px;background:${colors[i % 4]};animation-duration:${d}s;animation-delay:${del}s"></i>`;
  }).join('');
  add('hero', ['fredoka7'], `
.hero{position:relative;width:900px;height:473px;border:4px solid ${C.ink};border-radius:28px;overflow:hidden;box-shadow:0 8px 0 ${C.ink};background:${C.teal}}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:62% 45%;animation:kb 18s ease-in-out infinite alternate}
@keyframes kb{from{transform:scale(1.0)}to{transform:scale(1.08) translate(-1%,1%)}}
.sweep{position:absolute;inset:-20% -60%;background:linear-gradient(100deg,transparent 42%,rgba(255,251,243,.32) 50%,transparent 58%);animation:sw 11s ease-in-out infinite}
@keyframes sw{0%{transform:translateX(-45%)}55%,100%{transform:translateX(45%)}}
.dot{position:absolute;bottom:-10px;border-radius:50%;opacity:0;filter:blur(1px);animation-name:rise;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
@keyframes rise{0%{transform:translateY(0) scale(.6);opacity:0}20%{opacity:.7}80%{opacity:.5}100%{transform:translateY(-470px) scale(1.1);opacity:0}}
.pill{position:absolute;right:22px;bottom:22px;font:700 19px Fredoka;color:${C.paper};background:${C.coral};border:3px solid ${C.ink};border-radius:999px;padding:9px 20px;box-shadow:0 5px 0 ${C.ink};animation:breathe 4s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.pill b{display:inline-block;animation:nudge 1.2s ease-in-out infinite}
@keyframes hop{0%,60%,100%{transform:translateY(0)}70%{transform:translateY(-9px)}80%{transform:translateY(0)}88%{transform:translateY(-4px)}}
@keyframes nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
.blink{position:absolute;left:22px;top:22px;display:flex;align-items:center;gap:8px;font:700 15px Fredoka;color:${C.ink};background:${C.paper};border:3px solid ${C.ink};border-radius:999px;padding:5px 14px 5px 10px}
.blink i{width:11px;height:11px;border-radius:50%;background:${C.heart};animation:live 1.4s ease-in-out infinite}
@keyframes live{0%,100%{box-shadow:0 0 0 0 rgba(240,82,90,.6)}60%{box-shadow:0 0 0 7px rgba(240,82,90,0)}}`,
  `<div class="hero"><img src="${img('og')}"/><div class="sweep"></div>${dots}<div class="pill">Walk into Trace HQ →</div></div>`, 920);
}

// DIALOG: Ofaa introduces himself the way Bit talks in the HQ.
{
  const phrases = ['I build onchain systems.', 'I ship native iOS + Android apps.', 'I make interfaces you explore.', 'Got an idea? Let’s build it.'];
  const T = 16, slot = T / phrases.length;
  const layers = phrases.map((p, k) => {
    const chars = [...p].map((ch, i) => `<span class="c" style="animation-delay:${(k * slot + 0.15 + i * 0.05).toFixed(2)}s">${ch === ' ' ? '&#160;' : ch}</span>`).join('');
    const end = (k * slot + 0.15 + p.length * 0.05).toFixed(2);
    return `<div class="ph" style="animation-delay:${(k * slot).toFixed(2)}s">${chars}<span class="cur" style="animation-delay:${end}s,${end}s"></span></div>`;
  }).join('');
  const hearts = [0, 1, 2, 3].map((i) => `<svg xmlns="http://www.w3.org/2000/svg" class="hr" style="animation-delay:${i * 0.18}s" viewBox="0 0 24 22" width="22" height="20"><path d="M12 21 2.6 11.7A5.6 5.6 0 0 1 12 3.9a5.6 5.6 0 0 1 9.4 7.8Z" fill="${C.heart}" stroke="${C.ink}" stroke-width="2.2" stroke-linejoin="round"/></svg>`).join('');
  add('intro', ['barlow', 'fredoka6', 'fredoka7', 'nunito7'], `
.box{position:relative;width:900px;background:${C.paper};border:3px solid ${C.ink};border-radius:26px;box-shadow:0 8px 0 ${C.ink};padding:30px 32px 26px;margin-top:20px}
.tab{position:absolute;top:-20px;left:26px;font:800 20px 'Barlow Condensed';letter-spacing:.1em;color:${C.paper};background:${C.teal};border:3px solid ${C.ink};border-radius:12px;padding:4px 14px;text-transform:uppercase}
.hearts{position:absolute;top:-14px;right:26px;display:flex;gap:6px;background:${C.paper};border:3px solid ${C.ink};border-radius:999px;padding:3px 10px}
.hr{animation:beat 1.6s ease-in-out infinite;transform-origin:50% 60%}
@keyframes beat{0%,40%,100%{transform:scale(1)}15%{transform:scale(1.25)}28%{transform:scale(.95)}}
.hi{font:700 44px/1.05 Fredoka;display:flex;gap:2px}
.hi .l{display:inline-block;animation:drop .6s cubic-bezier(.3,1.6,.5,1) both}
.hi .sp{width:12px}
.hi .wv{display:inline-block;transform-origin:70% 80%;animation:hand 5s ease-in-out infinite;margin-left:10px}
@keyframes drop{from{transform:translateY(-26px);opacity:0}to{transform:none;opacity:1}}
@keyframes wave{0%,12%,100%{transform:translateY(0)}6%{transform:translateY(-7px)}}
@keyframes hand{0%,24%,100%{transform:rotate(0)}6%,18%{transform:rotate(14deg)}12%{transform:rotate(-6deg)}}
.type{position:relative;height:40px;margin:10px 0 14px}
.ph{position:absolute;inset:0;display:flex;align-items:center;font:600 26px Fredoka;color:${C.teal};opacity:0;animation:layer ${T}s linear infinite both}
@keyframes layer{0%{opacity:0}0.1%{opacity:1}${(100 * (slot - 0.25) / T).toFixed(2)}%{opacity:1}${(100 * (slot - 0.25) / T + 0.1).toFixed(2)}%{opacity:0}100%{opacity:0}}
.c{opacity:0;animation:ch ${T}s linear infinite both}
@keyframes ch{0%{opacity:0}0.1%{opacity:1}${(100 * (slot - 0.1) / T).toFixed(2)}%{opacity:1}${(100 * (slot - 0.1) / T + 0.1).toFixed(2)}%{opacity:0}100%{opacity:0}}
.cur{display:inline-block;width:3px;height:28px;background:${C.coral};margin-left:4px;opacity:0;animation:ch ${T}s linear infinite both,bl .8s steps(1) infinite}
@keyframes bl{50%{visibility:hidden}}
.p{font:700 17px/1.55 Nunito;color:${C.grey};max-width:760px}
.p b{color:${C.ink}}
.meta{display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}
.meta span{font:600 14px Fredoka;border:2px solid ${C.ink};border-radius:999px;padding:4px 12px;background:${C.cream}}
.meta span:first-child{background:${C.mint}}
.next{position:absolute;right:26px;bottom:18px;width:0;height:0;border-left:11px solid transparent;border-right:11px solid transparent;border-top:14px solid ${C.coral};animation:nx 1s ease-in-out infinite}
@keyframes nx{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}`,
  `<div class="box"><div class="tab">Ofaa · Trace Collective</div>
<div class="hi">${letters('Hey, I’m Ofaa.')}<span class="wv">👋</span></div>
<div class="type">${layers}</div>
<div class="p">Web3 &amp; mobile developer (iOS + Android), building <b>Trace Collective</b>, a builder-led creative &amp; venture studio from Indonesia. I build solo, with Claude as a teammate. Every project lives at <b>tracecollective.studio</b>.</div></div>`, 920);
}

// SECTION TITLES (light and dark).
const TITLES = [
  { id: 'stack', kick: '01', text: 'Toolbox', sub: 'What the work is built with' },
  { id: 'activity', kick: '02', text: 'On GitHub', sub: 'Leaving traces, every day' },
];
for (const t of TITLES) for (const mode of ['light', 'dark']) {
  const fg = mode === 'light' ? C.ink : C.cream, sub = mode === 'light' ? C.teal : C.mint;
  add(`title-${t.id}-${mode}`, ['barlow', 'fredoka7'], `
.title{display:flex;align-items:center;gap:18px;width:600px}
.kick{flex:none;font:800 26px 'Barlow Condensed';width:54px;height:54px;border-radius:16px;border:3px solid ${fg};background:${C.coral};color:${C.paper};display:grid;place-items:center;box-shadow:0 4px 0 ${fg}}
@keyframes wob{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg) translateY(-3px)}}
.big{font:800 52px/1 'Barlow Condensed';text-transform:uppercase;color:${fg};display:flex}
.big .l{display:inline-block;text-shadow:3px 3px 0 ${C.coral};animation:up .55s cubic-bezier(.3,1.5,.5,1) both}
.big .sp{width:12px}
@keyframes up{from{transform:translateY(34px);opacity:0}to{transform:none;opacity:1}}
@keyframes hop{0%,10%,100%{transform:translateY(0)}5%{transform:translateY(-8px)}}
.sub{display:flex;align-items:center;gap:10px;font:700 16px Fredoka;color:${sub};margin-top:4px}
.bar{height:4px;width:90px;border-radius:4px;background:${C.coral};transform-origin:left;animation:bar 5s ease-in-out infinite}
@keyframes bar{0%{transform:scaleX(.15)}50%{transform:scaleX(1)}100%{transform:scaleX(.15)}}`,
  `<div class="title"><span class="kick">${t.kick}</span><div><div class="big">${letters(t.text)}</div><div class="sub">${t.sub}<span class="bar"></span></div></div></div>`, 620);
}

// TOOLBOX.
{
  const STACK = [
    { group: 'Web3', items: ['Solidity', 'Foundry', 'EVM', 'Uniswap V2 / V3 / V4', 'wagmi', 'viem', 'Hyperliquid L2', 'Robinhood Chain'], bg: C.mint },
    { group: 'Mobile', items: ['Swift', 'SwiftUI', 'WidgetKit', 'Kotlin', 'Jetpack Compose', 'Room', 'Hilt', 'Flutter'], bg: '#d4f3ee' },
    { group: 'Web', items: ['React', 'Next.js', 'TypeScript', 'Vite', 'Tailwind', 'three.js', 'GSAP'], bg: C.cream },
    { group: 'Backend', items: ['Node.js', 'PostgreSQL', 'Drizzle', 'Supabase', 'Directus'], bg: C.cream },
    { group: 'Ship', items: ['Docker', 'VPS', 'Vercel', 'Figma', 'Claude Code'], bg: '#fff1b0' },
  ];
  let n = 0;
  const rows = STACK.map((s) => `<div class="g">${s.group}</div><div class="chips">${s.items.map((x) => `<span class="chip" style="background:${s.bg};animation-delay:${(n * 0.04).toFixed(2)}s,${(1 + n++ * 0.09).toFixed(2)}s">${x}</span>`).join('')}</div>`).join('');
  add('stack', ['barlow', 'fredoka6'], `
.sc{width:900px;background:${C.paper};border:3px solid ${C.ink};border-radius:24px;box-shadow:0 7px 0 ${C.ink};padding:24px 26px;display:grid;grid-template-columns:120px 1fr;row-gap:14px;align-items:center}
.g{font:800 22px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.08em;color:${C.teal}}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{display:inline-block;font:600 15px Fredoka;border:2px solid ${C.ink};border-radius:999px;padding:4px 13px;box-shadow:0 2px 0 ${C.ink};animation:pop .5s cubic-bezier(.3,1.6,.5,1) both,wave 7s ease-in-out infinite}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
@keyframes wave{0%,16%,100%{transform:translateY(0)}8%{transform:translateY(-3px)}}`,
  `<div class="sc">${rows}</div>`, 920);
}

// WORK WITH US.
add('work-with-us', ['barlow', 'fredoka7', 'nunito7'], `
.cta{position:relative;overflow:hidden;width:900px;background:${C.teal};border:3px solid ${C.ink};border-radius:26px;box-shadow:0 8px 0 ${C.ink};padding:30px 34px;display:flex;align-items:center;gap:28px;color:${C.paper}}

@keyframes st{to{background-position:45.25px 0}}
.cta::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(-45deg,rgba(156,240,212,.07) 0 16px,transparent 16px 32px);background-size:45.25px 45.25px;animation:st 6s linear infinite}
@keyframes st{to{background-position:45.25px 0}}
.cta>*{position:relative}
.logo{width:96px;height:118px;flex:none;background:${C.paper};border:3px solid ${C.ink};border-radius:20px;display:grid;place-items:center;box-shadow:0 5px 0 ${C.ink}}
.logo img{width:64px}
@keyframes sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg) translateY(-4px)}}
.k{font:800 16px 'Barlow Condensed';letter-spacing:.14em;text-transform:uppercase;color:${C.mint}}
.h{font:800 58px/0.95 'Barlow Condensed';text-transform:uppercase;margin:4px 0 8px;display:flex}
.h .l{display:inline-block;text-shadow:3px 3px 0 ${C.ink};animation:up .55s cubic-bezier(.3,1.5,.5,1) both}
.h .sp{width:14px}
@keyframes up{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
@keyframes hop{0%,12%,100%{transform:translateY(0)}6%{transform:translateY(-9px)}}
.p{font:700 16px/1.45 Nunito;color:#e3f4ec;max-width:500px}
.btn{margin-left:auto;flex:none;font:700 20px Fredoka;background:${C.coral};color:${C.paper};border:3px solid ${C.ink};border-radius:999px;padding:12px 22px;box-shadow:0 5px 0 ${C.ink};white-space:nowrap;animation:press 3.2s ease-in-out infinite}
.btn::after{content:'';position:absolute;inset:-3px;border-radius:999px;border:3px solid ${C.yellow};animation:ring 3.2s ease-out infinite}
@keyframes press{0%,70%,100%{transform:translateY(0);box-shadow:0 5px 0 ${C.ink}}78%{transform:translateY(4px);box-shadow:0 1px 0 ${C.ink}}}
@keyframes ring{0%,75%{transform:scale(1);opacity:0}78%{opacity:1}100%{transform:scale(1.35);opacity:0}}`,
  `<div class="cta"><div class="logo"><img src="MARK_INK"/></div><div><div class="k">Trace Collective · Indonesia</div><div class="h">${letters('Work with us')}</div><div class="p">Onchain systems, native iOS + Android apps and playful interfaces, from the first sketch to shipped.</div></div><div class="btn">Say hello →</div></div>`, 920);

for (const mode of ['light', 'dark']) add(`footer-${mode}`, ['barlow'], `
.f{display:flex;align-items:center;gap:14px;width:560px}
.f img{width:44px}
@keyframes sway{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
.f span{font:800 24px 'Barlow Condensed';text-transform:uppercase;letter-spacing:.06em;color:${mode === 'light' ? C.ink : C.cream}}`,
  `<div class="f"><img src="${mode === 'light' ? 'MARK_INK' : 'MARK_CREAM'}"/><span>Creating the future, leaving traces.</span></div>`, 580);

/* ---------------- build ---------------- */
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });

// Tint the mark (dark line-art on white) into transparent ink / cream PNGs.
await page.setContent('<canvas></canvas>');
const marks = await page.evaluate(async (src) => {
  const im = new Image(); im.src = src; await im.decode();
  const out = {};
  for (const [k, [r, g, b]] of Object.entries({ ink: [36, 35, 43], cream: [248, 244, 236] })) {
    const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
    const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, cv.width, cv.height);
    for (let i = 0; i < d.data.length; i += 4) { const l = (d.data[i] + d.data[i + 1] + d.data[i + 2]) / 3; const a = d.data[i + 3] * (1 - l / 255); d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = Math.round(a); }
    x.putImageData(d, 0, 0); out[k] = cv.toDataURL('image/png');
  }
  return out;
}, 'data:image/png;base64,' + b64('img/mark.png'));

for (const p of parts) {
  const body = p.body.replaceAll('MARK_INK', marks.ink).replaceAll('MARK_CREAM', marks.cream);
  const style = fontCss(p.fonts) + BASE + p.css;
  // Measure the height with every animation paused at its resting state.
  await page.setContent(`<!doctype html><html><head><style>${style} .root *{animation-play-state:paused!important}</style></head><body style="margin:0"><div class="root" style="width:${p.width}px;display:inline-block">${body}</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const h = Math.ceil(await page.locator('.root').evaluate((e) => e.getBoundingClientRect().height)) + 6;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${p.width}" height="${h}" viewBox="0 0 ${p.width} ${h}"><foreignObject x="0" y="0" width="${p.width}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" class="root"><style>${style}</style>${body}</div></foreignObject></svg>`;
  fs.writeFileSync(path.join(OUT, p.name + '.svg'), svg);
  console.log(p.name, p.width + 'x' + h, (svg.length / 1024).toFixed(0) + 'KB');
}
await browser.close();
