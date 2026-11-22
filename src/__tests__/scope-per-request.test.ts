import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { scopePerRequest, attachContainer } from '../scope-per-request'
import { createContainer } from 'awilix'

describe('scopePerRequest', function () {
  it('returns a middleware that creates a scope and attaches it to a context + calls next', async function () {
    const container = createContainer()
    const middleware = scopePerRequest(container)
    const next = mock.fn(async () => 42)
    const ctx = {
      state: {} as any,
    }
    const result = await middleware(ctx, next)
    assert.notStrictEqual(ctx.state.container, undefined)
    assert.notStrictEqual(ctx.state.container, container)
    assert.deepStrictEqual(result, 42)
  })
})

describe('attachContainer', function () {
  it('returns a middleware that attaches the container directly without scoping', async function () {
    const container = createContainer()
    const middleware = attachContainer(container)
    const next = mock.fn(async () => 'done')
    const ctx = {
      state: {} as any,
    }
    const result = await middleware(ctx, next)
    assert.strictEqual(ctx.state.container, container)
    assert.deepStrictEqual(result, 'done')
  })
})
