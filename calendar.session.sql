SELECT CalendarItem.ROWID as eventId,
    invitation_status as status,
    summary,
    occurrence_date as "unixStart",
    occurrence_end_date as "unixEnd"
FROM OccurrenceCache
    LEFT JOIN CalendarItem ON OccurrenceCache.event_id = CalendarItem.ROWID