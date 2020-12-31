/// <reference types="jest" />

import { build } from 'esbuild';
import { createPlugin } from '../src';

describe('basic example', () => {
  let cwd = process.cwd();

  beforeAll(() => {
    process.chdir(`${__dirname}/examples/basic`);
  });

  afterAll(() => {
    process.chdir(cwd);
  });

  it('will bundle a hello world react app and produce code able to render the component as a string', async () => {
    // Note that before this test, we've changed working directories into `./test/examples/basic`. As a result
    // paths below are relative to that context.
    const result = await build({
      bundle: true,
      define: {
        // We want to avoid both the dev and prod branches of react from resolving
        // and thus appearing in the bundle. This allows esbuild to prune the
        // losing branch.
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
      entryPoints: ['.'],
      // We need to produce CommonJS for our wrapper harness below
      format: 'cjs',
      plugins: [
        createPlugin({
          target: 'node',
        }),
      ],
      // sourcemap: 'inline',
      // sourcesContent: true,
      target: process.version.replace(/^v/, 'node'),
      // We don't want this test to make any changes to the FS.
      write: false,
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.outputFiles).toHaveLength(1);

    // Simulate loading the generated bundle using Node's require
    const { text } = result.outputFiles[0];

    const fn = new Function('module', 'exports', 'require', text);
    const mod = { exports: {} as any };

    // Run the module-level code, injecting our fake CJS shims
    fn(mod, mod.exports, require);

    // Test that the bundled code behaves as expected
    expect(typeof mod.exports.render).toBe('function');
    expect(mod.exports.render()).toMatchInlineSnapshot(
      `"<h1 data-reactroot=\\"\\">Hello world</h1>"`
    );
  });
});

describe('basic example', () => {
  let cwd = process.cwd();

  beforeAll(() => {
    process.chdir(`${__dirname}/examples/relative`);
  });

  afterAll(() => {
    process.chdir(cwd);
  });

  it('will bundle a hello world react app with multiple files and produce code able to render the component as a string', async () => {
    // Note that before this test, we've changed working directories into `./test/examples/basic`. As a result
    // paths below are relative to that context.
    const result = await build({
      bundle: true,
      define: {
        // We want to avoid both the dev and prod branches of react from resolving
        // and thus appearing in the bundle. This allows esbuild to prune the
        // losing branch.
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
      entryPoints: ['.'],
      // We need to produce CommonJS for our wrapper harness below
      format: 'cjs',
      plugins: [
        createPlugin({
          target: 'node',
        }),
      ],
      // sourcemap: 'inline',
      // sourcesContent: true,
      target: process.version.replace(/^v/, 'node'),
      // We don't want this test to make any changes to the FS.
      write: false,
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.outputFiles).toHaveLength(1);

    // Simulate loading the generated bundle using Node's require
    const { text } = result.outputFiles[0];

    const fn = new Function('module', 'exports', 'require', text);
    const mod = { exports: {} as any };

    // Run the module-level code, injecting our fake CJS shims
    fn(mod, mod.exports, require);

    // Test that the bundled code behaves as expected
    expect(typeof mod.exports.render).toBe('function');
    expect(mod.exports.render()).toMatchInlineSnapshot(
      `"<h1 data-reactroot=\\"\\">Hello world</h1>"`
    );
  });
});
