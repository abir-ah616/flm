import { useEffect, useState } from "react";
import { supabase, Tournament } from "../lib/supabase";
import { TournamentCard } from "../components/TournamentCard";
import { motion } from "framer-motion";
import { Medal } from "lucide-react";

export function QualifiedPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQualified();
  }, []);

  const fetchQualified = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "qualified")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching qualified tournaments:", error);
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
          className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-4 shadow-lg shadow-blue-500/50">
            <Medal className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-heading font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Qualified Tournaments
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">
            Qualifier, Quarter Final, and Semi Final results
          </p>
        </motion.div>

        {tournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Medal className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No qualified tournaments yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-body">
              Completed qualifiers will appear here
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
