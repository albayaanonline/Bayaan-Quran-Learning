#!/usr/bin/env python3
"""
Local Whisper transcription via faster-whisper (provider 4 fallback).
Reads JSON from stdin: {"audio_b64": "...", "mime_type": "..."}
Writes JSON to stdout: {"text": "...", "confidence": 0.0-1.0, ...}

Model: faster-whisper tiny (39MB) — cached in /tmp/fw_model after first download.
Runs entirely on CPU with int8 quantisation.
"""
import sys
import json
import os
import base64
import tempfile
import math


def main() -> None:
    try:
        from faster_whisper import WhisperModel  # type: ignore

        raw = sys.stdin.buffer.read()
        payload = json.loads(raw)
        audio_b64: str = payload["audio_b64"]
        mime_type: str = payload.get("mime_type", "audio/webm")

        audio_bytes = base64.b64decode(audio_b64)

        # Pick file extension
        if "ogg" in mime_type:
            ext = ".ogg"
        elif "mp4" in mime_type or "m4a" in mime_type:
            ext = ".mp4"
        elif "wav" in mime_type:
            ext = ".wav"
        else:
            ext = ".webm"

        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            model = WhisperModel(
                "tiny",
                device="cpu",
                compute_type="int8",
                download_root="/tmp/fw_model",
            )

            segments, info = model.transcribe(
                tmp_path,
                language="ar",
                beam_size=5,
                without_timestamps=True,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300),
            )

            text_parts = []
            total_logprob = 0.0
            seg_count = 0

            for seg in segments:
                t = seg.text.strip()
                if t:
                    text_parts.append(t)
                total_logprob += seg.avg_logprob
                seg_count += 1

            text = " ".join(text_parts).strip()
            avg_logprob = total_logprob / max(seg_count, 1)
            confidence = round(max(0.0, min(1.0, math.exp(avg_logprob))), 3)

            sys.stdout.write(
                json.dumps(
                    {
                        "success": len(text) > 0,
                        "text": text,
                        "confidence": confidence,
                        "language": info.language,
                        "language_probability": round(info.language_probability, 3),
                        "model": "faster-whisper-tiny",
                        "segments": seg_count,
                    }
                )
            )
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    except Exception as exc:
        sys.stdout.write(
            json.dumps(
                {
                    "success": False,
                    "text": "",
                    "confidence": 0.0,
                    "error": str(exc),
                    "model": "faster-whisper-tiny",
                }
            )
        )


if __name__ == "__main__":
    main()
