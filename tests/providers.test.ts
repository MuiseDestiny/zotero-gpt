import {
  getProviderPreset,
  getProviderNames,
  PROVIDER_PRESETS,
} from '../src/modules/Meet/providers';

describe('Provider Presets', () => {
  describe('getProviderNames', () => {
    it('should return openai and minimax', () => {
      const names = getProviderNames();
      expect(names).toContain('openai');
      expect(names).toContain('minimax');
    });
  });

  describe('getProviderPreset', () => {
    it('should return openai preset by default', () => {
      const preset = getProviderPreset('openai');
      expect(preset.name).toBe('OpenAI');
      expect(preset.apiBase).toBe('https://api.openai.com');
      expect(preset.defaultModel).toBe('gpt-3.5-turbo');
    });

    it('should return minimax preset', () => {
      const preset = getProviderPreset('minimax');
      expect(preset.name).toBe('MiniMax');
      expect(preset.apiBase).toBe('https://api.minimax.io');
      expect(preset.defaultModel).toBe('MiniMax-M2.7');
    });

    it('should fall back to openai for unknown provider', () => {
      const preset = getProviderPreset('unknown');
      expect(preset.name).toBe('OpenAI');
    });
  });

  describe('OpenAI embedding format', () => {
    const preset = PROVIDER_PRESETS.openai;

    it('should build OpenAI embedding body with model and input', () => {
      const body = preset.buildEmbeddingBody(['hello', 'world'], 'text-embedding-ada-002');
      expect(body).toEqual({
        model: 'text-embedding-ada-002',
        input: ['hello', 'world'],
      });
    });

    it('should extract embeddings from OpenAI response', () => {
      const response = {
        data: [
          { embedding: [0.1, 0.2, 0.3] },
          { embedding: [0.4, 0.5, 0.6] },
        ],
      };
      const embeddings = preset.extractEmbeddings(response);
      expect(embeddings).toEqual([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
    });
  });

  describe('MiniMax embedding format', () => {
    const preset = PROVIDER_PRESETS.minimax;

    it('should build MiniMax embedding body with texts and type', () => {
      const body = preset.buildEmbeddingBody(['hello', 'world'], 'embo-01');
      expect(body).toEqual({
        model: 'embo-01',
        texts: ['hello', 'world'],
        type: 'db',
      });
    });

    it('should extract embeddings from MiniMax response', () => {
      const response = {
        vectors: [[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]],
        total_tokens: 10,
      };
      const embeddings = preset.extractEmbeddings(response);
      expect(embeddings).toEqual([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
    });

    it('should use embo-01 as embedding model', () => {
      expect(preset.embeddingModel).toBe('embo-01');
    });
  });

  describe('Temperature clamping', () => {
    it('should clamp OpenAI temperature to [0, 2]', () => {
      const preset = PROVIDER_PRESETS.openai;
      expect(preset.clampTemperature(0)).toBe(0);
      expect(preset.clampTemperature(1)).toBe(1);
      expect(preset.clampTemperature(2)).toBe(2);
      expect(preset.clampTemperature(3)).toBe(2);
      expect(preset.clampTemperature(-1)).toBe(0);
      expect(preset.clampTemperature(0.5)).toBe(0.5);
    });

    it('should clamp MiniMax temperature to [0, 1]', () => {
      const preset = PROVIDER_PRESETS.minimax;
      expect(preset.clampTemperature(0)).toBe(0);
      expect(preset.clampTemperature(0.5)).toBe(0.5);
      expect(preset.clampTemperature(1)).toBe(1);
      expect(preset.clampTemperature(1.5)).toBe(1);
      expect(preset.clampTemperature(2)).toBe(1);
      expect(preset.clampTemperature(-0.5)).toBe(0);
    });
  });

  describe('Provider models', () => {
    it('should list OpenAI models', () => {
      const preset = PROVIDER_PRESETS.openai;
      expect(preset.models).toContain('gpt-3.5-turbo');
      expect(preset.models).toContain('gpt-4');
    });

    it('should list MiniMax models', () => {
      const preset = PROVIDER_PRESETS.minimax;
      expect(preset.models).toContain('MiniMax-M2.7');
      expect(preset.models).toContain('MiniMax-M2.5');
      expect(preset.models).toContain('MiniMax-M2.5-highspeed');
    });
  });
});

describe('Integration: MiniMax API compatibility', () => {
  const minimax = PROVIDER_PRESETS.minimax;

  it('should have OpenAI-compatible API base URL format', () => {
    expect(minimax.apiBase).toMatch(/^https:\/\/api\./);
    expect(minimax.apiBase).not.toContain('/v1');
  });

  it('should produce valid MiniMax embedding request body', () => {
    const texts = ['Research paper about neural networks', 'Deep learning survey'];
    const body = minimax.buildEmbeddingBody(texts, minimax.embeddingModel);
    expect(body).toHaveProperty('model', 'embo-01');
    expect(body).toHaveProperty('texts');
    expect(body).toHaveProperty('type', 'db');
    expect(Array.isArray(body.texts)).toBe(true);
  });

  it('should handle MiniMax embedding response format', () => {
    const mockResponse = {
      vectors: [
        new Array(1536).fill(0).map(() => Math.random()),
        new Array(1536).fill(0).map(() => Math.random()),
      ],
      total_tokens: 42,
      base_resp: { status_code: 0, status_msg: 'success' },
    };
    const embeddings = minimax.extractEmbeddings(mockResponse);
    expect(embeddings).toHaveLength(2);
    expect(embeddings[0]).toHaveLength(1536);
  });

  it('should accept temperature=0 for MiniMax', () => {
    expect(minimax.clampTemperature(0)).toBe(0);
  });
});
