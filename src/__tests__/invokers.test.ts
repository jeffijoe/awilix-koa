import {
  makeClassInvoker,
  makeFunctionInvoker,
  makeInvoker,
  inject,
} from '../invokers'
import { createContainer, AwilixContainer, asValue, asFunction } from 'awilix'

describe('invokers', function () {
  let container: AwilixContainer
  let methodSpy: any
  let factorySpy: any
  let constructorSpy: any
  let ctx: any
  beforeEach(function () {
    factorySpy = jest.fn()
    constructorSpy = jest.fn()
    methodSpy = jest.fn()
    container = createContainer({ strict: true })
    container.register('param', asValue(42))
    ctx = {
      state: {
        container,
      },
    }
  })

  describe('makeFunctionInvoker', function () {
    it('returns callable middleware', function () {
      function target({ param }: any) {
        factorySpy()
        const obj = {
          method(ctx: any) {
            methodSpy()
            expect(this).toBe(obj)
            return [ctx, param]
          },
        }
        return obj
      }

      const invoker = makeFunctionInvoker(target)

      // Call it twice.
      invoker('method')(ctx)
      const result = invoker('method')(ctx)

      expect(result).toEqual([ctx, 42])
      expect(factorySpy).toHaveBeenCalledTimes(2)
      expect(methodSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('makeClassInvoker', function () {
    it('returns callable middleware', function () {
      class Target {
        param: any
        constructor({ param }: any) {
          constructorSpy()
          this.param = param
        }

        method(ctx: any, additional: any) {
          methodSpy()
          expect(this).toBeInstanceOf(Target)
          return [ctx, this.param, additional]
        }
      }

      const invoker = makeClassInvoker(Target)

      // Call it twice.
      invoker('method')(ctx, 'hello')
      const result = invoker('method')(ctx, 'hello')

      expect(result).toEqual([ctx, 42, 'hello'])
      expect(constructorSpy).toHaveBeenCalledTimes(2)
      expect(methodSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('inject', () => {
    describe('passing a function', () => {
      it('converts function to resolver returns callable middleware', () => {
        const converted = inject(({ param }: any) => {
          constructorSpy()
          return (ctx: any, additional: any) => {
            methodSpy()
            return [ctx, param, additional]
          }
        })

        // Call it twice.
        converted(ctx, 'hello')
        const result = converted(ctx, 'hello')

        expect(result).toEqual([ctx, 42, 'hello'])
        expect(constructorSpy).toHaveBeenCalledTimes(2)
        expect(methodSpy).toHaveBeenCalledTimes(2)
      })
    })

    describe('passing a resolver', () => {
      it('converts function to resolver returns callable middleware', () => {
        const converted = inject(
          asFunction(({ param }: any) => {
            constructorSpy()
            return (ctx: any, additional: any) => {
              methodSpy()
              return [ctx, param, additional]
            }
          }),
        )

        // Call it twice.
        converted(ctx, 'hello')
        const result = converted(ctx, 'hello')

        expect(result).toEqual([ctx, 42, 'hello'])
        expect(constructorSpy).toHaveBeenCalledTimes(2)
        expect(methodSpy).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('makeInvoker', () => {
    it('uses makeClassInvoker for classes', () => {
      class Target {
        param: any
        constructor({ param }: any) {
          constructorSpy()
          this.param = param
        }

        method(ctx: any) {
          methodSpy()
          return this.param
        }
      }

      const invoker = makeInvoker(Target)
      const result = invoker('method')(ctx)

      expect(result).toEqual(42)
      expect(constructorSpy).toHaveBeenCalledTimes(1)
      expect(methodSpy).toHaveBeenCalledTimes(1)
    })

    it('uses makeFunctionInvoker for functions', () => {
      function target({ param }: any) {
        factorySpy()
        return {
          method() {
            methodSpy()
            return param
          },
        }
      }

      const invoker = makeInvoker(target)
      const result = invoker('method')(ctx)

      expect(result).toEqual(42)
      expect(factorySpy).toHaveBeenCalledTimes(1)
      expect(methodSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('throws when container is not on ctx.state', () => {
      class Target {
        method() {
          return 'should not reach here'
        }
      }

      const invoker = makeClassInvoker(Target)
      const ctxWithoutContainer = { state: {} }

      expect(() => invoker('method')(ctxWithoutContainer)).toThrow(
        'Awilix container not found on Koa state object',
      )
    })
  })

  describe('singleton support', () => {
    it('caches the resolved instance when lifetime is SINGLETON', () => {
      class Target {
        param: any
        constructor({ param }: any) {
          constructorSpy()
          this.param = param
        }

        method() {
          methodSpy()
          return this.param
        }
      }

      const invoker = makeClassInvoker(Target, { lifetime: 'SINGLETON' })

      // Call it multiple times
      invoker('method')(ctx)
      invoker('method')(ctx)
      const result = invoker('method')(ctx)

      expect(result).toEqual(42)
      // Constructor should only be called once due to singleton caching
      expect(constructorSpy).toHaveBeenCalledTimes(1)
      expect(methodSpy).toHaveBeenCalledTimes(3)
    })
  })
})
