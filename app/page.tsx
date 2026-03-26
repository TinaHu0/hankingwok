"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Opening hours ───────────────────────────────────────────
const HOURS = {
  0: null, // Sunday – see SUNDAY_HOURS
  1: null, // Monday – closed
  2: null, // Tuesday – closed
  3: { open: "12:00", close: "14:30", dinner: { open: "17:30", close: "21:30" } }, // Wednesday
  4: { open: "12:00", close: "14:30", dinner: { open: "17:30", close: "21:30" } }, // Thursday
  5: { open: "12:00", close: "14:30", dinner: { open: "17:30", close: "22:00" } }, // Friday
  6: { open: "12:00", close: "14:30", dinner: { open: "17:30", close: "22:00" } }, // Saturday
};

const SUNDAY_HOURS = { open: "12:00", close: "15:00", dinner: { open: "17:30", close: "21:30" } };
const DAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];

// ─── Easter calculation (Anonymous Gregorian algorithm) ──────
function getEaster(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isBelgianHoliday(date: Date): boolean {
  const year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
  const fixed = [[1,1],[5,1],[7,21],[8,15],[11,1],[11,11],[12,25],[12,26]];
  if (fixed.some(([m, d]) => m === month && d === day)) return true;
  const easter = getEaster(year);
  const variable = [easter, addDays(easter,1), addDays(easter,39), addDays(easter,49), addDays(easter,50)];
  return variable.some(d => d.getFullYear()===year && d.getMonth()+1===month && d.getDate()===day);
}

function getNextOpening(now: Date): string {
  const toMins = (t: string) => { const [h,m] = t.split(":").map(Number); return h*60+m; };
  const currentMins = now.getHours() * 60 + now.getMinutes();
  for (let offset = 0; offset <= 7; offset++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + offset);
    const isToday = offset === 0;
    const checkDay = checkDate.getDay();
    const label = offset===0 ? "vandaag" : offset===1 ? "morgen" : DAY_NAMES[checkDay].toLowerCase();
    let sessions: { open: string; close: string }[] = [];
    if (isBelgianHoliday(checkDate)) {
      sessions = [{open:SUNDAY_HOURS.open,close:SUNDAY_HOURS.close},{open:SUNDAY_HOURS.dinner.open,close:SUNDAY_HOURS.dinner.close}];
    } else if (checkDay===1||checkDay===2) {
      continue;
    } else if (checkDay===0) {
      sessions = [{open:SUNDAY_HOURS.open,close:SUNDAY_HOURS.close},{open:SUNDAY_HOURS.dinner.open,close:SUNDAY_HOURS.dinner.close}];
    } else {
      const h = HOURS[checkDay as keyof typeof HOURS];
      if (!h) continue;
      sessions = [{open:h.open,close:h.close},{open:h.dinner.open,close:h.dinner.close}];
    }
    for (const session of sessions) {
      if (!isToday || currentMins < toMins(session.open)) return `${label} om ${session.open}`;
    }
  }
  return "";
}

function getStatus(): "open"|"closed"|"holiday-open"|"holiday-closed" {
  const now = new Date();
  const timeStr = now.getHours()*60+now.getMinutes();
  const toMins = (t: string) => { const [h,m]=t.split(":").map(Number); return h*60+m; };
  if (isBelgianHoliday(now)) {
    const {open,close,dinner} = SUNDAY_HOURS;
    if (timeStr>=toMins(open)&&timeStr<toMins(close)) return "holiday-open";
    if (timeStr>=toMins(dinner.open)&&timeStr<toMins(dinner.close)) return "holiday-open";
    return "holiday-closed";
  }
  const day = now.getDay();
  if (day===1||day===2) return "closed";
  if (day===0) {
    const {open,close,dinner} = SUNDAY_HOURS;
    if (timeStr>=toMins(open)&&timeStr<toMins(close)) return "open";
    if (timeStr>=toMins(dinner.open)&&timeStr<toMins(dinner.close)) return "open";
    return "closed";
  }
  const hours = HOURS[day as keyof typeof HOURS];
  if (!hours) return "closed";
  if (timeStr>=toMins(hours.open)&&timeStr<toMins(hours.close)) return "open";
  if (timeStr>=toMins(hours.dinner.open)&&timeStr<toMins(hours.dinner.close)) return "open";
  return "closed";
}

// ─── Seasonal helpers ────────────────────────────────────────
function isFeestmenuSeason(): boolean {
  const now = new Date(); const month = now.getMonth()+1; const day = now.getDate();
  if (month===11&&day>=15) return true;
  if (month===12) return true;
  if (month===1&&day<=2) return true;
  return false;
}

// Christmas gallery: 11 november – 11 januari (wider than feestmenu season)
function isChristmasGallerySeason(): boolean {
  const now = new Date(); const month = now.getMonth()+1; const day = now.getDate();
  if (month===11&&day>=11) return true;
  if (month===12) return true;
  if (month===1&&day<=11) return true;
  return false;
}

function isEasterMondayPromo(): boolean {
  const now = new Date();
  const easterMonday = addDays(getEaster(now.getFullYear()), 1);
  const threeWeeksBefore = addDays(easterMonday, -21);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return today >= threeWeeksBefore && today <= easterMonday;
}

function isValentijnsSeason(): boolean {
  const now = new Date();
  return now.getMonth() === 1 && now.getDate() <= 20; // 1–20 februari
}

// Moederdag (2e zondag van mei in België): toon van 25 april t/m 15 mei
function isMoederdagSeason(): boolean {
  const now = new Date(); const month = now.getMonth()+1; const day = now.getDate();
  if (month === 4 && day >= 25) return true;
  if (month === 5 && day <= 15) return true;
  return false;
}

// ─────────────────────────────────────────────────────────────
// 🎄 FEESTMENU PRIJZEN — update deze elk jaar vóór 15 november
// ─────────────────────────────────────────────────────────────
const FEESTMENU_PRIJZEN = {
  kerstAvond:     "", // 24 dec diner
  kerstdag:       "", // 25 dec lunch & diner
  oudejaarsAvond: "", // 31 dec diner
  nieuwjaarsdag:  "", // 01 jan lunch & diner
};
// ─────────────────────────────────────────────────────────────

// ─── Gallery photos ──────────────────────────────────────────
const RESTAURANT_PHOTOS = [
  { src: "/restaurant sfeer/restaurant 1.jpg",  alt: "Restaurantzaal" },
  { src: "/restaurant sfeer/tafel.jpg",          alt: "Gedekte tafel" },
  { src: "/restaurant sfeer/feest .jpg",         alt: "Feestelijke sfeer" },
  { src: "/restaurant sfeer/IMG_8864.jpg",       alt: "Restaurantsfeer" },
  { src: "/restaurant sfeer/trots cat.jpg",      alt: "Gelukskat" },
  { src: "/restaurant sfeer/WeChat Image_20230325123414.jpg", alt: "Restaurantsfeer 2" },
];

const CHRISTMAS_PHOTOS = [
  { src: "/christmas deco/kerstboom.JPG",             alt: "Kerstboom" },
  { src: "/christmas deco/kerst verziering.JPG",      alt: "Kerstversiering" },
  { src: "/christmas deco/kerst verziering 2.JPG",    alt: "Kerstversiering 2" },
  { src: "/christmas deco/kerst verziering 3.JPG",    alt: "Kerstversiering 3" },
  { src: "/christmas deco/klein raam verziering.JPG", alt: "Raamversiering" },
  { src: "/christmas deco/raam verziering.jpg",       alt: "Raamdecoratie" },
  { src: "/christmas deco/raam verziering 2.jpg",     alt: "Raamdecoratie 2" },
  { src: "/christmas deco/buffet.JPG",                alt: "Kerstbuffet" },
  { src: "/christmas deco/cavaglasmetbloem.jpg",      alt: "Feeststemming" },
];

const VALENTIJN_PHOTOS = [
  { src: "/Valentijn/fijne valentijs-dag.jpg",       alt: "Valentijn sfeer" },
  { src: "/Valentijn/happy falentine;s day.jpg",     alt: "Happy Valentine" },
  { src: "/Valentijn/valentijshartje.jfif",          alt: "Valentijnshartje" },
];

const MOEDERDAG_PHOTOS = [
  { src: "/mother's day/photo-1514925312285-7a2c94c2c095.avif", alt: "Moederdag bloemen 1" },
  { src: "/mother's day/photo-1528743061033-811f9c409881.avif", alt: "Moederdag bloemen 2" },
  { src: "/mother's day/photo-1539920951450-2b2d59cff66d.avif", alt: "Moederdag bloemen 3" },
  { src: "/mother's day/photo-1542385151-efd9000785a0.avif",    alt: "Moederdag bloemen 4" },
  { src: "/mother's day/photo-1557868382-ec969b11dbaf.avif",    alt: "Moederdag bloemen 5" },
];

const PASSEN_PHOTOS = [
  { src: "/Passen/WeChat Image_20230325123334.jpg", alt: "Pasen sfeer 1" },
  { src: "/Passen/WeChat Image_20230325123403.jpg", alt: "Pasen sfeer 2" },
  { src: "/Passen/WeChat Image_20230325123409.jpg", alt: "Pasen sfeer 3" },
  { src: "/Passen/WeChat Image_20230325123420.jpg", alt: "Pasen sfeer 4" },
  { src: "/Passen/WeChat Image_20230325123431.jpg", alt: "Pasen sfeer 5" },
  { src: "/Passen/WeChat Image_20230325123438.jpg", alt: "Pasen sfeer 6" },
  { src: "/Passen/WeChat Image_20230325133104.jpg", alt: "Pasen sfeer 7" },
];

// ─── Photo grid component ─────────────────────────────────────
function PhotoGrid({ photos, onPhotoClick }: { photos: { src: string; alt: string }[]; onPhotoClick?: (src: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {photos.map((photo, i) => (
        <div key={i} className="overflow-hidden rounded-xl aspect-square shadow-md group cursor-pointer"
          onClick={() => onPhotoClick?.(photo.src)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.alt}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
export default function Home() {
  const [status, setStatus] = useState<"open"|"closed"|"holiday-open"|"holiday-closed">("closed");
  const [isHoliday, setIsHoliday] = useState(false);
  const [nextOpening, setNextOpening] = useState("");
  const [showFeestmenu, setShowFeestmenu] = useState(false);
  const [showEasterBadge, setShowEasterBadge] = useState(false);
  const [showValentijn, setShowValentijn] = useState(false);
  const [showChristmasGallery, setShowChristmasGallery] = useState(false);
  const [showMoederdag, setShowMoederdag] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroOffset, setHeroOffset] = useState(0);
  const [lightbox, setLightbox] = useState<string|null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setHeroOffset(window.scrollY * 0.35);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll reveal: add "visible" class when section enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const s = getStatus();
      setStatus(s);
      setIsHoliday(isBelgianHoliday(now));
      setShowFeestmenu(isFeestmenuSeason());
      setShowEasterBadge(isEasterMondayPromo());
      setShowValentijn(isValentijnsSeason());
      setShowChristmasGallery(isChristmasGallerySeason());
      setShowMoederdag(isMoederdagSeason());
      if (s==="closed"||s==="holiday-closed") setNextOpening(getNextOpening(now));
      else setNextOpening("");
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  // Hero background changes with the season
  const heroBg = showChristmasGallery
    ? "/christmas deco/kerstboom.JPG"
    : showValentijn
    ? "/Valentijn/fijne valentijs-dag.jpg"
    : showMoederdag
    ? "/mother's day/photo-1514925312285-7a2c94c2c095.avif"
    : showEasterBadge
    ? "/Passen/WeChat Image_20230325123431.jpg"
    : "/restaurant sfeer/restaurant 1.jpg"; // default: restaurant

  return (
    <div className="flex flex-col min-h-screen font-lato">

      {/* ── NAVBAR ── */}
      <nav className={`text-amber-100 sticky top-0 z-50 transition-all duration-500 ${scrolled ? "bg-stone-900 shadow-lg" : "bg-stone-900/40 backdrop-blur-sm"}`}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo + name */}
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo/hanking_logo_symbol_TRANSPARENT.png"
              alt="Han King symbool"
              className="h-10 w-auto"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo/hanking_logo_text_transparent_final.png"
              alt="Han King Wok & Grill"
              className="h-8 w-auto brightness-110"
            />
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex gap-6 text-sm font-medium items-center">
            <a href="#hours"   className="hover:text-amber-400 transition-colors">Openingsuren</a>
            <a href="#menu"    className="hover:text-amber-400 transition-colors">Menu</a>
            <a href="#gallery" className="hover:text-amber-400 transition-colors">Galerij</a>
            <a href="#about"   className="hover:text-amber-400 transition-colors">Ervaring</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
            <Link href="/meenemen" className="hover:text-amber-400 transition-colors">Afhaal Menu</Link>
            <a href="tel:016888013" className="bg-amber-500 text-stone-900 px-4 py-1.5 rounded-full font-bold hover:bg-amber-400 transition-colors">
              Reserveer
            </a>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-amber-100 text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-stone-800 px-6 pb-4 flex flex-col gap-3 text-sm font-medium">
            {["#hours","#menu","#gallery","#about","#contact"].map((href, i) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="hover:text-amber-400 transition-colors py-1 border-b border-stone-700">
                {["Openingsuren","Menu","Galerij","Ervaring","Contact"][i]}
              </a>
            ))}
            <Link href="/meenemen" onClick={() => setMenuOpen(false)}
              className="hover:text-amber-400 transition-colors py-1 border-b border-stone-700">
              Afhaal Menu
            </Link>
            <a href="tel:016888013" className="bg-amber-500 text-stone-900 px-4 py-2 rounded-full font-bold text-center mt-2">
              Reserveer
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative bg-stone-900 text-white min-h-screen flex items-center justify-center px-6 text-center overflow-hidden -mt-[72px]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60 transition-[background-image] duration-1000"
          style={{ backgroundImage: `url('${heroBg}')`, transform: `translateY(${heroOffset}px)`, top: "-10%", height: "120%" }}
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/80 via-stone-900/30 to-stone-900/80" />

        <div className="relative z-10 max-w-3xl mx-auto pt-20">
          {showEasterBadge && (
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-br from-amber-800 via-yellow-900 to-stone-900 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl border border-amber-700/50 tracking-wide">
                🐣 Open op Paasmaandag
                <div className="text-amber-300 text-sm font-normal mt-1">12:00–15:00 &amp; 17:30–21:30</div>
              </div>
            </div>
          )}
          {showValentijn && !showEasterBadge && (
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-br from-red-900 via-rose-900 to-stone-900 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl border border-red-700/50 tracking-wide">
                💝 Valentijnsdag — Diner voor twee
                <div className="text-red-300 text-sm font-normal mt-1">Reserveer op tijd: 016 888 013</div>
              </div>
            </div>
          )}
          {showFeestmenu && !showEasterBadge && !showValentijn && (
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-br from-amber-800 via-yellow-900 to-stone-900 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl border border-amber-700/50 tracking-wide">
                🎄 Open Tijdens Kerst en Nieuwjaar
                <div className="text-amber-300 text-sm font-normal mt-1">Speciaal feestmenu beschikbaar</div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-5 mb-8 hero-symbol-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo/hanking_logo_symbol_TRANSPARENT.png"
              alt="Han King symbool"
              className="h-36 md:h-48 w-auto drop-shadow-2xl"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo/hanking_logo_text_transparent_final.png"
              alt="Han King Wok & Grill"
              className="h-14 md:h-20 w-auto"
              style={{ filter: "brightness(1.8) drop-shadow(0 2px 12px rgba(0,0,0,1))" }}
            />
          </div>
          <p className="text-amber-300/80 text-xs uppercase tracking-[0.3em] font-medium mb-4 hero-tagline-in">
            Aziatisch &amp; Europees restaurant — Tielt-Winge
          </p>
          <p className="text-stone-300 text-base mb-10 max-w-lg mx-auto leading-relaxed hero-sub-in">
            Van soep tot wok, van grill tot dessert — een complete culinaire beleving voor het hele gezin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center hero-buttons-in">
            <a href="tel:016888013"
              className="bg-amber-500 text-stone-900 font-bold px-10 py-3.5 rounded-full hover:bg-amber-400 transition-colors tracking-wide">
              Reserveer — 016 888 013
            </a>
            <a href="#menu"
              className="border border-white/50 text-white font-medium px-10 py-3.5 rounded-full hover:bg-white/10 transition-colors tracking-wide">
              Bekijk het menu
            </a>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 bounce-slow hero-scroll-in flex flex-col items-center gap-1 text-white/40">
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M8 13l-4-4M8 13l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ── OPEN NOW BANNER ── */}
      <div className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold tracking-wide ${
        status==="open"||status==="holiday-open" ? "bg-green-700 text-white" : "bg-stone-800 text-white"
      }`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className={`pulse-dot relative inline-flex rounded-full h-2.5 w-2.5 ${status==="open"||status==="holiday-open" ? "bg-green-300" : "bg-red-400"}`} />
        </span>
        {status==="open"||status==="holiday-open"
          ? "Wij zijn momenteel OPEN"
          : nextOpening
          ? `Wij zijn momenteel gesloten — wij openen ${nextOpening}`
          : "Wij zijn momenteel gesloten"}
      </div>

      {/* ── HOLIDAY NOTICE ── */}
      {isHoliday && (
        <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-800 px-6 py-4 text-sm text-center">
          🎉 <strong>Vandaag is een officiële feestdag.</strong> Wij zijn open van <strong>12:00–15:00</strong> en <strong>17:30–21:30</strong>.
          Prijzen kunnen afwijken — bel voor info:{" "}
          <a href="tel:016888013" className="font-bold underline">016 888 013</a> of{" "}
          <a href="tel:0476719374" className="font-bold underline">0476 71 93 74</a>
        </div>
      )}

      {/* ── OPENING HOURS ── */}
      <section id="hours" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto reveal">
          <h2 className="font-playfair text-3xl font-bold text-center mb-2">Openingsuren</h2>
          <p className="text-center text-stone-500 mb-10">Standaard openingsuren — feestdagen kunnen afwijken</p>
          <div className="grid gap-3">
            {[
              { day: "Maandag",   hours: "Gesloten" },
              { day: "Dinsdag",   hours: "Gesloten" },
              { day: "Woensdag",  hours: "12:00–14:30  |  17:30–21:30" },
              { day: "Donderdag", hours: "12:00–14:30  |  17:30–21:30" },
              { day: "Vrijdag",   hours: "12:00–14:30  |  17:30–22:00" },
              { day: "Zaterdag",  hours: "12:00–14:30  |  17:30–22:00" },
              { day: "Zondag",    hours: "12:00–15:00  |  17:30–21:30" },
            ].map(({ day, hours }) => {
              const isClosed = hours === "Gesloten";
              const isToday = day === DAY_NAMES[new Date().getDay()];
              return (
                <div key={day} className={`flex justify-between px-6 py-3 rounded-lg ${
                  isToday ? "bg-amber-100 border border-amber-400 font-bold" : "bg-stone-50"
                }`}>
                  <span>{day}{isToday && " (vandaag)"}</span>
                  <span className={isClosed ? "text-red-500" : "text-green-700"}>{hours}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center text-stone-500 text-sm space-y-1">
            <p>Op officiële feestdagen open van 12:00–15:00 &amp; 17:30–21:30 — prijzen variëren.</p>
            <p>Bel voor info:{" "}
              <a href="tel:016888013" className="text-amber-600 font-semibold whitespace-nowrap">016 888 013</a>{" "}of{" "}
              <a href="tel:0476719374" className="text-amber-600 font-semibold whitespace-nowrap">0476 71 93 74</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── MENU HIGHLIGHTS ── */}
      <section id="menu" className="py-20 px-6 bg-stone-100">
        <div className="max-w-5xl mx-auto reveal">
          <h2 className="font-playfair text-3xl font-bold text-center mb-2">Onze Formules</h2>
          <p className="text-center text-stone-500 mb-12">Voor elk moment het perfecte aanbod</p>
          <div className="grid md:grid-cols-3 gap-6">

            {/* Lunchbuffet */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <h3 className="font-playfair text-xl font-bold">Lunchbuffet</h3>
              <div>
                <span className="text-2xl font-bold text-amber-600">€23</span>
                <span className="text-stone-500 text-sm ml-2">per persoon</span>
              </div>
              <ul className="text-stone-600 text-sm leading-relaxed space-y-1">
                <li>✓ Woensdag t/m zaterdag middag</li>
                <li className="text-stone-400 text-xs italic">⚠ Zondag & feestdagen: dinerformule (geen lunchbuffet)</li>
                <li>✓ Kinderen 3–11 jaar: halve prijs</li>
                <li>✓ Kinderen onder 3 jaar: gratis</li>
              </ul>
            </div>

            {/* Diner Buffet */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <h3 className="font-playfair text-xl font-bold">Diner Buffet</h3>
              <div className="space-y-1">
                {(() => {
                  const d = new Date().getDay();
                  const isWeekend = d===5||d===6||d===0||isBelgianHoliday(new Date());
                  return (
                    <>
                      <div className={`flex justify-between px-3 py-1 rounded-lg text-sm ${!isWeekend?"bg-amber-100 border border-amber-400 font-bold":""}`}>
                        <span>Woensdag & Donderdag (2u30)</span>
                        <span className="text-amber-600 font-bold">€35,50</span>
                      </div>
                      <div className={`flex justify-between px-3 py-1 rounded-lg text-sm ${isWeekend?"bg-amber-100 border border-amber-400 font-bold":""}`}>
                        <span>Vr, Za, Zo & feestdagen (2u30)</span>
                        <span className="text-amber-600 font-bold">€37,50</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="text-stone-500 text-xs">De rij met uw huidige tarief is gemarkeerd</p>
              <ul className="text-stone-600 text-sm leading-relaxed space-y-1 mt-1">
                <li>✓ Kinderen 3–11 jaar: halve prijs</li>
              </ul>
            </div>

            {/* All-in Diner */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <h3 className="font-playfair text-xl font-bold">All-in Diner</h3>
              <div className="space-y-1">
                {(() => {
                  const d = new Date().getDay();
                  const isWeekend = d===5||d===6||d===0||isBelgianHoliday(new Date());
                  return (
                    <>
                      <div className={`flex justify-between px-3 py-1 rounded-lg text-sm ${!isWeekend?"bg-amber-100 border border-amber-400 font-bold":""}`}>
                        <span>Weekdagen (2u30)</span>
                        <span className="text-amber-600 font-bold">€50,50</span>
                      </div>
                      <div className={`flex justify-between px-3 py-1 rounded-lg text-sm ${isWeekend?"bg-amber-100 border border-amber-400 font-bold":""}`}>
                        <span>Weekend & feestdagen (2u30)</span>
                        <span className="text-amber-600 font-bold">€52,50</span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <p className="text-stone-500 text-xs">De rij met uw huidige tarief is gemarkeerd</p>
              <ul className="text-stone-600 text-sm leading-relaxed space-y-1 mt-1">
                <li>✓ 1 huisaperitief p.p.</li>
                <li>✓ Frisdrank & water à volonté</li>
                <li>✓ Huiswijn (wit, rood of rosé) — max. ½ fles p.p.</li>
                <li>✓ Groot bier — max. 3 p.p.</li>
                <li>✓ 1 koffie of thee p.p.</li>
                <li>✓ Exclusieve sterkdrank & cocktail à volonté</li>
                <li>✓ Diner & dessert à volonté</li>
                <li className="text-stone-400 text-xs italic pt-1">⚠ Alles ter plaatse te nuttigen — niet mee te nemen</li>
              </ul>
            </div>

          </div>
          <p className="text-center mt-8 text-stone-500">
            Afhaalbestellingen? Bel{" "}
            <a href="tel:016888013" className="text-amber-600 font-semibold">016 888 013</a>
          </p>
        </div>
      </section>

      {/* ── FEESTMENU (15 nov – 2 jan only) ── */}
      {showFeestmenu && (
        <section className="py-20 px-6 bg-amber-50 border-y border-amber-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-amber-600 text-sm uppercase tracking-widest font-semibold mb-2">Eindejaarsperiode</p>
              <h2 className="font-playfair text-3xl font-bold mb-2">🎄 Feestmenu</h2>
              <p className="text-stone-600 max-w-xl mx-auto">
                Tijdens de feestdagen bieden wij een speciaal feestmenu aan. Reserveer op tijd — plaatsen zijn beperkt!
                Bel voor prijzen en info:{" "}
                <a href="tel:016888013" className="text-amber-700 font-semibold underline">016 888 013</a> of{" "}
                <a href="tel:0476719374" className="text-amber-700 font-semibold underline">0476 71 93 74</a>
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { date:"24 december",  day:"Kerstavond",     sessions:["Diner: 17:30–22:00"], icon:"🕯️", prijs:FEESTMENU_PRIJZEN.kerstAvond },
                { date:"25 december",  day:"Kerstdag",       sessions:["Lunch: 12:00–15:00","Diner: 17:30–21:30"], icon:"🎄", prijs:FEESTMENU_PRIJZEN.kerstdag },
                { date:"31 december",  day:"Oudejaarsavond", sessions:["Diner: 17:30–22:00"], icon:"🥂", prijs:FEESTMENU_PRIJZEN.oudejaarsAvond },
                { date:"1 januari",    day:"Nieuwjaarsdag",  sessions:["Lunch: 12:00–15:00","Diner: 17:30–21:30"], icon:"🎉", prijs:FEESTMENU_PRIJZEN.nieuwjaarsdag },
              ].map(({ date, day, sessions, icon, prijs }) => (
                <div key={date} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-200 flex gap-4">
                  <div className="text-4xl">{icon}</div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-playfair text-xl font-bold">{date}</h3>
                    <p className="text-amber-700 font-semibold text-sm">{day}</p>
                    {sessions.map(s => <p key={s} className="text-stone-600 text-sm">✓ {s}</p>)}
                    {prijs
                      ? <p className="text-amber-600 font-bold mt-1">{prijs}</p>
                      : <p className="text-stone-400 text-sm mt-1 italic">Prijs: bel voor info</p>
                    }
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center mt-8 text-stone-500 text-sm">
              Prijzen variëren — bel ons voor meer informatie en reservaties.
            </p>
          </div>
        </section>
      )}

      {/* ── GALLERY ── */}
      <section id="gallery" className="py-20 px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto reveal">
          <h2 className="font-playfair text-3xl font-bold text-center mb-2">Galerij</h2>
          <p className="text-center text-stone-500 mb-12">Een blik in ons restaurant</p>

          {/* Christmas gallery (11 nov – 11 jan) — takes priority over Easter */}
          {showChristmasGallery && (
            <div className="mb-14">
              <h3 className="font-playfair text-xl font-semibold text-center text-amber-700 mb-2">
                🎄 Kerst & Nieuwjaar bij Han King
              </h3>
              <p className="text-center text-stone-400 text-sm mb-6">Ons restaurant in feestelijke kledij</p>
              <PhotoGrid photos={CHRISTMAS_PHOTOS} onPhotoClick={setLightbox} />
            </div>
          )}

          {/* Valentine gallery (1–20 feb) */}
          {showValentijn && !showChristmasGallery && (
            <div className="mb-14">
              <h3 className="font-playfair text-xl font-semibold text-center text-red-700 mb-2">
                💝 Valentijn bij Han King
              </h3>
              <p className="text-center text-stone-400 text-sm mb-6">Romantisch diner voor twee</p>
              <PhotoGrid photos={VALENTIJN_PHOTOS} onPhotoClick={setLightbox} />
            </div>
          )}

          {/* Moederdag gallery (25 apr – 15 mei) */}
          {showMoederdag && !showChristmasGallery && MOEDERDAG_PHOTOS.length > 0 && (
            <div className="mb-14">
              <h3 className="font-playfair text-xl font-semibold text-center text-pink-700 mb-2">
                🌸 Moederdag bij Han King
              </h3>
              <p className="text-center text-stone-400 text-sm mb-6">Trakteer mama op een onvergetelijk diner</p>
              <PhotoGrid photos={MOEDERDAG_PHOTOS} onPhotoClick={setLightbox} />
            </div>
          )}

          {/* Easter gallery — only shown outside Christmas season */}
          {showEasterBadge && !showChristmasGallery && (
            <div className="mb-14">
              <h3 className="font-playfair text-xl font-semibold text-center text-green-700 mb-2">
                🐣 Pasen bij Han King
              </h3>
              <p className="text-center text-stone-400 text-sm mb-6">Open op Paasmaandag — geniet van ons paasaanbod</p>
              <PhotoGrid photos={PASSEN_PHOTOS} onPhotoClick={setLightbox} />
            </div>
          )}

          {/* Year-round restaurant photos */}
          <div>
            <h3 className="font-playfair text-xl font-semibold text-center text-stone-700 mb-2">
              Ons Restaurant
            </h3>
            <p className="text-center text-stone-400 text-sm mb-6">Warme sfeer, authentieke beleving</p>
            <PhotoGrid photos={RESTAURANT_PHOTOS} onPhotoClick={setLightbox} />
          </div>
        </div>
      </section>

      {/* ── THE EXPERIENCE ── */}
      <section id="about" className="py-20 px-6 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto reveal">
          <h2 className="font-playfair text-3xl font-bold text-center mb-2">De Han King Ervaring</h2>
          <p className="text-center text-stone-400 mb-12">Zes stappen naar een onvergetelijke maaltijd</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step:"1", title:"Dagsoepje",               desc:"Begin met een heerlijke dagsoep als perfecte start van uw maaltijd." },
              { step:"2", title:"Koud voorgerechtenbuffet", desc:"Geniet van ons uitgebreid koud voorgerechtenbuffet met verse salades en koude bereidingen." },
              { step:"3", title:"Warm voorgerechtenbuffet", desc:"Kies uit een ruim assortiment warme voorgerechten, bereid op zijn Aziatisch." },
              { step:"4", title:"Wokschotel op maat",       desc:"Selecteer uw favoriete ingrediënten en sausje — onze chef bereidt uw persoonlijke wokschotel vers voor uw ogen." },
              { step:"5", title:"Grill (enkel bij diner)",  desc:"Vertel de chef wat u op de grillplaat wil: vis, scampi, vlees, ... Niet beschikbaar tijdens de lunch." },
              { step:"6", title:"Dessert",                  desc:"Vul de laatste gaatjes met een heerlijk dessertbordje naar keuze." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-900 font-bold flex items-center justify-center shrink-0 mt-1">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-amber-300 mb-1">{title}</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center reveal">
          <h2 className="font-playfair text-3xl font-bold mb-2">Contact & Ligging</h2>
          <p className="text-stone-500 mb-10">Wij staan klaar om u te verwelkomen</p>
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl">📞</div>
              <h3 className="font-semibold">Telefoon</h3>
              <a href="tel:016888013"  className="text-amber-600 hover:underline">016 888 013</a>
              <a href="tel:0476719374" className="text-amber-600 hover:underline">0476 71 93 74</a>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl">📍</div>
              <h3 className="font-semibold">Adres</h3>
              <p className="text-stone-600 text-sm text-center">
                Leuvensesteenweg 268<br />3390 Tielt-Winge<br />België
              </p>
              <a
                href="https://maps.google.com/?q=Leuvensesteenweg+268+3390+Tielt-Winge"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 hover:underline text-sm"
              >
                📌 Open in Maps
              </a>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl">✉️</div>
              <h3 className="font-semibold">E-mail</h3>
              <a href="mailto:info@hankingwok.be" className="text-amber-600 hover:underline text-sm break-all">
                info@hankingwok.be
              </a>
            </div>
          </div>

          {/* Google Maps embed */}
          <div className="rounded-2xl overflow-hidden shadow-md mb-8">
            <iframe
              title="Han King Wok locatie"
              src="https://maps.google.com/maps?q=Leuvensesteenweg+268+3390+Tielt-Winge&output=embed"
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>

          <a href="tel:016888013"
            className="inline-block bg-amber-500 text-stone-900 font-bold px-10 py-4 rounded-full hover:bg-amber-400 transition-colors text-lg">
            📞 Bel nu voor een reservatie
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-stone-900 text-stone-400 text-center py-6 text-sm">
        <p>© {new Date().getFullYear()} Han King Wok & Grill — Leuvensesteenweg 268, 3390 Tielt-Winge — Alle rechten voorbehouden</p>
      </footer>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Foto vergroot"
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute top-5 right-6 text-white/70 hover:text-white text-4xl leading-none transition-colors"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
