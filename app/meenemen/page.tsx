"use client";

import Link from "next/link";

const MENU = [
  {
    category: "Soep",
    emoji: "🍲",
    items: [
      { name: "Dag soep — keuze uit 2 soepen", price: "5,50" },
    ],
  },
  {
    category: "Voorgerechten",
    emoji: "🥟",
    items: [
      { name: "Mini loempia's — vegetarisch (8 stuk)", price: "5,50" },
      { name: "Kippensate (3 stuk)",                   price: "6,50" },
      { name: "Dim Sum (6 stuk)",                       price: "6,50" },
    ],
  },
  {
    category: "Hoofdgerechten",
    emoji: "🍜",
    items: [
      { name: "Gepaneerde kip met zoetzuur saus",             price: "15,00" },
      { name: "Kip blokjes met vers ananas zoetzuur saus",    price: "15,00" },
      { name: "Kip blokjes met curry saus",                   price: "15,00" },
      { name: "Eend met sinaasappelsaus",                     price: "18,00" },
      { name: "Ribbetjes met honing saus",                    price: "16,00" },
      { name: "Rundsvlees met zwartepeper saus",              price: "16,50" },
      { name: "Rundsvlees met chinese kruide saus",           price: "16,50" },
      { name: "Mariage à trois met rode wijn saus",           price: "17,00" },
      { name: "Scampi's met vers ananas zoetzuur saus",       price: "18,00" },
      { name: "Scampi's met look saus",                       price: "18,00" },
      { name: "Gemengde groenten met oestersaus",             price: "14,00" },
      { name: "Gemengde groenten met BBQ saus",               price: "14,00" },
      { name: "Nasi goreng met kipblokjes",                   price: "13,00" },
      { name: "Nasi goreng met scampi's",                     price: "15,00" },
      { name: "Nasi goreng klein",                            price: "5,50"  },
      { name: "Bami goreng met kipblokjes",                   price: "13,50" },
      { name: "Bami goreng met scampi's",                     price: "15,50" },
      { name: "Bami goreng klein",                            price: "6,50"  },
    ],
  },
];

export default function MeenemenPage() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-950 text-amber-50 font-lato">

      {/* ── NAVBAR ── */}
      <nav className="bg-stone-900 sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Han King logo"
              className="h-10 w-auto"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
            <span className="font-playfair text-xl font-bold tracking-wide text-amber-100">
              Han King Wok & Grill
            </span>
          </Link>
          <Link
            href="/"
            className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
          >
            ← Terug naar home
          </Link>
        </div>
      </nav>

      {/* ── HEADER ── */}
      <header className="py-16 px-6 text-center border-b border-stone-800">
        <p className="text-amber-500 text-sm uppercase tracking-widest font-semibold mb-3">
          Gerechten om mee te nemen
        </p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
          Afhaalgerechten
        </h1>
        <p className="text-stone-400 max-w-lg mx-auto mb-6">
          Bel ons voor uw bestelling — wij bereiden alles vers voor u klaar.
        </p>
        <a
          href="tel:016888013"
          className="inline-block bg-amber-500 text-stone-900 font-bold px-8 py-3 rounded-full hover:bg-amber-400 transition-colors text-lg"
        >
          📞 Bestel: 016 888 013
        </a>
      </header>

      {/* ── MENU ── */}
      <main className="max-w-3xl mx-auto w-full px-6 py-16 flex flex-col gap-14">
        {MENU.map(({ category, emoji, items }) => (
          <section key={category}>
            {/* Category header */}
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-amber-800/40">
              <span className="text-3xl">{emoji}</span>
              <h2 className="font-playfair text-2xl font-bold text-amber-400">{category}</h2>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-2">
              {items.map(({ name, price }) => (
                <div
                  key={name}
                  className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-stone-800/50 transition-colors group"
                >
                  <span className="text-stone-200 group-hover:text-white transition-colors">{name}</span>
                  <span className="text-amber-400 font-bold tabular-nums ml-4 shrink-0">€ {price}</span>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Notes */}
        <section className="bg-stone-800/50 rounded-2xl p-6 border border-stone-700 flex flex-col gap-3">
          <h3 className="font-playfair text-lg font-bold text-amber-400 mb-1">📌 Te weten</h3>
          <p className="text-stone-300 text-sm">✓ Alle hoofdgerechten worden geserveerd met <strong>nasi goreng</strong></p>
          <p className="text-stone-300 text-sm">✓ Bami goreng in plaats van nasi: <strong>+ €2,50</strong></p>
          <p className="text-stone-300 text-sm">✓ Extra saus: <strong>€3,00</strong></p>
        </section>

        {/* Opening hours for takeaway */}
        <section className="bg-stone-800/50 rounded-2xl p-6 border border-stone-700">
          <h3 className="font-playfair text-lg font-bold text-amber-400 mb-4">🕐 Afhaaluren</h3>
          <div className="flex flex-col gap-2 text-sm">
            {[
              { day: "Maandag – Dinsdag", hours: "Gesloten", closed: true },
              { day: "Woensdag – Donderdag", hours: "12:00–14:00  |  17:30–21:30", closed: false },
              { day: "Vrijdag – Zaterdag",   hours: "12:00–14:00  |  17:30–21:30", closed: false },
              { day: "Zondag & feestdagen",  hours: "12:00–15:00  |  17:30–21:30", closed: false },
            ].map(({ day, hours, closed }) => (
              <div key={day} className="flex justify-between px-4 py-2 rounded-lg bg-stone-900/50">
                <span className="text-stone-300">{day}</span>
                <span className={closed ? "text-red-400" : "text-green-400"}>{hours}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-stone-400 mb-4">Bel ons om uw bestelling te plaatsen</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:016888013"
              className="bg-amber-500 text-stone-900 font-bold px-8 py-3 rounded-full hover:bg-amber-400 transition-colors">
              📞 016 888 013
            </a>
            <a href="tel:0476719374"
              className="bg-amber-500 text-stone-900 font-bold px-8 py-3 rounded-full hover:bg-amber-400 transition-colors">
              📞 0476 71 93 74
            </a>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-stone-900 text-stone-500 text-center py-6 text-sm mt-auto">
        <p>© {new Date().getFullYear()} Han King Wok & Grill — Leuvensesteenweg 268, 3390 Tielt-Winge</p>
      </footer>
    </div>
  );
}
