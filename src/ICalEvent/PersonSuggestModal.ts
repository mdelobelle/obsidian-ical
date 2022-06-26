import { FuzzySuggestModal, TFile } from "obsidian"
import ICal from "../../main"
import ICalEvent from "./ICalEvent"

export default class PersonSuggestModal extends FuzzySuggestModal<TFile> {

    plugin: ICal
    chosenPerson: string = ""

    constructor(plugin: ICal, event: ICalEvent) {
        super(plugin.app)
        this.plugin = plugin
    }

    getItems(): TFile[] {
        let tag = this.plugin.settings.searchTag
        if (tag) {
            return this.plugin.app.vault.getMarkdownFiles().filter(f => {
                let tags = this.plugin.app.metadataCache.getFileCache(f).frontmatter?.tags
                if (tags && typeof tags == 'string') {
                    return tags.contains(tag)
                } else if (tags && Array.isArray(tags)) {
                    return tags.filter(t => t.contains(tag)).length > 0
                }
                return false
            })
        } else {
            return this.plugin.app.vault.getMarkdownFiles()
        }
    }

    getItemText(item: TFile): string {
        return item.basename
    }

    onChooseItem(item: TFile, evt: MouseEvent | KeyboardEvent): void {
        this.chosenPerson = item.basename
        this.close()
    }

    onNoSuggestion(): void {
        this.chosenPerson = ""
        this.close()
    }
}    