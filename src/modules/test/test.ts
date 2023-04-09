import { OpenAIEmbeddings } from 'langchain/embeddings';
import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAI } from "langchain";


// setTimeout(async () => {
//   await fetch('https://api.openai.com/v1/embeddings', {
//     method: 'POST',
//     headers: {
//       'Authorization': 'Bearer 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',
//       "content-type": "application/json"
//     },
//     body: JSON.stringify({
//       model: 'text-embedding-ada-002',
//       input: 'Hello world',
//     }),
//   }).then(i => console.log(i.json()))  
// })

export const run = async () => {
  const embeddings = new OpenAIEmbeddings({
    timeout: 1000, // 1s timeout
  });
  /* Embed queries */
  const res = await embeddings.embedQuery("Hello world");
  console.log(res);
  /* Embed documents */
  const documentRes = await embeddings.embedDocuments([
    "Hello world",
    "Bye bye",
  ]);
  console.log({ documentRes });
};

setTimeout(async () => { 
  await run()
})
