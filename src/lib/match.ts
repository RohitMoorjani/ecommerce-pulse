const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Matched case-sensitively, so ordinary words don't count:
//  - single capitalized words (Target, Prime, Surface, Apple): not "target"
//  - short all-caps terms (PC, HP, DTC, LLM): not "pc" (Indian outlets write
//    "pc" for percent) or "hp" (horsepower)
// Everything else is case-insensitive.
const isProperNoun = (k: string) =>
  /^[A-Z][a-z]+\+?$/.test(k) || /^[A-Z][A-Z0-9&]{1,4}s?\+?$/.test(k);

function toRegex(keyword: string) {
  return new RegExp(
    `(?<![\\w-])${escapeRegex(keyword)}(?![\\w-])`,
    isProperNoun(keyword) ? "" : "i",
  );
}

/** Returns the keywords from the list that appear in the text. */
export function compileMatcher(keywords: string[]) {
  const compiled = keywords.map((k) => ({ keyword: k, re: toRegex(k) }));
  return (text: string) =>
    compiled.filter(({ re }) => re.test(text)).map(({ keyword }) => keyword);
}
