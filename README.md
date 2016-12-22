# awilix-koa

[![npm version](https://badge.fury.io/js/YOUR-NPM-MODULE.svg)](https://badge.fury.io/js/awilix-koa)
[![Dependency Status](https://david-dm.org/jeffijoe/awilix-koa.svg)](https://david-dm.org/jeffijoe/awilix-koa)
[![devDependency Status](https://david-dm.org/jeffijoe/awilix-koa/dev-status.svg)](https://david-dm.org/jeffijoe/awilix-koa#info=devDependencies)
[![Build Status](https://travis-ci.org/jeffijoe/awilix-koa.svg?branch=master)](https://travis-ci.org/jeffijoe/awilix-koa)
[![Coverage Status](https://coveralls.io/repos/github/jeffijoe/awilix-koa/badge.svg?branch=master)](https://coveralls.io/github/jeffijoe/awilix-koa?branch=master)
[![Code Climate](https://codeclimate.com/github/jeffijoe/awilix-koa/badges/gpa.svg)](https://codeclimate.com/github/jeffijoe/awilix-koa)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Awilix 2 helpers and scope-instantiating middleware for **Koa 2**. :rocket:

# Installation

```
npm install --save awilix-koa
```

_Requires Node v6 or above_

# Usage

Add the middleware to your Koa app.

```js
const { createContainer } = require('awilix')
const { scopePerRequest } = require('awilix-koa')

const container = createContainer()
container.registerClass({
  // Scoped lifetime = new instance per request
  // Imagine the TodosService needs a `user`.
  // class TodosService { constructor({ user }) { } }
  todosService: [TodosService, Lifetime.SCOPED]
})

// Add the middleware, passing it your Awilix container.
// This will attach a scoped container on the context.
app.use(scopePerRequest(container))

// Now you can add request-specific data to the scope.
app.use((ctx, next) => {
  ctx.state.container.registerValue({
    user: ctx.state.user // from some authentication middleware..
  })
  return next()
})
```

Then in your route handlers...

```js
// There's a makeClassInvoker for classes..
const { makeInvoker } = require('awilix-koa')

function makeAPI ({ todosService }) {
  return {
    find: (ctx) => {
      return todosService.find().then(result => {
        ctx.body = result
      })
    }
  }
}

const api = makeInvoker(makeAPI)

// Creates middleware that will invoke `makeAPI`
// for each request, giving you a scoped instance.
router.get('/todos', api('find'))
```

# Why do I need it?

You can certainly use Awilix with Koa without this library, but follow along and you might see why it's useful.

Imagine this simple imaginary Todos app, written in ES6:

```js
// A totally framework-independent piece of application code.
// Nothing here is remotely associated with HTTP, Koa or anything.
class TodosService {
  constructor({ currentUser, db }) {
    // We depend on the current user!
    this.currentUser = currentUser
    this.db = db
  }

  getTodos() {
    // use your imagination ;)
    return this.db('todos').where('user', this.currentUser.id)
  }
}

// Here's a Koa API that calls the service
class TodoAPI {
  constructor({ todosService }) {
    this.todosService = todosService
  }
  getTodos(ctx) {
    return this.todosService.getTodos().then(todos => ctx.ok(todos))
  }
}
```

So the problem with the above is that the `TodosService` needs a `currentUser` for it to function. Let's first try solving this manually, and then with `awilix-koa`.

## Manual

This is how you would have to do it without Awilix at all.

```js
import db from './db'

router.get('/todos', (ctx) => {
  // We need a new instance for each request,
  // else the currentUser trick wont work.
  const api = new TodoAPI({
    todosService: new TodosService({
      db,
      // current user is request specific.
      currentUser: ctx.state.user
    })
  })

  // invoke the method.
  return api.getTodos(ctx)
})
```

Let's do this with Awilix instead. We'll need a bit of setup code.

```js
import { createContainer, Lifetime } from 'awilix'

const container = createContainer()

// The `TodosService` lives in services/TodosService
container.loadModules(['services/*.js'], {
  // we want `TodosService` to be registered as `todosService`.
  formatName: 'camelCase',
  registrationOptions: {
    // We want instances to be scoped to the Koa request.
    // We need to set that up.
    lifetime: Lifetime.SCOPED
  }
})

// imagination is a wonderful thing.
app.use(someAuthenticationMethod())

// We need a middleware to create a scope per request.
// Hint: that's the scopePerRequest middleware in `awilix-koa` ;)
app.use((ctx, next) => {
  // We want a new scope for each request!
  ctx.state.container = container.createScope()
  // The `TodosService` needs `currentUser`
  ctx.state.container.registerValue({
    currentUser: ctx.state.user // from auth middleware.. IMAGINATION!! :D
  })
  return next()
})
```

Okay! Let's try setting up that API again!

```js
export default function (router) {
  router.get('/todos', (ctx) => {
    // We have our scope available!
    const api = new TodoAPI(ctx.state.container.cradle) // Awilix magic!
    return api.getTodos(ctx)
  })
}
```

A lot cleaner, but we can make this even shorter!

```js
export default function (router) {
  // Just invoke `api` with the method name and
  // you've got yourself a middleware that instantiates
  // the API and calls the method.
  const api = (methodName) => {
    // create our handler
    return function (ctx) {
      const controller = new TodoAPI(ctx.state.container.cradle)
      return controller[method](ctx)
    }
  }

  // adding more routes is way easier!
  router.get('/todos', api('getTodos'))
}
```

## Using `awilix-koa`

In our route handler, do the following:

```js
import { makeClassInvoker } from 'awilix-koa'

export default function (router) {
  const api = makeClassInvoker(TodoAPI)
  router.get('/todos', api('getTodos'))
}
```

And in your Koa application setup:

```js
import { createContainer, Lifetime } from 'awilix'
import { scopePerRequest } from 'awilix-koa'

const container = createContainer()

// The `TodosService` lives in services/TodosService
container.loadModules([
  ['services/*.js', Lifetime.SCOPED] // shortcut to make all services scoped
], {
  // we want `TodosService` to be registered as `todosService`.
  formatName: 'camelCase'
})

// imagination is a wonderful thing.
app.use(someAuthenticationMethod())

// Woah!
app.use(scopePerRequest(container))
app.use((ctx, next) => {
  // We still want to register the user!
  // ctx.state.container is a scope!
  ctx.state.container.registerValue({
    currentUser: ctx.state.user // from auth middleware.. IMAGINATION!! :D
  })
})
```

Now **that** is way simpler! If you are more of a factory-function aficionado like myself, you can use `makeInvoker` in place of `makeClassInvoker`:

```js
import { makeInvoker } from 'awilix-koa'

function makeTodoAPI ({ todosService }) {
  return {
    getTodos: (ctx) => {
      return todosService.getTodos().then(todos => ctx.ok(todos))
    }
  }
}

export default function (router) {
  const api = makeInvoker(makeTodoAPI)
  router.get('/api/todos', api('getTodos'))
}
```

That concludes the tutorial! Hope you find it useful, I know I have.

# Contributing

## `npm run` scripts

* `npm run test`: Runs tests once
* `npm run test-watch`: Runs tests in watch-mode
* `npm run lint`: Lints the code once
* `npm run lint-watch`: Lints the code in watch-mode
* `npm run cover`: Runs code coverage using `istanbul`
* `npm run coveralls`: Used by coveralls

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/Jeffijoe)
