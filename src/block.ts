import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine, insertAttrib } from './utils';
import * as AnkiConnect from './AnkiConnect';
import { Remarkable } from 'remarkable';

export abstract class Block {
    vault: Vault;
    metadataCache: MetadataCache;
    static settings: any;
    file: TFile;
    abstract original: string;

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile) {
        this.vault = vault;
        this.metadataCache = metadataCache;
        this.file = file;
    }

    abstract addInAnki(): Promise<any>;
    abstract updateInAnki(): Promise<any>;
    abstract toAnkiNoteContent(): string;

    getDocYAMLProp(key: string) {
        let fileCache = this.metadataCache.getFileCache(this.file).frontmatter;
        return fileCache ? fileCache[key] : null;
    }

    getAttrib(attrib: string) {
        const CommentsRegExp: RegExp = /<!--(('.*'|".*"|\n|.)*?)-->/gi // https://regexr.com/66vg3
        let match = this.original.match(CommentsRegExp);
        return getAttribInCommentLine(match[0], attrib);
    }

    getOId(): string {
        let oid: string = this.getAttrib("oid");
        return oid;
    }

    async updateOIdinObsidian(oid: string): Promise<void> {
        const BlockStartCommentRegExp: RegExp = /<!--(\t|\n| )*?\w+block-start(\n| (\n|.)*?)*?-->/gi // https://regexr.com/5tq8f
        let modified = this.original.replace(BlockStartCommentRegExp, function (match): string {
            return insertAttrib(match, 'oid', oid);
        });
        modified = modified.replaceAll("$", "$$$$"); // Bug Fix: https://stackoverflow.com/questions/9423722/string-replace-weird-behavior-when-using-dollar-sign-as-replacement

        // Read and modify the file with addition of id in obsidian
        let fileContent = await this.vault.cachedRead(this.file);
        fileContent = fileContent.replace(this.original, modified);
        this.vault.modify(this.file, fileContent);
    }

    async getAnkiId(): Promise<number> {
        let ankiId: number = NaN;
        if (this.getOId() != "" && this.getOId() != null)
            ankiId = parseInt((await AnkiConnect.query(`oid:${this.getOId()} note:ObsidianAnkiSyncModel`))[0]);
        return ankiId;
    }

    static md_to_html(md): string {
        let html = md;
        // Fix Latex format of md to anki's html format
        const MdInlineMathRegExp: RegExp = /(?<!\$)\$((?=[\S])(?=[^$])[\s\S]*?\S)\$/g // https://github.com/Pseudonium/Obsidian_to_Anki/blob/488454f3c39a64bd0381f490c20f47866a3e3a3d/src/constants.ts
        const MdDisplayMathRegExp: RegExp = /\$\$([\s\S]*?)\$\$/g // https://github.com/Pseudonium/Obsidian_to_Anki/blob/488454f3c39a64bd0381f490c20f47866a3e3a3d/src/constants.ts
        html = html.replaceAll(MdInlineMathRegExp, "\\\\( $1 \\\\)");
        html = html.replaceAll(MdDisplayMathRegExp, "\\\\[ $1 \\\\]");

        // Convert obsidian markdown image embededs to odinary markdown - https://publish.obsidian.md/help/How+to/Embed+files
        const obsidianImageEmbededRegExp = /!\[\[([^\[\n]*\.(?:png|jpg|jpeg|gif|bmp|svg|tiff)).*?\]\]/gi // https://regexr.com/6903r
        html = html.replaceAll(obsidianImageEmbededRegExp, "![]($1)");

        // Convert Md to HTML format
        var remark = new Remarkable('full', {
            html: false,
            breaks: false,
            typographer: false,
        });
        remark.inline.ruler.disable(['sub', 'sup', 'ins']);
        remark.block.ruler.disable(['code']);
        const originalLinkValidator = remark.inline.validateLink;
        const dataLinkRegex = /^\s*data:([a-z]+\/[a-z]+(;[a-z-]+=[a-z-]+)?)?(;base64)?,[a-z0-9!$&',()*+,;=\-._~:@/?%\s]*\s*$/i;
        const isImage = /^.*\.(png|jpg|jpeg|bmp|tiff|gif|apng|svg|webp)$/i;
        const isWebURL = /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/i;
        remark.inline.validateLink = (url: string) => originalLinkValidator(url) || encodeURI(url).match(dataLinkRegex)|| (encodeURI(url).match(isImage) && !encodeURI(url).match(isWebURL));
        const originalImageRender = remark.renderer.rules.image;
        remark.renderer.rules.image = (...a) => {
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
        html = remark.render(html);
        return html;        
    }
}