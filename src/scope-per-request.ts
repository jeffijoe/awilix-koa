import { AwilixContainer } from 'awilix'

/**
 * Koa middleware factory that will create and attach
 * a scope onto a content.
 *
 * @param  {AwilixContainer} container
 * @return {Function}
 */
export function scopePerRequest(container: AwilixContainer) {
  return function scopePerRequestMiddleware(ctx: any, next: Function) {
    ctx.state.container = container.createScope()
    return next()
  }
}
