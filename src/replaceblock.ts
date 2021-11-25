import { Block } from "./block";
import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine, regexPraser } from './utils';
import { Remarkable } from 'remarkable';
import * as AnkiConnect from './AnkiConnect';
import { customAlphabet } from "nanoid";
import path from "path";

export class ReplaceBlock extends Block {
    original: string;

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile, original: string) {
        super(vault, metadataCache, file);
        this.original = original;
    }

    async addInAnki(): Promise<any> {
        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 17);
        let oid = this.getOId() || "Obs" + nanoid();
        let text = this.toAnkiNoteContent();
        console.debug(oid, text);
        let extra = Block.md_to_html(this.getAttrib("extra") || "");
        console.debug(extra);
        let deck = this.getAttrib("deck") || this.getDocYAMLProp("deck") || "Default::ObsidianAnkiSync";
        console.debug(deck);
        let uri = encodeURI(`obsidian://vault/${this.vault.getName()}/${this.file.path}`);
        let uri_html = `<a href="${uri}">${this.vault.getName()} > ${this.file.path.replaceAll("\/", " > ")}</a>`;
        console.debug(uri_html);
        let yamlTags = this.getDocYAMLProp("tags");
        if (yamlTags == null) yamlTags = [];
        if (Array.isArray(yamlTags)) yamlTags = yamlTags.toString();
        yamlTags = yamlTags.split(/[ ,]+/);
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'replaceblock'];
        console.debug(tags);
        let res = await AnkiConnect.addNote(oid, deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": uri_html, "Config": JSON.stringify({}), "Tobedefinedlater": "Tobedefinedlater", "Tobedefinedlater2": "Tobedefinedlater2" }, tags);
        return oid;
    }

    async updateInAnki(): Promise<any> {
        let oid = this.getOId();
        let text = this.toAnkiNoteContent();
        console.debug(oid, text);
        let extra = Block.md_to_html(this.getAttrib("extra") || "");
        console.debug(extra);
        let deck = this.getAttrib("deck") || this.getDocYAMLProp("deck") || "Default::ObsidianAnkiSync";
        console.debug(deck);
        let uri = encodeURI(`obsidian://vault/${this.vault.getName()}/${this.file.path}`);
        let uri_html = `<a href="${uri}">${this.vault.getName()} > ${this.file.path.replaceAll("\/", " > ")}</a>`;
        console.debug(uri_html);
        let yamlTags = this.getDocYAMLProp("tags");
        if (yamlTags == null) yamlTags = [];
        if (Array.isArray(yamlTags)) yamlTags = yamlTags.toString();
        yamlTags = yamlTags.split(/[ ,]+/);
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'replaceblock'];
        console.debug(tags);
        return await AnkiConnect.updateNote(await this.getAnkiId(), deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": ReplaceBlock.settings.breadcrumb ? uri_html : "" }, tags);
    }

    toAnkiNoteContent(): string {
        let anki_content = this.original;

        // Remove All Comments
        const CommentsRegExp: RegExp = /<!--('.*'|".*"|\n|.)*?-->/gi // https://regexr.com/66vg3
        anki_content = anki_content.replaceAll(CommentsRegExp, "");

        // Add the clozes braces to replace texts
        const ReplaceStatementRegExp: RegExp = /<!--(\t|\n| )*?replace(\t|\n| )('.*'|".*"|\n|.)*?-->/gi // https://regexr.com/66vg0
        let matches = [...this.original.matchAll(ReplaceStatementRegExp)];
        matches.forEach((match) => {
            console.debug(match[0]);
            let replaceId = getAttribInCommentLine(match[0], "id") || 1;
            let replaceText = getAttribInCommentLine(match[0], "text") || regexPraser(getAttribInCommentLine(match[0], "regex")) || regexPraser("/$^/g");
            let n = getAttribInCommentLine(match[0], "n") || "All";
            if (n == "All") {
                anki_content = anki_content.replaceAll(replaceText, function (match) {
                    return `{{c${replaceId}:: ${match} }}`;
                });
            }
            else {
                let i = 0;
                anki_content = anki_content.replace(replaceText, function (match) { // https://stackoverflow.com/questions/10584748/find-and-replace-nth-occurrence-of-bracketed-expression-in-string/10585234
                    return (i++ == n) ? `{{c${replaceId}:: ${match} }}` : match;
                });
            }
        });

        // Convert md to html
        anki_content = Block.md_to_html(anki_content)

        return anki_content;
    }
}

export async function parseReplaceBlockInFile(vault: Vault, metadataCache: MetadataCache, file: TFile, fileContent: string): Promise<ReplaceBlock[]> {
    var res: ReplaceBlock[] = [];
    const ReplaceBlockRegExp: RegExp = /<!--(\t|\n| )*?replaceblock-start(\n| (\n|.)*?)*?-->(\n|.)*?<!--(\t|\n| )*?replaceblock-end(\t|\n| )*?-->/gi // https://regexr.com/5tace
    let matches = [...fileContent.matchAll(ReplaceBlockRegExp)];
    matches.forEach((match) => {
        var block: ReplaceBlock = new ReplaceBlock(vault, metadataCache, file, match[0]) // , match.index, match[0].length
        res.push(block);
    });
    return res;
}