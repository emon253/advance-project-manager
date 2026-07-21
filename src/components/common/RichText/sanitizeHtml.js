/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Allowlist HTML sanitizer — the XSS boundary for all rich-text content.
 *
 * Rich descriptions are authored as HTML (contentEditable) and viewed by other
 * workspace members, so stored markup is untrusted on render. This strips
 * everything outside a tiny formatting allowlist: disallowed elements are
 * unwrapped (their text survives, the tag doesn't), every attribute is dropped
 * except a validated href on links. Run it on the editor's output before
 * storing AND on every view render, so even legacy or tampered data is safe.
 */

// Inline + block formatting a WYSIWYG toolbar can produce. No style/class/id,
// no media, no scriptable elements.
const ALLOWED_TAGS = new Set([
  "p", "div", "br",
  "strong", "b", "em", "i", "u", "s", "strike",
  "ul", "ol", "li",
  "blockquote", "h3", "h4",
  "code", "pre", "a",
]);

// Only links carry an attribute, and only a safe-protocol href.
const SAFE_HREF = /^(https?:|mailto:)/i;

function sanitizeElement(el, doc) {
  // Walk children first (snapshot: unwrapping mutates the live child list).
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) sanitizeElement(child, doc);
  }

  const tag = el.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) {
    // Unwrap: replace the element with its (already-sanitized) children so the
    // text content is preserved but the tag — and any handlers — are gone.
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
    return;
  }

  // Strip every attribute, then reinstate a validated href for links.
  const href = tag === "a" ? el.getAttribute("href") : null;
  for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name);
  if (tag === "a") {
    if (href && SAFE_HREF.test(href.trim())) {
      el.setAttribute("href", href.trim());
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer nofollow");
    } else {
      // A link with no safe destination becomes a plain span-of-text (unwrap).
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    }
  }
}

export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== "string") return "";
  const doc = new DOMParser().parseFromString(`<body>${dirty}</body>`, "text/html");
  const body = doc.body;
  for (const child of Array.from(body.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) sanitizeElement(child, doc);
  }
  return body.innerHTML;
}

/** Rendered text with tags removed — for previews and length/empty checks. */
export function richTextToPlain(html) {
  if (!html || typeof html !== "string") return "";
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  return (doc.body.textContent || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/** True when the markup carries no visible text (handles "", "<p><br></p>", etc.). */
export function isRichTextEmpty(html) {
  return richTextToPlain(html).length === 0;
}

/** Wrap plain text as safe rich-text HTML (blank lines split paragraphs). */
export function plainToRichText(text) {
  if (!text || typeof text !== "string") return "";
  const escape = (s) => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${escape(block.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
