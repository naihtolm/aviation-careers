// lib/html.ts
//
// Greenhouse's public Job Board API returns job `content` as HTML that's
// already been entity-escaped once (e.g. "&lt;div&gt;" instead of "<div>").
// Rendering that directly via dangerouslySetInnerHTML shows the escaped
// tags as literal visible text instead of formatted HTML — this decodes
// one level of entities first so the real markup renders correctly.

const NAMED_ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  amp: "&",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeHtmlEntities(input: string): string {
  if (!input) return input;
  return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity[0] === "#") {
      const code = entity[1] === "x" || entity[1] === "X" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}
