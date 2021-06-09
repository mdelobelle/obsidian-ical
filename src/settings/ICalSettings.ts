export interface ICalSettings {
	icsFolder: string;
	iCalTemplatePath: string
	dateFormat: string
	timeFormat: string
}

export const DEFAULT_SETTINGS: ICalSettings = {
	icsFolder: '',
	iCalTemplatePath: null,
	dateFormat: "ddd DD/MM",
	timeFormat: "HH:mm"
}