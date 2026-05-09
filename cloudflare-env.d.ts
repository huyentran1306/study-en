// Extend the global CloudflareEnv interface with Workers AI binding
declare global {
  interface CloudflareEnv {
    AI: Ai;
  }
}

export {};
