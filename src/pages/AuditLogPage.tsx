import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import { motion } from "framer-motion";
import { History, Trash2, RotateCcw, Plus } from "lucide-react";

interface AuditLog {
  id: string;
  admin_email: string;
  action_type: "create" | "delete";
  tournament_name: string;
  tournament_date: string;
  tournament_time: string;
  tournament_id: string | null;
  created_at: string;
}

interface DeletedTournament {
  id: string;
  original_tournament_id: string;
  name: string;
  date: string;
  time: string;
  idp: string | null;
  map: string;
  mode: string;
  type: string | null;
  prize_pool: string | null;
  result: string | null;
  deleted_by: string;
  deleted_at: string;
  audit_log_id: string;
}

export function AuditLogPage() {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletedTournaments, setDeletedTournaments] = useState<DeletedTournament[]>([]);
  const [filter, setFilter] = useState<"all" | "create" | "delete">("all");
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [filter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("action_type", filter);
      }

      const { data: logs, error: logsError } = await query;
      if (logsError) throw logsError;

      const { data: deleted, error: deletedError } = await supabase
        .from("deleted_tournaments")
        .select("*")
        .order("deleted_at", { ascending: false });
      if (deletedError) throw deletedError;

      setAuditLogs(logs || []);
      setDeletedTournaments(deleted || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const restoreTournament = async (deletedTournament: DeletedTournament) => {
    if (!user) return;

    setRestoring(deletedTournament.id);
    try {
      const { error: insertError } = await supabase.from("tournaments").insert({
        name: deletedTournament.name,
        date: deletedTournament.date,
        time: deletedTournament.time,
        idp: deletedTournament.idp,
        map: deletedTournament.map,
        mode: deletedTournament.mode,
        type: deletedTournament.type,
        prize_pool: deletedTournament.prize_pool,
        result: deletedTournament.result,
      });

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("deleted_tournaments")
        .delete()
        .eq("id", deletedTournament.id);

      if (deleteError) throw deleteError;

      await fetchAuditLogs();
      alert("Tournament restored successfully!");
    } catch (error) {
      console.error("Error restoring tournament:", error);
      alert("Failed to restore tournament");
    } finally {
      setRestoring(null);
    }
  };

  const getDeletedTournamentInfo = (logId: string) => {
    return deletedTournaments.find((dt) => dt.audit_log_id === logId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading audit logs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <History className="w-8 h-8 text-emerald-400" />
            <h1 className="text-4xl font-bold text-white">Audit Log</h1>
          </div>
          <p className="text-slate-400">
            Track all tournament creation and deletion activities
          </p>
        </motion.div>

        <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
              filter === "all"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            All Actions
          </button>
          <button
            onClick={() => setFilter("create")}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center gap-2 ${
              filter === "create"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Plus className="w-4 h-4" />
            Created
          </button>
          <button
            onClick={() => setFilter("delete")}
            className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              filter === "delete"
                ? "bg-emerald-500 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Deleted
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="bg-slate-900 rounded-lg p-8 text-center">
            <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No audit logs found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log) => {
              const deletedInfo = getDeletedTournamentInfo(log.id);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 rounded-lg p-6 border border-slate-800 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {log.action_type === "create" ? (
                          <div className="bg-emerald-500/20 p-2 rounded">
                            <Plus className="w-5 h-5 text-emerald-400" />
                          </div>
                        ) : (
                          <div className="bg-red-500/20 p-2 rounded">
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {log.tournament_name}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {log.action_type === "create" ? "Created" : "Deleted"} by{" "}
                            <span className="text-emerald-400">{log.admin_email}</span>
                          </p>
                        </div>
                      </div>

                      <div className="ml-14 space-y-1 text-slate-300">
                        <p>
                          <span className="text-slate-500">Tournament Date:</span>{" "}
                          {formatDate(log.tournament_date)} at {log.tournament_time}
                        </p>
                        <p>
                          <span className="text-slate-500">Action Time:</span>{" "}
                          {formatDateTime(log.created_at)}
                        </p>

                        {deletedInfo && (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <p className="text-slate-400 text-sm mb-2">
                              Tournament Details:
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <p>
                                <span className="text-slate-500">Map:</span>{" "}
                                {deletedInfo.map}
                              </p>
                              <p>
                                <span className="text-slate-500">Mode:</span>{" "}
                                {deletedInfo.mode}
                              </p>
                              {deletedInfo.type && (
                                <p>
                                  <span className="text-slate-500">Type:</span>{" "}
                                  {deletedInfo.type}
                                </p>
                              )}
                              {deletedInfo.prize_pool && (
                                <p>
                                  <span className="text-slate-500">Prize:</span>{" "}
                                  {deletedInfo.prize_pool}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {log.action_type === "delete" && deletedInfo && (
                      <button
                        onClick={() => restoreTournament(deletedInfo)}
                        disabled={restoring === deletedInfo.id}
                        className="ml-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white rounded-lg transition-all flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {restoring === deletedInfo.id ? "Restoring..." : "Restore"}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
