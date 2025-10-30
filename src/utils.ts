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

export function fold<T, U>(iterable: Iterable<T>, initial: U, f: (acc: U, e: T) => U): U {
  let r = initial

  for (const item of iterable) {
    r = f(r, item)
  }

  return r
}

export function sum(iterable: Iterable<number>): number {
  return fold(iterable, 0, (s, x) => s + x)
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

export async function fetchCompressedJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  algorithms: CompressionFormat[] = ['gzip', 'deflate', 'deflate-raw'],
): Promise<T> {
  const r = await fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      'Accept-Encoding': algorithms.join(', '),
    },
  })

  const blob = await r.blob()

  let output
  const algorithm_reported = r.headers.get('Content-Encoding')
  if (algorithm_reported === null) {
    output = await try_decompress_many(blob, algorithms)
  } else if ((algorithms as string[]).includes(algorithm_reported)) {
    output = await try_decompress(blob, algorithm_reported as CompressionFormat)
  } else {
    output = await try_decompress_many(blob, algorithms)
  }

  if (output === null) output = blob

  const text = await output.text()
  return JSON.parse(text)
}

async function decompress(blob: Blob, algorithm: CompressionFormat): Promise<Blob> {
  return streamToBlob(blob.stream().pipeThrough(new DecompressionStream(algorithm)))
}

async function try_decompress(blob: Blob, algorithm: CompressionFormat): Promise<Blob | null> {
  try {
    return await decompress(blob, algorithm)
  } catch (_) {
    return null
  }
}

async function try_decompress_many(
  blob: Blob,
  algorithms: CompressionFormat[],
): Promise<Blob | null> {
  for (const algorithm of algorithms) {
    const r = await try_decompress(blob, algorithm)
    if (r === null) continue
    return r
  }

  return null
}

async function streamToBlob(
  stream: ReadableStream<Uint8Array<ArrayBufferLike>>,
  options?: BlobPropertyBag,
) {
  const reader = stream.getReader()

  const chunks: Uint8Array<ArrayBufferLike>[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    return new Blob(chunks as BlobPart[], options)
  } finally {
    reader.releaseLock()
  }

  throw new Error('failed to collect stream to blob')
}
