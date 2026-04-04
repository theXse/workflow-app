"use client";

import { useState, useRef, useEffect } from "react";

const QUICK_ACTIONS = [
  { label: "📋 Pendientes", message: "¿Cuáles son mis tareas pendientes?" },
  { label: "👀 Con cliente", message: "¿Qué tareas están esperando respuesta del cliente?" },
  { label: "✅ Aprobado", message: "¿Qué contenidos fueron aprobados recientemente?" },
  { label: "📅 Recordatorios", message: "¿Qué recordatorios tengo próximamente?" },
];

export default function AsistentePage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "¡Hola Xime! 👋 Soy tu asistente de La Ruta. Puedo ayudarte a revisar tareas, aprobaciones y recordatorios. ¿En qué te ayudo hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userMsg = text.trim();
    if (!userMsg || loading) return;

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Lo siento, no pude procesar tu consulta." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error al conectar. Intenta nuevamente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-2xl mx-auto px-2 sm:px-4">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-t-xl mt-2"
        style={{ backgroundColor: "#3B4A30" }}
      >
        <h1 className="text-white font-bold text-base sm:text-lg tracking-tight">
          Asistente Civilia
        </h1>
        <span
          className="text-white text-xs font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: "#F07B1F" }}
        >
          La Ruta
        </span>
      </div>

      {/* Quick action buttons */}
      <div
        className="flex flex-wrap gap-2 px-3 py-2 border-b border-zinc-700"
        style={{ backgroundColor: "#2e3a22" }}
      >
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.message)}
            disabled={loading}
            className="text-white text-[11px] sm:text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#3B4A30", border: "1px solid #F07B1F" }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3 px-2" style={{ backgroundColor: "#1a1a1a" }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : "text-zinc-900 rounded-bl-sm"
              }`}
              style={{
                backgroundColor: msg.role === "user" ? "#3B4A30" : "#ffffff",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ backgroundColor: "#ffffff" }}
            >
              <span className="flex gap-1 items-center">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 px-3 py-3 border-t border-zinc-800 bg-zinc-900 rounded-b-xl"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta..."
          disabled={loading}
          className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-full outline-none focus:ring-2 disabled:opacity-50"
          style={{ focusRingColor: "#F07B1F" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="text-white font-bold text-sm px-5 py-2.5 rounded-full transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#F07B1F" }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
