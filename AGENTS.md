# Repository Guidelines

## Project Structure & Modules
- `App.jsx`: App entry point and root providers.
- `components/`, `screens/`, `navigation/`: UI building blocks, views, and route setup.
- `services/`, `contexts/`, `utils/`: Data access, React context, helpers.
- `assets/`: Images, fonts, and static files.
- `__tests__/`, `__mocks__/`: Jest tests and mocks.
- `android/`, `ios/`: Native projects for platform builds.

## Build, Test, and Development
- `yarn start`: Start Metro bundler.
- `yarn ios` | `yarn android`: Run app on simulator/device using variables from `.env`.
- `yarn staging` | `yarn production`: Run iOS with `.env.staging` or `.env.production` via `react-native-config`.
- `yarn test`: Run Jest unit/integration tests.
- `yarn lint`: Lint the codebase with ESLint.

Examples:
- Set a specific env file: `ENVFILE=.env.staging yarn android`.

## Coding Style & Naming
- Style: ESLint (`@react-native` preset) and Prettier enforce formatting.
- Prettier: single quotes, trailing commas, arrow parens avoided, bracketSameLine enabled.
- Indentation: 2 spaces; no tabs.
- Filenames: `PascalCase` for React components, `camelCase` for helpers, `snake_case` for assets.
- Keep modules small and colocate styles next to components when practical.

## Testing Guidelines
- Framework: Jest with `@testing-library/react-native`.
- Location: `__tests__/` or co-located `*.test.(js|jsx|ts|tsx)`.
- Mocks: add under `__mocks__/` when needed (e.g., native modules).
- Run tests: `yarn test` (use `--watch` locally).
- Aim to cover UI states, navigation, and service boundaries; avoid testing implementation details.

## Commit & Pull Requests
- Commits: Use concise, imperative subjects (e.g., "Fix event detail crash"). Include scope when helpful (e.g., `screens:`).
- PRs: Provide a clear summary, linked issues, screenshots for UI changes, and test steps. Note any env/setup changes.
- CI friendliness: ensure `yarn lint` and `yarn test` pass before requesting review.

## Security & Configuration
- Secrets: never commit credentials. Use `.env`, `.env.staging`, `.env.production` and document required keys in the PR.
- Platform keys/certs: store securely; do not rotate without coordination. Keep Google Maps/API keys in env files.
