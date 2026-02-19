import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { Search, SlidersHorizontal, X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CATEGORIES = ['Hauts', 'Bas', 'Robes', 'Vestes', 'Manteaux', 'Chaussures', 'Accessoires', 'Sport', 'Autre'];
const TAILLES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '38', '40', '42', '44'];
const _ETATS = ['Neuf', 'Très bon état', 'Bon état', 'État correct'];

interface Listing {
  id: string;
  title: string;
  type: string;
  price: number | null;
  taille: string | null;
  marque: string | null;
  etat: string | null;
  categorie: string | null;
  photos: string[];
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    categorie: '', taille: '', etat: '', priceMin: '', priceMax: '', donOnly: false,
  });

  const search = async () => {
    setLoading(true);
    let q = supabase.from('listings').select('*').eq('status', 'en_ligne');
    if (query) q = q.or(`title.ilike.%${query}%,marque.ilike.%${query}%,categorie.ilike.%${query}%`);
    if (filters.categorie) q = q.eq('categorie', filters.categorie);
    if (filters.taille) q = q.eq('taille', filters.taille);
    if (filters.etat) q = q.eq('etat', filters.etat);
    if (filters.donOnly) q = q.eq('type', 'don');
    if (filters.priceMin) q = q.gte('price', parseFloat(filters.priceMin));
    if (filters.priceMax) q = q.lte('price', parseFloat(filters.priceMax));
    const { data } = await q.order('created_at', { ascending: false });
    setListings((data || []) as Listing[]);
    setLoading(false);
  };

  useEffect(() => { search(); }, [query, filters]);

  const clearFilters = () => setFilters({ categorie: '', taille: '', etat: '', priceMin: '', priceMax: '', donOnly: false });
  const hasFilters = Object.values(filters).some(v => v !== '' && v !== false);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 pb-3 pt-safe backdrop-blur-md">
        <h1 className="font-display mb-3 text-xl font-bold">Rechercher</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Titre, marque, catégorie…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-colors",
              hasFilters ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
            )}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 space-y-3 animate-fade-in">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Catégorie:</span>
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setFilters(f => ({ ...f, categorie: f.categorie === c ? '' : c }))}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filters.categorie === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Taille:</span>
              {TAILLES.map(t => (
                <button
                  key={t}
                  onClick={() => setFilters(f => ({ ...f, taille: f.taille === t ? '' : t }))}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                    filters.taille === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.donOnly}
                  onChange={e => setFilters(f => ({ ...f, donOnly: e.target.checked }))}
                  className="accent-primary"
                />
                <span className="text-sm font-medium">Dons uniquement</span>
              </label>
              {hasFilters && (
                <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-destructive">
                  <X size={12} /> Effacer les filtres
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} className="mb-4 text-muted-foreground/30" />
            <p className="font-semibold">Aucun résultat</p>
            <p className="mt-1 text-sm text-muted-foreground">Essayez d'autres mots-clés</p>
            {hasFilters && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Effacer les filtres
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {listings.map(listing => {
              const photoUrl = listing.photos[0]
                ? `${supabaseUrl}/storage/v1/object/public/listings-photos/${listing.photos[0]}`
                : null;
              return (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/app/annonce/${listing.id}`)}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  <div className="relative aspect-[3/4] bg-muted">
                    {photoUrl ? (
                      <img src={photoUrl} alt={listing.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center gradient-warm">
                        <Tag size={28} className="text-muted-foreground/40" />
                      </div>
                    )}
                    {listing.type === 'don' && (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Don</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold">{listing.title}</p>
                    <p className="mt-1 text-sm font-bold text-primary">
                      {listing.type === 'don' ? 'Gratuit' : `${listing.price?.toFixed(2)} €`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default SearchPage;
