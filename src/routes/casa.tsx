import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useClientBook } from "@/lib/client-book";
import { formatBRL } from "@/lib/format";
import { followUpDraft, maisonAdvise, quietClients, type MaisonClient } from "@/lib/maison-ai";
import { whatsappUrl } from "@/lib/catalog";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/casa")({
  head: () =>
    pageHead({
      title: "Casa",
      description: "Caderno da casa. Uso interno.",
      path: "/casa",
      noindex: true,
    }),
  component: Casa,
});

function Casa() {
  const clients = useClientBook((s) => s.clients);
  const upsert = useClientBook((s) => s.upsert);
  const remove = useClientBook((s) => s.remove);
  const touch = useClientBook((s) => s.touch);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string>("");
  const client = clients.find((c) => c.id === picked) ?? null;
  const advice = useMemo(() => maisonAdvise(q || client?.notes || "", client), [q, client]);
  const quiet = quietClients(clients);
  const [form, setForm] = useState({ name: "", phone: "", size: "P", notes: "" });

  return (
    <article className="mx-auto max-w-xl px-6 py-16 text-[14px] leading-[1.85]">
      <h1 className="text-[11px] tracking-[0.32em] text-subtle uppercase">Casa</h1>
      <p className="mt-6 text-muted">
        Copiloto da Lucy. O caderno fica neste aparelho — não vai para nuvem. A IA só lê o
        catálogo da loja. A conversa com a cliente é sempre sua.
      </p>

      <label className="mt-12 block text-[11px] tracking-[0.22em] uppercase">Pedir à casa</label>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Maria, P, casamento no jardim"
        className="mt-2 h-12 w-full border-b border-line bg-transparent outline-none"
      />

      <ul className="mt-10 space-y-8">
        {advice.picks.map((x) => (
          <li key={x.product.slug}>
            <Link to="/produto/$slug" params={{ slug: x.product.slug }} className="flex gap-4">
              <img src={x.product.images[0]} alt="" className="h-24 w-16 object-cover object-top" />
              <span>
                <span className="block text-[11px] tracking-[0.18em] uppercase">{x.product.brand}</span>
                <span className="block">{x.product.shortName}</span>
                <span className="block text-muted">{x.why}</span>
                <span className="block text-muted">{x.sizeNote}</span>
                <span className="mt-1 block tabular-nums">{formatBRL(x.product.price)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <pre className="mt-10 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">{advice.draft}</pre>
      <p className="mt-4 flex flex-wrap gap-5 text-[11px] tracking-[0.2em] uppercase">
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(advice.draft)}
        >
          Copiar recado
        </button>
        <a href={advice.whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      </p>

      <h2 className="mt-16 text-[11px] tracking-[0.32em] text-subtle uppercase">Caderno</h2>
      <form
        className="mt-6 grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name) return;
          upsert(form);
          setForm({ name: "", phone: "", size: form.size, notes: "" });
        }}
      >
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome"
          className="h-11 border-b border-line bg-transparent outline-none"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="WhatsApp"
          className="h-11 border-b border-line bg-transparent outline-none"
        />
        <input
          value={form.size}
          onChange={(e) => setForm({ ...form, size: e.target.value })}
          placeholder="Tamanho"
          className="h-11 border-b border-line bg-transparent outline-none"
        />
        <input
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Ocasião, o que já tem no armário"
          className="h-11 border-b border-line bg-transparent outline-none"
        />
        <button type="submit" className="h-11 text-left text-[11px] tracking-[0.22em] uppercase">
          Guardar
        </button>
      </form>

      <ul className="mt-10 space-y-6">
        {clients.map((c) => (
          <ClientRow
            key={c.id}
            client={c}
            active={picked === c.id}
            onPick={() => {
              setPicked(c.id);
              setQ(`${c.name}, ${c.size}, ${c.notes}`.replace(/, ,/g, ",").replace(/,\s*$/, ""));
            }}
            onTouch={() => touch(c.id)}
            onRemove={() => remove(c.id)}
          />
        ))}
      </ul>

      {quiet.length > 0 && (
        <>
          <h2 className="mt-16 text-[11px] tracking-[0.32em] text-subtle uppercase">90 dias sem vir</h2>
          <ul className="mt-6 space-y-4">
            {quiet.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-4">
                <span>
                  {c.name}
                  <span className="ml-2 text-muted">{c.size}</span>
                </span>
                <a
                  href={whatsappUrl(followUpDraft(c))}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] tracking-[0.18em] uppercase"
                >
                  Recado
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

function ClientRow({
  client,
  active,
  onPick,
  onTouch,
  onRemove,
}: {
  client: MaisonClient;
  active: boolean;
  onPick: () => void;
  onTouch: () => void;
  onRemove: () => void;
}) {
  return (
    <li className={active ? "underline" : ""}>
      <button type="button" onClick={onPick} className="text-left">
        {client.name} · {client.size || "—"} · {client.lastVisit}
      </button>
      {client.notes ? <p className="text-muted">{client.notes}</p> : null}
      <p className="mt-1 flex gap-4 text-[10px] tracking-[0.18em] uppercase">
        <button type="button" onClick={onTouch}>
          Veio hoje
        </button>
        <button type="button" onClick={onRemove}>
          Apagar
        </button>
      </p>
    </li>
  );
}
