///<reference types="node" />

import * as Fs from 'fs';
import Got from 'got';
import Module from 'module';
import { createPlugin, VelcroPluginOptions } from './plugin';

export interface VelcroNodePluginOptions extends Omit<VelcroPluginOptions, 'fs' | 'readUrlFn'> {
  /**
   * A filesystem-like object that implements a subset of the Node.js 'fs' package's
   * interface.
   */
  fs?: VelcroPluginOptions['fs'];

  /**
   * A function that, given a url, will return a Promise that resolves to the contents
   * of the file at that location as an `ArrayBuffer`.
   *
   * In a Node.js environment, you might supply something based on the `http`, `https` or
   * `http2` standard libraries. In a browser environment, you might supply something
   * based on `fetch`.
   */
  readUrlFn?: VelcroPluginOptions['readUrlFn'];
}

export function createNodePlugin(options: VelcroNodePluginOptions = {}) {
  // If this plugin gets used in the context of a long-lived esbuild service,
  // this cache will prevent subsequent builds from needing ot make network
  // requests.
  const cache = new Map();

  return createPlugin({
    ...options,
    external: [...(options.external ?? []), ...Module.builtinModules],
    fs: options.fs ?? Fs,
    readUrlFn:
      options.readUrlFn ??
      // We use https://npm.im/got for the time being as a high-quality client with
      // built-in caching.
      async function (href: string): Promise<ArrayBuffer> {
        return Got.get(href, {
          cache,
          followRedirect: true,
          responseType: 'buffer',
        }).then((res) => res.body);
      },
  });
}
