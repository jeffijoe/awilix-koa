import { makeClassInvoker, makeFunctionInvoker } from '../invokers'
import { createContainer, AwilixContainer } from 'awilix'

describe('invokers', function() {
  let container: AwilixContainer
  let methodSpy: any
  let factorySpy: any
  let constructorSpy: any
  let ctx: any
  beforeEach(function() {
    factorySpy = jest.fn()
    constructorSpy = jest.fn()
    methodSpy = jest.fn()
    container = createContainer()
    container.registerValue('param', 42)
    ctx = {
      state: {
        container
      }
    }
  })

  describe('makeFunctionInvoker', function() {
    it('returns callable middleware', function() {
      function target({ param }: any) {
        factorySpy()
        const obj = {
          method(ctx: any) {
            methodSpy()
            expect(this).toBe(obj)
            return [ctx, param]
          }
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

  describe('makeClassInvoker', function() {
    it('returns callable middleware', function() {
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
})
