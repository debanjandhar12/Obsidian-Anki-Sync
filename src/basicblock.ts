import { Block } from "./block";
import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine } from './utils';
import { Remarkable } from 'remarkable';
import * as AnkiConnect from './AnkiConnect';
import { customAlphabet } from "nanoid";
import path from "path";

export class BasicBlock extends Block {
    original: string;

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile, original: string) {
        super(vault, metadataCache, file);
        this.original = original;
    }

    async addInAnki(): Promise<any> {
        const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);
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
        let res = await AnkiConnect.addNote(oid, deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": uri_html }, tags);
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
        return await AnkiConnect.updateNote(await this.getAnkiId(), deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": BasicBlock.settings.breadcrumb ? uri_html : "" }, tags);
    }

    toAnkiNoteContent(): string {
        let anki_content = this.original;

        // Remove All Comments
        const CommentsRegExp: RegExp = /<!--(('.*'|".*"|\n|.)*?)-->/gi // https://regexr.com/66vg3
        anki_content = anki_content.replaceAll(CommentsRegExp, "");

        // Add the clozes braces to make front and back cards
        const frontCardRegex: RegExp = /(.|\n)*?(?=::)/i // https://regexr.com/5tr6r
        const backCardRegex: RegExp = /(?<=::)(.|\n)*/i // https://regexr.com/5tr7v
        let forward = (this.getAttrib("forward") == "" || this.getAttrib("forward") == "forward" || this.getAttrib("forward") == null || (String(this.getAttrib("forward")).toLowerCase() == "true"));
        let reverse = (this.getAttrib("reverse") != "" && this.getAttrib("reverse") != null && ((String(this.getAttrib("reverse")).toLowerCase() == "true") || (String(this.getAttrib("reverse")).toLowerCase() == "reverse")));
        if (forward)
            anki_content = anki_content.replace(backCardRegex, function (match) {
                return `{{c1:: ${match} }}`;
            });
        if (reverse)
            anki_content = anki_content.replace(frontCardRegex, function (match) {
                return `{{c2:: ${match} }}`;
            });

        // Convert md to html
        anki_content = Block.md_to_html(anki_content)

        return anki_content;
    }
}

export async function parseBasicBlockInFile(vault: Vault, metadataCache: MetadataCache, file: TFile, fileContent: string): Promise<BasicBlock[]> {
    var res: BasicBlock[] = [];
    const BasicBLockRegExp: RegExp = /<!--(\t|\n| )*?basicblock-start(\n| (\n|.)*?)*?-->(\n|.)*?<!--(\t|\n| )*?basicblock-end(\t|\n| )*?-->/gi // https://regexr.com/5tace
    let matches = [...fileContent.matchAll(BasicBLockRegExp)];
    matches.forEach((match) => {
        var block: BasicBlock = new BasicBlock(vault, metadataCache, file, match[0]) // , match.index, match[0].length
        res.push(block);
    });
    return res;
}