import fs from "fs";
import path from "path";
import OrgLang from "../orglang.js";
import P from "parsimmon";

const _ = P.optWhitespace;

function oneOf(x, ys) {
  return ys.some((y) => x === y);
}

test("keywords", () => {
  const keywordfile = fs
    .readFileSync(path.join(__dirname, "./keywords.org"), "utf-8")
    .trim();
  const result = OrgLang.KeyWord.sepBy(P.regexp(/\n+/)).tryParse(keywordfile);
  expect(result).toHaveLength(3);
  expect(result[0].name).toBe("OPTIONS");
  expect(result[0].value).toBe("toc:nil");
});

test("headers", () => {
  const headersfile = fs
    .readFileSync(path.join(__dirname, "./headers.org"), "utf-8")
    .trim();
  const result = OrgLang.Header.sepBy(P.regexp(/\n/))
    .trim(_)
    .tryParse(headersfile);
  expect(result).toHaveLength(4);
  expect(result[0].level).toBe(1);
  expect(result[1].level).toBe(2);
  expect(result[1].keyword).toBe("TODO");
  expect(result[1].value).not.toContain("TODO");
  expect(result[2].level).toBe(3);
  expect(result[3].level).toBe(4);
});

test("properties", () => {
  const propertiesfile = fs
    .readFileSync(path.join(__dirname, "./properties.org"), "utf-8")
    .trim();
  const result = P.alt(OrgLang.Properties, OrgLang.Header, OrgLang.Paragraph)
    .sepBy(P.regexp(/((\n+)(\s*))+/))
    .tryParse(propertiesfile);
  expect(result[1].value.url).toBe("https://www.test.com");
});

test("paragraphs", () => {
  const paragraphsfile = fs
    .readFileSync(path.join(__dirname, "./paragraphs.org"), "utf-8")
    .trim();
  const result = OrgLang.Paragraph.sepBy(P.regexp(/\n\n/))
    .trim(_)
    .tryParse(paragraphsfile);
  expect(result).toHaveLength(5);
});

test("quotes", () => {
  const quotesfile = fs
    .readFileSync(path.join(__dirname, "./quotes.org"), "utf-8")
    .trim();
  const result = OrgLang.Quote.sepBy(P.regexp(/\n\n/))
    .trim(_)
    .tryParse(quotesfile);
  expect(result).toHaveLength(2);
});

// test("lists", () => {
//   const listsfile = fs.readFileSync(
//     path.join(__dirname, "./lists.org"),
//     "utf-8"
//   );
//   const result = P.alt(OrgLang.ListItem, OrgLang.DescriptiveListItem)
//     .sepBy(P.regexp(/((\n+)(\s*))+/))
//     .tryParse(listsfile);
//   expect(result).toHaveLength(3);
// });

test("file", () => {
  const orgfilefile = fs
    .readFileSync(path.join(__dirname, "./orgfile.org"), "utf-8")
    .trim();
  const result = OrgLang.File.tryParse(orgfilefile);
  expect(result).toHaveLength(11);
  result.forEach((r) => {
    expect(
      oneOf(r.type, ["header", "keyword", "paragraph", "quote", "properties"])
    ).toBeTruthy();
  });
});
