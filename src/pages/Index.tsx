import tomatoImg from "@/assets/tomato-hero.png";

const MetaStrip = () => {
  const items = [
    "♥ Match on: shared avoidance",
    "✓ Rank: 1 → 5 honest",
    "☺ Vibe: accountability, not guilt",
    "♥ Match on: shared avoidance",
    "✓ Rank: 1 → 5 honest",
    "☺ Vibe: accountability",
  ];
  return (
    <div className="w-full border-b border-border overflow-hidden">
      <div className="flex items-center h-[34px] animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-foreground text-[13px] font-pixel mx-6 shrink-0">{item}</span>
        ))}
      </div>
    </div>
  );
};

const TopBar = () => (
  <div className="w-full border-b border-border flex items-center justify-between px-6 h-[34px]">
    <span className="text-foreground text-[14px] font-pixel">Finally</span>
    <span className="text-foreground text-[12px] font-pixel hidden md:block">Procrastination-positive dating • 5 ranked things</span>
    <span className="text-foreground text-[14px] font-pixel cursor-pointer hover:opacity-70">Jump in</span>
  </div>
);

const Hero = () => (
  <section className="relative w-full flex flex-col items-center justify-center min-h-[600px] md:min-h-[700px] py-16 overflow-hidden">
    <img
      src={tomatoImg}
      alt="A giant glossy tomato"
      width={1024}
      height={1024}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[550px] h-auto pointer-events-none select-none z-0 opacity-95"
    />
    <div className="relative z-10 flex flex-col items-center text-center px-4">
      <h1 className="text-[50px] md:text-[80px] leading-[0.95] font-bold font-pixel text-primary-foreground drop-shadow-[0_2px_8px_rgba(142,22,6,0.3)] mb-8">
        Finally,<br />someone<br />who gets<br />your<br />to-do list
      </h1>
      <p className="font-mono-space text-foreground text-[12px] md:text-[14px] leading-relaxed max-w-[340px] mb-8">
        Rank the five things you keep putting off.<br />
        We match you with people procrastinating<br />
        on the same stuff so you can cheer each<br />
        other on, vent, or actually do the thing<br />
        together.
      </p>
      <button className="bg-primary text-primary-foreground font-pixel text-[16px] px-8 py-3 rounded-full border border-border hover:opacity-90 transition-opacity mb-4">
        Start your list
      </button>
      <span className="text-foreground text-[11px] font-mono-space opacity-40">
        No scrolling guilt, no big ask.
      </span>
    </div>
  </section>
);

const Divider = () => <hr className="border-t border-border w-full" />;

const SectionHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="w-full py-16 md:py-24 flex flex-col items-center text-center px-4">
    <h2 className="text-[32px] md:text-[45px] font-bold font-pixel text-foreground mb-4">{title}</h2>
    <p className="font-mono-space text-foreground text-[12px] md:text-[14px] opacity-70 max-w-[400px]">{subtitle}</p>
  </div>
);

const steps = [
  { num: "01", title: "Pick your top 5", body: 'The chores, emails, life admin, or scary tasks you\'ve been avoiding—ranked from "I\'ll do it someday" to "I\'m actively avoiding this."' },
  { num: "02", title: "We find overlap", body: 'Similar items on two lists = a higher match score. Same energy as liking the same band, except it\'s "we both haven\'t called the dentist."' },
  { num: "03", title: "Connect (for real)", body: "Chat, body-double over video, or trade accountability nudges with someone who finally understands why you haven't folded that laundry." },
];

const HowItWorks = () => (
  <div className="w-full max-w-[1500px] mx-auto border-t border-border">
    <div className="grid grid-cols-1 md:grid-cols-3">
      {steps.map((s, i) => (
        <div key={i} className={`p-8 md:p-10 ${i < 2 ? "md:border-r border-border" : ""} ${i > 0 ? "border-t md:border-t-0 border-border" : ""}`}>
          <span className="text-foreground text-[12px] font-mono-space opacity-50 block mb-4">{s.num}</span>
          <h3 className="text-[18px] md:text-[20px] font-bold font-pixel text-foreground mb-4">{s.title}</h3>
          <p className="text-[13px] font-mono-space text-foreground opacity-70 leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);

const TaskRow = ({ num, text }: { num: number; text: string }) => (
  <div className="flex items-center gap-3 border border-border rounded-full px-4 py-2.5 bg-secondary mb-2">
    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[11px] font-pixel flex items-center justify-center shrink-0">{num}</span>
    <span className="text-foreground text-[13px] font-mono-space">{text}</span>
  </div>
);

const mayaTasks = [
  "Reply to scary email from landlord",
  "Book dentist",
  "Sort the junk drawer",
  "Cancel unused subscriptions",
  "Text friend I ghosted by accident",
];

const jordanTasks = [
  "File taxes (again)",
  "Book dentist",
  "Return the package",
  "Deep-clean fridge",
  "Finish side project README",
];

const ProfileColumn = ({ name, tasks, emoji }: { name: string; tasks: string[]; emoji: string }) => (
  <div className="flex flex-col items-center p-8 md:p-10">
    <div className="w-16 h-16 rounded-full border-2 border-border flex items-center justify-center text-[28px] mb-3">{emoji}</div>
    <h3 className="text-[20px] font-bold font-pixel text-foreground mb-1">{name}</h3>
    <span className="text-[11px] font-mono-space text-foreground opacity-50 mb-6">5 things I'm avoiding</span>
    <div className="w-full max-w-[380px]">
      {tasks.map((t, i) => <TaskRow key={i} num={i + 1} text={t} />)}
    </div>
  </div>
);

const SampleLists = () => (
  <div className="w-full max-w-[1500px] mx-auto border-t border-border">
    <div className="grid grid-cols-1 md:grid-cols-2">
      <ProfileColumn name="Maya" tasks={mayaTasks} emoji="🍅" />
      <div className="border-t md:border-t-0 md:border-l border-border">
        <ProfileColumn name="Jordan" tasks={jordanTasks} emoji="🫕" />
      </div>
    </div>
  </div>
);

const MatchHint = () => (
  <div className="w-full max-w-[1500px] mx-auto border-t border-border px-8 py-5">
    <p className="text-[12px] font-mono-space text-foreground opacity-70">
      ♥ <strong>Match hint:</strong> Maya and Jordan both have "Book dentist" on their lists—classic overlap.
    </p>
  </div>
);

const miniMatches = [
  { name: "Ravi", overlap: "3 / 5 OVERLAP", items: 'Inbox zero, gym, "that one folder"' },
  { name: "Sam", overlap: "2 / 5 OVERLAP", items: "Tax stuff, calling mom back" },
  { name: "Alex", overlap: "4 / 5 OVERLAP", items: "Car registration, resume, plants…" },
];

const MiniMatchCard = ({ name, overlap, items, isLast }: { name: string; overlap: string; items: string; isLast: boolean }) => (
  <div className={`p-8 md:p-10 ${!isLast ? "md:border-r border-border border-b md:border-b-0" : ""}`}>
    <div className="flex items-center justify-between mb-6">
      <span className="text-[11px] font-mono-space border border-border rounded-full px-3 py-1 text-foreground">{overlap}</span>
      <span className="text-[14px]">♥</span>
    </div>
    <h4 className="text-[18px] font-bold font-pixel text-foreground mb-2">{name}</h4>
    <span className="text-[10px] font-mono-space text-foreground opacity-50 tracking-wider block mb-1">ALSO PUTTING OFF:</span>
    <p className="text-[13px] font-mono-space text-foreground opacity-70 mb-6">{items}</p>
    <button className="text-[12px] font-pixel border border-border rounded-full px-4 py-1.5 text-foreground hover:opacity-70 transition-opacity">
      Say hi (soon)
    </button>
  </div>
);

const MiniMatches = () => (
  <div className="w-full max-w-[1500px] mx-auto border-t border-border">
    <div className="grid grid-cols-1 md:grid-cols-3">
      {miniMatches.map((m, i) => (
        <MiniMatchCard key={i} {...m} isLast={i === miniMatches.length - 1} />
      ))}
    </div>
  </div>
);

const Footer = () => (
  <div className="w-full border-t border-border py-16 flex flex-col items-center text-center px-4">
    <p className="text-[18px] md:text-[22px] font-pixel text-foreground mb-3">
      <strong>Finally</strong> — match on what you're not doing yet.
    </p>
    <span className="text-[11px] font-mono-space text-foreground opacity-40">
      Concept homepage • no data stored • no backend
    </span>
  </div>
);

const Index = () => (
  <div className="w-full min-h-screen bg-background">
    <TopBar />
    <MetaStrip />
    <Hero />
    <Divider />
    <SectionHeading title="How it works" subtitle='Five items. One honest list. Better matches than "I like hiking."' />
    <HowItWorks />
    <Divider />
    <SectionHeading title="Sample lists" subtitle="Two fake profiles. Notice the overlap— that's the spark." />
    <SampleLists />
    <MatchHint />
    <Divider />
    <SectionHeading title="Your kind of people" subtitle="Mock matches—imagine these as swipeable cards with shared procrastination DNA." />
    <MiniMatches />
    <Footer />
  </div>
);

export default Index;
