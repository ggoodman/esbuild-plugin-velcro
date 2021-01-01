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
import { createPlugin } from 'esbuild-plugin-velcro';

(async () => {
  const result = await build({
    bundle: true,
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
    entryPoints: ['.'],
    plugins: [createPlugin({ target: 'node' })],
  });
})();
```

## Usage

### `createPlugin(options)`

Returns an instance of this plugin where options is an optional object having:

- `.extensions` is an optional array of extensions to support resolving files without explicit extensions.
- `.packageMain` is an optional array of supported 'main' fields. Options:
  - `browser` - Note that the `browser` field's extended resolution and overrides semantics are supported
  - `module`
  - `jsnext:main`
  - `main`
  - `unpkg`
- `.target` is an optional value describing the target runtime environment for the build. Options:
  - `node` - When this is specified, Node's built-in modules will be treated as `esbuild` externals, and therefore not bundled.

## License

[MIT](./LICENSE)
