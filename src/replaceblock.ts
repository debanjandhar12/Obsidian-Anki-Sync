import { Block } from "./block";
import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine, regexPraser } from './utils';
import { Remarkable } from 'remarkable';
import * as AnkiConnect from './AnkiConnect';
import { customAlphabet } from "nanoid";

export class ReplaceBlock extends Block {
    vault: Vault;
    file: TFile;
    original: string;
    metadataCache: MetadataCache;

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile, original: string) {
        super(vault, metadataCache, file);
        this.original = original;
    }

    async addInAnki(): Promise<any> {
        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);
        let oid = this.getOId() || "Obs" + nanoid();
        let text = this.toAnkiHTML();
        console.debug(oid, text);
        let extra = this.getAttrib("extra") || "";
        console.debug(extra);
        let deck = this.getAttrib("deck") || this.getDocYAMLProp("deck") || "Default::ObsidianAnkiSync";
        console.debug(deck);
        let uri = encodeURI(`obsidian://vault/${this.vault.getName()}/${this.file.path}`);
        let uri_html = `<a href="${uri}">${this.vault.getName()} > ${this.file.path.replaceAll("\/", " > ")}</a>`;
        console.debug(uri_html);
        let yamlTags = this.getDocYAMLProp("tags");
        if(yamlTags == null) yamlTags = [];
        if(Array.isArray(yamlTags)) yamlTags = yamlTags.toString();
        yamlTags = yamlTags.split(/[ ,]+/);
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'replaceblock'];
        console.debug(tags);        
        let res = await AnkiConnect.addNote(deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": uri_html }, tags);
        if (!isNaN(res))
            return oid; // if res is a number
        else return res;
    }

    async updateInAnki(): Promise<any> {
        let oid = this.getOId();
        let text = this.toAnkiHTML();
        console.debug(oid, text);
        let extra = this.getAttrib("extra") || "";
        console.debug(extra);
        let deck = this.getAttrib("deck") || this.getDocYAMLProp("deck") || "Default::ObsidianAnkiSync";
        console.debug(deck);
        let uri = encodeURI(`obsidian://vault/${this.vault.getName()}/${this.file.path}`);
        let uri_html = `<a href="${uri}">${this.vault.getName()} > ${this.file.path.replaceAll("\/", " > ")}</a>`;
        console.debug(uri_html);
        let yamlTags = this.getDocYAMLProp("tags");
        if(yamlTags == null) yamlTags = [];
        if(Array.isArray(yamlTags)) yamlTags = yamlTags.toString();
        yamlTags = yamlTags.split(/[ ,]+/);
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'replaceblock'];
        console.debug(tags);        
        return await AnkiConnect.updateNote(await this.getAnkiId(), deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": uri_html }, tags);
    }

    toAnkiHTML(): string {
        let anki = this.original;

        // Remove All Comments
        const CommentsRegExp: RegExp = /<!--((\n|.)*?)-->/gi // https://regexr.com/5tatm
        anki = anki.replaceAll(CommentsRegExp, "");

        // Add the clozes braces to replace texts
        const ReplaceStatementRegExp: RegExp = /<!--(\t|\n| )*?replace((\n| (\n|.)*?)*?) -->/gi // https://regexr.com/5tb31
        let matches = [...this.original.matchAll(ReplaceStatementRegExp)];
        matches.forEach((match) => {
            console.debug(match[0]);
            let replaceId = getAttribInCommentLine(match[0], "id");
            let replaceText = getAttribInCommentLine(match[0], "text") || regexPraser(getAttribInCommentLine(match[0], "regex")) || regexPraser("/$^/g");
            let n = getAttribInCommentLine(match[0], "n") || "All";
            if (n == "All") {
                anki = anki.replaceAll(replaceText, function (match) {
                    return `{{c${replaceId}:: ${match} }}`;
                });
            }
            else {
                let i = 0;
                anki = anki.replace(replaceText, function (match) { // https://stackoverflow.com/questions/10584748/find-and-replace-nth-occurrence-of-bracketed-expression-in-string/10585234
                    return (i++ == n) ? `{{c${replaceId}:: ${match} }}` : match;
                });
            }
        });

        // Fix Latex format
        const MdInlineMathRegExp: RegExp = /(?<!\$)\$((?=[\S])(?=[^$])[\s\S]*?\S)\$/g // https://github.com/Pseudonium/Obsidian_to_Anki/blob/488454f3c39a64bd0381f490c20f47866a3e3a3d/src/constants.ts
        const MdDisplayMathRegExp: RegExp = /\$\$([\s\S]*?)\$\$/g // https://github.com/Pseudonium/Obsidian_to_Anki/blob/488454f3c39a64bd0381f490c20f47866a3e3a3d/src/constants.ts
        anki = anki.replaceAll(MdInlineMathRegExp, "\\\\( $1 \\\\)");
        anki = anki.replaceAll(MdDisplayMathRegExp, "\\\\[ $1 \\\\]");

        // Convert Md to HTML format
        var md = new Remarkable('full', {
            html: false,
            breaks: false,
            typographer: false,
        });

        anki = md.render(anki);

        return anki;
    }
}

export async function parseReplaceBlockInFile(vault: Vault, metadataCache: MetadataCache, file: TFile): Promise<ReplaceBlock[]> {
    var res: ReplaceBlock[] = [];
    const ReplaceBlockRegExp: RegExp = /<!--(\t|\n| )*?replaceblock-start(\n| (\n|.)*?)*?-->(\n|.)*?<!--(\t|\n| )*?replaceblock-end(\t|\n| )*?-->/gi // https://regexr.com/5tace
    var fileContent = await vault.read(file);
    let matches = [...fileContent.matchAll(ReplaceBlockRegExp)];
    matches.forEach((match) => {
        var block: ReplaceBlock = new ReplaceBlock(vault, metadataCache, file, match[0]) // , match.index, match[0].length
        res.push(block);
    });
    return res;
}