import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { CheckCircle, XCircle, Clock, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

interface PendingListing {
  id: string;
  title: string;
  type: string;
  price: number | null;
  etat: string | null;
  categorie: string | null;
  taille: string | null;
  photos: string[];
  created_at: string;
  seller?: { prenom: string; nom: string; classe: string };
}

const AdminPage: React.FC = () => {
  const { role } = useApp();
  const { toast } = useToast();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refusMotif, setRefusMotif] = useState<Record<string, string>>({});
  const [section, setSection] = useState<'moderation' | 'users'>('moderation');
  const [users, setUsers] = useState<Array<{ id: string; prenom: string; nom: string; classe: string; email: string; suspended: boolean }>>([]);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('*, seller:profiles!seller_id(prenom, nom, classe)')
      .eq('status', 'en_attente')
      .order('created_at', { ascending: true });
    setListings((data || []) as unknown as PendingListing[]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('nom');
    setUsers((data || []) as Array<{ id: string; prenom: string; nom: string; classe: string; email: string; suspended: boolean }>);
  };

  useEffect(() => { fetchPending(); }, []);
  useEffect(() => { if (section === 'users') fetchUsers(); }, [section]);

  const validate = async (id: string) => {
    await supabase.from('listings').update({ status: 'en_ligne' }).eq('id', id);
    fetchPending();
    toast({ title: 'Annonce validée !' });
  };

  const refuse = async (id: string) => {
    const motif = refusMotif[id];
    if (!motif?.trim()) { toast({ title: 'Motif de refus requis', variant: 'destructive' }); return; }
    await supabase.from('listings').update({ status: 'termine', refus_motif: motif }).eq('id', id);
    fetchPending();
    toast({ title: 'Annonce refusée' });
  };

  const toggleSuspend = async (userId: string, suspended: boolean) => {
    await supabase.from('profiles').update({ suspended: !suspended }).eq('id', userId);
    fetchUsers();
    toast({ title: suspended ? 'Compte réactivé' : 'Compte suspendu' });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 pb-0 pt-12 safe-top">
        <h1 className="font-display mb-4 text-xl font-bold">Administration</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setSection('moderation')}
            className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${section === 'moderation' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          >
            Modération ({listings.length})
          </button>
          {role === 'super_admin' && (
            <button
              onClick={() => setSection('users')}
              className={`border-b-2 pb-2.5 text-sm font-medium transition-colors ${section === 'users' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
            >
              Utilisateurs
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {section === 'moderation' && (
          <>
            {loading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <CheckCircle size={48} className="mb-3 text-primary/30" />
                <p className="font-semibold">Tout est à jour !</p>
                <p className="mt-1 text-sm text-muted-foreground">Aucune annonce en attente</p>
              </div>
            ) : listings.map(l => {
              const photoUrl = l.photos[0]
                ? `${supabaseUrl}/storage/v1/object/public/listings-photos/${l.photos[0]}`
                : null;
              return (
                <div key={l.id} className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
                  <div className="flex gap-3">
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                      {photoUrl && <img src={photoUrl} alt={l.title} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{l.title}</p>
                      <p className="text-sm text-primary font-bold">
                        {l.type === 'don' ? 'Don' : `${l.price} €`}
                      </p>
                      {l.seller && (
                        <p className="text-xs text-muted-foreground">
                          {l.seller.prenom} {l.seller.nom} · {l.seller.classe}
                        </p>
                      )}
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {l.taille && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">{l.taille}</span>}
                        {l.etat && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px]">{l.etat}</span>}
                      </div>
                    </div>
                  </div>
                  <textarea
                    placeholder="Motif de refus (requis pour refuser)"
                    value={refusMotif[l.id] || ''}
                    onChange={e => setRefusMotif(r => ({ ...r, [l.id]: e.target.value }))}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                      onClick={() => refuse(l.id)}
                    >
                      <XCircle size={14} /> Refuser
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => validate(l.id)}
                    >
                      <CheckCircle size={14} /> Valider
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {section === 'users' && (
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  {u.prenom[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{u.prenom} {u.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.classe} · {u.email}</p>
                </div>
                <button
                  onClick={() => toggleSuspend(u.id, u.suspended)}
                  className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${u.suspended ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}
                >
                  {u.suspended ? 'Réactiver' : 'Suspendre'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default AdminPage;
