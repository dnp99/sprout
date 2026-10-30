import { describe, expect, it } from "vitest";
import IntlMessageFormat from "intl-messageformat";
import english from "@/messages/en-CA.json";
import simplified from "@/messages/zh-Hans.json";
import traditional from "@/messages/zh-Hant.json";

type Catalog = { [key: string]: string | Catalog };
function flatten(catalog: Catalog, prefix = ""): Record<string, string> {
  return Object.fromEntries(
    Object.entries(catalog).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === "string" ? [[path, value]] : Object.entries(flatten(value, path));
    }),
  );
}

// Translating plural/ordinal prose may simplify the ICU shape for Chinese,
// but callers still supply the same interpolation values and rich-text tags.
function placeholders(message: string): string[] {
  const found = new Set<string>();
  function visit(nodes: ReturnType<IntlMessageFormat["getAst"]>) {
    for (const node of nodes) {
      if (node.type === 8) {
        found.add(`<${node.value}>`);
        visit(node.children);
      } else if (node.type !== 0 && node.type !== 7) {
        found.add(node.value);
        if (node.type === 5 || node.type === 6) {
          for (const option of Object.values(node.options)) visit(option.value);
        }
      }
    }
  }
  visit(new IntlMessageFormat(message).getAst());
  return [...found].sort();
}

describe.each([
  ["zh-Hans", simplified],
  ["zh-Hant", traditional],
] as const)("%s catalog", (locale, catalog) => {
  it("covers every source message with valid ICU and identical caller arguments", () => {
    const source = flatten(english);
    const translated = flatten(catalog);
    expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort());
    for (const [key, message] of Object.entries(translated)) {
      expect(message.trim(), key).not.toBe("");
      expect(() => new IntlMessageFormat(message, locale), key).not.toThrow();
      expect(placeholders(message), key).toEqual(placeholders(source[key]));
    }
  });
});
