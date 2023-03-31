import { create, Tensor } from 'tfjs-node-gpu';
import { loadTokenizer, Tokenizer } from '@tensorflow-models/universal-sentence-encoder';

async function getSentenceEmbeddings(sentences: string[]): Promise<number[][]> {
  // 从TensorFlow Hub中加载Universal Sentence Encoder
  const modelUrl = 'https://tfhub.dev/google/universal-sentence-encoder/4';
  const model = await create();
  const encoder = await model.loadGraphModel(modelUrl, {});

  // 加载分词器
  const tokenizer: Tokenizer = await loadTokenizer('https://tfhub.dev/google/universal-sentence-encoder-multilingual/3');

  // 将每个句子分词并计算嵌入向量
  const embeddings: number[][] = [];
  for (let i = 0; i < sentences.length; i++) {
    const tokens = tokenizer.encode(sentences[i]);
    const input = Tensor.fromArray(tokens.map(token => [token]));
    const embedding = (await encoder.executeAsync({ 'input': input })).slice([0, 0, 0], [-1, -1, -1]).dataSync() as Float32Array;
    embeddings.push(Array.from(embedding));
  }

  // 释放资源
  encoder.dispose();
  model.dispose();

  return embeddings;
}