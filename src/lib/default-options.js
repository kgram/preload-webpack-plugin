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
let HtmlWebpackPlugin
try {
  // eslint-disable-next-line global-require
  HtmlWebpackPlugin = require('html-webpack-plugin')
} catch (error) {
  // Ignore error, assume this is because a different HtmlPlugin, such as rspack's builtin, will be used
}

const defaultOptions = {
  rel: 'preload',
  include: 'asyncChunks',
  excludeHtmlNames: [],
  fileBlacklist: [/\.map/],
  HtmlPlugin: HtmlWebpackPlugin
}

module.exports = defaultOptions
