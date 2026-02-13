/**
 * useIframeSelector
 *
 * Extracted from ~/Desktop/dentist-landing-page/components/HtmlPreview.tsx.
 * Provides hover/click selection of alloro-tpl-* elements inside an iframe.
 *
 * Uses event delegation on the iframe body so listeners survive DOM mutations
 * (critical for live editing — we mutate the iframe DOM directly after LLM edits).
 */

import { useCallback, useRef, useState } from "react";

const ALLORO_PREFIX = "alloro-tpl-";

export interface SelectedInfo {
  alloroClass: string;
  label: string;
  type: "section" | "component";
  outerHtml: string;
}

/** Walk up from a target element to find the nearest alloro-classed ancestor (or self). */
function findAlloroElement(el: Element | null): Element | null {
  while (el) {
    if (getAlloroClass(el)) return el;
    el = el.parentElement;
  }
  return null;
}

export function getAlloroClass(el: Element): string | null {
  for (const cls of el.classList) {
    if (cls.startsWith(ALLORO_PREFIX)) return cls;
  }
  return null;
}

export function isComponent(alloroClass: string): boolean {
  return alloroClass.includes("-component-");
}

export function getReadableLabel(alloroClass: string): string {
  return alloroClass.replace(/^alloro-tpl-[a-f0-9]+-/, "");
}

/** Strip CSP meta tags so external resources (fonts, CSS, images) load in the iframe. */
export function prepareHtmlForPreview(html: string): string {
  return html.replace(
    /<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi,
    ""
  );
}

/** CSS injected into the iframe to enable the selector UX. */
const SELECTOR_CSS = `
  /* Kill native interactivity */
  a, button, form, input, select, textarea {
    pointer-events: none !important;
    cursor: default !important;
  }
  a { color: inherit !important; text-decoration: inherit !important; }

  /* Allow alloro-labeled elements to receive pointer events */
  [class*="${ALLORO_PREFIX}"] {
    pointer-events: auto !important;
    cursor: pointer !important;
  }

  /* Keep hidden/invisible overlays from intercepting events */
  [class*="${ALLORO_PREFIX}"].pointer-events-none,
  [class*="${ALLORO_PREFIX}"][style*="display: none"],
  [class*="${ALLORO_PREFIX}"][style*="display:none"] {
    pointer-events: none !important;
  }

  /* Hover highlight */
  [data-alloro-hover="true"] {
    outline: 2px dashed #3b82f6 !important;
    outline-offset: 6px !important;
  }

  /* Selected highlight */
  [data-alloro-selected="true"] {
    outline: 2px solid #2563eb !important;
    outline-offset: 6px !important;
  }

  /* Both hover and selected — selected wins */
  [data-alloro-selected="true"][data-alloro-hover="true"] {
    outline: 2px solid #2563eb !important;
  }

  /* Label injected into the DOM */
  .alloro-label {
    position: absolute;
    top: -26px;
    left: 0;
    z-index: 99999;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    line-height: 20px;
  }
  .alloro-label--section { background: #7c3aed; color: white; }
  .alloro-label--component { background: #2563eb; color: white; }
  .alloro-label--selected-section { background: #5b21b6; color: white; }
  .alloro-label--selected-component { background: #1d4ed8; color: white; }
`;

export function useIframeSelector(
  iframeRef: React.RefObject<HTMLIFrameElement | null>
) {
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo | null>(null);
  const currentHoveredComponentRef = useRef<Element | null>(null);

  const clearSelection = useCallback(() => {
    setSelectedInfo(null);
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    doc
      .querySelectorAll("[data-alloro-selected]")
      .forEach((el) => el.removeAttribute("data-alloro-selected"));
    const selectedLabel = doc.getElementById("alloro-selected-label");
    if (selectedLabel) selectedLabel.remove();
  }, [iframeRef]);

  const setupListeners = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;
    const doc = iframe.contentDocument;

    // Inject selector CSS
    const style = doc.createElement("style");
    style.id = "alloro-selector-styles";
    style.textContent = SELECTOR_CSS;
    doc.head.appendChild(style);

    // Label helpers
    function showLabel(
      el: Element,
      cls: string,
      variant: "hover" | "selected"
    ) {
      const labelId =
        variant === "hover" ? "alloro-hover-label" : "alloro-selected-label";
      let label = doc.getElementById(labelId);
      if (!label) {
        label = doc.createElement("div");
        label.id = labelId;
        label.className = "alloro-label";
        doc.body.appendChild(label);
      }

      const elType = isComponent(cls) ? "component" : "section";
      label.textContent = getReadableLabel(cls);
      label.className =
        "alloro-label alloro-label--" +
        (variant === "selected" ? "selected-" : "") +
        elType;

      const rect = el.getBoundingClientRect();
      const scrollTop =
        doc.documentElement.scrollTop || doc.body.scrollTop;
      const scrollLeft =
        doc.documentElement.scrollLeft || doc.body.scrollLeft;
      label.style.position = "absolute";
      label.style.top = rect.top + scrollTop - 26 + "px";
      label.style.left = rect.left + scrollLeft + "px";
    }

    function hideLabel(variant: "hover" | "selected") {
      const labelId =
        variant === "hover" ? "alloro-hover-label" : "alloro-selected-label";
      const label = doc.getElementById(labelId);
      if (label) label.remove();
    }

    // Event delegation on the body — survives DOM mutations
    doc.body.addEventListener("mouseover", (e) => {
      const target = findAlloroElement(e.target as Element);
      if (!target) return;
      const cls = getAlloroClass(target)!;
      const elIsComponent = isComponent(cls);

      if (elIsComponent) {
        currentHoveredComponentRef.current = target;
        doc
          .querySelectorAll("[data-alloro-hover]")
          .forEach((el) => el.removeAttribute("data-alloro-hover"));
        target.setAttribute("data-alloro-hover", "true");
        showLabel(target, cls, "hover");
      } else {
        if (!currentHoveredComponentRef.current) {
          doc
            .querySelectorAll("[data-alloro-hover]")
            .forEach((el) => el.removeAttribute("data-alloro-hover"));
          target.setAttribute("data-alloro-hover", "true");
          showLabel(target, cls, "hover");
        }
      }
    });

    doc.body.addEventListener("mouseout", (e) => {
      const target = findAlloroElement(e.target as Element);
      if (!target) return;
      const cls = getAlloroClass(target)!;

      target.removeAttribute("data-alloro-hover");
      if (isComponent(cls)) {
        currentHoveredComponentRef.current = null;
        hideLabel("hover");
      } else {
        if (!currentHoveredComponentRef.current) {
          hideLabel("hover");
        }
      }
    });

    doc.body.addEventListener("click", (e) => {
      const target = findAlloroElement(e.target as Element);
      if (!target) return;
      const cls = getAlloroClass(target)!;
      const elIsComponent = isComponent(cls);

      if (elIsComponent) {
        e.stopPropagation();
      }
      e.preventDefault();

      // Clear previous selection
      doc
        .querySelectorAll("[data-alloro-selected]")
        .forEach((el) => el.removeAttribute("data-alloro-selected"));

      target.setAttribute("data-alloro-selected", "true");
      showLabel(target, cls, "selected");

      setSelectedInfo({
        alloroClass: cls,
        label: getReadableLabel(cls),
        type: elIsComponent ? "component" : "section",
        outerHtml: (target as HTMLElement).outerHTML,
      });
    });
  }, [iframeRef]);

  return { selectedInfo, setSelectedInfo, clearSelection, setupListeners };
}
