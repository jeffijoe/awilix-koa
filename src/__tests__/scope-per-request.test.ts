import { scopePerRequest, attachContainer } from '../scope-per-request'
import { createContainer } from 'awilix'

describe('scopePerRequest', function () {
  it('returns a middleware that creates a scope and attaches it to a context + calls next', async function () {
    const container = createContainer()
    const middleware = scopePerRequest(container)
    const next = jest.fn(async () => 42)
    const ctx = {
      state: {} as any,
    }
    const result = await middleware(ctx, next)
    expect(ctx.state.container).toBeDefined()
    expect(ctx.state.container).not.toBe(container)
    expect(result).toEqual(42)
  })
})

describe('attachContainer', function () {
  it('returns a middleware that attaches the container directly without scoping', async function () {
    const container = createContainer()
    const middleware = attachContainer(container)
    const next = jest.fn(async () => 'done')
    const ctx = {
      state: {} as any,
    }
    const result = await middleware(ctx, next)
    expect(ctx.state.container).toBe(container)
    expect(result).toEqual('done')
  })
})
