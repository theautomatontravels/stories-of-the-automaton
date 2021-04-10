import Fs from "fs";
import Path from "path";
import Module from "module";
import { assert } from "node:console";
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
    <meta name="description" content="the automaton stories">
    <meta name="author" content="the automaton">
    <link href="https://fonts.googleapis.com/css?family=Nunito:900,900italic,300,300italic&subset=latin-ext,latin" rel="stylesheet" type="text/css">
    <link rel="stylesheet" href="./styles.css">
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

const youtube = h(
  "svg",
  {
    viewBox: "0 0 160 110",
    width: 50,
  },
  [
    h("path", {
      key: -1,
      fill: "black",
      d:
        "M154.3 17.5a19.6 19.6 0 0 0-13.8-13.8C128.4.4 79.7.4 79.7.4S31 .5 18.9 3.8A19.6 19.6 0 0 0 5.1 17.6C1.44 39.1.02 71.86 5.2 92.5A19.6 19.6 0 0 0 19 106.3c12.1 3.3 60.8 3.3 60.8 3.3s48.7 0 60.8-3.3a19.6 19.6 0 0 0 13.8-13.8c3.86-21.53 5.05-54.27-.1-75z",
    }),
    [
      h("title", { key: -1 }, "Link to the video on YouTube"),
      h("path", {
        className: "youtube-triangle",
        key: -1,
        // fill: "white",
        d: "M64.2 78.4L104.6 55 64.2 31.6z",
      }),
    ],
  ]
);

const home = h(
  "svg",
  {
    viewBox: "0 0 50 42",
    width: 50,
  },
  h("path", {
    key: -1,
    d:
      "m25 9.0937l-17.719 16.281h5.563v15.531h24.312v-15.531h5.563l-17.719-16.281z",
  })
);

function Index({ sections }) {
  return [
    h("h1", {}, "The Automaton"),
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
              title: `Go to the story "${s.header.value}"`,
            },
            s.header.value
          )
        )
      )
    ),
  ];
}

function Page({ header, content, properties }) {
  assert(properties.value.url, "no url property", properties);
  const articleBody = content.map((c, i) =>
    /-{5,}/.test(c.value)
      ? h("hr", { key: i })
      : h("p", { key: i }, markup(c.value))
  );
  return [
    h("nav", {}, [
      h(
        "a",
        {
          title: "Go to the index page",
          className: "a-icon",
          key: -3,
          href: "index.html",
        },
        home
      ),
      h("h1", { key: -2 }, "the automaton"),
      h("div", { key: -1 }),
    ]),
    h("article", {}, [
      h("h2", { key: -2 }, header.value),
      h(
        "div",
        { key: -1 },
        h(
          "a",
          {
            title: `Watch the video "${header.value}" on YouTube`,
            className: "a-icon",
            href: properties.value.url,
            style: {
              padding: "0.75rem 0.5rem 0 0.5rem",
            },
          },
          youtube
        )
      ),
      ...articleBody,
    ]),
  ];
}

const ast = parse("./stories/main.org");

const sections = ast.sections.filter((s) => s.header.keyword !== "TODO");

if (!Fs.existsSync("./docs")) {
  Fs.mkdirSync("docs");
}

sections.forEach((s) => {
  Fs.writeFileSync(
    Path.join("./docs", toLink(s.header.value) + ".html"),
    html({
      title: s.header.value,
      body: renderToStaticMarkup(h(Page, s)),
    })
  );
});

const indexFile = html({
  title: "index",
  body: renderToStaticMarkup(
    h(Index, {
      sections,
    })
  ),
});

Fs.writeFileSync("./docs/index.html", indexFile);
Fs.writeFileSync("./docs/404.html", indexFile);
Fs.copyFileSync("./styles.css", "./docs/styles.css");
