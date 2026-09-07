import { useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

export default function AudioRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => onRecorded(reader.result);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError('Microphone unavailable — check browser permissions.');
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div>
      <button
        onClick={recording ? stop : start}
        className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded transition ${
          recording ? 'bg-accent text-ink' : 'bg-sage/40 hover:bg-sage/70 text-graphite'
        }`}
      >
        {recording ? <Square size={11} /> : <Mic size={11} />}
        {recording ? 'Stop recording' : 'Record voice note'}
      </button>
      {error && <div className="text-[10px] text-red-600 mt-1">{error}</div>}
    </div>
  );
}
