import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { ChevronLeft, Heart, Calendar, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ListingDetail {
  id: string;
  title: string;
  type: string;
  price: number | null;
  taille: string | null;
  marque: string | null;
  etat: string | null;
  categorie: string | null;
  description: string | null;
  photos: string[];
  status: string;
  seller_id: string;
  created_at: string;
  seller?: { prenom: string; classe: string };
}

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const { toast } = useToast();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [instructions, setInstructions] = useState('');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const [listRes, settingsRes] = await Promise.all([
        supabase.from('listings').select('*, seller:profiles!seller_id(prenom, classe)').eq('id', id).single(),
        supabase.from('event_settings').select('instructions_remise').single(),
      ]);
      if (listRes.data) setListing(listRes.data as unknown as ListingDetail);
      if (settingsRes.data) setInstructions(settingsRes.data.instructions_remise);

      if (user) {
        const [favRes, resRes] = await Promise.all([
          supabase.from('favorites').select('id').eq('user_id', user.id).eq('listing_id', id).single(),
          supabase.from('reservations').select('id').eq('listing_id', id).eq('buyer_id', user.id).single(),
        ]);
        setIsFav(!!favRes.data);
        setReserved(!!resRes.data);
      }
    };
    fetchAll();
  }, [id, user]);

  const toggleFav = async () => {
    if (!user || !id) return;
    setIsFav(f => !f);
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: id });
    }
  };

  const reserve = async () => {
    if (!user || !listing) return;
    setReserving(true);
    const { error } = await supabase.from('reservations').insert({
      listing_id: listing.id,
      buyer_id: user.id,
    });
    if (!error) {
      await supabase.from('listings').update({ status: 'reserve' }).eq('id', listing.id);
      setReserved(true);
      toast({ title: 'Réservé !', description: instructions });
    } else {
      toast({ title: 'Déjà réservé', description: error.message, variant: 'destructive' });
    }
    setReserving(false);
  };

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const photos = listing.photos.map(p => `${supabaseUrl}/storage/v1/object/public/listings-photos/${p}`);

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Photos */}
      <div className="relative">
        <div className="aspect-[4/5] overflow-hidden bg-muted">
          {photos.length > 0 ? (
            <img src={photos[currentPhoto]} alt={listing.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center gradient-warm">
              <span className="text-4xl">👕</span>
            </div>
          )}
        </div>

        {/* Nav overlay */}
        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-4 safe-top">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={toggleFav}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm"
          >
            <Heart size={20} className={cn(isFav ? "fill-red-500 text-red-500" : "text-foreground/60")} />
          </button>
        </div>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPhoto(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === currentPhoto ? "w-4 bg-card" : "w-1.5 bg-card/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold leading-tight">{listing.title}</h1>
          <p className="flex-shrink-0 text-xl font-bold text-primary">
            {listing.type === 'don' ? 'Don' : `${listing.price?.toFixed(2)} €`}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {listing.taille && (
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Taille {listing.taille}
            </span>
          )}
          {listing.etat && (
            <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {listing.etat}
            </span>
          )}
          {listing.categorie && (
            <span className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {listing.categorie}
            </span>
          )}
        </div>

        {listing.marque && (
          <p className="text-sm text-muted-foreground">Marque : <span className="font-semibold text-foreground">{listing.marque}</span></p>
        )}

        {listing.description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
        )}

        {/* Seller */}
        {listing.seller && (
          <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              {listing.seller.prenom[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{listing.seller.prenom}</p>
              <p className="text-xs text-muted-foreground">{listing.seller.classe}</p>
            </div>
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar size={12} />
              {format(new Date(listing.created_at), 'd MMM yyyy', { locale: fr })}
            </div>
          </div>
        )}

        {/* Reserve */}
        {user && listing.seller_id !== user.id && listing.status === 'en_ligne' && (
          <div className="pt-2">
            {reserved ? (
              <div className="rounded-xl bg-primary/10 p-4">
                <p className="font-semibold text-primary">✓ Réservé !</p>
                <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                  <p>{instructions}</p>
                </div>
              </div>
            ) : (
              <Button className="w-full gap-2 py-6 text-base font-semibold" onClick={reserve} disabled={reserving}>
                {reserving ? <Loader2 size={18} className="animate-spin" /> : null}
                Réserver
              </Button>
            )}
          </div>
        )}
      </div>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default ListingDetailPage;
