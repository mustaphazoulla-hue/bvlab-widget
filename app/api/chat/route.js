// app/api/chat/route.js
// API simple "statique" / rule-based pour le widget (pas d'OpenAI)

export async function POST(request) {
  try {
    const { message } = await request.json().catch(() => ({ message: "" }));
    const text = (message || "").toString().trim().toLowerCase();

    // réponses pré-définies / règles simples
    const rules = [
      { test: m => /bonjour|salut|hello/.test(m), reply: "Bonjour ! Je suis le chat BVLAB. Comment puis-je vous aider ?" },
      { test: m => /prix|tarif|coût/.test(m), reply: "Pour les tarifs, peux-tu préciser le service concerné ?" },
      { test: m => /horai?re|ouvert|fermé/.test(m), reply: "Nos horaires sont du lundi au vendredi, 9h-18h." },
      { test: m => /contact|email|téléphone/.test(m), reply: "Tu peux nous contacter à contact@bvlab.example ou au +212 6 XX XX XX XX." },
      { test: m => /merci|super|top/.test(m), reply: "Avec plaisir 😊 ! N'hésite pas si tu as d'autres questions." }
    ];

    // chercher une règle correspondante
    let reply = null;
    for (const r of rules) {
      if (r.test(text)) { reply = r.reply; break; }
    }

    // réponse par défaut si aucune règle
    if (!reply) {
      reply = "Désolé, je n'ai pas compris. Peux-tu reformuler ou poser une autre question ?";
    }

    // réponse au format attendu par le widget
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(">>> /api/chat static unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500, headers: { "Content-Type": "application/json" }});
  }
}