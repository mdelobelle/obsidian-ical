import { FileView, Plugin, View} from 'obsidian';
import {ICalSettings, DEFAULT_SETTINGS} from "src/settings/ICalSettings"
import ICalSettingsTab from "src/settings/ICalSettingsTab"
import { getDateFromFile } from "obsidian-daily-notes-interface";
import ICalEvent from "src/ICalEvent/ICalEvent"

function isFileView(view: View): view is FileView {
    return (view as FileView).file !== undefined
}

export default class ICal extends Plugin {
	settings: ICalSettings;

	getTemplate(): Promise<string>{
		return new Promise((resolve, reject) => {
			const templatePath = this.settings.iCalTemplatePath
			if(templatePath){
				try {
					const template = this.app.vault.getFiles().filter(_file => _file.path == templatePath)[0]
					this.app.vault.cachedRead(template).then(result => resolve(result))
				} catch (error) {
					reject(error)
				}
			} else {
				resolve(null)
			}
		})
	}

	async onload() {
		console.log('loading ical plugin');
		await this.loadSettings();
		this.addSettingTab(new ICalSettingsTab(this.app, this))
		this.addCommand({
			id: "import_events",
			name: "import events",
			hotkeys: [
				{
					modifiers: ["Alt"],
					key: 'T',
				},
			],
			callback: () => {
				const activeView = this.app.workspace.activeLeaf.view
				if(activeView.getViewType() == "markdown" && isFileView(activeView)){  
					
					const fileDate = getDateFromFile(activeView.file, "day").format("YYYYMMDD")
					const results = this.getTemplate().then(template => Promise.all(
						this.app.vault.getFiles()
						.filter(file => file.parent.path == this.settings.icsFolder)
						.map((file) =>ICalEvent.extractCalInfo(file, fileDate, template, this))))
					results.then(data => data.filter(event => event != null)).then(icals => {
						this.getTemplate().then(() => {
							this.app.vault.read(activeView.file).then(content => {
								this.app.vault.modify(activeView.file, content + '\n' + icals.sort(ICalEvent.compareEvents).map(ical => ical.event).join('\n'))
							})
						})
					})
				}
			},
		})
	}

	onunload() {
		console.log('unloading ical plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
