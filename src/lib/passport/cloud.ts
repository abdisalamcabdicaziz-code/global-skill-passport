import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

import { parseRecord } from "./store";
import type { PassportRecord } from "./types";

/** Passports saved to the signed-in account. Row-level rules let each person read only their own. */
export async function listAccountRecords(): Promise<PassportRecord[]> {
  const { data, error } = await supabase.from("passports").select("record").order("updated_at", { ascending: false });
  if (error) throw error;
  return data.flatMap((row) => {
    const record = parseRecord(row.record);
    return record ? [record] : [];
  });
}

export async function saveToAccount(userId: string, record: PassportRecord): Promise<void> {
  const { error } = await supabase
    .from("passports")
    .upsert(
      { user_id: userId, id: record.id, record: record as unknown as Json, updated_at: new Date().toISOString() },
      { onConflict: "user_id,id" },
    );
  if (error) throw error;
}

export async function deleteFromAccount(id: string): Promise<void> {
  const { error } = await supabase.from("passports").delete().eq("id", id);
  if (error) throw error;
}
