#!/usr/bin/env python3
from typing import *
from dataclasses import dataclass
from datetime import datetime, UTC, timedelta
from ics import Calendar, Event, DisplayAlarm
from hashlib import md5
import arrow
import re
import json

@dataclass
class Lesson:
    name: str
    semester: int
    specifier: Optional[str]
    profs: List[str]

    start: timedelta
    duration: timedelta

    day: str
    room: str

    @staticmethod
    def parse(s: str, *args) -> Self:
        s = s.strip()
        m = re.match(r"^(?P<name>.+)\s(?P<semester>[0-9]+)ο(\s-\s(?P<specifier>.+))?\s(?P<profs>.+)$", s)

        name = m.group("name")
        semester = int(m.group("semester"))
        specifier = m.group("specifier")
        profs = list(map(str.strip, m.group("profs").split(",")))

        return Lesson(name, semester, specifier, profs, *args)

    def __str__(self) -> str:
        return self.__repr__()

    def __repr__(self) -> str:
        return f"Lesson {{\"{self.name}\", {self.semester}, {self.specifier}, {self.profs}, {self.start}:+{self.duration}, {self.day}, {self.room}}}"

lessons = [
    Lesson.parse("Εισαγωγή στον Προγραμματισμό (άρτιοι ΑΜ) 1ο Αυγερινός", timedelta(hours=9), timedelta(hours=2), "Δευτέρα", "Αμφιθέατρο"),
    Lesson.parse("Διακριτά Μαθηματικά 1ο Εμίρης, Χαμόδρακας", timedelta(hours=11), timedelta(hours=2), "Δευτέρα", "Αμφιθέατρο"),
    Lesson.parse("Πιθανότητες και Στατιστική 3ο Αχλιόπτας", timedelta(hours=9), timedelta(hours=2), "Τρίτη", "Αμφιθέατρο")
]


now = arrow.utcnow()

c = Calendar()
c.creator = "dit-schedule"

for lesson in lessons:
    week_start = arrow.Arrow(2025, 9, 29, tzinfo="Europe/Athens")

    match lesson.day:
        case "Δευτέρα":
            day_start = week_start.shift(days=+0)
        case "Τρίτη":
            day_start = week_start.shift(days=+1)
        case "Τετάρτη":
            day_start = week_start.shift(days=+2)
        case "Πέμπτη":
            day_start = week_start.shift(days=+3)
        case "Παρασκευή":
            day_start = week_start.shift(days=+4)

    begin = day_start + lesson.start
    end = begin + lesson.duration

    e = Event(
        name=lesson.name,
        uid=f"{md5(lesson.name.encode("utf-8"))}",
        created=now,
        last_modified=now,
        begin=begin,
        end=end,
        url="https://di.uoa.gr",
        location="TODO",
        transparent=False,
        alarms=[
            DisplayAlarm(
                trigger=timedelta(minutes=-15),
                repeat=1,
                duration=timedelta()
            )
        ],
        attendees=[],
        categories=["DIT Schedule"],
        classification=None
    )

    c.events.add(e)

with open("out.ics", "w") as f:
    f.writelines(c.serialize_iter())
