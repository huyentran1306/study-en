"use client";

import { useState, useRef, useCallback } from "react";

const STT_WORKER_URL = "https://steep-boat-9faa.trann46698.workers.dev/";

interface STTResult {
  text: string;
  words?: { word: string; start: number; end: number }[];
}

interface UseSTTRecorderReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
}

export function useSTTRecorder(): UseSTTRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isSupported = typeof navigator !== "undefined" && !!navigator.mediaDevices;

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
    } catch (err) {
      setError("Microphone access denied or not available.");
      console.error("Recording error:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribe = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const response = await fetch(STT_WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "audio/webm" },
        body: arrayBuffer,
      });

      if (!response.ok) throw new Error(`STT error: ${response.status}`);
      const data = await response.json() as { response?: STTResult };
      setTranscript(data.response?.text || "");
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    isRecording,
    isTranscribing,
    transcript,
    error,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
  };
}
