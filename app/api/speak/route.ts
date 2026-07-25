import { NextRequest, NextResponse } from "next/server";
import { LANGUAGES, LanguageCode } from "@/lib/languages";

export async function POST(req: NextRequest) {
  const { text, language } = await req.json();

  const config = LANGUAGES[language as LanguageCode];
  if (!config) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  const googleRes = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: config.ttsLanguageCode,
          name: config.ttsVoiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
        },
      }),
    }
  );

  const data = await googleRes.json();
  const audioBuffer = Buffer.from(data.audioContent, "base64");

  return new NextResponse(audioBuffer, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
