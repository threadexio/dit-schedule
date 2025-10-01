#!/usr/bin/env python3
from typing import *
from dataclasses import dataclass
from icalendar import Calendar, Event, vRecur, Alarm
from datetime import datetime, UTC, timedelta
from zoneinfo import ZoneInfo
from hashlib import md5
from bs4 import BeautifulSoup
import icalendar
import re

SCHEDULE_HTML_URL = "https://www.di.uoa.gr/schedule/25-26/timetable_PPS_winter2526.html"
TZ = ZoneInfo("Europe/Athens")
SEMESTER_START = datetime(2025, 9, 29, tzinfo=TZ)
SEMESTER_END = datetime(2026, 1, 9, tzinfo=TZ)

@dataclass
class Lesson:
    name: str
    semester: str
    profs: List[str]

    start: timedelta
    duration: timedelta

    day: str
    room: str

    @staticmethod
    def parse(s: str, *args) -> Self:
        s = s.strip()
        m = re.match(r"^(?P<name>.+)\s(?P<semester>.+)\s(?P<profs>.+)$", s)

        name = m.group("name")
        semester = m.group("semester")
        profs = list(map(str.strip, m.group("profs").split(",")))

        return Lesson(name, semester, profs, *args)

    def __str__(self) -> str:
        return self.__repr__()

    def __repr__(self) -> str:
        return f"Lesson {{\"{self.name}\", {self.semester}, {self.profs}, {self.start}:+{self.duration}, {self.day}, {self.room}}}"

class Schedule:
    _lessons: List[Lesson]

    def __init__(self, lessons: Iterable[Lesson]):
        self._lessons = list(lessons)

    @staticmethod
    def parse_html(html: str) -> Self:
        soup = BeautifulSoup(html, 'html.parser')

        def parse_day(trs):
            day = next(trs).select("td > b > font")[0].string

            room_tr = next(trs)
            room_tds = iter(room_tr.select("td"))
            _ = next(room_tds)
            col_to_room_map = list(map(lambda x: x.select("b > font")[0].string, room_tds))

            for i in range(12):
                tds = iter(next(trs).select("td"))

                time_slot_str = next(tds).select("font")[0].string

                def parse_time(s: str) -> timedelta:
                    hours, minutes = map(int, map(str.strip, s.split(":")))
                    return timedelta(hours=hours, minutes=minutes)

                time_slot_start, time_slot_end = map(parse_time, time_slot_str.split("-"))

                for i, td in enumerate(tds):
                    desc = td.select("font")[0]
                    for child in desc.select("br"):
                        child.replace_with(" ")
                    desc = desc.get_text().strip()

                    if len(desc) == 0:
                        continue

                    start = time_slot_start
                    end = time_slot_end - time_slot_start
                    room = col_to_room_map[i]
                    lesson = Lesson.parse(desc, start, end, day, room)
                    lessons.append(lesson)

        lessons = []
        trs = iter(soup.find_all("tr"))

        for i in range(7):
            try:
                parse_day(trs)
                _ = next(trs)
                _ = next(trs)
            except StopIteration:
                break

        return Schedule(lessons)

    def to_ics(self) -> bytes:
        now = datetime.now(UTC)

        c = Calendar()
        c.add("VERSION", "2.0")
        c.add("PRODID", "-//threadexio//dit-schedule//EN")
        c.add("X-WR-CALNAME", "EvilCal")

        semester_start = SEMESTER_START
        semester_end = SEMESTER_END

        for lesson in self._lessons:
            day_offset = 0
            match lesson.day:
                case "Δευτέρα":
                    day_offset = 0
                case "Τρίτη":
                    day_offset = 1
                case "Τετάρτη":
                    day_offset = 2
                case "Πέμπτη":
                    day_offset = 3
                case "Παρασκευή":
                    day_offset = 4

            semester_start_weekday = semester_start.weekday()

            if day_offset < semester_start_weekday:
                day_offset += 7

            semester_first_week_start = semester_start - timedelta(days=semester_start_weekday)
            day_start = semester_first_week_start + timedelta(days=day_offset)

            start = day_start + lesson.start
            end = start + lesson.duration

            e = Event()
            e.add("SUMMARY", lesson.name)
            e.add("DESCRIPTION", f"In {lesson.room} with {", ".join(lesson.profs) if len(lesson.profs) > 2 else " and ".join(lesson.profs)}.")
            e.add("UID", md5(str(lesson).encode("utf-8")).hexdigest())
            e.add("CREATED", now)
            e.add("DTSTART", start)
            e.add("DTEND", end)

            e.add("SEQUENCE", 0)
            e.add("RRULE", vRecur({"FREQ": ["WEEKLY"], "UNTIL": [semester_end]}))

            a = Alarm()
            a.add("ACTION", "DISPLAY")
            a.add("TRIGGER", timedelta(minutes=-10))
            a.add("DESCRIPTION", "Reminder: Lesson in 10 minutes")
            e.add_component(a)

            e.add("URL", "https://di.uoa.gr")
            e.add("LOCATION", "Department of Informatics and Telecommunications, Zografou 161 22, Greece")
            e.add("TRANSP", "OPAQUE")
            c.add_component(e)

        return c.to_ical()

    def __iter__(self):
        return iter(self._lessons)

###############################################################################

with open("./timetable_PPS_winter2526.html", "r") as f:
    schedule = Schedule.parse_html(f.read())

schedule = filter(lambda x: x.semester == "3ο" or x.name == "Θεωρία Αριθμών", schedule)
schedule = Schedule(schedule)

with open("./out.ics", "wb") as f:
    f.write(schedule.to_ics())
