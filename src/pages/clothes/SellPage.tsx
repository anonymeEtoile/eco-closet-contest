import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { Camera, X, ChevronLeft, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Hauts', 'Bas', 'Robes', 'Vestes', 'Manteaux', 'Chaussures', 'Accessoires', 'Sport', 'Autre'];
const TAILLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44'];
const ETATS = ['Neuf', 'Très bon état', 'Bon état', 'État correct'];

const SellPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'vente' as 'vente' | 'don',
    price: '',
    taille: '',
    etat: '',
    categorie: '',
    marque: '',
    description: '',
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - photos.length);
    setPhotos(p => [...p, ...newFiles]);
    newFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(p => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) { toast({ title: 'Titre requis', variant: 'destructive' }); return; }
    if (form.type === 'vente' && !form.price) { toast({ title: 'Prix requis', variant: 'destructive' }); return; }

    setLoading(true);
    try {
      // Upload photos
      const photoKeys: string[] = [];
      for (const file of photos) {
        const key = `${user.id}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from('listings-photos').upload(key, file);
        if (!error) photoKeys.push(key);
      }

      const { error } = await supabase.from('listings').insert({
        seller_id: user.id,
        title: form.title.trim(),
        type: form.type,
        price: form.type === 'vente' ? parseFloat(form.price) : null,
        taille: form.taille || null,
        etat: form.etat || null,
        categorie: form.categorie || null,
        marque: form.marque.trim() || null,
        description: form.description.trim() || null,
        photos: photoKeys,
        status: 'en_attente',
      });

      if (error) throw error;
      toast({ title: 'Annonce soumise !', description: 'Elle sera visible après validation.' });
      navigate('/app/mes-annonces');
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Une erreur est survenue', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 pb-3 pt-safe backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ChevronLeft size={24} />
          </button>
          <h1 className="font-display text-xl font-bold">Vendre / Donner</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-5 space-y-6">
        {/* Photos */}
        <div>
          <Label className="mb-2 block">Photos (max. 5)</Label>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-card/80"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Camera size={22} />
                <span className="text-[10px] font-medium">Ajouter</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={e => addPhotos(e.target.files)}
          />
        </div>

        {/* Type */}
        <div>
          <Label className="mb-2 block">Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {(['vente', 'don'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => update('type', t)}
                className={cn(
                  "rounded-xl border py-3 text-sm font-semibold capitalize transition-colors",
                  form.type === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {t === 'vente' ? '💰 Vente' : '🎁 Don gratuit'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            placeholder="ex: Jean slim bleu Zara"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            className="mt-1.5"
          />
        </div>

        {/* Price */}
        {form.type === 'vente' && (
          <div>
            <Label htmlFor="price">Prix (€) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.5"
              placeholder="0.00"
              value={form.price}
              onChange={e => update('price', e.target.value)}
              className="mt-1.5"
            />
          </div>
        )}

        {/* Marque */}
        <div>
          <Label htmlFor="marque">Marque</Label>
          <Input
            id="marque"
            placeholder="Zara, Nike, H&M…"
            value={form.marque}
            onChange={e => update('marque', e.target.value)}
            className="mt-1.5"
          />
        </div>

        {/* Taille */}
        <div>
          <Label className="mb-2 block">Taille</Label>
          <div className="flex flex-wrap gap-1.5">
            {TAILLES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => update('taille', form.taille === t ? '' : t)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  form.taille === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <Label className="mb-2 block">Catégorie</Label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => update('categorie', form.categorie === c ? '' : c)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  form.categorie === c ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* État */}
        <div>
          <Label className="mb-2 block">État</Label>
          <div className="grid grid-cols-2 gap-2">
            {ETATS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => update('etat', form.etat === e ? '' : e)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left",
                  form.etat === e ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="desc">Description</Label>
          <textarea
            id="desc"
            placeholder="Décrivez votre vêtement…"
            value={form.description}
            onChange={e => update('description', e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        <Button type="submit" className="w-full gap-2 py-6 text-base font-semibold" disabled={loading}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Publication…</> : <><Tag size={18} /> Publier l'annonce</>}
        </Button>
      </form>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default SellPage;
