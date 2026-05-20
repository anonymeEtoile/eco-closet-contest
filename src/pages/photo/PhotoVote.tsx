import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { CheckCircle, Heart, Info, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Photo {
  id: string;
  titre: string;
  photo_url: string;
  user_id: string;
  tag_id: string | null;
  author?: { prenom: string; classe: string };
  vote_count?: number;
}

interface Tag { id: string; label: string }

const PhotoVote: React.FC = () => {
  const { user, role } = useApp();
  const { toast } = useToast();
  const isAdmin = role === 'moderateur' || role === 'super_admin';
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({}); // tag_id -> photo_id
  const [votesActive, setVotesActive] = useState(false);
  const [votesVisible, setVotesVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState<Photo | null>(null);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchAll = async () => {
    setLoading(true);
    const [settingsRes, photosRes, tagsRes, votesRes] = await Promise.all([
      supabase.from('contest_settings').select('votes_actifs, votes_visibles').single(),
      supabase.from('contest_photos').select('*').eq('status', 'validee').eq('banned', false),
      supabase.from('contest_tags' as never).select('*').order('label'),
      user ? supabase.from('contest_votes').select('photo_id, tag_id').eq('voter_id', user.id) : Promise.resolve({ data: [] }),
    ]);

    setVotesActive((settingsRes.data as { votes_actifs?: boolean } | null)?.votes_actifs || false);
    setVotesVisible((settingsRes.data as { votes_visibles?: boolean } | null)?.votes_visibles ?? true);
    setTags((tagsRes.data as Tag[]) || []);

    const mine: Record<string, string> = {};
    ((votesRes.data as { photo_id: string; tag_id: string | null }[]) || []).forEach(v => {
      if (v.tag_id) mine[v.tag_id] = v.photo_id;
    });
    setMyVotes(mine);

    if (photosRes.data) {
      const authorIds = [...new Set(photosRes.data.map(p => p.user_id))];
      const { data: authors } = authorIds.length
        ? await supabase.from('profiles').select('id, prenom, classe').in('id', authorIds)
        : { data: [] };
      const authorMap = new Map((authors || []).map(a => [a.id, a]));

      const withVotes = await Promise.all(photosRes.data.map(async (p) => {
        const { count } = await supabase
          .from('contest_votes').select('*', { count: 'exact', head: true }).eq('photo_id', p.id);
        const a = authorMap.get(p.user_id);
        return {
          ...p,
          author: a ? { prenom: a.prenom, classe: a.classe } : undefined,
          vote_count: count || 0,
        } as Photo;
      }));
      setPhotos(withVotes.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0)));
    } else {
      setPhotos([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user]);

  const vote = async (photo: Photo) => {
    if (!user || !votesActive || voting) return;
    if (!photo.tag_id) {
      toast({ title: 'Cette photo n\'a pas de catégorie', variant: 'destructive' });
      return;
    }
    if (photo.user_id === user.id) {
      toast({ title: 'Vous ne pouvez pas voter pour votre propre photo', variant: 'destructive' });
      return;
    }
    const previousVoteId = myVotes[photo.tag_id];
    if (previousVoteId === photo.id) { toast({ title: 'Vous avez déjà voté pour cette photo' }); return; }

    setVoting(photo.id);
    // Delete existing vote for this tag, then insert
    if (previousVoteId) {
      await supabase.from('contest_votes').delete().eq('voter_id', user.id).eq('tag_id', photo.tag_id);
    }
    const { error } = await supabase.from('contest_votes').insert({ voter_id: user.id, photo_id: photo.id });
    setVoting(null);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      fetchAll();
      return;
    }

    setMyVotes(m => ({ ...m, [photo.tag_id!]: photo.id }));
    setPhotos(ps => ps.map(ph => ({
      ...ph,
      vote_count: ph.id === photo.id
        ? (ph.vote_count || 0) + 1
        : ph.id === previousVoteId
          ? Math.max((ph.vote_count || 1) - 1, 0)
          : ph.vote_count,
    })));
    toast({ title: 'Vote enregistré !' });
  };

  const showCount = votesVisible || isAdmin;
  const photosByTag = (tagId: string | null) => photos.filter(p => p.tag_id === tagId);
  const untagged = photos.filter(p => !p.tag_id);

  return (
    <div className="mode-photo flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-card px-4 pb-4 pt-safe">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-xl font-bold">Voter</h1>
          <span className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            votesActive ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
          )}>
            {votesActive ? 'Votes ouverts' : 'Votes désactivés'}
          </span>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <p><span className="font-bold">1 vote PAR THÈME</span> — vous pouvez voter une fois dans chaque catégorie ({tags.length} thème{tags.length > 1 ? 's' : ''} au total).</p>
        </div>
        {!votesVisible && !isAdmin && (
          <p className="mt-2 text-xs text-muted-foreground">Le nombre de votes est masqué pendant le concours.</p>
        )}
      </div>

      <div className="px-4 py-4 space-y-6">
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : tags.length === 0 && untagged.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Aucune photo à voter.</p>
        ) : (
          <>
            {tags.map(tag => {
              const tagPhotos = photosByTag(tag.id);
              if (!tagPhotos.length) return null;
              const myVoteHere = myVotes[tag.id];
              return (
                <section key={tag.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-base font-bold">{tag.label}</h2>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      myVoteHere ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {myVoteHere ? 'Voté' : 'Non voté'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tagPhotos.map((p, i) => (
                      <PhotoRow key={p.id} p={p} rank={i + 1} showCount={showCount} myVote={myVoteHere === p.id} votesActive={votesActive} voting={voting === p.id} onVote={() => vote(p)} onOpen={() => setFullscreen(p)} supabaseUrl={supabaseUrl} />
                    ))}
                  </div>
                </section>
              );
            })}
            {untagged.length > 0 && (
              <section className="space-y-2">
                <h2 className="font-display text-base font-bold text-muted-foreground">Sans catégorie</h2>
                {untagged.map((p, i) => (
                  <PhotoRow key={p.id} p={p} rank={i + 1} showCount={showCount} myVote={false} votesActive={false} voting={false} onVote={() => {}} onOpen={() => setFullscreen(p)} supabaseUrl={supabaseUrl} />
                ))}
              </section>
            )}
          </>
        )}
      </div>

      <Dialog open={!!fullscreen} onOpenChange={(o) => !o && setFullscreen(null)}>
        <DialogContent className="max-w-5xl border-0 bg-black/95 p-2">
          {fullscreen && (
            <div className="flex flex-col items-center gap-3">
              <img
                src={`${supabaseUrl}/storage/v1/object/public/contest-photos/${fullscreen.photo_url}`}
                alt={fullscreen.titre}
                className="max-h-[80vh] w-auto rounded-lg object-contain"
              />
              <div className="text-center text-white">
                <p className="font-display text-lg font-bold">{fullscreen.titre}</p>
                <p className="text-sm text-white/70">{fullscreen.author?.prenom} · {fullscreen.author?.classe}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav mode="photo" />
      <ModeFab />
    </div>
  );
};

const PhotoRow: React.FC<{
  p: Photo; rank: number; showCount: boolean; myVote: boolean; votesActive: boolean; voting: boolean;
  onVote: () => void; onOpen: () => void; supabaseUrl: string;
}> = ({ p, rank, showCount, myVote, votesActive, voting, onVote, onOpen, supabaseUrl }) => (
  <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center font-display text-lg font-bold text-muted-foreground">{rank}</span>
    <button onClick={onOpen} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted group">
      <img src={`${supabaseUrl}/storage/v1/object/public/contest-photos/${p.photo_url}`} alt={p.titre} className="h-full w-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
        <Maximize2 size={18} className="text-white" />
      </span>
    </button>
    <div className="flex flex-1 flex-col justify-between min-w-0">
      <div>
        <p className="font-semibold line-clamp-1">{p.titre}</p>
        <p className="text-xs text-muted-foreground">{p.author?.prenom} · {p.author?.classe}</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={onOpen} className="text-xs font-medium text-primary underline-offset-2 hover:underline">Plein écran</button>
          {showCount && (
            <span className="text-xs font-medium text-muted-foreground">· {p.vote_count} vote{(p.vote_count || 0) > 1 ? 's' : ''}</span>
          )}
        </div>
        {votesActive && (
          <button
            onClick={onVote}
            disabled={voting}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
              myVote ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-primary/10"
            )}
          >
            {myVote ? <><CheckCircle size={12} /> Voté</> : <><Heart size={12} /> Voter</>}
          </button>
        )}
      </div>
    </div>
  </div>
);

export default PhotoVote;
