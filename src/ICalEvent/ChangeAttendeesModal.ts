import { Modal, TextComponent, ExtraButtonComponent } from "obsidian"
import ICal from "../../main"
import { Event } from "./Event"
import PersonSuggestModal from "./personSuggestModal"

export default class ChangeAttendeesModal extends Modal {

    plugin: ICal
    event: Event
    attendees: { name: string, alias: string }[]

    constructor(plugin: ICal, event: Event) {
        super(plugin.app)
        this.plugin = plugin
        this.event = event
        this.attendees = this.event.attendeesWithAlias
    }

    changeAttendeeAlias(
        container: HTMLElement,
        alias: string,
        initialAttendee: { name: string, alias: string },
        formContainer: HTMLElement,
        attendeeContainerForm: HTMLElement
    ) {
        container.setText(`${alias}`)
        this.event.attendeesWithAlias = this.event.attendeesWithAlias.map(_attendee => _attendee.name === initialAttendee.name ? { name: initialAttendee.name, alias: alias } : _attendee)
        this.attendees = this.attendees.map(_attendee => _attendee.name === initialAttendee.name ? { name: initialAttendee.name, alias: alias } : _attendee)
        if (this.plugin.settings.attendeesAliases.filter(a => a.name === initialAttendee.name).length === 0) {
            this.plugin.settings.attendeesAliases.push({ name: initialAttendee.name, alias: alias })
        } else {
            this.plugin.settings.attendeesAliases = this.plugin.settings.attendeesAliases.map(a => a.name == initialAttendee.name ? { name: a.name, alias: alias } : a)
        }
        this.plugin.saveSettings()
        formContainer.removeChild(attendeeContainerForm)
    }

    buildAttendeeModifier(container: HTMLElement, formContainer: HTMLElement, attendeeName: string) {
        let attendee = this.attendees.filter(a => a.name === attendeeName)[0]
        const initialAttendee = attendee
        let alias = attendee.alias
        const attendeeContainerForm = formContainer.createDiv({
            cls: "attendee-form-container"
        })

        const attendeeInput = new TextComponent(attendeeContainerForm)
        attendeeInput.setValue(alias)
        attendeeInput.onChange(value => {
            alias = value
        })

        const attendeeInputSuggestorContainer = attendeeContainerForm.createDiv({
            cls: "inlineFormButtonsContainer"
        })
        const attendeeInputSuggestor = new ExtraButtonComponent(attendeeInputSuggestorContainer)
        attendeeInputSuggestor.setIcon("documents")
        attendeeInputSuggestor.onClick(() => {
            const personSuggestModal = new PersonSuggestModal(this.plugin)
            personSuggestModal.open()
            personSuggestModal.onClose = () => {
                if (personSuggestModal.chosenPerson) {
                    alias = personSuggestModal.chosenPerson
                    attendeeInput.setValue(alias)
                    this.changeAttendeeAlias(container, alias, initialAttendee, formContainer, attendeeContainerForm)
                }
            }
        })

        const attendeeInputValidateContainer = attendeeContainerForm.createDiv({
            cls: "inlineFormButtonsContainer"
        })
        const attendeeInputValidate = new ExtraButtonComponent(attendeeInputValidateContainer)
        attendeeInputValidate.setIcon("check")
        attendeeInputValidate.onClick(() => {
            container.setText(`${alias}`)
            this.event.attendeesWithAlias = this.event.attendeesWithAlias.map(_attendee => _attendee.name === initialAttendee.name ? { name: initialAttendee.name, alias: alias } : _attendee)
            this.attendees = this.attendees.map(_attendee => _attendee.name === initialAttendee.name ? { name: initialAttendee.name, alias: alias } : _attendee)
            if (this.plugin.settings.attendeesAliases.filter(a => a.name === initialAttendee.name).length === 0) {
                this.plugin.settings.attendeesAliases.push({ name: initialAttendee.name, alias: alias })
            } else {
                this.plugin.settings.attendeesAliases = this.plugin.settings.attendeesAliases.map(a => a.name == initialAttendee.name ? { name: a.name, alias: alias } : a)
            }
            this.plugin.saveSettings()
            formContainer.removeChild(attendeeContainerForm)
        })
        const attendeeInputResetContainer = attendeeContainerForm.createDiv({
            cls: "inlineFormButtonsContainer"
        })

        const attendeeInputReset = new ExtraButtonComponent(attendeeInputResetContainer)
        attendeeInputReset.setIcon("reset")
        if (initialAttendee.name !== initialAttendee.alias) { attendeeInputReset.setTooltip(`${initialAttendee.alias} -> ${initialAttendee.name}`) }
        attendeeInputReset.setDisabled(initialAttendee.name === initialAttendee.alias)
        attendeeInputReset.onClick(() => {
            container.setText(`${initialAttendee.name}`)
            this.event.attendeesWithAlias = this.event.attendeesWithAlias.map(_attendee => _attendee.name === initialAttendee.name ? { name: initialAttendee.name, alias: initialAttendee.name } : _attendee)
            this.attendees = this.attendees.map(_attendee => _attendee.name === initialAttendee.name ? { name: initialAttendee.name, alias: initialAttendee.name } : _attendee)
            this.plugin.settings.attendeesAliases = this.plugin.settings.attendeesAliases.filter(a => a.name !== initialAttendee.name)
            this.plugin.saveSettings()
            formContainer.removeChild(attendeeContainerForm)
        })

        const attendeeInputCancelContainer = attendeeContainerForm.createDiv({
            cls: "inlineFormButtonsContainer"
        })
        const attendeeInputCancel = new ExtraButtonComponent(attendeeInputCancelContainer)
        attendeeInputCancel.setIcon("cross-in-box")
        attendeeInputCancel.onClick(() => {
            attendee = initialAttendee
            container.setText(`${attendee.alias}`)
            formContainer.removeChild(attendeeContainerForm)
        })
    }

    onOpen(): void {
        this.titleEl.setText("Modify Attendees")
        const attendeesContainer = this.contentEl.createDiv()
        for (const attendee of this.attendees) {
            const attendeeContainer = attendeesContainer.createDiv({
                cls: "ical-attendee-selector-container"
            })
            const attendeeLabelContainer = attendeeContainer.createDiv({
                cls: "ical-attendee-selector-label"
            })
            const attendeeLabel = attendeeLabelContainer.createDiv({
                cls: "attendeeLabel"
            })
            attendeeLabel.setText(attendee.alias)
            attendeeLabel.onclick = () => {
                attendeeLabel.textContent = ""
                this.buildAttendeeModifier(attendeeLabel, attendeeContainer, attendee.name)
            }
        }
    }
}

