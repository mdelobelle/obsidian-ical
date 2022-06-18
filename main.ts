import { Plugin, TFile, MarkdownView, Notice } from 'obsidian';
import { ICalSettings, DEFAULT_SETTINGS } from "./src/settings/ICalSettings"
import ICalSettingsTab from "./src/settings/ICalSettingsTab"
import ICalEvent from "./src/ICalEvent/ICalEvent"
import ChooseSectionModal from "./src/ICalEvent/ChooseSectionModal"
import moment from 'moment'

export default class ICal extends Plugin {
	settings: ICalSettings;

	async getEventLineTemplate(): Promise<string | null> {
		const eventLineTemplatePath = this.settings.iCalEventLineTemplatePath
		if (eventLineTemplatePath) {
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(eventLineTemplatePath)
				if (templateFile instanceof TFile) {
					const template = await this.app.vault.cachedRead(templateFile)
					return template
				}
			} catch (error) {
				return null
			}
		}
	}
	async getEventNoteTemplate(): Promise<string | null> {
		const eventNoteTemplatePath = this.settings.iCalEventNoteTemplatePath
		if (eventNoteTemplatePath) {
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(eventNoteTemplatePath)
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
					const fileDate = moment(activeView.file.basename, this.settings.dailyNoteDateFormat).format("YYYYMMDD")
					const fs = require('fs');
					const calFolder = this.settings.icsFolder
					try {
						const files = fs.readdirSync(calFolder)
						let results = []
						const eventLineTemplate = await this.getEventLineTemplate()
						const eventNoteTemplate = await this.getEventNoteTemplate()
						for (let file of files) {
							const filePath = calFolder + file
							const event = await ICalEvent.extractCalInfo(filePath, fileDate, eventLineTemplate, eventNoteTemplate, this)
							if (event) { results.push(event) }
						}
						const events = results.sort(ICalEvent.compareEvents)
						const modal = new ChooseSectionModal(this, activeView.file, events, fileDate)
						modal.open()
					} catch (error) {
						new Notice('iCal settings: No such directory');
					}
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
