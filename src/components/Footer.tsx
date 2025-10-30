import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="relative w-full mt-auto">
      <div className="relative overflow-hidden bg-slate-950/80 backdrop-blur-sm border-t border-slate-800">
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.3), transparent)",
          }}
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="relative max-w-7xl mx-auto py-8 px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <motion.img
              src="/Transparent.png"
              alt="Ruthless Raiders Logo"
              className="h-12 w-12 object-contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <h2 className="text-2xl font-bold text-white tracking-wider">
                RUTHLESS RAIDERS
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                © {new Date().getFullYear()} All rights reserved
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
