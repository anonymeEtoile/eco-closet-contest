import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import ThemeToggle from '@/components/ThemeToggle';
import { CheckCircle, XCircle, Settings2, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContestPhoto {
  id: string;
  titre: string;
  photo_url: string;
  status: string;
  banned: boolean;
  author?: { prenom: string; nom: string; classe: string };
}

interface ContestSettings {
  id: string;
  titre: string;
  description: string;
  theme: string;
  date_limite: string | null;
  recompenses: string | null;
  votes_actifs: boolean;
  classement_public: boolean;
}

const PhotoAdmin: React.FC = () => {
  const { role } = useApp();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ContestPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [motifs, setMotifs] = useState<Record<string, string>>({});
  const [section, setSection] = useState<'moderation' | 'settings'>('moderation');
  const [settings, setSettings] = useState<ContestSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchPhotos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contest_photos')
      .select('*, author:profiles!user_id(prenom, nom, classe)')
      .eq('status', 'en_attente')
      .order('created_at', { ascending: true });
    setPhotos((data || []) as unknown as ContestPhoto[]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('contest_settings').select('*').single();
    if (data) setSettings(data as ContestSettings);
  };

  useEffect(() => { fetchPhotos(); }, []);
  useEffect(() => { if (section === 'settings') fetchSettings(); }, [section]);

  const validate = async (id: string) => {
    await supabase.from('contest_photos').update({ status: 'validee' }).eq('id', id);
    fetchPhotos();
    toast({ title: 'Photo validée !' });
  };

  const refuse = async (id: string) => {
    const motif = motifs[id];
    if (!motif?.trim()) { toast({ title: 'Motif requis', variant: 'destructive' }); return; }
    await supabase.from('contest_photos').update({ status: 'refusee', refus_motif: motif }).eq('id', id);
    fetchPhotos();
    toast({ title: 'Photo refusée' });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { error } = await supabase.from('contest_settings').update({
      titre: settings.titre,
      description: settings.description,
      theme: settings.theme,
      date_limite: settings.date_limite || null,
      recompenses: settings.recompenses || null,
      votes_actifs: settings.votes_actifs,
      classement_public: settings.classement_public,
    }).eq('id', settings.id);
    setSavingSettings(false);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Paramètres du concours sauvegardés !' }); }
  };

  const resetContest = async () => {
    if (!confirm('Réinitialiser le concours ? Toutes les photos et votes seront supprimés.')) return;
    await supabase.from('contest_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('contest_photos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    fetchPhotos();
    toast({ title: 'Concours réinitialisé' });
  };

  const SECTIONS = [
    { key: 'moderation' as const, label: `Photos (${photos.length})` },
    ...(role === 'super_admin' ? [{ key: 'settings' as const, label: 'Paramètres concours' }] : []),
  ];

  return (
    <div className="mode-photo flex min-h-screen flex-col bg-background pb-24">
      <div className="border-b border-border bg-card px-4 pb-0 pt-safe">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-display text-xl font-bold">Admin Concours</h1>
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

      <div className="px-4 py-4 space-y-4">
        {/* Moderation */}
        {section === 'moderation' && (
          <>
            {loading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
                <CheckCircle size={48} className="mb-3 text-primary/30" />
                <p className="font-semibold">Aucune photo en attente</p>
              </div>
            ) : photos.map(p => (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
                <div className="aspect-video overflow-hidden rounded-xl bg-muted">
                  <img src={`${supabaseUrl}/storage/v1/object/public/contest-photos/${p.photo_url}`} alt={p.titre} className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold">{p.titre}</p>
                  {p.author && <p className="text-xs text-muted-foreground">{(p.author as unknown as {prenom:string}).prenom} {(p.author as unknown as {nom:string}).nom} · {(p.author as unknown as {classe:string}).classe}</p>}
                </div>
                <textarea
                  placeholder="Motif de refus (requis pour refuser)"
                  value={motifs[p.id] || ''}
                  onChange={e => setMotifs(m => ({ ...m, [p.id]: e.target.value }))}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-1 border-destructive/30 text-destructive" onClick={() => refuse(p.id)}>
                    <XCircle size={14} /> Refuser
                  </Button>
                  <Button size="sm" className="flex-1 gap-1" onClick={() => validate(p.id)}>
                    <CheckCircle size={14} /> Valider
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Contest Settings */}
        {section === 'settings' && settings && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-4">
              <h2 className="font-display text-base font-bold flex items-center gap-2">
                <Settings2 size={16} className="text-primary" /> Contenu du concours
              </h2>
              <div>
                <label className="text-sm font-medium">Titre</label>
                <Input value={settings.titre} onChange={e => setSettings(s => s ? { ...s, titre: e.target.value } : s)} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium">Thème</label>
                <Input value={settings.theme} onChange={e => setSettings(s => s ? { ...s, theme: e.target.value } : s)} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium">Description / Règlement</label>
                <textarea
                  value={settings.description}
                  onChange={e => setSettings(s => s ? { ...s, description: e.target.value } : s)}
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date limite</label>
                <Input type="datetime-local" value={settings.date_limite ? settings.date_limite.slice(0, 16) : ''} onChange={e => setSettings(s => s ? { ...s, date_limite: e.target.value } : s)} className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium">Récompenses</label>
                <textarea
                  value={settings.recompenses || ''}
                  onChange={e => setSettings(s => s ? { ...s, recompenses: e.target.value } : s)}
                  rows={2}
                  className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
              <h2 className="font-display text-base font-bold">Paramètres votes & classement</h2>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Votes actifs</span>
                <input type="checkbox" checked={settings.votes_actifs} onChange={e => setSettings(s => s ? { ...s, votes_actifs: e.target.checked } : s)} className="accent-primary h-5 w-5" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Classement public</span>
                <input type="checkbox" checked={settings.classement_public} onChange={e => setSettings(s => s ? { ...s, classement_public: e.target.checked } : s)} className="accent-primary h-5 w-5" />
              </label>
            </div>

            <Button className="w-full gap-2 py-5 text-base font-semibold" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? 'Sauvegarde…' : <><Save size={16} /> Sauvegarder</>}
            </Button>

            <Button variant="outline" className="w-full gap-2 py-4 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={resetContest}>
              <RotateCcw size={16} /> Réinitialiser le concours
            </Button>
          </div>
        )}
      </div>
      <BottomNav mode="photo" />
      <ModeFab />
    </div>
  );
};

export default PhotoAdmin;
