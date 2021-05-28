import { MetadataCache, TFile, Vault } from 'obsidian';
import { getAttribInCommentLine, insertAttrib } from './utils';
import * as AnkiConnect from './anki_connect';

export abstract class Block {
    vault: Vault;
    metadataCache: MetadataCache;
    file: TFile;
    abstract original: string;

    constructor(vault: Vault, metadataCache: MetadataCache, file: TFile) {
        this.vault = vault;
        this.metadataCache = metadataCache;
        this.file = file;
    }

    abstract addInAnki(): Promise<any>;
    abstract updateInAnki(): Promise<any>;
    abstract toAnkiHTML(): string;

    getDocYAMLProp(key: string) {
        let fileCache = this.metadataCache.getFileCache(this.file).frontmatter;
        return fileCache ? fileCache[key] : null;
    }

    getAttrib(attrib: string) {
        const CommentsRegExp: RegExp = /<!--((\n|.)*?)-->/gi // https://regexr.com/5tatm
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

        // Read and modify the file with addition of id in obsidian
        let fileContent = await this.vault.read(this.file);
        fileContent = fileContent.replace(this.original, modified);
        this.vault.modify(this.file, fileContent)
    }

    async getAnkiId(): Promise<number> {
        let ankiId: number = NaN;
        if (this.getOId() != "" && this.getOId() != null)
            ankiId = parseInt((await AnkiConnect.query(`oid:${this.getOId()} note:ObsidianAnkiSyncModel`))[0]);
        return ankiId;
    }
}