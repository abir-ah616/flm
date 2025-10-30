import { useEffect, useState } from "react";
import { supabase, Tournament } from "../lib/supabase";
import { TournamentCard } from "../components/TournamentCard";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { getBDTDateString, formatBDTDate, isTournamentStillActive } from "../lib/timezone";

export function TodayPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayTournaments();
  }, []);

  const fetchTodayTournaments = async () => {
    setLoading(true);
    const today = getBDTDateString();

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("date", today)
      .in("status", ["scheduled", "delayed"])
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching tournaments:", error);
    } else {
      const filteredTournaments = (data || []).filter((tournament) =>
        isTournamentStillActive(tournament.start_time)
      );
      setTournaments(filteredTournaments);
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/50">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-heading font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
            Today's Tournaments
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">
            {formatBDTDate(getBDTDateString())}
          </p>
        </motion.div>

        {tournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No tournaments today
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-body">
              Enjoy your free time!
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
