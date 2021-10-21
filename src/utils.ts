import { DOMParser } from 'xmldom'

export function getAttribInCommentLine(comment: String, attribute: string): any {
    const CommentsRegExp: RegExp = /<!--(('.*'|".*"|\n|.)*?)-->/gi // https://regexr.com/66vg3
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

// Credits: https://github.com/MohamedLamineAllal/isPathChildOfJS
export function isPathChildOf(path, parentPath) {
    path = path.trim();
    parentPath = parentPath.trim();

    let lastChar_path = path[path.length - 1];
    let lastChar_parentPath = path[parentPath.length - 1];
    if (lastChar_parentPath !== '\\' && lastChar_parentPath !== '/') parentPath += '/';
    if (lastChar_path !== '\\' && lastChar_path !== '/') path += '/';

    if (parentPath.length >= path.length) return false; // parent path should be smaller in characters then the child path (and they should be all the same from the start , if they differ in one char then they are not related)

    for (let i = 0; i < parentPath.length; i++) {
        if (!(isPathSeparator(parentPath[i]) && isPathSeparator(path[i])) && parentPath[i] !== path[i]) {// if both are not separators, then we compare (if one is separator, the other is not, the are different, then it return false, if they are both no separators, then it come down to comparaison, if they are same nothing happen, if they are different it return false)
            return false;
        }
    }
  
    return true;

    function isPathSeparator(chr) {
        let PATH_SEPA = ['\\', '/'];
        for (let i = 0; i < PATH_SEPA.length; i++) {
            if (chr === PATH_SEPA[i]) return true;
        }
        return false;
    }  
}