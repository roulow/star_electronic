/** @format */

// Builds the CSS for the theme colors edited in the dashboard.
// The doubled selectors keep these rules ahead of globals.css regardless of
// stylesheet order, matching the old behaviour of appending them last.
export function themeToCss(theme) {
  const declarations = (vars) =>
    Object.entries(vars || {})
      .filter(
        ([key, value]) =>
          /^[a-zA-Z0-9_-]+$/.test(key) &&
          (typeof value === "string" || typeof value === "number"),
      )
      // Values may only contain a CSS value, never break out of the rule or tag.
      .map(
        ([key, value]) => `--${key}: ${String(value).replace(/[<>{};]/g, "")};`,
      )
      .join("");

  const light = declarations(theme?.light);
  const dark = declarations(theme?.dark);
  if (!light && !dark) return "";
  return `:root:root{${light}}.dark.dark{${dark}}`;
}
