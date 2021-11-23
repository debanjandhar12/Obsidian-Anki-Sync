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
        if (yamlTags == null) yamlTags = [];
        if (Array.isArray(yamlTags)) yamlTags = yamlTags.toString();
        yamlTags = yamlTags.split(/[ ,]+/);
        let tags = [...yamlTags, this.vault.getName().replace(/\s/g, "_"), 'ObsidianAnkiSync', 'replaceblock'];
        console.debug(tags);
        return await AnkiConnect.updateNote(await this.getAnkiId(), deck, "ObsidianAnkiSyncModel", { "oid": oid, "Text": text, "Extra": extra, "Breadcrumb": ReplaceBlock.settings.breadcrumb ? uri_html : "" }, tags);
    }

    toAnkiHTML(): string {
        let anki = this.original;

        // Remove All Comments
        const CommentsRegExp: RegExp = /<!--('.*'|".*"|\n|.)*?-->/gi // https://regexr.com/66vg3
        anki = anki.replaceAll(CommentsRegExp, "");

        // Add the clozes braces to replace texts
        const ReplaceStatementRegExp: RegExp = /<!--(\t|\n| )*?replace(\t|\n| )('.*'|".*"|\n|.)*?-->/gi // https://regexr.com/66vg0
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

        // Convert obsidian markdown embededs to odinary markdown - https://publish.obsidian.md/help/How+to/Embed+files
        const obsidianImageEmbededRegExp = /!\[\[([^\[\n]*\.(?:png|jpg|jpeg|gif|bmp|svg|tiff)).*?\]\]/gi // https://regexr.com/6903r
        anki = anki.replaceAll(obsidianImageEmbededRegExp, "![]($1)");

        // Convert Md to HTML format
        var md = new Remarkable('full', {
            html: false,
            breaks: false,
            typographer: false,
        });
        md.inline.ruler.disable(['sub', 'sup', 'ins']);
        md.block.ruler.disable(['code']);
        const originalLinkValidator = md.inline.validateLink;
        const dataLinkRegex = /^\s*data:([a-z]+\/[a-z]+(;[a-z-]+=[a-z-]+)?)?(;base64)?,[a-z0-9!$&',()*+,;=\-._~:@/?%\s]*\s*$/i;
        const isImage = /^.*\.(png|jpg|jpeg|bmp|tiff|gif|apng|svg|webp)$/i;
        const isWebURL = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i;
        md.inline.validateLink = (url: string) => originalLinkValidator(url) || encodeURI(url).match(dataLinkRegex)|| (encodeURI(url).match(isImage) && !encodeURI(url).match(isWebURL));
        const originalImageRender = md.renderer.rules.image;
        md.renderer.rules.image = (...a) => {
            if((encodeURI(a[0][a[1]].src).match(isImage) && !encodeURI(a[0][a[1]].src).match(isWebURL))) { // Image is relative to vault
                try {
                    // @ts-expect-error
                    let imgPath = path.join(this.vault.adapter.basePath,this.metadataCache.getFirstLinkpathDest(a[0][a[1]].src, this.file.path).path);
                    AnkiConnect.storeMediaFileByPath(encodeURIComponent(a[0][a[1]].src), imgPath); // Flatten and save
                }
                catch {}
                a[0][a[1]].src = encodeURIComponent(a[0][a[1]].src); // Flatten image and convert to markdown.
            }
            return originalImageRender(...a);   
        };
        anki = md.render(anki);

        return anki;
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