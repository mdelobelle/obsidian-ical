import { Plugin, TFile, MarkdownView, Notice } from 'obsidian';
import { ICalSettings, DEFAULT_SETTINGS } from "./src/settings/ICalSettings"
import ICalSettingsTab from "./src/settings/ICalSettingsTab"
import { Event } from './src/ICalEvent/Event'
import SelectEventsModal from "./src/ICalEvent/SelectEventsModal"
import moment from 'moment'
import { Knex, knex } from 'knex';

export default class ICal extends Plugin {
	settings: ICalSettings;
	db: any;
	eventLineTemplate: string = ""
	eventNoteTemplate: string = ""

	async getEventLineTemplate(): Promise<void> {
		const eventLineTemplatePath = this.settings.iCalEventLineTemplatePath
		if (eventLineTemplatePath) {
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(eventLineTemplatePath)
				if (templateFile instanceof TFile) {
					this.eventLineTemplate = await this.app.vault.cachedRead(templateFile)
				}
			} catch (error) { }
		}
	}
	async getEventNoteTemplate(): Promise<void> {
		const eventNoteTemplatePath = this.settings.iCalEventNoteTemplatePath
		if (eventNoteTemplatePath) {
			try {
				const templateFile = this.app.vault.getAbstractFileByPath(eventNoteTemplatePath)
				if (templateFile instanceof TFile) {
					this.eventNoteTemplate = await this.app.vault.cachedRead(templateFile)
				}
			} catch (error) { }
		}
	}

	openDb(): void {
		//@ts-ignore
		this.db = this.app.plugins.plugins["obsidian-sqlite3"].initDatabase(this.settings.calendarDbPath)
	}

	getParticipantsForItem(calendarItemId: number) {
		const participantsQuery = `
			SELECT 
				display_name as name, role
			FROM
				Participant, 
				Identity	
			WHERE
				Identity.ROWID =  Participant.identity_id
				AND
				Participant.owner_id = ${calendarItemId}
		`
		const participants = this.db.prepare(participantsQuery).all()
		return participants;
	}

	getEventsWithDate(date: string) {
		const unixDate = moment(date).unix()
		const calendarItemsQuery = `
			SELECT 
				CalendarItem.ROWID as eventId, invitation_status as status, summary, occurrence_date as 'unixStart', occurrence_end_date as 'unixEnd'
			FROM
				OccurrenceCache
					LEFT JOIN 
					CalendarItem
					ON
					OccurrenceCache.event_id = CalendarItem.ROWID

			WHERE 
				${unixDate} >= day + 978303600
				AND
				${unixDate} <= day + 978390000
			ORDER BY
				unixStart ASC ;
		`
		const calendarItems = this.db.prepare(calendarItemsQuery).all()
		const events = calendarItems.map((item: any) => {
			const participants = this.getParticipantsForItem(item.eventId);
			const organizer = participants.find((p: any) => p.role === 0)?.name
			const attendees = participants.filter((p: any) => p.role !== 0).map((p: any) => p.name)
			return new Event(
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
		})
		return events;
	}

	async onload() {
		console.log('loading ical plugin');
		await this.loadSettings();
		await this.getEventLineTemplate()
		await this.getEventNoteTemplate()

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

				this.openDb();
				const activeView = this.app.workspace.getActiveViewOfType(MarkdownView)
				if (activeView) {
					const _fileDate = moment(activeView.file.basename, this.settings.dailyNoteDateFormat)
					if (_fileDate.isValid()) {
						const fileDate = _fileDate.format("YYYY-MM-DD")
						const fs = require('fs');
						this.openDb()
						const events = this.getEventsWithDate(fileDate)
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
