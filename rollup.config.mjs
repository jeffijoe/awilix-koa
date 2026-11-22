import typescript from '@rollup/plugin-typescript'

const tsOpts = {
  tsconfig: './tsconfig.build.json',
  compilerOptions: {
    module: 'ESNext',
    moduleResolution: 'bundler',
    target: 'ES2021',
    declaration: false,
    outDir: undefined,
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
      'assert',
    ],
    plugins: [typescript(tsOpts)],
    treeshake: { moduleSideEffects: 'no-external' },
  },
]
