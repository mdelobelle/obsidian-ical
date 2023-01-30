import { Modal, DropdownComponent, ToggleComponent, TFile, ButtonComponent, TextComponent, ExtraButtonComponent } from "obsidian"
import ICal from "../../main"
import { Event } from "./Event"
import ChangeAttendeesModal from "./ChangeAttendeesModal"

export default class SelectEventsModal extends Modal {

    plugin: ICal
    file: TFile
    events: Event[]
    selectedEventsForLine: Event[]
    selectedEventsForNote: Event[]

    lineNumber: number = -1
    fileDate: string
    insertAtBottom: boolean = true
    bottomToggler: ToggleComponent
    selectSection: DropdownComponent

    constructor(plugin: ICal, file: TFile, events: Event[], fileDate: string) {
        super(plugin.app)
        this.file = file
        this.plugin = plugin
        this.events = events
        this.selectedEventsForLine = []
        this.selectedEventsForNote = []
        this.fileDate = fileDate
        this.insertAtBottom = true
    }

    buildAttendeesModifier(event: Event) {
        const changeAttendeesModal = new ChangeAttendeesModal(this.plugin, event)
        changeAttendeesModal.open()
    }

    buildSummaryModifier(summaryContainer: HTMLDivElement, formContainer: HTMLDivElement, event: Event) {
        const initialSummary = event.summary
        const summaryContainerForm = formContainer.createDiv({
            cls: "summary-form-container"
        })
        const summaryInput = new TextComponent(summaryContainerForm)
        summaryInput.setValue(event.summary)
        summaryInput.onChange(value => {
            event.summary = value
        })
        const summaryInputValidateContainer = summaryContainerForm.createDiv({
            cls: "inlineFormButtonsContainer"
        })
        const summaryInputValidate = new ExtraButtonComponent(summaryInputValidateContainer)
        summaryInputValidate.setIcon("check")
        summaryInputValidate.onClick(() => {
            summaryContainer.setText(`${event.shortEvent}`)
            formContainer.removeChild(summaryContainerForm)
        })
        const summaryInputCancelContainer = summaryContainerForm.createDiv({
            cls: "inlineFormButtonsContainer"
        })
        const summaryInputCancel = new ExtraButtonComponent(summaryInputCancelContainer)
        summaryInputCancel.setIcon("cross")
        summaryInputCancel.onClick(() => {
            event.summary = initialSummary
            summaryContainer.setText(`${event.shortEvent}`)
            formContainer.removeChild(summaryContainerForm)
        })
    }

    buildEventToggler(valueGrid: HTMLDivElement, event: Event) {
        const eventSelectorContainer = valueGrid.createDiv({
            cls: "ical-event-selector-container"
        })
        const lineTogglerContainer = eventSelectorContainer.createDiv({
            cls: "ical-line-selector-toggler"
        })
        const lineToggler = new ToggleComponent(lineTogglerContainer)
        if (this.selectedEventsForLine.includes(event)) {
            lineToggler.setValue(true)
        }
        const noteTogglerContainer = eventSelectorContainer.createDiv({
            cls: "ical-note-selector-toggler"
        })
        const noteToggler = new ToggleComponent(noteTogglerContainer)
        if (this.selectedEventsForNote.includes(event)) {
            noteToggler.setValue(true)
        }
        const eventAttendeesChanger = eventSelectorContainer.createDiv({
            cls: "ical-event-attendees-changer"
        })
        eventAttendeesChanger.setText("👥")
        const eventLabelContainer = eventSelectorContainer.createDiv({
            cls: "ical-event-selector-label"
        })
        const eventLabelCalendarName = eventLabelContainer.createDiv({
            cls: "eventLabelCalendarName"
        })
        eventLabelCalendarName.setAttr("style", `background-color: var(--chart-color-1})`)
        eventLabelCalendarName.setText("Calendrier")
        const eventLabel = eventLabelContainer.createDiv({
            cls: "eventLabelSummary"
        })
        eventLabel.setText(`${event.shortEvent}`)
        lineToggler.onChange(value => {
            if (value && !this.selectedEventsForLine.includes(event)) {
                this.selectedEventsForLine.push(event)
                if (!this.selectedEventsForNote.includes(event)) {
                    noteToggler.setValue(true)
                }
            }
            if (!value) {
                this.selectedEventsForLine.remove(event)
                noteToggler.setValue(false)
                this.selectedEventsForNote.remove(event)
            }
        })
        noteToggler.onChange(value => {
            if (value && !this.selectedEventsForNote.includes(event)) {
                this.selectedEventsForNote.push(event)
                if (!this.selectedEventsForLine.includes(event)) {
                    lineToggler.setValue(true)
                }
            }
            if (!value) {
                this.selectedEventsForNote.remove(event)
            }
        })
        eventAttendeesChanger.onclick = () => {
            this.buildAttendeesModifier(event)
        }
        eventLabel.onclick = () => {
            eventLabel.textContent = ""
            this.buildSummaryModifier(eventLabel, eventSelectorContainer, event)
        }
    }

    buildEventSelector(container: HTMLElement) {
        const eventSelectContainer = container.createDiv({
            cls: "ical-events-grid"
        })
        const eventSelectHeader = eventSelectContainer.createDiv({
            cls: "ical-events-header"
        })
        const lineHeader = eventSelectHeader.createDiv({
            cls: "ical-events-header-line"
        })
        lineHeader.setText("Line")
        const noteHeader = eventSelectHeader.createDiv({
            cls: "ical-events-header-note"
        })
        noteHeader.setText("Note")
        const eventHeader = eventSelectHeader.createDiv({
            cls: "ical-events-header-event"
        })
        eventHeader.setText("Event")
        this.events.forEach(event => this.buildEventToggler(eventSelectContainer, event))
    }

    buildBottomSelector(container: HTMLElement) {
        const bottomTogglerContainer = container.createDiv({
            cls: "ical-bottom-selector-toggler"
        })
        this.bottomToggler = new ToggleComponent(bottomTogglerContainer)
        this.bottomToggler.setValue(this.insertAtBottom)
        this.bottomToggler.onChange(value => {
            this.insertAtBottom = value
            if (value) {
                this.lineNumber = -1
                this.selectSection.setValue("")
            }
        })
        const bottomLabel = container.createDiv({
            cls: "ical-bottom-selector-label"
        })
        bottomLabel.setText(`Insert at bottom`)
    }

    buildSectionSelector(container: HTMLElement) {
        const sectionSelectContainer = container.createDiv({
            cls: "ical-section-selection-container"
        })
        this.selectSection = new DropdownComponent(sectionSelectContainer)
        this.selectSection.addOption("", "Insert selected events after...")
        this.selectSection.addOption("top_-1", "-- Insert at the top --")
        this.buildBottomSelector(sectionSelectContainer)
    }

    buildFooter(container: HTMLElement) {
        const footer = container.createDiv({
            cls: "ical-events-grid-footer"
        })
        const saveButton = new ButtonComponent(footer)
        saveButton.setIcon("checkmark")

        this.app.vault.read(this.file).then(result => {
            const linesCount = result.split("\n").length
            result.split("\n").forEach((line, lineNumber) => {
                this.selectSection.addOption(`body_${lineNumber}`, `${line.substring(0, 37)}${line.length > 34 ? "..." : ""}`)
            })
            this.selectSection.onChange(() => {
                const valueArray = this.selectSection.getValue().match(/(\w+)_(-?\d+)/)
                this.lineNumber = Number(valueArray[2])
                this.insertAtBottom = false
                this.bottomToggler.setValue(false)
            })
            saveButton.onClick(async () => {
                if (this.insertAtBottom) {
                    this.app.vault.modify(this.file, result + '\n' + this.selectedEventsForLine.map(event => event.eventLine).join('\n'))
                } else {
                    if (this.lineNumber == -1) {
                        this.app.vault.modify(this.file, this.selectedEventsForLine.map(event => event.eventLine).join('\n') + '\n' + result)
                    } else {
                        let newContent: string[] = []
                        result.split('\n').forEach((_line, _lineNumber) => {
                            newContent.push(_line)
                            if (_lineNumber == this.lineNumber) { newContent.push(this.selectedEventsForLine.map(event => event.eventLine).join('\n')) }
                        })
                        this.app.vault.modify(this.file, newContent.join('\n'))
                    }
                }
                this.selectedEventsForNote.map(async event => await event.createNote())

                this.close()
            })
        })
    }

    onOpen() {
        this.titleEl.setText("Select events to include")
        this.buildEventSelector(this.contentEl)
        this.buildSectionSelector(this.contentEl)
        this.buildFooter(this.contentEl)
    }
}
