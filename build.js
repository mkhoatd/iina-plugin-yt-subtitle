await Bun.build({
    entrypoints: ['./src/index.ts', './src/global.ts'],
    outdir: './dist',
    target: 'browser', // default
    sourcemap: 'external',
    minify: true
})
