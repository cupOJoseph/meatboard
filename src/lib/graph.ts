const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/meatboard/meatboard';

export async function queryGraph<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 5 },
  });

  if (!res.ok) {
    throw new Error(`Subgraph query failed: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Subgraph error: ${json.errors[0]?.message}`);
  }

  return json.data as T;
}
