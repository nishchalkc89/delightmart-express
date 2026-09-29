// Visual assets extracted from the approved Delight reference screens.
const files = import.meta.glob('../assets/design/*.{png,webp,svg}', { eager: true, import: 'default' }) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) {
  const name = path.split('/').pop()!.replace(/\.(png|webp|svg)$/, '');
  byName[name] = url;
}

/** Resolve a design asset by file name without extension, e.g. `asset('p-rice')`. */
export function asset(name: string): string {
  return byName[name] ?? '';
}
