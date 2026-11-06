// Generated SVG art: permanent fallback portraits (one silhouette + prop per NPC, gold rim light),
// the detective, and the intro/menu scenery. No external assets.

let uid = 0;
const GOLD = '#b8985a';
const INK = '#0d0d0f';

const SHOULDERS = 'M10 400 C18 318 70 286 118 276 L182 276 C230 286 282 318 290 400 Z';
const NECK = 'M130 236 h40 v50 h-40z';
const HEAD = '<ellipse cx="150" cy="188" rx="50" ry="60"/>';

interface Parts { figure: string; details: string }

const PARTS: Record<string, Parts> = {
  alistair: {
    figure: `${HEAD}<path d="M98 178 C94 120 138 106 168 110 C212 116 210 160 205 182 C196 152 172 142 150 142 C126 142 108 154 98 178Z"/>`,
    details: `
      <path d="M118 278 L150 346 L182 278" stroke="#e8e2d0" stroke-opacity=".28" fill="none" stroke-width="2"/>
      <path d="M150 346 L150 400 M132 330 h36" stroke="#e8e2d0" stroke-opacity=".12" fill="none"/>
      <path d="M176 326 q-16 20 -34 16" stroke="${GOLD}" stroke-width="2" fill="none"/>
      <circle cx="140" cy="344" r="8" fill="#15130e" stroke="${GOLD}" stroke-width="2"/>
      <path d="M140 338 v6 h4" stroke="${GOLD}" stroke-width="1.2" fill="none"/>
      <path d="M30 400 L56 296" stroke="#7a5a30" stroke-width="7" stroke-linecap="round"/>
      <path d="M56 296 q-4-22 -24-16" stroke="#c9a561" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  },
  evelyn: {
    figure: `<path d="M94 172 C76 232 84 296 108 336 L192 336 C216 296 224 232 206 172 C200 112 100 112 94 172Z"/>${HEAD}`,
    details: `
      <path d="M128 280 L150 336 L172 280" stroke="#7a1f1f" stroke-width="4" fill="none"/>
      ${Array.from({ length: 9 }, (_, i) => `<circle cx="${124 + i * 6.5}" cy="${262 + Math.sin((i / 8) * Math.PI) * 9}" r="3.6" fill="#efe9d8"/>`).join('')}
      <circle cx="99" cy="234" r="3" fill="#efe9d8"/><circle cx="201" cy="234" r="3" fill="#efe9d8"/>
      <ellipse cx="150" cy="229" rx="11" ry="3.2" fill="#7a1f1f"/>
      <ellipse cx="208" cy="304" rx="13" ry="26" fill="#18181a" stroke="#e8e2d0" stroke-opacity=".5"/>
      <path d="M200 280 q8 12 16 0" stroke="#e8e2d0" stroke-opacity=".4" fill="none"/>`,
  },
  julian: {
    figure: `${HEAD}<path d="M100 164 L90 128 L112 142 L116 108 L136 128 L150 100 L166 128 L186 108 L188 142 L210 128 L202 168 C194 148 176 140 150 140 C124 140 108 148 100 164Z"/>`,
    details: `
      <path d="M126 278 L150 322 L174 278 Z" fill="#cfc9b8" opacity=".85"/>
      <g transform="rotate(7 150 330)"><path d="M144 304 L158 304 L164 374 L151 394 L138 374 Z" fill="#6a1f26"/><path d="M144 304 L158 304 L156 316 L146 316Z" fill="#4a1419"/></g>
      <path d="M60 330 q14 6 28 -2 M210 340 q14 4 24 -4 M100 360 q12 4 26 0" stroke="#e8e2d0" stroke-opacity=".12" fill="none"/>
      <path d="M120 206 q10 4 20 0 M162 206 q10 4 20 0" stroke="#e8e2d0" stroke-opacity=".25" fill="none"/>`,
  },
  harold: {
    figure: `${HEAD}<path d="M100 180 C98 128 130 122 150 122 C176 122 202 130 200 180 C192 150 178 146 150 146 C122 146 108 152 100 180Z"/>`,
    details: `
      <path d="M126 278 L150 400 L174 278 Z" fill="#e8e2d0" opacity=".92"/>
      <path d="M112 284 L136 400 M188 284 L164 400" stroke="#e8e2d0" stroke-opacity=".3" fill="none" stroke-width="2"/>
      <path d="M150 288 L134 280 L134 298 Z M150 288 L166 280 L166 298 Z" fill="#101012"/>
      <ellipse cx="128" cy="382" rx="22" ry="13" fill="#f2efe4"/><ellipse cx="172" cy="382" rx="22" ry="13" fill="#f2efe4"/>
      <path d="M110 382 h80" stroke="#bdb8a8" stroke-opacity=".5"/>`,
  },
  margaret: {
    figure: `${HEAD}<circle cx="150" cy="108" r="26"/><path d="M100 176 C98 126 130 114 150 114 C176 114 202 126 200 176 C190 148 176 142 150 142 C124 142 110 150 100 176Z"/>`,
    details: `
      <path d="M118 278 Q150 306 182 278" fill="#cfc9b8" opacity=".9"/>
      <path d="M124 302 L176 302 L186 400 L114 400Z" fill="#cfcab8" opacity=".88"/>
      <path d="M128 300 L120 280 M172 300 L180 280" stroke="#cfcab8" stroke-width="3" fill="none" opacity=".9"/>
      <circle cx="70" cy="372" r="14" fill="none" stroke="${GOLD}" stroke-width="2.4"/>
      <path d="M66 384 v16 M72 384 v12 M78 382 l6 12" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
      <path d="M84 366 L116 352" stroke="${GOLD}" stroke-opacity=".4"/>`,
  },
  victor: {
    figure: `${HEAD}<path d="M98 176 C94 124 134 104 170 112 C208 120 206 160 204 178 C196 150 170 138 146 138 C124 138 108 150 98 176Z"/>`,
    details: `
      <path d="M118 112 C140 104 170 104 190 120" stroke="#e8e2d0" stroke-opacity=".4" fill="none" stroke-width="2"/>
      ${Array.from({ length: 14 }, (_, i) => `<path d="M${30 + i * 18} 400 L${40 + i * 17} 312" stroke="#e8e2d0" stroke-opacity=".13"/>`).join('')}
      <path d="M118 278 L150 330 L182 278" stroke="#e8e2d0" stroke-opacity=".3" fill="none" stroke-width="2"/>
      ${[0, 1, 2].map((i) => `<circle cx="128" cy="${334 + i * 22}" r="4" fill="${GOLD}"/><circle cx="172" cy="${334 + i * 22}" r="4" fill="${GOLD}"/>`).join('')}
      <ellipse cx="204" cy="262" rx="15" ry="20" fill="#18181a" stroke="#e8e2d0" stroke-opacity=".3"/>
      <circle cx="208" cy="276" r="5" fill="none" stroke="${GOLD}" stroke-width="2.2"/><circle cx="208" cy="271" r="2" fill="#d9bd7f"/>`,
  },
  detective: {
    figure: `${HEAD}<ellipse cx="150" cy="148" rx="88" ry="14"/><path d="M104 148 C104 96 126 78 150 78 C176 78 196 96 196 148Z"/><path d="M96 282 L70 400 L230 400 L204 282 L186 262 L150 296 L114 262Z"/>`,
    details: `
      <path d="M104 142 h92" stroke="#1b2a44" stroke-width="9"/>
      <path d="M114 264 L150 300 L186 264" stroke="#e8e2d0" stroke-opacity=".3" fill="none" stroke-width="2"/>
      <path d="M96 340 h108" stroke="#e8e2d0" stroke-opacity=".25" stroke-width="3"/>
      <rect x="140" y="336" width="20" height="8" fill="none" stroke="${GOLD}"/>
      <path d="M150 262 L150 296" stroke="#e8e2d0" stroke-opacity=".25"/>`,
  },
};

/** Full-bleed SVG portrait for an NPC id (or 'detective'). */
export function silhouetteSVG(id: string): string {
  const p = PARTS[id] ?? PARTS.harold;
  const n = ++uid;
  const body = id === 'detective' ? '' : `<path d="${SHOULDERS}"/><path d="${NECK}"/>`;
  return `<svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMax meet" style="overflow:visible" role="img" aria-label="Silhouette portrait" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg${n}" cx=".35" cy=".28" r=".95"><stop offset="0" stop-color="#2b3236"/><stop offset=".6" stop-color="#121315"/><stop offset="1" stop-color="#08080a"/></radialGradient>
    <linearGradient id="shaft${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f8a90" stop-opacity=".22"/><stop offset="1" stop-color="#2f8a90" stop-opacity="0"/></linearGradient>
    <g id="fig${n}">${body}${p.figure}</g>
  </defs>
  <rect x="-1200" y="-800" width="2700" height="1600" fill="url(#bg${n})"/>
  <path d="M0 0 L150 0 L70 400 L0 400Z" fill="url(#shaft${n})"/>
  <use href="#fig${n}" fill="${GOLD}"/>
  <use href="#fig${n}" fill="${INK}" transform="translate(-3.5 0)"/>
  <g>${p.details}</g>
</svg>`;
}

/** Mansion in the rain for the intro and the menu backdrop. Windows are lit amber. */
export function mansionSVG(): string {
  const wins: string[] = [];
  const lit = (x: number, y: number, w: number, h: number, on: boolean) =>
    wins.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${on ? '#e8a33d' : '#0f1518'}" opacity="${on ? 0.75 : 0.9}"/>`);
  for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) lit(380 + i * 110, 470 + j * 90, 36, 52, (i * 3 + j * 5) % 4 === 0);
  return `<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1013"/><stop offset=".65" stop-color="#16222a"/><stop offset="1" stop-color="#0b0f12"/></linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <g fill="#070a0c">
    <path d="M300 520 h1000 v380 h-1000z"/>
    <path d="M300 520 L800 330 L1300 520z"/>
    <rect x="340" y="260" width="120" height="260"/><path d="M330 260 L400 170 L470 260z"/>
    <rect x="1140" y="290" width="110" height="230"/><path d="M1130 290 L1195 210 L1260 290z"/>
    <rect x="700" y="380" width="200" height="140"/><path d="M690 380 L800 290 L910 380z"/>
    <rect x="1030" y="300" width="30" height="90"/><rect x="560" y="320" width="30" height="100"/>
  </g>
  <g>${wins.join('')}
    <rect x="388" y="300" width="24" height="46" fill="#e8a33d" opacity=".7"/><rect x="1175" y="330" width="24" height="46" fill="#e8a33d" opacity=".55"/>
    <rect x="770" y="420" width="60" height="70" fill="#e8a33d" opacity=".6"/>
  </g>
  <rect x="0" y="780" width="1600" height="120" fill="#05070a"/>
  <path d="M0 800 Q400 770 800 800 T1600 790 V900 H0Z" fill="#06090b"/>
</svg>`;
}

/** Detective seen from behind under a street lamp, with a match flare. Used in the intro. */
export function detectiveStreetSVG(): string {
  return `<svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="lampglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e8a33d" stop-opacity=".55"/><stop offset="1" stop-color="#e8a33d" stop-opacity="0"/></radialGradient>
    <radialGradient id="matchglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
    <linearGradient id="pool" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8a33d" stop-opacity=".2"/><stop offset="1" stop-color="#e8a33d" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="M120 150 L460 880 L-20 880Z" fill="url(#pool)" opacity=".5"/>
  <ellipse cx="120" cy="150" rx="150" ry="150" fill="url(#lampglow)"/>
  <rect x="114" y="160" width="12" height="720" fill="#0a0b0c"/><rect x="96" y="140" width="48" height="26" rx="4" fill="#0a0b0c"/>
  <rect x="104" y="146" width="32" height="14" fill="#ffd9a0" opacity=".9"/>
  <g fill="#050506">
    <ellipse cx="330" cy="260" rx="62" ry="12"/>
    <path d="M286 258 C286 214 306 196 330 196 C356 196 374 214 374 258Z"/>
    <rect x="296" y="252" width="68" height="8" fill="#1b2a44"/>
    <path d="M296 286 C296 276 364 276 364 286 L374 330 L296 330Z"/>
    <path d="M270 330 C270 300 300 292 330 292 C360 292 392 300 392 330 L420 700 L240 700Z"/>
    <path d="M300 700 L296 860 L336 860 L340 700Z"/><path d="M322 700 L330 860 L372 860 L360 700Z"/>
    <path d="M276 330 L226 470 L252 478 L296 360Z"/>
    <path d="M392 340 L440 420 L418 436 L372 380Z"/>
  </g>
  <path d="M284 330 C280 420 276 560 244 700 M376 330 C384 420 396 560 418 700" stroke="#c9a561" stroke-opacity=".25" fill="none" stroke-width="2"/>
  <path d="M296 296 L364 296" stroke="#c9a561" stroke-opacity=".3" stroke-width="2"/>
  <circle cx="437" cy="422" r="46" fill="url(#matchglow)"/><circle cx="437" cy="422" r="4" fill="#fff3c8"/>
</svg>`;
}

/** Evidence icons by clue id keyword. */
export function clueIconPath(id: string, title: string): string {
  const s = (id + ' ' + title).toLowerCase();
  if (/body|alistair/.test(s)) return '<circle cx="12" cy="7" r="3"/><path d="M4 20 L8 12 H16 L20 20"/><path d="M2 21h20"/>';
  if (/key/.test(s)) return '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v4M21 12v3"/>';
  if (/glove/.test(s)) return '<path d="M8 21v-7L6 9l2-1 2 4V4l2-1 1 8V3l2 1v8l2-3 2 1-3 8v3z"/>';
  if (/foot|mud/.test(s)) return '<path d="M8 4c3 0 4 3 3 6s-3 3-4 1-1-7 1-7zM15 9c3 0 4 3 3 6s-3 3-4 1-1-7 1-7zM7 18l3 3M14 21l3-3"/>';
  if (/phone|cord/.test(s)) return '<path d="M5 6c0 8 5 13 13 13l2-3-4-2-2 1c-2-1-4-3-5-5l1-2-2-4z"/>';
  if (/ledger|page|note|will|card|paper|ticket/.test(s)) return '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 15h7"/>';
  return '<circle cx="10" cy="10" r="6"/><path d="M15 15l6 6"/>';
}
