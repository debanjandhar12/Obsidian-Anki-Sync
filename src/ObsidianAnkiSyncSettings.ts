import { App, PluginSettingTab, Setting } from 'obsidian';

export class ObsidianAnkiSyncSettings extends PluginSettingTab {
    plugin: any;

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		// Settings Section
		containerEl.createEl('h2', {text: 'Obsidian Anki Sync Settings'});
		
		new Setting(containerEl)
		.setName('Backup Decks before sync (BETA)')
		.setDesc(
			`If enabled, the plugin takes backup of all the anki decks before syncing is done.
			NB: Taking backup may increase syncing time significantly.`,
		)
		.addToggle((toggle) =>
			toggle.setValue(this.plugin.settings.backup).onChange((value) => {
			this.plugin.settings.backup = value;
			this.plugin.saveData(this.plugin.settings);
			}),
		);

		new Setting(containerEl)
		.setName('Show Breadcrumbs in Anki Cards')
		.setDesc(
			`If enabled, breadcrumbs would be shown in the cards created in Anki 
			(syncing needed before change takes place).`,
		)
		.addToggle((toggle) =>
			toggle.setValue(this.plugin.settings.breadcrumb).onChange((value) => {
			this.plugin.settings.breadcrumb = value;
			this.plugin.saveData(this.plugin.settings);
			}),
		);

		new Setting(this.containerEl)
		.setName("Template folder location")
		.setDesc("All files of this folder will be ignored while syncing to anki.")
		.addText((textbox) => 
			textbox.setValue(this.plugin.settings.templatefolder).setPlaceholder("Example: folder1/folder2").onChange((value) => {
				this.plugin.settings.templatefolder = value;
				this.plugin.saveData(this.plugin.settings);
			})
		);

		// Help Sections
		containerEl.createEl('h3', {text: 'Help'});
		let div = containerEl.createEl('div', {});

		div.appendText("Installation Instructions: ");
		const INSTALLATION_LINK = document.createElement('a');
		INSTALLATION_LINK.appendChild(document.createTextNode("debanjandhar12/Obsidian-Anki-Sync"));
		INSTALLATION_LINK.href = "https://github.com/debanjandhar12/Obsidian-Anki-Sync#installation"; 
		div.appendChild(INSTALLATION_LINK);

		div.appendChild(document.createElement("br"));
		div.appendText("Documentation: ");
		const DOCUMENTATION_LINK = document.createElement('a');
		DOCUMENTATION_LINK.appendChild(document.createTextNode("debanjandhar12/Obsidian-Anki-Sync/blob/main/docs/Tutorial.md"));
		DOCUMENTATION_LINK.href = "https://github.com/debanjandhar12/Obsidian-Anki-Sync/blob/main/docs/Tutorial.md"; 
		div.appendChild(DOCUMENTATION_LINK);

		// Support Section
		containerEl.createEl('h3', {text: 'Support Development'});
		div = containerEl.createEl('div', {});
		const supportText = document.createElement('p');
		supportText.appendText(
		`If this plugin adds value for you and you would like to support continued development, 
		please Star the repository in Github:`);
		div.appendChild(supportText);
		const GITHUBSTAR_ICON: string = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" baseProfile="tiny" viewBox="7.5 7.5 185 31" stroke="#000" fill-rule="evenodd" xmlns:v="https://vecta.io/nano"><image x="8" y="8" width="184" height="30" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALgAAAAeCAYAAACfdtQ0AAAACXBIWXMAAA7EAAAOxAGVKw4bAAABEUlEQVR4nO3bsU5DMQyF4dPEU9lu3gEh8f6PgoSYWXO3GxYsMyCVtN0q0BXu/42ZMhxZlp0cXl7fQkAyz0+PB0mykPRwPKq1plrrztcCbufu6r1rG+N0ZopQWxbVUqSgmOP/qqWoLYu2bTudFUlUbqRxmWWTJOo2sjKFSDhymfJs5BvZzHk2UcKRzk+eLYLhCXKZ81z2uwbw9wg4UrNQKOhRkEhMPTgVHKkxJkQ6c56p4EjNIujBkcucZyo4UiPgSM3EJhPZsMnEvfhe9DAoRCJznnkPjnxoUXAv2GQinfMPDyHGKMjl8svapzs/65GCu1+/RVnXLnff6UrA73B3rWs/OzNJGuNDY7zvcikAAIBrX0l9ZbJMroYgAAAAAElFTkSuQmCC" fill="#000" stroke-linejoin="miter" stroke-miterlimit="2"/><path d="M27 14.25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L27 26.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194-3.048-2.969a.75.75 0 0 1 .416-1.28l4.21-.611 1.883-3.815A.75.75 0 0 1 27 14.25h0m0 2.445L25.615 19.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L27 16.694" fill="#24292f" stroke="none"/><text fill="#24292f" stroke="none" xml:space="preserve" x="39" y="26" font-family="Segoe UI" font-size="12" font-weight="630">Star ObsidianAnkiSync</text></svg>`;
		div.appendChild(this.createButton("https://github.com/debanjandhar12/Obsidian-Anki-Sync", GITHUBSTAR_ICON));
		const GITHUBSPONSOR_ICON: string = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" baseProfile="tiny" viewBox="7.5 7.5 211 31" stroke="#000" fill-rule="evenodd" xmlns:v="https://vecta.io/nano"><image x="8" y="8" width="210" height="30" preserveAspectRatio="none" xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANIAAAAeCAYAAABZs0CNAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABHElEQVR4nO3csU7DMBDG8a/OTWVL3gEh8f6PgoSYWZMt7sLpGJCK2w4oh6VA9f+Nnrx8OvtyzuHl9S0EIOX56fEgSRaSHo5HTdOkYRh23hbw97m75nnWWut5zRShaRw1lCIFxQn4yVCKpnHUuq7ntSKJSgRsdJ0ZkyTqEPA7phBJAjKa3Bg5AnLa3JgoSUDSd24sgmYdkNHmpuy3DeB+ECSgAwuFgrMdsFk0dyQqEtAB7W8gqc0NFQnowCK4IwEZbW6oSEAHBAnowMRkA5DDZAPQ19cHWRrgwGZtbniPBGRxtAP6YrIBSLp82BeibQdkXD81/3DnT0LABu5+O2u3LLPcfactAf+Lu2tZ5os1k6RaT6r1fZdNAQAAoJdP0y1lsjrUTWIAAAAASUVORK5CYII=" fill="#000" stroke-linejoin="miter" stroke-miterlimit="2"/><path d="M23.25 16.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.56 20.56 0 0 0 27 27.393a20.56 20.56 0 0 0 3.135-2.211C31.92 23.644 33.5 21.65 33.5 19.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.75.75 0 0 1-1.442 0c-.42-1.47-1.656-2.456-3.029-2.456M27 28.25l-.345.666-.002-.001-.006-.003-.018-.01-.31-.17a22.08 22.08 0 0 1-3.434-2.414C21.045 24.731 19 22.35 19 19.5c0-2.664 2.086-4.5 4.25-4.5 1.547 0 2.903.802 3.75 2.02.847-1.218 2.203-2.02 3.75-2.02 2.164 0 4.25 1.836 4.25 4.5 0 2.85-2.045 5.231-3.885 6.818a22.08 22.08 0 0 1-3.744 2.584l-.018.01-.006.003h-.002L27 28.25m0 0l.345.666a.75.75 0 0 1-.69 0L27 28.25" fill="#bf3989" stroke="none"/><text fill="#24292f" stroke="none" xml:space="preserve" x="39" y="26" font-family="Segoe UI" font-size="12" font-weight="630">Sponsor ObsidianAnkiSync</text></svg>`;
		//div.appendChild(this.createButton("https://github.com/debanjandhar12/Obsidian-Anki-Sync", GITHUBSPONSOR_ICON));			
	}
	 
	createButton(link: string, svg: string): HTMLElement {
		const a = document.createElement('a');
		a.setAttribute('href', link);
		const blob = new Blob([svg], {type: 'image/svg+xml'});
		const url = URL.createObjectURL(blob);
		const img = document.createElement('img');
		img.src = url;
		img.height = 38;
		a.appendChild(img);
		return a;
	 };
}