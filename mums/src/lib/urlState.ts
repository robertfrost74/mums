export function buildQuery(params: { q?: string; cat?: string; meal?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.cat) sp.set("cat", params.cat);
  if (params.meal) sp.set("meal", params.meal);
  const s = sp.toString();
  return s ? `?${s}` : "";
}