/// <reference types="vite/client" />

// Allow importing webp assets as modules
declare module '*.webp' {
  const src: string;
  export default src;
}
