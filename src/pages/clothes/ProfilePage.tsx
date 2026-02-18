import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import { User, Heart, Lock, Trash2, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface FavListing {
  id: string;
  title: string;
  type: string;
  price: number | null;
  photos: string[];
}

const ProfilePage: React.FC = () => {
  const { user, profile, signOut } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [section, setSection] = useState<'main' | 'password' | 'favorites'>('main');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<FavListing[]>([]);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('listing_id, listings(*)')
      .eq('user_id', user.id);
    if (data) {
      setFavorites(data.map((f: unknown) => (f as { listings: FavListing }).listings).filter(Boolean));
    }
  };

  useEffect(() => {
    if (section === 'favorites') fetchFavorites();
  }, [section, user]);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) { toast({ title: 'Mot de passe trop court', variant: 'destructive' }); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setLoading(false);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Mot de passe mis à jour !' }); setNewPass(''); setSection('main'); }
  };

  const deleteAccount = async () => {
    if (!confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) return;
    await signOut();
    toast({ title: 'Compte supprimé' });
    navigate('/');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (section === 'password') {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-24">
        <div className="border-b border-border bg-card px-4 pb-4 pt-12 safe-top">
          <button onClick={() => setSection('main')} className="mb-3 text-sm text-primary">← Retour</button>
          <h1 className="font-display text-xl font-bold">Changer le mot de passe</h1>
        </div>
        <form onSubmit={changePassword} className="px-4 py-6 space-y-4">
          <div>
            <Label htmlFor="newpass">Nouveau mot de passe</Label>
            <Input
              id="newpass"
              type="password"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className="mt-1.5"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Mise à jour…' : 'Mettre à jour'}
          </Button>
        </form>
        <BottomNav mode="vente" />
        <ModeFab />
      </div>
    );
  }

  if (section === 'favorites') {
    return (
      <div className="flex min-h-screen flex-col bg-background pb-24">
        <div className="border-b border-border bg-card px-4 pb-4 pt-12 safe-top">
          <button onClick={() => setSection('main')} className="mb-3 text-sm text-primary">← Retour</button>
          <h1 className="font-display text-xl font-bold">Mes favoris</h1>
        </div>
        <div className="px-4 py-4 grid grid-cols-2 gap-3">
          {favorites.length === 0 ? (
            <div className="col-span-2 py-16 text-center text-muted-foreground">
              <Heart size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucun favori pour l'instant</p>
            </div>
          ) : favorites.map(f => {
            const photoUrl = f.photos[0]
              ? `${supabaseUrl}/storage/v1/object/public/listings-photos/${f.photos[0]}`
              : null;
            return (
              <div
                key={f.id}
                className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                onClick={() => navigate(`/app/annonce/${f.id}`)}
              >
                <div className="aspect-[3/4] bg-muted">
                  {photoUrl && <img src={photoUrl} alt={f.title} className="h-full w-full object-cover" />}
                </div>
                <div className="p-2">
                  <p className="truncate text-sm font-semibold">{f.title}</p>
                  <p className="text-sm font-bold text-primary">
                    {f.type === 'don' ? 'Gratuit' : `${f.price?.toFixed(2)} €`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <BottomNav mode="vente" />
        <ModeFab />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="gradient-hero px-4 pb-8 pt-12 safe-top">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/15 text-2xl font-bold text-primary-foreground">
            {profile?.prenom?.[0] || '?'}
          </div>
          <div>
            <p className="text-xl font-bold text-primary-foreground">
              {profile?.prenom} {profile?.nom}
            </p>
            <p className="text-sm text-primary-foreground/70">{profile?.classe}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 py-4 space-y-2 animate-fade-in">
        <button
          onClick={() => setSection('favorites')}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Heart size={18} className="text-primary" />
            </div>
            <span className="font-medium">Mes favoris</span>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

        <button
          onClick={() => setSection('password')}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 shadow-card"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Lock size={18} className="text-primary" />
            </div>
            <span className="font-medium">Changer le mot de passe</span>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </button>

        <div className="pt-4 space-y-2">
          <Button
            variant="outline"
            className="w-full gap-2 py-5"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            Se déconnecter
          </Button>
          <button
            onClick={deleteAccount}
            className="w-full text-sm text-destructive/70 hover:text-destructive py-2"
          >
            <Trash2 size={14} className="inline mr-1" />
            Supprimer mon compte
          </button>
        </div>
      </div>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default ProfilePage;
