import * as Fs from "fs";
import assert from "assert";
import * as Path from "path";
import { splitWhen } from "ramda";

import OrgLang from "./orglang.js";

function toSections(orgcst) {
  if (!orgcst.length) return [];
  const [header, ...rest] = orgcst;
  assert(header.type === "header");
  let [section, nextCst] = splitWhen((n) => n.type === "header", rest);
  const sectionAst = {
    type: "section",
    header,
    properties: null,
    content: section,
    subSection: null,
  };
  if (section[0].type === "properties") {
    sectionAst.properties = section[0];
    section = sectionAst.content = section.slice(1);
  }
  const nextHeader = nextCst[0];
  if (nextHeader?.level > header.level) {
    const nextSameLevelHeaderIndex = nextCst.findIndex(
      (n) => n.type === "header" && n.level === header.level
    );
    sectionAst.subSection = toSections(
      nextCst.slice(0, nextSameLevelHeaderIndex)
    );
    nextCst = nextCst.slice(nextSameLevelHeaderIndex);
  }
  return [sectionAst, ...toSections(nextCst)];
}

function toAst(cst) {
  const [keywords, rest] = splitWhen((n) => n.type !== "keyword", cst);
  return {
    keywords,
    sections: toSections(rest),
  };
}

export default function parseOrgfile(filename) {
  if (!Path.isAbsolute(filename)) {
    filename = Path.join(process.cwd(), filename);
  }
  const orgfile = Fs.readFileSync(filename, "utf-8").trim();
  const cst = OrgLang.File.tryParse(orgfile);
  return toAst(cst);
}
