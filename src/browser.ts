///<reference lib="dom" />
import { createPlugin, VelcroPluginOptions } from './plugin';

export interface VelcroBrowserPluginOptions extends Omit<VelcroPluginOptions, 'readUrlFn'> {

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

export function createBrowserPlugin(options: VelcroBrowserPluginOptions) {
  return createPlugin({
    ...options,
    readUrlFn:
      options.readUrlFn ??
      // In the browser, we can delegate this work to fetch. Browsers that don't
      // support fetch will have to have polyfills supplied
      async function (href: string): Promise<ArrayBuffer> {
        return fetch(href).then(res => res.arrayBuffer());
      },
  });
}
