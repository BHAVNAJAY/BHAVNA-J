/**
 * Base path of the deployed site. Empty locally and on a root domain;
 * "/BHAVNA-J" when published as a GitHub Pages project site (set by the deploy workflow).
 * Anything that points at a file in /public must go through withBase().
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => (path && path.startsWith("/") && !path.startsWith("//") ? BASE_PATH + path : path);
