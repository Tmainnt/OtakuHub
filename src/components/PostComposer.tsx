'use client';

import { useEffect, useRef, useState } from 'react';

type ImageDraft = { name: string; data: string; preview: string };

function Avatar({ name }: { name: string }) {
  return <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-sm font-bold text-white">{name.trim().slice(0, 1).toUpperCase() || 'O'}</span>;
}

async function imageToJpeg(file: File): Promise<string> {
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not process this image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(source);
  }
}

export default function PostComposer({ username, posting, onClose, onPublish }: {
  username: string;
  posting: boolean;
  onClose: () => void;
  onPublish: (content: string, images: string[]) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        if (active) setCameraAvailable(devices.some((device) => device.kind === 'videoinput'));
      }).catch(() => { if (active) setCameraAvailable(false); });
    }
    return () => { active = false; streamRef.current?.getTracks().forEach((track) => track.stop()); };
  }, []);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [cameraOpen]);

  const openCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraAvailable(false);
      setCameraError('Camera is unavailable or permission was denied. You can still choose photos from your device.');
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const addFiles = async (files: FileList | File[]) => {
    const selected = Array.from(files);
    const remaining = 5 - images.length;
    if (remaining <= 0) { setError('You can attach up to 5 images.'); return; }
    if (selected.length > remaining) setError('Only the first 5 images can be attached.');
    const additions: ImageDraft[] = [];
    try {
      for (const file of selected.slice(0, remaining)) {
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name} is larger than 15 MB.`);
        const data = await imageToJpeg(file);
        additions.push({ name: file.name, data, preview: data });
      }
      setImages((current) => [...current, ...additions].slice(0, 5));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the selected image.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { setCameraError('Camera is still starting. Try again in a moment.'); return; }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/jpeg', 0.82);
    setImages((current) => [...current, { name: `Camera photo ${current.length + 1}`, data, preview: data }].slice(0, 5));
    closeCamera();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim() && images.length === 0) { setError('Write something or attach at least one image.'); return; }
    setError('');
    await onPublish(content.trim(), images.map((image) => image.data));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !posting) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="post-composer-title" className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <h2 id="post-composer-title" className="text-lg font-extrabold text-zinc-900">Create a post</h2>
          <button type="button" onClick={onClose} disabled={posting} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-zinc-100 text-xl text-zinc-600 hover:bg-zinc-200 disabled:opacity-50">×</button>
        </header>
        <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-3"><Avatar name={username} /><div><p className="text-sm font-bold text-zinc-900">{username}</p><p className="text-xs text-zinc-500">Sharing with the community</p></div></div>
          <textarea autoFocus value={content} onChange={(event) => setContent(event.target.value)} maxLength={5000} rows={5} placeholder="What would you like to share?" className="w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-[15px] leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100" />

          {images.length > 0 && <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{images.map((image, index) => (
            <div key={`${image.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100"><img src={image.preview} alt={image.name} className="size-full object-cover" /><button type="button" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${image.name}`} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/65 text-lg text-white opacity-100 sm:opacity-0 sm:transition group-hover:opacity-100">×</button></div>
          ))}</div>}
          <p className="text-xs text-zinc-500">Attach up to 5 images. Images are optimized before saving.</p>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 p-3">
            <span className="mr-auto px-1 text-sm font-bold text-zinc-700">Add to your post</span>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ''; }} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={posting || images.length >= 5} className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50">▧ Photo</button>
            {cameraAvailable && <button type="button" onClick={() => void openCamera()} disabled={posting || images.length >= 5} className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50">◎ Camera</button>}
          </div>
          {(error || cameraError) && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error || cameraError}</p>}
          <button type="submit" disabled={posting} className="w-full rounded-xl bg-violet-700 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60">{posting ? 'Publishing…' : 'Share post'}</button>
        </form>
      </section>

      {cameraOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"><div className="w-full max-w-xl overflow-hidden rounded-2xl bg-zinc-950 p-3"><video ref={videoRef} autoPlay playsInline muted className="max-h-[70vh] w-full rounded-xl object-contain" /><div className="flex justify-center gap-3 p-3"><button type="button" onClick={closeCamera} className="rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white">Cancel</button><button type="button" onClick={capturePhoto} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500">Take photo</button></div></div></div>}
    </div>
  );
}
