import { cn } from "@/lib/utils";

type RefTable = {
  title?: string;
  /** Optional column headers. If omitted, the table renders as plain rows. */
  headers?: string[];
  rows: string[][];
};

type SubjectRef = {
  heading: string;
  tables: RefTable[];
  note?: string;
};

const PERSONS = ["io", "tu", "lui/lei", "noi", "voi", "loro"];

/** Build a 2-column conjugation table (person → form). */
function conj(title: string, forms: string[]): RefTable {
  return { title, rows: PERSONS.map((p, i) => [p, forms[i]]) };
}

export const SUBJECT_REFERENCE_DATA: Record<string, SubjectRef> = {
  "reflexive-verbs": {
    heading: "Verbi Riflessivi — presente",
    tables: [
      conj("svegliarsi — to wake up", ["mi sveglio", "ti svegli", "si sveglia", "ci svegliamo", "vi svegliate", "si svegliano"]),
      conj("mettersi — to put on", ["mi metto", "ti metti", "si mette", "ci mettiamo", "vi mettete", "si mettono"]),
      conj("divertirsi — to have fun", ["mi diverto", "ti diverti", "si diverte", "ci divertiamo", "vi divertite", "si divertono"]),
    ],
    note: "The reflexive pronoun (mi/ti/si/ci/vi/si) goes before the verb. After a modal it attaches to the infinitive: deve vestirsi.",
  },
  "essere-avere": {
    heading: "Essere & Avere — presente",
    tables: [
      conj("essere — to be", ["sono", "sei", "è", "siamo", "siete", "sono"]),
      conj("avere — to have", ["ho", "hai", "ha", "abbiamo", "avete", "hanno"]),
    ],
    note: "Idioms use AVERE: avere fame, sete, sonno, caldo, freddo, paura, avere 20 anni.",
  },
  pronouns: {
    heading: "Pronomi",
    tables: [
      {
        headers: ["Soggetto", "Riflessivi", "Diretto", "Indiretto"],
        rows: [
          ["io", "mi", "mi", "mi"],
          ["tu", "ti", "ti", "ti"],
          ["lui/lei", "si", "lo / la", "gli / le"],
          ["noi", "ci", "ci", "ci"],
          ["voi", "vi", "vi", "vi"],
          ["loro", "si", "li / le", "gli"],
        ],
      },
    ],
    note: "Direct object replaces 'a chi? no' (Tu lo vedi). Indirect object = 'a + person' (A Marco → gli). With an infinitive the pronoun attaches: devi vederlo.",
  },
  interrogatives: {
    heading: "Question Words (Interrogativi)",
    tables: [
      {
        headers: ["Italian", "English", "Example"],
        rows: [
          ["chi", "who", "Chi è?"],
          ["che cosa / cosa / che", "what", "Cosa fai?"],
          ["come", "how", "Come stai?"],
          ["quando", "when", "Quando parti?"],
          ["dove", "where", "Dove abiti?"],
          ["quale", "which", "Quale preferisci?"],
          ["perché", "why / because", "Perché? Perché…"],
          ["quanto / quanta", "how much", "Quanto costa?"],
          ["quanti / quante", "how many", "Quanti anni hai?"],
        ],
      },
    ],
  },
  gerundio: {
    heading: "Il Gerundio",
    tables: [
      {
        title: "Formazione",
        headers: ["Infinito", "Gerundio"],
        rows: [
          ["-ARE → -ando", "parlare → parlando"],
          ["-ERE → -endo", "leggere → leggendo"],
          ["-IRE → -endo", "dormire → dormendo"],
        ],
      },
      {
        title: "Forme irregolari",
        rows: [
          ["essere", "essendo"],
          ["avere", "avendo"],
          ["fare", "facendo"],
          ["dire", "dicendo"],
          ["bere", "bevendo"],
          ["porre", "ponendo"],
          ["tradurre", "traducendo"],
          ["condurre", "conducendo"],
        ],
      },
      conj("stare — presente", ["sto", "stai", "sta", "stiamo", "state", "stanno"]),
      conj("stare — imperfetto", ["stavo", "stavi", "stava", "stavamo", "stavate", "stavano"]),
    ],
    note: "STARE + gerundio = action in progress: Sto mangiando (I am eating), Stavano parlando (they were talking) — never essere. The gerund is invariable. Uses: simultaneity (Camminando, ascolto musica), manner (Ha risposto sorridendo), cause (Essendo stanco…), condition (Studiando di più…).",
  },
  demonstratives: {
    heading: "This & That (Dimostrativi)",
    tables: [
      {
        headers: ["", "M sing", "F sing", "M plur", "F plur"],
        rows: [
          ["this / these", "questo", "questa", "questi", "queste"],
          ["that / those", "quello", "quella", "quelli", "quelle"],
        ],
      },
    ],
    note: "They agree in gender & number with the noun. qualcosa = 'something' (invariable). Before a noun, quello follows the article pattern: quel / quello / quell' / quei / quegli.",
  },
  greetings: {
    heading: "Greetings & Farewells",
    tables: [
      {
        title: "Saluti (greetings)",
        rows: [
          ["Ciao", "hi (informal)"],
          ["Buongiorno", "good morning / day"],
          ["Buonasera", "good evening"],
          ["Buonanotte", "good night (going to bed)"],
        ],
      },
      {
        title: "Congedi (farewells)",
        rows: [
          ["Ciao", "bye (informal)"],
          ["Arrivederci", "goodbye (formal)"],
          ["Buona giornata", "have a good day"],
          ["Buona serata", "have a good evening"],
        ],
      },
    ],
  },
  articles: {
    heading: "Articoli",
    tables: [
      {
        title: "Determinativo (the)",
        headers: ["", "Sing.", "Plur."],
        rows: [
          ["m. + consonante", "il", "i"],
          ["m. + s+cons / z / ps / gn", "lo", "gli"],
          ["m. + vocale", "l'", "gli"],
          ["f. + consonante", "la", "le"],
          ["f. + vocale", "l'", "le"],
        ],
      },
      {
        title: "Indeterminativo (a / some)",
        headers: ["", "Sing.", "Plur."],
        rows: [
          ["m. + consonante", "un", "dei"],
          ["m. + s+cons / z / ps", "uno", "degli"],
          ["m. + vocale", "un", "degli"],
          ["f. + consonante", "una", "delle"],
          ["f. + vocale", "un'", "delle"],
        ],
      },
    ],
  },
  gender: {
    heading: "Il Genere dei Nomi",
    tables: [
      {
        headers: ["Ending", "Gender", "Example"],
        rows: [
          ["-o", "maschile", "il libro"],
          ["-a", "femminile", "la casa"],
          ["-e", "m. o f.", "il fiore / la chiave"],
          ["-ma", "maschile", "il problema"],
          ["-ista", "m. o f.", "il/la dentista"],
          ["-ore / -one / -ale / -ile", "maschile", "il fiore, il giornale"],
          ["-tà / -tù", "femminile", "la libertà"],
          ["-i", "femminile", "la crisi"],
          ["-ione / -ie / -ice", "femminile", "la lezione"],
        ],
      },
    ],
    note: "Exceptions: la mano, la radio, la foto (f.). Days & months are masculine — except la domenica.",
  },
  plural: {
    heading: "Il Plurale dei Nomi",
    tables: [
      {
        headers: ["Singolare", "Plurale", "Esempio"],
        rows: [
          ["-o", "-i", "libro → libri"],
          ["-a (f.)", "-e", "casa → case"],
          ["-a (m.)", "-i", "problema → problemi"],
          ["-e", "-i", "cane → cani"],
          ["-co / -go", "-chi/-ghi or -ci/-gi", "albergo → alberghi, medico → medici"],
          ["-ca / -ga", "-che / -ghe", "banca → banche"],
          ["consonante / abbrev.", "invariabile", "il film → i film, la foto → le foto"],
        ],
      },
      {
        title: "Irregolari",
        rows: [
          ["l'uomo", "gli uomini"],
          ["l'uovo", "le uova"],
          ["il braccio", "le braccia"],
          ["il dito", "le dita"],
        ],
      },
    ],
  },
  adjectives: {
    heading: "Gli Aggettivi",
    tables: [
      {
        title: "Accordo (agreement)",
        headers: ["", "M sing", "F sing", "M plur", "F plur"],
        rows: [
          ["-o adj.", "bravo", "brava", "bravi", "brave"],
          ["-e adj.", "facile", "facile", "facili", "facili"],
        ],
      },
      {
        title: "bello (before noun → like the article)",
        rows: [
          ["il → bel", "lo → bello"],
          ["l' → bell'", "i → bei"],
          ["gli → begli", ""],
        ],
      },
      {
        title: "buono (before noun → like un/uno)",
        rows: [
          ["un → buon", "uno → buono"],
          ["una → buona", "un' → buon'"],
        ],
      },
    ],
  },
  piacere: {
    heading: "Piacere",
    tables: [
      {
        headers: ["Verbo", "Quando", "Esempio"],
        rows: [
          ["piace", "+ singolare / infinito", "Mi piace il caffè / fare colazione"],
          ["piacciono", "+ plurale", "Mi piacciono i cornetti"],
        ],
      },
      {
        title: "A chi piace? (indirect pronoun)",
        rows: [
          ["a me → mi", "a noi → ci"],
          ["a te → ti", "a voi → vi"],
          ["a lui/lei → gli / le", "a loro → gli"],
        ],
      },
    ],
  },
  possessives: {
    heading: "Possessivi",
    tables: [
      {
        headers: ["", "M sing", "M plur", "F sing", "F plur"],
        rows: [
          ["io", "mio", "miei", "mia", "mie"],
          ["tu", "tuo", "tuoi", "tua", "tue"],
          ["lui/lei", "suo", "suoi", "sua", "sue"],
          ["noi", "nostro", "nostri", "nostra", "nostre"],
          ["voi", "vostro", "vostri", "vostra", "vostre"],
          ["loro", "loro", "loro", "loro", "loro"],
        ],
      },
    ],
    note: "Usually with the article (il mio libro), but drop it with singular family members: mia madre. LORO never changes and keeps the article.",
  },
  modals: {
    heading: "Verbi Modali — presente",
    tables: [
      conj("dovere — must / to have to", ["devo", "devi", "deve", "dobbiamo", "dovete", "devono"]),
      conj("potere — can / to be able to", ["posso", "puoi", "può", "possiamo", "potete", "possono"]),
      conj("volere — to want", ["voglio", "vuoi", "vuole", "vogliamo", "volete", "vogliono"]),
    ],
    note: "Modals are followed by the infinitive: devo studiare, posso venire, voglio mangiare.",
  },
};

/** Renders the rule / conjugation reference for a subject, or null if none exists. */
export default function SubjectReference({ subjectId }: { subjectId?: string }) {
  const ref = subjectId ? SUBJECT_REFERENCE_DATA[subjectId] : undefined;
  if (!ref) return null;
  return (
    <div className="space-y-3 text-left">
      <p className="text-sm font-semibold">{ref.heading}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ref.tables.map((t, ti) => {
          // Only the narrow 2-column conjugation tables pair up; everything with
          // 3+ columns takes the full modal width so it never clips.
          const cols = Math.max(t.headers?.length ?? 0, ...t.rows.map((r) => r.length));
          const wide = cols >= 3;
          return (
          <div
            key={ti}
            className={cn(
              "rounded-lg border border-border overflow-x-auto",
              wide && "sm:col-span-2"
            )}
          >
            {t.title && (
              <div className="bg-muted px-3 py-1.5 text-xs font-semibold">{t.title}</div>
            )}
            <table className="w-full text-xs">
              {t.headers && (
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {t.headers.map((h, hi) => (
                      <th key={hi} className="px-2 py-1 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {t.rows.map((row, ri) => (
                  <tr key={ri} className="border-b border-border/50 last:border-0">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn("px-2 py-1 whitespace-nowrap", ci === 0 ? "text-muted-foreground" : "font-medium")}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          );
        })}
      </div>
      {ref.note && <p className="text-xs text-muted-foreground leading-relaxed">💡 {ref.note}</p>}
    </div>
  );
}
