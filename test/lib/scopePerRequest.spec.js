const scopePerRequest = require('../../lib/scopePerRequest')
const { createContainer } = require('awilix')

describe('scopePerRequest', function () {
  it('returns a middleware that creates a scope and attaches it to a context + calls next', function () {
    const container = createContainer()
    const middleware = scopePerRequest(container)
    const next = sinon.spy(() => 42)
    const ctx = {
      state: {}
    }
    const result = middleware(ctx, next)
    expect(ctx.state.container).to.exist
    expect(result).to.equal(42)
  })
})
