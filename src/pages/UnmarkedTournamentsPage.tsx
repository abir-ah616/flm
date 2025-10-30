import { useEffect, useState } from "react";
import { supabase, Tournament } from "../lib/supabase";
import { MagicCard } from "../components/MagicCard";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { isTournamentPast } from "../lib/timezone";

export function UnmarkedTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUnmarkedTournaments();
  }, []);

  const fetchUnmarkedTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "scheduled")
      .order("date", { ascending: false })
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching tournaments:", error);
    } else {
      const pastTournaments = (data || []).filter((tournament) =>
        isTournamentPast(tournament.date, tournament.start_time)
      );
      setTournaments(pastTournaments);
    }
    setLoading(false);
  };

  const updateTournamentStatus = async (
    id: string,
    status: "completed" | "canceled"
  ) => {
    setUpdating(id);

    const tournament = tournaments.find(t => t.id === id);
    if (!tournament) {
      setUpdating(null);
      return;
    }

    let finalStatus: "completed" | "qualified" | "canceled" = status;

    if (status === "completed") {
      const qualifyingTypes = ["Qualifier", "Quarter Final", "Semi Final"];
      if (tournament.tournament_type && qualifyingTypes.includes(tournament.tournament_type)) {
        finalStatus = "qualified";
      }
    }

    const { error } = await supabase
      .from("tournaments")
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error("Error updating tournament:", error);
      alert("Error updating tournament status");
    } else {
      fetchUnmarkedTournaments();
    }
    setUpdating(null);
  };

  const getTimeSincePast = (startTimeString: string) => {
    const now = new Date();
    const startTime = new Date(startTimeString);
    const diffMs = now.getTime() - startTime.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    }
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
          className="mb-12"
        >
          <div className="flex justify-start mb-6">
            <button
              onClick={() => {
                window.history.pushState({}, "", "/admin");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 mb-4 shadow-lg shadow-orange-500/50">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-3">
              Unmarked Tournaments
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Tournaments that need status updates
            </p>
            {tournaments.length > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""} require
                attention
              </div>
            )}
          </div>
        </motion.div>

        {tournaments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mb-4">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              All caught up!
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              No tournaments need status updates
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <MagicCard className="p-4 sm:p-6" gradientColor="#f97316">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 sm:gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                            {tournament.tournament_name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-orange-500 dark:text-orange-400 font-medium">
                            <Clock className="w-4 h-4" />
                            <span>Started {getTimeSincePast(tournament.start_time)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Date:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                            {new Date(tournament.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Start:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                            {new Date(tournament.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Maps:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                            {tournament.maps}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Room:</span>
                          <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium truncate">
                            {tournament.room_type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => updateTournamentStatus(tournament.id, "completed")}
                        disabled={updating === tournament.id}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Completed</span>
                      </button>
                      <button
                        onClick={() => updateTournamentStatus(tournament.id, "canceled")}
                        disabled={updating === tournament.id}
                        className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Mark Canceled</span>
                      </button>
                    </div>
                  </div>
                </MagicCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
