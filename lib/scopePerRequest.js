/**
 * Koa middleware factory that will create and attach
 * a scope onto a content.
 *
 * @param  {AwilixContainer} container
 * @return {Function}
 */
module.exports = function scopePerRequest (container) {
  return function scopePerRequestMiddleware (ctx, next) {
    ctx.state.container = container.createScope()
    return next()
  }
}
