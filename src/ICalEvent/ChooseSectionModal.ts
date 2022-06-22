import { Modal, DropdownComponent, ToggleComponent, TFile, ButtonComponent } from "obsidian"
import ICal from "../../main"
import ICalEvent from "./ICalEvent"

export default class ChooseSectionModal extends Modal {

    plugin: ICal
    file: TFile
    events: ICalEvent[]
    selectedEventsForLine: ICalEvent[]
    selectedEventsForNote: ICalEvent[]

    lineNumber: number = -1
    fileDate: string
    insertAtBottom: boolean
    bottomToggler: ToggleComponent
    selectSection: DropdownComponent

    constructor(plugin: ICal, file: TFile, events: ICalEvent[], fileDate: string) {
        super(plugin.app)
        this.file = file
        this.plugin = plugin
        this.events = events
        this.selectedEventsForLine = []
        this.selectedEventsForNote = []
        this.fileDate = fileDate
        this.insertAtBottom = false
    }

    buildEventToggler(valueGrid: HTMLDivElement, event: ICalEvent) {
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
        const eventLabel = eventSelectorContainer.createDiv({
            cls: "ical-event-selector-label"
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
    }

    buildBottomSelector(container: HTMLDivElement) {
        const bottomSelectorContainer = container.createDiv({
            cls: "ical-bottom-selector-container"
        })
        const bottomTogglerContainer = bottomSelectorContainer.createDiv({
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
        const bottomLabel = bottomSelectorContainer.createDiv({
            cls: "ical-bottom-selector-label"
        })
        bottomLabel.setText(`Insert at bottom`)
    }

    onOpen() {
        this.titleEl.setText("Select events to include")
        const eventSelectContainer = this.contentEl.createDiv({
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

        const sectionSelectContainer = this.contentEl.createDiv({
            cls: "ical-section-selection-container"
        })
        this.selectSection = new DropdownComponent(sectionSelectContainer)
        this.selectSection.addOption("", "Insert selected events after...")
        this.selectSection.addOption("top_-1", "-- Insert at the top --")
        this.buildBottomSelector(sectionSelectContainer)
        const footer = this.contentEl.createDiv({
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
            saveButton.onClick(() => {
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
                this.selectedEventsForNote.map(event => event.createNote())

                this.close()
            })
        })
    }
}
