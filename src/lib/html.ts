// lib/html.ts
//
// Greenhouse's public Job Board API returns job `content` as HTML that's
// already been entity-escaped at least once (e.g. "&lt;div&gt;" instead of
// "<div>"). Rendering that directly via dangerouslySetInnerHTML shows the
// escaped tags as literal visible text instead of formatted HTML — this
// decodes entities first so the real markup renders correctly.
//
// Some content comes back double-escaped, not just once: a named entity
// the original author typed (e.g. an em dash stored as "&mdash;") gets its
// own "&" escaped again by Greenhouse's pipeline into "&amp;mdash;". A
// single decode pass only resolves the outer layer ("&amp;" -> "&"),
// leaving literal "&mdash;" text behind instead of a real character --
// confirmed live on a real posting where this broke salary-range parsing
// (the "$155,000 &mdash; $175,000" text never matched a dash pattern).
// decodeHtmlEntities loops until the string stops changing so any depth of
// escaping resolves, not just one level.

const NAMED_ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  amp: "&",
  quot: '"',
  apos: "'",
  nbsp: " ",
  // Rich-text editors (Greenhouse's included) routinely emit these for
  // punctuation -- missing any of them means the entity survives as
  // literal "&mdash;"-style text instead of decoding, in both rendered
  // descriptions and anything (like salary parsing) that scans the text.
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  trade: "™",
  copy: "©",
  reg: "®",
  deg: "°",
  times: "×",
  divide: "÷",
  plusmn: "±",
};

function decodeOnce(input: string): string {
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

export function decodeHtmlEntities(input: string): string {
  if (!input) return input;
  let result = input;
  // Capped, not unbounded -- real content is escaped at most a couple of
  // levels deep; a cap avoids ever looping on adversarial input, and
  // stops immediately once a pass makes no further change.
  for (let i = 0; i < 4; i++) {
    const next = decodeOnce(result);
    if (next === result) break;
    result = next;
  }
  return result;
}
