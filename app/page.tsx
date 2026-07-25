"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LANGUAGES, LanguageCode } from "@/lib/languages";

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

type Message = {
  role: "user" | "assistant";
  content: string;
  correction?: string | null;
  natural?: string | null;
};

export default function Home() {
  const [language, setLanguage] = useState<LanguageCode | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("languageTutorUserId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("languageTutorUserId", id);
    }
    setUserId(id);
  }, []);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function startRecording() {
    // Unlock audio on user touch (needed for iOS Safari)
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = SILENT_WAV;
    audioRef.current.play().catch(() => {});

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      await handleAudio(audioBlob);
    };

    mediaRecorder.start();
    setIsRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function handleAudio(audioBlob: Blob) {
    if (!language) return;
    setIsProcessing(true);
    try {
      // 1. Speech to text
      console.time("transcribe");
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", language);
      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      const { text } = await transcribeRes.json();
      console.timeEnd("transcribe");

      const newMessages: Message[] = [
        ...messages,
        { role: "user", content: text },
      ];
      setMessages(newMessages);

      // 2. Get the AI's reply (only send role + content to the API)
      console.time("chat");
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          conversationId,
          userId,
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const {
        correction,
        natural,
        reply,
        conversationId: returnedConversationId,
      } = await chatRes.json();
      console.timeEnd("chat");

      if (!conversationId && returnedConversationId) {
        setConversationId(returnedConversationId);
      }

      // Attach the correction info to the message the student just sent
      const updatedMessages: Message[] = [...newMessages];
      updatedMessages[updatedMessages.length - 1] = {
        ...updatedMessages[updatedMessages.length - 1],
        correction,
        natural,
      };
      updatedMessages.push({ role: "assistant", content: reply });
      setMessages(updatedMessages);

      // 3. Speak only the reply (not the correction) out loud
      console.time("speak");
      const speakRes = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, language }),
      });
      const audioData = await speakRes.blob();
      console.timeEnd("speak");

      const audioUrl = URL.createObjectURL(audioData);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error(err);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleChangeLanguage() {
    if (messages.length > 0) {
      const confirmed = window.confirm(
        "Start over in a new language? This will clear your current conversation."
      );
      if (!confirmed) return;
    }
    setMessages([]);
    setConversationId(null);
    setLanguage(null);
  }

  if (!language) {
    return (
      <main style={{ maxWidth: 600, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "right", marginBottom: 8 }}>
          <Link href="/analytics" style={{ fontSize: 13, color: "#1976d2" }}>
            View analytics →
          </Link>
        </div>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Speaking Practice</h1>
        <p style={{ color: "#888", marginBottom: 16 }}>Choose a language to practice:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.values(LANGUAGES).map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              style={{
                padding: 16,
                fontSize: 18,
                borderRadius: 12,
                border: "1px solid #ccc",
                cursor: "pointer",
                background: "white",
                textAlign: "left",
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 24 }}>Speaking Practice: {LANGUAGES[language].label}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/analytics" style={{ fontSize: 13, color: "#1976d2" }}>
            View analytics
          </Link>
          <button
            onClick={handleChangeLanguage}
            style={{
              padding: "8px 12px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
              background: "white",
            }}
          >
            Change language
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 24, minHeight: 300 }}>
        {messages.length === 0 && (
          <p style={{ color: "#888" }}>Press the button below and start speaking!</p>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: m.role === "user" ? "#e3f2fd" : "#f5f5f5",
                whiteSpace: "pre-wrap",
              }}
            >
              <strong>{m.role === "user" ? "You" : "Teacher"}</strong>
              <div>{m.content}</div>
            </div>

            {(m.correction || m.natural) && (
              <div
                style={{
                  padding: 12,
                  marginTop: 4,
                  borderRadius: 12,
                  background: "#fff8e1",
                  border: "1px solid #ffe082",
                  fontSize: 14,
                }}
              >
                {m.correction && (
                  <div style={{ marginBottom: m.natural ? 8 : 0 }}>
                    <strong>📝 Correction</strong>
                    <div>{m.correction}</div>
                  </div>
                )}
                {m.natural && (
                  <div>
                    <strong>💬 More natural way to say it</strong>
                    <div>{m.natural}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isProcessing && <p style={{ color: "#888" }}>Processing...</p>}
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        style={{
          width: "100%",
          padding: 16,
          fontSize: 18,
          borderRadius: 12,
          border: "none",
          cursor: "pointer",
          background: isRecording ? "#ef5350" : "#1976d2",
          color: "white",
        }}
      >
        {isRecording ? "⏹ Stop & send" : "🎤 Press to start speaking"}
      </button>
    </main>
  );
}
