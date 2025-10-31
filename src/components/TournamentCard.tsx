import MagicContainer from "./MagicContainer";
import { Tournament } from "../lib/supabase";
import { Calendar, Clock, MapPin, Trophy, Timer, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatBDTDate, formatBDTTime } from "../lib/timezone";
import { useState } from "react";

interface TournamentCardProps {
  tournament: Tournament;
  delay?: number;
}

export function TournamentCard({ tournament, delay = 0 }: TournamentCardProps) {
  const [showInfo, setShowInfo] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00Z');
    const utc = date.getTime();
    const bdtTime = new Date(utc + (6 * 60 * 60000));
    return bdtTime.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC"
    });
  };

  const formatTime = formatBDTTime;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "qualified":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "delayed":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "canceled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <MagicContainer className="h-full">
        <div className="w-full h-full rounded-[23px] bg-slate-900 shadow-lg overflow-hidden p-6">
          <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-slate-100 mb-1 line-clamp-2 h-14">
                {tournament.tournament_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-body">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{formatDate(tournament.date)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
              {(tournament.tournament_type || tournament.prize_pool) && (
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="Tournament Info"
                >
                  <Info className="w-5 h-5 text-blue-500" />
                </button>
              )}
              <div
                className={`px-3 py-1 rounded-full text-xs font-body font-semibold border whitespace-nowrap h-fit ${getStatusColor(
                  tournament.status
                )}`}
              >
                {tournament.status.toUpperCase()}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showInfo && (tournament.tournament_type || tournament.prize_pool) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                  {tournament.tournament_type && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-body">Type</p>
                        <p className="text-sm font-body font-semibold text-blue-400">
                          {tournament.tournament_type}
                        </p>
                      </div>
                    </div>
                  )}
                  {tournament.prize_pool && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-body">Prize Pool</p>
                        <p className="text-sm font-body font-semibold text-blue-400">
                          {tournament.prize_pool}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body">IDP Time</p>
                <p className="text-sm font-body font-semibold text-slate-800 dark:text-slate-200">
                  {formatTime(tournament.idp_time)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body">Start Time</p>
                <p className="text-sm font-body font-semibold text-slate-800 dark:text-slate-200">
                  {formatTime(tournament.start_time)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body">Maps</p>
                <p className="text-sm font-body font-semibold text-slate-800 dark:text-slate-200">
                  {tournament.maps}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-body">Room Type</p>
                <p className="text-sm font-body font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {tournament.room_type}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-grow" />

          {tournament.status === "delayed" && tournament.delayed_date && (
            <div className="pt-3 mt-3 border-t border-amber-500/30 min-h-[2rem]">
              <p className="text-sm text-amber-400 font-body font-medium">
                Rescheduled to: {formatDate(tournament.delayed_date)} at{" "}
                {formatTime(tournament.delayed_date)}
              </p>
            </div>
          )}

          {(tournament.status === "completed" || tournament.status === "qualified") && tournament.result && (
            <div className={`pt-3 mt-3 border-t min-h-[2rem] ${
              tournament.status === "qualified" ? "border-blue-500/30" : "border-emerald-500/30"
            }`}>
              <p className={`text-sm font-body font-medium ${
                tournament.status === "qualified" ? "text-blue-400" : "text-emerald-400"
              }`}>
                Result: {tournament.result}
              </p>
            </div>
          )}
          </div>
        </div>
      </MagicContainer>
    </motion.div>
  );
}
