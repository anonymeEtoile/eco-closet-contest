import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Recycle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AuthTab = 'login-eleve' | 'signup-eleve' | 'login-admin';

const CLASSES = [
  'Seconde 1','Seconde 2','Seconde 3','Seconde 4','Seconde 5','Seconde 6','Seconde 7','Seconde 8',
  'Première 1','Première 2','Première 3','Première 4','Première 5','Première 6',
  'Terminal 1','Terminal 2','Terminal 3','Terminal 4','Terminal 5','Terminal 6',
];

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useApp();
  const { toast } = useToast();

  const [tab, setTab] = useState<AuthTab>(
    searchParams.get('tab') === 'signup' ? 'signup-eleve' : 'login-eleve'
  );
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '', prenom: '', nom: '', classe: CLASSES[0],
  });

  useEffect(() => {
    if (user) navigate('/app');
  }, [user, navigate]);

  const updateForm = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const capitalizeFirst = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.prenom || !form.nom || !form.classe) {
      toast({ title: 'Tous les champs sont requis', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'Mot de passe trop court (6 caractères minimum)', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          prenom: capitalizeFirst(form.prenom.trim()),
          nom: form.nom.trim().toUpperCase(),
          classe: form.classe,
          role: 'eleve',
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Compte créé !', description: 'Vérifiez votre email pour confirmer votre compte.' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast({ title: 'Email et mot de passe requis', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Erreur de connexion', description: 'Email ou mot de passe incorrect.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="gradient-hero px-6 pb-8 pt-safe-top pt-10">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Retour</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/15">
            <Recycle size={24} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-primary-foreground">Connexion</h1>
            <p className="text-sm text-primary-foreground/70">Lycée Marie Madeleine Fourcade</p>
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="mx-6 -mt-4 flex gap-2 rounded-2xl bg-card p-1.5 shadow-card">
        <button
          onClick={() => setTab('login-eleve')}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
            tab === 'login-eleve' || tab === 'signup-eleve'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Élève
        </button>
        <button
          onClick={() => setTab('login-admin')}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
            tab === 'login-admin'
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Admin / Modérateur
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        {/* Eleve tabs */}
        {(tab === 'login-eleve' || tab === 'signup-eleve') && (
          <div>
            <div className="mb-6 flex rounded-xl border border-border bg-muted/30 p-1">
              <button
                onClick={() => setTab('login-eleve')}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                  tab === 'login-eleve' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Se connecter
              </button>
              <button
                onClick={() => setTab('signup-eleve')}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
                  tab === 'signup-eleve' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                Créer un compte
              </button>
            </div>

            {tab === 'login-eleve' && (
              <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ton@email.fr"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    className="mt-1.5"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => updateForm('password', e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={loading}>
                  {loading ? 'Connexion…' : 'Se connecter'}
                </Button>
              </form>
            )}

            {tab === 'signup-eleve' && (
              <form onSubmit={handleSignup} className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      placeholder="Émile"
                      value={form.prenom}
                      onChange={e => updateForm('prenom', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      placeholder="DUPONT"
                      value={form.nom}
                      onChange={e => updateForm('nom', e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="classe">Classe</Label>
                  <select
                    id="classe"
                    value={form.classe}
                    onChange={e => updateForm('classe', e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CLASSES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="ton@email.fr"
                    value={form.email}
                    onChange={e => updateForm('email', e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="password-signup">Mot de passe</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password-signup"
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => updateForm('password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={loading}>
                  {loading ? 'Création…' : 'Créer mon compte'}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Admin login */}
        {tab === 'login-admin' && (
          <form onSubmit={handleLogin} className="animate-fade-in space-y-4">
            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              Réservé aux administrateurs et modérateurs du lycée.
            </div>
            <div>
              <Label htmlFor="email-admin">Email</Label>
              <Input
                id="email-admin"
                type="email"
                placeholder="admin@lycee.fr"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password-admin">Mot de passe</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password-admin"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => updateForm('password', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full py-6 text-base font-semibold" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
