import { getPreferenceValues } from "@raycast/api";

export interface Preferences {
  googleBooksApiKey?: string;
  notionApiKey?: string;
  notionDatabaseId?: string;
}

export interface BookSearchSettings {
  localePreference: string;
  enableCoverImageEdgeCurl: boolean;
  apiKey?: string;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export function getPreferences(): Preferences {
  return getPreferenceValues<Preferences>();
}

export function getGoogleBooksSettings(): BookSearchSettings {
  const preferences = getPreferences();

  return {
    localePreference: "en",
    enableCoverImageEdgeCurl: true,
    apiKey: preferences.googleBooksApiKey || undefined,
  };
}

export function getNotionConfig(): NotionConfig {
  const preferences = getPreferences();

  if (!preferences.notionApiKey || !preferences.notionDatabaseId) {
    throw new Error("Notion API Key or Database ID is not configured in Raycast preferences.");
  }

  return {
    apiKey: preferences.notionApiKey,
    databaseId: preferences.notionDatabaseId,
  };
}
