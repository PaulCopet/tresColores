import { useState } from 'react';
import { storage } from '../services/firebase/client';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase/client';

export default function EventImageUploader({ eventId }: { eventId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>('');

  const upload = async () => {
    if (!file) return;
    try {
      const path = `event-images/${eventId}/cover.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      // guardar ruta en el doc (tu UI puede usar getDownloadURL en runtime)
      await updateDoc(doc(db, 'events', eventId), {
        coverImagePath: path,
        updatedAt: (await import('firebase/firestore')).serverTimestamp()
      });
      setMsg('Imagen subida con éxito');
      console.log('URL de descarga:', url);
    } catch (e: any) {
      setMsg(e.message ?? 'Error subiendo la imagen');
    }
  };

  return (
    <div className="space-x-2">
      <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
      <button onClick={upload} className="px-3 py-2 bg-black text-white rounded">Subir cover</button>
      {msg && <span className="ml-2 text-sm">{msg}</span>}
    </div>
  );
}
