export function extractJsonPath(obj: unknown, path: string): unknown {
  if (!path || !obj) return undefined;
  
  // Remove $. or $ from start of path
  const normalizedPath = path.replace(/^\$\.?/, '');
  if (!normalizedPath) return obj;

  const parts = normalizedPath.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
