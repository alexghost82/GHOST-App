const fs = require('fs')
const path = require('path')

fs.copyFileSync(
  path.resolve(__dirname, '../src/preload.cjs'),
  path.resolve(__dirname, '../dist/preload.cjs'),
)
