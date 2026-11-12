import { extractSearchText } from "./content";

// What changed from one version of a page to the next, block by block.
// Blocks keep their id while edited (BlockNote and Yjs carry it), so they
// are paired by id first; a page rebuilt at once (tidied with AI, restored)
// gets new ids, so what's left is paired by being the same, then by sharing
// most of its words (changed). Children are compared on their own.

type Block = { id?: unknown; type?: unknown; props?: unknown; content?: unknown; children?: unknown };

export type BlockChange = "added" | "changed";

export type VersionDiff = {
  /** Block id → how it differs from the version before. */
  marks: Record<string, BlockChange>;
  /** The text of blocks the version before had and this one doesn't. */
  removed: string[];
  titleChanged: boolean;
};

const MAX_REMOVED = 20;
const MAX_REMOVED_LENGTH = 160;

/** Every block with an id, nested ones included, by id: its own part, without children. */
function byId(blocks: unknown, into = new Map<string, Block>()): Map<string, Block> {
  if (!Array.isArray(blocks)) return into;
  for (const block of blocks as Block[]) {
    if (typeof block?.id === "string") into.set(block.id, block);
    byId(block?.children, into);
  }
  return into;
}

const own = (block: Block) => JSON.stringify([block.type, block.props, block.content]);

const textOf = (block: Block) => extractSearchText([{ ...block, children: [] }]).trim();

const wordSet = (text: string) => new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu));

/** Share of words two texts have in common (0 to 1). */
function likeness(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared++;
  return (2 * shared) / (a.size + b.size);
}

/** How alike two blocks' words must be to count as one block, changed. */
const MIN_LIKENESS = 0.5;

function removedText(block: Block): string {
  const text = textOf(block);
  if (text) return text.length > MAX_REMOVED_LENGTH ? `${text.slice(0, MAX_REMOVED_LENGTH - 1)}…` : text;
  return block.type === "screenshot" ? "Un pantallazo" : block.type === "table" ? "Una tabla" : "";
}

export function diffVersions(
  before: { title: string; content: unknown },
  after: { title: string; content: unknown },
): VersionDiff {
  const old = byId(before.content);
  const now = byId(after.content);
  const marks: Record<string, BlockChange> = {};
  const unpaired = new Map([...old].filter(([id]) => !now.has(id)));
  const fresh: [string, Block][] = [];
  for (const [id, block] of now) {
    const previous = old.get(id);
    if (!previous) fresh.push([id, block]);
    else if (own(previous) !== own(block)) marks[id] = "changed";
  }

  // The same block under a new id.
  const leftover: [string, Block][] = [];
  for (const [id, block] of fresh) {
    const same = [...unpaired].find(([, previous]) => own(previous) === own(block));
    if (same) unpaired.delete(same[0]);
    else leftover.push([id, block]);
  }

  // A block rewritten under a new id: the old one most like it.
  const oldWords = new Map([...unpaired].map(([id, block]) => [id, wordSet(textOf(block))]));
  for (const [id, block] of leftover) {
    const words = wordSet(textOf(block));
    let best: [string, number] | null = null;
    for (const [oldId, previous] of oldWords) {
      const score = likeness(words, previous);
      if (score >= MIN_LIKENESS && (!best || score > best[1])) best = [oldId, score];
    }
    if (best) {
      unpaired.delete(best[0]);
      oldWords.delete(best[0]);
      marks[id] = "changed";
    } else {
      marks[id] = "added";
    }
  }

  const removed = [...unpaired]
    .map(([, block]) => removedText(block))
    .filter(Boolean)
    .slice(0, MAX_REMOVED);
  return { marks, removed, titleChanged: before.title !== after.title };
}
