import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as awilixKoa from '../'

describe('awilix-koa', function () {
  it('exists', function () {
    assert.notStrictEqual(awilixKoa, undefined)
    assert.notStrictEqual(awilixKoa.scopePerRequest, undefined)
    assert.notStrictEqual(awilixKoa.makeInvoker, undefined)
    assert.notStrictEqual(awilixKoa.makeClassInvoker, undefined)
  })
})
