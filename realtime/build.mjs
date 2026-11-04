// Bundles the real-time server into realtime/dist/server.mjs. Only our own
// code is bundled (with the "@/..." paths from tsconfig); packages load from
// node_modules at run time.

import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

await build({
  entryPoints: [here("./server.ts")],
  outfile: here("./dist/server.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  packages: "external",
  jsx: "automatic",
  sourcemap: true,
  logLevel: "info",
  plugins: [
    {
      name: "realtime-overrides",
      setup(b) {
        // The server's own, smaller environment (see realtime/env.ts).
        b.onResolve({ filter: /^@\/lib\/env$/ }, () => ({ path: here("./env.ts") }));
        // A Next.js guard that has no meaning outside Next.
        b.onResolve({ filter: /^server-only$/ }, () => ({ path: "server-only", namespace: "empty" }));
        b.onLoad({ filter: /.*/, namespace: "empty" }, () => ({ contents: "", loader: "js" }));
      },
    },
  ],
});
