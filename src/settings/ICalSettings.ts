export interface ICalSettings {
	icsCalendars: { name: string, path: string }[];
	calendarDbPath: string;
	iCalEventLineTemplatePath: string
	iCalEventNoteTemplatePath: string
	dateFormat: string
	timeFormat: string
	iCalEventNotesFolder: string
	iCalEventNotesFileNameTemplate: string
	dailyNoteDateFormat: string
	attendeesAliases: { name: string, alias: string }[]
	searchTag: string
}

export const DEFAULT_SETTINGS: ICalSettings = {
	icsCalendars: [],
	calendarDbPath: null,
	iCalEventLineTemplatePath: null,
	iCalEventNoteTemplatePath: null,
	dateFormat: "ddd DD/MM",
	timeFormat: "HH:mm",
	iCalEventNotesFolder: null,
	iCalEventNotesFileNameTemplate: null,
	dailyNoteDateFormat: "YYYY-MM-DD",
	attendeesAliases: [],
	searchTag: null
}