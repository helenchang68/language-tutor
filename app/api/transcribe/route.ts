import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { LANGUAGES, LanguageCode } from "@/lib/languages";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File;
  const language = formData.get("language") as LanguageCode;

  if (!audio) {
    return NextResponse.json({ error: "No audio file" }, { status: 400 });
  }
  if (!LANGUAGES[language]) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model: "whisper-1",
    language: LANGUAGES[language].whisperLanguage,
  });

  return NextResponse.json({ text: transcription.text });
}
