export interface EventTemplate {
	name: string
	lineTemplatePath?: string
	noteTemplatePath?: string,
	destFolder: string,
	fileTitleTemplate: string
}

export const DEFAULT_TEMPLATE: EventTemplate = {
	name: "DEFAULT",
	lineTemplatePath: undefined,
	noteTemplatePath: undefined,
	destFolder: "/",
	fileTitleTemplate: "{{summary}}",
}

export interface ICalSettings {
	icsCalendars: { name: string, path: string }[];
	calendarDbPath: string;
	iCalEventNoteTemplates: EventTemplate[]
	dateFormat: string
	timeFormat: string
	dailyNoteDateFormat: string
	attendeesAliases: { name: string, alias: string }[]
	searchTag: string,
	apiUrl: string
	defaultTemplate: string | null
}

export const DEFAULT_SETTINGS: ICalSettings = {
	icsCalendars: [],
	calendarDbPath: null,
	iCalEventNoteTemplates: [DEFAULT_TEMPLATE],
	dateFormat: "ddd DD/MM",
	timeFormat: "HH:mm",
	dailyNoteDateFormat: "YYYY-MM-DD",
	attendeesAliases: [],
	searchTag: null,
	apiUrl: "http://localhost:8080",
	defaultTemplate: null
}