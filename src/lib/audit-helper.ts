import { supabase, Tournament } from "./supabase";

export async function logTournamentDeletion(
  tournament: Tournament,
  userEmail: string
): Promise<boolean> {
  try {
    const { data: auditLog, error: auditError } = await supabase
      .from("audit_logs")
      .insert({
        admin_email: userEmail,
        action_type: "delete",
        tournament_name: tournament.tournament_name,
        tournament_date: tournament.date,
        tournament_time: new Date(tournament.start_time).toLocaleTimeString(
          "en-US",
          { hour: "2-digit", minute: "2-digit", hour12: true }
        ),
        tournament_id: null,
      })
      .select()
      .single();

    if (auditError) {
      console.error("Error creating audit log:", auditError);
      return false;
    }

    const { error: deletedError } = await supabase
      .from("deleted_tournaments")
      .insert({
        original_tournament_id: tournament.id,
        name: tournament.tournament_name,
        date: tournament.date,
        time: new Date(tournament.start_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        idp: new Date(tournament.idp_time).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        map: `${tournament.maps} Maps`,
        mode: tournament.room_type,
        type: tournament.tournament_type,
        prize_pool: tournament.prize_pool,
        result: tournament.result,
        deleted_by: userEmail,
        audit_log_id: auditLog.id,
      });

    if (deletedError) {
      console.error("Error saving deleted tournament:", deletedError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in logTournamentDeletion:", error);
    return false;
  }
}
