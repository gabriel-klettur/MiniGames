/// <reference types="vite/client" />

// Allow importing webp assets as modules
declare module '*.webp' {
  const src: string;
  export default src;
}

// Allow importing png assets as modules
declare module '*.png' {
  const src: string;
  export default src;
}
