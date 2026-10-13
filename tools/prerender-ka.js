// Bakes the Georgian (`ge`) translations into the HTML:
//   index.html <- script.js (incl. the pricing cards, from its PRICING block)
//   terms.html <- terms-lang.js
//
// The pages are translated client-side, so without this every [data-lang]
// element ships empty (or with English fallback text) and crawlers that
// don't run JS — plus Google's first, pre-render pass — see a page with no
// Georgian content. The scripts still overwrite everything at runtime, so
// the rendered page is unchanged. Re-run after editing the `ge` translations
// or the prices:
//
//   npm run prerender:ka
//
// Safe to run repeatedly; it only rewrites element contents and the
// placeholder/content attributes that the scripts themselves would set.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

function loadTranslations(js, file) {
    const start = js.indexOf('const translations = {');
    const end = js.indexOf('let currentLang', start);
    if (start === -1 || end === -1) throw new Error(`translations block not found in ${file}`);
    return new Function(js.slice(start, end).replace('const translations =', 'return'))();
}

const escapeAttr = (s) => String(s).replace(/&(?!\w+;|#\d+;)/g, '&amp;').replace(/"/g, '&quot;');
const escapeText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Index of the closing tag that matches the opening tag ending at `from`.
function findClose(html, tag, from) {
    const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'gi');
    re.lastIndex = from;
    let depth = 1, m;
    while ((m = re.exec(html))) {
        depth += m[0].startsWith('</') ? -1 : 1;
        if (depth === 0) return m.index;
    }
    throw new Error(`unclosed <${tag}> at ${from}`);
}

// Applies non-overlapping {from, to, text} replacements.
function applyEdits(html, edits) {
    edits.sort((a, b) => a.from - b.from);
    for (let i = 1; i < edits.length; i++) {
        if (edits[i].from < edits[i - 1].to) throw new Error('overlapping [data-lang] elements; refusing to guess');
    }
    for (const e of [...edits].reverse()) html = html.slice(0, e.from) + e.text + html.slice(e.to);
    return html;
}

// [data-lang] -> element contents (mirrors `element.innerHTML = ...`),
// [data-lang-placeholder] -> placeholder="...", [data-lang-meta] -> content="..."
function bakeTranslations(html, ge, missing) {
    const edits = [];
    for (const m of html.matchAll(/<([a-z0-9]+)\b[^>]*\sdata-lang="([^"]+)"[^>]*>/gi)) {
        const [openTag, tag, key] = m;
        if (!(key in ge)) { missing.add(key); continue; }
        const innerStart = m.index + openTag.length;
        edits.push({ from: innerStart, to: findClose(html, tag, innerStart), text: ge[key] });
    }
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
    return { html: applyEdits(html, edits), count: edits.length };
}

// Pricing cards: prices, payment lines and the Mini promo text are computed
// by script.js from its PRICING block (between the @pricing-start/-end
// markers), so run that same code here and write the one-time-payment view.
// The filled elements carry the attribute last and bare, e.g.
// `<p class="price" data-price-point>990₾</p>`.
function bakePricing(html, js, ge) {
    const pStart = js.indexOf('// @pricing-start'), pEnd = js.indexOf('// @pricing-end');
    if (pStart === -1 || pEnd === -1) throw new Error('@pricing-start/@pricing-end markers not found in script.js');
    const { PRICING, cardPriceTexts } = new Function(`${js.slice(pStart, pEnd)}; return { PRICING, cardPriceTexts };`)();
    const edits = [];
    for (const m of html.matchAll(/<div class="(pricing-card[^"]*)" data-plan-id="([^"]+)">/g)) {
        const [openTag, cls, planId] = m;
        if (!PRICING.packages[planId]) continue;
        const bodyStart = m.index + openTag.length;
        const closeAt = findClose(html, 'div', bodyStart);
        const texts = cardPriceTexts(planId, 'onetime', 'ge', ge);
        const fills = { 'data-price-point': texts.price, 'data-billing-period': texts.period, 'data-price-old': texts.regular, 'data-mini-deadline': texts.promoEnd };
        let body = html.slice(bodyStart, closeAt);
        for (const [attr, text] of Object.entries(fills)) {
            body = body.replace(new RegExp(`(<[a-z0-9]+\\b[^>]*\\s${attr}>)[^<]*(</)`, 'i'), (_, open, close) => open + escapeText(text) + close);
        }
        const classes = cls.split(/\s+/).filter(c => c !== 'promo-active').concat(texts.onPromo ? ['promo-active'] : []);
        edits.push({ from: m.index, to: closeAt, text: `<div class="${classes.join(' ')}" data-plan-id="${planId}">${body}` });
    }
    return { html: applyEdits(html, edits), count: edits.length };
}

for (const [htmlFile, jsFile] of [['index.html', 'script.js'], ['terms.html', 'terms-lang.js']]) {
    const js = read(jsFile);
    const ge = loadTranslations(js, jsFile).ge;
    const missing = new Set();
    let { html, count } = bakeTranslations(read(htmlFile), ge, missing);
    let cards = 0;
    if (jsFile === 'script.js') ({ html, count: cards } = bakePricing(html, js, ge));
    fs.writeFileSync(path.join(root, htmlFile), html);
    console.log(`prerender-ka: wrote ${count} Georgian strings${cards ? ` and ${cards} pricing cards` : ''} into ${htmlFile}`);
    if (missing.size) console.warn(`prerender-ka: no "ge" translation in ${jsFile} for: ${[...missing].join(', ')}`);
}
