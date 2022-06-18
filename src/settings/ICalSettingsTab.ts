import { App, PluginSettingTab, Setting } from "obsidian"
import ICal from "../../main"

export default class ICalSettingsTab extends PluginSettingTab {
	plugin: ICal

	constructor(app: App, plugin: ICal) {
		super(app, plugin)
		this.plugin = plugin
	}

	display() {
		let { containerEl } = this;

		containerEl.empty();
		containerEl.createEl('h2', { text: 'Settings for ICal' });
		/* Folder containing ics files */
		new Setting(containerEl)
			.setName('.ics files folder')
			.setDesc('Path of the folder containing .ics files')
			.addText((text) => {
				text
					.setPlaceholder('Path/to/folder')
					.setValue(this.plugin.settings.icsFolder)
					.onChange(async (value) => {
						this.plugin.settings.icsFolder = value
						await this.plugin.saveSettings();
					})
			});
		/*Daily note date format*/
		new Setting(containerEl)
			.setName('daily notes date format')
			.setDesc('daily notes date format')
			.addText((text) => {
				text
					.setPlaceholder('YYYY-MM-DD')
					.setValue(this.plugin.settings.dailyNoteDateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dailyNoteDateFormat = value
						await this.plugin.saveSettings();
					})
			});
		/* iCal event line template file */
		new Setting(containerEl)
			.setName('Event line template file')
			.setDesc('Path of the file containing template for the event')
			.addText((text) => {
				text
					.setPlaceholder('Path/to/template.md')
					.setValue(this.plugin.settings.iCalEventLineTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.iCalEventLineTemplatePath = value
						await this.plugin.saveSettings();
					})
			});

		/* iCal event note template file */
		new Setting(containerEl)
			.setName('Event note template file')
			.setDesc('Path of the file containing template for the event')
			.addText((text) => {
				text
					.setPlaceholder('Path/to/template.md')
					.setValue(this.plugin.settings.iCalEventNoteTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.iCalEventNoteTemplatePath = value
						await this.plugin.saveSettings();
					})
			});

		/* iCal event note folder */
		new Setting(containerEl)
			.setName('Event notes folder')
			.setDesc('Folder containing event notes')
			.addText((text) => {
				text
					.setPlaceholder('Path/to/folder/')
					.setValue(this.plugin.settings.iCalEventNotesFolder)
					.onChange(async (value) => {
						this.plugin.settings.iCalEventNotesFolder = value
						await this.plugin.saveSettings();
					})
			});

		/* iCal event note file name template */
		new Setting(containerEl)
			.setName('Event notes filename template ')
			.setDesc('Template for event notes file names')
			.addText((text) => {
				text
					.setPlaceholder('Path/to/folder/')
					.setValue(this.plugin.settings.iCalEventNotesFileNameTemplate)
					.onChange(async (value) => {
						this.plugin.settings.iCalEventNotesFileNameTemplate = value
						await this.plugin.saveSettings();
					})
			});

		/* Event date format */
		new Setting(containerEl)
			.setName('Event Date format')
			.setDesc('Format to display the date of the event')
			.addText((text) => {
				text
					.setPlaceholder('ddd DD/MM')
					.setValue(this.plugin.settings.dateFormat)
					.onChange(async (value) => {
						this.plugin.settings.dateFormat = value
						await this.plugin.saveSettings();
					})
			});
		/* Event time */
		new Setting(containerEl)
			.setName('Event time format')
			.setDesc('Format to display the time of the event')
			.addText((text) => {
				text
					.setPlaceholder('HH:mm')
					.setValue(this.plugin.settings.timeFormat)
					.onChange(async (value) => {
						this.plugin.settings.timeFormat = value
						await this.plugin.saveSettings();
					})
			});
	}
}