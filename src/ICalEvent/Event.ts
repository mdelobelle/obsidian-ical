import ICal from '../../main'
import { moment } from 'obsidian'

interface IEvent {
    eventId: number;
    status: number;
    summary: string;
    unixStart: number; // unix time from Jan 01 2001
    unixEnd: number; // unix time from Jan 01 2001
    organizer: string;
    attendees: string[];
}

export class Event implements IEvent {

    public attendeesWithAlias: { name: string, alias: string }[] = [];
    public shortEvent: string
    public start: moment.Moment
    public end: moment.Moment
    public dateFormat: string
    public timeFormat: string
    public eventNote: string
    public eventLine: string

    constructor(
        public plugin: ICal,
        public fileDate: string,
        public eventId: number,
        public status: number,
        public summary: string,
        public unixStart: number, // unix time from Jan 01 2001
        public unixEnd: number, // unix time from Jan 01 2001
        public organizer: string,
        public attendees: string[],
    ) {
        const attendeesAliases = this.plugin.settings.attendeesAliases
        this.attendees.forEach(attendee => {
            const attendeeWithAlias = attendeesAliases.find(a => a.name === attendee)
            this.attendeesWithAlias.push({ name: attendee, alias: attendeeWithAlias?.alias || attendee })
        })
        this.dateFormat = this.plugin.settings.dateFormat
        this.timeFormat = this.plugin.settings.timeFormat
        this.start = moment(unixStart * 1000).add(31, 'y')
        this.end = moment(unixEnd * 1000).add(31, 'y')
        this.renderShortEvent(35)
        this.renderEventLine()
        this.renderEventNote()
    }

    createNote = () => {
        const folder = this.plugin.settings.iCalEventNotesFolder
        let template = this.plugin.settings.iCalEventNotesFileNameTemplate
        if (template) {
            template = template.replace(/{{startday}}/g, this.start.format(this.plugin.settings.dateFormat))
            template = template.replace(/{{starttime}}/g, this.start.format(this.plugin.settings.timeFormat))
            template = template.replace(/{{endday}}/g, this.end.format(this.plugin.settings.dateFormat))
            template = template.replace(/{{endtime}}/g, this.end.format(this.plugin.settings.timeFormat))
            template = template.replace(/{{start}}/g, this.eventStart())
            template = template.replace(/{{end}}/g, this.eventEnd())
            template = template.replace(/{{summary}}/g, `${this.summary.replace(/[:/]/g, "-")}`)
            template = template.replace(/{{organizer}}/g, `${this.organizer || ""}`)
        } else {
            template = String(`${this.start.format(this.dateFormat)} - ${this.start.format(this.timeFormat)} - ${this.summary.replace(/[:/]/g, "-")}`)
        }
        const filename = template.replace(/[:/]/g, "-")
        this.plugin.app.vault.create(folder + filename + ".md", this.eventNote)
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
        template = template.replace(/{{organizer}}/g, `${this.organizer || ""}`)
        template = template.replace(/{{organizer.link}}/g, `${this.organizer ? `[[${this.organizer}]]` : ""}`)
        template = template.replace(/{{attendees.inline}}/g, this.attendeesWithAlias.map(a => a.alias).join(", "))
        template = template.replace(/{{attendees.list}}/g, this.attendeesWithAlias.map(a => `- ${a.alias}`).join('\n'))
        template = template.replace(/{{attendees.link.inline}}/g, this.attendeesWithAlias.map(a => `[[${a.alias}]]`).join(", "))
        template = template.replace(/{{attendees.link.list}}/g, this.attendeesWithAlias.map(a => `- [[${a.alias}]]`).join('\n'))
        return template
    }

    renderEventNote() {
        const template = this.plugin.eventNoteTemplate
        if (template) {
            this.eventNote = this.renderTemplate(template)
        } else {
            this.eventNote = String(`### ${this.eventStart()} - ${this.eventEnd()} : ${this.summary}`)
        }
    }

    renderShortEvent(length: number) {
        this.shortEvent = String(`${this.eventStart()} - ${this.eventEnd()} : ${typeof this.summary == "string" ? this.summary.substring(0, length) + '...' : ''}`)
    }

    renderEventLine(): void {
        const template = this.plugin.eventLineTemplate
        if (template) {
            this.eventLine = this.renderTemplate(template)
        } else {
            this.eventLine = String(`### ${this.eventStart()} - ${this.eventEnd()} : ${this.summary}`)
        }
    }

    eventStart(): string {
        return this.start.format("YYYY-MM-DD") < this.fileDate ? this.start.format(this.dateFormat + " " + this.timeFormat) : this.start.format(this.timeFormat)
    }

    eventEnd(): string {
        return this.end.format("YYYY-MM-DD") > this.fileDate ? this.end.format(this.dateFormat + " " + this.timeFormat) : this.end.format(this.timeFormat)
    }
}