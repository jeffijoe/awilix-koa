import { DefaultContext, DefaultState, Middleware } from 'koa'
import { IOptions } from 'glob'
import {
  rollUpState,
  findControllers,
  HttpVerbs,
  getStateAndTarget,
  IStateAndTarget,
  IAwilixControllerBuilder,
} from 'awilix-router-core'
import { makeInvoker } from './invokers'
import compose from 'koa-compose'
import Router from '@koa/router'

/**
 * Constructor type.
 */
export type ConstructorOrControllerBuilder =
  | (new (...args: Array<any>) => any)
  | IAwilixControllerBuilder

export interface InstanceOptions {
  singleton?: boolean
}

/**
 * Registers one or multiple decorated controller classes.
 *
 * @param ControllerClass One or multiple "controller" classes
 *        with decorators to register
 * @param options
 */
export function controller<TState = DefaultState, TContext = DefaultContext>(
  ControllerClass:
    | ConstructorOrControllerBuilder
    | Array<ConstructorOrControllerBuilder>,
  options?: InstanceOptions,
): Middleware<TState, TContext> {
  const router = new Router<TState, TContext>()
  if (Array.isArray(ControllerClass)) {
    ControllerClass.forEach((c) =>
      _registerController(router, options, getStateAndTarget(c)),
    )
  } else {
    _registerController(router, options, getStateAndTarget(ControllerClass))
  }

  return compose([router.routes(), router.allowedMethods()]) as any
}

/**
 * Imports and prepares controllers for the given pattern, applying them to the supplied router
 *
 * @param router
 * @param pattern
 * @param globOptions
 * @param options
 */
export function importControllers<
  TState = DefaultState,
  TContext = DefaultContext,
>(
  router: Router<TState, TContext>,
  pattern: string,
  globOptions?: IOptions,
  options?: InstanceOptions,
): void {
  findControllers(pattern, {
    ...globOptions,
    absolute: true,
  }).forEach(
    _registerController.bind<
      null,
      [Router<TState, TContext>, InstanceOptions | undefined],
      [],
      void
    >(null, router, options),
  )
}

/**
 * Loads controllers for the given pattern and returns a koa-compose'd Middleware
 * This return value must be used with `Koa.use`, and is incompatible with `Router.use`
 *
 * @param pattern
 * @param globOptions
 * @param router
 * @param options
 */
export function loadControllers<
  TState = DefaultState,
  TContext = DefaultContext,
>(
  pattern: string,
  globOptions?: IOptions,
  router?: Router<TState, TContext>,
  options?: InstanceOptions,
): Middleware<TState, TContext> {
  const r = router || new Router<TState, TContext>()
  importControllers(r, pattern, globOptions, options)
  return compose([r.routes(), r.allowedMethods()]) as any
}

/**
 * Reads the config state and registers the routes in the router.
 *
 * @param router
 * @param options
 * @param ControllerClass
 */
function _registerController<TState, TContext>(
  router: Router<TState, TContext>,
  options?: InstanceOptions,
  stateAndTarget?: IStateAndTarget | null,
): void {
  if (!stateAndTarget) {
    return
  }

  const { state, target } = stateAndTarget
  const invoker = makeInvoker(target as any, {
    lifetime: options?.singleton ? 'SINGLETON' : 'SCOPED',
  })
  const rolledUp = rollUpState(state)
  rolledUp.forEach((methodCfg, methodName) => {
    methodCfg.verbs.forEach((httpVerb) => {
      let method = httpVerb.toLowerCase()
      if (httpVerb === HttpVerbs.ALL) {
        method = 'all'
      }

      // This should be safe since the router exposes methods for all the HTTP verbs.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      router[method](
        methodCfg.paths,
        ...methodCfg.beforeMiddleware,
        invoker(methodName),
        ...methodCfg.afterMiddleware,
      )
    })
  })
}
