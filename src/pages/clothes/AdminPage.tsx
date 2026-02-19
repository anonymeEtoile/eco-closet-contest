import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import ThemeToggle from '@/components/ThemeToggle';
import { CheckCircle, XCircle, ShieldOff, Edit2, Save, X, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import ClassSelector from '@/components/ClassSelector';
import { cn } from '@/lib/utils';

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

interface UserProfile {
  id: string;
  prenom: string;
  nom: string;
  classe: string;
  email: string;
  suspended: boolean;
  role?: string;
}

const AdminPage: React.FC = () => {
  const { role } = useApp();
  const { toast } = useToast();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refusMotif, setRefusMotif] = useState<Record<string, string>>({});
  const [section, setSection] = useState<'moderation' | 'users' | 'settings'>('moderation');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ prenom: string; nom: string; classe: string }>({ prenom: '', nom: '', classe: '' });
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Event settings state
  const [eventSettings, setEventSettings] = useState({
    presentation_text: '',
    semaine_collecte_start: '',
    semaine_collecte_end: '',
    point_collecte_date: '',
    lieux_depot: [] as string[],
    instructions_remise: '',
  });
  const [newLieu, setNewLieu] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

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
    const { data: profiles } = await supabase.from('profiles').select('*').order('nom');
    const { data: roles } = await supabase.from('user_roles').select('user_id, role');
    const roleMap: Record<string, string> = {};
    (roles || []).forEach((r: { user_id: string; role: string }) => { roleMap[r.user_id] = r.role; });
    const merged = (profiles || []).map((p: UserProfile) => ({ ...p, role: roleMap[p.id] || 'eleve' }));
    setUsers(merged as UserProfile[]);
  };

  const fetchEventSettings = async () => {
    const { data } = await supabase.from('event_settings').select('*').single();
    if (data) {
      setEventSettings({
        presentation_text: data.presentation_text || '',
        semaine_collecte_start: data.semaine_collecte_start || '',
        semaine_collecte_end: data.semaine_collecte_end || '',
        point_collecte_date: data.point_collecte_date || '',
        lieux_depot: data.lieux_depot || [],
        instructions_remise: data.instructions_remise || '',
      });
    }
  };

  useEffect(() => { fetchPending(); }, []);
  useEffect(() => { if (section === 'users') fetchUsers(); }, [section]);
  useEffect(() => { if (section === 'settings') fetchEventSettings(); }, [section]);

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

  const startEdit = (u: UserProfile) => {
    setEditingUser(u.id);
    setEditForm({ prenom: u.prenom, nom: u.nom, classe: u.classe });
  };

  const saveEdit = async (userId: string) => {
    await supabase.from('profiles').update({
      prenom: editForm.prenom,
      nom: editForm.nom.toUpperCase(),
      classe: editForm.classe,
    }).eq('id', userId);
    setEditingUser(null);
    fetchUsers();
    toast({ title: 'Profil mis à jour' });
  };

  const changeRole = async (userId: string, newRole: string) => {
    await supabase.from('user_roles').update({ role: newRole as 'eleve' | 'moderateur' | 'super_admin' }).eq('user_id', userId);
    fetchUsers();
    toast({ title: `Rôle modifié : ${newRole}` });
  };

  const saveEventSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from('event_settings').update({
      presentation_text: eventSettings.presentation_text,
      semaine_collecte_start: eventSettings.semaine_collecte_start || null,
      semaine_collecte_end: eventSettings.semaine_collecte_end || null,
      point_collecte_date: eventSettings.point_collecte_date || null,
      lieux_depot: eventSettings.lieux_depot,
      instructions_remise: eventSettings.instructions_remise,
    }).neq('id', '00000000-0000-0000-0000-000000000000');
    setSavingSettings(false);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Paramètres sauvegardés !' }); }
  };

  const addLieu = () => {
    if (!newLieu.trim()) return;
    setEventSettings(s => ({ ...s, lieux_depot: [...s.lieux_depot, newLieu.trim()] }));
    setNewLieu('');
  };

  const removeLieu = (i: number) => {
    setEventSettings(s => ({ ...s, lieux_depot: s.lieux_depot.filter((_, idx) => idx !== i) }));
  };

  const SECTIONS = [
    { key: 'moderation', label: `Modération (${listings.length})` },
    ...(role === 'super_admin' ? [
      { key: 'users', label: 'Utilisateurs' },
      { key: 'settings', label: 'Paramètres' },
    ] : []),
  ] as { key: typeof section; label: string }[];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 pb-0 pt-safe">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-xl font-bold">Administration</h1>
          <ThemeToggle />
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-none">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                'flex-shrink-0 border-b-2 pb-2.5 text-sm font-medium transition-colors',
                section === s.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Moderation */}
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
                    <Button variant="outline" size="sm" className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => refuse(l.id)}>
                      <XCircle size={14} /> Refuser
                    </Button>
                    <Button size="sm" className="flex-1 gap-1" onClick={() => validate(l.id)}>
                      <CheckCircle size={14} /> Valider
                    </Button>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Users */}
        {section === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
                {editingUser === u.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Prénom</label>
                        <Input value={editForm.prenom} onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))} className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Nom</label>
                        <Input value={editForm.nom} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} className="mt-1 h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Classe</label>
                      <div className="mt-1">
                        <ClassSelector value={editForm.classe} onChange={v => setEditForm(f => ({ ...f, classe: v }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1" onClick={() => saveEdit(u.id)}>
                        <Save size={12} /> Sauvegarder
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                        {u.prenom[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{u.prenom} {u.nom}</p>
                          {u.suspended && <span className="rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">Suspendu</span>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.classe} · {u.email}</p>
                      </div>
                      <button onClick={() => startEdit(u)} className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Edit2 size={14} />
                      </button>
                    </div>

                    {/* Role selector */}
                    <div className="flex gap-1.5 flex-wrap">
                      {(['eleve', 'moderateur', 'super_admin'] as const).map(r => (
                        <button
                          key={r}
                          onClick={() => changeRole(u.id, r)}
                          className={cn(
                            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors',
                            u.role === r
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {r === 'super_admin' ? 'Super Admin' : r === 'moderateur' ? 'Modérateur' : 'Élève'}
                        </button>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSuspend(u.id, u.suspended)}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                          u.suspended
                            ? 'bg-primary/10 text-primary hover:bg-primary/20'
                            : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                        )}
                      >
                        {u.suspended ? <><RotateCcw size={12} /> Réactiver</> : <><ShieldOff size={12} /> Suspendre</>}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        {section === 'settings' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-4">
              <h2 className="font-display text-base font-bold">Page d'accueil publique</h2>
              <div>
                <label className="text-sm font-medium">Texte de présentation</label>
                <textarea
                  value={eventSettings.presentation_text}
                  onChange={e => setEventSettings(s => ({ ...s, presentation_text: e.target.value }))}
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Début semaine de collecte</label>
                  <Input type="date" value={eventSettings.semaine_collecte_start} onChange={e => setEventSettings(s => ({ ...s, semaine_collecte_start: e.target.value }))} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Fin semaine de collecte</label>
                  <Input type="date" value={eventSettings.semaine_collecte_end} onChange={e => setEventSettings(s => ({ ...s, semaine_collecte_end: e.target.value }))} className="mt-1.5" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Date point de collecte</label>
                <Input type="date" value={eventSettings.point_collecte_date} onChange={e => setEventSettings(s => ({ ...s, point_collecte_date: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium">Instructions de remise</label>
                <textarea
                  value={eventSettings.instructions_remise}
                  onChange={e => setEventSettings(s => ({ ...s, instructions_remise: e.target.value }))}
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lieux de dépôt</label>
                <div className="mt-1.5 space-y-1.5">
                  {eventSettings.lieux_depot.map((lieu, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <span className="flex-1 text-sm">{lieu}</span>
                      <button onClick={() => removeLieu(i)} className="text-destructive hover:text-destructive/80">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input placeholder="Nouveau lieu…" value={newLieu} onChange={e => setNewLieu(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLieu())} className="flex-1" />
                    <Button type="button" size="sm" variant="outline" onClick={addLieu}>Ajouter</Button>
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full gap-2 py-5 text-base font-semibold" onClick={saveEventSettings} disabled={savingSettings}>
              {savingSettings ? 'Sauvegarde…' : <><Save size={16} /> Sauvegarder les paramètres</>}
            </Button>
          </div>
        )}
      </div>

      <BottomNav mode="vente" />
      <ModeFab />
    </div>
  );
};

export default AdminPage;
