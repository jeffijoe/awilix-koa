const { makeInvoker, makeClassInvoker } = require('../../lib/invokers')
const { createContainer } = require('awilix')

describe('invokers', function () {
  let container, methodSpy, factorySpy, constructorSpy, ctx
  beforeEach(function () {
    factorySpy = sinon.spy()
    constructorSpy = sinon.spy()
    methodSpy = sinon.spy()
    container = createContainer()
    container.registerValue('param', 42)
    ctx = {
      state: {
        container
      }
    }
  })

  describe('makeInvoker', function () {
    it('calls the function with the cradle, then the method with the context and additional params', function () {
      function target ({ param }) {
        factorySpy()
        return {
          method: (ctx) => {
            methodSpy()
            return [ctx, param]
          }
        }
      }

      const invoker = makeInvoker(target)

      // Call it twice.
      invoker('method')(ctx)
      const result = invoker('method')(ctx)

      expect(result).to.deep.equal([ctx, 42])
      expect(factorySpy).to.have.been.calledTwice
      expect(methodSpy).to.have.been.calledTwice
    })
  })

  describe('makeClassInvoker', function () {
    it('news up the class with the cradle, then calls the method with the context and additional params', function () {
      class Target {
        constructor ({ param }) {
          constructorSpy()
          this.param = param
        }

        method (ctx, additional) {
          methodSpy()
          return [ctx, this.param, additional]
        }
      }

      const invoker = makeClassInvoker(Target)

      // Call it twice.
      invoker('method')(ctx, 'hello')
      const result = invoker('method')(ctx, 'hello')

      expect(result).to.deep.equal([ctx, 42, 'hello'])
      expect(constructorSpy).to.have.been.calledTwice
      expect(methodSpy).to.have.been.calledTwice
    })
  })
})
