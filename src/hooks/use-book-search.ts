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
        await showToast(Toast.Style.Failure, "Failed to search for books");
        return [];
      }
    },
    [api],
  );

  const { data, isLoading } = usePromise(fetchBooks, [query]);

  return { books: data ?? [], isLoading };
}
