import { Block } from "./block";
import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine } from './utils';
import { Remarkable } from 'remarkable';
import * as AnkiConnect from './anki_connect';
import { customAlphabet } from "nanoid";

export class BasicBlock extends Block {
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
        console.log(oid, text);
        let extra = this.getAttrib("extra") || "";
        console.log(extra);
        let deck = this.getAttrib("deck") || this.getDocYAMLProp("deck") || "Default::ObsidianAnkiSync";
        console.log(deck);
        let uri = encodeURI(`obsidian://vault/${this.vault.getName()}/${this.file.path}`);
        let uri_html = `<a href="${uri}">${this.vault.getName()} > ${this.file.path.replaceAll("\/", " > ")}</a>`;
        console.log(uri_html);
        let yamlTags = this.getDocYAMLProp("tags");
        if(yamlTags == null) yamlTags = [];
        if(Array.isArray(yamlTags)) yamlTags = yamlTags.toString();
        yamlTags = yamlTags.split(/[ ,]+/);
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'replaceblock'];
        console.log(tags);        
        let res = await AnkiConnect.addNote(deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": uri_html }, tags);
        if (!isNaN(res))
            return oid; // if res is a number
        else return res;
    }

    async updateInAnki(): Promise<any> {
        let oid = this.getOId();
        let text = this.toAnkiHTML();
        console.log(oid, text);
        let extra = this.getAttrib("extra") || "";
        console.log(extra);
        let deck = this.getAttrib("deck") || this.getDocYAMLProp("deck") || "Default::ObsidianAnkiSync";
        console.log(deck);
        let uri = encodeURI(`obsidian://vault/${this.vault.getName()}/${this.file.path}`);
        let uri_html = `<a href="${uri}">${this.vault.getName()} > ${this.file.path.replaceAll("\/", " > ")}</a>`;
        console.log(uri_html);
        let yamlTags = this.getDocYAMLProp("tags");
        if(yamlTags == null) yamlTags = [];
        if(Array.isArray(yamlTags)) yamlTags = yamlTags.toString();
        yamlTags = yamlTags.split(/[ ,]+/);
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'replaceblock'];
        console.log(tags);        
        return await AnkiConnect.updateNote(await this.getAnkiId(), deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": uri_html }, tags);
    }

    toAnkiHTML(): string {
        let anki = this.original;
        // -- Preprocess --
        // Remove All Comments
        const CommentsRegExp: RegExp = /<!--((\n|.)*?)-->/gi // https://regexr.com/5tatm
        anki = anki.replaceAll(CommentsRegExp, "");

        // Add the clozes braces to make front and back cards
        const frontCardRegex: RegExp = /(.|\n)*?(?=::)/i // https://regexr.com/5tr6r
        const backCardRegex: RegExp = /(?<=::)(.|\n)*/i // https://regexr.com/5tr7v
        let forward = (this.getAttrib("forward") == "" || this.getAttrib("forward") == "forward" || this.getAttrib("forward") == null || (String(this.getAttrib("forward")).toLowerCase() == "true"));
        let reverse = (this.getAttrib("reverse") != "" && this.getAttrib("reverse") != null && ((String(this.getAttrib("reverse")).toLowerCase() == "true") || (String(this.getAttrib("reverse")).toLowerCase() == "reverse")));
        console.log(typeof this.getAttrib("forward"), this.getAttrib("reverse"))
        if(forward)
        anki = anki.replace(backCardRegex, function (match) { 
            return `{{c1:: ${match} }}`;
        });
        if(reverse)
        anki = anki.replace(frontCardRegex, function (match) { 
            return `{{c2:: ${match} }}`;
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

export async function parseBasicBlockInFile(vault: Vault, metadataCache: MetadataCache, file: TFile): Promise<BasicBlock[]> {
    var res: BasicBlock[] = [];
    const ReplaceBlockRegExp: RegExp = /<!--(\t|\n| )*?basicblock-start(\n| (\n|.)*?)*?-->(\n|.)*?<!--(\t|\n| )*?basicblock-end(\t|\n| )*?-->/gi // https://regexr.com/5tace
    var fileContent = await vault.read(file);
    let matches = [...fileContent.matchAll(ReplaceBlockRegExp)];
    matches.forEach((match) => {
        var block: BasicBlock = new BasicBlock(vault, metadataCache, file, match[0]) // , match.index, match[0].length
        res.push(block);
    });
    return res;
}