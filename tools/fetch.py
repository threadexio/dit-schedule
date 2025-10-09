#!/usr/bin/env python3
from dataclasses import dataclass, asdict
from bs4 import BeautifulSoup
from itertools import islice
from typing import *
import argparse
import requests
import json

def skip(iterable, n: int):
    return islice(iterable, 1, None)

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
class Schedule:
    start: int
    end: int
    lessons: List[Lesson]

    @staticmethod
    def parse_html(html: str) -> Self:
        def parse_day(trs) -> List[Lesson]:
            while True:
                try:
                    day = next(trs).select("td > b > font")[0].string.strip()
                    break
                except IndexError:
                    continue
            
            rooms = list(map(lambda x: x.select("b > font")[0].string.strip(), skip(iter(next(trs).select("td")), 1)))

            def parse_slot(trs) -> List[Lesson]:
                tds = iter(next(trs).select("td"))

                def parse_time(s: str) -> Tuple[int, int]:
                    def parse_hm(s: str) -> int:
                        iter = map(int, map(str.strip, s.split(":", 1)))
                        hours = next(iter)
                        minutes = next(iter)
                        return (hours * 60 + minutes) * 60 * 1000

                    return tuple(map(parse_hm, map(str.strip, s.split("-", 1))))

                start, end = parse_time(next(tds).select("font")[0].string.strip())
                duration = end - start

                def parse_lesson(x) -> Optional[Lesson]:
                    td, room = x
                    try:
                        desc = list(td.select("font")[0].children)
                    except IndexError:
                        return None
                    if len(desc) != 5:
                        return None

                    name = desc[0].string.strip()
                    semester = desc[2].string.strip()
                    profs = list(map(str.strip, desc[4].string.split(", ")))

                    return Lesson(name, semester, profs, day, start, duration, room)

                return list(filter(lambda x: x is not None, map(parse_lesson, zip(tds, rooms))))

            lessons = []
            for _ in range(12):
                lessons += parse_slot(trs)
            return lessons

        soup = BeautifulSoup(html, "html.parser")
        trs = iter(soup.find_all("tr"))

        lessons = parse_day(trs)
        for _ in range(4):
            next(trs)
            next(trs)
            lessons += parse_day(trs)

        return Schedule(0, 0, lessons)

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=2, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-u", "--url", type=str, required=True)
    parser.add_argument("--start", type=int, required=True)
    parser.add_argument("--end", type=int, required=True)
    args = parser.parse_args()

    r = requests.get(args.url)
    r.encoding = "utf-8"
    r.raise_for_status()

    schedule = Schedule.parse_html(r.text)
    schedule.start = args.start
    schedule.end = args.end

    print(schedule.to_json())
    
if __name__ == "__main__":
    main()
