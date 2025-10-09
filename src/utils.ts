export function shift(
  t: Date,
  by: {
    ms?: number
    seconds?: number
    minutes?: number
    hours?: number
    days?: number
  },
): Date {
  let x = t.getTime()

  if (by.ms !== undefined) {
    x += by.ms
  }

  if (by.seconds !== undefined) {
    x += by.seconds * 1000
  }

  if (by.minutes !== undefined) {
    x += by.minutes * 60 * 1000
  }

  if (by.hours !== undefined) {
    x += by.hours * 60 * 60 * 1000
  }

  if (by.days !== undefined) {
    x += by.days * 24 * 60 * 60 * 1000
  }

  return new Date(x)
}

export function* enumerate<T>(iterable: Iterable<T>, start: number = 0, step: number = 0) {
  let i = start
  for (const item of iterable) {
    yield [i++, item] as const
  }
}

export function* map<T>(iterable: Iterable<T>, f: Function, thisArg: any = null) {
  for (const item of iterable) {
    yield f.call(thisArg, item)
  }
}
