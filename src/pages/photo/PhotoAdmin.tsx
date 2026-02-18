import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ContestPhoto {
  id: string;
  titre: string;
  photo_url: string;
  status: string;
  banned: boolean;
  author?: { prenom: string; nom: string; classe: string };
}

const PhotoAdmin: React.FC = () => {
  const { role } = useApp();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ContestPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [motifs, setMotifs] = useState<Record<string, string>>({});
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchPhotos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contest_photos')
      .select('*, author:profiles!user_id(prenom, nom, classe)')
      .eq('status', 'en_attente')
      .order('created_at', { ascending: true });
    setPhotos((data || []) as unknown as ContestPhoto[]);
    setLoading(false);
  };

  useEffect(() => { fetchPhotos(); }, []);

  const validate = async (id: string) => {
    await supabase.from('contest_photos').update({ status: 'validee' }).eq('id', id);
    fetchPhotos();
    toast({ title: 'Photo validée !' });
  };

  const refuse = async (id: string) => {
    const motif = motifs[id];
    if (!motif?.trim()) { toast({ title: 'Motif requis', variant: 'destructive' }); return; }
    await supabase.from('contest_photos').update({ status: 'refusee', refus_motif: motif }).eq('id', id);
    fetchPhotos();
    toast({ title: 'Photo refusée' });
  };

  return (
    <div className="mode-photo flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-card px-4 pb-4 pt-12 safe-top">
        <h1 className="font-display text-xl font-bold">Admin Concours Photo</h1>
        <p className="text-sm text-muted-foreground">{photos.length} photo(s) en attente</p>
      </div>
      <div className="px-4 py-4 space-y-4">
        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <CheckCircle size={48} className="mb-3 text-primary/30" />
            <p className="font-semibold">Aucune photo en attente</p>
          </div>
        ) : photos.map(p => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
            <div className="aspect-video overflow-hidden rounded-xl bg-muted">
              <img src={`${supabaseUrl}/storage/v1/object/public/contest-photos/${p.photo_url}`} alt={p.titre} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-semibold">{p.titre}</p>
              {p.author && <p className="text-xs text-muted-foreground">{(p.author as unknown as {prenom:string}).prenom} {(p.author as unknown as {nom:string}).nom} · {(p.author as unknown as {classe:string}).classe}</p>}
            </div>
            <textarea
              placeholder="Motif de refus (requis pour refuser)"
              value={motifs[p.id] || ''}
              onChange={e => setMotifs(m => ({ ...m, [p.id]: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-1 border-destructive/30 text-destructive" onClick={() => refuse(p.id)}>
                <XCircle size={14} /> Refuser
              </Button>
              <Button size="sm" className="flex-1 gap-1" onClick={() => validate(p.id)}>
                <CheckCircle size={14} /> Valider
              </Button>
            </div>
          </div>
        ))}
      </div>
      <BottomNav mode="photo" />
      <ModeFab />
    </div>
  );
};

export default PhotoAdmin;
