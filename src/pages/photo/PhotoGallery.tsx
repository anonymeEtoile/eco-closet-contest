import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { useNavigate } from 'react-router-dom';

interface Photo {
  id: string;
  titre: string;
  description: string | null;
  photo_url: string;
  user_id: string;
  author?: { prenom: string; classe: string };
  vote_count?: number;
}

const PhotoGallery: React.FC = () => {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('contest_photos')
        .select('*, author:profiles!user_id(prenom, classe)')
        .eq('status', 'validee')
        .eq('banned', false);

      if (data) {
        const withVotes = await Promise.all(
          (data as unknown as Photo[]).map(async p => {
            const { count } = await supabase.from('contest_votes').select('*', { count: 'exact', head: true }).eq('photo_id', p.id);
            return { ...p, vote_count: count || 0 };
          })
        );
        setPhotos(withVotes);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="mode-photo flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-card px-4 pb-4 pt-safe">
        <h1 className="font-display text-xl font-bold">Galerie</h1>
        <p className="text-sm text-muted-foreground">{photos.length} photo{photos.length > 1 ? 's' : ''} soumise{photos.length > 1 ? 's' : ''}</p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
            <span className="mb-4 text-5xl">📷</span>
            <p className="font-semibold">Aucune photo validée</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 animate-fade-in">
            {photos.map(p => (
              <div key={p.id} className="relative overflow-hidden rounded-xl bg-muted aspect-square group cursor-pointer">
                <img
                  src={`${supabaseUrl}/storage/v1/object/public/contest-photos/${p.photo_url}`}
                  alt={p.titre}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2">
                  <p className="text-xs font-semibold text-white truncate">{p.titre}</p>
                  <p className="text-[10px] text-white/70">{(p.author as unknown as { prenom: string })?.prenom} · {p.vote_count} vote{(p.vote_count || 0) > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav mode="photo" />
      <ModeFab />
    </div>
  );
};

export default PhotoGallery;
