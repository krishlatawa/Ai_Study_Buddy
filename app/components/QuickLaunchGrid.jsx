import Link from "next/link";
import PropTypes from "prop-types";
import Icon from "./Icon";

const scrollToPomodoro = () => {
  const el = document.getElementById("pomodoro-timer");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const handleCardClick = (item) => {
  if (item.id === "pomodoro") {
    scrollToPomodoro();
  }
};

const launchItems = [
  {
    id: "pomodoro",
    title: "Focus / Pomodoro",
    description: "Tune your sprint and reset rhythm.",
    accent: "var(--accent-info)",
    icon: "focus",
    variant: "cyan",
  },
  {
    title: "Quiz Generator",
    description: "Generate AI quizzes from your notes.",
    accent: "#7B5CFF",
    icon: "badge",
    variant: "purple",
    href: "/quiz",
  },
  {
    title: "Teach-Back AI",
    description: "Explain concepts to an AI student. Find your weak spots!",
    accent: "#FF6B35",
    icon: "chat",
    variant: "orange",
    href: "/feynman",
  },
];

function LaunchCard({ item }) {
  if (item.id === "pomodoro") {
    return (
      <button
        onClick={() => handleCardClick(item)}
        type="button"
        className="flex h-full w-full flex-col rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-1 text-left cursor-pointer"
        style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 20px ${item.accent}22` }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="h-2 w-16 rounded-full" style={{ backgroundColor: item.accent }} />
          <Icon name={item.icon} variant={item.variant} />
        </div>
        <h3 className="mt-4 text-lg font-black text-white" style={{ fontFamily: "var(--theme-font-display)" }}>
          {item.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{item.description}</p>
        <span className="mt-4 inline-flex text-sm font-semibold min-h-[44px] items-center" style={{ color: item.accent }}>
          Open →
        </span>
      </button>
    );
  }

  return (
    <article
      className="flex h-full flex-col rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-1"
      style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 0 20px ${item.accent}22` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="h-2 w-16 rounded-full" style={{ backgroundColor: item.accent }} />
        <Icon name={item.icon} variant={item.variant} />
      </div>
      <h3 className="mt-4 text-lg font-black text-white" style={{ fontFamily: "var(--theme-font-display)" }}>
        {item.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{item.description}</p>
      <span className="mt-4 inline-flex text-sm font-semibold min-h-[44px] items-center" style={{ color: item.accent }}>
        Open →
      </span>
    </article>
  );
}

LaunchCard.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    accent: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    variant: PropTypes.string.isRequired,
    href: PropTypes.string,
  }).isRequired,
};

export default function QuickLaunchGrid() {
  return (
    <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {launchItems.map((item) =>
        item.href ? (
          <Link key={item.title} href={item.href} className="block h-full">
            <LaunchCard item={item} />
          </Link>
        ) : (
          <LaunchCard key={item.title} item={item} />
        )
      )}
    </section>
  );
}

QuickLaunchGrid.propTypes = {};

