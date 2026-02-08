import Koa from 'koa'
import * as http from 'http'
import { loadControllers, controller } from '../controller'
import { scopePerRequest } from '../scope-per-request'
import { createContainer, asFunction } from 'awilix'
import { route, GET, createController } from '../'
import { FindControllersOptions } from 'awilix-router-core'
import { AddressInfo } from 'net'

const AssertRequest = require('assert-request')

describe('controller registration', () => {
  let server: http.Server
  let request: any
  beforeEach(async () => {
    ;[server, request] = await createServer()
  })

  afterEach(() => server.close())

  it('loads controllers with esModules option', async () => {
    const [esmServer, esmRequest] = await createServer({
      esModules: true,
      import: (path: string) => Promise.resolve(require(path)),
    })
    try {
      await Promise.all([
        esmRequest
          .get('/js/get')
          .okay()
          .header('x-root-before', 'js')
          .header('x-root-after', 'js')
          .json({ message: 'js' }),
        esmRequest
          .get('/ts/get')
          .okay()
          .header('x-root-before', 'ts')
          .header('x-root-after', 'ts')
          .json({ message: 'ts' }),
      ])
    } finally {
      esmServer.close()
    }
  })

  it('registers the correct routes', async () => {
    await Promise.all([
      request
        .get('/js/get')
        .okay()
        .header('x-root-before', 'js')
        .header('x-root-after', 'js')
        .json({ message: 'js' }),
      request
        .get('/ts/get')
        .okay()
        .header('x-root-before', 'ts')
        .header('x-root-after', 'ts')
        .json({ message: 'ts' }),
      request
        .get('/ts/123')
        .okay()
        .header('x-root-before', 'ts')
        .json({ method: 'GET', id: '123' }),
      request
        .post('/ts/123')
        .okay()
        .header('x-root-before', 'ts')
        .json({ method: 'POST', id: '123' }),
      request.get('/ts').okay().json({ message: 'index' }),
      request.get('/ping').okay().json({ message: 'pong' }),
      request.get('/func').okay().json({ message: 'func' }),
      request.get('/singleton').okay().json({ message: 'singleton' }),
    ])
  })
})

async function createServer(
  loadOpts?: FindControllersOptions<true>,
): Promise<[http.Server, any]> {
  const app = new Koa()
  const container = createContainer({ strict: true }).register({
    service: asFunction(() => ({ get: (message: string) => ({ message }) })),
  })
  app.use(scopePerRequest(container))
  if (loadOpts) {
    app.use(await loadControllers('__fixtures__/1/*.*', loadOpts))
  } else {
    app.use(loadControllers('__fixtures__/1/*.*'))
  }
  app.use(controller(PlainController))
  app.use(controller([Nothing]))
  app.use(controller(SingletonController, { singleton: true }))
  app.use(
    controller(
      createController(({ service }: any) => ({
        func: (ctx: any) => (ctx.body = service.get('func')),
      }))
        .prefix('/func')
        .get('', 'func'),
    ),
  )
  return new Promise((resolve) => {
    const server = app.listen(() => {
      const addr = server.address() as AddressInfo
      resolve([server, AssertRequest(`http://127.0.0.1:${addr.port}`)])
    })
  })
}

class Nothing {}

class PlainController {
  @route('/ping')
  @GET()
  ping(ctx: any) {
    ctx.body = { message: 'pong' }
  }
}

class SingletonController {
  @route('/singleton')
  @GET()
  singleton(ctx: any) {
    ctx.body = { message: 'singleton' }
  }
}
