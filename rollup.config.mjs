import typescript from '@rollup/plugin-typescript'
import { readFileSync } from 'fs'

const tsconfig = JSON.parse(readFileSync('./tsconfig.json', 'utf8'))

const tsOpts = {
  compilerOptions: {
    ...tsconfig.compilerOptions,
    module: 'ESNext',
    target: 'ES2021',
    declaration: false,
  },
  exclude: ['**/__tests__/**'],
}

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'lib/index.mjs',
      format: 'es',
      sourcemap: true,
    },
    external: [
      'awilix-router-core',
      '@koa/router',
      'koa-compose',
      'awilix',
      'awilix/lib/utils',
      'assert',
    ],
    plugins: [typescript(tsOpts)],
    treeshake: { moduleSideEffects: 'no-external' },
  },
]
