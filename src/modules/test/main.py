import os
import logging
import sys
from llama_index import SimpleDirectoryReader, GPTSimpleVectorIndex
from llama_index import ServiceContext, LLMPredictor, PromptHelper, ServiceContext
from llama_index.indices.vector_store.base_query import GPTVectorStoreIndexQuery, QueryBundle
import os
import logging
import sys
from llama_index import GPTSimpleVectorIndex
from langchain.chat_models.openai import ChatOpenAI
from langchain.llms.openai import OpenAIChat
from llama_index import Document
import PyPDF2
from tqdm import tqdm

from flask import Flask, request, jsonify

app = Flask(__name__)

os.environ["OPENAI_API_KEY"] = "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"
@app.route('/getRelatedText', methods=['POST'])
def getRelatedText():
  args = request.get_json()
  print(args["id"], args["queryText"])
  json_file = "cache/{}.json".format(args["id"])
  max_input_size = 4000
  chunk_size_limit = 500
  max_chunk_overlap = 20
  num_output = 3
  if (not os.path.exists(json_file) or True):
    # 读取data文件夹下的文档
    print(args["fullText"])
    documents = [Document(text=args["fullText"])]
    # 按最大token数500来把原文档切分为多个小的chunk，每个chunk转为向量，并构建索引
    llm_predictor = LLMPredictor(
        llm=ChatOpenAI(
          model_name="gpt-3.5-turbo-0301",
          openai_api_key=os.environ["OPENAI_API_KEY"]
        )
    )
    prompt_helper = PromptHelper(max_input_size=max_input_size, num_output=num_output, max_chunk_overlap=max_chunk_overlap,
                                embedding_limit=0, chunk_size_limit=chunk_size_limit, separator="\n\n")

    service_context = ServiceContext.from_defaults(
        llm_predictor=llm_predictor, prompt_helper=prompt_helper, chunk_size_limit=chunk_size_limit
    )
    index = GPTSimpleVectorIndex.from_documents(
        documents, service_context=service_context
    )
    # 保存索引
    index.save_to_disk(json_file)
  else:
    index = GPTSimpleVectorIndex.load_from_disk(json_file)

  llm_predictor = LLMPredictor(llm=OpenAIChat(
      temperature=0, model_name="gpt-3.5-turbo"))
  prompt_helper = PromptHelper(
      max_input_size=max_input_size, num_output=num_output, max_chunk_overlap=max_chunk_overlap, chunk_size_limit=50)
  service_context = ServiceContext.from_defaults(
      llm_predictor=llm_predictor, prompt_helper=prompt_helper)
  query_object = GPTVectorStoreIndexQuery(index.index_struct, service_context=service_context,
                                          similarity_top_k=num_output, vector_store=index._vector_store, docstore=index._docstore)
  query_bundle = QueryBundle(args["queryText"])
  nodes = query_object.retrieve(query_bundle)
  return jsonify([n.node.text for n in nodes])


if __name__ == '__main__':
    app.run(debug=True)






