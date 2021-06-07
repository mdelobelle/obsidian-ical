import {Modal, DropdownComponent, ToggleComponent, TFile, ButtonComponent} from "obsidian"
import ICal from "main"
import ICalEvent from "src/ICalEvent/ICalEvent"

export default class chooseSectionModal extends Modal {

    plugin: ICal
    file: TFile
    events: ICalEvent[]
    selectedEvents: ICalEvent[]
    lineNumber: number = -1
    fileDate: string

    constructor(plugin: ICal, file:TFile, events: ICalEvent[], fileDate: string){
        super(plugin.app)
        this.file = file
        this.plugin = plugin
        this.events = events
        this.selectedEvents = events
        this.fileDate = fileDate
    }

    buildValueToggler(valueGrid: HTMLDivElement,event: ICalEvent){
        const valueSelectorContainer = valueGrid.createDiv({
            cls: "frontmatter-value-selector-container"
        })
        const valueTogglerContainer = valueSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-toggler"
        })
        const valueToggler = new ToggleComponent(valueTogglerContainer)
        this.events.forEach(event => {
            if (this.selectedEvents.includes(event)){
                valueToggler.setValue(true)
            }
        })
        valueToggler.onChange(value => {
            if(value && !this.selectedEvents.includes(event)){
                this.selectedEvents.push(event)
            }
            if(!value){
                this.selectedEvents.remove(event)
            }
        })
        const valueLabel = valueSelectorContainer.createDiv({
            cls: "frontmatter-value-selector-label"
        })
        valueLabel.setText(`${event.shortEvent}`)
    }

    onOpen(){
        this.titleEl.setText("Select events to include")
        const eventSelectContainer = this.contentEl.createDiv({
            cls: "frontmatter-values-grid"
        })
        this.events.forEach(event => this.buildValueToggler(eventSelectContainer, event))

        const sectionSelectContainer = this.contentEl.createDiv()
        const selectEl = new DropdownComponent(sectionSelectContainer)
        selectEl.addOption("","Insert selected events after...")
        selectEl.addOption("top_-1","-- Insert at the top --")
        const footer = this.contentEl.createDiv({
            cls: "frontmatter-value-grid-footer"
        })
        const saveButton = new ButtonComponent(footer)
        saveButton.setIcon("checkmark")

        this.app.vault.read(this.file).then(result => {
            result.split("\n").forEach((line, lineNumber) => {
                selectEl.addOption(`body_${lineNumber}`, `${line.substring(0, 30)}${line.length > 30 ? "..." : ""}`)
            })
            selectEl.onChange(() => {
                const valueArray = selectEl.getValue().match(/(\w+)_(\d+)/)
                const position = valueArray[1]
                this.lineNumber = Number(valueArray[2])
            })
            saveButton.onClick(() => {
                
                if(this.lineNumber == -1){
                    this.app.vault.modify(this.file, this.selectedEvents.map(event => event.event).join('\n') + '\n' + result)
                } else {
                    let newContent: string[] = []
                    result.split('\n').forEach((_line, _lineNumber) => {
                        newContent.push(_line)
                        if(_lineNumber == this.lineNumber){newContent.push(this.selectedEvents.map(event => event.event).join('\n'))}
                    })
                    this.app.vault.modify(this.file, newContent.join('\n'))
                }
                this.close()
            })
        })
    }
}