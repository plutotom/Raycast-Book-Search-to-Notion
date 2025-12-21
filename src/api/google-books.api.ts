import { Book } from "../models/book.model";
import { GoogleBooksResponse, VolumeInfo } from "../models/google_book_response";
import { apiGet } from "./http-client";
import { BookSearchSettings } from "../config/preferences";

export interface BooksApi {
  getByQuery(query: string, options?: Record<string, string>): Promise<Book[]>;
}

export function createGoogleBooksApi(settings: BookSearchSettings): BooksApi {
  return new GoogleBooksApi(settings);
}

class GoogleBooksApi implements BooksApi {
  private static readonly MAX_RESULTS = 40;
  private static readonly PRINT_TYPE = "books";

  constructor(private readonly settings: BookSearchSettings) {}

  private getLanguageRestriction(locale: string): string {
    return locale === "default" ? Intl.DateTimeFormat().resolvedOptions().locale : locale;
  }

  private buildSearchParams(query: string, options?: Record<string, string>) {
    const params: Record<string, string | number> = {
      q: query,
      maxResults: GoogleBooksApi.MAX_RESULTS,
      printType: GoogleBooksApi.PRINT_TYPE,
      langRestrict: this.getLanguageRestriction(options?.locale || this.settings.localePreference),
    };

    if (this.settings.apiKey) {
      params["key"] = this.settings.apiKey;
    }

    return params;
  }

  async getByQuery(query: string, options?: Record<string, string>): Promise<Book[]> {
    if (!query) return [];

    const params = this.buildSearchParams(query, options);
    const searchResults = await apiGet<GoogleBooksResponse>("https://www.googleapis.com/books/v1/volumes", params);

    if (!searchResults?.totalItems || !searchResults.items) {
      return [];
    }

    return searchResults.items.map(({ volumeInfo }) => this.createBookItem(volumeInfo));
  }

  private extractISBNs(industryIdentifiers: VolumeInfo["industryIdentifiers"]): Record<string, string> {
    return (
      industryIdentifiers?.reduce(
        (result, item) => {
          const isbnType = item.type === "ISBN_10" ? "isbn10" : "isbn13";
          result[isbnType] = item.identifier.trim();
          return result;
        },
        {} as Record<string, string>,
      ) ?? {}
    );
  }

  private extractBasicBookInfo(item: VolumeInfo): Partial<Book> {
    return {
      title: item.title,
      subtitle: item.subtitle,
      author: this.formatList(item.authors),
      authors: item.authors,
      category: this.formatList(item.categories),
      categories: item.categories,
      publisher: item.publisher,
      totalPage: item.pageCount,
      coverUrl: this.setCoverImageEdgeCurl(item.imageLinks?.thumbnail ?? "", this.settings.enableCoverImageEdgeCurl),
      coverSmallUrl: this.setCoverImageEdgeCurl(
        item.imageLinks?.smallThumbnail ?? "",
        this.settings.enableCoverImageEdgeCurl,
      ),
      publishDate: item.publishedDate || "",
      description: item.description,
      link: item.canonicalVolumeLink || item.infoLink,
      previewLink: item.previewLink,
    };
  }

  private createBookItem(item: VolumeInfo): Book {
    const book: Book = {
      title: "",
      subtitle: "",
      author: "",
      authors: [],
      category: "",
      categories: [],
      publisher: "",
      publishDate: "",
      totalPage: "",
      coverUrl: "",
      coverSmallUrl: "",
      description: "",
      link: "",
      previewLink: "",
      ...this.extractBasicBookInfo(item),
      ...this.extractISBNs(item.industryIdentifiers),
    };

    return book;
  }

  private formatList(list?: string[]): string {
    return list && list.length > 1 ? list.map((item) => item.trim()).join(", ") : (list?.[0] ?? "");
  }

  private setCoverImageEdgeCurl(url: string, enabled: boolean): string {
    return enabled ? url : url.replace("&edge=curl", "");
  }
}
