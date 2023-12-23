import { Plugin, TFile, MarkdownView, Notice, RequestUrlParam, requestUrl } from 'obsidian';
import { ICalSettings, DEFAULT_SETTINGS } from "./src/settings/ICalSettings"
import ICalSettingsTab from "./src/settings/ICalSettingsTab"
import { Event } from './src/ICalEvent/Event'
import SelectEventsModal from "./src/ICalEvent/SelectEventsModal"
import moment from 'moment'

export default class ICal extends Plugin {
	settings: ICalSettings;
	db: any;
	eventLineTemplates: { name: string, template: string }[] = []
	eventNoteTemplates: { name: string, template: string }[] = []


	async getEventLineTemplate(): Promise<void> {
		await Promise.all(this.settings.iCalEventNoteTemplates.map(async t => {
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(t.lineTemplatePath)
				if (templateFile instanceof TFile) {
					this.eventLineTemplates.push({ name: t.name, template: await this.app.vault.read(templateFile) })
				}
			} catch (error) { }
		}))
	}

	async getEventNoteTemplate(): Promise<void> {
		await Promise.all(this.settings.iCalEventNoteTemplates.map(async t => {
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(t.noteTemplatePath)
				if (templateFile instanceof TFile) {
					this.eventNoteTemplates.push({ name: t.name, template: await this.app.vault.read(templateFile) })
				}
			} catch (error) { }
		}))
	}

	async getParticipantsForItem(calendarItemId: number) {
		const params: RequestUrlParam = {
			url: `${this.settings.apiUrl}/attendees`,
			method: "GET",
			//contentType: "application/json",
			body: JSON.stringify({
				databasePath: this.settings.calendarDbPath,
				calendarItemId: calendarItemId
			})
		}
		let participants = []
		try {
			participants = (await requestUrl(params)).json
		} catch (error) {
			console.log(error)
			new Notice("Error in connecting to the Calendar.sqlitedb", 5000)
		}
		return participants;
	}


	async getEventsWithDate(date: string): Promise<any[]> {
		const unixDate = moment(date).unix()
		// call the GET request
		const params: RequestUrlParam = {
			url: `${this.settings.apiUrl}/fetchEvents`,
			method: "GET",
			//contentType: "application/json",
			body: JSON.stringify({
				databasePath: this.settings.calendarDbPath,
				unixDate: unixDate
			})
		}
		let calendarItems = []
		try {
			calendarItems = (await requestUrl(params)).json

		} catch (error) {
			console.log(error)
			new Notice("Error in connecting to the Calendar.sqlitedb", 5000)
		}

		const events = Promise.all(calendarItems.map(async (item: any) => {
			const participants: any[] = await this.getParticipantsForItem(item.eventId);
			const organizer = participants.find((p: any) => p.role === 0)?.name
			const attendees = participants.filter((p: any) => p.role !== 0).map((p: any) => p.name)
			const event = new Event(
				this,
				date,
				item.eventId,
				item.status,
				item.summary,
				item.unixStart,
				item.unixEnd,
				organizer,
				attendees
			)
			event.templateName = this.settings.iCalEventNoteTemplates.find(t => t.name === this.settings.defaultTemplate).name || ""
			event.build()
			return event
		}));
		return events;
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
				await this.getEventLineTemplate()
				await this.getEventNoteTemplate()
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
				if (activeView) {
					const _fileDate = moment(activeView.file.basename, this.settings.dailyNoteDateFormat)
					if (_fileDate.isValid()) {
						const fileDate = _fileDate.format("YYYY-MM-DD")
						const fs = require('fs');
						const events = await this.getEventsWithDate(fileDate)
						new SelectEventsModal(this, activeView.file, events, fileDate).open()
					} else {
						new Notice('iCal - you are not in a daily note')
					}
				}
			}
		})
	}

	onunload() {
		console.log('unloading ical plugin');
		if (this.db) this.db.close();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
