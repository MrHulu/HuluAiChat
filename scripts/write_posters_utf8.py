# -*- coding: utf-8 -*-
"""Write poster-02 and poster-03 SVG with UTF-8 (no raw Chinese to avoid encoding issues)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTERS = ROOT / "docs" / "posters"

POSTER_02 = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200" fill="none">
  <defs>
    <linearGradient id="bg2" x1="0" y1="0" x2="1600" y2="1200" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1220"/>
      <stop offset="0.5" stop-color="#0F172A"/>
      <stop offset="1" stop-color="#0C4A6E"/>
    </linearGradient>
    <radialGradient id="glow2" cx="0.5" cy="0.4" r="0.6" gradientUnits="objectBoundingBox" gradientTransform="scale(1.2)">
      <stop stop-color="#06B6D4" stop-opacity="0.25"/>
      <stop offset="1" stop-color="#06B6D4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="card2" x1="180" y1="420" x2="1420" y2="900" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.02"/>
    </linearGradient>
    <filter id="soft2" x="-20" y="-20" width="1640" height="1240" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
    <pattern id="grid2" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1.5"/>
    </pattern>
  </defs>
  <rect width="1600" height="1200" fill="url(#bg2)"/>
  <rect width="1600" height="1200" fill="url(#glow2)"/>
  <rect width="1600" height="1200" fill="url(#grid2)"/>
  <text x="180" y="240" fill="#F8FAFC" font-size="80" font-weight="800" font-family="Inter, Segoe UI, system-ui, sans-serif">&#27969;&#24335;&#23545;&#35805;</text>
  <text x="180" y="310" fill="#E2E8F0" font-size="32" font-weight="600" font-family="Inter, Segoe UI, system-ui, sans-serif">Streaming &#183; &#23454;&#26102;&#36755;&#20986;</text>
  <text x="180" y="365" fill="#94A3B8" font-size="20" font-weight="500" font-family="Inter, Segoe UI, system-ui, sans-serif">&#25171;&#23383;&#26426;&#25928;&#26524;&#65292;&#36793;&#29983;&#25104;&#36793;&#23637;&#31034;&#65292;&#21709;&#24212;&#26356;&#24555;</text>
  <g filter="url(#soft2)">
    <rect x="180" y="430" width="1240" height="620" rx="36" fill="url(#card2)" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="2"/>
    <rect x="240" y="500" width="1120" height="120" rx="16" fill="#0F172A" fill-opacity="0.6" stroke="#06B6D4" stroke-opacity="0.2" stroke-width="2"/>
    <text x="280" y="555" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#29992;&#25143;&#65306;&#20171;&#32461;&#19968;&#19979; HuluChat</text>
    <text x="280" y="595" fill="#06B6D4" font-size="20" font-family="Inter, Segoe UI, system-ui, sans-serif">HuluChat &#26159;&#19968;&#27454;&#36731;&#37327;&#32423;&#8230;</text>
    <rect x="240" y="650" width="1120" height="180" rx="16" fill="#0F172A" fill-opacity="0.5" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="1"/>
    <text x="280" y="695" fill="#F8FAFC" font-size="22" font-weight="700" font-family="Inter, Segoe UI, system-ui, sans-serif">AI&#65306;</text>
    <text x="320" y="695" fill="#E2E8F0" font-size="20" font-family="Inter, Segoe UI, system-ui, sans-serif">HuluChat &#26159;&#19968;&#27454;&#36731;&#37327;&#32423;&#12289;&#26412;&#22320;&#20248;&#20808;&#30340; AI &#23545;&#35805;&#23458;&#25143;&#31471;&#12290;</text>
    <text x="280" y="735" fill="#E2E8F0" font-size="20" font-family="Inter, Segoe UI, system-ui, sans-serif">&#25903;&#25345; OpenAI &#20860;&#23481; API&#12289;&#22810; Provider &#20999;&#25442;&#12289;SQLite &#26412;&#22320;&#23384;&#20648;&#65292;</text>
    <text x="280" y="775" fill="#E2E8F0" font-size="20" font-family="Inter, Segoe UI, system-ui, sans-serif">&#24182;&#25903;&#25345;&#27969;&#24335;&#36755;&#20986;&#65292;&#35753;&#22238;&#22797;&#23454;&#26102;&#23637;&#29616;&#12290;</text>
    <text x="280" y="815" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#9644; &#20809;&#26631;&#38378;&#28865;&#31034;&#24847;&#27969;&#24335;&#36755;&#20986;&#20013;&#8230;</text>
    <rect x="240" y="860" width="320" height="56" rx="28" fill="#06B6D4" fill-opacity="0.15" stroke="#06B6D4" stroke-opacity="0.3" stroke-width="2"/>
    <text x="320" y="897" fill="#F8FAFC" font-size="20" font-weight="700" font-family="Inter, Segoe UI, system-ui, sans-serif">Streaming ON</text>
  </g>
</svg>
'''

POSTER_03 = '''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200" fill="none">
  <defs>
    <linearGradient id="bg3" x1="0" y1="0" x2="1600" y2="1200" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0B1220"/>
      <stop offset="0.45" stop-color="#0F172A"/>
      <stop offset="1" stop-color="#134E4A"/>
    </linearGradient>
    <radialGradient id="glow3" cx="0.7" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
      <stop stop-color="#10B981" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#10B981" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="card3" x1="180" y1="400" x2="1420" y2="950" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0.02"/>
    </linearGradient>
    <filter id="soft3" x="-20" y="-20" width="1640" height="1240" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
    <pattern id="grid3" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M72 0H0V72" stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1.5"/>
    </pattern>
  </defs>
  <rect width="1600" height="1200" fill="url(#bg3)"/>
  <rect width="1600" height="1200" fill="url(#glow3)"/>
  <rect width="1600" height="1200" fill="url(#grid3)"/>
  <text x="180" y="250" fill="#F8FAFC" font-size="80" font-weight="800" font-family="Inter, Segoe UI, system-ui, sans-serif">&#26412;&#22320;&#25345;&#20037;&#21270;</text>
  <text x="180" y="320" fill="#E2E8F0" font-size="32" font-weight="600" font-family="Inter, Segoe UI, system-ui, sans-serif">SQLite &#183; &#38544;&#31169;&#21487;&#25511;</text>
  <text x="180" y="375" fill="#94A3B8" font-size="20" font-weight="500" font-family="Inter, Segoe UI, system-ui, sans-serif">&#23545;&#35805;&#19982;&#37197;&#32622;&#23384;&#20110;&#26412;&#22320;&#65292;&#25968;&#25454;&#19981;&#20986;&#35774;&#22791;</text>
  <g filter="url(#soft3)">
    <rect x="180" y="440" width="1240" height="600" rx="36" fill="url(#card3)" stroke="#FFFFFF" stroke-opacity="0.08" stroke-width="2"/>
    <rect x="240" y="520" width="520" height="480" rx="24" fill="#0F172A" fill-opacity="0.5" stroke="#10B981" stroke-opacity="0.18" stroke-width="2"/>
    <text x="280" y="570" fill="#10B981" font-size="22" font-weight="700" font-family="Inter, Segoe UI, system-ui, monospace">SQLite</text>
    <text x="280" y="610" fill="#94A3B8" font-size="16" font-family="Inter, Segoe UI, system-ui, monospace">huluchat.db</text>
    <line x1="280" y1="630" x2="720" y2="630" stroke="#334155" stroke-width="1"/>
    <text x="280" y="670" fill="#E2E8F0" font-size="14" font-family="monospace">&#183; conversations</text>
    <text x="280" y="705" fill="#E2E8F0" font-size="14" font-family="monospace">&#183; messages</text>
    <text x="280" y="740" fill="#E2E8F0" font-size="14" font-family="monospace">&#183; config / api_keys</text>
    <text x="280" y="790" fill="#94A3B8" font-size="14" font-family="monospace">&#20840;&#37096;&#23384;&#20648;&#22312;&#26412;&#22320;&#65292;</text>
    <text x="280" y="825" fill="#94A3B8" font-size="14" font-family="monospace">&#21487;&#22791;&#20276;&#12289;&#21487;&#36801;&#31227;&#12290;</text>
    <text x="280" y="970" fill="#10B981" font-size="16" font-weight="600" font-family="Inter, Segoe UI, system-ui, sans-serif">&#25968;&#25454;&#22312;&#26412;&#22320; &#183; &#38544;&#31169;&#21487;&#25511;</text>
    <rect x="800" y="520" width="560" height="220" rx="24" fill="#0F172A" fill-opacity="0.45" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="1"/>
    <text x="840" y="565" fill="#F8FAFC" font-size="24" font-weight="700" font-family="Inter, Segoe UI, system-ui, sans-serif">&#38544;&#31169;&#19982;&#21487;&#25511;</text>
    <text x="840" y="615" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#183; &#23545;&#35805;&#21382;&#21490;&#19981;&#19978;&#20256;&#65292;&#20165;&#23384;&#20110;&#26412;&#26426;</text>
    <text x="840" y="655" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#183; API Key &#26412;&#22320;&#21152;&#23494;&#23384;&#20648;</text>
    <text x="840" y="695" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#183; &#21487;&#25171;&#21253;&#20026;&#21333; exe&#65292;&#38543;&#25335;&#38543;&#29992;</text>
    <rect x="800" y="770" width="560" height="230" rx="24" fill="#0F172A" fill-opacity="0.45" stroke="#FFFFFF" stroke-opacity="0.06" stroke-width="1"/>
    <text x="840" y="815" fill="#F8FAFC" font-size="24" font-weight="700" font-family="Inter, Segoe UI, system-ui, sans-serif">&#22810;&#31471;&#19982;&#22791;&#20276;</text>
    <text x="840" y="865" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#183; &#22797;&#21046; db &#25991;&#20214;&#21363;&#21487;&#36801;&#31227;&#20840;&#37096;&#25968;&#25454;</text>
    <text x="840" y="905" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#183; &#25903;&#25345;&#22810;&#35774;&#22791;&#21508;&#33258;&#26412;&#22320;&#23384;&#20648;</text>
    <text x="840" y="945" fill="#94A3B8" font-size="18" font-family="Inter, Segoe UI, system-ui, sans-serif">&#183; &#26080;&#36134;&#21495;&#12289;&#26080;&#20113;&#31471;&#20381;&#36182;</text>
  </g>
</svg>
'''

def main():
    POSTERS.mkdir(parents=True, exist_ok=True)
    (POSTERS / "huluchat-poster-02.svg").write_text(POSTER_02, encoding="utf-8")
    (POSTERS / "huluchat-poster-03.svg").write_text(POSTER_03, encoding="utf-8")
    print("Written huluchat-poster-02.svg, huluchat-poster-03.svg")

if __name__ == "__main__":
    main()
