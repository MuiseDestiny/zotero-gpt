const fs = require('fs');
const pdf = require('pdf-parse');
// const openai = require("openai")
import { splitText } from 'embeddings-splitter';
const cosineSimilarity = require('cosine-similarity');


let dataBuffer = fs.readFileSync("E:/Zotero/storage/YKAAKC98/Jia 等 - 2019 - Distinct Impacts of Increased Aerosols on Cloud Dr.pdf");


interface Paper {
  text: string
  embeddings?: number[]
  similarity?: number
}

function calculate_similarity(paper_df: Paper[], query: string, n = 3): Paper[] {
  const embedding_model = 'text-embedding-ada-002'

  // 获取论文文本的嵌入向量
  paper_df.forEach((paper) => {
    paper.embeddings = get_embedding(paper.text, { engine: embedding_model })
  })

  // 获取查询文本的嵌入向量
  const query_embedding = get_embedding(query, { engine: embedding_model })

  // 计算余弦相似度
  paper_df.forEach((paper) => {
    paper.similarity = cosine_similarity(paper.embeddings, query_embedding)
  })

  // 根据相似度排序并返回前n个结果
  return paper_df
    .sort((a, b) => b.similarity! - a.similarity!)
    .slice(0, n)
}

import { OpenAI } from '@openai/api'

const openai = new OpenAI('YOUR_API_KEY')

async function get_embedding(text: string, options: { engine?: string, model?: string } = {}) {
  const engine = options.engine || 'text-davinci-002'
  const model = options.model || 'text-embedding-ada'

  const response = await openai.models(model).generate({
    prompt: text,
    n: 1,
    stop: '\n',
    engine,
  })

  return response.data.choices[0].text.trim().split(',').map(parseFloat)
}


pdf(dataBuffer).then(function (data: any) {
  // number of pages
  console.log(data.numpages);
  // number of rendered pages
  console.log(data.numrender);
  // PDF info
  console.log(data.info);
  // PDF metadata
  console.log(data.metadata);
  // PDF.js version
  // check https://mozilla.github.io/pdf.js/getting_started/
  console.log(data.version);
  // PDF text
  const fullText = data.text.replace(/\n+/g, "")
  const chunks = splitText(fullText, { maxTokens: 50});
  chunks.map(i => {
    return [cosineSimilarity(i, "Aerosols"), i]
  })

});