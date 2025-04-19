await Bun.build({
    entrypoints: ['./src/index.ts', './src/global.ts'],
    outdir: './iina-plugin-yt-subtitle/dist',
    target: 'browser', // default
    sourcemap: 'external',
    minify: true
})
