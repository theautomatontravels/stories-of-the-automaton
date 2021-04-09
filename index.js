import Fs from "fs";
import Path from "path";
import Module from "module";
import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server.js";

const require = Module.createRequire(import.meta.url);
const { smartypantsu } = require("smartypants");

import parse from "./lib/parser.js";

function html({ title, body }) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
    <meta name="description" content="a story of the automaton">
    <meta name="author" content="the automaton">
    <link rel="stylesheet" href="styles.css">
  </head>

  <body>
    ${body}
  </body>
</html>
`;
}

function smart(s) {
  return smartypantsu(s, "1");
}

function markup(s) {
  let r = [];
  const re = /\/([\w\d .!?;:,*'"\-()]+)\//g;
  let result;
  let sofar = 0;
  while ((result = re.exec(s))) {
    r.push(smart(s.slice(sofar, result.index)));
    sofar = 2 + result.index + result[1].length;
    r.push(h("i", {}, smart(s.slice(result.index + 1, sofar - 1))));
  }
  r.push(smart(s.slice(sofar)));
  if (!r.length) return s;
  return r.map((r, i) => h(Fragment, { key: i }, r));
}

function toLink(s) {
  return s.replace(/:/, "").replace(/ +/g, "-").toLowerCase();
}

function Index({ sections }) {
  return [
    h("h1", {}, "the automaton"),
    h(
      "ul",
      {},
      sections.map((s) =>
        h(
          "li",
          { key: s.header.value },
          h(
            "a",
            {
              href: toLink(s.header.value) + ".html",
            },
            s.header.value
          )
        )
      )
    ),
  ];
}

function Page({ header, content }) {
  return [
    h("h1", {}, "the automaton"),
    h("a", { href: "index.html" }, "home"),
    h("article", {}, [
      h("h2", { key: -1 }, header.value),
      ...content.map((c, i) => h("p", { key: i }, markup(c.value))),
    ]),
  ];
}

const ast = parse("./stories/main.org");

const sections = ast.sections.filter((s) => s.header.keyword !== "TODO");

sections.forEach((s) => {
  if (!Fs.existsSync("./dist")) {
    Fs.mkdirSync("dist");
  }
  Fs.writeFileSync(
    Path.join("./dist", toLink(s.header.value) + ".html"),
    html({
      title: s.header.value,
      body: renderToStaticMarkup(h(Page, s)),
    })
  );
});

Fs.writeFileSync(
  Path.join("./dist", "index.html"),
  html({
    title: "index",
    body: renderToStaticMarkup(
      h(Index, {
        sections,
      })
    ),
  })
);
