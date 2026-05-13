import { showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useCallback, useMemo } from "react";

import { Book } from "../models/book.model";
import { createGoogleBooksApi } from "../api/google-books.api";
import { getGoogleBooksSettings } from "../config/preferences";

export function useBookSearch(query: string) {
  const settings = useMemo(() => getGoogleBooksSettings(), []);
  const api = useMemo(() => createGoogleBooksApi(settings), [settings]);

  const fetchBooks = useCallback(
    async (searchTerm: string): Promise<Book[]> => {
      if (!searchTerm) {
        return [];
      }

      try {
        return await api.getByQuery(searchTerm);
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : String(error);
        const isQuotaExceeded = message.includes("429") || message.toLowerCase().includes("quota exceeded");
        await showToast(
          Toast.Style.Failure,
          isQuotaExceeded ? "Google Books daily quota exceeded" : "Failed to search for books",
          isQuotaExceeded ? "Add a Google Books API key in extension preferences, or try again tomorrow." : message,
        );
        return [];
      }
    },
    [api],
  );

  const { data, isLoading } = usePromise(fetchBooks, [query]);

  return { books: data ?? [], isLoading };
}
