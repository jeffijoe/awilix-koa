/* eslint no-useless-constructor: 0 */
const Koa = require('koa')
const KoaRouter = require('koa-router')
const { scopePerRequest, makeInvoker, makeClassInvoker } = require('../../lib/awilix-koa')
const { createContainer, asClass } = require('awilix')
const AssertRequest = require('assert-request')

class TestService {
  constructor ({ serviceConstructor }) {
  }
}

class TestClass {
  constructor ({ testClassConstructor, testService }) {
  }

  handle (ctx) {
    ctx.body = { success: true }
  }
}

function testFactoryFunction ({ testFactoryFunctionInvocation, testService }) {
  return {
    handle (ctx) {
      ctx.body = { success: true }
    }
  }
}

function createServer (spies) {
  const app = new Koa()
  const router = new KoaRouter()

  const container = createContainer()
    .register({
      testService: asClass(TestService).scoped()
    })
    // These will be registered as transient.
    .registerFunction(spies)
  app.use(scopePerRequest(container))

  const fnAPI = makeInvoker(testFactoryFunction)
  const classAPI = makeClassInvoker(TestClass)
  router.get('/function', fnAPI('handle'))
  router.get('/class', classAPI('handle'))
  app.use(router.routes())

  return new Promise((resolve, reject) => {
    let server
    server = app.listen((err) => err ? reject(err) : resolve(server))
  })
}

describe('integration', function () {
  let
    request,
    server,
    serviceConstructor,
    testClassConstructor,
    testFactoryFunctionInvocation

  beforeEach(function () {
    serviceConstructor = sinon.spy()
    testClassConstructor = sinon.spy()
    testFactoryFunctionInvocation = sinon.spy()
    const spies = {
      serviceConstructor,
      testClassConstructor,
      testFactoryFunctionInvocation
    }
    return createServer(spies).then(s => {
      server = s
      request = AssertRequest(server)
    })
  })

  afterEach(function (done) {
    server.close(done)
  })

  describe('makeInvoker', function () {
    it('makes sure the spy is called once for each request', function () {
      return Promise.all([
        request.get('/function').okay(),
        request.get('/function').okay()
      ]).then(() => {
        expect(testClassConstructor).to.not.have.been.called
        expect(testFactoryFunctionInvocation).to.have.been.calledTwice
        expect(serviceConstructor).to.have.been.calledTwice
      })
    })
  })

  describe('makeClassInvoker', function () {
    it('makes sure the spy is called once for each request', function () {
      return Promise.all([
        request.get('/class').okay(),
        request.get('/class').okay()
      ]).then(() => {
        expect(testFactoryFunctionInvocation).to.not.have.been.called
        expect(testClassConstructor).to.have.been.calledTwice
        expect(serviceConstructor).to.have.been.calledTwice
      })
    })
  })
})
