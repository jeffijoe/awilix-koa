import { scopePerRequest } from '../scope-per-request'
import { createContainer } from 'awilix'

describe('scopePerRequest', function () {
  it('returns a middleware that creates a scope and attaches it to a context + calls next', function () {
    const container = createContainer()
    const middleware = scopePerRequest(container)
    const next = jest.fn(() => 42)
    const ctx = {
      state: {} as any,
    }
    const result = middleware(ctx, next)
    expect(ctx.state.container).toBeDefined()
    expect(result).toEqual(42)
  })
})
