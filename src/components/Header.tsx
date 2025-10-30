import { motion } from "framer-motion";

export function Header() {
  return (
    <header className="relative w-full py-3 px-6 bg-slate-950/50 backdrop-blur-sm border-b border-slate-800 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <img
            src="/logo.png"
            alt="Flame Gaming Logo"
            className="h-12 w-12 object-contain"
          />
          <h1 className="text-2xl font-display font-bold text-white tracking-wider">
            FLAME GAMING
          </h1>
        </motion.div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 w-32 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
        animate={{
          x: ["-8rem", "100vw"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </header>
  );
}
