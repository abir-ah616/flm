import { useEffect, useState } from "react";
import { supabase, Tournament } from "../lib/supabase";
import { TournamentCard } from "../components/TournamentCard";
import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { getBDTDateString, formatBDTDate, compareBDTDates } from "../lib/timezone";

interface GroupedTournaments {
  [date: string]: Tournament[];
}

export function UpcomingPage() {
  const [groupedTournaments, setGroupedTournaments] = useState<GroupedTournaments>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingTournaments();
  }, []);

  const fetchUpcomingTournaments = async () => {
    setLoading(true);
    const today = getBDTDateString();

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .gte("date", today)
      .in("status", ["scheduled", "delayed"])
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching tournaments:", error);
    } else {
      const grouped = (data || []).reduce((acc: GroupedTournaments, tournament) => {
        const date = tournament.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(tournament);
        return acc;
      }, {});
      setGroupedTournaments(grouped);
    }
    setLoading(false);
  };

  const formatDateHeader = (dateString: string) => {
    if (compareBDTDates(dateString, 'today')) {
      return "Today";
    } else if (compareBDTDates(dateString, 'tomorrow')) {
      return "Tomorrow";
    } else {
      return formatBDTDate(dateString);
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
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 mb-4 shadow-lg shadow-blue-500/50">
            <CalendarDays className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-heading font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Upcoming Tournaments
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg font-body">
            Your scheduled matches
          </p>
        </motion.div>

        {Object.keys(groupedTournaments).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <CalendarDays className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No upcoming tournaments
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-body">
              Check back later for new tournaments
            </p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedTournaments).map(([date, tournaments], groupIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-heading font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {formatDateHeader(date)}
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {tournaments.map((tournament, index) => (
                    <TournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      delay={(groupIndex * 0.1) + (index * 0.05)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
