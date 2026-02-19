import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { Tag, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type StatusFilter = 'en_attente' | 'en_ligne' | 'reserve' | 'termine';

interface Listing {
  id: string;
  title: string;
  type: string;
  price: number | null;
  status: string;
  photos: string[];
  created_at: string;
}

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'en_attente', label: 'En attente' },
  { key: 'en_ligne', label: 'En ligne' },
  { key: 'reserve', label: 'Réservées' },
  { key: 'termine', label: 'Terminées' },
];

const MyListingsPage: React.FC = () => {
  const { user } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StatusFilter>('en_ligne');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchListings = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .eq('status', activeTab)
      .order('created_at', { ascending: false });
    setListings((data || []) as Listing[]);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, [activeTab, user]);

  const markDone = async (id: string) => {
    await supabase.from('listings').update({ status: 'termine' }).eq('id', id);
    fetchListings();
    toast({ title: 'Marquée comme terminée' });
  };

  const deleteListing = async (id: string) => {
    await supabase.from('listings').delete().eq('id', id);
    fetchListings();
    toast({ title: 'Annonce supprimée' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 pb-0 pt-safe">
        <h1 className="font-display mb-4 text-xl font-bold">Mes annonces</h1>
        <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-none">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex-shrink-0 border-b-2 px-4 pb-2.5 text-sm font-medium transition-colors",
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 space-y-3 animate-fade-in">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Tag size={40} className="mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">Aucune annonce</p>
            <p className="mt-1 text-sm text-muted-foreground">dans cet onglet</p>
          </div>
        ) : (
          listings.map(l => {
            const photoUrl = l.photos[0]
              ? `${supabaseUrl}/storage/v1/object/public/listings-photos/${l.photos[0]}`
              : null;
            return (
              <div
                key={l.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-card"
              >
                <div
                  className="h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted"
                  onClick={() => navigate(`/app/annonce/${l.id}`)}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={l.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center gradient-warm">
                      <Tag size={20} className="text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="font-semibold text-foreground line-clamp-1">{l.title}</p>
                    <p className="text-sm font-bold text-primary">
                      {l.type === 'don' ? 'Don gratuit' : `${l.price?.toFixed(2)} €`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(l.status === 'en_ligne' || l.status === 'reserve') && (
                      <button
                        onClick={() => markDone(l.id)}
                        className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        <CheckCircle size={12} /> Terminé
                      </button>
                    )}
                    {l.status !== 'reserve' && (
                      <button
                        onClick={() => deleteListing(l.id)}
                        className="flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                      >
                        <Trash2 size={12} /> Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB to add */}
      <Button
        className="fixed bottom-20 left-4 gap-2 rounded-full px-4 py-3 shadow-sage-lg"
        onClick={() => navigate('/app/vendre')}
      >
        + Nouvelle annonce
      </Button>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default MyListingsPage;
