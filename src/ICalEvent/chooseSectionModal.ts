import {Modal, DropdownComponent, TFile} from "obsidian"
import ICal from "main"

export default class chooseSectionModal extends Modal {

    plugin: ICal
    file: TFile
    eventsContent: string

    constructor(plugin: ICal, file:TFile, eventsContent: string){
        super(plugin.app)
        this.file = file
        this.plugin = plugin
        this.eventsContent = eventsContent
    }

    onOpen(){
        this.titleEl.setText("Add a field in this note after:")
        const inputDiv = this.contentEl.createDiv()
        const selectEl = new DropdownComponent(inputDiv)
        selectEl.addOption("","Select line")
        selectEl.addOption("top_0","-- Insert at the top --")
        this.app.vault.read(this.file).then(result => {
            result.split("\n").forEach((line, lineNumber) => {
                selectEl.addOption(`body_${lineNumber}`, `${line.substring(0, 30)}${line.length > 30 ? "..." : ""}`)
            })
            selectEl.onChange(() => {
                const valueArray = selectEl.getValue().match(/(\w+)_(\d+)/)
                const position = valueArray[1]
                const lineNumber = Number(valueArray[2])
                const top = position == "top" ? true : false
                if(top){
                    this.app.vault.modify(this.file, this.eventsContent + '\n' + result)
                } else {
                    let newContent: string[] = []
                    result.split('\n').forEach((_line, _lineNumber) => {
                        newContent.push(_line)
                        if(_lineNumber == lineNumber){newContent.push(this.eventsContent)}
                    })
                    this.app.vault.modify(this.file, newContent.join('\n'))
                }
                this.close()
            })
        })
    }
}