import { Plugin, TFile, MarkdownView, Notice } from 'obsidian';
import { ICalSettings, DEFAULT_SETTINGS } from "./src/settings/ICalSettings"
import ICalSettingsTab from "./src/settings/ICalSettingsTab"
import ICalEvent from "./src/ICalEvent/ICalEvent"
import SelectEventsModal from "./src/ICalEvent/SelectEventsModal"
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
					const _fileDate = moment(activeView.file.basename, this.settings.dailyNoteDateFormat)
					if (_fileDate.isValid()) {
						const fileDate = _fileDate.format("YYYYMMDD")
						const fs = require('fs');
						const results = []
						let calendarId = 1
						for (const calendar of this.settings.icsCalendars) {
							try {
								const files = fs.readdirSync(calendar.path)

								const eventLineTemplate = await this.getEventLineTemplate()
								const eventNoteTemplate = await this.getEventNoteTemplate()
								for (let file of files) {
									const filePath = calendar.path + file
									const event = await ICalEvent.extractCalInfo(filePath, fileDate, eventLineTemplate, eventNoteTemplate, this, calendar.name, calendarId)
									if (event) { results.push(event) }
								}
								calendarId += 1
							} catch (error) {
								new Notice(`iCal - ${calendar.name}: No such directory`);
							}
						}
						const events = results.sort(ICalEvent.compareEvents)
						const modal = new SelectEventsModal(this, activeView.file, events, fileDate)
						modal.open()
					} else {
						new Notice('iCal - you are not in a daily note')
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
