import fetch from "node-fetch";

export type QueryParams = Record<string, string | number>;

export async function apiGet<T>(
  url: string,
  params: QueryParams = {},
  headers: Record<string, string> = {},
): Promise<T> {
  const apiURL = new URL(url);
  appendQueryParams(apiURL, params);

  const response = await fetch(apiURL.href, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });

  if (!response.ok) {
    let message = `Request to ${url} failed with status ${response.status}`;

    try {
      const errorData = await response.json();
      const errorMessage = (errorData as { error?: { message?: string }; message?: string })?.error?.message;
      if (errorMessage) {
        message = `${message}: ${errorMessage}`;
      }
    } catch {
      // ignore parse failure and fall back to default message
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function appendQueryParams(url: URL, params: QueryParams): void {
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
}
