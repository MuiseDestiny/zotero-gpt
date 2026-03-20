/**
 * LLM Provider presets and utilities.
 * Supports OpenAI and MiniMax (OpenAI-compatible) providers.
 */

export interface ProviderPreset {
  name: string
  apiBase: string
  defaultModel: string
  models: string[]
  embeddingModel: string
  /** Build the embedding request body for this provider */
  buildEmbeddingBody: (input: string[], model: string) => Record<string, unknown>
  /** Extract embedding vectors from the provider's response */
  extractEmbeddings: (response: any) => number[][]
  /** Clamp temperature to the provider's accepted range */
  clampTemperature: (t: number) => number
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  openai: {
    name: "OpenAI",
    apiBase: "https://api.openai.com",
    defaultModel: "gpt-3.5-turbo",
    models: ["gpt-3.5-turbo", "gpt-4", "gpt-4o", "gpt-4o-mini"],
    embeddingModel: "text-embedding-ada-002",
    buildEmbeddingBody(input: string[], model: string) {
      return { model, input }
    },
    extractEmbeddings(response: any): number[][] {
      return response.data.map((i: any) => i.embedding)
    },
    clampTemperature(t: number): number {
      return Math.max(0, Math.min(2, t))
    },
  },
  minimax: {
    name: "MiniMax",
    apiBase: "https://api.minimax.io",
    defaultModel: "MiniMax-M2.7",
    models: ["MiniMax-M2.7", "MiniMax-M2.5", "MiniMax-M2.5-highspeed"],
    embeddingModel: "embo-01",
    buildEmbeddingBody(input: string[], _model: string) {
      return { model: "embo-01", texts: input, type: "db" }
    },
    extractEmbeddings(response: any): number[][] {
      return response.vectors
    },
    clampTemperature(t: number): number {
      return Math.max(0, Math.min(1, t))
    },
  },
}

/** Resolve which provider preset to use based on the provider key */
export function getProviderPreset(provider: string): ProviderPreset {
  return PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.openai
}

/** List available provider names */
export function getProviderNames(): string[] {
  return Object.keys(PROVIDER_PRESETS)
}
