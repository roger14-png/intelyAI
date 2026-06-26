export type FetchJsonOptions = {
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export async function fetchJson(url: string, body: unknown, options: FetchJsonOptions = {}): Promise<any> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const headers = {
    'content-type': 'application/json',
    ...(options.headers ?? {})
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const err = new Error(`Upstream ${res.status} from ${url}`);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(t);
  }
}

