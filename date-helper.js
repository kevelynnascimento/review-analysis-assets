/* eslint-env browser */
/* global dateFns */
/* eslint-disable no-param-reassign */

/**
 * DateHelpers
 * Utilities to parse and format dates for the Review Analysis PDF.
 *
 * Important:
 * - date-fns is loaded from the CDN and exposed as the global `dateFns` object.
 * - We adjust parsed dates by the local timezone offset to preserve the original
 *   UTC calendar day when formatting (e.g., 2025-07-01T00:00:00.000Z -> 07-01-2025
 *   in any browser timezone).
 */
(function DateHelperBootstrap() {
  /**
   * Converts an arbitrary input into a valid Date instance.
   * Tries dateFns.parseISO for ISO strings, then falls back to new Date(input).
   * Returns null if parsing fails.
   * @param {string|number|Date} input
   * @returns {Date|null}
   */
  const toDate = (input) => {
    if (!input) return null;
    let parsedDate = null;
    if (typeof dateFns?.parseISO === 'function') {
      parsedDate = dateFns.parseISO(input);
    }
    if (!(parsedDate instanceof Date) || Number.isNaN(parsedDate.getTime())) {
      parsedDate = new Date(input);
    }
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  /**
   * Formats a date string while preserving its UTC calendar day.
   *
   * Why adjust by timezone offset?
   * - ISO strings like `2025-07-01T00:00:00.000Z` represent midnight UTC.
   * - When converted to a local Date, users west of UTC may see the previous
   *   local day (e.g., June 30). Adding the local timezone offset (in minutes)
   *   normalizes the value so the formatted output reflects the original UTC day.
   *
   * @param {string|number|Date} input Input date (ISO string, epoch, etc.).
   * @param {string} [pattern='MM-dd-yyyy'] date-fns format pattern.
   * @returns {string|null}
   */
  const formatISODateAsUTCDay = (input, pattern = 'MM-dd-yyyy') => {
    const date = toDate(input);
    if (!date) return null;
    // Preserve the UTC calendar day when formatting in local timezone
    const adjustedUtcPreservedDate = new Date(
      date.getTime() + date.getTimezoneOffset() * 60000,
    );
    try {
      return dateFns.format(adjustedUtcPreservedDate, pattern);
    } catch (error) {
      return null;
    }
  };

  /**
   * Formats a <time> (or any element) in-place using its `datetime` attribute
   * or text content as the source date, preserving the UTC day.
   * @param {HTMLElement|null} element Element with a date value.
   * @param {string} [pattern='MM-dd-yyyy'] date-fns format pattern.
   */
  const formatElement = (element, pattern = 'MM-dd-yyyy') => {
    if (!element) return;
    const datetimeAttr = element.getAttribute('datetime');
    const elementText = element.textContent?.trim();
    const rawInput = datetimeAttr || elementText;
    const formattedText = formatISODateAsUTCDay(rawInput, pattern);
    if (formattedText) element.textContent = formattedText;
  };

  /**
   * Finds the header <time> elements (#start-date and #end-date)
   * and formats them with the provided pattern.
   * @param {string} [pattern='MM-dd-yyyy'] date-fns format pattern.
   */
  const formatHeaderDates = (pattern = 'MM-dd-yyyy') => {
    const startDateElement = document.getElementById('start-date');
    const endDateElement = document.getElementById('end-date');
    formatElement(startDateElement, pattern);
    formatElement(endDateElement, pattern);
  };

  // Expose helpers globally for reuse elsewhere in the template/scripts
  window.DateHelpers = {
    formatISODateAsUTCDay,
    formatElement,
    formatHeaderDates,
  };

  // Auto-format the header dates once the DOM is ready
  document.addEventListener('DOMContentLoaded', function onDomReady() {
    formatHeaderDates();
  });
})();
