/**
 * LLM Provider presets and utilities.
 * Supports OpenAI, MiniMax, and Gemini (OpenAI-compatible) providers.
 */

export interface ProviderPreset {
  name: string
  apiBase: string
  /**
   * Path appended to apiBase for chat completions.
   * Defaults to "/v1/chat/completions" when not set.
   * Some providers (e.g. Gemini) place their endpoint at a different path
   * and do not use the standard /v1/ prefix.
   */
  chatPath?: string
  /**
   * Path appended to apiBase for embeddings.
   * Defaults to "/v1/embeddings" when not set.
   */
  embeddingsPath?: string
  defaultModel: string
  models: string[]
  /** Clamp temperature to the provider's accepted range */
  clampTemperature: (t: number) => number
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  openai: {
    name: "OpenAI",
    apiBase: "https://api.openai.com",
    defaultModel: "gpt-3.5-turbo",
    models: ["gpt-3.5-turbo", "gpt-4", "gpt-4o", "gpt-4o-mini"],
    clampTemperature(t: number): number {
      return Math.max(0, Math.min(2, t))
    },
  },
  minimax: {
    name: "MiniMax",
    apiBase: "https://api.minimax.io",
    defaultModel: "MiniMax-M2.7",
    models: ["MiniMax-M2.7", "MiniMax-M2.5", "MiniMax-M2.5-highspeed"],
    clampTemperature(t: number): number {
      return Math.max(0, Math.min(1, t))
    },
  },
  gemini: {
    name: "Gemini",
    // Gemini's OpenAI-compatible endpoint lives under /v1beta/openai,
    // so chat and embeddings paths skip the standard /v1/ prefix.
    apiBase: "https://generativelanguage.googleapis.com/v1beta/openai",
    chatPath: "/chat/completions",
    embeddingsPath: "/embeddings",
    defaultModel: "gemini-2.0-flash",
    models: ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    clampTemperature(t: number): number {
      return Math.max(0, Math.min(2, t))
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
