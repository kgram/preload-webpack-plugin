/**
 * @license
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const MemoryFileSystem = require('memory-fs')
const path = require('path')
const { JSDOM } = require('jsdom')

const OUTPUT_DIR = path.join(__dirname, 'dist')

function joinCompilationErrors (compilation) {
  return compilation.errors
    .map((error) => {
      if (typeof error === 'string') {
        return error
      } else if (error.message) {
        return error.message
      } else {
        return 'Unknown error: ' + error
      }
    })
    .join('\n=========\n')
}

module.exports = ({
  descriptionPrefix,
  webpack,
  HtmlWebpackPlugin,
  PreloadPlugin
}) => {
  describe(`${descriptionPrefix} When passed async chunks, it`, function () {
    it('should add preload tags', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].js',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(1)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })

    it('should add prefetch tags', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].js',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'prefetch',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(1)
        expect(links[0].getAttribute('rel')).toBe('prefetch')
        expect(links[0].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })

    it('should respect publicPath', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].js',
          publicPath: 'https://example.com/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(1)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('href')).toMatch(new RegExp('^https://example\\.com/chunk\\.'))

        done()
      })
    })
  })

  describe(`${descriptionPrefix} When passed non-async chunks, it`, function () {
    it('should add preload tags', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: path.join(__dirname, 'fixtures', 'file.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].js',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'preload',
            as: 'script',
            include: 'allChunks',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(2)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toBe('/bundle.js')
        expect(links[1].getAttribute('rel')).toBe('preload')
        expect(links[1].getAttribute('as')).toBe('script')
        expect(links[1].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })

    it('should set as="style" for CSS, and as="script" otherwise', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].css',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'preload',
            include: 'allChunks',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(2)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toBe('/bundle.js')
        expect(links[1].getAttribute('rel')).toBe('preload')
        expect(links[1].getAttribute('as')).toBe('style')
        expect(links[1].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })

    it('should use the value for the as attribute passed in the configuration', (done) => {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: path.join(__dirname, 'fixtures', 'file.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].css',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'preload',
            as: 'testing',
            include: 'allChunks',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(2)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('testing')
        expect(links[0].getAttribute('href')).toBe('/bundle.js')
        expect(links[1].getAttribute('rel')).toBe('preload')
        expect(links[1].getAttribute('as')).toBe('testing')
        expect(links[1].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })

    it('should set as="font" and crossOrigin for .woff2 assets', (done) => {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].woff2',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'preload',
            include: 'allChunks',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(2)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toBe('/bundle.js')
        expect(links[1].getAttribute('rel')).toBe('preload')
        expect(links[1].getAttribute('as')).toBe('font')
        expect(links[1].hasAttribute('crossorigin')).toBeTruthy()
        expect(links[1].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })

    it('should allow setting the as value via a callback', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: path.join(__dirname, 'fixtures', 'file.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].css',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'preload',
            as: (href) => href.startsWith('/chunk') ? 'test2' : 'test1',
            include: 'allChunks',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(2)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('test1')
        expect(links[0].getAttribute('href')).toBe('/bundle.js')
        expect(links[1].getAttribute('rel')).toBe('preload')
        expect(links[1].getAttribute('as')).toBe('test2')
        expect(links[1].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })
  })

  describe(`${descriptionPrefix} When passed normal chunks, it`, function () {
    it('should add prefetch links', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: path.join(__dirname, 'fixtures', 'file.js'),
        output: {
          path: OUTPUT_DIR
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'prefetch',
            include: 'allChunks',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(2)
        expect(links[0].getAttribute('rel')).toBe('prefetch')
        expect(links[0].hasAttribute('as')).toBeFalsy()
        expect(links[0].getAttribute('href')).toBe('home.js')
        expect(links[1].getAttribute('rel')).toBe('prefetch')
        expect(links[1].hasAttribute('as')).toBeFalsy()
        expect(links[1].getAttribute('href')).toBe('main.js')

        done()
      })
    })
  })

  describe(`${descriptionPrefix} When using 'include', it`, function () {
    it('should filter based on chunkname', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: path.join(__dirname, 'fixtures', 'file.js'),
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: '[name].[chunkhash].js',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'preload',
            as: 'script',
            include: ['home'],
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(1)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toMatch(new RegExp('^/home\\.'))

        done()
      })
    })

    it('should filter based on chunkname, including the sourcemap', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: path.join(__dirname, 'fixtures', 'file.js'),
        devtool: 'source-map',
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: '[name].js',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            rel: 'preload',
            as: 'script',
            include: ['home'],
            // Disable the default file blacklist.
            // This will cause the .map file to be included.
            fileBlacklist: [],
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(2)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toBe('/home.js')
        expect(links[1].getAttribute('rel')).toBe('preload')
        expect(links[1].getAttribute('as')).toBe('script')
        expect(links[1].getAttribute('href')).toBe('/home.js.map')

        done()
      })
    })

    // TODO: Is this testing the right thing? We might need a test around, e.g.,
    // using a different plugin that adds assets without also creating chunks.
    it(`should pull in additional assets when set to 'allAssets'`, function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        // Use "the" as the prefix for the entry names, to ensure that they're
        // sorted after either 0.js or home.js (depending on the webpack version).
        entry: {
          theFirstEntry: path.join(__dirname, 'fixtures', 'file.js'),
          theSecondEntry: path.join(__dirname, 'fixtures', 'vendor.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            include: 'allAssets',
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')

        expect(links.length).toBe(3)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toBe('home.js')
        expect(links[1].getAttribute('rel')).toBe('preload')
        expect(links[1].getAttribute('as')).toBe('script')
        // Lowercase, since rspack may lowercase the output. This doesn't matter, though.
        expect(links[1].getAttribute('href').toLowerCase()).toBe('thefirstentry.js')
        expect(links[2].getAttribute('rel')).toBe('preload')
        expect(links[2].getAttribute('as')).toBe('script')
        // Lowercase, since rspack may lowercase the output. This doesn't matter, though.
        expect(links[2].getAttribute('href').toLowerCase()).toBe('thesecondentry.js')

        done()
      })
    })

    it(`should honor fileWhitelist and fileBlacklist, with the blacklist taking precedence`, function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        // Use "the" as the prefix for the entry names, to ensure that they're
        // sorted after either 0.js or home.js (depending on the webpack version).
        entry: {
          theFirstEntry: path.join(__dirname, 'fixtures', 'file.js'),
          theSecondEntry: path.join(__dirname, 'fixtures', 'vendor.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            include: 'allAssets',
            fileWhitelist: [/Entry/],
            fileBlacklist: [/First/],
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')

        expect(links.length).toBe(1)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        // Lowercase, since rspack may lowercase the output. This doesn't matter, though.
        expect(links[0].getAttribute('href').toLowerCase()).toBe('thesecondentry.js')

        done()
      })
    })
  })

  describe(`${descriptionPrefix} When using an empty config, it`, function () {
    const fs = new MemoryFileSystem()
    it('should not preload .map files', function (done) {
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: 'chunk.[chunkhash].js',
          publicPath: '/'
        },
        devtool: 'cheap-source-map',
        plugins: [
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(1)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toMatch(new RegExp('^/chunk\\.'))

        done()
      })
    })
  })

  describe(`${descriptionPrefix} When excludeHtmlNames is used,`, function () {
    const fs = new MemoryFileSystem()
    it(`should not modify the HTML of an asset that's listed`, function (done) {
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: '[name].[chunkhash].js',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin({
            filename: 'ignored.html'
          }),
          new PreloadPlugin({
            excludeHtmlNames: ['ignored.html'],
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'ignored.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(0)

        done()
      })
    })

    it(`should not modify the HTML of an asset that's listed, but modify the HTML of the asset that isn't listed`, function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: {
          js: path.join(__dirname, 'fixtures', 'file.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: 'bundle.js',
          chunkFilename: '[name].[chunkhash].js',
          publicPath: '/'
        },
        plugins: [
          new HtmlWebpackPlugin({
            filename: 'ignored.html'
          }),
          new HtmlWebpackPlugin(),
          new PreloadPlugin({
            excludeHtmlNames: ['ignored.html'],
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const ignoredHtml = fs.readFileSync(path.join(OUTPUT_DIR, 'ignored.html'), 'utf-8')
        const ignoredDom = new JSDOM(ignoredHtml)

        const ignoredLinks = ignoredDom.window.document.head.querySelectorAll('link')
        expect(ignoredLinks.length).toBe(0)

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(1)
        expect(links[0].getAttribute('rel')).toBe('preload')
        expect(links[0].getAttribute('as')).toBe('script')
        expect(links[0].getAttribute('href')).toMatch(new RegExp('^/home\\.'))

        done()
      })
    })
  })

  describe(`${descriptionPrefix} When html-webpack-plugin filtering Chunks, it`, function () {
    it('should filter chunks', function (done) {
      const fs = new MemoryFileSystem()
      const compiler = webpack({
        entry: {
          theFirstEntry: path.join(__dirname, 'fixtures', 'file.js'),
          theSecondEntry: path.join(__dirname, 'fixtures', 'vendor.js')
        },
        output: {
          path: OUTPUT_DIR,
          filename: '[name].js'
        },
        plugins: [
          new HtmlWebpackPlugin({
            chunks: ['theSecondEntry']
          }),
          new PreloadPlugin({
            HtmlPlugin: HtmlWebpackPlugin
          })
        ]
      })

      compiler.outputFileSystem = fs

      compiler.run(function (err, result) {
        expect(err).toBeFalsy(err)
        expect(result.compilation.errors.length).toBe(0,
          joinCompilationErrors(result.compilation))

        const html = fs.readFileSync(path.join(OUTPUT_DIR, 'index.html'), 'utf-8')
        const dom = new JSDOM(html)

        const links = dom.window.document.head.querySelectorAll('link')
        expect(links.length).toBe(0)

        done()
      })
    })
  })
}
