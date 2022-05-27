# Changelog

# 7.0.1

* Fix `perDependencies` for `awilix`
* Update packages

# 7.0.0

* Update to Awilix v7

# 6.0.0

* Update to Awilix v6

### BREAKING CHANGES

* Minimum supported Awilix version is v6.

# 5.0.1

* Fix `peerDependencies` for `awilix`, it now requires `^5.0.0`
* Updated packages

# 5.0.0

### BREAKING CHANGES

* Minimum supported Node version is now 12.

# 4.0.0

* use [@koa](https://github.com/koa)/router, update packages ([40d8782](https://github.com/jeffijoe/awilix-koa/commit/40d8782))

### BREAKING CHANGES

* Switched to the official Koa Router fork. It shouldn't really be a breaking change, but you never know.

# 3.1.1

- Update `awilix-router-core` to v1.6.1

# 3.1.0

- Update `awilix-router-core` to v1.5.0

# 3.0.1

- Update packages
- Add a `methodToInvoke` assertion in `makeInvoker`

# 3.0.0

- Update `peerDependencies` to `awilix@4.0.0`

# 2.1.1

- Optimize use of `makeInvoker` in `controller`.
- Use TypeScript 2.7's `esModuleInterop` flag.

# 2.1.0

- Add `inject` middleware factory.

# 2.0.0

- Support Awilix v3.

## 1.0.0

- Rewritten in TypeScript.
- Added `awilix-router-core` binding for `koa-router`.

## 0.1.1

- Updated packages.

## 0.1.0

- Initial release.
