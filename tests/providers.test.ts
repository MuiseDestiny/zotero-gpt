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

  it('should accept temperature=0 for MiniMax', () => {
    expect(minimax.clampTemperature(0)).toBe(0);
  });
});
