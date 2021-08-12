import * as awilixKoa from '../'

describe('awilix-koa', function () {
  it('exists', function () {
    expect(awilixKoa).toBeDefined()
    expect(awilixKoa.scopePerRequest).toBeDefined()
    expect(awilixKoa.makeInvoker).toBeDefined()
    expect(awilixKoa.makeClassInvoker).toBeDefined()
  })
})
