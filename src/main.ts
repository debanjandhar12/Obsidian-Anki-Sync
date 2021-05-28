import { App, Notice, Plugin, addIcon, TFile } from 'obsidian';

import * as AnkiConnect from './anki_connect';
import { AnkiCardTemplates } from './templates/AnkiCardTemplates';

import { Block } from './Block';
import { parseReplaceBlockInFile } from './replaceblock';
import { parseBasicBlockInFile } from './basicblock';

export default class MyPlugin extends Plugin {
	async onload() {
		console.log('Loading ObsidianAnkiSync');

		// Add ribbon for syncing obsidian to anki
		const ANKI_ICON: string = `<path fill="currentColor" stroke="currentColor" d="M 27.00,3.53 C 18.43,6.28 16.05,10.38 16.00,19.00 16.00,19.00 16.00,80.00 16.00,80.00 16.00,82.44 15.87,85.73 16.74,88.00 20.66,98.22 32.23,97.00 41.00,97.00 41.00,97.00 69.00,97.00 69.00,97.00 76.63,96.99 82.81,95.84 86.35,88.00 88.64,82.94 88.00,72.79 88.00,67.00 88.00,67.00 88.00,24.00 88.00,24.00 87.99,16.51 87.72,10.42 80.98,5.65 76.04,2.15 69.73,3.00 64.00,3.00 64.00,3.00 27.00,3.53 27.00,3.53 Z M 68.89,15.71 C 74.04,15.96 71.96,19.20 74.01,22.68 74.01,22.68 76.72,25.74 76.72,25.74 80.91,30.85 74.53,31.03 71.92,34.29 70.70,35.81 70.05,38.73 67.81,39.09 65.64,39.43 63.83,37.03 61.83,36.00 59.14,34.63 56.30,35.24 55.08,33.40 53.56,31.11 56.11,28.55 56.20,25.00 56.24,23.28 55.32,20.97 56.20,19.35 57.67,16.66 60.89,18.51 64.00,17.71 64.00,17.71 68.89,15.71 68.89,15.71 Z M 43.06,43.86 C 49.81,45.71 48.65,51.49 53.21,53.94 56.13,55.51 59.53,53.51 62.94,54.44 64.83,54.96 66.30,56.05 66.54,58.11 67.10,62.74 60.87,66.31 60.69,71.00 60.57,74.03 64.97,81.26 61.40,83.96 57.63,86.82 51.36,80.81 47.00,82.22 43.96,83.20 40.23,88.11 36.11,87.55 29.79,86.71 33.95,77.99 32.40,74.18 30.78,70.20 24.67,68.95 23.17,64.97 22.34,62.79 23.39,61.30 25.15,60.09 28.29,57.92 32.74,58.49 35.44,55.57 39.11,51.60 36.60,45.74 43.06,43.86 Z" />`
		addIcon('anki', ANKI_ICON);
		this.addRibbonIcon('anki', 'Sync Obsidian to Anki', () => {
			this.syncObsidianToAnki();
		});

		// Add command for syncing obsidian to anki
		this.addCommand({
			id: 'sync-obsidian-to-anki',
			name: 'Sync Obsidian to Anki',
			callback: () => {
				this.syncObsidianToAnki();
			}
		});
	}

	onunload() {
		console.log('Unloading ObsidianAnkiSync');
	}

	async syncObsidianToAnki() {
		new Notice(`Starting Obsidian to Anki Sync for vault ${this.app.vault.getName()}...`);
		console.log('Sync Started');

		// -- Create backup of Anki --
		await AnkiConnect.createBackup();

		// -- Create models if it doesn't exists --
		await AnkiConnect.createModel("ObsidianAnkiSyncModel", ["oid",  "Text", "Extra", "Breadcrumb", "Config", "Tobedefinedlater", "Tobedefinedlater2"], AnkiCardTemplates.frontTemplate, AnkiCardTemplates.backTemplate);

		// -- Recognize all different kinds of blocks and collect them --
		var allBlocks: Block[]  = [];
		for(var file of this.app.vault.getMarkdownFiles()) {
			allBlocks = allBlocks.concat(await parseReplaceBlockInFile(this.app.vault, this.app.metadataCache, file));
			allBlocks = allBlocks.concat(await parseBasicBlockInFile(this.app.vault, this.app.metadataCache, file));
		}
		console.log("Recognized Blocks:", allBlocks);


		// -- Create or update notes in anki for all collected blocks --
		for(var block of allBlocks) {
			let blockOId:string = await block.getOId();
			let blockAnkiId:number = await block.getAnkiId();
			if(blockOId == null || blockOId == "") {
				let new_blockOId = await block.addInAnki();
				await block.updateOIdinObsidian(new_blockOId);
				console.log(`Added note with new oId ${new_blockOId}`);
			}
			else if(blockAnkiId == null || isNaN(blockAnkiId)) {
				await block.addInAnki();
				console.log(`Added note with old oId ${blockOId} since it's respective anki note was not found`);
			}
			else {
				await block.updateInAnki();
				console.log(`Updated note with oId ${blockOId} and ankiId ${blockAnkiId}`);
			}
		}
		
		// -- Delete the deleted cards --
		// Update clozeblocks again
		allBlocks = []; 
		for(var file of this.app.vault.getMarkdownFiles()) {
			allBlocks = allBlocks.concat(await parseReplaceBlockInFile(this.app.vault, this.app.metadataCache, file));
			allBlocks = allBlocks.concat(await parseBasicBlockInFile(this.app.vault, this.app.metadataCache, file));
		}
		// Get the anki ids of blocks
		let blockIds:number[] = [];
		for(var block of allBlocks)
			blockIds.push(await block.getAnkiId());
		console.log("Recognized Block's AnkiId:", blockIds); 
		// Get Anki Notes and their ids
		let q = await AnkiConnect.query(`tag:${this.app.vault.getName().replace(/\s/g, "_")} note:ObsidianAnkiSyncModel tag:ObsidianAnkiSync`)
		let ankiIds:number[] = q.map(i=>parseInt(i));
		console.log("Anki Notes created by App:", ankiIds);
		// Delete anki notes created by app which are no longer in obsidian vault
		for(var ankiId of ankiIds) {
			if(!blockIds.includes(ankiId)) {
				console.log(`Deleting note with ankiId ${ankiId}`);
				await AnkiConnect.deteteNote(ankiId);
			}
		}

		new Notice(`Sync Completed!`);
		console.log('Sync Completed');
	}
}