import type { Section } from "../api/templates";

/**
 * Unwrap sections whether stored as Section[] or { sections: Section[] }.
 * N8N writes directly to the DB with the wrapped format; our API writes the bare array.
 */
export function normalizeSections(raw: unknown): Section[] {
  if (Array.isArray(raw)) return raw;
  if (
    raw &&
    typeof raw === "object" &&
    "sections" in raw &&
    Array.isArray((raw as { sections: unknown }).sections)
  ) {
    return (raw as { sections: Section[] }).sections;
  }
  return [];
}

/**
 * Assemble a full HTML page from template parts.
 *
 * wrapper.replace('{{slot}}', header + sections + footer)
 *
 * @param sectionFilter – optional list of section names to include (omit for all)
 */
export function renderPage(
  wrapper: string,
  header: string,
  footer: string,
  sections: Section[],
  sectionFilter?: string[]
): string {
  const sectionsToRender = sectionFilter
    ? sections.filter((s) => sectionFilter.includes(s.name))
    : sections;

  const mainContent = sectionsToRender.map((s) => s.content).join("\n");
  const pageContent = [header, mainContent, footer].join("\n");
  return wrapper.replace("{{slot}}", pageContent);
}

/**
 * Parse a JS expression that returns a Section[].
 * Supports backtick template literals for content values.
 * Falls back to JSON.parse for strict JSON input.
 */
export function parseSectionsJs(input: string): Section[] {
  try {
    return JSON.parse(input);
  } catch {
    // Fall back to JS eval for backtick template literal syntax
    // eslint-disable-next-line no-new-func
    const result = new Function(`"use strict"; return (${input});`)();
    if (!Array.isArray(result)) throw new Error("Sections must be an array");
    return result as Section[];
  }
}

/**
 * Serialize sections to JS format with backtick content values.
 * This is the inverse of parseSectionsJs — produces human-friendly
 * editor content where HTML doesn't need quote escaping.
 */
export function serializeSectionsJs(sections: Section[]): string {
  if (sections.length === 0) return "[]";

  const entries = sections.map((s) => {
    const escaped = s.content
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
    return `  {\n    "name": "${s.name}",\n    "content": \`${escaped}\`\n  }`;
  });
  return `[\n${entries.join(",\n")}\n]`;
}
