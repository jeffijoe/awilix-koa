# awilix-koa

[![npm version](https://badge.fury.io/js/awilix-koa.svg)](https://badge.fury.io/js/awilix-koa)
[![Dependency Status](https://david-dm.org/jeffijoe/awilix-koa.svg)](https://david-dm.org/jeffijoe/awilix-koa)
[![devDependency Status](https://david-dm.org/jeffijoe/awilix-koa/dev-status.svg)](https://david-dm.org/jeffijoe/awilix-koa#info=devDependencies)
[![Build Status](https://travis-ci.org/jeffijoe/awilix-koa.svg?branch=master)](https://travis-ci.org/jeffijoe/awilix-koa)
[![Coverage Status](https://coveralls.io/repos/github/jeffijoe/awilix-koa/badge.svg?branch=master)](https://coveralls.io/github/jeffijoe/awilix-koa?branch=master)
![Typings Included](https://img.shields.io/badge/typings-included-brightgreen.svg)

Awilix helpers, router and scope-instantiating middleware for **Koa**. 🐨

# Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Awesome Usage](#awesome-usage)
- [Why do I need it?](#why-do-i-need-it)
  - [Manual](#manual)
  - [Using awilix-koa](#using-awilix-koa)
- [API](#api)
- [Contributing](#contributing)
  - [npm run scripts](#npm-run-scripts)
- [Author](#author)

# Installation

```
npm install --save awilix-koa
```

_Requires Node v6 or above_

# Basic Usage

Add the middleware to your Koa app.

```js
const { asClass, asValue, createContainer } = require('awilix')
const { scopePerRequest } = require('awilix-koa')

const container = createContainer()
container.register({
  // Scoped lifetime = new instance per request
  // Imagine the TodosService needs a `user`.
  // class TodosService { constructor({ user }) { } }
  todosService: asClass(TodosService).scoped()
})

// Add the middleware, passing it your Awilix container.
// This will attach a scoped container on the context.
app.use(scopePerRequest(container))

// Now you can add request-specific data to the scope.
app.use((ctx, next) => {
  ctx.state.container.register({
    user: asValue(ctx.state.user) // from some authentication middleware..
  })
  return next()
})
```

Then in your route handlers...

```js
const { makeInvoker } = require('awilix-koa')

function makeAPI({ todosService }) {
  return {
    find: ctx => {
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

# Awesome Usage

**As of `awilix-koa@1.0.0`**, we ship with `koa-router` bindings for [`awilix-router-core`][awilix-router-core]!
This is cool because now your routing setup can be streamlined with first-class Awilix support!

The Awilix-based router comes in 2 flavors: **a builder** and **ESNext decorators**.

**`routes/todos-api.js`** - demos the builder pattern

```js
import bodyParser from 'koa-bodyparser'
import { authenticate } from './your-auth-middleware'
import { createController } from 'awilix-koa' // or `awilix-router-core`

const API = ({ todoService }) => ({
  getTodo: async ctx => (ctx.body = await todoService.get(ctx.params.id)),
  createTodo: async ctx =>
    (ctx.body = await todoService.create(ctx.request.body))
})

export default createController(API)
  .prefix('/todos') // Prefix all endpoints with `/todo`
  .before([authenticate()]) // run authentication for all endpoints
  .get('/:id', 'getTodo') // Maps `GET /todos/:id` to the `getTodo` function on the returned object from `API`
  .post('', 'createTodo', {
    // Maps `POST /todos` to the `createTodo` function on the returned object from `API`
    before: [bodyParser()] // Runs the bodyParser just for this endpoint
  })
```

**`routes/users-api.js`** - demos the decorator pattern

```js
import bodyParser from 'koa-bodyparser'
import { authenticate } from './your-auth-middleware'
import { route, GET, POST, before } from 'awilix-koa' // or `awilix-router-core`

@route('/users')
export default class UserAPI {
  constructor({ userService }) {
    this.userService = userService
  }

  @route('/:id')
  @GET()
  @before([authenticate()])
  async getUser(ctx) {
    ctx.body = await this.userService.get(ctx.params.id)
  }

  @POST()
  @before([bodyParser()])
  async createUser(ctx) {
    ctx.body = await this.userService.create(ctx.request.body)
  }
}
```

**`server.js`**

```js
import Koa from 'koa'
import { asClass, createContainer } from 'awilix'
import { loadControllers, scopePerRequest } from 'awilix-koa'

const app = new Koa()
const container = createContainer().register({
  userService: asClass(/*...*/),
  todoService: asClass(/*...*/)
})
app.use(scopePerRequest(container))
// Loads all controllers in the `routes` folder
// relative to the current working directory.
// This is a glob pattern.
app.use(loadControllers('routes/*.js', { cwd: __dirname }))

app.listen(3000)
```

Please see the [`awilix-router-core`][awilix-router-core] docs for information about the full API.

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

router.get('/todos', ctx => {
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
import { asValue, createContainer, Lifetime } from 'awilix'

const container = createContainer()

// The `TodosService` lives in services/TodosService
container.loadModules(['services/*.js'], {
  // we want `TodosService` to be registered as `todosService`.
  formatName: 'camelCase',
  resolverOptions: {
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
  ctx.state.container.register({
    currentUser: asValue(ctx.state.user) // from auth middleware.. IMAGINATION!! :D
  })
  return next()
})
```

Okay! Let's try setting up that API again!

```js
export default function(router) {
  router.get('/todos', ctx => {
    // We have our scope available!
    const api = new TodoAPI(ctx.state.container.cradle) // Awilix magic!
    return api.getTodos(ctx)
  })
}
```

A lot cleaner, but we can make this even shorter!

```js
export default function(router) {
  // Just invoke `api` with the method name and
  // you've got yourself a middleware that instantiates
  // the API and calls the method.
  const api = methodName => {
    // create our handler
    return function(ctx) {
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
import { makeInvoker } from 'awilix-koa'

export default function(router) {
  const api = makeInvoker(TodoAPI)
  router.get('/todos', api('getTodos'))
}
```

And in your Koa application setup:

```js
import { asValue, createContainer, Lifetime } from 'awilix'
import { scopePerRequest } from 'awilix-koa'

const container = createContainer()

// The `TodosService` lives in services/TodosService
container.loadModules(
  [
    ['services/*.js', Lifetime.SCOPED] // shortcut to make all services scoped
  ],
  {
    // we want `TodosService` to be registered as `todosService`.
    formatName: 'camelCase'
  }
)

// imagination is a wonderful thing.
app.use(someAuthenticationMethod())

// Woah!
app.use(scopePerRequest(container))
app.use((ctx, next) => {
  // We still want to register the user!
  // ctx.state.container is a scope!
  ctx.state.container.register({
    currentUser: asValue(ctx.state.user) // from auth middleware.. IMAGINATION!! :D
  })
})
```

Now **that** is way simpler!

```js
import { makeInvoker } from 'awilix-koa'

function makeTodoAPI({ todosService }) {
  return {
    getTodos: ctx => {
      return todosService.getTodos().then(todos => ctx.ok(todos))
    }
  }
}

export default function(router) {
  const api = makeInvoker(makeTodoAPI)
  router.get('/api/todos', api('getTodos'))
}
```

That concludes the tutorial! Hope you find it useful, I know I have.

# API

The package exports everything from `awilix-router-core` as well as the following **Koa middleware factories**:

- `scopePerRequest(container)`: creates a scope per request.
- `controller(decoratedClassOrController)`: registers routes and delegates to Koa Router.
- `loadControllers(pattern, opts)`: loads files matching a glob pattern and registers their exports as controllers.
- `makeInvoker(functionOrClass, opts)(methodName)`: using `isClass`, calls either `makeFunctionInvoker` or `makeClassInvoker`.
- `makeClassInvoker(Class, opts)(methodName)`: resolves & calls `methodName` on the resolved instance, passing it `ctx` and `next`.
- `makeFunctionInvoker(function, opts)(methodName)`: resolves & calls `methodName` on the resolved instance, passing it `ctx` and `next`.
- `makeResolverInvoker(resolver, opts)`: used by the other invokers, exported for convenience.
- `inject(middlewareFactory)`: resolves the middleware per request.
  ```js
  app.use(
    inject(({ userService }) => (ctx, next) => {
      /**/
    })
  )
  ```

# Contributing

## `npm run` scripts

- `npm run test`: Runs tests once
- `npm run lint`: Lints + formats the code once
- `npm run cover`: Runs code coverage using `istanbul`

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/Jeffijoe)

[awilix-router-core]: https://github.com/jeffijoe/awilix-router-core
