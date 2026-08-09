"use client";

/**
 * LoadingButton — A button that shows a spinner when loading and disables itself
 * to prevent double-submission. Works with any onClick that returns a promise.
 *
 * ## Props
 * - `loading` (boolean) — show spinner & disable
 * - `children` — the button text
 * - `onClick` — async handler (the button handles the catch for you)
 * - `spinnerSize` — size of the spinner in px (default 16)
 * - Plus any standard button props (type, className, disabled, etc.)
 *
 * ## Usage
 *
 *   // Auto-managed loading state (recommended):
 *   <LoadingButton onClick={async () => await saveData()}>
 *     Save
 *   </LoadingButton>
 *
 *   // Manually controlled loading state:
 *   <LoadingButton loading={isSaving} onClick={handleSave}>
 *     Save
 *   </LoadingButton>
 *
 *   // Inside a form:
 *   <LoadingButton type="submit" loading={isSubmitting}>
 *     Submit
 *   </LoadingButton>
 */

import { useState, useCallback } from "react";

export default function LoadingButton({
  children,
  onClick,
  loading: externalLoading,
  disabled,
  className = "",
  spinnerSize = 16,
  ...props
}) {
  // Internal loading state — used when no external loading prop is given
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleClick = useCallback(
    async (event) => {
      if (isLoading || disabled) return;

      // If no external loading prop, manage state internally
      if (externalLoading === undefined) {
        setInternalLoading(true);
        try {
          await onClick?.(event);
        } catch (error) {
          console.error("LoadingButton error:", error);
        } finally {
          setInternalLoading(false);
        }
      } else {
        // External loading — just call onClick
        try {
          await onClick?.(event);
        } catch (error) {
          console.error("LoadingButton error:", error);
        }
      }
    },
    [isLoading, disabled, onClick, externalLoading]
  );

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin"
          width={spinnerSize}
          height={spinnerSize}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {isLoading ? (
        <span>{typeof children === "string" ? children.replace(/Submit|Save|Create|Add|Delete/i, "").trim() || "Processing..." : "Processing..."}</span>
      ) : (
        children
      )}
    </button>
  );
}

