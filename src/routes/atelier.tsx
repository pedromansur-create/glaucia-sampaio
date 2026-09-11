import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { whatsappUrl } from "@/lib/catalog";

export const Route = createFileRoute("/atelier")({ component: Atelier });

function Atelier() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [event, setEvent] = useState("Casamento de dia");
  const [note, setNote] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    window.open(
      whatsappUrl(`Olá, sou ${name}. Preciso de personal shopper para: ${event}. ${note}`),
      "_blank",
    );
    setSent(true);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2 md:px-10">
      <div>
        <p className="text-[11px] tracking-[0.28em] text-subtle uppercase">Atelier 4.0</p>
        <h1 className="mt-2 font-display text-5xl md:text-6xl">Personal shopper, sem fila.</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          Conte o evento, a altura, o que já tem no armário. A casa responde com duas ou três
          peças — não com um catálogo. WhatsApp, vídeo, ou na Rua Rodolfo Correa.
        </p>
        <img src="/looks/eva.jpg" alt="" className="mt-10 rounded-xl object-cover" />
      </div>
      <form onSubmit={onSubmit} className="rounded-xl bg-paper p-8">
        <label className="block text-xs tracking-widest uppercase">Nome</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 mb-5 h-12 w-full rounded-md border border-line bg-bg px-3 outline-none"
        />
        <label className="block text-xs tracking-widest uppercase">Ocasião</label>
        <select
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          className="mt-2 mb-5 h-12 w-full rounded-md border border-line bg-bg px-3 outline-none"
        >
          <option>Casamento de dia</option>
          <option>Madrinha</option>
          <option>Evento noturno</option>
          <option>Resort</option>
          <option>All White</option>
          <option>Workwear</option>
        </select>
        <label className="block text-xs tracking-widest uppercase">O que precisa</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          placeholder="Altura, tamanho habitual, data do evento…"
          className="mt-2 mb-6 w-full rounded-md border border-line bg-bg p-3 outline-none"
        />
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-pill bg-ink text-xs tracking-[0.2em] text-paper uppercase"
        >
          {sent ? "Abrindo WhatsApp" : "Falar com a shopper"}
        </button>
      </form>
    </div>
  );
}
