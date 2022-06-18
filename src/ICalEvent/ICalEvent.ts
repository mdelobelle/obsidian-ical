import { moment, FileSystemAdapter } from "obsidian"
import ICal from "../../main"
import { parseFile, CalendarComponent } from "ical"

export default class ICalEvent {
	start: moment.Moment
	end: moment.Moment
	eventLine: string
	shortEvent: string = ""
	ical: CalendarComponent
	renderNote: boolean = false
	eventNote: string
	startDay: string = ""
	endDay: string = ""
	fileDate: string = ""
	createNote: () => void

	constructor(plugin: ICal, filePath: string, startDay: string, endDay: string, fileDate: string) {
		const ics = parseFile(filePath)
		if (Object.keys(ics).length > 0) {
			this.ical = ics[Object.keys(ics)[0]]
			this.start = moment(new Date(Date.parse(`${this.ical.start}`)));
			this.end = moment(new Date(Date.parse(`${this.ical.end}`)));
			this.startDay = startDay
			this.endDay = endDay
			this.fileDate = fileDate

			this.createNote = () => {
				const folder = plugin.settings.iCalEventNotesFolder
				let filename = plugin.settings.iCalEventNotesFileNameTemplate
				if (filename) {
					filename = filename.replace(/{{startday}}/g, this.start.format(plugin.settings.dateFormat))
					filename = filename.replace(/{{starttime}}/g, this.start.format(plugin.settings.timeFormat))
					filename = filename.replace(/{{endday}}/g, this.end.format(plugin.settings.dateFormat))
					filename = filename.replace(/{{endtime}}/g, this.end.format(plugin.settings.timeFormat))
					filename = filename.replace(/{{start}}/g, this.eventStart(startDay, fileDate, plugin))
					filename = filename.replace(/{{end}}/g, this.eventEnd(endDay, fileDate, plugin))
					filename = filename.replace(/{{summary}}/g, `${this.ical.summary.replace(/[:/]/g, "-")}`)
					filename = filename.replace(/{{organizer}}/g, `${this.ical.organizer ? (<any>this.ical.organizer)['params']['CN'].replace(/"/g, '') : ""}`)
				} else {
					filename = String(`${this.start.format(plugin.settings.dateFormat)} - ${this.start.format(plugin.settings.timeFormat)} - ${this.ical.summary.replace(/[:/]/g, "-")}`)
				}
				filename = filename.replace(/[:/]/g, "-")
				plugin.app.vault.create(folder + filename + ".md", this.eventNote)
			}

		}
	}

	renderEventNote(plugin: ICal, startDay: string, endDay: string, fileDate: string, template?: string) {
		if (template) {
			let attendees: string[] = []
			template = template.replace(/{{startday}}/g, this.start.format(plugin.settings.dateFormat))
			template = template.replace(/{{starttime}}/g, this.start.format(plugin.settings.timeFormat))
			template = template.replace(/{{endday}}/g, this.end.format(plugin.settings.dateFormat))
			template = template.replace(/{{endtime}}/g, this.end.format(plugin.settings.timeFormat))
			template = template.replace(/{{start}}/g, this.eventStart(startDay, fileDate, plugin))
			template = template.replace(/{{end}}/g, this.eventEnd(endDay, fileDate, plugin))
			template = template.replace(/{{summary}}/g, `${this.ical.summary}`)
			template = template.replace(/{{organizer}}/g, `${this.ical.organizer ? (<any>this.ical.organizer)['params']['CN'].replace(/"/g, '') : ""}`)
			template = template.replace(/{{organizer.link}}/g, `${this.ical.organizer ? `[[${(<any>this.ical.organizer)['params']['CN'].replace(/"/g, '')}]]` : ""}`)
			if (Object.keys(this.ical).includes("attendee")) {
				const _attendees: Array<Record<string, string>> = Object.entries(this.ical).filter(item => item[0] == "attendee")[0][1]
				if (_attendees instanceof Array) {
					_attendees.forEach(attendee => {
						const _params = Object.entries(attendee).filter(item => item[0] == "params")
						const params = _params.length > 0 ? _params[0][1] : null
						const _cn = params ? Object.entries(params).filter(item => item[0] == "CN") : null
						if (_cn && `${_cn[0][1]}` != `${(<any>this.ical.organizer)["params"]["CN"]}`) { attendees.push(`${_cn[0][1]}`.replace(/"/g, '')) }
					})
				} else {
					attendees.push(_attendees["params"]["CN"])
				}
			}
			template = template.replace(/{{attendees.inline}}/g, attendees.join(", "))
			template = template.replace(/{{attendees.list}}/g, attendees.map(attendee => `- ${attendee}`).join('\n'))
			template = template.replace(/{{attendees.link.inline}}/g, attendees.map(attendee => `[[${attendee}]]`).join(", "))
			template = template.replace(/{{attendees.link.list}}/g, attendees.map(attendee => `- [[${attendee}]]`).join('\n'))
			this.eventNote = template
		} else {
			this.eventNote = String(`### ${this.eventStart(startDay, fileDate, plugin)} - ${this.eventEnd(endDay, fileDate, plugin)} : ${this.ical.summary}`)
		}
	}

	renderShortEvent(startDay: string, endDay: string, fileDate: string, plugin: ICal, length: number) {
		this.shortEvent = String(`${this.eventStart(startDay, fileDate, plugin)} - ${this.eventEnd(endDay, fileDate, plugin)} : ${typeof this.ical.summary == "string" ? this.ical.summary.substring(0, length) + '...' : ''}`)
	}

	renderEventLine(plugin: ICal, startDay: string, endDay: string, fileDate: string, template?: string): void {
		if (template) {
			let attendees: string[] = []
			template = template.replace(/{{startday}}/g, this.start.format(plugin.settings.dateFormat))
			template = template.replace(/{{starttime}}/g, this.start.format(plugin.settings.timeFormat))
			template = template.replace(/{{endday}}/g, this.end.format(plugin.settings.dateFormat))
			template = template.replace(/{{endtime}}/g, this.end.format(plugin.settings.timeFormat))
			template = template.replace(/{{start}}/g, this.eventStart(startDay, fileDate, plugin))
			template = template.replace(/{{end}}/g, this.eventEnd(endDay, fileDate, plugin))
			template = template.replace(/{{summary}}/g, `${this.ical.summary.replace(/[:/]/g, "-")}`)
			template = template.replace(/{{organizer}}/g, `${this.ical.organizer ? (<any>this.ical.organizer)['params']['CN'].replace(/"/g, '') : ""}`)
			template = template.replace(/{{organizer.link}}/g, `${this.ical.organizer ? `[[${(<any>this.ical.organizer)['params']['CN'].replace(/"/g, '')}]]` : ""}`)
			if (Object.keys(this.ical).includes("attendee")) {
				const _attendees: Array<Record<string, string>> = Object.entries(this.ical).filter(item => item[0] == "attendee")[0][1]
				if (_attendees instanceof Array) {
					_attendees.forEach(attendee => {
						const _params = Object.entries(attendee).filter(item => item[0] == "params")
						const params = _params.length > 0 ? _params[0][1] : null
						const _cn = params ? Object.entries(params).filter(item => item[0] == "CN") : null
						if (_cn && `${_cn[0][1]}` != `${(<any>this.ical.organizer)["params"]["CN"]}`) { attendees.push(`${_cn[0][1]}`.replace(/"/g, '')) }
					})
				} else {
					attendees.push(_attendees["params"]["CN"])
				}
			}
			template = template.replace(/{{attendees.inline}}/g, attendees.join(", "))
			template = template.replace(/{{attendees.list}}/g, attendees.map(attendee => `- ${attendee}`).join('\n'))
			template = template.replace(/{{attendees.link.inline}}/g, attendees.map(attendee => `[[${attendee}]]`).join(", "))
			template = template.replace(/{{attendees.link.list}}/g, attendees.map(attendee => `- [[${attendee}]]`).join('\n'))
			this.eventLine = template
		} else {
			this.eventLine = String(`### ${this.eventStart(startDay, fileDate, plugin)} - ${this.eventEnd(endDay, fileDate, plugin)} : ${this.ical.summary}`)
		}
	}

	eventStart(startDay: string, fileDate: string, plugin: ICal): string {
		const dateFormat = plugin.settings.dateFormat
		const timeFormat = plugin.settings.timeFormat
		return startDay < fileDate ? this.start.format(dateFormat + " " + timeFormat) : this.start.format(timeFormat)
	}

	eventEnd(endDay: string, fileDate: string, plugin: ICal): string {
		const dateFormat = plugin.settings.dateFormat
		const timeFormat = plugin.settings.timeFormat
		return endDay > fileDate ? this.end.format(dateFormat + " " + timeFormat) : this.end.format(timeFormat)
	}

	static compareEvents(a: ICalEvent, b: ICalEvent) {
		if (a.start.isBefore(b.start)) {
			return -1
		} else if (a.start.isAfter(b.start)) {
			return 1
		} else if (a.start.isSame(b.start)) {
			if (a.end.isBefore(b.end)) {
				return -1
			} else {
				return 1
			}
		}
	}

	static async extractCalInfo(filePath: string, fileDate: string, eventLineTemplate: string, eventNoteTemplate: string, plugin: ICal): Promise<ICalEvent | null> {
		const fs = require('fs')
		let result = fs.readFileSync(filePath, 'utf8', (err: Error, data: string) => {
			if (err) {
				console.error(err)
				return
			}
			return data
		})
		let startDay = ""
		let endDay = ""
		result.split("\n").forEach((line: string) => {
			if (line.startsWith('DTSTART')) {
				const regex = line.match(/(\d{8})T(\d{4})|VALUE=DATE:(\d{8})/)
				if (regex && regex.length > 0) {
					startDay = `${regex[1] ? regex[1] : regex[3]}`
				}
			} else if (line.startsWith('DTEND')) {
				const regex = line.match(/(\d{8})T(\d{4})|VALUE=DATE:(\d{8})/)
				if (regex && regex.length > 0) {
					endDay = `${regex[1] ? regex[1] : regex[3]}`
				}
			}
		})
		if (startDay <= fileDate && fileDate <= endDay) {
			if (plugin.app.vault.adapter instanceof FileSystemAdapter) {
				const iCalEvent = new ICalEvent(plugin, filePath, startDay, endDay, fileDate)
				iCalEvent.renderShortEvent(startDay, endDay, fileDate, plugin, 35)
				iCalEvent.renderEventLine(plugin, startDay, endDay, fileDate, eventLineTemplate)
				iCalEvent.renderEventNote(plugin, startDay, endDay, fileDate, eventNoteTemplate)
				return (iCalEvent)
			}
			else {
				return (null)
			}
		}
		return (null)
	}
}