/** Renders schema.org JSON-LD. `<` is escaped so data can never close the script tag. */
export function JsonLd({ data }: { data: object | object[] | null | undefined }) {
  if (!data) return null;
  const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (c) => (c === "\u2028" ? "\\u2028" : "\\u2029"));
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
