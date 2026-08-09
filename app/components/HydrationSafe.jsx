"use client";

import { useEffect } from "react";

/**
 * HydrationSafe – a client-only component that strips browser-extension-injected
 * attributes from the DOM BEFORE React hydration runs its comparison.
 *
 * Common problematic attributes added by extensions:
 *   - cz-shortcut-listen (Caret / GoFullPage extensions)
 *   - fdprocessedid (Form Detector / various form-filling extensions)
 *   - data-* injected by Grammarly, LastPass, Bitwarden, etc.
 *
 * This component must be a direct child of <body> and use useEffect
 * to clean up these attributes on the first client-side paint.
 */
export default function HydrationSafe() {
  useEffect(() => {
    // List of known extension-injected attribute prefixes/names to remove
    const unwantedAttributes = [
      "cz-shortcut-listen",
      "fdprocessedid",
      "data-gr-ext-installed",
      "data-lt-installed",
      "data-lp-injected",
      "data-lpb-injected",
      "data-bw-injected",
      "data-new-gr-c-s-check-loaded",
      "data-gr-c-s-loaded",
      "data-dashlane-observed",
      "data-dashlane-autofill",
      "data-dashlane-show",
      "data-dashlane-responsive",
      "data-gtm-",
    ];

    // Clean the <body> element and all its descendants
    function cleanElementAttributes(element) {
      if (!element || element.nodeType !== 1) return; // Only process Element nodes

      const attrs = element.attributes;
      if (!attrs) return;

      // Collect attribute names to remove (can't modify while iterating)
      const toRemove = [];
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attrName = attrs[i].name;
        if (
          unwantedAttributes.includes(attrName) ||
          unwantedAttributes.some((prefix) => attrName.startsWith(prefix))
        ) {
          toRemove.push(attrName);
        }
      }

      // Remove unwanted attributes
      toRemove.forEach((name) => element.removeAttribute(name));

      // Recursively clean children
      for (let i = 0; i < element.children.length; i++) {
        cleanElementAttributes(element.children[i]);
      }
    }

    // Run the cleanup immediately on mount (before hydration finishes for child components)
    cleanElementAttributes(document.body);
  }, []);

  // This component renders nothing
  return null;
}

