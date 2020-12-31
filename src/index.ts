///<reference types="node" />
import { OnResolveArgs, OnResolveResult, Plugin } from 'esbuild';
import { CdnStrategy } from '@velcro/strategy-cdn';
import { CompoundStrategy } from '@velcro/strategy-compound';
import { FsStrategy } from '@velcro/strategy-fs';
import { PackageMainField, Uri } from '@velcro/common';
import { Resolver } from '@velcro/resolver';
// import escape from 'escape-string-regexp';
import * as Fs from 'fs';
import * as Path from 'path';
import Module from 'module';
import Got from 'got';

const BARE_MODULE_RX = /^((@[^/]+\/[^/@]+|[^./@][^/@]*)(?:@([^/]+))?)(.*)?$/;
const DEFAULT_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];
const DEFAULT_MAIN_FIELDS: PackageMainField[] = ['module', 'main'];

export interface VelcroPluginOptions {
  /**
   * An array of fallback extensions that will be attempted when trying to resolve URIs
   * if the provided URI doesn't already resolve.
   */
  extensions?: string[];

  /**
   * An ordered list of `package.json` fields to consult when trying to find an npm
   * module's main entrypoint.
   */
  packageMain?: PackageMainField[];

  /**
   * Select a target environments. This will affect which 'bare modules' will be considered
   * 'built-in' vs those that must be shimmed / bundled.
   */
  target?: 'node';
}

export function createPlugin(options: VelcroPluginOptions = {}): Plugin {
  // If this plugin gets used in the context of a long-lived esbuild service,
  // this cache will prevent subsequent builds from needing ot make network
  // requests.
  const cache = new Map();

  // We use https://npm.im/got for the time being. In the future, we might
  // consider BYO `readUrlFn`.
  const readUrlFn = async (href: string): Promise<ArrayBuffer> => {
    return Got.get(href, {
      cache,
      followRedirect: true,
      responseType: 'buffer',
    }).then((res) => res.body);
  };
  const fsStrategy = new FsStrategy({
    // The FsStrategy can work with non-native 'fs'-compatible libraries and doesn't
    // assume the presence of the node 'fs' library. As a result, a library must be
    // passed in.
    fs: Fs,
    // We'll treat the root of the FsStrategy as the (changed) working directory.
    // The FsStrategy will refuse to read anything 'above' the rootUri, effectively
    // sandboxing the fs to the given rootUri and below.
    rootUri: Uri.file(process.cwd()),
  });

  // We will set up a strategy whose sole purpose is to resolve npm modules and
  // their files and dependencies.
  const cdnStrategy = CdnStrategy.forJsDelivr(readUrlFn);

  // The compound strategy used here creates a union of the file-system-based
  // FsStrategy and the http-based CdnStrategy. Calls are delegated to the
  // child strategies based on the requested uri and the strategies' .rootUri
  // properties.
  const compoundStrategy = new CompoundStrategy({
    strategies: [fsStrategy, cdnStrategy],
  });
  const resolver = new Resolver(compoundStrategy, {
    extensions: options.extensions || DEFAULT_EXTENSIONS,
    packageMain: options.packageMain || DEFAULT_MAIN_FIELDS,
  });

  const builtinModulesSet = new Set(Module.builtinModules);

  async function onResolve({ importer, path }: OnResolveArgs): Promise<OnResolveResult> {
    // A `data:` URI typically already contains whatever is needed so we
    // treat it as an 'external' to leave it as-is.
    if (path.startsWith('data:')) {
      return {
        external: true,
      };
    }

    if (options.target === 'node' && builtinModulesSet.has(path)) {
      return {
        external: true,
      };
    }

    const resolveResult = importer
      ? await resolver.resolve(path, Uri.parse(importer))
      : await resolver.resolve(Uri.file(Path.resolve(process.cwd(), path)));

    if (!resolveResult.found || !resolveResult.uri) {
      throw new Error(`Unable to resolve ${path} from ${importer}`);
    }

    return {
      namespace,
      path: resolveResult.uri.toString(),
    };
  }

  return {
    name,
    setup(build) {
      // Hook into bare modules matching our gnarly regex up top
      build.onResolve({ filter: BARE_MODULE_RX }, onResolve);

      // Hook into any resolve calls from things already marked as part of the
      // 'velcro' namespace.
      build.onResolve({ filter: /.*/, namespace }, onResolve);

      // Note that we're restricting `onLoad` hooks to the 'velcro' namespace.
      build.onLoad({ filter: /.*/, namespace }, async ({ path }) => {
        const readResult = await resolver.readFileContent(Uri.parse(path));

        return {
          contents: Buffer.from(readResult.content),
          loader: 'default',
        };
      });
    },
  };
}

export const name = 'velcro';
export const namespace = 'velcro';
