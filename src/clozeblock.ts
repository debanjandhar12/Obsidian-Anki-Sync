import { Block } from "./block";
import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine } from './utils';
import * as AnkiConnect from './AnkiConnect';
import { customAlphabet } from "nanoid";
import path from "path";

export class ClozeBlock extends Block {
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
        let extra = this.getAttrib("extra") || "";
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
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'clozeblock'];
        console.debug(tags);
        return await AnkiConnect.updateNote(await this.getAnkiId(), deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": ClozeBlock.settings.breadcrumb ? uri_html : "" }, tags);
    }

    toAnkiNoteContent(): string {
        let anki_content = this.original;

        // Remove All Comments
        const CommentsRegExp: RegExp = /<!--(('.*'|".*"|\n|.)*?)-->/gi // https://regexr.com/66vg3
        anki_content = anki_content.replaceAll(CommentsRegExp, "");

        // Add the clozes braces for highlights
        let replaceId = 0;
        for (const match of anki_content.matchAll(/{{c(\d)::(.|\n)*?}}/g)) { // Get last replaceid used by user in anki cloze syntax
            replaceId = Math.max(replaceId, parseInt(match[1]));
        }
        anki_content = anki_content.replace(/(?<!=)==([^=][^$]*?)==/g, function (match) { // https://regexr.com/6a8jr
            return `{{c${++replaceId}:: ${match} }}`;
        });

        // Convert md to html
        anki_content = Block.md_to_html(anki_content)

        return anki_content;
    }
}

export async function parseClozeBlockInFile(vault: Vault, metadataCache: MetadataCache, file: TFile, fileContent: string): Promise<ClozeBlock[]> {
    var res: ClozeBlock[] = [];
    const ClozeBlockRegExp: RegExp = /<!--(\t|\n| )*?clozeblock-start(\n| (\n|.)*?)*?-->(\n|.)*?<!--(\t|\n| )*?clozeblock-end(\t|\n| )*?-->/gi // https://regexr.com/5tace
    let matches = [...fileContent.matchAll(ClozeBlockRegExp)];
    matches.forEach((match) => {
        var block: ClozeBlock = new ClozeBlock(vault, metadataCache, file, match[0]) // , match.index, match[0].length
        res.push(block);
    });
    return res;
}