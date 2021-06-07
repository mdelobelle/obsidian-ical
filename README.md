## ICal Plugin

ICal adds the event of your calendar on MacOS to your daily note on demand

You can
- Define the folder where your calendar events are stored
- Define the display format for your date and time
- Create a template for your events and play with 5 available variables
- Works in combination with Templater plugin for even more formating
- Works in combination with Note Refactor to create a dedicated note for some events if you need to

**Heads up** : this only works with daily notes, you'll have to have the core plugin "daily note" or the community plugin "periodic notes" to be enabled

### Get the ICS files

In macOs the calendar events are stored in .ics files located in a subfolder of /Users/<your_username>/Library/Calendars/

#### 1. Look for the Calendars subfolder that you want to sync with Obsidian

Open info.plist in each subfolder (.calendar, .groups, .caldav) and look for the key "Login" until the value underneath this key corresponds to the calendar account that you want to sync

This folder may also contain subfolders (.calendar). Repeat this step until you find a subfolder with the Login that corresponds to the calendar account that you want to sync.

Go to the Events folder of this .calender subfolder -> this is where the .ics files corresponding to your calendar events are located

#### 2. copy the events in a folder in Obsidian

Unfortunately, Obsidian can't access directly "Calendar" folder on macOs at the moment, so you'll have to copy the .ics files to a folder in your vault

You can automatize this step a little bit with `rsync`:

say that your calendar events are located in `/Users/<your_username>/Library/Calendars/<example_30E4B968-A47C-4AFC-9E41-AECF07AEAA8E>.caldav/<example_ACE8BEF8-0F3A-4A5F-A2G7-C2EA9734F045.calendar>/Events/` and that you want to copy them in this file in your vault `/Users/<your_username>/path/to/your/vault/⚙️/events/`

You can type this command in your terminal each time you want to refresh the folder in your vault:
`rsync -aE --delete --include="*.ics" "/Users/<your_username>/Library/Calendars/<example_30E4B968-A47C-4AFC-9E41-AECF07AEAA8E>.caldav/<example_ACE8BEF8-0F3A-4A5F-A2G7-C2EA9734F045>.calendar/Events/" "/Users/<your_username>/path/to/your/vault/⚙️/events/"`

You can automate a little bit more by creating a workflow with automator.app. You can invoke this workflow each time that you want to refresh the events folder in your vault

You can also create a crontab job (that's my solution)

`crontab -e`

`*/1 * * * * rsync -aE --delete --include="*.ics" "/Users/<your_username>/Library/Calendars/<example_30E4B968-A47C-4AFC-9E41-AECF07AEAA8E>.caldav/<example_ACE8BEF8-0F3A-4A5F-A2G7-C2EA9734F045>.calendar/Events/" "/Users/<your_username>/path/to/your/vault/⚙️/events/" 2>&1`

🥵 Hopefully we will be able to access Calendar folder in the future to facilitate this step

At this stage, the .ics files of your favorite calendar account should be in sync with a folder of your vault (`⚙️/events/` in my example)

### Settings

In the plugin settings you'll have to set the folder for your ics files

You can also define:
- the path to the file containing the template for your events to be displayed. If you don't provide one, that's ok: there is a default basic template that will do the job
- the display format for the dates (see https://momentjs.com/docs/#/displaying/)
- the display format for the times (see https://momentjs.com/docs/#/displaying/)

### Adding the events to a daily note

from a daily note type Alt+T (this hotkey is customizable) or access to the command palette : `ìCal import events`

the following events will be added at the bottom of the file:
- events with start date <= daily note's date <= end date
- you can select which events to include in your daily note

You can select the section wher to include the selected events

### create your template

If you want a specific display for your event, you can create a template file, `calendar.md` for example.

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

### Roadmap

- [ ] manage events from several calendars
- [ ] discuss with obsidian team to access macOs Calendars folder