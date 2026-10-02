// Bakes the Georgian (`ge`) translations from script.js into index.html.
//
// The page is translated client-side, so without this every [data-lang]
// element ships empty (or with English fallback text) and crawlers that
// don't run JS — plus Google's first, pre-render pass — see a page with no
// Georgian content. script.js still overwrites everything at runtime, so the
// rendered page is unchanged. Re-run after editing the `ge` translations:
//
//   npm run prerender:ka
//
// Safe to run repeatedly; it only rewrites element contents and the
// placeholder/content attributes that script.js itself would set.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const js = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

const start = js.indexOf('const translations = {');
const end = js.indexOf('let currentLang', start);
if (start === -1 || end === -1) throw new Error('translations block not found in script.js');
const translations = new Function(js.slice(start, end).replace('const translations =', 'return'))();
const ge = translations.ge;

const escapeAttr = (s) => String(s).replace(/&(?!\w+;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;');

let html = fs.readFileSync(htmlPath, 'utf8');
const edits = [];
const missing = new Set();

// Finds the index of the closing tag that matches the opening tag ending at `from`.
function findClose(tag, from) {
    const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'gi');
    re.lastIndex = from;
    let depth = 1, m;
    while ((m = re.exec(html))) {
        depth += m[0].startsWith('</') ? -1 : 1;
        if (depth === 0) return m.index;
    }
    throw new Error(`unclosed <${tag}> at ${from}`);
}

// [data-lang] -> element contents (mirrors `element.innerHTML = ...`)
for (const m of html.matchAll(/<([a-z0-9]+)\b[^>]*\sdata-lang="([^"]+)"[^>]*>/gi)) {
    const [openTag, tag, key] = m;
    if (!(key in ge)) { missing.add(key); continue; }
    const innerStart = m.index + openTag.length;
    edits.push({ from: innerStart, to: findClose(tag, innerStart), text: ge[key] });
}

// [data-lang-placeholder] on form fields -> placeholder="..."
// [data-lang-meta] -> content="..."
for (const [attrName, target] of [['data-lang-placeholder', 'placeholder'], ['data-lang-meta', 'content']]) {
    const re = new RegExp(`<(input|textarea|meta)\\b[^>]*\\s${attrName}="([^"]+)"[^>]*>`, 'gi');
    for (const m of html.matchAll(re)) {
        const [openTag, , key] = m;
        if (!(key in ge)) { missing.add(key); continue; }
        const value = `${target}="${escapeAttr(ge[key])}"`;
        const existing = new RegExp(`\\s${target}="[^"]*"`);
        const newTag = existing.test(openTag)
            ? openTag.replace(existing, ` ${value}`)
            : openTag.replace(new RegExp(`\\s${attrName}=`), ` ${value} ${attrName}=`);
        edits.push({ from: m.index, to: m.index + openTag.length, text: newTag });
    }
}

edits.sort((a, b) => a.from - b.from);
for (let i = 1; i < edits.length; i++) {
    if (edits[i].from < edits[i - 1].to) throw new Error('overlapping [data-lang] elements; refusing to guess');
}
for (const e of edits.reverse()) {
    html = html.slice(0, e.from) + e.text + html.slice(e.to);
}

fs.writeFileSync(htmlPath, html);
console.log(`prerender-ka: wrote ${edits.length} Georgian strings into index.html`);
if (missing.size) console.warn(`prerender-ka: no "ge" translation for: ${[...missing].join(', ')}`);
