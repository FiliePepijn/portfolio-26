# Pepijn's Portfolio 2026

A high-performance, visually-driven personal portfolio built with React 19, Three.js, and Tailwind CSS 4, deployed as a Cloudflare Worker with integrated assets.

**Live at:** [platour.net](https://platour.net)

## 🚀 Tech Stack

- **Runtime & PM:** [Bun](https://bun.sh/) (Fastest package manager and runner)
- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 8](https://vitejs.dev/)
- **Styling:** [Tailwind CSS 4.3.0](https://tailwindcss.com/) (using the new Vite plugin architecture)
- **3D Graphics:** [Three.js](https://threejs.org/) with [@react-three/fiber](https://github.com/pmndrs/react-three-fiber) & [Drei](https://github.com/pmndrs/drei)
- **Animation:** [GSAP](https://gsap.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Deployment:** [Cloudflare Workers](https://workers.cloudflare.com/) (using the new "Workers with Assets" platform)

## 🛠️ Getting Started

### Prerequisites
Make sure you have [Bun](https://bun.sh/) installed.

### Installation
```bash
bun install
```

### Development
Starts the Vite dev server.
```bash
bun dev
```

### Build
Compiles both the Client assets and the Worker script.
```bash
bun run build
```

### Deployment
Deploys the production build to Cloudflare.
```bash
bun run deploy
```

### Preview (dev) deployment
Deploys the current git branch as an isolated [Worker Preview](https://developers.cloudflare.com/workers/previews/) on `<branch>-portfolio-26.<subdomain>.workers.dev`, without touching production.
```bash
bun run deploy:preview
```
Previews don't inherit production secrets. Set them once for all new Previews:
```bash
bunx wrangler preview base-config secret put JMAP_APP_PASSWORD
```

## 📂 Project Structure

- `src/main.tsx`: Client-side entry point.
- `src/worker.ts`: Cloudflare Worker entry point handling routing and SSR/Asset serving.
- `src/components/`:
    - `PointCloudHead.tsx`: Interactive 3D point cloud using Three.js.
    - `SplitText.tsx`: Animated text components using GSAP.
    - `Projects.tsx`: Portfolio projects showcase with Embla Carousel.
- `public/fonts/`: Localized high-quality typography (Clash Display, Satoshi).
- `screenshot.js`: Custom automation script for capturing OpenGraph images.

## 🖼️ OG Image Generation

The project includes a custom script to generate dynamic OG images by taking a screenshot of a specific preview route.

1. Start the dev server: `bun dev`
2. Run the capture script:
```bash
bun run capture-og
```
This will generate `public/og-image.jpg` using Chrome Remote Interface.

## 🎨 Design Principles

- **Fluid Typography:** Uses CSS `clamp()` and variables defined in `index.css` for seamless scaling across devices.
- **Brutalist Aesthetics:** Combines sharp typography (JetBrains Mono) with grainy textures and grid-based layouts.
- **Performance:** Leverages Bun for ultra-fast builds and Cloudflare's edge network for global delivery.

---

Built with ❤️ by Pepijn.
