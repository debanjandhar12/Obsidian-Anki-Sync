import { Block } from "./block";
import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine } from './utils';
import { Remarkable } from 'remarkable';
import * as AnkiConnect from './AnkiConnect';
import { customAlphabet } from "nanoid";

export class ClozeBlock extends Block {
    original: string;

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
        return await AnkiConnect.updateNote(await this.getAnkiId(), deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": ClozeBlock.settings.breadcrumb ? uri_html : ""}, tags);
    }

    toAnkiHTML(): string {
        let anki = this.original;

        // Remove All Comments
        const CommentsRegExp: RegExp = /<!--((\n|.)*?)-->/gi // https://regexr.com/5tatm
        anki = anki.replaceAll(CommentsRegExp, "");

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
        md.inline.ruler.disable(['sub','sup','ins']);
        md.block.ruler.disable(['code']);
        anki = md.render(anki);

        return anki;
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