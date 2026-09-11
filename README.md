# Student House Game

A browser-based single-player game set in student apartment 407 and its immediate surroundings. The planned game uses stylized low-poly 3D, predefined characters, and simple house interactions.

Currently, the repository contains the TypeScript workspace scaffold and a Three.js rendering foundation with a lit placeholder scene and fixed-pitch camera. World rendering and gameplay are future features.

## Development

Use Node.js LTS (22.14 or newer) and npm. From the repository root:

```sh
npm ci
./scripts/verify.sh
npm run dev -w packages/client
```

Open the local URL printed by Vite. See [development](docs/development.md) for commands and package boundaries, [architecture](docs/architecture.md) for the design, and [roadmap](docs/roadmap.md) for planned features.

Contributions follow the [agentic workflow](docs/agentic-workflow.md) and [agent instructions](AGENTS.md).
