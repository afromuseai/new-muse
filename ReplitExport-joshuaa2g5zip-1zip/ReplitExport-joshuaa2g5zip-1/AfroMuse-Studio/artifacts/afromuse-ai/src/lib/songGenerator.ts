export interface SongDraft {
  title: string;
  hook: string[];
  verse1: string[];
  verse2: string[];
  bridge: string[];
  chordVibe: string;
  melodyDirection: string;
  arrangement: string;
}

function pick<T>(arr: T[], seed: number, offset = 0): T {
  return arr[(seed + offset) % arr.length];
}

function capitalize(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildTitle(topic: string, genre: string, seed: number): string {
  const suffixes: Record<string, string[]> = {
    Afrobeats: ["Tonight", "Forever", "Lagos Love", "No Wahala", "Vibrations", "Higher"],
    Afropop: ["Magic", "Feeling", "All Night", "Shine", "Celebrate", "Dream"],
    Amapiano: ["Piano Nights", "Soft Life", "Joburg Dawn", "Sweet Piano", "Log Drum", "Flow"],
    Dancehall: ["Riddim", "Fire", "Wicked Ting", "Blazing", "Inna Di Dance", "Hot"],
    "R&B": ["Deep Feelings", "Still", "Tender", "Soul Ties", "Slow Burn", "Devotion"],
  };
  const base = capitalize(topic.trim() || "Lagos Nights");
  const suffix = pick(suffixes[genre] ?? suffixes["Afrobeats"], seed);
  const forms = [
    base,
    `${base} (${suffix})`,
    `${suffix}`,
    `${base} — ${suffix}`,
  ];
  return pick(forms, seed, 2);
}

// ── HOOKS by mood ───────────────────────────────────────────────────────────

const hooks: Record<string, ((t: string) => string[])[]> = {
  Uplifting: [
    (t) => [
      `This ${t || "journey"} got me feeling like I'm made of gold,`,
      `Every single day I rise and watch the story unfold,`,
      `No wahala, no stress, we on a higher road,`,
      `The whole world can see our light — it's time to glow.`,
    ],
    (t) => [
      `We go shine, no matter the weather,`,
      `${capitalize(t || "This dream")} bringing us together,`,
      `Higher, higher, chasing forever,`,
      `Nothing can break what we building together.`,
    ],
    (t) => [
      `The world is mine, I claim it today,`,
      `${capitalize(t || "This power")} lighting every step of my way,`,
      `I been through the storm but I learned how to stay,`,
      `Now the sun keeps rising — and I'm here to play.`,
    ],
    (t) => [
      `Rising up from the dust, we don't stop,`,
      `${capitalize(t || "Every dream")} taking us straight to the top,`,
      `Feel the energy — don't let it drop,`,
      `We moving with purpose, we never gonna flop.`,
    ],
  ],
  Romantic: [
    (t) => [
      `Baby you make my heart beat different,`,
      `${capitalize(t || "This love")} making everything significant,`,
      `Hold me close and stay in this moment,`,
      `With you everything feels so brilliant.`,
    ],
    (t) => [
      `Since the day you walked into my world,`,
      `${capitalize(t || "Your love")} like a flag forever unfurled,`,
      `I see forever every time you smile,`,
      `Stay with me, stay with me — just a little while.`,
    ],
    (t) => [
      `I see forever when I look in your eyes,`,
      `${capitalize(t || "Our love")} reaching higher than the skies,`,
      `No distance, no season, no disguise,`,
      `Just you and I — and our beautiful ties.`,
    ],
    (t) => [
      `Hold me close tonight, don't let me go,`,
      `${capitalize(t || "This feeling")} making my whole body glow,`,
      `You are the rhythm and I am the flow,`,
      `Together we create a beautiful show.`,
    ],
  ],
  Energetic: [
    (t) => [
      `Move your body, feel the rhythm take control,`,
      `${capitalize(t || "This energy")} igniting every single soul,`,
      `Turn it up and let the music make you whole,`,
      `Everybody on the dance floor — lose control.`,
    ],
    (t) => [
      `All eyes on us, we lighting up the room,`,
      `${capitalize(t || "This vibe")} hitting like a sonic boom,`,
      `From Lagos to London, from Accra to Kaboom,`,
      `We going all night — not going home too soon.`,
    ],
    (t) => [
      `Turn it up, we ain't going home tonight,`,
      `${capitalize(t || "This party")} feeling oh so right,`,
      `DJ spin it, keep it tight,`,
      `We living for this moment — what a beautiful night.`,
    ],
    (t) => [
      `Everybody on the dance floor, let it go,`,
      `${capitalize(t || "The music")} got us caught up in the flow,`,
      `Feel the bass line vibrate, feel the glow,`,
      `This is Africa speaking — now you know.`,
    ],
  ],
  Spiritual: [
    (t) => [
      `The ancestors guide my every single step,`,
      `${capitalize(t || "This purpose")} — a promise I have kept,`,
      `Through the fire I rose from every depth,`,
      `I am more than what they said — don't forget.`,
    ],
    (t) => [
      `Connected to something deeper than the eye can see,`,
      `${capitalize(t || "This calling")} was always meant for me,`,
      `Through the struggle I found what I was born to be,`,
      `My spirit rising higher — I was made to be free.`,
    ],
    (t) => [
      `I am more than what they told me I could be,`,
      `${capitalize(t || "This truth")} was always living inside of me,`,
      `Every trial was a lesson, now I clearly see,`,
      `The universe aligned — I claim my destiny.`,
    ],
    (t) => [
      `My spirit rises higher than the mountain peaks,`,
      `${capitalize(t || "This wisdom")} is the power that my soul seeks,`,
      `Through the valley and the shadow, through the weeks,`,
      `I emerge with something golden when the morning speaks.`,
    ],
  ],
  Sad: [
    (t) => [
      `Without you here the silence is so loud,`,
      `${capitalize(t || "This heartbreak")} hanging heavy like a cloud,`,
      `I wear your memory like a heavy shroud,`,
      `I was better when your love was still allowed.`,
    ],
    (t) => [
      `I keep your memory alive here in the dark,`,
      `${capitalize(t || "This longing")} burning like a fading spark,`,
      `You left your love like initials on my heart,`,
      `I never thought that we would drift so far apart.`,
    ],
    (t) => [
      `Trying to move on but I'm stuck in yesterday,`,
      `${capitalize(t || "This pain")} refusing just to fade away,`,
      `Every corner of this city has your name,`,
      `Nothing around here ever feels the same.`,
    ],
    (t) => [
      `The nights get longer since you walked away,`,
      `${capitalize(t || "This emptiness")} just grows with every day,`,
      `I replay every word you didn't say,`,
      `I'm learning how to love from far away.`,
    ],
  ],
};

// ── VERSE 1 by genre ────────────────────────────────────────────────────────

const verses1: Record<string, ((t: string, mood: string) => string[])[]> = {
  Afrobeats: [
    (t) => [
      `I step out looking fresh, the aura is clean,`,
      `They try to figure out what the energy mean,`,
      `Omo, ${t ? `this ${t}` : "no be today"} wey we dey on the scene,`,
      `Taking over the globe, yeah we living the dream.`,
      `Slow whine, catch the tempo, feel the bassline,`,
      `Everything align when the stars shine.`,
    ],
    (t) => [
      `From the streets of Lagos to the world stage bright,`,
      `${capitalize(t || "This hustle")} keeping me going through the night,`,
      `Mama said pray and keep the future in sight,`,
      `Now the whole continent watching — I'm doing it right.`,
      `Nobody gave us this — we earned every beat,`,
      `African excellence — nothing incomplete.`,
    ],
    (t) => [
      `I been moving in silence, let the work speak loud,`,
      `${capitalize(t || "This ambition")} got me standing out the crowd,`,
      `They counted me out but now they saying I'm proud,`,
      `Nigerian born, African made — head bowed.`,
      `The rhythm in my blood is older than time,`,
      `Every step I take is perfectly in rhyme.`,
    ],
  ],
  Afropop: [
    (t) => [
      `Colours of Africa dancing in my veins,`,
      `${capitalize(t || "This music")} washing out the deepest pains,`,
      `From Accra to Nairobi, across the plains,`,
      `Our sound is what the whole world now explains.`,
      `Feel the melody, let it take you higher,`,
      `This is African pop — lighting up your fire.`,
    ],
    (t) => [
      `Put on your best, we stepping out tonight,`,
      `${capitalize(t || "This feeling")} making everything so bright,`,
      `The music finds you even when you try to fight,`,
      `Let the Afropop spirit make it right.`,
      `Hands in the air, we celebrate as one,`,
      `Under the African moon and the blazing sun.`,
    ],
    (t) => [
      `The world is listening to our African sound,`,
      `${capitalize(t || "This movement")} lifting people off the ground,`,
      `From the beaches to the cities, all around,`,
      `A new generation claiming what they found.`,
      `This is not just music — it's a way of life,`,
      `Turning every struggle into something bright.`,
    ],
  ],
  Amapiano: [
    (t) => [
      `Joburg sunrise hitting different this morning,`,
      `${capitalize(t || "The log drum")} giving everyone a warning,`,
      `Piano keys floating soft and adorning,`,
      `Soft life living — no time for mourning.`,
      `Cabinet jumping, bacardi pouring free,`,
      `This is Amapiano and we living royally.`,
    ],
    (t) => [
      `The kota stand, the streets smelling like home,`,
      `${capitalize(t || "This piano")} in my chest wherever I roam,`,
      `Log drum calling — I'm never alone,`,
      `From Soweto to the world — this sound has grown.`,
      `Soft life is not given — it's created here,`,
      `When the piano drops, everything becomes clear.`,
    ],
    (t) => [
      `They said we couldn't — now they dancing to our sound,`,
      `${capitalize(t || "This movement")} shaking the underground,`,
      `From the townships rising up, outward bound,`,
      `Amapiano is the heartbeat of this ground.`,
      `Keys shimmer and the log drum holds it down,`,
      `We been wearing our culture like a crown.`,
    ],
  ],
  Dancehall: [
    (t) => [
      `Inna di dance, everybody feel the vibe,`,
      `${capitalize(t || "This riddim")} keeping everybody alive,`,
      `From Kingston to Lagos, from nine to five,`,
      `This dancehall fire — we go survive.`,
      `The selector spin it and we start to wave,`,
      `This is how the culture behave.`,
    ],
    (t) => [
      `Hot like fire, cold like ice — we versatile,`,
      `${capitalize(t || "This energy")} running every single mile,`,
      `Dancehall fashion, Caribbean style,`,
      `We go keep dem dancing for a long long while.`,
      `The bassline heavy, the lyrics so raw,`,
      `From di island to di mainland — no flaw.`,
    ],
    (t) => [
      `Di riddim drop and everybody start to move,`,
      `${capitalize(t || "This feeling")} putting everybody in the groove,`,
      `From yard to foreign — we got something to prove,`,
      `Dancehall culture, we cannot lose.`,
      `One love to the massive, bless up the crew,`,
      `This energy we carry — through and through.`,
    ],
  ],
  "R&B": [
    (t) => [
      `Candlelight and slow jams fill the room tonight,`,
      `${capitalize(t || "Your presence")} making everything feel right,`,
      `Soul music playing low, the vibe is tight,`,
      `This Afro R&B got us losing sight.`,
      `Your body close to mine, the temperature rise,`,
      `I see forever living in your eyes.`,
    ],
    (t) => [
      `Silky smooth, the way you move across the floor,`,
      `${capitalize(t || "This feeling")} leaving me wanting so much more,`,
      `Afro soul and R&B — my heart is sore,`,
      `Baby tell me what we're really here for.`,
      `The groove is deep, the melody divine,`,
      `When you're near me everything aligns.`,
    ],
    (t) => [
      `Between the sheets of this late night melody,`,
      `${capitalize(t || "Your love")} is what was always meant for me,`,
      `Soul tied together for eternity,`,
      `Afro R&B — this is our remedy.`,
      `Your voice is like a song I've always known,`,
      `With you beside me I'm never alone.`,
    ],
  ],
};

// ── VERSE 2 by mood ─────────────────────────────────────────────────────────

const verses2: Record<string, ((t: string, genre: string) => string[])[]> = {
  Uplifting: [
    (t) => [
      `See how far we don come from nothing,`,
      `Every sacrifice we made wasn't for bluffing,`,
      `Now the whole world dey say something,`,
      `We go leave a mark — that's no assumption.`,
      `Light the way for all them coming after,`,
      `Turn the pain into forever laughter.`,
    ],
    (t) => [
      `They tried to dim us but we burned more bright,`,
      `${capitalize(t || "This purpose")} gave us reason for the fight,`,
      `Every sleepless evening, every restless night,`,
      `Was leading us directly to this light.`,
      `So when they ask us how we made it through,`,
      `We tell them — vision, faith, and staying true.`,
    ],
    (t) => [
      `The road was long and many said we'd fail,`,
      `But ${t || "our story"} — there's no other tale,`,
      `We charted our own course, set our own sail,`,
      `And now the wind of destiny fills our trail.`,
      `This is for the dreamers who refused to quit,`,
      `We kept the fire burning — every bit.`,
    ],
  ],
  Romantic: [
    (t) => [
      `Every morning waking up beside your grace,`,
      `${capitalize(t || "Your love")} written all across your face,`,
      `I never wanna leave this special place,`,
      `With you the whole world moves at our own pace.`,
      `I'd travel every ocean, cross the sea,`,
      `Just to be where you are — loving me.`,
    ],
    (t) => [
      `You showed me what it means to feel alive,`,
      `${capitalize(t || "This love")} the reason that I strive,`,
      `Together we can weather every dive,`,
      `In this love we will forever thrive.`,
      `They say forever is a long time true,`,
      `But forever feels too short when it's with you.`,
    ],
    (t) => [
      `The little things you do undo me every time,`,
      `${capitalize(t || "Your laughter")} is the most beautiful rhyme,`,
      `I never thought that love could feel this fine,`,
      `Until the universe made you mine.`,
      `In a world that moves so fast and cold,`,
      `You are the story that deserves to be told.`,
    ],
  ],
  Energetic: [
    (t) => [
      `Say she want the designer, Prada and more,`,
      `${capitalize(t || "This lifestyle")} — that's what we living for,`,
      `Odogwu level, we popping on the floor,`,
      `Making them wonder what we have in store.`,
      `We don't slow down — we only elevate,`,
      `African kings and queens — this is our estate.`,
    ],
    (t) => [
      `The DJ got the whole place going crazy,`,
      `${capitalize(t || "This vibe")} got nobody feeling lazy,`,
      `From morning to midnight — never hazy,`,
      `The energy we carry never goes wavy.`,
      `When we step in every room shift and change,`,
      `This is what it means to be top range.`,
    ],
    (t) => [
      `Two step, wine down, feel the moment now,`,
      `${capitalize(t || "The music")} showing everybody how,`,
      `From the east to the west, take a bow,`,
      `African heat — we don't know how to slow.`,
      `Pour another round and let the night ignite,`,
      `This celebration burning very bright.`,
    ],
  ],
  Spiritual: [
    (t) => [
      `They said the odds were stacked against my name,`,
      `But ${t || "my purpose"} was never just a game,`,
      `Through the fire I emerged without shame,`,
      `Now I walk in power — nothing the same.`,
      `My fathers faced a harder road than this,`,
      `I honor them with every step I take in bliss.`,
    ],
    (t) => [
      `Something deep inside was always calling out,`,
      `${capitalize(t || "This truth")} removing every shadow of doubt,`,
      `When darkness tried to silence every shout,`,
      `The light within me burned and pushed it out.`,
      `We are more than the struggle that we've known,`,
      `The seeds of greatness in our blood were sown.`,
    ],
    (t) => [
      `I close my eyes and hear the ancestors sing,`,
      `${capitalize(t || "This legacy")} — the gift they chose to bring,`,
      `Through every season — winter, summer, spring,`,
      `I walk in purpose like a chosen king.`,
      `What they built in silence speaks through me today,`,
      `Their sacrifice lights up my every way.`,
    ],
  ],
  Sad: [
    (t) => [
      `I find your things around and stop and stare,`,
      `${capitalize(t || "This absence")} floating heavy in the air,`,
      `I reach across the bed — you're not there,`,
      `I never thought that love could be so unfair.`,
      `People say it fades but I'm not sure,`,
      `I loved you to the bone, to the core.`,
    ],
    (t) => [
      `The photographs still hanging on the wall,`,
      `${capitalize(t || "Your laughter")} echoing through the hall,`,
      `I thought we were forever — standing tall,`,
      `I never thought I'd watch you let us fall.`,
      `Now I'm learning who I am without you here,`,
      `Still discovering how to hold the tear.`,
    ],
    (t) => [
      `Friends tell me to move forward and move on,`,
      `But ${t || "this love"} — I can't pretend it's gone,`,
      `I still hear you in every favorite song,`,
      `I keep asking myself what I did wrong.`,
      `Maybe some things aren't meant to stay,`,
      `Maybe love just slowly fades away.`,
    ],
  ],
};

// ── BRIDGES by genre ─────────────────────────────────────────────────────────

const bridges: Record<string, string[][]> = {
  Afrobeats: [
    [
      `(Oouuu yeah yeah)`,
      `Take it slow, make we flow,`,
      `Anywhere the music go, we go go.`,
      `(Oouuu yeah yeah)`,
      `Let it breathe — let it shine.`,
    ],
    [
      `(E don do, e don do)`,
      `We no go back to the old way,`,
      `This is a new day, a new wave.`,
      `(E don do, e don do)`,
      `The future is ours — no delay.`,
    ],
    [
      `(Ayeee, ayeee)`,
      `Soft life is the only life,`,
      `No more suffering, no more strife.`,
      `(Ayeee, ayeee)`,
      `We made it — and we doing it right.`,
    ],
  ],
  Afropop: [
    [
      `(La la la, la la la)`,
      `This music is our celebration,`,
      `Africa rising across every nation.`,
      `(La la la, la la la)`,
      `We carry this sound — our foundation.`,
    ],
    [
      `(Oh oh oh oh)`,
      `The melody lives inside us all,`,
      `We answer every time the rhythms call.`,
      `(Oh oh oh oh)`,
      `Together we rise — we never fall.`,
    ],
    [
      `(Woo-ooh, woo-ooh)`,
      `This is the song of our generation,`,
      `Dancing together — one celebration.`,
      `(Woo-ooh, woo-ooh)`,
      `Africa's finest — no hesitation.`,
    ],
  ],
  Amapiano: [
    [
      `(Piano keys fade in)`,
      `Log drum calling, we can't resist,`,
      `Soft life living — the ultimate bliss.`,
      `(Piano swells)`,
      `Joburg nights like this — I won't dismiss.`,
    ],
    [
      `(Basses hum, piano trickles)`,
      `Everything soft, everything clean,`,
      `This is the best life has ever been.`,
      `(Breakdown builds)`,
      `Amapiano dreams — you know what I mean.`,
    ],
    [
      `(Keys shimmer low)`,
      `We don't rush — we take our time,`,
      `Every note falling perfectly in rhyme.`,
      `(Log drum returns)`,
      `This is our sound — this rhythm is mine.`,
    ],
  ],
  Dancehall: [
    [
      `(Riddim drops low)`,
      `Everybody wave, everybody sway,`,
      `This is how we live from day to day.`,
      `(Horns blare)`,
      `Dancehall love — forever here to stay.`,
    ],
    [
      `(Selector rewind it)`,
      `From di island to di mainland strong,`,
      `We been carrying this culture all along.`,
      `(Crowd responds)`,
      `One love, one vibe — we all belong.`,
    ],
    [
      `(Bass heavy drop)`,
      `The fire in we can't be denied,`,
      `Dancehall spirit burning deep inside.`,
      `(Hype man calls)`,
      `We rise together — that's our pride.`,
    ],
  ],
  "R&B": [
    [
      `(Mm-mmm, baby)`,
      `You don't even know what you do to me,`,
      `Every moment with you — I just want to be.`,
      `(Falsetto rises)`,
      `Stay a little longer — just you and me.`,
    ],
    [
      `(Ohh, yeah yeah)`,
      `Time stops when you walk into the room,`,
      `Erasing every shadow, every gloom.`,
      `(Harmonies float)`,
      `Your love is like a beautiful perfume.`,
    ],
    [
      `(Whispered)`,
      `Slow down, slow down,`,
      `Let this moment take us where we're bound.`,
      `(Voice rises)`,
      `In your arms is where I want to be found.`,
    ],
  ],
};

// ── PRODUCTION NOTES ─────────────────────────────────────────────────────────

interface ProductionNotes {
  chordVibe: string;
  melodyDirection: string;
  arrangement: string;
}

const productionNotes: Record<string, ProductionNotes[]> = {
  Afrobeats: [
    {
      chordVibe: "Minor pentatonic, 98 BPM. Talking drum and shaker intro, afro percussion builds from bar 4.",
      melodyDirection: "Hook sits in the mid-upper range (A4–D5). Use call-and-response between lead vocal and ad-libs on every chorus return.",
      arrangement: "Intro: sparse percussion. Verse 1: bass enters. Chorus: full instrumentation drops. Verse 2: add layers + backing vocal. Bridge: strip back to drums only, then rebuild.",
    },
    {
      chordVibe: "Cm–Fm–Abmaj7–G7, 102 BPM. Conga pattern locks with bass guitar groove throughout.",
      melodyDirection: "Verse melody stays conversational and low. Hook jumps an octave for impact. Ad-lib track should be punchy on every fourth bar.",
      arrangement: "Cold intro with guitar riff. Verse 1 builds. Drop on chorus. Repeat pattern, bridge serves as emotional peak before final chorus.",
    },
    {
      chordVibe: "Dm–Am–C–G progression, 96 BPM. Bell-tone lead, synth bass, light shaker.",
      melodyDirection: "Lead vocal melodic — close to Afroswing territory. Hook should have a singalong quality. Layer harmonies from Verse 2 onwards.",
      arrangement: "Straight to Verse 1. Chorus explodes. Bridge strips to minimal. Final chorus with full harmonies and string stabs for cinematic close.",
    },
  ],
  Afropop: [
    {
      chordVibe: "Gmaj–Em–Cmaj–D, 104 BPM. Bright acoustic guitar, piano, soft percussion.",
      melodyDirection: "Bright, singable hook in G major. Verses can dip lower for contrast. Use high harmonies on the final chorus repeat.",
      arrangement: "Ukulele or acoustic intro. Verse 1: add piano + kick. Chorus: full production. Bridge: just guitar and vocal for intimacy. Final chorus: layer everything.",
    },
    {
      chordVibe: "F–Am–Bb–C progression, 108 BPM. Percussive acoustic, marimba accents, light synth pads.",
      melodyDirection: "Punchy, rhythmic verse delivery. Hook should feel effortless and light. Experiment with falsetto in the bridge for contrast.",
      arrangement: "Pan-African percussion intro. Build verse 1 gradually. Big chorus drop. Verse 2 adds extra layer. End with stripped vocal over lone guitar.",
    },
    {
      chordVibe: "Amaj–F#m–D–E, 100 BPM. Clean electric guitar, soft synth pad, tambourine, light kick.",
      melodyDirection: "Hook should be easy to remember after one listen — keep it short and punchy. Verse melody more conversational and wordy.",
      arrangement: "Open with synth pad and vocal. Verse 1: light percussion enters. Chorus full drop. Bridge: just synth pad, bass and voice. Outro: instrumental fade.",
    },
  ],
  Amapiano: [
    {
      chordVibe: "Fm–Db–Ab–Eb, 112 BPM. Log drum-led, wide stereo piano chords, sub-bass underneath.",
      melodyDirection: "Vocal should be smooth and relaxed — almost conversational. Hook is melodic but subtle. The piano carries the emotional weight.",
      arrangement: "Cold open: log drum only. Piano enters at bar 4. Vocal starts soft. Build progressively, with big piano drop on the hook. Bridge: piano-only breakdown.",
    },
    {
      chordVibe: "Cm–Gm–Bb–Fm, 115 BPM. Log drum, guitar stabs, shimmering piano keys, sub bass.",
      melodyDirection: "Smooth, silky vocal delivery. Don't fight the piano — float above it. Use spoken-word section in the bridge for contrast.",
      arrangement: "Intro: log drum + piano. Verse 1 floats in. Hook: full bounce. Verse 2 adds guitar. Bridge: spoken word over log drum. End: full Piano ensemble close.",
    },
    {
      chordVibe: "Abmaj7–Eb–Cm–Fm, 110 BPM. Soft log drum groove, piano runs in upper register, gentle bass line.",
      melodyDirection: "Dreamy, smooth hook. Vocal should sound effortless. Use light harmonies in the chorus and a single vocal run at the end of every hook line.",
      arrangement: "Soft piano intro. Verse eases in. Chorus drops with log drum + bass together. Bridge: piano solo, minimal vocals. Final chorus: lush, full arrangement.",
    },
  ],
  Dancehall: [
    {
      chordVibe: "Minor reggae chords at 140 BPM. One-drop riddim, heavy bass, organ stabs on offbeat.",
      melodyDirection: "Verse delivery: toasting style, rhythmic and confident. Hook can be melodic or patois singalong. Ad-libs are essential — keep them punchy.",
      arrangement: "Riddim intro. Verse 1: no verse — straight riddim drop. Hook. Verse 2: same riddim. Bridge: acapella toasting. Final hook: full sound system energy.",
    },
    {
      chordVibe: "Gm–Eb–Bb–F, 135 BPM. Dancehall digital riddim, synth bass, snare on 3.",
      melodyDirection: "Vocal should move fluidly between singing and chanting. Hook should be repeatable and crowd-ready. Bridge is the artist's moment to freestyle.",
      arrangement: "Quick intro, straight into verse. Chorus explodes. Breakdown mid-song with minimal beat. Build back to final chorus with full sound system response.",
    },
    {
      chordVibe: "Dm–Gm–Am–C, 138 BPM. Steppers rhythm, bass guitar thump, high-hat triplets.",
      melodyDirection: "Aggressive and direct verse delivery. Hook should contrast by being more melodic and smooth. Shift energy completely between verse and chorus.",
      arrangement: "Open with riddim. Verse 1: tight and punchy. Hook: melodic drop. Verse 2: bring energy up. Bridge: stripped to one bar loop. Final hook: crowd chant.",
    },
  ],
  "R&B": [
    {
      chordVibe: "Fm–Dbmaj7–Ab–Eb, 80 BPM. Rhodes piano, soft kick, hi-hat brush, string pads.",
      melodyDirection: "Smooth, intimate vocal delivery. Hook should feel warm and close to the ear. Use falsetto strategically — especially at the end of hook lines.",
      arrangement: "Intimate piano intro. Verse 1: bass enters softly. Chorus: strings swell. Verse 2: drums and bass more present. Bridge: stripped vocal over Rhodes only. Final chorus: full lush production.",
    },
    {
      chordVibe: "Gm–Cm–Ebmaj7–F, 84 BPM. Soft trap-influenced hi-hats, bass guitar, synth pad, warm Rhodes.",
      melodyDirection: "Verse melody should feel conversational and intimate. Hook should feel like the emotional peak. Use ad-libs and harmonies throughout.",
      arrangement: "Bass-only intro, vocal enters dry. Chorus: full production drop. Bridge: a cappella or near-acapella for raw emotion. Final chorus: everything returns plus strings.",
    },
    {
      chordVibe: "Am–F–C–G, 88 BPM. Live bass, acoustic guitar, soft percussion, vocal chops.",
      melodyDirection: "Lead in the higher range for the hook. Keep verses grounded and soulful. Stack harmonies three deep on the final chorus repeat.",
      arrangement: "Guitar-led intro. Verse 1: soft and intimate. Pre-chorus builds. Chorus: full sound. Bridge: break down to minimal. Final chorus: maximum production with harmonies.",
    },
  ],
};

// ── MAIN GENERATOR ───────────────────────────────────────────────────────────

export function generateSongDraft(
  topic: string,
  genre: string,
  mood: string,
  _style: string,
  seed: number
): SongDraft {
  const t = topic.trim().toLowerCase() || "tonight";
  const g = genre in verses1 ? genre : "Afrobeats";
  const m = mood in hooks ? mood : "Uplifting";

  const hookFns = hooks[m];
  const v1Fns = verses1[g];
  const v2Fns = verses2[m];
  const bridgeList = bridges[g];
  const prodList = productionNotes[g];

  const hookLines = pick(hookFns, seed)(t);
  const verse1Lines = pick(v1Fns, seed, 1)(t, m);
  const verse2Lines = pick(v2Fns, seed, 2)(t, g);
  const bridgeLines = pick(bridgeList, seed, 3);
  const prod = pick(prodList, seed, 4);

  return {
    title: buildTitle(topic, g, seed),
    hook: hookLines,
    verse1: verse1Lines,
    verse2: verse2Lines,
    bridge: bridgeLines,
    chordVibe: prod.chordVibe,
    melodyDirection: prod.melodyDirection,
    arrangement: prod.arrangement,
  };
}

export function formatDraftForClipboard(draft: SongDraft, genre: string, mood: string): string {
  const line = "─".repeat(48);
  return [
    `${draft.title.toUpperCase()}`,
    `Generated by AfroMuse AI · ${genre} · ${mood}`,
    line,
    "",
    "[ HOOK / CHORUS ]",
    ...draft.hook,
    "",
    "[ VERSE 1 ]",
    ...draft.verse1,
    "",
    "[ HOOK / CHORUS ]",
    ...draft.hook,
    "",
    "[ VERSE 2 ]",
    ...draft.verse2,
    "",
    "[ BRIDGE ]",
    ...draft.bridge,
    "",
    "[ HOOK / CHORUS ]",
    ...draft.hook,
    "",
    line,
    "PRODUCTION NOTES",
    line,
    `Chord / Vibe: ${draft.chordVibe}`,
    `Melody Direction: ${draft.melodyDirection}`,
    `Arrangement: ${draft.arrangement}`,
    "",
    "─ Created with AfroMuse AI ─",
  ].join("\n");
}

export interface SavedProject {
  id: string;
  title: string;
  genre: string;
  mood: string;
  topic: string;
  style: string;
  draft: SongDraft;
  savedAt: string;
}

export function saveProjectToStorage(
  topic: string,
  genre: string,
  mood: string,
  style: string,
  draft: SongDraft
): void {
  const existing: SavedProject[] = JSON.parse(
    localStorage.getItem("afromuse_projects") ?? "[]"
  );
  const newProject: SavedProject = {
    id: `proj_${Date.now()}`,
    title: draft.title,
    genre,
    mood,
    topic,
    style,
    draft,
    savedAt: new Date().toISOString(),
  };
  const updated = [newProject, ...existing].slice(0, 50);
  localStorage.setItem("afromuse_projects", JSON.stringify(updated));
}

export function persistProjects(projects: SavedProject[]): void {
  localStorage.setItem("afromuse_projects", JSON.stringify(projects));
}

export function loadProjectsFromStorage(): SavedProject[] {
  return JSON.parse(localStorage.getItem("afromuse_projects") ?? "[]");
}
