import { DEFAULT_TEMPLATE, EventTemplate } from 'src/settings/ICalSettings';
import ICal from '../../main'
import { moment } from 'obsidian'

interface Participant {
    name: string;
    alias: string
}

interface IEvent {
    eventId: number;
    status: number;
    summary: string;
    unixStart: number; // unix time from Jan 01 2001
    unixEnd: number; // unix time from Jan 01 2001
    attendeesWithAlias: Participant[]
    organizerWithAlias: Participant
}

const availableVariables = [
    "start",
    "end"
]

export class Event implements IEvent {

    public attendeesWithAlias: Participant[] = [];
    public organizerWithAlias: Participant
    public shortEvent: string
    public start: moment.Moment
    public end: moment.Moment
    public dateFormat: string
    public timeFormat: string
    public eventNote: string
    public eventLine: string
    public templateName: string = "DEFAULT"

    constructor(
        public plugin: ICal,
        public fileDate: string,
        public eventId: number,
        public status: number,
        public summary: string,
        public unixStart: number, // unix time from Jan 01 2001
        public unixEnd: number, // unix time from Jan 01 2001
        organizer: string,
        attendees: string[],
    ) {
        const attendeesAliases = this.plugin.settings.attendeesAliases
        attendees.forEach(attendee => {
            const attendeeWithAlias = attendeesAliases.find(a => a.name === attendee)
            this.attendeesWithAlias.push({ name: attendee, alias: attendeeWithAlias?.alias || attendee })
        })
        const organizerAlias = attendeesAliases.find(a => a.name === organizer)
        this.organizerWithAlias = { name: organizer, alias: organizerAlias?.alias || organizer }
        this.dateFormat = this.plugin.settings.dateFormat
        this.timeFormat = this.plugin.settings.timeFormat
        this.start = moment((unixStart) * 1000).add(11323, 'd') // origin of time seems to be 1/1/1992 in calendar
        this.end = moment((unixEnd) * 1000).add(11323, 'd')
    }

    public build() {
        this.renderShortEvent(35)
        this.renderEventLine()
        this.renderEventNote()
    }

    public getTemplate(): EventTemplate {
        return this.plugin.settings.iCalEventNoteTemplates.find(t => t.name === this.templateName) || DEFAULT_TEMPLATE
    }

    private buildFolderPath() {
        let folderTemplate = this.getTemplate().destFolder
        const templateValues: Record<string, string> = {}
        const templateFieldRegex = new RegExp(`\\{\\{(?<field>[^\\}]+?)\\}\\}`, "gu");
        const tF = folderTemplate.matchAll(templateFieldRegex)
        let next = tF.next();
        while (!next.done) {
            if (next.value.groups) {
                const value = next.value.groups.field
                const [eventItem, itemFormat] = value.split(/:(.*)/s).map((v: string) => v.trim())
                templateValues[value] = "";
                if (itemFormat && availableVariables.includes(eventItem)) {
                    if (eventItem === "start") templateValues[value] = moment(this.start).format(itemFormat);
                    if (eventItem === "end") templateValues[value] = moment(this.end).format(itemFormat);
                } else {
                    templateValues[value] = "";
                }
            }
            next = tF.next()
        }
        Object.keys(templateValues).forEach(k => {
            const fieldRegex = new RegExp(`\\{\\{${k}\\}\\}`, "gu")
            folderTemplate = folderTemplate.replace(fieldRegex, templateValues[k])
        })
        folderTemplate = folderTemplate.replace(/\/$/, "")
        return folderTemplate
    }

    private resolveTemplates(_template: string) {
        let template = _template
        const templateValues: Record<string, string> = {}
        const templateFieldRegex = new RegExp(`\\{\\{(?<field>[^\\}]+?)\\}\\}`, "gu");
        const tF = template.matchAll(templateFieldRegex)
        let next = tF.next();
        while (!next.done) {
            if (next.value.groups) {
                const value = next.value.groups.field
                const [eventItem, itemFormat] = value.split(/:(.*)/s).map((v: string) => v.trim())
                templateValues[value] = "";
                if (itemFormat && availableVariables.includes(eventItem)) {
                    if (eventItem === "start") templateValues[value] = moment(this.start).format(itemFormat);
                    if (eventItem === "end") templateValues[value] = moment(this.end).format(itemFormat);
                } else {
                    switch (value) {
                        case "startday": templateValues[value] = this.start.format(this.plugin.settings.dateFormat); break;
                        case "starttime": templateValues[value] = this.start.format(this.plugin.settings.timeFormat); break;
                        case "endday": templateValues[value] = this.end.format(this.plugin.settings.dateFormat); break;
                        case "endtime": templateValues[value] = this.end.format(this.plugin.settings.timeFormat); break;
                        case "start": templateValues[value] = this.eventStart(); break;
                        case "end": templateValues[value] = this.eventEnd(); break;
                        case "summary": templateValues[value] = `${this.summary.replace(/[:/|]/g, "-").trim()}`; break;
                        case "organizer": templateValues[value] = `${this.organizerWithAlias.alias || ""}`; break;
                        case "organizer.link": templateValues[value] = `${this.organizerWithAlias.alias ? `[[${this.organizerWithAlias.alias}]]` : ""}`; break;
                        case "attendees.inline": templateValues[value] = this.attendeesWithAlias.map(a => a.alias).join(", "); break;
                        case "attendees.list": templateValues[value] = this.attendeesWithAlias.map(a => `- ${a.alias}`).join('\n'); break;
                        case "attendees.link.inline": templateValues[value] = this.attendeesWithAlias.map(a => `[[${a.alias}]]`).join(", "); break;
                        case "attendees.link.list": templateValues[value] = this.attendeesWithAlias.map(a => `- [[${a.alias}]]`).join('\n'); break;
                    }
                }
            }
            next = tF.next()
        }
        Object.keys(templateValues).forEach(k => {
            const fieldRegex = new RegExp(`\\{\\{${k}\\}\\}`, "gu")
            template = template.replace(fieldRegex, templateValues[k])
        })
        return template
    }

    createNote = async () => {
        let template = this.getTemplate().fileTitleTemplate
        if (template) {
            template = this.resolveTemplates(template)
        } else {
            template = String(`${this.start.format(this.dateFormat)} - ${this.start.format(this.timeFormat)} - ${this.summary.replace(/[:/]/g, "-").trim()}`)
        }
        const filename = template.replace(/[:/]/g, "-").trim()
        const folderTemplate = this.buildFolderPath()
        if (!this.plugin.app.vault.getAbstractFileByPath(folderTemplate)) await this.plugin.app.vault.createFolder(folderTemplate)
        await this.plugin.app.vault.create(`${folderTemplate}/${filename}.md`, this.eventNote)
    }

    renderEventNote() {
        const template = this.plugin.eventNoteTemplates.find(t => t.name === this.getTemplate().name)?.template
        if (template) {
            this.eventNote = this.resolveTemplates(template)
        } else {
            this.eventNote = String(`### ${this.eventStart()} - ${this.eventEnd()} : ${this.summary}`)
        }
    }

    renderShortEvent(length: number) {
        this.shortEvent = String(`${this.eventStart()} - ${this.eventEnd()} : ${typeof this.summary == "string" ? this.summary.substring(0, length) + '...' : ''}`)
    }

    renderEventLine(): void {
        const template = this.plugin.eventLineTemplates.find(t => t.name === this.getTemplate().name)?.template
        if (template) {
            this.eventLine = this.resolveTemplates(template)
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