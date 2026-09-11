// Shared by template.html and the local sharp renderer; no browser required.
window.renderThreatReport = function (d) {
  const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  let seed = 20260911;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const grain = Array.from({ length: 3800 }, () =>
    `<circle cx="${(random() * 1600).toFixed(1)}" cy="${(random() * 900).toFixed(1)}" r="${(random() * 1.4 + .3).toFixed(1)}"/>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
    <defs>
      <pattern id="threat-halftone" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2.2" fill="#16130c"/></pattern>
    </defs>
    <rect width="1600" height="900" fill="#f1ecdd"/>
    <path d="M1110 0H1600V900H980L1040 784L970 640L1070 480L1010 300Z" fill="#1f3fd6"/>
    <path d="M1450 0H1600V900H1360Z" fill="url(#threat-halftone)" opacity=".6"/>
    <g font-family="Microsoft YaHei, Noto Sans SC, sans-serif" fill="#16130c">
      <text x="70" y="80" font-size="22" font-weight="700" letter-spacing="3">GARDEN LAB / READING NOTES</text>
      <path d="M70 112H930" stroke="#16130c" stroke-width="4"/>
      <text x="70" y="181" font-size="28" letter-spacing="5">ANTHROPIC · SEPTEMBER 2026</text>
      <text x="62" y="347" font-size="142" font-weight="900">AI 威胁档案</text>
      <rect x="68" y="389" width="790" height="116" fill="#cfe646"/>
      <text x="89" y="468" font-size="66" font-weight="900">${escape(d.subtitle)}</text>
      <text x="74" y="598" font-size="30">${escape(d.sub)}</text>
      <text x="74" y="654" font-size="30">权限 · 凭据 · 外部输入 · 审计</text>
      <rect x="70" y="744" width="330" height="55" fill="#16130c"/>
      <text x="90" y="781" font-size="26" fill="#f1ecdd" font-weight="700">DEVELOPER NOTES</text>
      <text x="70" y="852" font-size="19" letter-spacing="3">SOURCE: ANTHROPIC / INDEPENDENT COMMENTARY</text>
    </g>
    <g transform="translate(1260 398) rotate(12)">
      <circle r="201" fill="#f1ecdd"/>
      <circle r="185" fill="url(#threat-halftone)"/>
      <circle r="143" fill="#f1ecdd" stroke="#16130c" stroke-width="8"/>
      <path d="M-113 0Q0-105 113 0Q0 105-113 0Z" fill="#cfe646" stroke="#16130c" stroke-width="7"/>
      <circle r="47" fill="#16130c"/><circle cx="16" cy="-18" r="12" fill="#f1ecdd"/>
      <path d="M132 157L245 290" stroke="#16130c" stroke-width="59"/>
      <path d="M132 157L245 290" stroke="#e8412a" stroke-width="36"/>
    </g>
    <g transform="translate(1108 731) rotate(-9)">
      <rect width="380" height="93" fill="#e8412a" stroke="#16130c" stroke-width="5"/>
      <text x="23" y="65" font-family="Microsoft YaHei, Noto Sans SC, sans-serif" font-size="49" font-weight="900" fill="#f1ecdd">THREAT / 09</text>
    </g>
    <g fill="#16130c" opacity=".14">${grain}</g>
  </svg>`;
};
