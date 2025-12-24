export async function POST(request) {
  try {
    // 1. Récupérer le message du widget
    const { message } = await request.json().catch(() => ({ message: "" }));
    const userMessage = (message || "").toString().trim();

    // 2. Envoyer la question au backend Python (RAG)
    const response = await fetch("http://localhost:8000/rag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: userMessage,
      }),
    });

    // 3. Récupérer la réponse de Python
    const data = await response.json();

    // 4. Retourner la réponse au widget
    return new Response(JSON.stringify({ reply: data.answer }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(">>> /api/chat error:", err);

    return new Response(
      JSON.stringify({ reply: "Erreur lors de la connexion au backend IA." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
