// Next.js resolves `server-only` itself and fails the build when a client
// module imports it. Vitest runs outside Next.js, so the import lands here.
export {};
