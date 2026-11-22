import assert from 'node:assert/strict'

interface RequestExpectation {
  method?: 'GET' | 'POST'
  status?: number
  headers?: Record<string, string>
  json?: unknown
  text?: RegExp
}

export function requestFrom(origin: string) {
  return async (path: string, expected: RequestExpectation = {}) => {
    const response = await fetch(new URL(path, origin), {
      method: expected.method,
      redirect: 'manual',
    })
    const body = await response.text()
    assert.strictEqual(response.status, expected.status ?? 200, body)

    for (const [name, value] of Object.entries(expected.headers ?? {})) {
      assert.strictEqual(response.headers.get(name), value)
    }
    if (expected.json !== undefined) {
      assert.deepStrictEqual(JSON.parse(body), expected.json)
    }
    if (expected.text) {
      assert.match(body, expected.text)
    }
  }
}
