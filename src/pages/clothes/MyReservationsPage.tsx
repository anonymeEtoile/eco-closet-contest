import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import ThemeToggle from '@/components/ThemeToggle';
import { Tag, X, ChevronLeft, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ReservationRow {
  id: string;
  listing_id: string;
  created_at: string;
  listing?: {
    id: string;
    title: string;
    photos: string[];
    status: string;
  } | null;
}

const MyReservationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const { toast } = useToast();
  const [items, setItems] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [instructions, setInstructions] = useState('');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: reservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    const ids = [...new Set((reservations || []).map(r => r.listing_id))];
    const { data: listings } = ids.length
      ? await supabase.from('listings').select('id, title, photos, status').in('id', ids)
      : { data: [] };
    const map = new Map((listings || []).map(l => [l.id, l]));

    const merged = (reservations || []).map(r => ({
      ...r,
      listing: map.get(r.listing_id) ?? null,
    }));
    setItems(merged as ReservationRow[]);

    const { data: settings } = await supabase
      .from('event_settings')
      .select('instructions_remise')
      .single();
    if (settings) setInstructions(settings.instructions_remise || '');

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cancel = async (reservationId: string, listingId: string) => {
    if (!confirm('Annuler cette réservation ?')) return;
    const { error } = await supabase.from('reservations').delete().eq('id', reservationId);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    await supabase.from('listings').update({ status: 'en_ligne' }).eq('id', listingId);
    toast({ title: 'Réservation annulée' });
    fetchData();
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-card px-4 pb-3 pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-muted-foreground">
              <ChevronLeft size={22} />
            </button>
            <h1 className="font-display text-xl font-bold">Mes réservations</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 animate-fade-in">
        {instructions && (
          <div className="rounded-xl bg-primary/10 p-3 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin size={16} className="mt-0.5 flex-shrink-0 text-primary" />
            <p>{instructions}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Tag size={40} className="mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">Aucune réservation</p>
            <p className="mt-1 text-sm text-muted-foreground">Réservez un vêtement depuis l'accueil</p>
          </div>
        ) : (
          items.map(r => {
            if (!r.listing) {
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <p className="flex-1 text-sm text-muted-foreground">Annonce supprimée</p>
                  <Button size="sm" variant="outline" onClick={() => cancel(r.id, r.listing_id)}>
                    <X size={14} />
                  </Button>
                </div>
              );
            }
            const photoUrl = r.listing.photos[0]
              ? `${supabaseUrl}/storage/v1/object/public/listings-photos/${r.listing.photos[0]}`
              : null;
            return (
              <div key={r.id} className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                <div
                  className="h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted"
                  onClick={() => navigate(`/app/annonce/${r.listing!.id}`)}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={r.listing.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-muted">
                      <Tag size={20} className="text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between min-w-0">
                  <div>
                    <p className="font-semibold text-foreground line-clamp-1">{r.listing.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.listing.status === 'reserve' ? 'Réservé' : r.listing.status}
                    </p>
                  </div>
                  <button
                    onClick={() => cancel(r.id, r.listing_id)}
                    className="self-start flex items-center gap-1 rounded-lg bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                  >
                    <X size={12} /> Annuler
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default MyReservationsPage;
