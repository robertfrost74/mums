export function buildQuery(params: { q?: string; cat?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.cat) sp.set("cat", params.cat);
  const s = sp.toString();
  return s ? `?${s}` : "";
}