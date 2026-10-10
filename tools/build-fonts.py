# Builds fonts.css + assets/fonts/: self-hosted Google Fonts, with ONE small
# "site" file per family holding exactly the characters the site uses.
#
# Why: Google splits every family into unicode-range subsets (latin, latin-ext,
# math, symbols, georgian...). A handful of characters (✦ ★ ✓ ← ↗ ₾ “ ”) made
# the browser fetch ~9 extra files one after another, and every file that
# arrived re-laid-out all the text on the page (~1 s of main-thread work on a
# mid-range phone). The site file covers everything in use, so it's one file
# per family. The original subsets are still declared (minus the characters
# the site file covers), so text added later always renders in the right font.
#
# Re-run after adding text in a new script/symbol (optional — it renders
# correctly without, just with an extra font download):
#
#   py -m pip install fonttools brotli      (once)
#   py tools/build-fonts.py
#
# It downloads from Google Fonts, so it needs internet. Updates the font
# preload links in index.html and terms.html automatically.

import hashlib, io, os, re, urllib.parse, urllib.request
from fontTools.ttLib import TTFont

ROOT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..'))
FONT_DIR = os.path.join(ROOT, 'assets', 'fonts')

# (family, axis spec) — must match the weights style.css uses.
FAMILIES = [('Anta', ''), ('Noto Sans Georgian', ':wght@400..700'), ('JetBrains Mono', ':wght@400..800'), ('Patrick Hand', '')]
# font-family stacks in style.css / hanging-badge.css (generic fallbacks omitted).
STACKS = [['Anta', 'Noto Sans Georgian'], ['JetBrains Mono', 'Noto Sans Georgian'], ['Patrick Hand']]
# Families whose site file is needed for the first screen -> <link rel=preload>.
PRELOAD = ['Anta', 'Noto Sans Georgian']
SOURCES = ['index.html', 'terms.html', 'script.js', 'terms-lang.js', 'style.css', 'hanging-badge.css', 'hanging-badge.js']
HTML_FILES = ['index.html', 'terms.html']
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36'


def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA})) as r:
        return r.read()


def slug(family):
    return family.lower().replace(' ', '-')


def parse_ranges(text):
    cps = set()
    for part in text.split(','):
        part = part.strip().upper().replace('U+', '')
        if '-' in part:
            a, b = part.split('-')
            cps.update(range(int(a, 16), int(b, 16) + 1))
        elif part:
            cps.add(int(part, 16))
    return cps


def format_ranges(cps):
    out, cps = [], sorted(cps)
    i = 0
    while i < len(cps):
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        out.append(f'U+{cps[i]:X}' if i == j else f'U+{cps[i]:X}-{cps[j]:X}')
        i = j + 1
    return ', '.join(out)


def cmap_of(data):
    return set(TTFont(io.BytesIO(data)).getBestCmap().keys())


def site_characters():
    text = ''
    for f in SOURCES:
        with open(os.path.join(ROOT, f), encoding='utf-8') as fh:
            text += fh.read()
    for m in re.finditer(r'content:\s*[\'"]([^\'"]*)[\'"]', text):  # CSS escapes, e.g. '\2197'
        text += re.sub(r'\\([0-9a-fA-F]{1,6})\s?', lambda e: chr(int(e.group(1), 16)), m.group(1))
    ents = {'nbsp': 0xA0, 'mdash': 0x2014, 'ndash': 0x2013, 'rarr': 0x2192, 'larr': 0x2190, 'copy': 0xA9, 'hellip': 0x2026}
    for m in re.finditer(r'&(\w+);|&#(\d+);|&#x([0-9a-fA-F]+);', text):
        cp = ents.get(m.group(1)) if m.group(1) else int(m.group(2) or m.group(3), 10 if m.group(2) else 16)
        if cp:
            text += chr(cp)
    cps = {cp for cp in range(0x20, 0x100) if not 0x7F <= cp <= 0x9F}  # all of Latin-1, always
    cps |= {ord(c) for c in text if ord(c) >= 0x20 and ord(c) != 0xFEFF}
    return cps


os.makedirs(FONT_DIR, exist_ok=True)
site = site_characters()
faces, coverage = {}, {}

# 1) Google's own unicode-range subsets, downloaded as-is.
for family, axis in FAMILIES:
    css = fetch(f'https://fonts.googleapis.com/css2?family={family.replace(" ", "+")}{axis}&display=swap').decode()
    faces[family], coverage[family] = [], set()
    for m in re.finditer(r'/\* ([\w-]+) \*/\s*@font-face \{([^}]*)\}', css):
        subset, body = m.groups()
        get = lambda k: re.search(k + r':\s*([^;]+);', body).group(1).strip()
        url = re.search(r'url\(([^)]+)\)', get('src')).group(1)
        version = re.search(r'/(v\d+)/', url).group(1)
        name = f'{slug(family)}-{version}-{subset}.woff2'
        path = os.path.join(FONT_DIR, name)
        if not os.path.exists(path):
            with open(path, 'wb') as fh:
                fh.write(fetch(url))
        with open(path, 'rb') as fh:
            rng = parse_ranges(get('unicode-range'))
            coverage[family] |= rng & cmap_of(fh.read())
        faces[family].append({'name': name, 'weight': get('font-weight'), 'style': get('font-style'), 'range': rng, 'version': version})

# 2) Which characters each family actually renders (first family in a stack that has the glyph).
needed = {family: set() for family, _ in FAMILIES}
for stack in STACKS:
    for cp in site:
        for family in stack:
            if cp in coverage[family]:
                needed[family].add(cp)
                break

# 3) One "site" file per family, subset by Google from the full font (text=).
css_out = ['/* Generated by tools/build-fonts.py — do not edit by hand. Self-hosted Google Fonts (SIL Open Font License). */']
preloads = {}
for family, axis in FAMILIES:
    weight, style, version = faces[family][0]['weight'], faces[family][0]['style'], faces[family][0]['version']
    for f in faces[family]:  # originals, minus everything the site file handles
        rest = f['range'] - site
        if rest:
            css_out.append(f"@font-face {{ font-family: '{family}'; font-style: {f['style']}; font-weight: {f['weight']}; font-display: swap; "
                           f"src: url('assets/fonts/{f['name']}') format('woff2'); unicode-range: {format_ranges(rest)}; }}")
    chars = needed[family]
    if not chars:
        continue
    text = urllib.parse.quote(''.join(chr(c) for c in sorted(chars)), safe='')
    css = fetch(f'https://fonts.googleapis.com/css2?family={family.replace(" ", "+")}{axis}&text={text}').decode()
    data = fetch(re.search(r'url\(([^)]+)\)', css).group(1))
    missing = chars - cmap_of(data)
    if missing:
        raise SystemExit(f'{family}: site subset is missing {format_ranges(missing)}')
    name = f'{slug(family)}-{version}-site.{hashlib.sha1(data).hexdigest()[:8]}.woff2'
    for old in os.listdir(FONT_DIR):
        if old.startswith(f'{slug(family)}-{version}-site.') and old != name:
            os.remove(os.path.join(FONT_DIR, old))
    with open(os.path.join(FONT_DIR, name), 'wb') as fh:
        fh.write(data)
    # Declared last = checked first for the characters it covers.
    css_out.append(f"@font-face {{ font-family: '{family}'; font-style: {style}; font-weight: {weight}; font-display: swap; "
                   f"src: url('assets/fonts/{name}') format('woff2'); unicode-range: {format_ranges(chars)}; }}")
    preloads[family] = name
    print(f'{name}: {len(chars)} characters, {len(data)} bytes')

with open(os.path.join(ROOT, 'fonts.css'), 'w', encoding='utf-8', newline='\n') as fh:
    fh.write('\n'.join(css_out) + '\n')
print('wrote fonts.css')

# 4) Point the <link rel="preload"> tags at the current site files.
for html_file in HTML_FILES:
    path = os.path.join(ROOT, html_file)
    with open(path, encoding='utf-8', newline='') as fh:
        html = fh.read()
    for family in PRELOAD:
        html = re.sub(rf'assets/fonts/{slug(family)}-v\d+-[\w.-]+?\.woff2(?=" as="font")', f'assets/fonts/{preloads[family]}', html)
    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(html)
print('updated preload links in', ', '.join(HTML_FILES))
