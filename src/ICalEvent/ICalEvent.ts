import { moment, TFile, FileSystemAdapter } from "obsidian"
import ICal from "main"
import { parseFile, CalendarComponent } from "ical"

export default class ICalEvent {
	start: moment.Moment
	end: moment.Moment
	event: string
	shortEvent: string = ""
	ical: CalendarComponent

	constructor(filePath: string) {
		const ics = parseFile(filePath)
		if (Object.keys(ics).length > 0) {
			this.ical = ics[Object.keys(ics)[0]]
			this.start = moment(new Date(Date.parse(`${this.ical.start}`)));
			this.end = moment(new Date(Date.parse(`${this.ical.end}`)));
		}
	}

	renderShortEvent(startDay: string, endDay: string, fileDate: string, plugin: ICal) {
		this.shortEvent = String(`${this.eventStart(startDay, fileDate, plugin)} - ${this.eventEnd(endDay, fileDate, plugin)} : ${typeof this.ical.summary == "string" ? this.ical.summary.substring(0, 25) + '...' : ''}`)
	}

	renderEvent(plugin: ICal, startDay: string, endDay: string, fileDate: string, template?: string): void {
		if (template) {
			let attendees: string[] = []
			template = template.replace("{{startday}}", this.start.format(plugin.settings.dateFormat))
			template = template.replace("{{starttime}}", this.start.format(plugin.settings.timeFormat))
			template = template.replace("{{endday}}", this.end.format(plugin.settings.dateFormat))
			template = template.replace("{{endtime}}", this.end.format(plugin.settings.timeFormat))
			template = template.replace("{{start}}", this.eventStart(startDay, fileDate, plugin))
			template = template.replace("{{end}}", this.eventEnd(endDay, fileDate, plugin))
			template = template.replace("{{summary}}", `${this.ical.summary}`)
			template = template.replace("{{organizer}}", `${this.ical.organizer ? (<any>this.ical.organizer)['params']['CN'] : ""}`)
			if (Object.keys(this.ical).includes("attendee")) {
				const _attendees: Array<Record<string, string>> = Object.entries(this.ical).filter(item => item[0] == "attendee")[0][1]
				if (_attendees instanceof Array) {
					_attendees.forEach(attendee => {
						const _params = Object.entries(attendee).filter(item => item[0] == "params")
						const params = _params.length > 0 ? _params[0][1] : null
						const _cn = params ? Object.entries(params).filter(item => item[0] == "CN") : null
						if (_cn && `${_cn[0][1]}` != `${(<any>this.ical.organizer)["params"]["CN"]}`) { attendees.push(`${_cn[0][1]}`) }
					})
				} else {
					attendees.push(_attendees["params"]["CN"])
				}
			}
			template = template.replace("{{attendees.inline}}", attendees.join(", "))
			template = template.replace("{{attendees.list}}", attendees.map(attendee => `- ${attendee}`).join('\n'))
			template = template.replace("{{attendees.link.inline}}", attendees.map(attendee => `[[${attendee}]]`).join(", "))
			template = template.replace("{{attendees.link.list}}", attendees.map(attendee => `- [[${attendee}]]`).join('\n'))
			this.event = template
		} else {
			this.event = String(`### ${this.eventStart(startDay, fileDate, plugin)} - ${this.eventEnd(endDay, fileDate, plugin)} : ${this.ical.summary}`)
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

	static async extractCalInfo(file: TFile, fileDate: string, template: string, plugin: ICal): Promise<ICalEvent | null> {
		let result = await plugin.app.vault.cachedRead(file)
		let startDay = ""
		let endDay = ""
		result.split("\n").forEach(line => {
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
				let basePath = plugin.app.vault.adapter.getBasePath();
				const iCalEvent = new ICalEvent(`${basePath}/${plugin.settings.icsFolder}/${file.name}`)
				iCalEvent.renderShortEvent(startDay, endDay, fileDate, plugin)
				iCalEvent.renderEvent(plugin, startDay, endDay, fileDate, template)
				return (iCalEvent)
			}
			else {
				return (null)
			}
		}
		return (null)
	}
}