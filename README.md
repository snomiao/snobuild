# snobuild (WIP)

Pre-configured esbuild cli wrapper

## Usage

### Installation

```
npm i -D snobuild
pnpm i -D snobuild
```

```shell
> snobuild -h

snobuild

build respect to package.json

Commands:
  snobuild             build respect to package.json                   [default]

Options:
      --init                        initialize package.json by calling npm init
                                    -y                                 [boolean]
      --bundle                      bundle deps, defaults to dependencies & bund
                                    leDependencies only[boolean] [default: true]
      --bundleDependencies          bundle package.dependencies
                                                      [boolean] [default: false]
      --bundleDevDependencies       bundle package.devDependencies
                                                       [boolean] [default: true]
      --bundleOptionalDependencies  bundle package.optionalDependencies
                                                      [boolean] [default: false]
      --bundlePeerDependencies      bundle package.peerDependencies
                                                      [boolean] [default: false]
      --bundleBundleDependencies    bundle package.bundleDependencies
                                                       [boolean] [default: true]
      --bundleExcludes              pkg names sep by ',' to dynamic import/requi
                                    re at runtime.        [string] [default: ""]
      --target                      such as ESNext or ES2020 for Node16 [string]
  -w, --watch                       watch mode                         [boolean]
  -h, --help                        Show help                          [boolean]
  -v, --version                     Show version number                [boolean]
```

## Feat

- [x] Zero-configured node-platform module build
- [x] Automatically build you project into multiple modules
  - [x] cli (`lib/cli.js`)
  - [x] CommonJS module (`lib/index.mjs`)
  - [x] ESModule module (`lib/index.js`)
  - [x] TS Declarations (`lib/*.d.ts`)
- creating project profile
  - [x] fill entry points into `package.json` use `--init` option
- [x] watch mode
- [x] minify & sourcemaps control
- [x] you don't even need an `tsconfig.json` if your project is simple enough, we configured everything into `ESNext`, and compile everything from `src` into `lib`.
- [ ] TODO: support React projects

## input & output

- supported entry points:
  - src/index.ts
  - src/cli.ts
- outputs
  - lib

## Reference

- [esninja - npm](https://www.npmjs.com/package/esninja)

## About

### License

GPLv3 - [The GNU General Public License v3.0 - GNU Project - Free Software Foundation](https://www.gnu.org/licenses/gpl-3.0.en.html)

### Author

Author: snomiao <snomiao@gmail.com>
Website: [snomiao.com](https://snomiao.com)

### Sponsors

- None yet.

Claim your sponsorship by donating snomiao <[Email: snomiao@gmail.com](mailto:snomiao@gmail.com)>

### Contribute

Contribute here: <gitpod.io/#https://github.com/snomiao/snobuild>

The main repo is in [here](https://github.com/snomiao/snobuild#readme), any issue and PR's welcome.
