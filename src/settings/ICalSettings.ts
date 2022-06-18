export interface ICalSettings {
	icsFolder: string;
	iCalEventLineTemplatePath: string
	iCalEventNoteTemplatePath: string
	dateFormat: string
	timeFormat: string
	iCalEventNotesFolder: string
	iCalEventNotesFileNameTemplate: string
	dailyNoteDateFormat: string
}

export const DEFAULT_SETTINGS: ICalSettings = {
	icsFolder: '',
	iCalEventLineTemplatePath: null,
	iCalEventNoteTemplatePath: null,
	dateFormat: "ddd DD/MM",
	timeFormat: "HH:mm",
	iCalEventNotesFolder: null,
	iCalEventNotesFileNameTemplate: null,
	dailyNoteDateFormat: "YYYY-MM-DD"
}