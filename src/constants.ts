export const DEFAULT_ASSET_EXTENSIONS = [
  // Images & Vector
  'png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico', 'bmp', 'tiff',
  // Fonts
  'ttf', 'otf', 'woff', 'woff2', 'eot',
  // Audio & Video
  'mp4', 'webm', 'mov', 'mp3', 'wav', 'ogg', 'm4a',
  // Animations & Docs
  'lottie', 'pdf'
];

export const SOURCE_FILE_GLOBS = [
  '**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}',     // JS / TS / React / Expo
  '**/*.{vue,svelte,astro}',                  // Modern Web Frameworks
  '**/*.{php,blade.php,twig}',                // Laravel / PHP
  '**/*.{py,html,htm,jinja,jinja2,j2}',       // Python / FastAPI / Django / Flask
  '**/*.{css,scss,sass,less,styl}',           // Stylesheets
  '**/*.{json,yaml,yml,toml,xml,md,mdx,env}'  // Configs & Manifests
];

export const GLOBAL_IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/vendor/**',
  '**/.git/**',
  '**/.svn/**',
  '**/venv/**',
  '**/.venv/**',
  '**/__pycache__/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.expo/**',
  '**/.asset-sweep-trash/**',
  '**/coverage/**'
];

// Assets referenced implicitly by OS, browsers, or app stores
export const DEFAULT_PROTECTED_FILES = [
  'favicon.ico',
  'apple-touch-icon.png',
  'robots.txt',
  'manifest.json',
  'icon.png',
  'splash.png',
  'splash-icon.png',
  'adaptive-icon.png',
  'notification-icon.png'
];
