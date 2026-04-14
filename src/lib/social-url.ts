/** Aceita URL completa ou domínio/caminho; devolve URL segura ou null. */
export function safeHttpUrl(raw: string | undefined | null): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  return `https://${t.replace(/^\/+/, "")}`;
}
