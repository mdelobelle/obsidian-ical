## ICal Plugin

ICal lets you add a selection of events from your calendar (ics files) to your daily note on demand and optionaly create a note for some of these event

You can
- Define the folder where your calendar events are stored
- Define the display format for your date and time
- Create a template for your events and play with 5 available variables
- Works in combination with Templater plugin for even more formating

**Heads up** : this only works with daily notes, you'll have to have the core plugin "daily note" or the community plugin "periodic notes" to be enabled

### Installation (for MacOS Ventura)

A light python webserver is necessary to connect to the Calendar.sqlitedb from obsidian.
From your terminal: navigate to YourVault/.obsidian/plugins/obsidian-ical/sqlite
and run `$ python3 sqliteWebServer.py`

By default this server's root url is `http://localhost:8080`. If you wan't to change it, you'll have to change it in sqlite/sqliteWebServer.py and in the plugin's settings

### Settings

You have to define:
- **sqlite database** : the absolute path to the Calendar.sqlitedb file on your system
- **Sqlite API root URL** : the root url of the API server to access the sqlite db (see Installation section)
- **daily note format** : the format of the title of your daily note
- **Event line template** : the template file used to display le line for the selected event(s) in the daily note
- **Event note template** : the template file used to create a new note for the selected event(s)
- **Event note folder** : the folder where to store the notes created from the selected event(s)
- **Event note filename template** : the template used to build the name for the notes created from the selected event(s)
- **Event date format** : the display format for the dates (see https://momentjs.com/docs/#/displaying/)
- the display format for the times (see https://momentjs.com/docs/#/displaying/)

### Adding the events to a daily note

from a daily note type Alt+T (this hotkey is customizable) or access to the command palette : `ìCal import events`

the following events will be added at the bottom of the file:
- events with start date <= daily note's date <= end date
- you can select which events to include in your daily note

You can select the section wher to include the selected events

### create your template

If you want a specific display for your event line, your event note, you can create a template file, `calendar.md` for example.

include this path in the settings of the ical plugin

In the template file you can use the following variables to create your very special layout:
- {{start}} : the start datetime of the event. if the event start day is before the daily note's day, {{start}} will be replaced by `<event.start_day> - <event.start_time>`. If the event start day is the day of the daily note, {{start}} will be replaced by `<event.start_time>`. The display format included in settings will be applied
- {{end}} : the end datetime of the event. if the event end day is after  the daily note's day, {{end}} will be replaced by `<event.end_day> - <event.end_time>`. If the event end day is the day of the daily note, {{end}} will be replaced by `<event.end_time>`. The display format included in settings will be applied
- {{attendees.inline}} : inline list of attendees, minus the organizer, comma separated
- {{attendees.link.inline}} : inline list of attendees as obsidian link (`[[my fellow colleague Jim]]`), minus the organizer, comma separated
- {{attendees.list}} : indented list of attendees, minus the organizer,
- {{attendees.link.inline}} : indented list of attendees as obsidian link (`[[my fellow colleague Jim]]`), minus the organizer
- {{organizer}}: the organizer of the meeting
- {{organizer.link}}: the organizer of the meeting as obsidian link (`[[the big boss]]`)