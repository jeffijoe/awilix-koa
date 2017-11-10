import { route, GET, before, after } from 'awilix-router-core'

@route('/js')
@before((ctx, next) => ctx.set('x-root-before', 'js') || next())
@after(ctx => ctx.set('x-root-after', ctx.body.message))
export default class JsClass {
  constructor({ service }) {
    this.service = service
  }

  @route('/get')
  @GET()
  func(ctx, next) {
    ctx.status = 200
    ctx.body = this.service.get('js')
    return next()
  }
}
