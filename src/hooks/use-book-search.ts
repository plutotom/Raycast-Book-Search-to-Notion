import { showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useMemo } from "react";

import { Book } from "../models/book.model";
import { createGoogleBooksApi } from "../api/google-books.api";
import { getGoogleBooksSettings } from "../config/preferences";

export function useBookSearch(query: string) {
  const settings = useMemo(() => getGoogleBooksSettings(), []);
  const api = useMemo(() => createGoogleBooksApi(settings), [settings]);

  const { data, isLoading } = usePromise<Book[]>(
    async (searchTerm: string) => {
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
    [query, api],
  );

  return { books: data ?? [], isLoading };
}
