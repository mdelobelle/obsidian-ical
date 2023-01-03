# Python 3 server example
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
import sqlite3
import json

hostName = "localhost"
serverPort = 8000


class MyServer(BaseHTTPRequestHandler):

    def execute_query(self, db, query):
        con = sqlite3.connect(db)
        con.row_factory = self.dict_factory
        cur = con.cursor()
        cur.execute(query)
        return cur.fetchall()

    def dict_factory(self, cursor, row):
        d = {}
        for idx, col in enumerate(cursor.description):
            d[col[0]] = row[idx]
        return d

    def do_GET(self):
        route = [x for x in self.path.split("/") if x]
        length = int(self.headers.get('Content-length', 0))
        body = self.rfile.read(length)
        payload = json.loads(body.decode("UTF-8"))
        db = payload.get("databasePath", None)
        if route[0] == "fetchEvents":
            date = payload.get("unixDate", None)
            if date and db:
                query = f'''
                SELECT  
                    CalendarItem.ROWID as eventId, 
                    invitation_status as status, 
                    summary, 
                    occurrence_date as "unixStart", 
                    occurrence_end_date as "unixEnd" 
                FROM 
                    OccurrenceCache 
                    LEFT JOIN  CalendarItem ON 
                        OccurrenceCache.event_id = CalendarItem.ROWID 
                WHERE 
                    {date} >= day + 978303600 
                    AND {date} <= day + 978390000 
                ORDER BY unixStart ASC ;'''
                result = self.execute_query(db, query)

        elif route[0] == "attendees":
            calendarItemId = payload.get("calendarItemId", None)
            if calendarItemId and db:
                query = f'''
                SELECT 
                    display_name as name, role
                FROM
                    Participant, 
                    Identity	
                WHERE
                    Identity.ROWID =  Participant.identity_id
                    AND
                    Participant.owner_id = {calendarItemId}'''
                result = self.execute_query(db, query)
        else:
            self.send_response(404, "Not Found")
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(result).encode("utf-8"))


if __name__ == "__main__":
    webServer = HTTPServer((hostName, serverPort), MyServer)
    print("Server started http://%s:%s" % (hostName, serverPort))

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")
