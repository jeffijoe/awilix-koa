import { route, GET, before, after, ALL } from 'awilix-router-core'

@route('/ts')
@before((ctx: any, next: any) => ctx.set('x-root-before', 'ts') || next())
@after((ctx: any) => ctx.set('x-root-after', ctx.body.message))
export default class TsClass {
  service: any
  constructor({ service }: any) {
    this.service = service
  }

  @GET()
  index(ctx: any) {
    ctx.body = { message: 'index' }
  }

  @route('/get')
  @GET()
  func(ctx: any, next: any) {
    ctx.status = 200
    ctx.body = this.service.get('ts')
    return next()
  }

  @route('/:id')
  @ALL()
  all(ctx: any) {
    ctx.body = { method: ctx.method, id: ctx.params.id }
  }
}
