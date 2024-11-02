export type GenerateResourceSeed<T> = T | (() => T);
export type InferResourceSeed<T> = T extends GenerateResourceSeed<infer U>
  ? U
  : never;
