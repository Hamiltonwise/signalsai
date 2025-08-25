import React, { lazy } from 'react';

type Factory<T extends React.ComponentType<any>> = () => Promise<{ default: T }>;

function isChunkLoadError(err: any) {
  const msg = String(err?.message || err);
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Loading chunk') ||
    msg.includes('ERR_CHUNK_LOAD')
  );
}

/**
 * Wrap React.lazy so that if a network/chunk error occurs, we retry once with a cache-busting query.
 * We also surface a clear error to Suspense boundaries so they can show a fallback UI.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: Factory<T>,
  { retries = 2 }: { retries?: number } = {}
) {
  let attempt = 0;

  const loader = async (): Promise<{ default: T }> => {
    try {
      return await factory();
    } catch (err) {
      if (attempt < retries && isChunkLoadError(err)) {
        attempt++;
        console.log(`Chunk load failed, retrying (attempt ${attempt}/${retries})...`);
        // cache-busting param to break a stale service worker/CDN
        await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // Progressive delay
        // assume the import path is static in the factory string; re-evaluate the factory
        // Call the factory again; Vite will resolve with updated URL
        return await factory();
      }
      console.error(`Chunk load failed after ${retries} retries:`, err);
      throw err;
    }
  };

  return lazy(loader);
}