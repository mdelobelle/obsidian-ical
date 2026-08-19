#!/usr/bin/env python3
"""Local helper giving the Obsidian iCal plugin read access to Calendar.sqlitedb.

macOS guards the Calendar database behind Full Disk Access, which Obsidian
cannot be granted here. Started from Terminal.app, this server inherits
Terminal's grant. It must therefore be launched from a terminal: under launchd
TCC attributes the access to the Python binary instead, and denies it.
"""

from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import json
import sqlite3
import sys

hostName = "localhost"
serverPort = 8000

# Offset between the Apple EPOCH (2001-01-01) and the Unix EPOCH.
APPLE_EPOCH = 978307200
ONE_DAY = 86400

# Participant.role == 0 identifies the organizer.
ORGANIZER_ROLE = 0

# SQLITE_MAX_VARIABLE_NUMBER is 999 on the sqlite shipped with macOS.
MAX_VARIABLES = 500

EVENTS_QUERY = '''
    SELECT
        CalendarItem.ROWID as eventId,
        CalendarItem.invitation_status as status,
        CalendarItem.summary as summary,
        OccurrenceCache.occurrence_date as "unixStart",
        OccurrenceCache.occurrence_end_date as "unixEnd"
    FROM
        OccurrenceCache
        LEFT JOIN CalendarItem ON
            OccurrenceCache.event_id = CalendarItem.ROWID
    WHERE
        OccurrenceCache.day <= ?
        AND OccurrenceCache.day > ?
    ORDER BY unixStart ASC ;'''

PARTICIPANTS_QUERY = '''
    SELECT
        Participant.owner_id as eventId,
        Identity.display_name as name,
        Participant.role as role
    FROM
        Participant
        JOIN Identity ON
            Identity.ROWID = Participant.identity_id
    WHERE
        Participant.owner_id IN ({placeholders}) ;'''


class BadRequest(Exception):
    pass


def connect(databasePath):
    """Open the database, read-only when the file layout allows it.

    A read-only connection needs to read the -shm sidecar when the database is
    in WAL mode; if that fails we fall back to the plain read-write open this
    helper has always used. Both modes are opened through a URI so that a wrong
    path reports an error instead of creating an empty database.
    """
    if not Path(databasePath).is_file():
        raise BadRequest(f"database not found: {databasePath}")
    uri = Path(databasePath).as_uri()
    try:
        con = sqlite3.connect(f"{uri}?mode=ro", uri=True)
        con.execute("SELECT 1 FROM sqlite_master LIMIT 1")
    except sqlite3.Error:
        con = sqlite3.connect(f"{uri}?mode=rw", uri=True)
    con.row_factory = sqlite3.Row
    return con


def fetchParticipants(con, eventIds):
    """Return {eventId: [{name, role}]} for every given event, in one pass."""
    grouped = {}
    ids = [eventId for eventId in eventIds if eventId is not None]
    for start in range(0, len(ids), MAX_VARIABLES):
        chunk = ids[start:start + MAX_VARIABLES]
        query = PARTICIPANTS_QUERY.format(placeholders=",".join("?" * len(chunk)))
        for row in con.execute(query, chunk):
            grouped.setdefault(row["eventId"], []).append({"name": row["name"], "role": row["role"]})
    return grouped


def fetchEvents(databasePath, unixDate):
    """Every occurrence of the day starting at unixDate, attendees included."""
    appleDate = unixDate - APPLE_EPOCH
    with closing(connect(databasePath)) as con:
        events = [dict(row) for row in con.execute(EVENTS_QUERY, (appleDate, appleDate - ONE_DAY))]
        participants = fetchParticipants(con, [event["eventId"] for event in events])
    for event in events:
        people = participants.get(event["eventId"], [])
        event["organizer"] = next((p["name"] for p in people if p["role"] == ORGANIZER_ROLE), None)
        event["attendees"] = [p["name"] for p in people if p["role"] != ORGANIZER_ROLE]
    return events


class MyServer(BaseHTTPRequestHandler):

    server_version = "obsidian-ical-helper"

    def payload(self):
        length = int(self.headers.get('Content-length', 0))
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("UTF-8"))
        except (ValueError, UnicodeDecodeError) as error:
            raise BadRequest(f"invalid JSON body: {error}")

    def respond(self, status, body):
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def handleFetchEvents(self):
        payload = self.payload()
        databasePath = payload.get("databasePath", None)
        unixDate = payload.get("unixDate", None)
        if not databasePath:
            raise BadRequest("missing databasePath")
        if not isinstance(unixDate, (int, float)):
            raise BadRequest("missing or invalid unixDate")
        return fetchEvents(databasePath, int(unixDate))

    def do_GET(self):
        route = [x for x in self.path.split("/") if x]
        try:
            if route and route[0] == "fetchEvents":
                self.respond(200, self.handleFetchEvents())
            elif route and route[0] == "health":
                self.respond(200, {"status": "ok"})
            else:
                self.respond(404, {"error": f"unknown route: {self.path}"})
        except BadRequest as error:
            self.respond(400, {"error": str(error)})
        except (sqlite3.Error, OSError) as error:
            # The usual cause is TCC: the helper was not started from a process
            # holding Full Disk Access, so the database cannot be opened.
            self.respond(500, {"error": f"cannot read the calendar database: {error}"})


if __name__ == "__main__":
    try:
        webServer = ThreadingHTTPServer((hostName, serverPort), MyServer)
    except OSError as error:
        print(f"Cannot listen on {hostName}:{serverPort} ({error}).", file=sys.stderr)
        print("Another helper is probably already running.", file=sys.stderr)
        sys.exit(1)

    print("Server started http://%s:%s" % (hostName, serverPort))
    print("Must be started from Terminal.app, whose Full Disk Access it inherits.")

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
