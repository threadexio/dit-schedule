export function shift(
  t: Date,
  by: {
    ms?: number
    seconds?: number
    minutes?: number
    hours?: number
    days?: number
    weeks?: number
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

  if (by.weeks !== undefined) {
    x += by.weeks * 7 * 24 * 60 * 60 * 1000
  }

  return new Date(x)
}

export function* enumerate<T>(iterable: Iterable<T>, start: number = 0, step: number = 1) {
  let i = start
  for (const item of iterable) {
    yield [i, item] as const
    i += step
  }
}

export function* map<T, U>(iterable: Iterable<T>, f: (e: T) => U) {
  for (const item of iterable) {
    yield f(item)
  }
}

export function* filter<T>(iterable: Iterable<T>, f: (e: T) => boolean) {
  for (const item of iterable) {
    if (f(item)) {
      yield item
    }
  }
}

export function* filter_map<T, U>(iterable: Iterable<T>, f: (e: T) => U | undefined) {
  for (const item of iterable) {
    const e = f(item)
    if (e !== undefined) {
      yield e
    }
  }
}

export function any<T>(iterable: Iterable<T>, f: (e: T) => boolean): boolean {
  for (const item of iterable) {
    if (f(item)) {
      return true
    }
  }

  return false
}

export function all<T>(iterable: Iterable<T>, f: (e: T) => boolean): boolean {
  for (const item of iterable) {
    if (!f(item)) {
      return false
    }
  }

  return true
}

export function download(data: string, opts: { type: string; filename: string; charset?: string }) {
  const charset = opts.charset || 'utf-8'

  const a = document.createElement('a')
  a.download = opts.filename
  a.href = `data:${opts.type};charset=${charset},${encodeURIComponent(data)}`

  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function implies(a: boolean, b: boolean): boolean {
  return (a && b) || !a
}
