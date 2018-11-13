/**
 * Main utilities file. Contains a bunch of utility functions like "titleCase" and "percentOrNone".
 */

/**
 * Title Case function.
 *
 * Example of usage:
 *
 * ```
 * import { titleCase } from "../utils"
 * const str = 'foo';
 * console.log(titleCase(str));  // outputs "Foo"
 * ```
 *
 * @param {string} input
 * @return {string}
 */
export function titleCase(input: string): string {
  if (!input) {
    return '';
  } else {
    return input.replace(/\w\S*/g, (txt => txt[0].toUpperCase() + txt.substr(1).toLowerCase() ));
  }
}

/**
 * Outputs the input as a number shown with a percent sign, unless the input is
 * zero or not a valid number, in which case it outputs "none"
 *
 * @param {string} input
 * @return string
 */
export function percentOrNone(input: string): string {
  let n = parseFloat(input);
  if (n === 0 || isNaN(n)) {
    return 'none';
  } else {
    return n + "%";
  }
}