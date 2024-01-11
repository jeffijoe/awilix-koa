import { Middleware } from 'koa'
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

/**
 * Registers one or multiple decorated controller classes.
 *
 * @param ControllerClass One or multiple "controller" classes
 *        with decorators to register
 */
export function controller(
  ControllerClass:
    | ConstructorOrControllerBuilder
    | Array<ConstructorOrControllerBuilder>,
): Middleware {
  const router = new Router()
  if (Array.isArray(ControllerClass)) {
    ControllerClass.forEach((c) =>
      _registerController(router, getStateAndTarget(c)),
    )
  } else {
    _registerController(router, getStateAndTarget(ControllerClass))
  }

  return compose([router.routes(), router.allowedMethods()]) as any
}

/**
 * Imports and prepares controllers for the given pattern, applying them to the supplied router
 *
 * @param router
 * @param pattern
 * @param opts
 */
export function importControllers(
  router: Router,
  pattern: string,
  opts?: IOptions,
): void {
  findControllers(pattern, {
    ...opts,
    absolute: true,
  }).forEach(_registerController.bind(null, router))
}

/**
 * Loads controllers for the given pattern and returns a koa-compose'd Middleware
 * This return value must be used with `Koa.use`, and is incompatible with `Router.use`
 *
 * @param pattern
 * @param opts
 * @param router
 */
export function loadControllers(
  pattern: string,
  opts?: IOptions,
  router?: Router,
): Middleware {
  const r = router || new Router()
  importControllers(r, pattern, opts)
  return compose([r.routes(), r.allowedMethods()]) as any
}

/**
 * Reads the config state and registers the routes in the router.
 *
 * @param router
 * @param ControllerClass
 */
function _registerController(
  router: Router,
  stateAndTarget: IStateAndTarget | null,
): void {
  if (!stateAndTarget) {
    return
  }

  const { state, target } = stateAndTarget
  const invoker = makeInvoker(target as any)
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
