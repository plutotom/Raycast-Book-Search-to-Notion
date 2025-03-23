import { Book } from "../models/book.model";
import { GoogleBooksApi } from "./google_books_api";
import fetch from "node-fetch";

export interface BookSearchPluginSettings {
  localePreference: string;
  enableCoverImageEdgeCurl: boolean;
  apiKey?: string;
}

export interface BaseBooksApiImpl {
  getByQuery(query: string, options?: Record<string, string>): Promise<Book[]>;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function useGoogleBooksApi(settings: BookSearchPluginSettings): BaseBooksApiImpl {
  return new GoogleBooksApi(settings.localePreference, settings.enableCoverImageEdgeCurl, settings.apiKey);
}

/**
 * API
 *
 * @export
 * @template T
 * @param {string} url
 * @param {(Record<string, string | number>)} [params={}]
 * @param {Record<string, string>} [headers]
 * @return {*}  {Promise<T>}
 */
export async function apiGet<T>(
  url: string,
  params: Record<string, string | number> = {},
  headers?: Record<string, string>,
): Promise<T> {
  const apiURL = new URL(url);
  appendQueryParams(apiURL, params);
  const res = await fetch(apiURL.href, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json; charset=utf-8",
      ...headers,
    },
  });
  return res.json() as Promise<T>;
}

function appendQueryParams(url: URL, params: Record<string, string | number>): void {
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
}
