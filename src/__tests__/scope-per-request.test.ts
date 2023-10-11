import { scopePerRequest } from '../scope-per-request'
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
    expect(result).toEqual(42)
  })
})
