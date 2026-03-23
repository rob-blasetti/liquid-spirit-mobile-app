# Package Usage Analysis

Generated on 2026-03-23T04:18:52.700Z. Updated after removing `aws-sdk`, `react-native-paper`, and `@bottom-tabs/react-navigation`.

## Methodology

- Scope: direct `dependencies` and `devDependencies` from `package.json`.
- Size metric: installed on-disk size of each direct package folder in `node_modules`, measured with `du -sk`. This is not the final iOS or Android bundle size.
- Import usage metric: static scan of `import`, `export ... from`, `require()`, `require.resolve()`, and dynamic `import()` across app code, tests, and config files.
- Config/native usage metric: plain-text package-name matches in source-level config/native files and script commands. Generated folders, lockfiles, and vendor artifacts were excluded.
- "How much we use" is a heuristic. It reflects visible integration surface, not executed code paths or tree-shaken output.
- React Native native modules can be active through autolinking or transitive library use even when direct JS imports are zero.

## Top Findings

- Total installed `node_modules` size: 482 MB.
- Runtime packages with zero direct JS imports: react-native-svg, react-native-screens, react-native-pager-view, lodash.debounce.
- Runtime packages with no source-level signals at all: react-native-svg, react-native-screens, react-native-pager-view, lodash.debounce.
- Dev packages used only by scripts/config/native setup: eslint, less, @react-native/babel-preset, babel-jest, react-native-dotenv, jest.
- Dev packages with no source-level signals at all: typescript, prettier, @babel/runtime, @react-native-community/cli, @babel/core, @types/react, @react-native-community/cli-platform-android, @babel/preset-env, @react-native-community/cli-platform-ios, @types/jest, @react-native/eslint-config, @types/react-test-renderer, @react-native/typescript-config.
- Largest runtime package folders: react-native (84.04 MB), liquid-spirit-styleguide (49.37 MB), react-native-vector-icons (8.44 MB), react-native-svg (7.62 MB), react-native-gesture-handler (6.65 MB).
- Largest dev package folders: typescript (22.84 MB), prettier (10.80 MB), @testing-library/react-native (6.98 MB), eslint (3.81 MB), less (3.74 MB).

## Runtime Dependencies

| Package | Version | Installed Size | JS Import Files | Config/Native Files | Usage Heuristic | Entry Points Seen |
| --- | --- | ---: | ---: | ---: | --- | --- |
| react-native | 0.82.1 | 84.04 MB | 124 | 28 | high | react-native |
| liquid-spirit-styleguide | ^0.2.1 | 49.37 MB | 5 | 1 | medium | liquid-spirit-styleguide/native |
| react-native-vector-icons | ^10.3.0 | 8.44 MB | 49 | 2 | high | react-native-vector-icons/FontAwesome6, react-native-vector-icons/Ionicons |
| react-native-svg | 15.15.1 | 7.62 MB | 0 | 0 | none found | - |
| react-native-gesture-handler | ^2.27.1 | 6.65 MB | 5 | 0 | medium | react-native-gesture-handler |
| react-native-screens | ^4.11.1 | 6.26 MB | 0 | 0 | none found | - |
| react-native-video | ^6.10.2 | 1.66 MB | 4 | 1 | medium | react-native-video |
| socket.io-client | ^4.8.1 | 1.50 MB | 1 | 0 | very low | socket.io-client |
| react-native-maps | ^2.0.0-beta.15 | 1.42 MB | 2 | 0 | low | react-native-maps |
| @react-navigation/stack | ^7.1.1 | 1000 KB | 5 | 0 | medium | @react-navigation/stack |
| react-native-safe-area-context | ^5.5.2 | 788 KB | 21 | 0 | high | react-native-safe-area-context |
| @react-navigation/bottom-tabs | ^7.2.0 | 784 KB | 1 | 0 | very low | @react-navigation/bottom-tabs |
| @react-native-async-storage/async-storage | ^2.1.0 | 732 KB | 12 | 1 | high | @react-native-async-storage/async-storage |
| @react-navigation/native | ^7.0.17 | 720 KB | 29 | 1 | high | @react-navigation/native |
| @react-native-community/datetimepicker | ^8.3.0 | 532 KB | 1 | 0 | very low | @react-native-community/datetimepicker |
| @react-navigation/native-stack | ^7.2.0 | 484 KB | 1 | 0 | very low | @react-navigation/native-stack |
| @react-native-documents/picker | ^11.0.3 | 460 KB | 1 | 0 | very low | @react-native-documents/picker |
| react-native-tab-view | ^4.0.5 | 444 KB | 2 | 0 | low | react-native-tab-view |
| react-native-keychain | ^9.2.3 | 404 KB | 2 | 1 | low | react-native-keychain |
| react-native-pager-view | ^6.8.1 | 388 KB | 0 | 0 | none found | - |
| @react-native-community/blur | ^4.4.1 | 320 KB | 2 | 0 | low | @react-native-community/blur |
| react-native-image-picker | ^7.2.3 | 300 KB | 4 | 0 | medium | react-native-image-picker |
| react-native-config | ^1.5.5 | 288 KB | 2 | 8 | low | react-native-config |
| @callstack/liquid-glass | ^0.6.0 | 260 KB | 3 | 0 | medium | @callstack/liquid-glass |
| react-native-passkey | ^3.3.2 | 256 KB | 1 | 0 | very low | react-native-passkey |
| react | 19.1.1 | 244 KB | 145 | 28 | high | react |
| react-native-fast-image | ^8.6.3 | 188 KB | 32 | 1 | high | react-native-fast-image |
| @liquidspirit/react-native-boring-avatars | ^1.0.5 | 176 KB | 8 | 0 | high | @liquidspirit/react-native-boring-avatars |
| react-native-progress | ^5.0.1 | 80 KB | 1 | 1 | very low | react-native-progress |
| jwt-decode | 3.1.2 | 56 KB | 1 | 0 | very low | jwt-decode |
| lodash.debounce | ^4.0.8 | 24 KB | 0 | 0 | none found | - |

## Dev Dependencies

| Package | Version | Installed Size | JS Import Files | Config/Native Files | Usage Heuristic | Entry Points Seen |
| --- | --- | ---: | ---: | ---: | --- | --- |
| typescript | ^5.8.3 | 22.84 MB | 0 | 0 | none found | - |
| prettier | 2.8.8 | 10.80 MB | 0 | 0 | none found | - |
| @testing-library/react-native | ^13.2.0 | 6.98 MB | 3 | 0 | medium | @testing-library/react-native |
| eslint | ^8.19.0 | 3.81 MB | 0 | 1 | config/native only | - |
| less | ^4.3.0 | 3.74 MB | 0 | 11 | config/native only | - |
| @babel/runtime | ^7.25.0 | 1.08 MB | 0 | 0 | none found | - |
| @react-native-community/cli | 20.0.0 | 1.08 MB | 0 | 0 | none found | - |
| @babel/core | ^7.25.2 | 1.02 MB | 0 | 0 | none found | - |
| react-test-renderer | 19.1.1 | 876 KB | 1 | 0 | very low | react-test-renderer |
| @types/react | ^19.1.1 | 436 KB | 0 | 0 | none found | - |
| @react-native-community/cli-platform-android | 20.0.0 | 352 KB | 0 | 0 | none found | - |
| @babel/preset-env | ^7.25.3 | 276 KB | 0 | 0 | none found | - |
| @react-native-community/cli-platform-ios | 20.0.0 | 108 KB | 0 | 0 | none found | - |
| @types/jest | ^29.5.13 | 88 KB | 0 | 0 | none found | - |
| @react-native/babel-preset | 0.82.1 | 40 KB | 0 | 1 | config/native only | - |
| babel-jest | ^29.7.0 | 32 KB | 0 | 1 | config/native only | - |
| @react-native/eslint-config | 0.82.1 | 28 KB | 0 | 0 | none found | - |
| react-native-dotenv | ^3.4.11 | 28 KB | 0 | 1 | config/native only | - |
| jest | ^29.6.3 | 24 KB | 0 | 13 | config/native only | - |
| react-native-less-transformer | ^2.0.0 | 24 KB | 1 | 0 | very low | react-native-less-transformer |
| @react-native/metro-config | 0.82.1 | 20 KB | 1 | 0 | very low | @react-native/metro-config |
| @types/react-test-renderer | ^19.1.0 | 20 KB | 0 | 0 | none found | - |
| @react-native/typescript-config | 0.82.1 | 12 KB | 0 | 0 | none found | - |

## Priority Review Candidates

### typescript

- Type: devDependency.
- Installed size: 22.84 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### prettier

- Type: devDependency.
- Installed size: 10.80 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### react-native-svg

- Type: dependency.
- Installed size: 7.62 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### react-native-screens

- Type: dependency.
- Installed size: 6.26 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### eslint

- Type: devDependency.
- Installed size: 3.81 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 1 file(s) (package.json:scripts).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: not imported in app code, but still referenced by config or native setup. Treat as setup/integration dependency, not dead code.

### less

- Type: devDependency.
- Installed size: 3.74 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 11 file(s) (metro.config.js, screens/CreateActivity/CreateActivity.jsx, screens/CreateActivity/sections/ChildrensCurriculumSection.jsx, screens/CreateSession/CreateSession.jsx).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: not imported in app code, but still referenced by config or native setup. Treat as setup/integration dependency, not dead code.

### @babel/runtime

- Type: devDependency.
- Installed size: 1.08 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @react-native-community/cli

- Type: devDependency.
- Installed size: 1.08 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @babel/core

- Type: devDependency.
- Installed size: 1.02 MB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @types/react

- Type: devDependency.
- Installed size: 436 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### react-native-pager-view

- Type: dependency.
- Installed size: 388 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @react-native-community/cli-platform-android

- Type: devDependency.
- Installed size: 352 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @babel/preset-env

- Type: devDependency.
- Installed size: 276 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @react-native-community/cli-platform-ios

- Type: devDependency.
- Installed size: 108 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @types/jest

- Type: devDependency.
- Installed size: 88 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### @react-native/babel-preset

- Type: devDependency.
- Installed size: 40 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 1 file(s) (babel.config.js).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: not imported in app code, but still referenced by config or native setup. Treat as setup/integration dependency, not dead code.

### babel-jest

- Type: devDependency.
- Installed size: 32 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 1 file(s) (jest.config.js).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: not imported in app code, but still referenced by config or native setup. Treat as setup/integration dependency, not dead code.

### @react-native/eslint-config

- Type: devDependency.
- Installed size: 28 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 0 file(s).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: no direct evidence of use in the scanned app, test, config, or native source files. Strongest removal candidate.

### react-native-dotenv

- Type: devDependency.
- Installed size: 28 KB.
- Visible app usage: 0 JS import file(s), 0 total import/reference statements.
- Config/native references: 1 file(s) (babel.config.js).
- Entry points seen: none found.
- Main imported areas: none.
- Assessment: not imported in app code, but still referenced by config or native setup. Treat as setup/integration dependency, not dead code.
