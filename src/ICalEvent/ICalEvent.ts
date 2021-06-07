import {moment, TFile, FileSystemAdapter} from "obsidian"
import ICal from "main"
import {parseFile} from "node-ical"

export default class ICalEvent {
	start: moment.Moment
	end: moment.Moment
	event: string

	static eventStart(start: moment.Moment, startDay: string, fileDate: string, plugin: ICal): string{
		const dateFormat = plugin.settings.dateFormat
		const timeFormat = plugin.settings.timeFormat
		return startDay < fileDate ? start.format(dateFormat+" "+timeFormat) : start.format(timeFormat)
	}

	static eventEnd(end: moment.Moment, endDay: string, fileDate: string, plugin: ICal): string{
		const dateFormat = plugin.settings.dateFormat
		const timeFormat = plugin.settings.timeFormat
		return endDay > fileDate ? end.format(dateFormat+" "+timeFormat) : end.format(timeFormat)
	}

    static 	compareEvents(a: ICalEvent, b: ICalEvent){
		if(a.start.isBefore(b.start)){
			return -1
		} else if(a.start.isAfter(b.start)){
			return 1
		} else if(a.start.isSame(b.start)){
			if(a.end.isBefore(b.end)){
				return -1
			} else {
				return 1
			}
		}
	}

    static extractCalInfo(file: TFile, fileDate: string, template: string, plugin: ICal): Promise<ICalEvent>{
		return new Promise(resolve => {
			plugin.app.vault.cachedRead(file).then(result => {
				let startDay = ""
				let endDay = ""
				const event = new ICalEvent()
				result.split("\n").forEach(line => {
					if(line.startsWith('DTSTART')){
						const regex = line.match(/(\d{8})T(\d{4})|VALUE=DATE:(\d{8})/)
						if(regex && regex.length > 0){
							startDay=`${regex[1] ? regex[1] : regex[3]}`
						}
					} else if(line.startsWith('DTEND')){
						const regex = line.match(/(\d{8})T(\d{4})|VALUE=DATE:(\d{8})/)
						if(regex && regex.length > 0){
							endDay=`${regex[1] ? regex[1] : regex[3]}`
						}
					} 
				}) 
				if(startDay <= fileDate && fileDate <= endDay) {
                    if (plugin.app.vault.adapter instanceof FileSystemAdapter) {
                        let basePath = plugin.app.vault.adapter.getBasePath();
                        const ics = parseFile(`${basePath}/${plugin.settings.icsFolder}/${file.name}`)
                        if(Object.keys(ics).length > 0){
                            const ical = ics[Object.keys(ics)[0]]
                            var start = moment(new Date(Date.parse(`${ical.start}`)));
                            var end = moment(new Date(Date.parse(`${ical.end}`)));
                            event.start = start
                            event.end = end
                            if(template){
                                let attendees: string[] = []
                                template = template.replace("{{startday}}", start.format(plugin.settings.dateFormat))
                                template = template.replace("{{starttime}}", start.format(plugin.settings.timeFormat))
                                template = template.replace("{{endday}}", end.format(plugin.settings.dateFormat))
                                template = template.replace("{{endtime}}", end.format(plugin.settings.timeFormat))
                                template = template.replace("{{start}}", ICalEvent.eventStart(start, startDay, fileDate, plugin))
                                template = template.replace("{{end}}", ICalEvent.eventEnd(end, endDay, fileDate, plugin))
                                template = template.replace("{{summary}}", `${ical.summary}`)
                                template = template.replace("{{organizer}}", `${ical.organizer ? ical.organizer["params"]["CN"] : ""}`)
                                if(Object.keys(ical).includes("attendee")){
                                    const _attendees: Array<Record<string, string>> = Object.entries(ical).filter(item => item[0] == "attendee")[0][1]
                                    if(_attendees instanceof Array){
										_attendees.forEach(attendee => {
										const _params = Object.entries(attendee).filter(item => item[0] == "params")
											const params = _params.length > 0 ? _params[0][1] : null
											const _cn = params ? Object.entries(params).filter(item => item[0] == "CN") : null
											if(_cn && `${_cn[0][1]}` != `${ical.organizer["params"]["CN"]}`){attendees.push(`${_cn[0][1]}`)}
										})
									} else {
										attendees.push(_attendees["params"]["CN"])
									}
                                }
                                template = template.replace("{{attendees.inline}}", attendees.join(", "))
                                template = template.replace("{{attendees.list}}", attendees.map(attendee => `- ${attendee}`).join('\n'))
                                template = template.replace("{{attendees.link.inline}}", attendees.map(attendee => `[[${attendee}]]`).join(", "))
                                template = template.replace("{{attendees.link.list}}", attendees.map(attendee => `- [[${attendee}]]`).join('\n'))
                                event.event = template
                                resolve(event)
                            } else {
                                event.event = String(`### ${ICalEvent.eventStart(start, startDay, fileDate, plugin)} - ${ICalEvent.eventEnd(end, endDay, fileDate, plugin)} : ${ical.summary}`)
                                resolve(event)
                            }
                        } 
                    }
                      else {
                        resolve(null)
                    }
				}
				resolve(null)
			})
		})
	}
}