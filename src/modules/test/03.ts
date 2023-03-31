import axios from 'axios'

async function get_embedding(text: string, options: { engine?: string, model?: string } = {}) {
  const model = options.model || 'text-davinci-002'

  const response = await axios.post(`https://api.openai.com/v1/embeddings`, {
    input: text,
    n: 1,
    stop: '\n',
    model,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer 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`,
    },
  })

  // return response.data.choices[0].text.trim().split(',').map(parseFloat)
  return response.data
}
setTimeout(async () => {
  console.log(await get_embedding("你好啊"))
})