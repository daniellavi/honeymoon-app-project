import { useState, useMemo, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { Plane, MapPin, Calendar, Wallet, Home, Hotel, Ticket, Plus, X, Heart, Compass, Trash2, Map as MapIcon, Train, Pencil, Lightbulb, ChevronDown } from "lucide-react";

/* The Google Maps API key is entered inside the running app (gear icon in
   the header) rather than hardcoded here, so no code editing is needed. */
const ApiKeyContext = createContext({ apiKey: "", setApiKey: () => {} });
const useApiKey = () => useContext(ApiKeyContext);

const C = {
  bg: "#0f1119",
  bgAlt: "#15171f",
  bgCard: "#1a1d28",
  bgCardHi: "#212633",
  gold: "#d4a574",
  goldLight: "#e8c9a0",
  blush: "#e8b4ac",
  parchment: "#f5f0e8",
  text: "#f5f0e8",
  textMuted: "#a8adc4",
  over: "#d17a6b",
  under: "#7fb393",
  border: "rgba(212,165,116,0.15)",
};

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
.pac-container { background:${C.bgCardHi}; border:1px solid ${C.border}; border-radius:10px; overflow:hidden; font-family:'Inter',sans-serif; margin-top:6px; box-shadow:0 8px 24px rgba(0,0,0,0.3); }
.pac-item { color:${C.text}; border-color:${C.border}; padding:10px 14px; font-size:13px; transition: background 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); }
.pac-item:hover { background:${C.bgAlt}; color:${C.goldLight}; }
.pac-item-query { color:${C.parchment}; }
.pac-matched { color:${C.gold}; font-weight:500; }
.pac-icon { display:none; }
`;

const shadowCard = "0 4px 16px rgba(0,0,0,0.25)";
const shadowSm = "0 2px 8px rgba(0,0,0,0.15)";

const display = { fontFamily: "'Roboto', sans-serif", fontWeight: 700, letterSpacing: "-0.01em" };
const body = { fontFamily: "'Roboto', sans-serif", letterSpacing: "0.003em" };
const mono = { fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.005em" };
const ltr = { direction: "ltr", unicodeBidi: "isolate" };

let uid = 100;
const newId = () => `id-${uid++}`;

const CATEGORY_SEED = ["טיסות", "מלונות", "אוכל ומסעדות", "פעילויות וסיורים", "קניות", "אחר"];

/* Built-in destination list — fallback source for suggestions and map
   placement when no Google Maps API key is present. */
const DESTINATIONS = [
  { name: "פריז", en: "paris", country: "צרפת", lat: 48.8566, lng: 2.3522 },
  { name: "ניס", en: "nice", country: "צרפת", lat: 43.7102, lng: 7.2620 },
  { name: "רומא", en: "rome", country: "איטליה", lat: 41.9028, lng: 12.4964 },
  { name: "פירנצה", en: "florence", country: "איטליה", lat: 43.7696, lng: 11.2558 },
  { name: "ונציה", en: "venice", country: "איטליה", lat: 45.4408, lng: 12.3155 },
  { name: "מילאנו", en: "milan", country: "איטליה", lat: 45.4642, lng: 9.1900 },
  { name: "פוסיטאנו", en: "positano", country: "איטליה", lat: 40.6280, lng: 14.4849 },
  { name: "אמלפי", en: "amalfi", country: "איטליה", lat: 40.6340, lng: 14.6027 },
  { name: "קאפרי", en: "capri", country: "איטליה", lat: 40.5532, lng: 14.2429 },
  { name: "ברצלונה", en: "barcelona", country: "ספרד", lat: 41.3851, lng: 2.1734 },
  { name: "מדריד", en: "madrid", country: "ספרד", lat: 40.4168, lng: -3.7038 },
  { name: "סביליה", en: "seville", country: "ספרד", lat: 37.3891, lng: -5.9845 },
  { name: "ליסבון", en: "lisbon", country: "פורטוגל", lat: 38.7223, lng: -9.1393 },
  { name: "פורטו", en: "porto", country: "פורטוגל", lat: 41.1579, lng: -8.6291 },
  { name: "אמסטרדם", en: "amsterdam", country: "הולנד", lat: 52.3676, lng: 4.9041 },
  { name: "לונדון", en: "london", country: "אנגליה", lat: 51.5072, lng: -0.1276 },
  { name: "פראג", en: "prague", country: "צ'כיה", lat: 50.0755, lng: 14.4378 },
  { name: "וינה", en: "vienna", country: "אוסטריה", lat: 48.2082, lng: 16.3738 },
  { name: "בודפשט", en: "budapest", country: "הונגריה", lat: 47.4979, lng: 19.0402 },
  { name: "ברלין", en: "berlin", country: "גרמניה", lat: 52.5200, lng: 13.4050 },
  { name: "סנטוריני", en: "santorini", country: "יוון", lat: 36.3932, lng: 25.4615 },
  { name: "מיקונוס", en: "mykonos", country: "יוון", lat: 37.4467, lng: 25.3289 },
  { name: "אתונה", en: "athens", country: "יוון", lat: 37.9838, lng: 23.7275 },
  { name: "קרפתוס", en: "karpathos", country: "יוון", lat: 35.5077, lng: 27.2149 },
  { name: "דוברובניק", en: "dubrovnik", country: "קרואטיה", lat: 42.6507, lng: 18.0944 },
  { name: "רייקיאוויק", en: "reykjavik", country: "איסלנד", lat: 64.1466, lng: -21.9426 },
  { name: "איסטנבול", en: "istanbul", country: "טורקיה", lat: 41.0082, lng: 28.9784 },
  { name: "קפדוקיה", en: "cappadocia", country: "טורקיה", lat: 38.6431, lng: 34.8289 },
  { name: "מלטה", en: "malta", country: "מלטה", lat: 35.9375, lng: 14.3754 },
  { name: "לרנקה", en: "larnaca", country: "קפריסין", lat: 34.9229, lng: 33.6233 },
  { name: "באלי", en: "bali", country: "אינדונזיה", lat: -8.3405, lng: 115.0920 },
  { name: "המלדיביים", en: "maldives", country: "המלדיביים", lat: 3.2028, lng: 73.2207 },
  { name: "פוקט", en: "phuket", country: "תאילנד", lat: 7.8804, lng: 98.3923 },
  { name: "בנגקוק", en: "bangkok", country: "תאילנד", lat: 13.7563, lng: 100.5018 },
  { name: "קו סמוי", en: "koh samui", country: "תאילנד", lat: 9.5120, lng: 100.0136 },
  { name: "טוקיו", en: "tokyo", country: "יפן", lat: 35.6762, lng: 139.6503 },
  { name: "קיוטו", en: "kyoto", country: "יפן", lat: 35.0116, lng: 135.7681 },
  { name: "האנוי", en: "hanoi", country: "וייטנאם", lat: 21.0278, lng: 105.8342 },
  { name: "הו צ'י מין", en: "ho chi minh", country: "וייטנאם", lat: 10.8231, lng: 106.6297 },
  { name: "סינגפור", en: "singapore", country: "סינגפור", lat: 1.3521, lng: 103.8198 },
  { name: "קולומבו", en: "colombo", country: "סרי לנקה", lat: 6.9271, lng: 79.8612 },
  { name: "איי סיישל", en: "seychelles", country: "סיישל", lat: -4.6796, lng: 55.4920 },
  { name: "מאוריציוס", en: "mauritius", country: "מאוריציוס", lat: -20.3484, lng: 57.5522 },
  { name: "זנזיבר", en: "zanzibar", country: "טנזניה", lat: -6.1659, lng: 39.2026 },
  { name: "קייפטאון", en: "cape town", country: "דרום אפריקה", lat: -33.9249, lng: 18.4241 },
  { name: "מרקש", en: "marrakech", country: "מרוקו", lat: 31.6295, lng: -7.9811 },
  { name: "קהיר", en: "cairo", country: "מצרים", lat: 30.0444, lng: 31.2357 },
  { name: "פטרה", en: "petra", country: "ירדן", lat: 30.3285, lng: 35.4444 },
  { name: "דובאי", en: "dubai", country: "איחוד האמירויות", lat: 25.2048, lng: 55.2708 },
  { name: "ניו יורק", en: "new york", country: "ארה\"ב", lat: 40.7128, lng: -74.0060 },
  { name: "לוס אנג'לס", en: "los angeles", country: "ארה\"ב", lat: 34.0522, lng: -118.2437 },
  { name: "לאס וגאס", en: "las vegas", country: "ארה\"ב", lat: 36.1699, lng: -115.1398 },
  { name: "הוואי", en: "hawaii", country: "ארה\"ב", lat: 20.7967, lng: -156.3319 },
  { name: "מאווי", en: "maui", country: "ארה\"ב", lat: 20.7984, lng: -156.3319 },
  { name: "טולום", en: "tulum", country: "מקסיקו", lat: 20.2114, lng: -87.4654 },
  { name: "קנקון", en: "cancun", country: "מקסיקו", lat: 21.1619, lng: -86.8515 },
  { name: "קוסטה ריקה", en: "costa rica", country: "קוסטה ריקה", lat: 9.7489, lng: -83.7534 },
  { name: "סנט לוסיה", en: "saint lucia", country: "סנט לוסיה", lat: 13.9094, lng: -60.9789 },
  { name: "בורה בורה", en: "bora bora", country: "פולינזיה הצרפתית", lat: -16.5004, lng: -151.7415 },
  { name: "פיג'י", en: "fiji", country: "פיג'י", lat: -17.7134, lng: 178.0650 },
  { name: "בואנוס איירס", en: "buenos aires", country: "ארגנטינה", lat: -34.6037, lng: -58.3816 },
  { name: "ריו דה ז'ניירו", en: "rio de janeiro", country: "ברזיל", lat: -22.9068, lng: -43.1729 },
  { name: "תל אביב", en: "tel aviv", country: "ישראל", lat: 32.0853, lng: 34.7818 },
];

const DESTINATION_NAMES = DESTINATIONS.map((d) => d.name);
const COUNTRY_NAMES = [...new Set(DESTINATIONS.map((d) => d.country))];

const ACTIVITY_LOCATIONS = [
  {
    name: "טוקיו – שיבויה/הרג׳וקו/אומוטסנדו",
    activities: [
      "Shibuya Scramble",
      "Hachiko",
      "SHIBUYA TSUTAYA",
      "Shibuya PARCO",
      "Nintendo Tokyo",
      "Pokémon Center Shibuya",
      "Shibuya Sky",
      "Takeshita Street",
      "Harry Potter Shop Harajuku",
      "Galaxy Harajuku",
      "Omotesando",
      "Aoyama Flower Market Tea House",
      "Sandwich & Cafe CHERMSIDE SANDWICH",
      "DE FRITES STAAN HARAJUKU",
      "I'm Donut? Harajuku",
      "Marion Crepes",
      "Le Shiner",
      "Totti Candy Factory",
      "Harajuku Gyozaro",
      "Blue Bottle Coffee",
      "A Happy Pancake",
      "Iyoshi Cola"
    ]
  },
  {
    name: "טוקיו – גינזה/טוקיו סטיישן",
    activities: [
      "Ginza Kagari",
      "Ginza Sand",
      "Kaiten Sushi Ginza Onodera",
      "Rare Tendon Ginza Mitsuyoshi",
      "Nissan Crossing",
      "Ginza shopping",
      "Uniqlo Ginza",
      "Muji Ginza",
      "Tokyo Station Character Street",
      "Tokyo Banana",
      "Tokyo Milk Cheese Factory",
      "Butter Butler",
      "Press Butter Sand",
      "Kabukiza Theater Ginza – אופציה תרבותית אם רוצים"
    ]
  },
  {
    name: "טוקיו – אסקוסה/אואנו/אושיאגה",
    activities: [
      "Asakusa Senso-ji",
      "Nakamise",
      "Asakusa Kagetsudō",
      "Asakusa Menchi",
      "Tokyo Curry Pan",
      "Cafe Capyba",
      "Tokyo Skytree – אופציה, לא חובה",
      "Ueno Park",
      "Nezu Shrine",
      "Tokyo Metropolitan Government Building – תצפית חינמית, אם מסתדר"
    ]
  },
  {
    name: "טוקיו – שינג׳וקו/אחר",
    activities: [
      "Shinjuku Gyoen",
      "Godzilla Head",
      "Don Quijote",
      "Oedo Shinjuku Minamiguchi",
      "Shin Udon",
      "MRwaffle Shinjuku",
      "Le Café de Joël Robuchon Shinjuku",
      "Gyopao Gyoza Shinjuku",
      "Yakiniku Washino Shinjuku",
      "Bar Centifolia",
      "These",
      "Swig",
      "A10",
      "The Music Bar CAVE Shibuya"
    ]
  },
  {
    name: "קיוטו",
    activities: [
      "Fushimi Inari",
      "Gion",
      "Pontocho",
      "Nishiki Market",
      "Kiyomizu-dera",
      "Ninenzaka/Sannenzaka",
      "Ginkaku-ji",
      "Philosopher's Path",
      "Nanzen-ji",
      "Tenju-an",
      "Kodai-ji",
      "Arashiyama Bamboo Grove",
      "Tenryu-ji",
      "Togetsukyo Bridge",
      "Arashiyama Monkey Park",
      "Kinkaku-ji",
      "Ryoan-ji",
      "Itsukichaya Arashiyama",
      "Panel Coffee",
      "Arabica Kyoto",
      "Kurasu",
      "Coyote",
      "Here Kyoto",
      "Hafuu",
      "Maguro Koya",
      "Mori Mori Sushi",
      "Wagyu Ryotei Bungo Gion",
      "elk Kyoto Kawaramachi",
      "Menya Inoichi"
    ]
  },
  {
    name: "אוסקה",
    activities: [
      "Dotonbori",
      "Hozenji Yokocho",
      "Shinsaibashi",
      "Kuromon Market",
      "Namba Yasaka Shrine",
      "Den Den Town",
      "Shinsekai",
      "Osaka Castle",
      "Pokémon Café Osaka",
      "Pokémon Center Osaka",
      "Umeda Sky Building",
      "Rikuro Cheesecake",
      "USJ",
      "Gyukatsu Motomura Namba",
      "Kitan Hibiki Osaka",
      "Osaka Teppanyaki Kobe Beef Steak Zin Namba Branch",
      "Yakiniku Goysu",
      "dojima yakiniku ryoriten",
      "AGE 3",
      "amenone",
      "Ten",
      "Sakimoto Coffee & Bakery",
      "Neel Nakazakicho",
      "Aun Coffee Roasters",
      "Ourlog Coffee Roasters",
      "Brooklyn Roasting Company"
    ]
  }
];

function geocode(name, country) {
  const norm = (s) => (s || "").trim().toLowerCase();
  const n = norm(name);
  const c = norm(country);
  let hit = DESTINATIONS.find((d) => d.name === (name || "").trim() || norm(d.en) === n);
  if (!hit && n) hit = DESTINATIONS.find((d) => d.name.includes((name || "").trim()) || norm(d.en).includes(n));
  if (!hit && c) hit = DESTINATIONS.find((d) => d.country === (country || "").trim() || norm(d.country).includes(c));
  return hit ? [hit.lat, hit.lng] : null;
}

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = String(dt.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

/* ---------- Google Maps loader (shared across the whole app) ---------- */

let mapsLoadPromise = null;
let loadedForKey = null;
function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error("no-key"));
  if (window.google?.maps?.places && loadedForKey === apiKey) return Promise.resolve(window.google);
  if (mapsLoadPromise && loadedForKey === apiKey) return mapsLoadPromise;
  loadedForKey = apiKey;
  mapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=he&region=IL`;
    script.async = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return mapsLoadPromise;
}

function useGoogleMaps() {
  const { apiKey } = useApiKey();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!apiKey) { setReady(false); return; }
    let cancelled = false;
    loadGoogleMaps(apiKey).then(() => { if (!cancelled) setReady(true); }).catch(() => { if (!cancelled) setReady(false); });
    return () => { cancelled = true; };
  }, [apiKey]);
  return ready;
}

function extractCountry(place) {
  const comp = place.address_components?.find((c) => c.types.includes("country"));
  return comp?.long_name || "";
}

/* ---------- Stable, module-level components ---------- */

const StampBadge = ({ stop, index, onClick, small }) => {
  const rotations = [-6, 4, -3, 5, -5, 3];
  const rot = rotations[index % rotations.length];
  const size = small ? 62 : 92;
  return (
    <button
      onClick={onClick}
      style={{
        transform: `rotate(${rot}deg)`,
        border: `1.5px solid ${C.border}`,
        background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
        color: C.textMuted,
        minWidth: size,
        height: size,
        boxShadow: shadowSm
      }}
      className="rounded-full flex flex-col items-center justify-center px-2 shrink-0 transition-all duration-300 hover:shadow-lg hover:border-gold"
    >
      <Compass size={small ? 12 : 16} style={{ marginBottom: 4, opacity: 0.7 }} />
      <span style={{ ...display, fontSize: small ? 9 : 11, textAlign: "center", lineHeight: 1.15 }}>
        {stop.name || "יעד חדש"}
      </span>
    </button>
  );
};

const Section = ({ title, icon: Icon, children, action }) => (
  <div style={{ background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`, border: `1px solid ${C.border}`, boxShadow: shadowSm }} className="rounded-xl p-5 mb-4 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div style={{ background: `rgba(212,165,116,0.1)`, padding: 8 }} className="rounded-lg">
          <Icon size={16} color={C.gold} />
        </div>
        <span style={{ ...display, color: C.parchment, fontSize: 15, letterSpacing: "-0.01em" }}>{title}</span>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const SmallInput = (props) => (
  <input
    {...props}
    style={{
      ...body,
      background: C.bgAlt,
      border: `1px solid ${C.border}`,
      color: C.text,
      fontSize: 13,
      transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      ...props.style
    }}
    className={`rounded-lg px-3.5 py-2.5 outline-none placeholder:opacity-60 placeholder:text-sm w-full focus:border-gold focus:shadow-md ${props.className || ""}`}
    onFocus={(e) => {
      e.target.style.borderColor = C.gold;
      e.target.style.boxShadow = `0 0 0 3px rgba(212,165,116,0.08)`;
    }}
    onBlur={(e) => {
      e.target.style.borderColor = C.border;
      e.target.style.boxShadow = "none";
    }}
  />
);

/* Autocomplete input: uses real Google Places when a key is loaded,
   otherwise falls back to the local destination list. */
const AutocompleteInput = ({ value, onChange, onPlaceSelected, options, placeholder, style, placeType }) => {
  const mapsReady = useGoogleMaps();
  const inputRef = useRef(null);
  const acRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!mapsReady || !inputRef.current || acRef.current || !window.google?.maps?.places) return;
    const opts = { fields: ["name", "formatted_address", "geometry", "address_components"] };
    if (placeType) opts.types = [placeType];
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, opts);
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place || (!place.name && !place.formatted_address)) return;
      const label = place.name || place.formatted_address || "";
      onChange(label);
      if (onPlaceSelected) {
        onPlaceSelected({
          label,
          address: place.formatted_address,
          country: extractCountry(place),
          lat: place.geometry?.location?.lat(),
          lng: place.geometry?.location?.lng(),
        });
      }
    });
    acRef.current = ac;
  }, [mapsReady, placeType]);

  const q = (value || "").trim();
  const filtered = !mapsReady && options ? (q ? options.filter((o) => o.includes(q)) : options).slice(0, 6) : [];

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        style={{
          ...body,
          background: C.bgAlt,
          border: `1px solid ${C.border}`,
          color: C.text,
          fontSize: 13,
          transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          ...style
        }}
        className="rounded-lg px-3.5 py-2.5 outline-none placeholder:opacity-60 w-full focus:border-gold focus:shadow-md"
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={(e) => {
          setOpen(true);
          e.target.style.borderColor = C.gold;
          e.target.style.boxShadow = `0 0 0 3px rgba(212,165,116,0.08)`;
        }}
        onBlur={(e) => {
          setTimeout(() => setOpen(false), 150);
          e.target.style.borderColor = C.border;
          e.target.style.boxShadow = "none";
        }}
      />
      {!mapsReady && open && filtered.length > 0 && (
        <div
          style={{
            background: C.bgCardHi,
            border: `1px solid ${C.border}`,
            top: "100%",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            marginTop: 6,
            zIndex: 30,
            boxShadow: shadowCard
          }}
          className="absolute rounded-lg overflow-hidden max-h-48 overflow-y-auto"
        >
          {filtered.map((opt, idx) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(opt); setOpen(false); }}
              style={{
                ...body,
                display: "block",
                width: "100%",
                textAlign: "right",
                padding: "10px 14px",
                fontSize: 13,
                color: C.text,
                borderTop: idx > 0 ? `1px solid ${C.border}` : "none",
                transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              }}
              className="hover:bg-opacity-50 hover:text-gold"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const IconBtn = ({ onClick, children, danger }) => (
  <button
    onClick={onClick}
    style={{
      color: danger ? C.over : C.gold,
      border: `1px solid ${danger ? `rgba(209,122,107,0.3)` : C.border}`,
      background: danger ? `rgba(209,122,107,0.08)` : `rgba(212,165,116,0.08)`,
      transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
    }}
    className="rounded-lg p-2 flex items-center justify-center hover:bg-opacity-100 hover:border-opacity-100 active:scale-95"
  >
    {children}
  </button>
);

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isDangerous }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onCancel}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...display, color: C.parchment, fontSize: 16, marginBottom: 12 }}>{title}</div>
        <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} style={{ color: C.textMuted, fontSize: 13, padding: "8px 16px", border: `1px solid ${C.border}`, borderRadius: 6, background: "transparent", cursor: "pointer", transition: "all 0.3s" }} className="hover:border-opacity-50">ביטול</button>
          <button onClick={onConfirm} style={{ color: isDangerous ? "#fff" : C.parchment, background: isDangerous ? C.over : C.gold, fontSize: 13, padding: "8px 16px", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500, transition: "all 0.3s" }} className="hover:opacity-90">אישור</button>
        </div>
      </div>
    </div>
  );
};

const BookingList = ({ kind, icon, title, placeholder, items, addingKind, setAddingKind, form, setForm, formErrors, setFormErrors, onSubmit, onRemoveItem, onEditItem, stopId, expandedBookings, setExpandedBookings }) => {
  const placeType = kind === "hotels" ? "lodging" : kind === "activities" ? "establishment" : undefined;
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const bookingKey = `${stopId}-${kind}`;
  const isExpanded = expandedBookings.has(bookingKey);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      const errors = {};
      if (kind === "flights") {
        if (!editForm.origin || editForm.origin.trim() === "") errors.origin = "נא להזין עיר מוצא";
        if (!editForm.destination || editForm.destination.trim() === "") errors.destination = "נא להזין עיר יעד";
      } else {
        if (!editForm.label || editForm.label.trim() === "") errors.label = "נא להזין כותרת";
      }
      if (Object.keys(errors).length > 0) {
        setEditErrors(errors);
        return;
      }
      setEditErrors({});
      onEditItem(kind, editingId, editForm);
      cancelEdit();
    }
  };

  const toggleExpanded = () => {
    const newExpanded = new Set(expandedBookings);
    if (newExpanded.has(bookingKey)) {
      newExpanded.delete(bookingKey);
    } else {
      newExpanded.add(bookingKey);
    }
    setExpandedBookings(newExpanded);
  };

  return (
    <div>
      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="מחק פריט"
        message="האם אתה בטוח שברצונך למחוק את הפריט הזה?"
        onConfirm={() => {
          if (deleteConfirm !== null) {
            onRemoveItem(kind, deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
        onCancel={() => setDeleteConfirm(null)}
        isDangerous
      />
      <button
        onClick={toggleExpanded}
        style={{
          background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
          border: `1px solid ${C.border}`,
          boxShadow: shadowSm,
          width: "100%",
          textAlign: "right",
          transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          padding: "16px 20px",
          borderRadius: "12px",
          marginBottom: "12px"
        }}
        className="flex items-center justify-between hover:shadow-md hover:border-opacity-70"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            size={16}
            color={C.gold}
            style={{
              transform: isExpanded ? "rotate(0deg)" : "rotate(90deg)",
              transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          />
          <span style={{ ...display, color: C.parchment, fontSize: 15, letterSpacing: "-0.01em" }}>{title}</span>
        </div>
        <span style={{ color: C.gold, fontSize: 12, opacity: 0.7 }}>{items.length}</span>
      </button>
      {isExpanded && (
        <div style={{ background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`, border: `1px solid ${C.border}`, boxShadow: shadowSm, borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
          <div className="flex items-center justify-between mb-3">
            <span></span>
            <IconBtn onClick={() => setAddingKind(addingKind === kind ? null : kind)}><Plus size={14} /></IconBtn>
          </div>
          {addingKind === kind && (
        <div style={{ background: C.bgAlt, border: `1px solid ${C.border}`, boxShadow: shadowSm }} className="rounded-xl p-4 mb-3 flex flex-col gap-2.5">
          {kind === "flights" ? (
            <div>
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <AutocompleteInput placeholder="מוצא (למשל: תל אביב)" value={form.origin} onChange={(v) => { setForm((f) => ({ ...f, origin: v })); setFormErrors((e) => ({ ...e, origin: "" })); }} options={DESTINATION_NAMES} placeType="(cities)" />
                  {formErrors.origin && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{formErrors.origin}</div>}
                </div>
                <div className="flex-1">
                  <AutocompleteInput placeholder="יעד (למשל: פריז)" value={form.destination} onChange={(v) => { setForm((f) => ({ ...f, destination: v })); setFormErrors((e) => ({ ...e, destination: "" })); }} options={DESTINATION_NAMES} placeType="(cities)" />
                  {formErrors.destination && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{formErrors.destination}</div>}
                </div>
              </div>
              <SmallInput placeholder="פרטים (כתובת, הערות)" value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} />
              <div className="flex gap-2">
                <SmallInput placeholder="שעות (למשל: 19:45→13:20)" value={form.time || ""} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} style={{ ...mono, ...ltr }} />
                <SmallInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
          ) : (
            <div>
              <AutocompleteInput
                placeholder={placeholder}
                value={form.label}
                onChange={(v) => { setForm((f) => ({ ...f, label: v })); setFormErrors((e) => ({ ...e, label: "" })); }}
                onPlaceSelected={(p) => setForm((f) => ({ ...f, label: p.label, detail: f.detail || p.address || "" }))}
                options={[]}
                placeType={placeType}
              />
              {formErrors.label && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{formErrors.label}</div>}
            </div>
          )}
          {kind !== "flights" && (
            <>
              <SmallInput placeholder="פרטים (כתובת, הערות)" value={form.detail} onChange={(e) => setForm((f) => ({ ...f, detail: e.target.value }))} />
              <div className="flex gap-2">
                <SmallInput placeholder="שעה (למשל: 14:00)" value={form.time || ""} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} style={{ ...mono, ...ltr }} />
                <SmallInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </>
          )}
          <div className="flex gap-2 justify-end mt-1">
            <button onClick={() => { setAddingKind(null); setFormErrors({}); }} style={{ color: C.textMuted, fontSize: 12 }}>ביטול</button>
            <button onClick={() => onSubmit(kind)} style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>שמור</button>
          </div>
        </div>
      )}
          {items.length === 0 && addingKind !== kind && <div style={{ color: C.textMuted, fontSize: 12 }}>עדיין לא נשמר כלום.</div>}
          <div className="flex flex-col gap-2" style={{ maxHeight: 300, overflowY: "auto", paddingRight: 4, paddingLeft: 4 }}>
            {items.map((item) => (
              <div key={item.id}>
                {editingId === item.id && editForm ? (
                  <div style={{ background: C.bgAlt, border: `1px solid ${C.border}`, boxShadow: shadowSm }} className="rounded-xl p-4 mb-2 flex flex-col gap-2.5">
                    {kind === "flights" ? (
                      <div>
                        <div className="flex gap-2 mb-3">
                          <div className="flex-1">
                            <AutocompleteInput placeholder="מוצא" value={editForm.origin} onChange={(v) => { setEditForm((f) => ({ ...f, origin: v })); setEditErrors((e) => ({ ...e, origin: "" })); }} options={DESTINATION_NAMES} placeType="(cities)" />
                            {editErrors.origin && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{editErrors.origin}</div>}
                          </div>
                          <div className="flex-1">
                            <AutocompleteInput placeholder="יעד" value={editForm.destination} onChange={(v) => { setEditForm((f) => ({ ...f, destination: v })); setEditErrors((e) => ({ ...e, destination: "" })); }} options={DESTINATION_NAMES} placeType="(cities)" />
                            {editErrors.destination && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{editErrors.destination}</div>}
                          </div>
                        </div>
                        <SmallInput placeholder="פרטים" value={editForm.detail} onChange={(e) => setEditForm((f) => ({ ...f, detail: e.target.value }))} />
                        <div className="flex gap-2">
                          <SmallInput placeholder="שעות (למשל: 19:45→13:20)" value={editForm.time || ""} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))} style={{ ...mono, ...ltr }} />
                          <SmallInput type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <SmallInput value={editForm.label} onChange={(e) => { setEditForm((f) => ({ ...f, label: e.target.value })); setEditErrors((e) => ({ ...e, label: "" })); }} placeholder="כותרת" />
                        {editErrors.label && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{editErrors.label}</div>}
                      </div>
                    )}
                    {kind !== "flights" && (
                      <>
                        <SmallInput placeholder="פרטים" value={editForm.detail} onChange={(e) => setEditForm((f) => ({ ...f, detail: e.target.value }))} />
                        <div className="flex gap-2">
                          <SmallInput placeholder="שעה (למשל: 14:00)" value={editForm.time || ""} onChange={(e) => setEditForm((f) => ({ ...f, time: e.target.value }))} style={{ ...mono, ...ltr }} />
                          <SmallInput type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
                        </div>
                      </>
                    )}
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => { cancelEdit(); setEditErrors({}); }} style={{ color: C.textMuted, fontSize: 12 }}>ביטול</button>
                      <button onClick={saveEdit} style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>עדכן</button>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    background: `linear-gradient(135deg, ${C.bgAlt}, ${C.bgCard})`,
                    border: `1px solid ${C.border}`,
                    boxShadow: shadowSm,
                    transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                  }} className="rounded-xl p-4 flex items-start justify-between hover:shadow-md hover:border-opacity-50">
                    <div>
                      <div style={{ color: C.parchment, fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em" }}>
                        {kind === "flights" ? `${item.origin || "?"} → ${item.destination || "?"}` : item.label}
                      </div>
                      {item.detail && <div style={{ color: C.textMuted, fontSize: 12, marginTop: 4 }}>{item.detail}</div>}
                      <div className="flex gap-4 mt-2.5 items-center">
                        {item.time && <span style={{ ...mono, color: C.gold, fontSize: 11, opacity: 0.8 }}><bdi>{item.time}</bdi></span>}
                        {item.date && <span style={{ ...mono, color: C.gold, fontSize: 11, opacity: 0.8 }}><bdi>{fmtDate(item.date)}</bdi></span>}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button onClick={() => startEdit(item)} style={{ color: C.gold, transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }} title="ערוך" className="hover:opacity-80 active:scale-95"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirm(item.id)} style={{ color: C.textMuted, transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }} title="מחק" className="hover:text-over active:scale-95"><X size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StopDetail = ({ stop, onBack, onUpdate, onAddItem, onRemoveItem, onEditItem, onDelete, onDeleteConfirm, expandedBookings, setExpandedBookings }) => {
  const [addingKind, setAddingKind] = useState(null);
  const emptyForm = { label: "", origin: "", destination: "", detail: "", confirmation: "", date: "", time: "" };
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const submit = (kind) => {
    const errors = {};
    if (kind === "flights") {
      if (!form.origin || form.origin.trim() === "") errors.origin = "נא להזין עיר מוצא";
      if (!form.destination || form.destination.trim() === "") errors.destination = "נא להזין עיר יעד";
    } else {
      if (!form.label || form.label.trim() === "") errors.label = "נא להזין כותרת";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    onAddItem(kind, { ...form });
    setForm(emptyForm);
    setAddingKind(null);
  };

  return (
    <div>
      <button onClick={onBack} style={{ color: C.gold, fontSize: 12, transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }} className="mb-4 flex items-center gap-1 hover:opacity-80">← חזרה למסלול</button>

      <div style={{
        background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
        border: `1px solid ${C.border}`,
        boxShadow: shadowSm
      }} className="rounded-xl p-5 mb-5">
        <div className="flex gap-2 mb-2">
          <AutocompleteInput
            placeholder="שם היעד" value={stop.name} onChange={(v) => onUpdate({ name: v })}
            onPlaceSelected={(p) => onUpdate({ name: p.label, lat: p.lat, lng: p.lng, country: p.country || stop.country })}
            options={DESTINATION_NAMES} placeType="(cities)" style={{ ...display, fontSize: 15 }}
          />
          <AutocompleteInput
            placeholder="מדינה" value={stop.country} onChange={(v) => onUpdate({ country: v })}
            options={COUNTRY_NAMES} placeType="(regions)"
          />
        </div>
        <div className="flex gap-2">
          <SmallInput type="date" value={stop.start} onChange={(e) => onUpdate({ start: e.target.value })} />
          <SmallInput type="date" value={stop.end} onChange={(e) => onUpdate({ end: e.target.value })} />
        </div>
      </div>

      <BookingList kind="flights" icon={Plane} title="טיסות" placeholder="לדוגמה: תל אביב → פריז"
        items={stop.flights} addingKind={addingKind} setAddingKind={setAddingKind} form={form} setForm={setForm} formErrors={formErrors} setFormErrors={setFormErrors} onSubmit={submit} onRemoveItem={onRemoveItem} onEditItem={onEditItem} stopId={stop.id} expandedBookings={expandedBookings} setExpandedBookings={setExpandedBookings} />
      <BookingList kind="hotels" icon={Hotel} title="מלונות" placeholder="חפשו מלון…"
        items={stop.hotels} addingKind={addingKind} setAddingKind={setAddingKind} form={form} setForm={setForm} formErrors={formErrors} setFormErrors={setFormErrors} onSubmit={submit} onRemoveItem={onRemoveItem} onEditItem={onEditItem} stopId={stop.id} expandedBookings={expandedBookings} setExpandedBookings={setExpandedBookings} />
      <BookingList kind="activities" icon={Ticket} title="פעילויות וסיורים" placeholder="חפשו אטרקציה או פעילות…"
        items={stop.activities} addingKind={addingKind} setAddingKind={setAddingKind} form={form} setForm={setForm} formErrors={formErrors} setFormErrors={setFormErrors} onSubmit={submit} onRemoveItem={onRemoveItem} onEditItem={onEditItem} stopId={stop.id} expandedBookings={expandedBookings} setExpandedBookings={setExpandedBookings} />
      <BookingList kind="transfers" icon={Train} title="הסעות ותחבורה" placeholder="למשל: רכבת, חציית ferry, אוטובוס…"
        items={stop.transfers} addingKind={addingKind} setAddingKind={setAddingKind} form={form} setForm={setForm} formErrors={formErrors} setFormErrors={setFormErrors} onSubmit={submit} onRemoveItem={onRemoveItem} onEditItem={onEditItem} stopId={stop.id} expandedBookings={expandedBookings} setExpandedBookings={setExpandedBookings} />

      <Section title="הערות ומקומות" icon={MapPin}>
        <textarea
          value={stop.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="מסעדות לנסות, נקודות תצפית, דברים שלא תרצו לפספס…"
          style={{
            ...body,
            background: C.bgAlt,
            border: `1px solid ${C.border}`,
            color: C.text,
            fontSize: 13,
            minHeight: 100,
            transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          }}
          className="rounded-lg px-3.5 py-2.5 outline-none w-full resize-none focus:border-gold focus:shadow-md"
          onFocus={(e) => {
            e.target.style.borderColor = C.gold;
            e.target.style.boxShadow = `0 0 0 3px rgba(212,165,116,0.08)`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = C.border;
            e.target.style.boxShadow = "none";
          }}
        />
      </Section>

      <button
        onClick={onDeleteConfirm}
        style={{
          color: C.over,
          fontSize: 12,
          transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
        }}
        className="flex items-center gap-1 mt-6 hover:opacity-80 active:scale-95"
      >
        <Trash2 size={13} /> הסירו יעד זה
      </button>
    </div>
  );
};

/* ---------- Map: real Google Map when a key is present, stylized fallback otherwise ---------- */

const MAP_DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1F2547" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9CA3C4" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#161B33" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2C3462" }] },
  { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#1B2140" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#242C52" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#12162B" }] },
];

const PLACE_ICONS = { hotel: "🏨", "flight-origin": "✈️", "flight-dest": "✈️", activity: "🎫", transfer: "🚂" };

/* Every place carries a stable `id` derived from the booking it came from, so
   markers, React keys and resolution results all line up even when two stops
   contain a booking with the same label. */
const extractAllPlaces = (stops) => {
  const places = [];
  const mainStopNames = new Set(stops.map((s) => (s.name || "").trim().toLowerCase()));
  const isMainStop = (v) => mainStopNames.has((v || "").trim().toLowerCase());

  stops.forEach((stop) => {
    const stopContext = stop.name ? `, ${stop.name}` : "";
    const push = (item, kind, name, type, searchQuery) => {
      places.push({
        id: `${item.id || stop.id}-${kind}`,
        stopId: stop.id,
        stopName: stop.name || "",
        name,
        searchQuery,
        type,
        label: `${PLACE_ICONS[type]} ${name}`,
      });
    };

    stop.hotels?.forEach((h) => { if (h.label) push(h, "hotel", h.label, "hotel", `${h.label}${stopContext}`); });
    stop.activities?.forEach((a) => { if (a.label) push(a, "activity", a.label, "activity", `${a.label}${stopContext}`); });
    stop.transfers?.forEach((t) => { if (t.label) push(t, "transfer", t.label, "transfer", `${t.label}${stopContext}`); });
  });
  return places;
};

/* Deep-link into Google Maps. A place_id pins the exact business Google
   matched; falling back to a bare name search lands on whichever "Blue Bottle
   Coffee" in the world Google feels like showing, so prefer the id, then
   coordinates, then the query that at least carries the city name. */
const mapsUrlFor = (place, hit) => {
  const query = encodeURIComponent(place.searchQuery || place.name);
  /* A place_id pins the exact business Google matched. Without one, search the
     name — it carries the city, so it still lands somewhere meaningful. Never
     fall back to raw lat/lng: that opens a bare pin with no place page, which
     reads as a broken link even though the coordinates are right. */
  if (hit?.placeId) return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${hit.placeId}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

/* Programmatic open for Google Maps marker clicks, where there's no anchor to
   click. `window.open` with a features string is treated as a popup and gets
   blocked — especially from inside a Maps event listener, which breaks the
   user-activation chain — so synthesize a real link navigation instead. */
const openGoogleMaps = (place, hit) => {
  const a = document.createElement("a");
  a.href = mapsUrlFor(place, hit);
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/* ---------- Place resolution ----------
   Most entries here are POIs ("Pokémon Café Osaka", "Maguro Mart"), and the
   Geocoder only understands addresses — it answers ZERO_RESULTS for business
   names, which is why pins went missing. Places text search handles them and
   hands back the place_id the links need; the Geocoder stays as a fallback for
   plain city/address strings. Requests run a few at a time with backoff because
   firing all of them at once trips OVER_QUERY_LIMIT and drops results. */

const RESOLVE_CONCURRENCY = 4;
const RESOLVE_MAX_RETRIES = 4;
const resolveCache = new Map();

let placesSvc = null;
const getPlacesSvc = () => {
  if (!placesSvc && window.google?.maps?.places?.PlacesService) {
    placesSvc = new window.google.maps.places.PlacesService(document.createElement("div"));
  }
  return placesSvc;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Each attempt resolves to { hit } for a settled answer (hit may be null when
   the place genuinely isn't found) or { retry: true } when we were throttled. */
const findPlaceAttempt = (query) =>
  new Promise((resolve) => {
    const svc = getPlacesSvc();
    if (!svc) return resolve({ hit: null });
    const S = window.google.maps.places.PlacesServiceStatus;
    svc.findPlaceFromQuery({ query, fields: ["place_id", "name", "geometry"] }, (res, status) => {
      if (status === S.OK && res?.[0]?.geometry?.location) {
        const r = res[0];
        resolve({ hit: { pos: { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() }, placeId: r.place_id, matchedName: r.name } });
      } else if (status === S.OVER_QUERY_LIMIT) resolve({ retry: true });
      else resolve({ hit: null });
    });
  });

const geocodeAttempt = (query) =>
  new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) return resolve({ hit: null });
    new window.google.maps.Geocoder().geocode({ address: query }, (res, status) => {
      if (status === "OK" && res?.[0]?.geometry?.location) {
        const loc = res[0].geometry.location;
        resolve({ hit: { pos: { lat: loc.lat(), lng: loc.lng() }, placeId: res[0].place_id, matchedName: res[0].formatted_address } });
      } else if (status === "OVER_QUERY_LIMIT") resolve({ retry: true });
      else resolve({ hit: null });
    });
  });

const withBackoff = async (attempt, query) => {
  for (let i = 0; i <= RESOLVE_MAX_RETRIES; i++) {
    const r = await attempt(query);
    if (!r.retry) return { hit: r.hit, settled: true };
    await sleep(400 * 2 ** i);
  }
  return { hit: null, settled: false }; // still throttled — don't cache a false negative
};

const resolveQuery = async (query) => {
  if (resolveCache.has(query)) return resolveCache.get(query);
  let { hit, settled } = await withBackoff(findPlaceAttempt, query);
  if (!hit) {
    const fallback = await withBackoff(geocodeAttempt, query);
    hit = fallback.hit;
    settled = settled && fallback.settled;
  }
  if (settled) resolveCache.set(query, hit);
  return hit;
};

/* Returns a Map of place.id -> hit plus how many are
   still in flight. Results land incrementally so pins appear as they arrive
   instead of waiting on the slowest lookup. */
const useResolvedPlaces = (allPlaces, mapsReady) => {
  const [resolved, setResolved] = useState(() => new Map());
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Cities from the built-in list resolve offline, so they work without a key.
    const seed = new Map();
    const queue = [];
    allPlaces.forEach((place) => {
      // has(), not get() — a cached `null` is a settled "not found" and must not be re-requested.
      if (resolveCache.has(place.searchQuery)) { seed.set(place.id, resolveCache.get(place.searchQuery)); return; }
      if (place.type.startsWith("flight")) {
        const g = geocode(place.name, "");
        if (g) { seed.set(place.id, { pos: { lat: g[0], lng: g[1] } }); return; }
      }
      if (mapsReady) queue.push(place);
      else seed.set(place.id, null);
    });

    setResolved(seed);
    setPending(queue.length);
    if (!queue.length) return () => { cancelled = true; };

    const worker = async () => {
      while (!cancelled) {
        const place = queue.shift();
        if (!place) return;
        /* One bad lookup must not stall the rest of the queue, and it must still
           decrement `pending` or the "locating…" indicator never clears. */
        let hit = null;
        try { hit = await resolveQuery(place.searchQuery || place.name); }
        catch (err) { console.error("Failed to locate place:", place.name, err); }
        if (cancelled) return;
        setResolved((prev) => new Map(prev).set(place.id, hit));
        setPending((n) => Math.max(0, n - 1));
      }
    };
    Array.from({ length: Math.min(RESOLVE_CONCURRENCY, queue.length) }, worker);

    return () => { cancelled = true; };
  }, [allPlaces, mapsReady]);

  return { resolved, pending };
};

/* Only places we actually located, in a shape the map views can plot. */
const toPlacePoints = (allPlaces, resolved) =>
  allPlaces
    .map((place) => {
      const hit = resolved.get(place.id);
      return hit?.pos ? { place, pos: hit.pos, hit } : null;
    })
    .filter(Boolean);

const GoogleMapView = ({ stops, placePoints, onSelect }) => {
  const mapsReady = useGoogleMaps();
  const divRef = useRef(null);
  const mapObjRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const points = useMemo(
    () =>
      stops
        .map((s) => {
          const hasCoords = s.lat != null && s.lng != null && s.lat !== "" && s.lng !== "";
          const g = hasCoords ? null : geocode(s.name, s.country);
          const pos = hasCoords ? { lat: Number(s.lat), lng: Number(s.lng) } : g ? { lat: g[0], lng: g[1] } : null;
          return pos ? { stop: s, pos } : null;
        })
        .filter(Boolean),
    [stops]
  );

  useEffect(() => {
    if (!mapsReady || !divRef.current) return;
    const google = window.google;
    if (!mapObjRef.current) {
      mapObjRef.current = new google.maps.Map(divRef.current, {
        zoom: 2, center: { lat: 20, lng: 10 }, disableDefaultUI: true, zoomControl: true, styles: MAP_DARK_STYLE,
      });
    }
    const map = mapObjRef.current;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) polylineRef.current.setMap(null);

    const allMarkerPoints = [...points, ...placePoints];
    if (!allMarkerPoints.length) return;

    const bounds = new google.maps.LatLngBounds();
    points.forEach(({ stop, pos }, i) => {
      const marker = new google.maps.Marker({
        position: pos, map, title: stop.name,
        label: { text: String(i + 1), color: "#161B33", fontWeight: "700" },
        icon: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
        zIndex: 100
      });
      marker.addListener("click", () => onSelect(stop.id));
      markersRef.current.push(marker);
      bounds.extend(pos);
    });
    placePoints.forEach(({ place, pos, hit }) => {
      const marker = new google.maps.Marker({
        position: pos, map, title: `${place.label} — פתחו בגוגל מפות`,
        icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        zIndex: 50
      });
      marker.addListener("click", () => openGoogleMaps(place, hit));
      markersRef.current.push(marker);
      bounds.extend(pos);
    });
    if (points.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: points.map((p) => p.pos), strokeColor: "#C9A44C", strokeOpacity: 0.7, strokeWeight: 2,
        icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "12px" }],
        map,
      });
    }
    if (allMarkerPoints.length === 1) { map.setCenter(allMarkerPoints[0].pos); map.setZoom(9); }
    else map.fitBounds(bounds, 40);
  }, [mapsReady, points, placePoints, onSelect]);

  return <div ref={divRef} style={{ width: "100%", height: "100%" }} />;
};

const StylizedMapView = ({ stops, placePoints, onSelect }) => {
  const toXY = (lat, lng) => ({ x: ((Number(lng) + 180) / 360) * 100, y: ((90 - Number(lat)) / 180) * 100 });
  const withCoords = stops.map((s) => {
    const c = s.lat != null && s.lat !== "" && s.lng != null && s.lng !== "" ? [Number(s.lat), Number(s.lng)] : geocode(s.name, s.country);
    return c ? { ...s, ...toXY(c[0], c[1]) } : null;
  });
  const points = withCoords.filter(Boolean);
  const unplaced = stops.filter((_, i) => !withCoords[i]);

  const plotted = placePoints.map(({ place, pos, hit }) => ({ place, hit, ...toXY(pos.lat, pos.lng) }));

  const pathD = points.length > 1 ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${(p.y * 75) / 100}`).join(" ") : "";

  return (
    <>
      <div
        style={{
          background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgAlt})`,
          border: `1px solid ${C.border}`,
          position: "relative",
          aspectRatio: "4 / 3",
          boxShadow: shadowCard
        }}
        className="rounded-xl overflow-hidden mb-4"
      >
        <svg viewBox="0 0 100 75" preserveAspectRatio="none" style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
          {Array.from({ length: 7 }).map((_, i) => <line key={`v${i}`} x1={(i * 100) / 6} y1={0} x2={(i * 100) / 6} y2={75} stroke={C.border} strokeWidth="0.2" />)}
          {Array.from({ length: 5 }).map((_, i) => <line key={`h${i}`} x1={0} y1={(i * 75) / 4} x2={100} y2={(i * 75) / 4} stroke={C.border} strokeWidth="0.2" />)}
          {pathD && <path d={pathD} fill="none" stroke={C.gold} strokeWidth="0.4" strokeDasharray="1.2,1.2" opacity="0.8" />}
        </svg>
        {points.map((p, i) => (
          <button key={p.id} onClick={() => onSelect(p.id)} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}>
            <StampBadge stop={p} index={i} onClick={() => onSelect(p.id)} small />
          </button>
        ))}
        {plotted.map((p) => (
          <a
            key={p.place.id}
            href={mapsUrlFor(p.place, p.hit)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: C.blush,
              border: `2px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.3s",
              boxShadow: shadowSm
            }}
            title={`${p.place.label} — פתחו בגוגל מפות`}
            className="hover:scale-125"
          >
            {PLACE_ICONS[p.place.type]}
          </a>
        ))}
        {points.length === 0 && plotted.length === 0 && (
          <div style={{ position: "absolute", inset: 0 }} className="flex items-center justify-center">
            <span style={{ color: C.textMuted, fontSize: 13 }} className="text-center px-6">הוסיפו יעדים כדי לראות אותם כאן</span>
          </div>
        )}
      </div>
      {unplaced.length > 0 && (
        <Section title="יעדים שלא זוהו על המפה" icon={MapPin}>
          <div className="flex flex-col gap-2">
            {unplaced.map((s) => (
              <button key={s.id} onClick={() => onSelect(s.id)} className="flex items-center justify-between">
                <span style={{ color: C.parchment, fontSize: 13 }}>{s.name}</span>
                <span style={{ color: C.textMuted, fontSize: 11 }}>נסו לדייק את השם או המדינה ←</span>
              </button>
            ))}
          </div>
        </Section>
      )}
    </>
  );
};

const MapView = ({ stops, onSelect }) => {
  const { apiKey } = useApiKey();
  const mapsReady = useGoogleMaps();
  const allPlaces = useMemo(() => extractAllPlaces(stops), [stops]);
  const [placeListExpanded, setPlaceListExpanded] = useState(true);
  const [expandedDestinations, setExpandedDestinations] = useState(new Set());

  /* Resolved once here and handed to both map variants and the list below, so a
     place, its pin and its link always agree — and we don't pay for the same
     lookup twice. */
  const { resolved, pending } = useResolvedPlaces(allPlaces, mapsReady);
  const placePoints = useMemo(() => toPlacePoints(allPlaces, resolved), [allPlaces, resolved]);

  const placesByDestination = useMemo(() => {
    const grouped = new Map();
    allPlaces.forEach((place) => {
      const dest = place.stopName || "ללא יעד";
      if (!grouped.has(dest)) grouped.set(dest, []);
      grouped.get(dest).push(place);
    });
    return grouped;
  }, [allPlaces]);

  const toggleDestination = (dest) => {
    const newExpanded = new Set(expandedDestinations);
    if (newExpanded.has(dest)) {
      newExpanded.delete(dest);
    } else {
      newExpanded.add(dest);
    }
    setExpandedDestinations(newExpanded);
  };

  return (
    <div>
      <div style={{ ...display, color: C.parchment, fontSize: 20, letterSpacing: "-0.01em" }} className="mb-4 font-semibold">מפת המסלול</div>
      {!apiKey && (
        <div
          style={{
            color: C.textMuted,
            fontSize: 11,
            border: `1px dashed ${C.border}`,
            width: "100%",
            textAlign: "right",
            background: `rgba(212,165,116,0.05)`,
            transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
          }}
          className="rounded-lg px-4 py-2.5 mb-4"
        >
          מציגים מפה מעוצבת. הוסיפו <span style={mono}>GOOGLE_MAPS_API_KEY</span> לקובץ .env לאפשר מפה אמיתית.
        </div>
      )}
      {apiKey && mapsReady ? (
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            aspectRatio: "4 / 3",
            boxShadow: shadowCard
          }}
          className="rounded-xl overflow-hidden mb-4"
        >
          <GoogleMapView stops={stops} placePoints={placePoints} onSelect={onSelect} />
        </div>
      ) : (
        <StylizedMapView stops={stops} placePoints={placePoints} onSelect={onSelect} />
      )}

      {pending > 0 && (
        <div style={{ color: C.textMuted, fontSize: 11 }} className="mb-3 flex items-center gap-2">
          <span>מאתרים מקומות על המפה…</span>
          <span style={{ ...mono, ...ltr, color: C.gold }}>{allPlaces.length - pending}/{allPlaces.length}</span>
        </div>
      )}

      {allPlaces.length > 0 && (
        <div>
          <button
            onClick={() => setPlaceListExpanded(!placeListExpanded)}
            style={{
              background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
              border: `1px solid ${C.border}`,
              boxShadow: shadowSm,
              width: "100%",
              textAlign: "right",
              transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              padding: "16px 20px",
              borderRadius: "12px",
              marginBottom: "12px"
            }}
            className="flex items-center justify-between hover:shadow-md hover:border-opacity-70"
          >
            <div className="flex items-center gap-3">
              <ChevronDown
                size={16}
                color={C.gold}
                style={{
                  transform: placeListExpanded ? "rotate(0deg)" : "rotate(90deg)",
                  transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                }}
              />
              <span style={{ ...display, color: C.parchment, fontSize: 15, letterSpacing: "-0.01em" }}>מקומות בטיול</span>
            </div>
          </button>

          {placeListExpanded && (
            <div style={{ background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`, border: `1px solid ${C.border}`, boxShadow: shadowSm, borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
              <div className="flex flex-col gap-3">
                {Array.from(placesByDestination.entries()).map(([dest, places]) => {
                  const isExpanded = expandedDestinations.has(dest);
                  return (
                    <div key={dest}>
                      <button
                        onClick={() => toggleDestination(dest)}
                        style={{
                          background: `linear-gradient(135deg, ${C.bgAlt}, ${C.bgCard})`,
                          border: `1px solid ${C.border}`,
                          boxShadow: shadowSm,
                          width: "100%",
                          textAlign: "right",
                          transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                          padding: "12px 16px",
                          borderRadius: "10px"
                        }}
                        className="flex items-center justify-between hover:shadow-md hover:border-opacity-70"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            size={14}
                            color={C.gold}
                            style={{
                              transform: isExpanded ? "rotate(0deg)" : "rotate(90deg)",
                              transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                            }}
                          />
                          <span style={{ color: C.parchment, fontSize: 13, fontWeight: 500 }}>{dest}</span>
                        </div>
                        <span style={{ color: C.gold, fontSize: 11, opacity: 0.7 }}>{places.length}</span>
                      </button>
                      {isExpanded && (
                        <div className="flex flex-col gap-2 mt-2" style={{ maxHeight: 250, overflowY: "auto", paddingRight: 4, paddingLeft: 4 }}>
                          {places.map((place) => {
                            const hit = resolved.get(place.id);
                            const onMap = Boolean(hit?.pos);
                            return (
                              <a
                                key={place.id}
                                href={mapsUrlFor(place, hit)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: `linear-gradient(135deg, ${C.bgAlt}, ${C.bgCard})`,
                                  border: `1px solid ${C.border}`,
                                  opacity: onMap ? 1 : 0.65,
                                  transition: "all 0.3s",
                                  marginRight: "20px"
                                }}
                                className="rounded-lg p-3 text-right hover:border-gold hover:shadow-md flex items-center justify-between"
                              >
                                <span style={{ color: C.parchment, fontSize: 13 }}>
                                  {place.label}
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------------------- Main App ---------------------------- */

export default function App() {
  const [view, setView] = useState("home");
  const [selectedStopId, setSelectedStopId] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [tripName, setTripName] = useState("ירח הדבש שלנו");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);

  const [stops, setStops] = useState([]);
  const [budgetTotal, setBudgetTotal] = useState(30000);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [addingExpense, setAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ desc: "", amount: "", categoryId: "", stopId: "" });
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [expandedBudgetSections, setExpandedBudgetSections] = useState(new Set());
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const [deleteExpenseId, setDeleteExpenseId] = useState(null);
  const [deleteStopId, setDeleteStopId] = useState(null);
  const [expenseErrors, setExpenseErrors] = useState({});

  // Load trip data and API key from server on mount
  useEffect(() => {
    const loadTrip = async () => {
      try {
        // Load Google Maps API key
        const keyRes = await fetch('/api/config/google-maps-key');
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          if (keyData.apiKey) {
            setApiKey(keyData.apiKey);
          }
        }

        const res = await fetch('/api/trips/default');
        if (!res.ok) throw new Error('Failed to load trip');
        const trip = await res.json();

        setTripId(trip.id);
        setTripName(trip.name);
        setBudgetTotal(trip.budgetTotal || 30000);

        // Fetch full trip data
        const tripRes = await fetch(`/api/trips/${trip.id}`);
        if (!tripRes.ok) throw new Error('Failed to load trip data');
        const tripData = await tripRes.json();

        setStops(tripData.stops || []);
        const loadedCategories = tripData.categories.length > 0 ? tripData.categories : CATEGORY_SEED.map((name) => ({ id: newId(), name }));
        setCategories(loadedCategories);
        setNewExpense((prev) => ({ ...prev, categoryId: loadedCategories[0]?.id || "" }));
        setExpenses(tripData.expenses || []);

        // Initialize categories if they don't exist
        if (tripData.categories.length === 0) {
          CATEGORY_SEED.forEach((name) => {
            const catId = newId();
            fetch('/api/categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: catId, tripId: trip.id, name }),
            }).catch(err => console.error('Failed to create category:', err));
          });
        }
      } catch (err) {
        console.error('Error loading trip:', err);
        // Fallback to local data if server is unavailable
        setTripId('local-' + Date.now());
        setStops([
          { id: "s1", name: "יעד 1", country: "", start: "", end: "", lat: null, lng: null, flights: [], hotels: [], activities: [], transfers: [], notes: "" },
          { id: "s2", name: "יעד 2", country: "", start: "", end: "", lat: null, lng: null, flights: [], hotels: [], activities: [], transfers: [], notes: "" },
          { id: "s3", name: "יעד 3", country: "", start: "", end: "", lat: null, lng: null, flights: [], hotels: [], activities: [], transfers: [], notes: "" },
          { id: "s4", name: "יעד 4", country: "", start: "", end: "", lat: null, lng: null, flights: [], hotels: [], activities: [], transfers: [], notes: "" },
        ]);
        const fallbackCategories = CATEGORY_SEED.map((name) => ({ id: newId(), name }));
        setCategories(fallbackCategories);
        setNewExpense((prev) => ({ ...prev, categoryId: fallbackCategories[0]?.id || "" }));
      } finally {
        setLoading(false);
      }
    };
    loadTrip();
  }, []);

  // Save trip name and budget total when they change
  useEffect(() => {
    if (!tripId || tripId.startsWith('local-')) return;
    const timer = setTimeout(() => {
      fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tripName, budgetTotal }),
      }).catch(err => console.error('Failed to update trip:', err));
    }, 500);
    return () => clearTimeout(timer);
  }, [tripName, budgetTotal, tripId]);

  const selectedStop = stops.find((s) => s.id === selectedStopId);

  /* Stable identity: MapView rebuilds its markers and re-fits the viewport when
     onSelect changes, which would yank the map back mid-pan on every render. */
  const selectStop = useCallback((id) => { setSelectedStopId(id); setView("stop"); }, []);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses]);
  const spentByCategory = useMemo(() => {
    const map = {};
    expenses.forEach((e) => { map[e.categoryId] = (map[e.categoryId] || 0) + Number(e.amount || 0); });
    return map;
  }, [expenses]);

  const nextBooking = useMemo(() => {
    const all = [];
    stops.forEach((s) => {
      s.flights.forEach((f) => all.push({ ...f, type: "טיסה", stopName: s.name }));
      s.hotels.forEach((h) => all.push({ ...h, type: "מלון", stopName: s.name }));
      s.activities.forEach((a) => all.push({ ...a, type: "פעילות", stopName: s.name }));
      s.transfers.forEach((t) => all.push({ ...t, type: "הסעה", stopName: s.name }));
    });
    return all[0] || null;
  }, [stops]);

  const firstStopDate = stops.find((s) => s.start)?.start;
  const countdown = daysUntil(firstStopDate);

  const updateStop = (id, patch) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const stop = stops.find(s => s.id === id);
    if (stop && tripId) {
      fetch(`/api/stops/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...stop, ...patch }),
      }).catch(err => console.error('Failed to update stop:', err));
    }
  };

  const addStop = () => {
    const id = newId();
    const newStop = { id, tripId, name: "יעד חדש", country: "", start: "", end: "", lat: null, lng: null, flights: [], hotels: [], activities: [], transfers: [], notes: "" };
    setStops((prev) => [...prev, newStop]);
    if (tripId) {
      fetch('/api/stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStop),
      }).catch(err => console.error('Failed to create stop:', err));
    }
    setSelectedStopId(id);
    setView("stop");
  };

  const removeStop = (id) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
    if (tripId) {
      fetch(`/api/stops/${id}`, {
        method: 'DELETE',
      }).catch(err => console.error('Failed to delete stop:', err));
    }
    if (selectedStopId === id) { setSelectedStopId(null); setView("trip"); }
  };

  const addBookingItem = (stopId, kind, item) => {
    const bookingId = newId();
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, [kind]: [...s[kind], { id: bookingId, ...item }] } : s)));
    if (tripId) {
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, stopId, kind, ...item }),
      }).catch(err => console.error('Failed to create booking:', err));
    }
  };

  const removeBookingItem = (stopId, kind, itemId) => {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, [kind]: s[kind].filter((i) => i.id !== itemId) } : s)));
    if (tripId) {
      fetch(`/api/bookings/${itemId}`, {
        method: 'DELETE',
      }).catch(err => console.error('Failed to delete booking:', err));
    }
  };

  const editBookingItem = (stopId, kind, itemId, updatedItem) => {
    setStops((prev) => prev.map((s) => (s.id === stopId ? { ...s, [kind]: s[kind].map((i) => (i.id === itemId ? { ...i, ...updatedItem } : i)) } : s)));
    if (tripId) {
      fetch(`/api/bookings/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, ...updatedItem }),
      }).catch(err => console.error('Failed to update booking:', err));
    }
  };

  const submitExpense = () => {
    const errors = {};
    if (!newExpense.desc || newExpense.desc.trim() === "") errors.desc = "נא להזין תיאור הוצאה";
    if (!newExpense.amount || Number(newExpense.amount) <= 0) errors.amount = "נא להזין סכום חיובי";
    if (newExpense.categoryId === "" || newExpense.categoryId === null) errors.categoryId = "נא לבחור קטגוריה";
    if (Object.keys(errors).length > 0) {
      setExpenseErrors(errors);
      return;
    }
    setExpenseErrors({});
    const expenseId = newId();
    setExpenses((prev) => [...prev, { id: expenseId, ...newExpense }]);
    if (tripId) {
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expenseId, tripId, ...newExpense }),
      }).catch(err => console.error('Failed to create expense:', err));
    }
    setNewExpense({ desc: "", amount: "", categoryId: categories[0]?.id || "", stopId: "" });
    setAddingExpense(false);
  };

  const removeExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (tripId) {
      fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      }).catch(err => console.error('Failed to delete expense:', err));
    }
  };

  const NAV = [
    { key: "home", label: "בית", icon: Home },
    { key: "trip", label: "טיול", icon: Compass },
    { key: "ideas", label: "דברים לעשות", icon: Lightbulb },
    { key: "map", label: "מפה", icon: MapIcon },
    { key: "budget", label: "תקציב", icon: Wallet },
  ];

  if (loading) {
    return (
      <div dir="rtl" lang="he" style={{ ...body, background: C.bg, color: C.text, minHeight: 600 }} className="w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center">
        <div style={{ color: C.textMuted, fontSize: 14 }}>טוען את הנתונים...</div>
      </div>
    );
  }

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey }}>
    <div dir="rtl" lang="he" style={{ ...body, background: C.bg, color: C.text, minHeight: 600 }} className="w-full rounded-2xl overflow-hidden flex flex-col">
      <style>{FONTS}</style>

      <div style={{ borderBottom: `1px solid ${C.border}` }} className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart size={18} color={C.blush} fill={C.blush} />
            <input
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              style={{
                ...display,
                background: "transparent",
                color: C.parchment,
                fontSize: 19,
                border: "none",
                outline: "none",
                letterSpacing: "-0.01em"
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            {countdown !== null && countdown >= 0 && (
              <div style={{ color: C.gold, fontSize: 12, opacity: 0.9 }} className="flex items-center gap-1">
                <span style={{ ...mono, ...ltr, fontWeight: 600 }}>{countdown}</span>
                <span>ימים לטיול</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5" style={{ minHeight: 480 }}>
        {view === "home" && (
          <div>
            <div
              style={{
                background: `linear-gradient(135deg, ${C.bgCard} 0%, ${C.bgCardHi} 100%)`,
                border: `1px solid ${C.border}`,
                boxShadow: shadowCard
              }}
              className="rounded-2xl p-7 mb-6 relative overflow-hidden"
            >
              <Plane
                size={110}
                color={C.gold}
                style={{
                  position: "absolute",
                  right: -25,
                  top: -30,
                  opacity: 0.08,
                  transform: "rotate(-20deg)"
                }}
              />
              <div style={{ ...display, fontStyle: "italic", color: C.gold, fontSize: 12, letterSpacing: "0.03em", textTransform: "uppercase" }} className="mb-2 opacity-80">{stops.length} יעדים במסלול</div>
              <div style={{ ...display, color: C.parchment, fontSize: 32, lineHeight: 1.2, letterSpacing: "-0.02em" }} className="mb-3">{countdown !== null && countdown >= 0 ? `${countdown} ימים לטיול` : "תכננו את המסלול"}</div>
              <div style={{ color: C.textMuted, fontSize: 13 }}>
                {firstStopDate ? <>יציאה ב-<bdi>{fmtDate(firstStopDate)}</bdi></> : "הוסיפו תאריך טיסה ראשון בלשונית טיול"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                style={{
                  background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
                  border: `1px solid ${C.border}`,
                  boxShadow: shadowSm
                }}
                className="rounded-xl p-5 transition-all duration-300 hover:shadow-md"
              >
                <div style={{ background: `rgba(212,165,116,0.1)`, padding: 8 }} className="rounded-lg w-fit mb-3">
                  <Wallet size={16} color={C.gold} />
                </div>
                <div style={{ ...mono, color: C.parchment, fontSize: 17, letterSpacing: "-0.01em", fontWeight: 600 }}>
                  <span>₪</span>
                  <bdi>{totalSpent.toLocaleString()}</bdi>
                </div>
                <div style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }} className="flex items-center gap-1">
                  <span>מתוך</span>
                  <span style={{ ...mono }}>₪<bdi>{Number(budgetTotal).toLocaleString()}</bdi></span>
                </div>
              </div>
              <div
                style={{
                  background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
                  border: `1px solid ${C.border}`,
                  boxShadow: shadowSm
                }}
                className="rounded-xl p-5 transition-all duration-300 hover:shadow-md"
              >
                <div style={{ background: `rgba(212,165,116,0.1)`, padding: 8 }} className="rounded-lg w-fit mb-3">
                  <Ticket size={16} color={C.gold} />
                </div>
                <div style={{ ...display, color: C.parchment, fontSize: 15, letterSpacing: "-0.01em" }}>{nextBooking ? nextBooking.type : "אין עדיין"}</div>
                <div style={{ color: C.textMuted, fontSize: 11, marginTop: 6 }}>{nextBooking ? nextBooking.stopName : "הוסיפו הזמנה בלשונית טיול"}</div>
              </div>
            </div>
          </div>
        )}

        {view === "trip" && !selectedStop && (
          <div>
            <div style={{ ...display, color: C.parchment, fontSize: 20, letterSpacing: "-0.01em" }} className="mb-5 font-semibold">המסלול שלכם</div>
            <div className="flex items-center overflow-x-auto pb-3 mb-4">
              {stops.map((s, i) => (
                <div key={s.id} className="flex items-center shrink-0">
                  <StampBadge stop={s} index={i} onClick={() => { setSelectedStopId(s.id); setView("stop"); }} />
                  {i < stops.length - 1 && <div className="flex items-center px-1" style={{ width: 36 }}><div style={{ borderTop: `2px dashed ${C.border}`, width: "100%" }} /></div>}
                </div>
              ))}
              <button
                onClick={addStop}
                style={{
                  border: `1.5px dashed ${C.border}`,
                  color: C.gold,
                  minWidth: 92,
                  height: 92,
                  transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                }}
                className="rounded-full flex flex-col items-center justify-center mr-2 shrink-0 hover:border-gold hover:bg-opacity-5"
              >
                <Plus size={20} />
                <span style={{ fontSize: 10, marginTop: 6 }}>הוסיפו יעד</span>
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {stops.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStopId(s.id); setView("stop"); }}
                  style={{
                    background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
                    border: `1px solid ${C.border}`,
                    boxShadow: shadowSm,
                    transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                  }}
                  className="rounded-xl p-5 text-right flex items-center justify-between hover:shadow-md hover:border-opacity-50"
                >
                  <div>
                    <div style={{ ...display, color: C.parchment, fontSize: 16, letterSpacing: "-0.01em" }}>{s.name}{s.country ? `, ${s.country}` : ""}</div>
                    <div style={{ color: C.textMuted, fontSize: 12 }} className="mt-2 flex items-center gap-2">
                      <span>{s.start ? <><bdi>{fmtDate(s.start)}</bdi> – <bdi>{fmtDate(s.end)}</bdi></> : "אין תאריכים"}</span>
                      <span>·</span>
                      <span style={{ ...mono, ...ltr }}>{s.flights.length + s.hotels.length + s.activities.length + s.transfers.length}</span>
                      <span>הזמנות</span>
                    </div>
                  </div>
                  <MapPin size={16} color={C.gold} />
                </button>
              ))}
            </div>
          </div>
        )}

        {view === "stop" && selectedStop && (
          <StopDetail stop={selectedStop} onBack={() => { setSelectedStopId(null); setView("trip"); }} onUpdate={(patch) => updateStop(selectedStop.id, patch)}
            onAddItem={(kind, item) => addBookingItem(selectedStop.id, kind, item)} onRemoveItem={(kind, id) => removeBookingItem(selectedStop.id, kind, id)} onEditItem={(kind, id, item) => editBookingItem(selectedStop.id, kind, id, item)} onDelete={() => removeStop(selectedStop.id)} onDeleteConfirm={() => setDeleteStopId(selectedStop.id)} expandedBookings={expandedBookings} setExpandedBookings={setExpandedBookings} />
        )}

        {view === "map" && <MapView stops={stops} onSelect={selectStop} />}

        {view === "ideas" && (
          <div>
            <div style={{ ...display, color: C.parchment, fontSize: 20, letterSpacing: "-0.01em" }} className="mb-5 font-semibold">דברים לעשות ביפן</div>
            <div className="flex flex-col gap-2">
              {ACTIVITY_LOCATIONS.map((location, idx) => (
                <div key={idx}>
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedSections);
                      if (newExpanded.has(idx)) {
                        newExpanded.delete(idx);
                      } else {
                        newExpanded.add(idx);
                      }
                      setExpandedSections(newExpanded);
                    }}
                    style={{
                      background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
                      border: `1px solid ${C.border}`,
                      boxShadow: shadowSm,
                      width: "100%",
                      textAlign: "right",
                      transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                    }}
                    className="rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-opacity-70"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        size={16}
                        color={C.gold}
                        style={{
                          transform: expandedSections.has(idx) ? "rotate(0deg)" : "rotate(90deg)",
                          transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        }}
                      />
                      <span style={{ ...display, color: C.parchment, fontSize: 14, letterSpacing: "-0.01em" }}>
                        {location.name}
                      </span>
                    </div>
                    <span style={{ color: C.gold, fontSize: 12, opacity: 0.7 }}>
                      {location.activities.length}
                    </span>
                  </button>
                  {expandedSections.has(idx) && (
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${C.bgAlt}, ${C.bgCard})`,
                        border: `1px solid ${C.border}`,
                        borderTop: "none",
                        borderRadius: "0 0 11px 11px",
                        padding: "12px",
                        marginBottom: "8px",
                        boxShadow: shadowSm,
                        maxHeight: 300,
                        overflowY: "auto"
                      }}
                      className="flex flex-col gap-2"
                    >
                      {location.activities.map((activity, actIdx) => (
                        <div
                          key={actIdx}
                          style={{
                            padding: "8px 10px",
                            fontSize: 13,
                            color: C.text,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8
                          }}
                        >
                          <span style={{ color: C.gold, flexShrink: 0 }}>•</span>
                          <span>{activity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "budget" && (
          <div>
            <button
              onClick={() => {
                const newExpanded = new Set(expandedBudgetSections);
                if (newExpanded.has(0)) {
                  newExpanded.delete(0);
                } else {
                  newExpanded.add(0);
                }
                setExpandedBudgetSections(newExpanded);
              }}
              style={{
                background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
                border: `1px solid ${C.border}`,
                boxShadow: shadowSm,
                width: "100%",
                textAlign: "right",
                transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                padding: "16px 20px",
                borderRadius: "12px",
                marginBottom: "12px"
              }}
              className="flex items-center justify-between hover:shadow-md hover:border-opacity-70"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  size={16}
                  color={C.gold}
                  style={{
                    transform: expandedBudgetSections.has(0) ? "rotate(0deg)" : "rotate(90deg)",
                    transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                />
                <div style={{ background: `rgba(212,165,116,0.1)`, padding: 8 }} className="rounded-lg">
                  <Wallet size={16} color={C.gold} />
                </div>
                <span style={{ ...display, color: C.parchment, fontSize: 15, letterSpacing: "-0.01em" }}>תקציב כולל</span>
              </div>
            </button>
            {expandedBudgetSections.has(0) && (
              <div style={{ background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`, border: `1px solid ${C.border}`, boxShadow: shadowSm, borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ color: C.textMuted, fontSize: 13 }}>סה"כ (₪)</span>
                  <SmallInput type="number" value={budgetTotal} onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || Number(val) >= 0) setBudgetTotal(val);
                  }} className="max-w-[140px]" style={ltr} />
                </div>
                <div style={{ background: C.bgAlt, height: 6, boxShadow: `inset 0 2px 4px rgba(0,0,0,0.2)` }} className="rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, (totalSpent / (budgetTotal || 1)) * 100)}%`,
                      background: totalSpent > budgetTotal ? `linear-gradient(90deg, ${C.over}, #ff6b6b)` : `linear-gradient(90deg, ${C.under}, #7fbf94)`,
                      height: "100%",
                      transition: "all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                    }}
                  />
                </div>
                <div style={{ color: C.textMuted, fontSize: 12 }} className="mt-2 flex items-center gap-1">
                  <span style={{ ...mono }}>₪<bdi>{totalSpent.toLocaleString()}</bdi></span>
                  <span>הוצאו</span>
                  <span>·</span>
                  <span style={{ ...mono }}>₪<bdi>{Math.max(0, budgetTotal - totalSpent).toLocaleString()}</bdi></span>
                  <span>נותרו</span>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const newExpanded = new Set(expandedBudgetSections);
                if (newExpanded.has(1)) {
                  newExpanded.delete(1);
                } else {
                  newExpanded.add(1);
                }
                setExpandedBudgetSections(newExpanded);
              }}
              style={{
                background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
                border: `1px solid ${C.border}`,
                boxShadow: shadowSm,
                width: "100%",
                textAlign: "right",
                transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                padding: "16px 20px",
                borderRadius: "12px",
                marginBottom: "12px"
              }}
              className="flex items-center justify-between hover:shadow-md hover:border-opacity-70"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  size={16}
                  color={C.gold}
                  style={{
                    transform: expandedBudgetSections.has(1) ? "rotate(0deg)" : "rotate(90deg)",
                    transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                />
                <div style={{ background: `rgba(212,165,116,0.1)`, padding: 8 }} className="rounded-lg">
                  <Ticket size={16} color={C.gold} />
                </div>
                <span style={{ ...display, color: C.parchment, fontSize: 15, letterSpacing: "-0.01em" }}>לפי קטגוריה</span>
              </div>
            </button>
            {expandedBudgetSections.has(1) && (
              <div style={{ background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`, border: `1px solid ${C.border}`, boxShadow: shadowSm, borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" }}>
                <div className="flex items-center justify-between mb-3">
                  <span></span>
                  <IconBtn onClick={() => setAddingExpense((v) => !v)}><Plus size={14} /></IconBtn>
                </div>
                {addingExpense && (
                  <div style={{ background: C.bgAlt, border: `1px solid ${C.border}`, boxShadow: shadowSm }} className="rounded-xl p-4 mb-3 flex flex-col gap-2.5">
                    <div>
                      <SmallInput placeholder="על מה זה היה? (למשל: ארוחת ערב בבאלי)" value={newExpense.desc} onChange={(e) => { setNewExpense((n) => ({ ...n, desc: e.target.value })); setExpenseErrors((err) => ({ ...err, desc: "" })); }} />
                      {expenseErrors.desc && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{expenseErrors.desc}</div>}
                    </div>
                    <div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <SmallInput placeholder="סכום ₪" type="number" value={newExpense.amount} onChange={(e) => { setNewExpense((n) => ({ ...n, amount: e.target.value })); setExpenseErrors((err) => ({ ...err, amount: "" })); }} style={ltr} />
                          {expenseErrors.amount && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{expenseErrors.amount}</div>}
                        </div>
                        <div className="flex-1">
                          <select
                            value={newExpense.categoryId}
                            onChange={(e) => { setNewExpense((n) => ({ ...n, categoryId: e.target.value })); setExpenseErrors((err) => ({ ...err, categoryId: "" })); }}
                            style={{
                              ...body,
                              background: C.bgAlt,
                              border: `1px solid ${expenseErrors.categoryId ? C.over : C.border}`,
                              color: C.text,
                              fontSize: 13,
                              transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                            }}
                            className="rounded-lg px-3.5 py-2.5 w-full focus:border-gold focus:shadow-md"
                          >
                            <option value="" style={{ background: C.bg }}>בחרו קטגוריה</option>
                            {categories.map((c) => <option key={c.id} value={c.id} style={{ background: C.bg }}>{c.name}</option>)}
                          </select>
                          {expenseErrors.categoryId && <div style={{ color: C.over, fontSize: 11, marginTop: 4 }}>{expenseErrors.categoryId}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button onClick={() => { setAddingExpense(false); setExpenseErrors({}); }} style={{ color: C.textMuted, fontSize: 12 }}>ביטול</button>
                      <button onClick={submitExpense} style={{ color: C.gold, fontSize: 12, fontWeight: 600 }}>הוסיפו הוצאה</button>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {categories.map((c) => {
                    const spent = spentByCategory[c.id] || 0;
                    return (
                      <div key={c.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span style={{ fontSize: 13, color: C.parchment }}>{c.name}</span>
                          <span style={{ ...mono, fontSize: 12, color: C.textMuted }}>₪<bdi>{spent.toLocaleString()}</bdi></span>
                        </div>
                        <div style={{ background: C.bgAlt, height: 5, boxShadow: `inset 0 1px 2px rgba(0,0,0,0.2)` }} className="rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(100, (spent / (totalSpent || 1)) * 100)}%`,
                              background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
                              height: "100%",
                              transition: "all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {expenses.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 13, color: C.parchment, marginBottom: 10, fontWeight: 500 }}>הוצאות</div>
                    <div className="flex flex-col gap-2" style={{ maxHeight: 300, overflowY: "auto", paddingRight: 4, paddingLeft: 4 }}>
                      {expenses.map((exp) => {
                        const category = categories.find((c) => c.id === exp.categoryId);
                        return (
                          <div
                            key={exp.id}
                            style={{
                              background: C.bgAlt,
                              border: `1px solid ${C.border}`,
                              borderRadius: "8px",
                              padding: "8px 12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between"
                            }}
                          >
                            <div className="flex-1">
                              <div style={{ fontSize: 12, color: C.parchment }}>{exp.desc}</div>
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{category?.name}</div>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <span style={{ ...mono, fontSize: 12, color: C.gold, fontWeight: 500 }}>₪<bdi>{Number(exp.amount).toLocaleString()}</bdi></span>
                              <button
                                onClick={() => setDeleteExpenseId(exp.id)}
                                style={{ color: C.textMuted, transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
                                title="מחק"
                                className="hover:text-over active:scale-95"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => {
                const newExpanded = new Set(expandedBudgetSections);
                if (newExpanded.has(2)) {
                  newExpanded.delete(2);
                } else {
                  newExpanded.add(2);
                }
                setExpandedBudgetSections(newExpanded);
              }}
              style={{
                background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`,
                border: `1px solid ${C.border}`,
                boxShadow: shadowSm,
                width: "100%",
                textAlign: "right",
                transition: "all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                padding: "16px 20px",
                borderRadius: "12px",
                marginBottom: "12px"
              }}
              className="flex items-center justify-between hover:shadow-md hover:border-opacity-70"
            >
              <div className="flex items-center gap-3">
                <ChevronDown
                  size={16}
                  color={C.gold}
                  style={{
                    transform: expandedBudgetSections.has(2) ? "rotate(0deg)" : "rotate(90deg)",
                    transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                />
                <div style={{ background: `rgba(212,165,116,0.1)`, padding: 8 }} className="rounded-lg">
                  <MapPin size={16} color={C.gold} />
                </div>
                <span style={{ ...display, color: C.parchment, fontSize: 15, letterSpacing: "-0.01em" }}>לפי יעד</span>
              </div>
            </button>
            {expandedBudgetSections.has(2) && (
              <div style={{ background: `linear-gradient(135deg, ${C.bgCard}, ${C.bgCardHi})`, border: `1px solid ${C.border}`, boxShadow: shadowSm, borderRadius: "12px", padding: "16px 20px" }}>
                <div className="flex flex-col gap-2">
                  {stops.map((s) => {
                    const spent = expenses.filter((e) => e.stopId === s.id).reduce((sum, e) => sum + Number(e.amount || 0), 0);
                    return (
                      <div key={s.id} className="flex items-center justify-between">
                        <span style={{ fontSize: 13, color: C.parchment }}>{s.name}</span>
                        <span style={{ ...mono, fontSize: 12, color: C.textMuted }}>₪<bdi>{spent.toLocaleString()}</bdi></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, background: C.bgAlt }} className="flex justify-around py-4">
        {NAV.map((n) => {
          const active = view === n.key || (n.key === "trip" && view === "stop");
          return (
            <button
              key={n.key}
              onClick={() => { setView(n.key); if (n.key !== "stop") setSelectedStopId(null); }}
              className="flex flex-col items-center gap-1.5 transition-all duration-200"
              style={{
                color: active ? C.goldLight : C.textMuted,
                opacity: active ? 1 : 0.6
              }}
            >
              <n.icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span style={{ fontSize: 10, fontWeight: active ? 500 : 400 }}>{n.label}</span>
            </button>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={deleteStopId !== null}
        title="מחק יעד"
        message="האם אתה בטוח שברצונך למחוק את היעד הזה? כל ההזמנות והנתונים של יעד זה יימחקו."
        onConfirm={() => {
          if (deleteStopId !== null) {
            removeStop(deleteStopId);
            setDeleteStopId(null);
          }
        }}
        onCancel={() => setDeleteStopId(null)}
        isDangerous
      />

      <ConfirmDialog
        isOpen={deleteExpenseId !== null}
        title="מחק הוצאה"
        message="האם אתה בטוח שברצונך למחוק את ההוצאה הזו?"
        onConfirm={() => {
          if (deleteExpenseId !== null) {
            removeExpense(deleteExpenseId);
            setDeleteExpenseId(null);
          }
        }}
        onCancel={() => setDeleteExpenseId(null)}
        isDangerous
      />
    </div>
    </ApiKeyContext.Provider>
  );
}
