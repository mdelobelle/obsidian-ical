import { FileView, Plugin, TFile, View, MarkdownView} from 'obsidian';
import {ICalSettings, DEFAULT_SETTINGS} from "src/settings/ICalSettings"
import ICalSettingsTab from "src/settings/ICalSettingsTab"
import { getDateFromFile } from "obsidian-daily-notes-interface";
import ICalEvent from "src/ICalEvent/ICalEvent"
import chooseSectionModal from "src/ICalEvent/chooseSectionModal"

export default class ICal extends Plugin {
	settings: ICalSettings;

	async getTemplate(){
		const templatePath = this.settings.iCalTemplatePath
		if(templatePath){
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(templatePath)
				if(templateFile instanceof TFile){
					const template = await this.app.vault.cachedRead(templateFile)
					return template
				}
			} catch (error) {
				return error
			}
		}
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
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
				if(activeView && activeView instanceof FileView){  
					const fileDate = getDateFromFile(activeView.file, "day").format("YYYYMMDD")
					const results = this.getTemplate().then(template => Promise.all(
						this.app.vault.getFiles()
						.filter(file => file.parent.path == this.settings.icsFolder)
						.map((file) =>ICalEvent.extractCalInfo(file, fileDate, template, this))))
					results.then(data => data.filter(event => event != null)).then(icals => {
						const events = icals.sort(ICalEvent.compareEvents)
						const modal = new chooseSectionModal(this, activeView.file, events, fileDate)
						modal.open()
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
