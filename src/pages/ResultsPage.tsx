import { useEffect, useState } from "react";
import { supabase, Tournament } from "../lib/supabase";
import { TournamentCard } from "../components/TournamentCard";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export function ResultsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "qualified" | "canceled">("all");

  useEffect(() => {
    fetchResults();
  }, [filter]);

  const fetchResults = async () => {
    setLoading(true);
    let query = supabase
      .from("tournaments")
      .select("*")
      .in("status", ["completed", "qualified", "canceled"])
      .order("date", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tournaments:", error);
    } else {
      setTournaments(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/50">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-heading font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-3">
            Tournament Results
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">
            Past matches and outcomes
          </p>
        </motion.div>

        <div className="flex justify-center gap-3 mb-8 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-full font-body font-medium transition-all ${
              filter === "all"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/50"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-6 py-2 rounded-full font-body font-medium transition-all ${
              filter === "completed"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("qualified")}
            className={`px-6 py-2 rounded-full font-body font-medium transition-all ${
              filter === "qualified"
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Qualified
          </button>
          <button
            onClick={() => setFilter("canceled")}
            className={`px-6 py-2 rounded-full font-body font-medium transition-all ${
              filter === "canceled"
                ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/50"
                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Canceled
          </button>
        </div>

        {tournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Trophy className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No results yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-body">
              Completed tournaments will appear here
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {tournaments.map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                delay={index * 0.1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
