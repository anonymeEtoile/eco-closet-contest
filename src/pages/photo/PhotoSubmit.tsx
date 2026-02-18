import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { Camera, Loader2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PhotoSubmit: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = (files: FileList | null) => {
    if (!files?.[0]) return;
    setFile(files[0]);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(files[0]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !titre.trim()) {
      toast({ title: 'Photo et titre requis', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const key = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('contest-photos').upload(key, file);
    if (uploadError) { toast({ title: 'Erreur upload', description: uploadError.message, variant: 'destructive' }); setLoading(false); return; }
    const { error } = await supabase.from('contest_photos').insert({
      user_id: user.id, titre: titre.trim(), description: description.trim() || null, photo_url: key,
    });
    setLoading(false);
    if (error) { toast({ title: 'Erreur', description: 'Vous avez peut-être déjà soumis une photo.', variant: 'destructive' }); }
    else { toast({ title: 'Photo soumise !', description: 'Elle sera visible après validation.' }); navigate('/photo'); }
  };

  return (
    <div className="mode-photo flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-card px-4 pb-4 pt-12 safe-top">
        <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <ChevronLeft size={16} /> Retour
        </button>
        <h1 className="font-display text-xl font-bold">Soumettre une photo</h1>
        <p className="text-sm text-muted-foreground">Une seule photo par participant</p>
      </div>
      <form onSubmit={submit} className="px-4 py-5 space-y-5">
        <div
          className="relative aspect-square overflow-hidden rounded-2xl border-2 border-dashed border-border bg-muted/20 flex items-center justify-center cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Camera size={40} className="text-primary/50" />
              <p className="text-sm font-medium">Appuyez pour ajouter une photo</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFile(e.target.files)} />
        <div>
          <Label htmlFor="titre">Titre *</Label>
          <Input id="titre" placeholder="Donnez un titre à votre photo" value={titre} onChange={e => setTitre(e.target.value)} className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="desc">Description (optionnel)</Label>
          <textarea id="desc" placeholder="Racontez votre photo…" value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <Button type="submit" className="w-full gap-2 py-6 text-base font-semibold" disabled={loading || !file}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : <><Camera size={18} /> Soumettre ma photo</>}
        </Button>
      </form>
      <BottomNav mode="photo" />
      <ModeFab />
    </div>
  );
};

export default PhotoSubmit;
