import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { LANGUAGES, LanguageCode } from "@/lib/languages";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages, language, conversationId, userId } = await req.json();

  if (!LANGUAGES[language as LanguageCode]) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: LANGUAGES[language as LanguageCode].systemPrompt },
      ...messages,
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(completion.choices[0].message.content || "{}");

  const correction = parsed.correction ?? null;
  const natural = parsed.natural ?? null;
  const category = parsed.category ?? null;
  const reply = parsed.reply ?? "";

  let currentConversationId = conversationId as string | undefined;

  try {
    if (!currentConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ language, user_id: userId ?? null })
        .select("id")
        .single();
      if (error) throw error;
      currentConversationId = data.id;
    }

    const lastUserMessage = messages[messages.length - 1];

    const { error: messagesError } = await supabase.from("messages").insert([
      {
        conversation_id: currentConversationId,
        role: "user",
        content: lastUserMessage.content,
        correction,
        natural_text: natural,
        category,
      },
      {
        conversation_id: currentConversationId,
        role: "assistant",
        content: reply,
      },
    ]);
    if (messagesError) throw messagesError;
  } catch (err) {
    console.error("Failed to persist conversation:", err);
  }

  return NextResponse.json({
    correction,
    natural,
    reply,
    conversationId: currentConversationId,
  });
}
