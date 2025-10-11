export class Share {
  public schedule: number
  public lessons: Set<number>

  constructor(schedule: number, lessons: Set<number>) {
    this.schedule = schedule
    this.lessons = lessons
  }

  toString(): string {
    const raw = `${this.schedule}/${Array.from(this.lessons.values()).join(',')}`
    const encoded = btoa(raw).replace(/=/g, '')
    return `DIS${encoded}`
  }

  static parse(code: string): Share {
    if (!code.startsWith('DIS')) {
      throw new ParseShareCodeError('not a valid share code')
    }

    const encoded_body = code.substring(3)
    const body = atob(encoded_body)

    const body_parts = body.split('/', 2)
    if (body_parts.length !== 2) {
      throw new ParseShareCodeError('invalid share code format')
    }

    const schedule = parseInt(body_parts[0]!)
    const lessons = body_parts[1]!.split(',').map((x) => parseInt(x))

    return new Share(schedule, new Set(lessons))
  }
}

export class ParseShareCodeError extends Error {
  constructor(msg: string) {
    super(msg)
    Object.setPrototypeOf(this, ParseShareCodeError.prototype)
  }
}
