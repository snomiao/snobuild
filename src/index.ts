import esbuild, { BuildOptions, Format } from "esbuild";
import { readFile, stat, writeFile } from "fs/promises";
import sortPackageJson from "sort-package-json";
// import { exec } from "child_process";
import snorun from "snorun";
function matrixExpand<T extends Record<string, readonly any[]>>(matrix: T) {
  return Object.entries(matrix).reduce(
    (r, [k, a]) => r.flatMap((rv) => [...a.map((v) => ({ ...rv, [k]: v }))]),
    [{}] as {
      [k in keyof T]: T[k][number];
    }[]
  );
}

// const snorun = (cmd: string) => new Promise((r) => exec(cmd).on("exit", (code) => r(code == 0)));

export const depKeys = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "bundleDependencies",
] as const;
/**
 * Author: snomiao <snomiao@gmail.com>
 */
export default async function snobuild({
  outdir = "dist" as string,
  indir = "src" as string,
  // input = "src/index.ts" as string,
  init = undefined as boolean | undefined,
  bundle = true as boolean,
  bundleDependencies = false as boolean,
  bundleDevDependencies = true as boolean,
  bundleOptionalDependencies = false as boolean,
  bundlePeerDependencies = false as boolean,
  bundleBundleDependencies = true as boolean,
  bundleExcludes = "" as string,
  watch = undefined as boolean | undefined,
  node = undefined as boolean | undefined,
  browser = undefined as boolean | undefined,
  // output setting
  target = "ESNext" as string, // es2020 for node 14, and es6 for earler version
  verbose = undefined as boolean | undefined,
  //
  legalComments = undefined as esbuild.BuildOptions["legalComments"],
  _ = undefined as any,
  ..._esbuildOptions
} = {}) {
  const esbuildOptions = {} || (_esbuildOptions as esbuild.BuildOptions);
  delete esbuildOptions["bundle-dependencies"];
  delete esbuildOptions["bundle-dev-dependencies"];
  delete esbuildOptions["bundle-optional-dependencies"];
  delete esbuildOptions["bundle-peer-dependencies"];
  delete esbuildOptions["bundle-bundle-dependencies"];
  delete esbuildOptions["bundle-excludes"];
  delete esbuildOptions["$0"];
  // inputs
  const indexPath = `${indir}/index.ts`;
  const cliPath = `${indir}/cli.ts`;

  const pkgPath = "package.json";
  const tsconfigPath = "tsconfig.json";

  if (init) await snorun("npm init -y");
  const pkgExisted = Boolean(await stat(pkgPath).catch(() => null));
  if (!pkgExisted) throw new Error("package.json not existed");

  const indexEntry =
    Boolean(await stat(indexPath).catch(() => null)) && indexPath;
  const cliEntry = Boolean(await stat(cliPath).catch(() => null)) && cliPath;
  const tsconfigExisted =
    Boolean(await stat(tsconfigPath).catch(() => null)) && tsconfigPath;

  const pkgJSON = await readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(pkgJSON);
  if (cliEntry) pkg.bin ||= `${outdir}/cli.mjs`;
  if (cliEntry) pkg.keywords ||= [...new Set([...(pkg.keywords || []), "cli"])];
  // if(cjs) pkg.main ||= `${outdir}/index.cjs`;
  pkg.module ||= `${outdir}/index.mjs`;
  pkg.types ||= `${outdir}/index.d.ts`;
  pkg.type ||= `module`;
  pkg.exports ||= {};
  // if(cjs) pkg.exports.require ||= `./${outdir}/index.cjs`;
  pkg.exports.import ||= `./${outdir}/index.mjs`;
  pkg.files ||= [`${outdir}`];
  pkg.scripts ||= {};
  pkg.scripts.build ||= "snobuild";
  pkg.scripts.prepack ||= "npm run build";
  const pkgStr = JSON.stringify(pkg, null, 2);
  const sortedPkg = `${sortPackageJson(pkgStr)}`;
  await writeFile(pkgPath, `${sortedPkg}\n`);
  const external = [
    !bundleDependencies && Object.keys(pkg?.dependencies || {}),
    !bundleDevDependencies && Object.keys(pkg?.devDependencies || {}),
    !bundleOptionalDependencies && Object.keys(pkg?.optionalDependencies || {}),
    !bundlePeerDependencies && Object.keys(pkg?.peerDependencies || {}),
    !bundleBundleDependencies && Object.keys(pkg?.bundleDependencies || {}),
    bundleExcludes?.split?.(","),
  ].flatMap((es) => es || []);
  // if (verbose)
  //   console.log({
  //     bundleDependencies,
  //     bundleDevDependencies,
  //     bundleOptionalDependencies,
  //     bundlePeerDependencies,
  //     bundleBundleDependencies,
  //     bundleExcludes,
  //     external,
  //   });
  if (!node && !browser) node = true;
  const baseOpts: BuildOptions = {
    sourcemap: true,
    bundle,
    external,
    target,
    // platform: "node", // module resolve
    ...(node && {
      platform: "node",
      mainFields: ["module", "main", "browser"],
    }), // module resolve
    ...(browser && { platform: "browser" }),
    logLevel: "info",
    watch,
    incremental: watch,
    legalComments,
    ...esbuildOptions,
  };
  const matrix = {
    minify: [false, true],
    format: ["esm" /* "cjs" */] as const,
    entryName: [cliEntry && "cli", indexEntry && "index"].filter(Boolean),
  };
  const expanded = matrixExpand(matrix);
  const buildOpts = expanded.map(({ entryName, format, minify }) => {
    const ext = { esm: ".mjs", /* cjs: ".cjs", */ iife: ".user.cjs" }[format];
    return {
      ...baseOpts,
      format,
      minify,
      // external: minify ? externalMin : external,
      entryPoints: [`${indir}/${entryName}.ts`],
      outfile: `${outdir}/${entryName}${minify ? ".min" : ""}${ext}`,
      jsx: "automatic",
    } as BuildOptions;
  });
  const results = await Promise.all(
    [
      ...buildOpts.map((e) => esbuild.build(e)),
      indexEntry && pkg.types && declarationsBuild(),
    ].filter(Boolean) // promised obj remaind to await
  );

  console.log(results);
  if (!results.every((e) => Boolean(e))) process.exit(1);
  console.log("build ok");

  async function declarationsBuild() {
    const tscWatchFlag = watch && " --watch";
    const tscBuildOptions = (indexEntry: string) =>
      [
        "--esModuleInterop --allowSyntheticDefaultImports --downlevelIteration",
        "--resolveJsonModule",
        "-m ESNext",
        "-t ESNext",
        "--moduleResolution node",
        "--skipLibCheck",
        "--emitDeclarationOnly",
        "--declaration",
        "--declarationMap",
        `--outDir ${outdir}`,
        tscWatchFlag,
        indexEntry,
      ].filter(Boolean);
    return tsconfigExisted
      ? await snorun(["tsc", tscWatchFlag].join(" "))
      : indexEntry &&
          (await snorun(["tsc", ...tscBuildOptions(indexEntry)].join(" ")));
  }
}

export function Configs(...args: Parameters<typeof snobuild>) {
  return args;
}
