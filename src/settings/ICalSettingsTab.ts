import { App, PluginSettingTab, Setting, TextComponent, ButtonComponent } from "obsidian"
import ICal from "../../main"


export default class ICalSettingsTab extends PluginSettingTab {
	plugin: ICal

	constructor(app: App, plugin: ICal) {
		super(app, plugin)
		this.plugin = plugin
	}

	createTitle = (container: HTMLElement, calendar: { name: string, path: string }): HTMLSpanElement => {
		const calendarTitleContainer = container.createDiv({
			cls: "calendarTitleContainer"
		})
		const title = calendarTitleContainer.createEl('span', { text: calendar.name, cls: "calendarTitle" })
		const calendarTitleRemoveButton = new ButtonComponent(calendarTitleContainer)
		calendarTitleRemoveButton.setIcon("trash")
		calendarTitleRemoveButton.setClass("calendarRemoveButton")
		calendarTitleRemoveButton.onClick(e => {
			this.plugin.settings.icsCalendars.remove(calendar)
			this.plugin.saveSettings()
			container.remove()
		})
		return title
	}


	createPathInput = (container: HTMLElement, calendar: { name: string, path: string }): void => {
		const calendarPathContainer = container.createDiv({
			cls: "calendarInput large"
		})
		calendarPathContainer.createEl('span', { text: "Path", cls: "calendarInputLabel" })
		const calendarPath = new TextComponent(calendarPathContainer)
		calendarPath.setValue(calendar.path)
		calendarPath.setPlaceholder('Path/to/.icsFolder/')
		calendarPath.onChange(value => {
			this.plugin.settings.icsCalendars.map(c => { if (c.name == calendar.name) { c.path = value } })
			this.plugin.saveSettings()
		})
	}

	createNameInput = (container: HTMLElement, calendar: { name: string, path: string }, title: HTMLSpanElement): void => {
		const calendarNameContainer = container.createDiv({
			cls: "calendarInput"
		})
		calendarNameContainer.createEl('span', { text: "Name", cls: "calendarInputLabel" })
		const calendarName = new TextComponent(calendarNameContainer)
		calendarName.setValue(calendar.name)
		calendarName.setPlaceholder('Name')
		calendarName.onChange(value => {
			this.plugin.settings.icsCalendars.map(c => { if (c.name == calendar.name) { c.name = value } })
			title.textContent = value
			this.plugin.saveSettings()
		})
	}

	display() {
		let { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Settings for ICal' });
		/* Folder containing ics files */
		new Setting(containerEl)
			.setName('calendars')
			.setDesc('Name and path of the calendars you want to look into')
		const calendarsContainer = containerEl.createDiv()
		this.plugin.settings.icsCalendars.forEach((calendar: { name: string, path: string }, i: number) => {
			const calendarContainer = calendarsContainer.createDiv()
			const title = this.createTitle(calendarContainer, calendar)
			this.createPathInput(calendarContainer, calendar)
			this.createNameInput(calendarContainer, calendar, title)
		})
		const addNewCalendarContainer = containerEl.createDiv({
			cls: "addNewCalendarContainer"
		})
		addNewCalendarContainer.createDiv({
			cls: "addNewCalendarContainerSpacer"
		})

		const addNewCalendarButton = new ButtonComponent(addNewCalendarContainer)
		addNewCalendarButton.setButtonText("+")
		addNewCalendarButton.setTooltip("Add a new calendar")
		addNewCalendarButton.onClick(e => {
			e.preventDefault();
			const newCalendar = { name: `calendar_${this.plugin.settings.icsCalendars.length + 1}`, path: "" }
			this.plugin.settings.icsCalendars.push(newCalendar)
			const calendarContainer = calendarsContainer.createDiv()
			const newTitle = this.createTitle(calendarContainer, newCalendar)
			this.createPathInput(calendarContainer, newCalendar)
			this.createNameInput(calendarContainer, newCalendar, newTitle)
			this.plugin.saveSettings()
		})


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

		/* Tag for filtering attendees files */
		new Setting(containerEl)
			.setName('Tag for filtering attendees files')
			.setDesc('tag')
			.addText((text) => {
				text
					.setValue(this.plugin.settings.searchTag)
					.onChange(async (value) => {
						this.plugin.settings.searchTag = value
						await this.plugin.saveSettings();
					})
			});
	}
}