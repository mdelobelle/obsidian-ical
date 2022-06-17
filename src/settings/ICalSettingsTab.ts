import { App, PluginSettingTab, Setting, TextAreaComponent, TextComponent } from "obsidian"
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
		/* iCal template file */
		new Setting(containerEl)
			.setName('Event Template File')
			.setDesc('Path of the file containing template for the event')
			.addText((text) => {
				text
					.setPlaceholder('Path/to/template.md')
					.setValue(this.plugin.settings.iCalTemplatePath)
					.onChange(async (value) => {
						this.plugin.settings.iCalTemplatePath = value
						await this.plugin.saveSettings();
					})
			});
		/* iCal template file */
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
		/* iCal template file */
		new Setting(containerEl)
			.setName('Event Date format')
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