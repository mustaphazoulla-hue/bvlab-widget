from fastapi import FastAPI
from pydantic import BaseModel
import os

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

app = FastAPI()

class Question(BaseModel):
    query: str

#  1. Charger les documents 
docs_dir = "docs"
documents = []

if os.path.isdir(docs_dir):
    for file in os.listdir(docs_dir):
        if file.endswith(".txt"):
            loader = TextLoader(os.path.join(docs_dir, file), encoding="utf-8")
            documents.extend(loader.load())
else:
    print("Le dossier 'docs' n'existe pas")

#  2. Chunking (découpage) 
if documents:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100
    )
    chunks = splitter.split_documents(documents)
else:
    chunks = []

#  3. Embeddings + Chroma 
if chunks:
    embeddings = OpenAIEmbeddings()  # nécessite OPENAI_API_KEY
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="./chroma_db"
    )
    retriever = vectordb.as_retriever(search_kwargs={"k": 3})
else:
    vectordb = None
    retriever = None

llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0.2
)

# 5. Endpoints ----------

@app.get("/")
def read_root():
    return {
        "status": "Backend Python OK",
        "nb_docs": len(documents),
        "nb_chunks": len(chunks),
        "index_ready": vectordb is not None
    }

@app.post("/rag")
def rag_endpoint(question: Question):
    query = question.query

    if retriever is None:
        return {
            "answer": f"Je suis en ligne mais aucun document n'a été indexé. J'ai bien reçu ta question : {query}"
        }

    # 1) Récupérer les passages pertinents
    relevant_docs = retriever.invoke(query)

    if not relevant_docs:
        return {
            "answer": "Je ne trouve aucune information correspondante dans les documents."
        }

    # Contexte = textes trouvés
    context = "\n\n".join(doc.page_content for doc in relevant_docs)

    # 2) Construire le prompt pour l'IA
    messages = [
    {
        "role": "system",
  "content": (
      "Tu es l’assistant officiel de BV Lab (Data Consulting & IA). "
      "Tu dois répondre en utilisant UNIQUEMENT les informations présentes dans le contexte fourni.\n\n"

      "RÈGLES DE RÉPONSE :\n"
      "- Utilise l’information du contexte même si les mots ne sont pas exactement identiques.\n"
      "- Si la question concerne les services, projets ou contacts, utilise les parties correspondantes du contexte.\n"
      "- Répond de manière courte, claire et directe.\n"
      "- Si aucune information du contexte ne correspond, réponds : 'Je ne dispose pas de cette information.'\n\n"

      "INTERDICTIONS :\n"
      "- Ne jamais inventer.\n"
      "- Ne jamais ajouter des informations externes.\n"
      "- Ne jamais faire de supposition.\n"
        ),
    },
    {
        "role": "user",
        "content": (
            f"Contexte :\n{context}\n\n"
            f"Question de l'utilisateur : {query}\n\n"
            "Réponds en français, de manière courte et précise, "
            "en répondant uniquement à la question."
        ),
    },
    ]


    response = llm.invoke(messages)
    answer = response.content.strip()

    if "je ne sais pas" in answer.lower():
        answer = (
            "Voici les informations trouvées dans les documents :\n\n"
            + context
        )

    return {
        "answer": answer
    }
