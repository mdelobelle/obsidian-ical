import { Modal, DropdownComponent, ToggleComponent, TFile, ButtonComponent } from "obsidian"
import ICal from "../../main"
import ICalEvent from "./ICalEvent"

export default class ChooseSectionModal extends Modal {

    plugin: ICal
    file: TFile
    events: ICalEvent[]
    selectedEvents: ICalEvent[]
    lineNumber: number = -1
    fileDate: string
    insertAtBottom: boolean
    bottomToggler: ToggleComponent
    selectEl: DropdownComponent

    constructor(plugin: ICal, file: TFile, events: ICalEvent[], fileDate: string) {
        super(plugin.app)
        this.file = file
        this.plugin = plugin
        this.events = events
        this.selectedEvents = events
        this.fileDate = fileDate
        this.insertAtBottom = false
    }

    buildValueToggler(valueGrid: HTMLDivElement, event: ICalEvent) {
        const valueSelectorContainer = valueGrid.createDiv({
            cls: "frontmatter-value-selector-container"
        })
        const valueTogglerContainer = valueSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-toggler"
        })
        const valueToggler = new ToggleComponent(valueTogglerContainer)
        this.events.forEach(event => {
            if (this.selectedEvents.includes(event)) {
                valueToggler.setValue(true)
            }
        })
        valueToggler.onChange(value => {
            if (value && !this.selectedEvents.includes(event)) {
                this.selectedEvents.push(event)
            }
            if (!value) {
                this.selectedEvents.remove(event)
            }
        })
        const valueLabel = valueSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-label"
        })
        valueLabel.setText(`${event.shortEvent}`)
    }

    buildBottomSelector(container: HTMLDivElement) {
        const bottomSelectorContainer = container.createDiv({
            cls: "frontmatter-value-selector-container"
        })
        const bottomTogglerContainer = bottomSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-toggler"
        })
        this.bottomToggler = new ToggleComponent(bottomTogglerContainer)
        this.bottomToggler.setValue(this.insertAtBottom)
        this.bottomToggler.onChange(value => {
            this.insertAtBottom = value
            if (value) {
                this.lineNumber = -1
                this.selectEl.setValue("")
            }
        })
        const bottomLabel = bottomSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-label"
        })
        bottomLabel.setText(`Insert at bottom`)
    }

    onOpen() {
        this.titleEl.setText("Select events to include")
        const eventSelectContainer = this.contentEl.createDiv({
            cls: "frontmatter-values-grid"
        })
        this.events.forEach(event => this.buildValueToggler(eventSelectContainer, event))

        const sectionSelectContainer = this.contentEl.createDiv()
        this.selectEl = new DropdownComponent(sectionSelectContainer)
        this.selectEl.addOption("", "Insert selected events after...")
        this.selectEl.addOption("top_-1", "-- Insert at the top --")
        this.buildBottomSelector(eventSelectContainer)
        const footer = this.contentEl.createDiv({
            cls: "frontmatter-value-grid-footer"
        })
        const saveButton = new ButtonComponent(footer)
        saveButton.setIcon("checkmark")

        this.app.vault.read(this.file).then(result => {
            const linesCount = result.split("\n").length
            result.split("\n").forEach((line, lineNumber) => {
                this.selectEl.addOption(`body_${lineNumber}`, `${line.substring(0, 30)}${line.length > 30 ? "..." : ""}`)
            })
            this.selectEl.onChange(() => {
                const valueArray = this.selectEl.getValue().match(/(\w+)_(-?\d+)/)
                this.lineNumber = Number(valueArray[2])
                this.insertAtBottom = false
                this.bottomToggler.setValue(false)
            })
            saveButton.onClick(() => {
                if (this.insertAtBottom) {
                    this.app.vault.modify(this.file, result + '\n' + this.selectedEvents.map(event => event.eventLine).join('\n'))
                } else {
                    if (this.lineNumber == -1) {
                        this.app.vault.modify(this.file, this.selectedEvents.map(event => event.eventLine).join('\n') + '\n' + result)
                    } else {
                        let newContent: string[] = []
                        result.split('\n').forEach((_line, _lineNumber) => {
                            newContent.push(_line)
                            if (_lineNumber == this.lineNumber) { newContent.push(this.selectedEvents.map(event => event.eventLine).join('\n')) }
                        })
                        this.app.vault.modify(this.file, newContent.join('\n'))
                    }
                }
                this.selectedEvents.map(event => event.createNote())
                this.close()
            })
        })
    }
}
