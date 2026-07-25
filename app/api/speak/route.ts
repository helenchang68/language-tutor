import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  const apiKey = process.env.GOOGLE_TTS_API_KEY;

  const googleRes = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: "ko-KR",
          name: "ko-KR-Neural2-B",
        },
        audioConfig: {
          audioEncoding: "MP3",
        },
      }),
    }
  );

  const data = await googleRes.json();

  // Google 回傳的是 base64 編碼的音檔，要解碼成二進位
  const audioBuffer = Buffer.from(data.audioContent, "base64");

  return new NextResponse(audioBuffer, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}