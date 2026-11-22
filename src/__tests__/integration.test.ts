import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import Koa from 'koa'
import { scopePerRequest, makeInvoker, makeClassInvoker } from '../'
import { createContainer, asClass, asFunction } from 'awilix'
const KoaRouter = require('@koa/router')
import { requestFrom } from './request'

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

  const container = createContainer({ strict: true })
    .register({
      testService: asClass(TestService).scoped(),
    })
    .register(
      Object.keys(spies).reduce((obj: any, key) => {
        obj[key] = asFunction(spies[key]).scoped()
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
  let request: ReturnType<typeof requestFrom>
  let server: any
  let serviceConstructor: any
  let testClassConstructor: any
  let testFactoryFunctionInvocation: any

  beforeEach(function () {
    serviceConstructor = mock.fn()
    testClassConstructor = mock.fn()
    testFactoryFunctionInvocation = mock.fn()
    const spies = {
      serviceConstructor,
      testClassConstructor,
      testFactoryFunctionInvocation,
    }
    return createServer(spies).then((s) => {
      server = s
      const addr = server.address()
      request = requestFrom(`http://127.0.0.1:${addr.port}`)
    })
  })

  afterEach(function () {
    server.close()
  })

  describe('makeInvoker', function () {
    it('makes sure the spy is called once for each request', function () {
      return Promise.all([request('/function'), request('/function')]).then(
        () => {
          assert.strictEqual(testClassConstructor.mock.callCount(), 0)
          assert.strictEqual(testFactoryFunctionInvocation.mock.callCount(), 2)
          assert.strictEqual(serviceConstructor.mock.callCount(), 2)
        },
      )
    })
  })

  describe('makeClassInvoker', function () {
    it('makes sure the spy is called once for each request', function () {
      return Promise.all([request('/class'), request('/class')]).then(() => {
        assert.strictEqual(testFactoryFunctionInvocation.mock.callCount(), 0)
        assert.strictEqual(testClassConstructor.mock.callCount(), 2)
        assert.strictEqual(serviceConstructor.mock.callCount(), 2)
      })
    })
  })
})
