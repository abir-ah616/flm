import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Calendar, Trophy, Shield } from "lucide-react";

interface Tab {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  path?: never;
}

type TabItem = Tab | Separator;

interface DockNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  showAdmin?: boolean;
}

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: {
    width: "auto",
    opacity: 1,
    transition: { delay: 0.05, duration: 0.2, ease: "easeOut" },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: { duration: 0.1, ease: "easeIn" },
  },
};

export function DockNavigation({ currentPath, onNavigate, showAdmin = false }: DockNavigationProps) {
  const [selected, setSelected] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const TABS: TabItem[] = [
    { title: "Today", icon: Home, path: "/" },
    { title: "Upcoming", icon: Calendar, path: "/upcoming" },
    { title: "Results", icon: Trophy, path: "/results" },
    ...(showAdmin ? [
      { type: "separator" as const },
      { title: "Admin", icon: Shield, path: "/admin" },
    ] : []),
  ];

  useEffect(() => {
    const tabIndex = TABS.findIndex((tab) => tab.type !== "separator" && tab.path === currentPath);
    if (tabIndex !== -1) {
      setSelected(tabIndex);
    }
  }, [currentPath]);

  const handleSelect = (index: number, path: string) => {
    setSelected(index);
    onNavigate(path);
  };

  const SeparatorComponent = () => (
    <div className="h-7 w-px bg-slate-300/50 dark:bg-slate-600/50" aria-hidden="true" />
  );

  return (
    <div
      ref={containerRef}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-full border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-black/80 p-1.5 shadow-2xl backdrop-blur-xl"
    >
      {TABS.map((tab, index) => {
        if (tab.type === "separator") {
          return <SeparatorComponent key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = selected === index;

        return (
          <button
            key={tab.title}
            onClick={() => handleSelect(index, tab.path)}
            className={`relative z-10 flex items-center rounded-full px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none
              ${
                isSelected
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              }
            `}
          >
            {isSelected && (
              <motion.div
                layoutId="pill"
                className="absolute inset-0 z-0 rounded-full bg-emerald-50 dark:bg-emerald-500/20 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-400/30 shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-5 w-5 flex-shrink-0" />
              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.span
                    variants={spanVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {tab.title}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
        );
      })}
    </div>
  );
}
