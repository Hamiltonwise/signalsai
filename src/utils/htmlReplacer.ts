/**
 * HTML Replacement Utilities
 *
 * DOM-based replacement for alloro-tpl components.
 * Mutates the iframe DOM directly to avoid page flash,
 * then serializes back to string for persistence.
 */

import type { Section } from "../api/templates";

/**
 * Replace a component's HTML directly in the iframe DOM.
 * Returns the serialized full-page HTML string for persistence.
 *
 * This mutates the live DOM — no srcDoc re-render needed.
 */
export function replaceComponentInDom(
  iframeDoc: Document,
  alloroClass: string,
  newOuterHtml: string
): { html: string; matchCount: number } {
  const matches = iframeDoc.querySelectorAll(
    `[class*="${alloroClass}"]`
  );

  if (matches.length === 0) {
    throw new Error(`No element found with class "${alloroClass}"`);
  }

  if (matches.length > 1) {
    console.warn(
      `[htmlReplacer] Found ${matches.length} elements with class "${alloroClass}". Replacing first match.`
    );
  }

  // Replace the first match in the live DOM
  const target = matches[0] as HTMLElement;
  target.outerHTML = newOuterHtml;

  // Serialize the full document back to string
  const html = serializeDocument(iframeDoc);

  return { html, matchCount: matches.length };
}

/**
 * String-based replacement via DOMParser (for cases where we don't have iframe access).
 */
export function replaceComponentHtml(
  fullHtml: string,
  alloroClass: string,
  newOuterHtml: string
): { html: string; matchCount: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(fullHtml, "text/html");

  const matches = doc.querySelectorAll(`[class*="${alloroClass}"]`);

  if (matches.length === 0) {
    throw new Error(`No element found with class "${alloroClass}"`);
  }

  if (matches.length > 1) {
    console.warn(
      `[htmlReplacer] Found ${matches.length} elements with class "${alloroClass}". Replacing first match.`
    );
  }

  const target = matches[0] as HTMLElement;
  target.outerHTML = newOuterHtml;

  return { html: serializeDocument(doc), matchCount: matches.length };
}

/**
 * Validate that an HTML string is parseable and doesn't contain obvious errors.
 */
export function validateHtml(html: string): { valid: boolean; error?: string } {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      return {
        valid: false,
        error: `HTML parse error: ${parseError.textContent}`,
      };
    }

    // Check that there's actual content (not just empty body)
    if (!doc.body || doc.body.innerHTML.trim().length === 0) {
      return { valid: false, error: "HTML produced empty content" };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Unknown parse error",
    };
  }
}

/**
 * Extract the alloro-tpl class from a section's stored content HTML.
 * Parses the root element and finds the first class that starts with "alloro-tpl-".
 */
function extractAlloroClass(sectionContent: string): string | null {
  const match = sectionContent.match(/class="([^"]*?)"/);
  if (!match) return null;
  const classes = match[1].split(/\s+/);
  return classes.find((c) => c.startsWith("alloro-tpl-")) ?? null;
}

/**
 * Extract updated section content from the iframe DOM after a mutation.
 *
 * Strategy: parse each section's stored content HTML to extract the actual
 * alloro-tpl class from its root element, then use that exact class to find
 * the element in the iframe DOM. This avoids relying on section.name matching
 * the DOM class — N8N-generated names can be more descriptive than the CSS
 * class identifiers (e.g., "section-legacy-software" vs "section-legacy").
 *
 * Falls back to the original section content if no matching element is found.
 */
export function extractSectionsFromDom(
  iframeDoc: Document,
  currentSections: Section[]
): Section[] {
  return currentSections.map((section) => {
    // Extract the actual alloro-tpl class from the section's stored HTML content
    const alloroClass = extractAlloroClass(section.content);

    if (!alloroClass) {
      console.warn(`[extractSections] "${section.name}" → no alloro-tpl class found in stored content`);
      return section;
    }

    const el = iframeDoc.querySelector(`.${CSS.escape(alloroClass)}`);

    if (el) {
      return { ...section, content: el.outerHTML };
    }

    console.warn(`[extractSections] "${section.name}" → no DOM match for class "${alloroClass}"`);
    return section;
  });
}

/**
 * Serialize a Document back to a full HTML string.
 * Clones the document and strips editor artifacts before serializing
 * so the live iframe keeps its selector UX intact.
 */
function serializeDocument(doc: Document): string {
  const clone = doc.documentElement.cloneNode(true) as HTMLElement;

  // Strip injected editor styles
  clone.querySelector("#alloro-selector-styles")?.remove();

  // Strip injected label divs and action panel
  clone.querySelector("#alloro-hover-label")?.remove();
  clone.querySelector("#alloro-selected-label")?.remove();
  clone.querySelector("#alloro-action-panel")?.remove();

  // Strip editor data attributes from all elements
  clone
    .querySelectorAll("[data-alloro-hover]")
    .forEach((el) => el.removeAttribute("data-alloro-hover"));
  clone
    .querySelectorAll("[data-alloro-selected]")
    .forEach((el) => el.removeAttribute("data-alloro-selected"));

  const doctype = doc.doctype;
  const doctypeStr = doctype
    ? `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ""}${doctype.systemId ? ` "${doctype.systemId}"` : ""}>`
    : "<!DOCTYPE html>";

  return doctypeStr + "\n" + clone.outerHTML;
}
