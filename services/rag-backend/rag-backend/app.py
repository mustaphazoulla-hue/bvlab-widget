from fastapi import FastAPI
from pydantic import BaseModel
import os

from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

# ---------- Config FastAPI ----------
app = FastAPI()

class Question(BaseModel):
    query: str

# ---------- Chargement des documents ----------
docs_dir = "docs"
documents = []

if os.path.isdir(docs_dir):
    for file in os.listdir(docs_dir):
        if file.endswith(".txt"):
            loader = TextLoader(os.path.join(docs_dir, file), encoding="utf-8")
            documents.extend(loader.load())
else:
    print("Le dossier 'docs' n'existe pas encore")

# ---------- Chunking ----------
if documents:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(documents)
else:
    chunks = []

# ---------- Embeddings + Vector store ----------
if chunks:
    embeddings = OpenAIEmbeddings()  # nécessite OPENAI_API_KEY dans l'environnement
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory="./chroma_db"
    )
    retriever = vectordb.as_retriever(search_kwargs={"k": 4})
else:
    vectordb = None
    retriever = None

# ---------- LLM ----------
llm = ChatOpenAI(
    model="gpt-3.5-turbo",  # ou gpt-4o-mini si tu l'as
    temperature=0.2
)

# ---------- Endpoints ----------
@app.get("/")
def read_root():
    return {
        "status": "Backend Python OK",
        "nb_docs": len(documents),
        "nb_chunks": len(chunks)
    }

@app.post("/rag")
def rag_endpoint(question: Question):
    query = question.query

    if retriever is None:
        # Pas encore de docs indexés
        return {
            "answer": f"Je suis en ligne mais aucun document n'a été indexé. J'ai bien reçu ta question : {query}"
        }

    # 1. Récupérer les documents pertinents
    relevant_docs = retriever.invoke(query)
    context = "\n\n".join(doc.page_content for doc in relevant_docs)

    # 2. Construire le message pour l'IA
    messages = [
        {
            "role": "system",
            "content": (
                 "Tu es un assistant de BV Lab, cabinet de conseil en Data et Intelligence Artificielle.\n"
                "Tu réponds UNIQUEMENT à partir du contexte fourni.\n"
                "Tu n’as PAS le droit d’inventer, déduire ou compléter.\n"
                "Si la réponse n’est pas explicitement présente dans le contexte, "
                "réponds exactement : 'Je ne dispose pas de cette information.'"
            ),
        },
        {
            "role": "user",
            "content": f"Contexte :\n{context}\n\nQuestion : {query}\nRéponds en français de manière claire."
        },
    ]

    # 3. Appeler le LLM
    response = llm.invoke(messages)

    return {
        "answer": response.content
    }
