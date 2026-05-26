export function normalizeAssetPath(path?: string) {
  if (!path) {
    return "";
  }
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  if (path.startsWith("/")) {
    return path;
  }
  return `/${path.replace(/^\.?\/*/, "")}`;
}
