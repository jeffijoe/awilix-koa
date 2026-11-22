// Why a whole test spawner? Node can strip types, but it can’t compile the
// legacy decorators in our fixtures. We run tsc first, then node --test.
// Watch mode does both again when a source or fixture file changes.

const { spawnSync } = require('node:child_process')
const { rmSync, watch } = require('node:fs')

const watching = process.argv.includes('--watch')

function node(args) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' })
  if (result.error) {
    throw result.error
  }
  return result.status ?? 1
}

function run() {
  rmSync('.test-out', { recursive: true, force: true })
  const status = node([
    require.resolve('typescript/bin/tsc'),
    '-p',
    'tsconfig.test.json',
  ])
  if (status !== 0) {
    return status
  }

  return node([
    '--enable-source-maps',
    '--test',
    '.test-out/src/__tests__/**/*.test.js',
  ])
}

if (watching) {
  let pending
  for (const directory of ['src', '__fixtures__']) {
    watch(directory, { recursive: true }, () => {
      clearTimeout(pending)
      pending = setTimeout(run, 100)
    })
  }
  run()
} else {
  process.exitCode = run()
}
