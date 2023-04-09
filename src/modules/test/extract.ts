import { PineconeClient } from "@pinecone-database/pinecone";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings";
import { PineconeStore } from "langchain/vectorstores";

import { VectorDBQAChain } from "langchain/chains";

import { OpenAI } from "langchain/llms";

import { config } from "../../package.json";


export default class Extract {
  readonly secretKey = Zotero.Prefs.get(`${config.addonRef}.secretKey`) as string
  constructor() {
  }

  public async test() {

    const run = async () => {
      const embeddings = new OpenAIEmbeddings({
        timeout: 1000, // 1s timeout
        openAIApiKey: this.secretKey
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

    await run()
  }
  public async index() {
    const client = new PineconeClient();
    client.projectName = "Test"
    await client.init({
      apiKey: this.secretKey,
      environment: "",
    });
    const pineconeIndex = client.Index("test");

    const docs = [
      new Document({
        metadata: { foo: "bar" },
        pageContent: "pinecone is a vector db",
      }),
      new Document({
        metadata: { foo: "bar" },
        pageContent: "the quick brown fox jumped over the lazy dog",
      }),
      new Document({
        metadata: { baz: "qux" },
        pageContent: "lorem ipsum dolor sit amet",
      }),
      new Document({
        metadata: { baz: "qux" },
        pageContent: "pinecones are the woody fruiting body and of a pine tree",
      }),
    ];

    await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
      pineconeIndex,
    });
  }

  public async query() {
    const client = new PineconeClient();
    await client.init({
      apiKey: this.secretKey,
      environment: "",
    });
    const pineconeIndex = client.Index("test");

    const vectorStore = await PineconeStore.fromExistingIndex(
      new OpenAIEmbeddings(),
      { pineconeIndex }
    );

    /* Search the vector DB independently with meta filters */
    const results = await vectorStore.similaritySearch("pinecone", 1, {
      foo: "bar",
    });
    console.log(results);
    /*
    [
      Document {
        pageContent: 'pinecone is a vector db',
        metadata: { foo: 'bar' }
      }
    ]
    */

    /* Use as part of a chain (currently no metadata filters) */
    const model = new OpenAI();
    const chain = VectorDBQAChain.fromLLM(model, vectorStore, {
      k: 1,
      returnSourceDocuments: true,
    });
    const response = await chain.call({ query: "What is pinecone?" });
    console.log(response);
  }
}