import fetch, { RequestInit } from "node-fetch";

import { NotionConfig } from "../../config/preferences";
import { NotionDatabaseSchema, NotionRequestPayload, NotionResponse } from "./notion.types";

export class NotionClient {
  constructor(private readonly config: NotionConfig) {}

  async fetchDatabase(): Promise<NotionDatabaseSchema> {
    return this.request<NotionDatabaseSchema>(`/databases/${this.config.databaseId}`);
  }

  async createPage(payload: NotionRequestPayload): Promise<NotionResponse> {
    return this.request<NotionResponse>("/pages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`https://api.notion.com/v1${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      let message = `Notion API error (${response.status})`;

      try {
        const errorData = (await response.json()) as unknown;
        if (isErrorResponse(errorData)) {
          message = `${message}: ${errorData.message ?? "Unknown error"}`;
        }
      } catch {
        // ignore parse failures
      }

      throw new Error(message);
    }

    return (await response.json()) as T;
  }
}

function isErrorResponse(payload: unknown): payload is { message?: string } {
  return typeof payload === "object" && payload !== null && "message" in payload;
}
