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

export function regexPraser(input: String) : RegExp {
    if (typeof input !== "string") {
        throw new Error("Invalid input. Input must be a string");
    }
    // Parse input
    var m = input.match(/(\/?)(.+)\1([a-z]*)/i);
    // Invalid flags
    if (m[3] && !/^(?!.*?(.).*?\1)[gmixXsuUAJ]+$/.test(m[3])) {
        return RegExp(input);
    }
    // Create the regular expression
    return new RegExp(m[2], m[3]);
}

