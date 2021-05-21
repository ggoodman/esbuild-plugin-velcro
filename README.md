# ESBuild Velcro Plugin

This esbuild plugin uses Velcro to build projects without having to npm install dependencies.

This Plugin wires up [Velcro](https://github.com/ggoodman/velcro) with [esbuild](https://github.com/evanw/esbuild) so that bare module

## Example

Given a project with the following file structure:

**package.json**:

```json
{
  "dependencies": {
    "react": "~17.0.1",
    "react-dom": "~17.0.1"
  }
}
```

**index.jsx**:

```jsx
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';

const Hello = () => <h1>Hello world</h1>;

export function render() {
  return ReactDOMServer.renderToString(<Hello />);
}
```

Configure esbuild to build this project without ever having to `npm install` `react` or `react-dom`...

**build.js**:

```js
import { build } from 'esbuild';
import { createNodePlugin } from 'esbuild-plugin-velcro';

(async () => {
  const result = await build({
    bundle: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
    entryPoints: ['.'],
    plugins: [createNodePlugin()],
  });
})();
```

## Usage

### `createPlugin(options)`

Returns an instance of this plugin where options is an optional object having:

- `.cwd` is the directory in the supplied `fs` that should be considered the base, or 'current' directory.
- `.extensions` is an optional array of extensions to support resolving files without explicit extensions.
- `.fs` is an object that implements a minimal subset of the [fs](https://nodejs.org/api/fs.html) interface.
- `.readUrlFn` is a function that will returna `Promise` for an `ArrayBuffer` given a string `url`.
- `.packageMain` is an optional array of supported 'main' fields. Options:
  - `browser` - Note that the `browser` field's extended resolution and overrides semantics are supported
  - `module`
  - `jsnext:main`
  - `main`
  - `unpkg`

### `createBrowserPlugin(options)`

Returns an instance of this plugin where options is an optional object having:

- `.cwd` is the directory in the supplied `fs` that should be considered the base, or 'current' directory.
- `.extensions` is an optional array of extensions to support resolving files without explicit extensions.
- `.fs` is an object that implements a minimal subset of the [fs](https://nodejs.org/api/fs.html) interface.
- `.readUrlFn` is an optional function that will returna `Promise` for an `ArrayBuffer` given a string `url`. When not supplied, we'll fall back to using `fetch`.
- `.packageMain` is an optional array of supported 'main' fields. Options:
  - `browser` - Note that the `browser` field's extended resolution and overrides semantics are supported
  - `module`
  - `jsnext:main`
  - `main`
  - `unpkg`

### `createNodePlugin(options)`

Returns an instance of this plugin where options is an optional object having:

- `.cwd` is the directory in the supplied `fs` that should be considered the base, or 'current' directory.
- `.extensions` is an optional array of extensions to support resolving files without explicit extensions.
- `.fs` is an optional object that implements a minimal subset of the [fs](https://nodejs.org/api/fs.html) interface. When not supplied, we'll fall back to using the real `fs` instance.
- `.readUrlFn` is an optional function that will returna `Promise` for an `ArrayBuffer` given a string `url`. When not supplied, we'll fall back to using [got](https://npm.im/got).
- `.packageMain` is an optional array of supported 'main' fields. Options:
  - `browser` - Note that the `browser` field's extended resolution and overrides semantics are supported
  - `module`
  - `jsnext:main`
  - `main`
  - `unpkg`

## License

[MIT](./LICENSE)
