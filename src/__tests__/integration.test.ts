/* eslint-disable @typescript-eslint/no-unused-vars */
import Koa from 'koa'
import { scopePerRequest, makeInvoker, makeClassInvoker } from '../'
import { createContainer, asClass, asFunction } from 'awilix'
const KoaRouter = require('@koa/router')
const AssertRequest = require('assert-request')

class TestService {
  constructor({ serviceConstructor }: any) {
    /**/
  }
}

class TestClass {
  constructor({ testClassConstructor, testService }: any) {
    /**/
  }

  handle(ctx: any) {
    ctx.body = { success: true }
  }
}

function testFactoryFunction({
  testFactoryFunctionInvocation,
  testService,
}: any) {
  return {
    handle(ctx: any) {
      ctx.body = { success: true }
    },
  }
}

function createServer(spies: any) {
  const app = new Koa()
  const router = new KoaRouter()

  const container = createContainer()
    .register({
      testService: asClass(TestService).scoped(),
    })
    // These will be registered as transient.
    .register(
      Object.keys(spies).reduce((obj: any, key) => {
        obj[key] = asFunction(spies[key])
        return obj
      }, {}),
    )
  app.use(scopePerRequest(container))

  const fnAPI = makeInvoker(testFactoryFunction)
  const classAPI = makeClassInvoker(TestClass)
  router.get('/function', fnAPI('handle'))
  router.get('/class', classAPI('handle'))
  app.use(router.routes())

  return new Promise((resolve, reject) => {
    const server = app.listen((err: any) =>
      err ? reject(err) : resolve(server),
    )
  })
}

describe('integration', function () {
  let request: any
  let server: any
  let serviceConstructor: any
  let testClassConstructor: any
  let testFactoryFunctionInvocation: any

  beforeEach(function () {
    serviceConstructor = jest.fn()
    testClassConstructor = jest.fn()
    testFactoryFunctionInvocation = jest.fn()
    const spies = {
      serviceConstructor,
      testClassConstructor,
      testFactoryFunctionInvocation,
    }
    return createServer(spies).then((s) => {
      server = s
      const addr = server.address()
      request = AssertRequest(`http://127.0.0.1:${addr.port}`)
    })
  })

  afterEach(function () {
    server.close()
  })

  describe('makeInvoker', function () {
    it('makes sure the spy is called once for each request', function () {
      return Promise.all([
        request.get('/function').okay(),
        request.get('/function').okay(),
      ]).then(() => {
        expect(testClassConstructor).not.toHaveBeenCalled()
        expect(testFactoryFunctionInvocation).toHaveBeenCalledTimes(2)
        expect(serviceConstructor).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('makeClassInvoker', function () {
    it('makes sure the spy is called once for each request', function () {
      return Promise.all([
        request.get('/class').okay(),
        request.get('/class').okay(),
      ]).then(() => {
        expect(testFactoryFunctionInvocation).not.toHaveBeenCalled()
        expect(testClassConstructor).toHaveBeenCalledTimes(2)
        expect(serviceConstructor).toHaveBeenCalledTimes(2)
      })
    })
  })
})
