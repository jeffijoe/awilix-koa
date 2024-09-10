import { AwilixContainer } from 'awilix'

/**
 * Koa middleware factory that will create and attach
 * a scope onto a content.
 *
 * @param  {AwilixContainer} container
 * @return {Function}
 */
export function scopePerRequest(container: AwilixContainer) {
  return function scopePerRequestMiddleware(
    ctx: any,
    next: import('koa').Next,
  ) {
    ctx.state.container = container.createScope()
    return next()
  }
}

/**
 * Koa middleware factory that will simply attach the container
 * to the context (ctx) state, with no additional scoping.
 *
 * You should only use one of either scopePerRequest or attachContainer.
 *
 * @param  {AwilixContainer} container
 * @return {Function}
 */
export function attachContainer(container: AwilixContainer) {
  return function attachContainerMiddleware(
    ctx: any,
    next: import('koa').Next,
  ) {
    ctx.state.container = container
    return next()
  }
}
