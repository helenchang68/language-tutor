import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Counts = Record<string, Record<string, number>>;

type MessageRow = {
  category: string;
  conversations: { language: string; user_id: string | null } | null;
};

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  const { data, error } = await supabase
    .from("messages")
    .select("category, conversations(language, user_id)")
    .not("category", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const aggregate: Counts = {};
  const personal: Counts = {};

  for (const row of (data ?? []) as unknown as MessageRow[]) {
    if (!row.conversations) continue;
    const { language, user_id } = row.conversations;
    const category = row.category;

    aggregate[language] ??= {};
    aggregate[language][category] = (aggregate[language][category] ?? 0) + 1;

    if (userId && user_id === userId) {
      personal[language] ??= {};
      personal[language][category] = (personal[language][category] ?? 0) + 1;
    }
  }

  return NextResponse.json({ aggregate, personal });
}
