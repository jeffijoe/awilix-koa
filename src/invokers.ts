import {
  asFunction,
  Registration,
  AwilixContainer,
  RegistrationOptions,
  Constructor,
  asClass
} from 'awilix'

// TODO: Use proper import after Awilix v3 rewrite to TS.
const { isClass } = require('awilix/lib/utils')

/**
 * Creates either a function invoker or a class invoker, based on whether
 * the argument can be classified as a class or not. Uses Awilix' `isClass` utility.
 *
 * @param functionOrClass
 * The function or class to invoke.
 *
 * @param opts
 * Resolver options for the class/function.
 */
export function makeInvoker(
  functionOrClass: Function | Constructor<any>,
  opts?: RegistrationOptions
) {
  return isClass(functionOrClass)
    ? makeClassInvoker(functionOrClass as Constructor<any>, opts)
    : makeFunctionInvoker(functionOrClass, opts)
}

/**
 * Returns a function that when called with a name,
 * returns another function to be used as Koa middleware.
 * That function will run `fn` with the container cradle as the
 * only parameter, and then call the `methodToInvoke` on
 * the result.
 *
 * @param, {Function} fn
 * @return {(methodToInvoke: string) => (ctx) => void}
 */
export function makeFunctionInvoker(fn: Function, opts?: RegistrationOptions) {
  return makeResolverInvoker(asFunction(fn, opts))
}

/**
 * Same as `makeInvoker` but for classes.
 *
 * @param  {Class} Class
 * @return {(methodToInvoke: string) => (ctx) => void}
 */
export function makeClassInvoker(
  Class: Constructor<any>,
  opts?: RegistrationOptions
) {
  return makeResolverInvoker(asClass(Class, opts))
}

/**
 * Returns a function that when called with a method name,
 * returns another function to be used as Koa middleware.
 * That function will run `container.build(resolver)`, and
 * then call the method on the result, passing in the Koa context
 * and `next()`.
 *
 * @param, {Resolver} resolver
 * @return {(methodToInvoke: string) => (ctx) => void}
 */
export function makeResolverInvoker(resolver: Registration) {
  /**
   * 2nd step is to create a method to invoke on the result
   * of the resolver.
   *
   * @param  {string} methodToInvoke
   * @return {(ctx) => void}
   */
  return function makeMemberInvoker(methodToInvoke: string) {
    /**
     * The invoker middleware.
     *
     * @param  {Koa.Context} ctx
     * @param  {...*} rest
     * @return {*}
     */
    return function memberInvoker(ctx: any, ...rest: any[]) {
      const container: AwilixContainer = ctx.state.container
      const resolved: any = container.build(resolver)
      return resolved[methodToInvoke](ctx, ...rest)
    }
  }
}
