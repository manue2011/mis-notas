// Shared by the server query and the client-side highlighting of results.

const MAX_TERMS = 8;

/** Lower case without accents, one character for one character (so offsets still line up). */
export function foldText(text: string): string {
  return Array.from(text, (char) => char.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()[0] ?? char).join("");
}

/** The words of a search, folded, without repeats. */
export function searchTerms(query: string): string[] {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  return [...new Set(words)].slice(0, MAX_TERMS);
}

/** Splits `text` into plain and matching parts, for <mark>-ing the matches. */
export function highlightParts(text: string, terms: string[]): { text: string; match: boolean }[] {
  const chars = Array.from(text);
  const folded = Array.from(foldText(text));
  const marked = new Array<boolean>(chars.length).fill(false);
  for (const term of terms) {
    const needle = Array.from(term);
    for (let i = 0; i + needle.length <= folded.length; i++) {
      if (needle.every((c, j) => folded[i + j] === c)) marked.fill(true, i, i + needle.length);
    }
  }

  const parts: { text: string; match: boolean }[] = [];
  chars.forEach((char, i) => {
    const last = parts[parts.length - 1];
    if (last && last.match === marked[i]) last.text += char;
    else parts.push({ text: char, match: marked[i] });
  });
  return parts;
}
