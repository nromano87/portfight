/** Prefix public files so they work under GitHub Pages `/portfight/`. */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

export function assets<T extends Record<string, string>>(map: T): T {
  const out = { ...map };
  for (const key of Object.keys(out) as Array<keyof T>) {
    out[key] = asset(out[key]) as T[keyof T];
  }
  return out;
}
