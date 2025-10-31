import { useEffect, useState } from "react";
import { supabase, Tournament } from "../lib/supabase";
import { MagicCard } from "../components/MagicCard";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Edit, Trash2, X, Check, LogOut, Calendar, Trophy, Clock, ListOrdered, AlertCircle, History, Medal } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { logTournamentDeletion } from "../lib/audit-helper";

type FormData = Partial<Tournament> & {
  date?: string;
  idp_time?: string;
  start_time?: string;
  delayed_date?: string;
  year?: string;
  month?: string;
  day?: string;
  idp_hour?: string;
  idp_minute?: string;
  idp_period?: 'AM' | 'PM';
  start_hour?: string;
  start_minute?: string;
  start_period?: 'AM' | 'PM';
  delayed_hour?: string;
  delayed_minute?: string;
  delayed_period?: 'AM' | 'PM';
};

export function AdminPage() {
  const { signOut, user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed' | 'qualified'>('today');
  const [unmarkedCount, setUnmarkedCount] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    tournament_name: "",
    date: "",
    maps: 1,
    idp_time: "",
    start_time: "",
    room_type: "League Room",
    status: "scheduled",
    result: "",
    delayed_date: "",
    tournament_type: "",
    prize_pool: "",
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    day: "",
    idp_hour: "",
    idp_minute: "",
    idp_period: "PM",
    start_hour: "",
    start_minute: "",
    start_period: "PM",
    delayed_hour: "",
    delayed_minute: "",
    delayed_period: "PM",
  });

  const handleLogout = async () => {
    await signOut();
    window.history.pushState({}, "", "/");
    window.location.reload();
  };

  const getFilteredTournaments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (activeTab === 'today') {
      return tournaments.filter(t => {
        const tournamentDate = new Date(t.date);
        tournamentDate.setHours(0, 0, 0, 0);
        return tournamentDate.getTime() === today.getTime() && (t.status === 'scheduled' || t.status === 'delayed');
      });
    } else if (activeTab === 'upcoming') {
      return tournaments.filter(t => {
        const tournamentDate = new Date(t.date);
        tournamentDate.setHours(0, 0, 0, 0);
        return tournamentDate >= tomorrow && (t.status === 'scheduled' || t.status === 'delayed');
      });
    } else if (activeTab === 'qualified') {
      return tournaments.filter(t => t.status === 'qualified');
    } else {
      return tournaments.filter(t => t.status === 'completed' || t.status === 'canceled');
    }
  };

  useEffect(() => {
    fetchAllTournaments();
    fetchUnmarkedCount();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');

    if (editId && tournaments.length > 0) {
      const tournamentToEdit = tournaments.find(t => t.id === editId);
      if (tournamentToEdit) {
        handleOpenModal(tournamentToEdit);
        window.history.replaceState({}, "", "/admin");
      }
    }
  }, [tournaments]);

  const fetchUnmarkedCount = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("status", "scheduled");

    if (!error && data) {
      const now = new Date();
      const pastTournaments = data.filter((tournament) => {
        const startTime = new Date(tournament.start_time);
        const oneHourAfterStart = new Date(startTime.getTime() + (60 * 60000));
        return now > oneHourAfterStart;
      });
      setUnmarkedCount(pastTournaments.length);
    }
  };

  const fetchAllTournaments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching tournaments:", error);
    } else {
      setTournaments(data || []);
    }
    setLoading(false);
  };

  const convertTo12Hour = (hour24: number) => {
    if (hour24 === 0) return { hour: 12, period: 'AM' as 'AM' | 'PM' };
    if (hour24 < 12) return { hour: hour24, period: 'AM' as 'AM' | 'PM' };
    if (hour24 === 12) return { hour: 12, period: 'PM' as 'AM' | 'PM' };
    return { hour: hour24 - 12, period: 'PM' as 'AM' | 'PM' };
  };

  const handleOpenModal = (tournament?: Tournament) => {
    if (tournament) {
      setEditingTournament(tournament);
      const dateObj = new Date(tournament.date);

      const idpTime = new Date(tournament.idp_time);
      const startTime = new Date(tournament.start_time);
      const delayedTime = tournament.delayed_date ? new Date(tournament.delayed_date) : null;

      const idpBDT = new Date(idpTime.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
      const startBDT = new Date(startTime.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
      const delayedBDT = delayedTime ? new Date(delayedTime.toLocaleString("en-US", { timeZone: "Asia/Dhaka" })) : null;

      const idp12 = convertTo12Hour(idpBDT.getHours());
      const start12 = convertTo12Hour(startBDT.getHours());
      const delayed12 = delayedBDT ? convertTo12Hour(delayedBDT.getHours()) : { hour: 12, period: 'PM' as 'AM' | 'PM' };

      setFormData({
        tournament_name: tournament.tournament_name,
        date: tournament.date,
        maps: tournament.maps,
        idp_time: tournament.idp_time.split("T")[0] + "T" + tournament.idp_time.split("T")[1].substring(0, 5),
        start_time: tournament.start_time.split("T")[0] + "T" + tournament.start_time.split("T")[1].substring(0, 5),
        room_type: tournament.room_type,
        status: tournament.status,
        result: tournament.result || "",
        delayed_date: tournament.delayed_date ? tournament.delayed_date.split("T")[0] + "T" + tournament.delayed_date.split("T")[1].substring(0, 5) : "",
        tournament_type: tournament.tournament_type || "",
        prize_pool: tournament.prize_pool || "",
        year: dateObj.getFullYear().toString(),
        month: (dateObj.getMonth() + 1).toString().padStart(2, '0'),
        day: dateObj.getDate().toString(),
        idp_hour: idp12.hour.toString(),
        idp_minute: idpBDT.getMinutes().toString().padStart(2, '0'),
        idp_period: idp12.period,
        start_hour: start12.hour.toString(),
        start_minute: startBDT.getMinutes().toString().padStart(2, '0'),
        start_period: start12.period,
        delayed_hour: delayedBDT ? delayed12.hour.toString() : "",
        delayed_minute: delayedBDT ? delayedBDT.getMinutes().toString().padStart(2, '0') : "",
        delayed_period: delayed12.period,
      });
    } else {
      setEditingTournament(null);
      const now = new Date();
      setFormData({
        tournament_name: "",
        date: "",
        maps: 1,
        idp_time: "",
        start_time: "",
        room_type: "League Room",
        status: "scheduled",
        result: "",
        delayed_date: "",
        tournament_type: "",
        prize_pool: "",
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        day: "",
        idp_hour: "",
        idp_minute: "",
        idp_period: "PM",
        start_hour: "",
        start_minute: "",
        start_period: "PM",
        delayed_hour: "",
        delayed_minute: "",
        delayed_period: "PM",
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTournament(null);
  };

  const convertTo24Hour = (hour12: number, period: 'AM' | 'PM') => {
    if (period === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const idpHour24 = convertTo24Hour(parseInt(formData.idp_hour || '0'), formData.idp_period || 'PM');
    const startHour24 = convertTo24Hour(parseInt(formData.start_hour || '0'), formData.start_period || 'PM');

    const dateString = `${formData.year}-${formData.month}-${formData.day?.padStart(2, '0')}`;
    const idpTimeString = `${dateString}T${idpHour24.toString().padStart(2, '0')}:${formData.idp_minute?.padStart(2, '0')}:00+06:00`;
    const startTimeString = `${dateString}T${startHour24.toString().padStart(2, '0')}:${formData.start_minute?.padStart(2, '0')}:00+06:00`;

    let delayedDateISO = null;
    if (formData.status === "delayed" && formData.delayed_hour && formData.delayed_minute) {
      const delayedHour24 = convertTo24Hour(parseInt(formData.delayed_hour), formData.delayed_period || 'PM');
      const delayedTimeString = `${dateString}T${delayedHour24.toString().padStart(2, '0')}:${formData.delayed_minute?.padStart(2, '0')}:00+06:00`;
      delayedDateISO = new Date(delayedTimeString).toISOString();
    }

    let finalStatus = formData.status;
    if (formData.status === "completed") {
      const qualifyingTypes = ["Qualifier", "Quarter Final", "Semi Final"];
      if (formData.tournament_type && qualifyingTypes.includes(formData.tournament_type)) {
        finalStatus = "qualified";
      }
    }

    const tournamentData = {
      tournament_name: formData.tournament_name,
      date: dateString,
      maps: formData.maps,
      idp_time: new Date(idpTimeString).toISOString(),
      start_time: new Date(startTimeString).toISOString(),
      room_type: formData.room_type,
      status: finalStatus,
      result: formData.status === "completed" ? formData.result : null,
      delayed_date: delayedDateISO,
      tournament_type: formData.tournament_type || null,
      prize_pool: formData.prize_pool || null,
      updated_at: new Date().toISOString(),
    };

    if (editingTournament) {
      const { error } = await supabase
        .from("tournaments")
        .update(tournamentData)
        .eq("id", editingTournament.id);

      if (error) {
        console.error("Error updating tournament:", error);
        alert("Error updating tournament");
      } else {
        fetchAllTournaments();
        handleCloseModal();
      }
    } else {
      const { data: newTournament, error } = await supabase
        .from("tournaments")
        .insert([tournamentData])
        .select()
        .single();

      if (error) {
        console.error("Error creating tournament:", error);
        alert("Error creating tournament");
      } else if (newTournament && user) {
        await supabase.from("audit_logs").insert({
          admin_email: user.email,
          action_type: "create",
          tournament_name: tournamentData.tournament_name,
          tournament_date: tournamentData.date,
          tournament_time: new Date(tournamentData.start_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          tournament_id: newTournament.id,
        });

        fetchAllTournaments();
        handleCloseModal();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tournament?")) {
      return;
    }

    const tournament = tournaments.find((t) => t.id === id);
    if (!tournament || !user?.email) return;

    const logged = await logTournamentDeletion(tournament, user.email);
    if (!logged) {
      alert("Error logging tournament deletion");
      return;
    }

    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting tournament:", error);
      alert("Error deleting tournament");
    } else {
      fetchAllTournaments();
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
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg shadow-violet-500/50">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-3">
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-2">
              Manage your tournaments
            </p>
            {user?.email && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Logged in as: {user.email}
              </p>
            )}
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Tournament
            </button>
          </div>
        </motion.div>

        <div className="mb-8 space-y-6">
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => {
                window.history.pushState({}, "", "/admin/all-tournaments");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all bg-cyan-500 text-white shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:scale-105"
            >
              <ListOrdered className="w-5 h-5" />
              All Tournaments
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, "", "/admin/unmarked");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all bg-orange-500 text-white shadow-lg shadow-orange-500/50 hover:shadow-xl hover:scale-105"
            >
              <AlertCircle className="w-5 h-5" />
              Unmarked
              {unmarkedCount > 0 && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white dark:border-slate-900">
                  {unmarkedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                window.history.pushState({}, "", "/admin/audit-log");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all bg-purple-500 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:scale-105"
            >
              <History className="w-5 h-5" />
              Audit Log
            </button>
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                activeTab === 'today'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Today</span>
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/50'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Upcoming</span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Completed</span>
            </button>
            <button
              onClick={() => setActiveTab('qualified')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                activeTab === 'qualified'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Medal className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Qualified</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {getFilteredTournaments().map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MagicCard className="p-4 sm:p-6" gradientColor="#8b5cf6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {tournament.tournament_name}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Date:</span>
                        <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                          {new Date(tournament.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>
                        <span className="ml-2 text-slate-800 dark:text-slate-200 font-medium">
                          {tournament.status}
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
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleOpenModal(tournament)}
                      className="flex-1 sm:flex-none p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tournament.id)}
                      className="flex-1 sm:flex-none p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </MagicCard>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {editingTournament ? "Edit Tournament" : "Create Tournament"}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tournament Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tournament_name}
                      onChange={(e) => setFormData({ ...formData, tournament_name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Date
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        required
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Month</option>
                        <option value="01">January</option>
                        <option value="02">February</option>
                        <option value="03">March</option>
                        <option value="04">April</option>
                        <option value="05">May</option>
                        <option value="06">June</option>
                        <option value="07">July</option>
                        <option value="08">August</option>
                        <option value="09">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                      </select>
                      <input
                        type="number"
                        required
                        min="1"
                        max="31"
                        placeholder="Day"
                        value={formData.day}
                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <input
                        type="number"
                        required
                        min="2024"
                        max="2100"
                        placeholder="Year"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Maps
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="10"
                        value={formData.maps}
                        onChange={(e) => setFormData({ ...formData, maps: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tournament Type
                      </label>
                      <select
                        value={formData.tournament_type}
                        onChange={(e) => setFormData({ ...formData, tournament_type: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select Type</option>
                        <option value="Qualifier">Qualifier</option>
                        <option value="Quarter Final">Quarter Final</option>
                        <option value="Semi Final">Semi Final</option>
                        <option value="Final">Final</option>
                        <option value="1 Day Match">1 Day Match</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Prize Pool
                    </label>
                    <input
                      type="text"
                      value={formData.prize_pool}
                      onChange={(e) => setFormData({ ...formData, prize_pool: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g., 10,000 BDT or 10,000 UC"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        IDP Time
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          required
                          min="1"
                          max="12"
                          placeholder="HH"
                          value={formData.idp_hour}
                          onChange={(e) => setFormData({ ...formData, idp_hour: e.target.value })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="number"
                          required
                          min="0"
                          max="59"
                          placeholder="MM"
                          value={formData.idp_minute}
                          onChange={(e) => setFormData({ ...formData, idp_minute: e.target.value })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <select
                          required
                          value={formData.idp_period}
                          onChange={(e) => setFormData({ ...formData, idp_period: e.target.value as 'AM' | 'PM' })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Start Time
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          required
                          min="1"
                          max="12"
                          placeholder="HH"
                          value={formData.start_hour}
                          onChange={(e) => setFormData({ ...formData, start_hour: e.target.value })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="number"
                          required
                          min="0"
                          max="59"
                          placeholder="MM"
                          value={formData.start_minute}
                          onChange={(e) => setFormData({ ...formData, start_minute: e.target.value })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <select
                          required
                          value={formData.start_period}
                          onChange={(e) => setFormData({ ...formData, start_period: e.target.value as 'AM' | 'PM' })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Room Type
                      </label>
                      <select
                        value={formData.room_type}
                        onChange={(e) => setFormData({ ...formData, room_type: e.target.value as "League Room" | "Normal Room" })}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="League Room">League Room</option>
                        <option value="Normal Room">Normal Room</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Tournament["status"] })}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                        <option value="canceled">Canceled</option>
                      </select>
                    </div>
                  </div>

                  {formData.status === "completed" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Result
                      </label>
                      <input
                        type="text"
                        value={formData.result}
                        onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter tournament result (optional)"
                      />
                    </div>
                  )}

                  {formData.status === "delayed" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Delayed Time (uses same date)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          required
                          min="1"
                          max="12"
                          placeholder="HH"
                          value={formData.delayed_hour}
                          onChange={(e) => setFormData({ ...formData, delayed_hour: e.target.value })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="number"
                          required
                          min="0"
                          max="59"
                          placeholder="MM"
                          value={formData.delayed_minute}
                          onChange={(e) => setFormData({ ...formData, delayed_minute: e.target.value })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <select
                          required
                          value={formData.delayed_period}
                          onChange={(e) => setFormData({ ...formData, delayed_period: e.target.value as 'AM' | 'PM' })}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      <Check className="w-5 h-5" />
                      {editingTournament ? "Update" : "Create"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-6 py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
