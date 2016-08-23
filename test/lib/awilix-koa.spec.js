const awilixKoa = require('../../lib/awilix-koa')

describe('awilix-koa', function () {
  it('exists', function () {
    expect(awilixKoa).to.exist
    expect(awilixKoa.scopePerRequest).to.exist.and.to.be.a.Function
    expect(awilixKoa.makeInvoker).to.exist.and.to.be.a.Function
    expect(awilixKoa.makeClassInvoker).to.exist.and.to.be.a.Function
  })
})
