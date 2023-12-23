import { App, ButtonComponent, DropdownComponent, Modal, PluginSettingTab, Setting, TextComponent } from "obsidian"
import ICal from "../../main"
import { EventTemplate } from "./ICalSettings";

class TemplateSettingModal extends Modal {
	eventLineTemplatePathContainer: TextComponent
	noteTemplatePathContainer: TextComponent
	destFolderContainer: TextComponent
	fileTitleTemplateContainer: TextComponent
	nameContainer: TextComponent
	initialTemplate: EventTemplate

	constructor(
		public plugin: ICal,
		public settingTab: ICalSettingsTab,
		public template?: EventTemplate
	) {
		super(plugin.app)
		this.containerEl.addClass("iCal")
		this.initialTemplate = template
		this.template = template || { name: "", lineTemplatePath: "", noteTemplatePath: "", destFolder: "", fileTitleTemplate: "" }
		this.build()
	}

	private build() {
		this.contentEl.createDiv({ text: "Template name" })
		this.nameContainer = new TextComponent(this.contentEl)
			.setValue(this.template.name || "")
			.onChange((value) => this.template.name = value)
		this.contentEl.createDiv({ text: "Event Line Template path" })
		this.eventLineTemplatePathContainer = new TextComponent(this.contentEl)
			.setValue(this.template.lineTemplatePath || "")
			.onChange((value) => this.template.lineTemplatePath = value)
		this.contentEl.createDiv({ text: "Note Template path" })
		this.noteTemplatePathContainer = new TextComponent(this.contentEl)
			.setValue(this.template.noteTemplatePath || "")
			.onChange((value) => this.template.noteTemplatePath = value)
		this.contentEl.createDiv({ text: "Destination folder path" })
		this.destFolderContainer = new TextComponent(this.contentEl)
			.setValue(this.template.destFolder || "")
			.onChange((value) => this.template.destFolder = value)
		this.contentEl.createDiv({ text: "File Title Template" })
		this.fileTitleTemplateContainer = new TextComponent(this.contentEl)
			.setValue(this.template.fileTitleTemplate || "")
			.onChange((value) => this.template.fileTitleTemplate = value)
		this.createSaveBtn()
	}

	private createSaveBtn() {
		const saveBtnContainer = this.contentEl.createDiv()
		new ButtonComponent(saveBtnContainer)
			.setIcon("save")
			.setClass("saveBtn")
			.onClick(() => {
				const templates = this.plugin.settings.iCalEventNoteTemplates
				const currentTemplate = templates.find(t => t.name === this.initialTemplate?.name)
				if (currentTemplate) {
					templates.splice(templates.indexOf(currentTemplate), 1, this.template)
				} else {
					templates.push(this.template)
				}
				this.plugin.settings.iCalEventNoteTemplates = templates
				this.plugin.saveSettings()
				this.settingTab.buildTemplates()
				this.close()
			})
	}
}

class TemplateSetting extends Setting {
	private fieldNameContainer: HTMLDivElement;

	constructor(
		private containerEl: HTMLElement,
		private settingTab: ICalSettingsTab,
		public template: EventTemplate,
		private plugin: ICal
	) {
		super(containerEl);
		this.setDescription();
		this.addEditButton();
		this.addDeleteButton();
		this.settingEl.addClass("no-border")
	};

	public setDescription(): void {

		this.infoEl.textContent = "";
		this.infoEl.addClass("setting-item")
		this.fieldNameContainer = this.infoEl.createDiv({ cls: "name" })

		this.fieldNameContainer.createDiv({ text: `${this.template.name}` })
	};

	private addEditButton(): void {
		this.addButton((b) => {
			b.setIcon("pencil")
				.setTooltip("Edit")
				.onClick(() => {
					let modal = new TemplateSettingModal(this.plugin, this.settingTab, this.template);
					modal.open();
				});
		});
	};

	private addDeleteButton(): void {
		this.addButton((b) => {
			b.setIcon("trash")
				.setTooltip("Delete")
				.onClick(() => {
					const templates = this.plugin.settings.iCalEventNoteTemplates
					const currentTemplate = templates.find(t => t.name === this.template.name)
					if (currentTemplate) {
						templates.splice(templates.indexOf(currentTemplate), 1)
					}
					this.plugin.saveSettings()
					this.settingTab.buildTemplates()
				});
		});
	};
};

export default class ICalSettingsTab extends PluginSettingTab {
	plugin: ICal
	templatesSettingContainer: HTMLDivElement
	defaultTemplateContainer: HTMLDivElement

	constructor(app: App, plugin: ICal) {
		super(app, plugin)
		this.plugin = plugin
	}

	public buildTemplates() {
		this.templatesSettingContainer.replaceChildren()
		const templatesContainer = this.templatesSettingContainer.createDiv({ cls: "setting-divider" })

		new Setting(this.templatesSettingContainer)
			.setName("Add New Note Template")
			.setDesc("Add a new path to a template for the event note.")
			.addButton((button: ButtonComponent): ButtonComponent => {
				return button
					.setTooltip("Add New Path")
					.setButtonText("Add new")
					.setCta()
					.onClick(() => new TemplateSettingModal(this.plugin, this).open());
			}).settingEl.addClass("no-border");
		/* Managed properties that currently have preset options */
		this.plugin.settings.iCalEventNoteTemplates.forEach(t => {
			new TemplateSetting(templatesContainer, this, t, this.plugin)
		});

	}

	public buildDefaultTemplateSelector() {
		this.defaultTemplateContainer.replaceChildren()
		new Setting(this.defaultTemplateContainer)
			.setName("Default Template")
			.setDesc("Choose a default template")
			.addDropdown(cb => {
				cb.addOption(null, "--None--")
				this.plugin.settings.iCalEventNoteTemplates.forEach(t => {
					cb.addOption(t.name, t.name)
				})
				cb.setValue(this.plugin.settings.defaultTemplate)
				cb.onChange((value) => {
					if (!value) this.plugin.settings.defaultTemplate = null
					else this.plugin.settings.defaultTemplate = value
					this.plugin.saveSettings()
				})
			})
	}

	display() {
		let { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'Settings for ICal' });
		/* Calendar Folder for Ventura */
		new Setting(containerEl)
			.setName('Calendar db path')
			.setDesc('Name and path of the calendar sqlite db')
			.addText((text) => {
				text
					.setValue(this.plugin.settings.calendarDbPath)
					.onChange(async value => {
						this.plugin.settings.calendarDbPath = value;
						await this.plugin.saveSettings();
					})
			})

		new Setting(containerEl)
			.setName('Sqlite API root URL')
			.setDesc('hosturl and port to connect to the backend')
			.addText((text) => {
				text
					.setPlaceholder("http://localhost:8080")
					.setValue(this.plugin.settings.apiUrl)
					.onChange(async value => {
						this.plugin.settings.apiUrl = value;
						await this.plugin.saveSettings();
					})
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

		/* iCal templates */

		this.templatesSettingContainer = this.containerEl.createDiv()

		this.buildTemplates();

		this.defaultTemplateContainer = this.containerEl.createDiv()

		this.buildDefaultTemplateSelector()

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