import { FileView, Plugin, TFile, View, MarkdownView } from 'obsidian';
import { ICalSettings, DEFAULT_SETTINGS } from "src/settings/ICalSettings"
import ICalSettingsTab from "src/settings/ICalSettingsTab"
import { getDateFromFile } from "obsidian-daily-notes-interface";
import ICalEvent from "src/ICalEvent/ICalEvent"
import ChooseSectionModal from "src/ICalEvent/ChooseSectionModal"

export default class ICal extends Plugin {
	settings: ICalSettings;

	async getTemplate(): Promise<string | null> {
		const templatePath = this.settings.iCalTemplatePath
		if (templatePath) {
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(templatePath)
				if (templateFile instanceof TFile) {
					const template = await this.app.vault.cachedRead(templateFile)
					return template
				}
			} catch (error) {
				return null
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
			callback: async () => {
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
				if (activeView) {
					const fileDate = getDateFromFile(activeView.file, "day").format("YYYYMMDD")
					const files = this.app.vault.getFiles()
						.filter(file => file.parent.path == this.settings.icsFolder)
					let results = []
					const template = await this.getTemplate()
					for (let file of files) {
						const event = await ICalEvent.extractCalInfo(file, fileDate, template, this)
						if (event) { results.push(event) }
					}
					const events = results.sort(ICalEvent.compareEvents)
					const modal = new ChooseSectionModal(this, activeView.file, events, fileDate)
					modal.open()
				}
			}
		})
	}

	a: string = ""

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
