//@ts-check

/// <reference types="node" />

import RollupPluginCommonjs from '@rollup/plugin-commonjs';
import RollupPluginNodeResolve from '@rollup/plugin-node-resolve';
import RollupPluginJson from '@rollup/plugin-json';
import RollupPluginTs from '@wessberg/rollup-plugin-ts';
import { builtinModules } from 'module';
import * as Path from 'path';
import * as Rollup from 'rollup';
import * as Package from './package.json';

const SPEC_RX = /^((@[^/]+\/[^/@]+|[^./@][^/@]*)(?:@([^/]+))?)(.*)?$/;

function parseBareModuleSpec(bareModuleSpec) {
  const matches = bareModuleSpec.match(SPEC_RX);

  if (matches) {
    const [, nameSpec, name, spec, path = ''] = matches;

    return {
      nameSpec,
      name,
      spec,
      path,
    };
  }

  return null;
}

function createIsExternal(packageJson) {
  const dependencies = new Set([...Object.keys(packageJson.dependencies || {}), ...builtinModules]);

  return function isExternal(id) {
    const spec = parseBareModuleSpec(id);

    if (!spec) return false;

    const result = dependencies.has(spec.name);

    return result;
  };
}

/** @type {Rollup.OutputOptions[]} */
const output = [];

if (Package.main) {
  output.push({
    exports: 'named',
    file: Path.resolve(process.cwd(), Package.main),
    format: 'commonjs',
    sourcemap: true,
  });
}

if (Package.module) {
  output.push({
    exports: 'named',
    file: Path.resolve(process.cwd(), Package.module),
    format: 'esm',
    sourcemap: true,
  });
}

/** @type {Rollup.RollupOptions} */
const config = {
  input: './src/index.ts',
  output,
  external: createIsExternal(Package),
  plugins: [
    RollupPluginJson(),
    RollupPluginCommonjs(),
    RollupPluginTs({
      exclude: ['node_modules'],
      transpiler: 'babel',
    }),
    RollupPluginNodeResolve({
      mainFields: ['module', 'main'],
    }),
  ],
};

export default config;
