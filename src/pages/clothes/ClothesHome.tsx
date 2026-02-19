import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import ThemeToggle from '@/components/ThemeToggle';
import { Heart, Search as SearchIcon, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';


interface Listing {
  id: string;
  title: string;
  type: string;
  price: number | null;
  taille: string | null;
  marque: string | null;
  etat: string | null;
  photos: string[];
  status: string;
  seller_id: string;
}

const ListingCard: React.FC<{
  listing: Listing;
  isFavorite: boolean;
  onToggleFav: (id: string) => void;
  onClick: () => void;
}> = ({ listing, isFavorite, onToggleFav, onClick }) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const photoUrl = listing.photos[0]
    ? `${supabaseUrl}/storage/v1/object/public/listings-photos/${listing.photos[0]}`
    : null;

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-transform duration-200 active:scale-98"
      onClick={onClick}
    >
      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-warm">
            <Tag size={32} className="text-muted-foreground/40" />
          </div>
        )}
        {/* Favorite button */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(listing.id); }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-transform active:scale-90"
        >
          <Heart
            size={16}
            className={cn(isFavorite ? "fill-red-500 text-red-500" : "text-foreground/60")}
          />
        </button>
        {/* Type badge */}
        {listing.type === 'don' && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            Don
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="truncate text-sm font-semibold text-foreground">{listing.title}</p>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm font-bold text-primary">
            {listing.type === 'don' ? 'Gratuit' : `${listing.price?.toFixed(2)} €`}
          </p>
          {listing.taille && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {listing.taille}
            </span>
          )}
        </div>
        {listing.marque && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{listing.marque}</p>
        )}
      </div>
    </div>
  );
};

const ClothesHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [listings, setListings] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [listingsRes, favsRes] = await Promise.all([
      supabase.from('listings').select('*').eq('status', 'en_ligne').order('created_at', { ascending: false }),
      user ? supabase.from('favorites').select('listing_id').eq('user_id', user.id) : { data: [] },
    ]);
    if (listingsRes.data) setListings(listingsRes.data as Listing[]);
    if (favsRes.data) setFavorites(new Set((favsRes.data as { listing_id: string }[]).map(f => f.listing_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleFav = async (listingId: string) => {
    if (!user) return;
    const isFav = favorites.has(listingId);
    setFavorites(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(listingId); else next.add(listingId);
      return next;
    });
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
    }
  };

  const filtered = listings.filter(l =>
    !search ||
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    (l.marque || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="gradient-hero px-4 pb-6 pt-safe">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">Vêtements</h1>
            <p className="mt-0.5 text-sm text-primary-foreground/70">Seconde vie garantie 🌱</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Search bar */}
        <div className="relative mt-4">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher un vêtement, une marque…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tag size={48} className="mb-4 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">Aucune annonce</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Essayez d\'autres mots-clés' : 'Soyez le premier à publier !'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {filtered.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite={favorites.has(listing.id)}
                onToggleFav={toggleFav}
                onClick={() => navigate(`/app/annonce/${listing.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default ClothesHome;
