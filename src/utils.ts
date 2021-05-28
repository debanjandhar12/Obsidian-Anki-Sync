import { DOMParser } from 'xmldom'

export function getAttribInCommentLine(comment: String, attribute: string): any {
    const CommentsRegExp: RegExp = /<!--((\n|.)*?)-->/gi // https://regexr.com/5tatm
    let matches = [...comment.matchAll(CommentsRegExp)];
    let parser = new DOMParser({
        locator: {},
        errorHandler: { warning: function (w) { }, 
        error: function (e) { }, 
        fatalError: function (e) { console.error(e) } }
    });
    let xmlStatement = parser.parseFromString("<" + matches[0][1].trim() + " />", "text/xml");
    return xmlStatement.documentElement.getAttribute(attribute);
}
export function insertAttrib(comment: String, attribute: String, value: any) {
    const BlockStartCommentPartRegExp: RegExp = /<!--(\t|\n| )*?(cloze|replace|basic)block-start/gi
    return comment.replace(BlockStartCommentPartRegExp, function (match):string { 
        return match+` ${attribute}="${value}"`;
    });
}

