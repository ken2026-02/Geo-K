declare module "*.wasm?url" {
  const src: string;
  export default src;
}

declare module "*.sql?raw" {
  const src: string;
  export default src;
}
