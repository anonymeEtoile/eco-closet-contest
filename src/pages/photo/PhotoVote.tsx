import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { CheckCircle, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  titre: string;
  photo_url: string;
  user_id: string;
  author?: { prenom: string; classe: string };
  vote_count?: number;
}

const PhotoVote: React.FC = () => {
  const { user } = useApp();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [votesActive, setVotesActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    const fetch = async () => {
      const [settingsRes, photosRes, voteRes] = await Promise.all([
        supabase.from('contest_settings').select('votes_actifs').single(),
        supabase.from('contest_photos').select('*, author:profiles!user_id(prenom, classe)').eq('status', 'validee').eq('banned', false),
        user ? supabase.from('contest_votes').select('photo_id').eq('voter_id', user.id).single() : Promise.resolve({ data: null }),
      ]);
      setVotesActive(settingsRes.data?.votes_actifs || false);
      if (photosRes.data) {
        const withVotes = await Promise.all(
          (photosRes.data as unknown as Photo[]).map(async p => {
            const { count } = await supabase.from('contest_votes').select('*', { count: 'exact', head: true }).eq('photo_id', p.id);
            return { ...p, vote_count: count || 0 };
          })
        );
        setPhotos(withVotes.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)));
      }
      if (voteRes.data) setMyVote((voteRes.data as { photo_id: string }).photo_id);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const vote = async (photoId: string) => {
    if (!user || !votesActive) return;
    if (photos.find(p => p.id === photoId)?.user_id === user.id) {
      toast({ title: 'Vous ne pouvez pas voter pour votre propre photo', variant: 'destructive' }); return;
    }
    if (myVote) {
      await supabase.from('contest_votes').update({ photo_id: photoId }).eq('voter_id', user.id);
    } else {
      await supabase.from('contest_votes').insert({ voter_id: user.id, photo_id: photoId });
    }
    setMyVote(photoId);
    setPhotos(p => p.map(ph => ({
      ...ph,
      vote_count: ph.id === photoId ? (ph.vote_count || 0) + 1 : ph.id === myVote ? (ph.vote_count || 1) - 1 : ph.vote_count,
    })));
    toast({ title: 'Vote enregistré !' });
  };

  return (
    <div className="mode-photo flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-card px-4 pb-4 pt-12 safe-top">
        <h1 className="font-display text-xl font-bold">Voter</h1>
        {!votesActive && <p className="mt-1 text-sm text-muted-foreground">Les votes ne sont pas encore ouverts.</p>}
      </div>
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : photos.map((p, i) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center font-display text-lg font-bold text-muted-foreground">
              {i + 1}
            </span>
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
              <img src={`${supabaseUrl}/storage/v1/object/public/contest-photos/${p.photo_url}`} alt={p.titre} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="font-semibold line-clamp-1">{p.titre}</p>
                <p className="text-xs text-muted-foreground">{(p.author as unknown as { prenom: string })?.prenom} · {(p.author as unknown as { classe: string })?.classe}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{p.vote_count} vote{(p.vote_count || 0) > 1 ? 's' : ''}</span>
                {votesActive && (
                  <button
                    onClick={() => vote(p.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                      myVote === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {myVote === p.id ? <><CheckCircle size={12} /> Voté</> : <><Heart size={12} /> Voter</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav mode="photo" />
      <ModeFab />
    </div>
  );
};

export default PhotoVote;
