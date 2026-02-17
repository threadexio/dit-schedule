#!/usr/bin/env python3
from dataclasses import dataclass, asdict
from contextlib import closing
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from itertools import *
from functools import *
from typing import *
import argparse
import requests
import urllib
import json
import sys

###############################################################################

def eprint(*values, **kwargs):
    kwargs["file"] = sys.stderr
    print(*values, **kwargs)

def warn(message: str):
    eprint(f"warn: {message}", file=sys.stderr)

def error(message: str):
    eprint(f"error: {message}", file=sys.stderr)

###############################################################################

def find(pred, iterable, default=None):
    try:
        return next(filter(pred, iterable))
    except StopIteration:
        return default

def skip(n, iterable):
    return islice(iterable, n, None)

###############################################################################

def open_or_default(path: str, mode: str, default, *args, **kwargs):
    if path == "-":
        return default(*args, **kwargs)
    else:
        return open(path, mode, *args, **kwargs)

def fetch(url: str) -> bytes:
    parsed = urllib.parse.urlsplit(url)

    match parsed.scheme:
        case "file":
            with closing(open(parsed.path, "rb")) as f:
                return f.read()

        case "http" | "https":
            r = requests.get(url, headers={
                "User-Agent": "github.com/threadexio/dit-schedule"
            })
            r.raise_for_status()
            return r.content

        case _:
            raise ValueError(f"don't know how to handle scheme '{parsed.scheme}'")

###############################################################################

@dataclass
class Lesson:
    name: str
    semester: str
    profs: List[str]
    day: str
    start: int
    duration: int
    room: str

@dataclass
class Holiday:
    start: str
    end: str

    @staticmethod
    def parse(s: str) -> Self:
        components = list(map(datetime.fromisoformat, s.split("/", 1)))

        if len(components) == 2:
            return Holiday(components[0].isoformat(), components[1].isoformat())
        elif len(components) == 1:
            start = components[0]
            end = start + timedelta(1)
            return Holiday(start.isoformat(), end.isoformat())
        else:
            raise ValueError("invalid format for Holiday")

@dataclass
class Schedule:
    start: str
    end: str
    lessons: List[Lesson]
    holidays: List[str]

def parse_schedule_html(html: str) -> List[Lesson]:
    TIME_SLOTS = 12

    lessons = []
    soup = BeautifulSoup(html, "html.parser")

    def find_day_tr(day: str):
        font_tag = find(lambda node: node.text == day, soup.css.select("tr > td > b > font"))
        return font_tag.parent.parent.parent

    days = ["Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή"]
    for day in days:
        day_tr = find_day_tr(day)
        if day_tr is None:
            warn(f"cannot find schedule data for day '{day}'")
            continue

        trs = filter(lambda node: node.name == "tr", day_tr.next_siblings)

        room_map_tr = next(trs)
        room_map_cells = room_map_tr.css.select("td > b > font")
        room_map = list(skip(1, map(lambda node: node.text.strip(), room_map_cells)))

        for _ in range(TIME_SLOTS):
            tr = next(trs)
            cells = iter(tr.css.select("td"))

            def parse_time_h_mm_to_ms(s: str) -> int:
                hours, minutes = map(int, s.split(":", 1))
                total_minutes = hours * 60 + minutes
                return total_minutes * 60 * 1000

            time_slot = next(cells).find("font").text.strip()
            time_slot_start, time_slot_end = map(parse_time_h_mm_to_ms, map(str.strip, time_slot.split("-", 1)))

            for i, cell in enumerate(cells):
                if len(cell.text.strip()) == 0:
                    continue

                room = room_map[i]
                components = map(str.strip, filter(lambda x: isinstance(x, str), cell.find("font")))
                try:
                    name = next(components)
                    if name == "ΔΕΣΜΕΥΜΕΝΗ":
                        continue

                    semester = next(components)
                    profs = map(str.strip, next(components).split(","))
                except StopIteration:
                    warn(f"ilformed cell found @ day '{day}' at '{time_slot}' in '{room}'")
                    continue

                lessons.append(Lesson(name, semester, list(profs), day, time_slot_start, time_slot_end - time_slot_start, room))

    return lessons

###############################################################################

class Command:
    @staticmethod
    def register(parser):
        raise NotImplementedError()

    @staticmethod
    def run(args) -> int:
        raise NotImplementedError()

class New(Command):
    @staticmethod
    def register(parser):
        parser.add_argument("--semester-start", type=datetime.fromisoformat, help="Start of the semester. (ISO format)", required=True)
        parser.add_argument("--semester-end", type=datetime.fromisoformat, help="End of the semester. (ISO format)", required=True)
        parser.add_argument("--schedule-uri", type=str, help="URI of the HTML schedule file", required=True)
        parser.add_argument("--holiday", type=str, action="append", help="No lessons on these days")
        parser.add_argument("-o", "--out", type=str, help="Write the manifest to this path.", required=True)

    @staticmethod
    def run(args) -> int:
        schedule_html = fetch(args.schedule_uri).decode("utf-8")
        lessons = parse_schedule_html(schedule_html)
        eprint(f"loaded {len(lessons)} lessons")

        start = args.semester_start.isoformat()
        end = args.semester_end.isoformat()
        holidays = list(map(Holiday.parse, args.holiday or []))

        schedule = Schedule(start, end, lessons, holidays)

        with closing(open_or_default(args.out, "w", lambda: sys.stdout)) as out:
            json.dump(asdict(schedule), out, ensure_ascii=False, indent=2)
            out.write("\n")

        return 0

@dataclass
class Fetch(Command):
    @staticmethod
    def register(parser):
        parser.add_argument("uri", type=str, help="URI of the HTML schedule file")

    @staticmethod
    def run(args):
        schedule_html = fetch(args.uri).decode("utf-8")
        lessons = parse_schedule_html(schedule_html)
        json.dump(list(map(asdict, lessons)), sys.stdout, ensure_ascii=False, indent=2)
        print()
        return 0

###############################################################################

def main() -> int:
    commands = {
        "new": New,
        "fetch": Fetch,
    }

    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    for name, command in commands.items():
        command.register(subparsers.add_parser(name))

    args = parser.parse_args()
    return commands[args.command].run(args)

if __name__ == "__main__":
    sys.exit(main())
