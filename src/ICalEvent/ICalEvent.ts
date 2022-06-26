import { moment, FileSystemAdapter, MomentFormatComponent } from "obsidian"
import ICal from "../../main"
import { parseFile, CalendarComponent } from "ical"

export default class ICalEvent {
	start: moment.Moment
	end: moment.Moment
	eventLine: string
	shortEvent: string = ""
	renderNote: boolean = false
	eventNote: string
	startDay: string = ""
	endDay: string = ""
	fileDate: string = ""
	event: CalendarComponent
	plugin: ICal
	calendarName: string
	calendarId: number
	summary: string = ""
	attendees: { name: string, alias: string }[] = []
	createNote: () => void
	getAttendeesFromEvent: () => { name: string, alias: string }[]

	constructor(
		plugin: ICal,
		fileDate: string,
		eventLineTemplate: string,
		eventNoteTemplate: string,
		event: CalendarComponent,
		calendarName: string,
		calendarId: number,
		recStartDate?: moment.Moment,
		recEndDate?: moment.Moment,
	) {
		this.event = event
		console.log(this.event)
		this.start = recStartDate !== undefined ? recStartDate : moment(event.start);
		this.end = recEndDate !== undefined ? recEndDate : moment(event.end);
		this.startDay = this.start.format("YYYYMMDD")
		this.endDay = this.end.format("YYYYMMDD")
		this.fileDate = fileDate
		this.plugin = plugin
		this.calendarName = calendarName
		this.calendarId = calendarId

		Object.defineProperty(this, "summary", {
			get: function () {
				return this._summary
			},
			set: function (val) {
				this._summary = val;
				this.renderShortEvent(35)
				this.renderEventLine(eventLineTemplate)
				this.renderEventNote(eventNoteTemplate)
			}
		})

		Object.defineProperty(this, "attendees", {
			get: function () {
				return this._attendees
			},
			set: function (val) {
				this._attendees = val;
				//we don't render until summary has been set: means that all object has not been built yet
				if (this.summary) {
					this.renderEventLine(eventLineTemplate)
					this.renderEventNote(eventNoteTemplate)
				}
			}
		})

		this.getAttendeesFromEvent = () => {
			let attendees: { name: string, alias: string }[] = []
			if (Object.keys(this.event).includes("attendee")) {
				const _attendees = Object.entries(this.event).filter(item => item[0] == "attendee")[0][1]
				if (_attendees instanceof Array) {
					_attendees.forEach(attendee => {
						const _params = Object.entries(attendee).filter(item => item[0] == "params")
						const params = _params.length > 0 ? _params[0][1] : null
						const _cn = params ? Object.entries(params).filter(item => item[0] == "CN") : null
						if (_cn && `${_cn[0][1]}` != `${(<any>this.event.organizer)["params"]["CN"]}`) {
							let attendeeFromEvent = `${_cn[0][1]}`.replace(/"/g, '')
							let filteredStoredAliases = this.plugin.settings.attendeesAliases.filter(a => a.name === attendeeFromEvent)
							let aliasedAttendee = filteredStoredAliases.length > 0 ? filteredStoredAliases[0].alias : attendeeFromEvent
							attendees.push({ name: attendeeFromEvent, alias: aliasedAttendee })
						}
					})
				} else {
					let attendeeFromEvent = _attendees["params"]["CN"].replace(/"/g, '')
					let filteredStoredAliases = this.plugin.settings.attendeesAliases.filter(a => a.name === attendeeFromEvent)
					let aliasedAttendee = filteredStoredAliases.length > 0 ? filteredStoredAliases[0].alias : attendeeFromEvent
					attendees.push({ name: attendeeFromEvent, alias: aliasedAttendee })
				}
			}
			return attendees
		}
		this.attendees = this.getAttendeesFromEvent()
		this.summary = event.summary

		this.createNote = () => {
			const folder = plugin.settings.iCalEventNotesFolder
			let filename = plugin.settings.iCalEventNotesFileNameTemplate
			if (filename) {
				filename = filename.replace(/{{startday}}/g, this.start.format(plugin.settings.dateFormat))
				filename = filename.replace(/{{starttime}}/g, this.start.format(plugin.settings.timeFormat))
				filename = filename.replace(/{{endday}}/g, this.end.format(plugin.settings.dateFormat))
				filename = filename.replace(/{{endtime}}/g, this.end.format(plugin.settings.timeFormat))
				filename = filename.replace(/{{start}}/g, this.eventStart())
				filename = filename.replace(/{{end}}/g, this.eventEnd())
				filename = filename.replace(/{{summary}}/g, `${this.summary.replace(/[:/]/g, "-")}`)
				filename = filename.replace(/{{organizer}}/g, `${this.event.organizer ? (<any>this.event.organizer)['params']['CN'].replace(/"/g, '') : ""}`)
			} else {
				filename = String(`${this.start.format(plugin.settings.dateFormat)} - ${this.start.format(plugin.settings.timeFormat)} - ${this.summary.replace(/[:/]/g, "-")}`)
			}
			filename = filename.replace(/[:/]/g, "-")
			plugin.app.vault.create(folder + filename + ".md", this.eventNote)
		}
	}

	renderTemplate(_template: string) {
		let template = _template
		template = template.replace(/{{startday}}/g, this.start.format(this.plugin.settings.dateFormat))
		template = template.replace(/{{starttime}}/g, this.start.format(this.plugin.settings.timeFormat))
		template = template.replace(/{{endday}}/g, this.end.format(this.plugin.settings.dateFormat))
		template = template.replace(/{{endtime}}/g, this.end.format(this.plugin.settings.timeFormat))
		template = template.replace(/{{start}}/g, this.eventStart())
		template = template.replace(/{{end}}/g, this.eventEnd())
		template = template.replace(/{{summary}}/g, `${this.summary.replace(/[:/]/g, "-")}`)
		template = template.replace(/{{organizer}}/g, `${this.event.organizer ? (<any>this.event.organizer)['params']['CN'].replace(/"/g, '') : ""}`)
		template = template.replace(/{{organizer.link}}/g, `${this.event.organizer ? `[[${(<any>this.event.organizer)['params']['CN'].replace(/"/g, '')}]]` : ""}`)
		template = template.replace(/{{attendees.inline}}/g, this.attendees.map(a => a.alias).join(", "))
		template = template.replace(/{{attendees.list}}/g, this.attendees.map(a => `- ${a.alias}`).join('\n'))
		template = template.replace(/{{attendees.link.inline}}/g, this.attendees.map(a => `[[${a.alias}]]`).join(", "))
		template = template.replace(/{{attendees.link.list}}/g, this.attendees.map(a => `- [[${a.alias}]]`).join('\n'))
		return template
	}

	renderEventNote(template?: string) {
		if (template) {
			this.eventNote = this.renderTemplate(template)
		} else {
			this.eventNote = String(`### ${this.eventStart()} - ${this.eventEnd()} : ${this.summary}`)
		}
	}

	renderShortEvent(length: number) {
		this.shortEvent = String(`${this.eventStart()} - ${this.eventEnd()} : ${typeof this.summary == "string" ? this.summary.substring(0, length) + '...' : ''}`)
	}

	renderEventLine(template?: string): void {
		if (template) {
			this.eventLine = this.renderTemplate(template)
		} else {
			this.eventLine = String(`### ${this.eventStart()} - ${this.eventEnd()} : ${this.summary}`)
		}
	}

	eventStart(): string {
		const dateFormat = this.plugin.settings.dateFormat
		const timeFormat = this.plugin.settings.timeFormat
		return this.startDay < this.fileDate && this.event.rrule === undefined ? this.start.format(dateFormat + " " + timeFormat) : this.start.format(timeFormat)
	}

	eventEnd(): string {
		const dateFormat = this.plugin.settings.dateFormat
		const timeFormat = this.plugin.settings.timeFormat
		return this.endDay > this.fileDate && this.event.rrule === undefined ? this.end.format(dateFormat + " " + timeFormat) : this.end.format(timeFormat)
	}

	static compareEvents(a: ICalEvent, b: ICalEvent) {
		if (a.start.format("HHmm") < b.start.format("HHmm")) {
			return -1
		} else if (a.start.format("HHmm") > b.start.format("HHmm")) {
			return 1
		} else if (a.start.format("HHmm") == b.start.format("HHmm")) {
			if (a.end.format("HHmm") < b.end.format("HHmm")) {
				return -1
			} else {
				return 1
			}
		}
	}

	static async extractCalInfo(
		filePath: string,
		fileDate: string,
		eventLineTemplate: string,
		eventNoteTemplate: string,
		plugin: ICal,
		calendarName: string,
		calendarId: number
	): Promise<ICalEvent | null> {

		var data = parseFile(filePath);

		// Complicated example demonstrating how to handle recurrence rules and exceptions.

		for (var k in data) {

			// When dealing with calendar recurrences, you need a range of dates to query against,
			// because otherwise you can get an infinite number of calendar events.
			var rangeStart = moment(fileDate);
			var rangeEnd = moment(fileDate).add(1, 'days');

			var event = data[k]
			if (event.type === 'VEVENT') {

				var startDate = moment(event.start);
				var endDate = moment(event.end);

				// Calculate the duration of the event for use with recurring events.
				var duration = parseInt(endDate.format("x")) - parseInt(startDate.format("x"));

				// Simple case - no recurrences, just print out the calendar event.
				if (event.rrule === undefined
					&& startDate.isAfter(rangeStart)
					&& endDate.isBefore(rangeEnd)
					&& event.recurrenceid === undefined) {

					if (plugin.app.vault.adapter instanceof FileSystemAdapter) {
						const iCalEvent = new ICalEvent(
							plugin,
							fileDate,
							eventLineTemplate,
							eventNoteTemplate,
							event,
							calendarName,
							calendarId
						)
						return (iCalEvent)
					}
					else {
						return (null)
					}
				}

				// Complicated case - if an RRULE exists, handle multiple recurrences of the event.
				else if (event.rrule !== undefined) {
					// For recurring events, get the set of event start dates that fall within the range
					// of dates we're looking for.
					let initialUtcOffSet = moment(event.start).utcOffset()
					var dates = event.rrule.between(
						rangeStart.toDate(),
						rangeEnd.toDate(),
						true,
						function (date, i) { return true; }
					)

					// The "dates" array contains the set of dates within our desired date range range that are valid
					// for the recurrence rule.  *However*, it's possible for us to have a specific recurrence that
					// had its date changed from outside the range to inside the range.  One way to handle this is
					// to add *all* recurrence override entries into the set of dates that we check, and then later
					// filter out any recurrences that don't actually belong within our range.
					if (event.recurrences != undefined) {
						for (var r in event.recurrences) {
							// Only add dates that weren't already in the range we added from the rrule so that 
							// we don't double-add those events.
							if (moment(new Date(r)).isBetween(rangeStart, rangeEnd) != true) {
								dates.push(new Date(r));
							}
						}
					}

					// Loop through the set of date entries to see which recurrences should be printed.
					for (var i in dates) {
						var date = dates[i];
						var curEvent = event;
						var showRecurrence = true;
						var curDuration = duration;

						let recStartDate = moment(date).subtract(moment(date).utcOffset() - initialUtcOffSet, 'minute');

						// Use just the date of the recurrence to look up overrides and exceptions (i.e. chop off time information)
						var dateLookupKey = moment(date.toISOString().substring(0, 10)).format("YYYY-MM-DD");

						// For each date that we're checking, it's possible that there is a recurrence override for that one day.
						// @ts-expect-error
						if ((curEvent.recurrences != undefined) && (curEvent.recurrences[dateLookupKey] != undefined)) {
							// We found an override, so for this recurrence, use a potentially different title, start date, and duration.
							// @ts-expect-error
							curEvent = curEvent.recurrences[dateLookupKey];
							recStartDate = moment(curEvent.start)
							curDuration = parseInt(moment(curEvent.end)
								.format("x")) - parseInt(recStartDate.format("x"));
						}
						// If there's no recurrence override, check for an exception date.  Exception dates represent exceptions to the rule.
						else if ((curEvent.exdate != undefined) && (curEvent.exdate[dateLookupKey] != undefined)) {
							// This date is an exception date, which means we should skip it in the recurrence pattern.
							showRecurrence = false;
						}

						// Set the the title and the end date from either the regular event or the recurrence override.
						let recEndDate = moment(parseInt(recStartDate.format("x")) + curDuration, 'x');

						// If this recurrence ends before the start of the date range, or starts after the end of the date range, 
						// don't process it.
						if (recEndDate.isBefore(rangeStart) || recStartDate.isAfter(rangeEnd)) {
							showRecurrence = false;
						}

						if (showRecurrence === true
							&& recStartDate.isAfter(rangeStart)
							&& recEndDate.isBefore(rangeEnd)) {
							if (plugin.app.vault.adapter instanceof FileSystemAdapter) {
								const iCalEvent = new ICalEvent(
									plugin,
									fileDate,
									eventLineTemplate,
									eventNoteTemplate,
									event,
									calendarName,
									calendarId,
									recStartDate,
									recEndDate)
								return (iCalEvent)
							}
							else {
								return (null)
							}
						}
					}
				}
			}
		}
		return (null)
	}
}