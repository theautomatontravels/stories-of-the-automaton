import P from "parsimmon";

const OrgLang = P.createLanguage({
  KeyWord: () =>
    P.seqMap(
      P.string("#+"),
      P.regexp(/\w+/),
      P.string(":"),
      P.regexp(/.*/),
      (_1, name, _2, value) => ({
        type: "keyword",
        name: name.trim(),
        value: value.trim(),
      })
    ),

  Header: () =>
    P.seqMap(
      P.regexp(/\*+/),
      P.regexp(/ +/),
      P.regexp(/.*/),
      (stars, _w, header) => {
        let keyword = "";
        const keywordresult = /^\s*TODO/.exec(header);
        if (keywordresult) keyword = "TODO";
        return {
          type: "header",
          level: stars.length,
          keyword,
          value: header.replace(/^\s*TODO/, "").trim(),
        };
      }
    ),

  Paragraph: (r) =>
    P.regexp(/[\w\d .!?;:,*/'"\-()]+/).map((value) => ({
      type: "paragraph",
      value: value.trim(),
    })),

  Quote: (r) =>
    P.seqMap(P.regexp(/> +/), r.Paragraph, (_1, value) => ({
      type: "quote",
      value,
    })),

  // ListItem: (r) =>
  //   P.seq(P.regexp(/( *)- /, 1), r.Paragraph).map(([indentation, text]) => ({
  //     type: "list-item",
  //     // NOTE: indentation is 2 spaces
  //     level: indentation.length / 2,
  //     value: text,
  //   })),

  // DescriptiveListItem: (r) =>
  //   P.seq(P.regexp(/- /), r.Paragraph, P.regexp(/:: /), r.Paragraph),

  File: (r) =>
    P.alt(r.KeyWord, r.Header, r.Paragraph, r.Quote).sepBy(
      P.regexp(/((\n+)(\s*))+/)
    ),
});

export default OrgLang;
