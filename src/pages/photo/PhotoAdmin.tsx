import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import ThemeToggle from '@/components/ThemeToggle';
import { CheckCircle, XCircle, Settings2, Save, RotateCcw, Trash2 } from 'lucide-react';
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
  tag_id: string | null;
  author?: { prenom: string; nom: string; classe: string };
}

interface Tag { id: string; label: string }

interface ContestSettings {
  id: string;
  titre: string;
  description: string;
  theme: string;
  date_limite: string | null;
  recompenses: string | null;
  votes_actifs: boolean;
  classement_public: boolean;
  votes_visibles: boolean;
}

interface VoteRow {
  id: string;
  voter_id: string;
  photo_id: string;
  created_at: string;
  voter?: { prenom: string; nom: string; classe: string };
  photo?: { titre: string; tag_id: string | null };
}

const PhotoAdmin: React.FC = () => {
  const { role } = useApp();
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ContestPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [motifs, setMotifs] = useState<Record<string, string>>({});
  const [section, setSection] = useState<'moderation' | 'settings' | 'tags' | 'votes'>('moderation');
  const [moderationStatus, setModerationStatus] = useState<'en_attente' | 'validee'>('en_attente');
  const [settings, setSettings] = useState<ContestSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const fetchTags = async () => {
    const { data } = await supabase.from('contest_tags' as never).select('*').order('label');
    setTags((data as Tag[]) || []);
  };

  const fetchPhotos = async () => {
    setLoading(true);

    const { data: pendingPhotos, error: photosError } = await supabase
      .from('contest_photos')
      .select('*')
      .eq('status', moderationStatus)
      .order('created_at', { ascending: true });

    if (photosError) {
      setPhotos([]);
      setLoading(false);
      toast({ title: 'Erreur', description: photosError.message, variant: 'destructive' });
      return;
    }

    const authorIds = [...new Set((pendingPhotos || []).map((photo) => photo.user_id))];

    const { data: authors, error: authorsError } = authorIds.length
      ? await supabase
          .from('profiles')
          .select('id, prenom, nom, classe')
          .in('id', authorIds)
      : { data: [], error: null };

    if (authorsError) {
      setPhotos([]);
      setLoading(false);
      toast({ title: 'Erreur', description: authorsError.message, variant: 'destructive' });
      return;
    }

    const authorMap = new Map((authors || []).map((author) => [author.id, author]));
    const mergedPhotos = (pendingPhotos || []).map((photo) => ({
      ...photo,
      author: authorMap.get(photo.user_id)
        ? {
            prenom: authorMap.get(photo.user_id)!.prenom,
            nom: authorMap.get(photo.user_id)!.nom,
            classe: authorMap.get(photo.user_id)!.classe,
          }
        : undefined,
    }));

    setPhotos(mergedPhotos as ContestPhoto[]);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('contest_settings').select('*').single();
    if (data) setSettings(data as ContestSettings);
  };

  const fetchVotes = async () => {
    const { data: voteData } = await supabase.from('contest_votes').select('id, voter_id, photo_id, created_at').order('created_at', { ascending: false });
    if (!voteData) { setVotes([]); return; }
    const voterIds = [...new Set(voteData.map(v => v.voter_id))];
    const photoIds = [...new Set(voteData.map(v => v.photo_id))];
    const [profilesRes, photosRes] = await Promise.all([
      voterIds.length ? supabase.from('profiles').select('id, prenom, nom, classe').in('id', voterIds) : Promise.resolve({ data: [] }),
      photoIds.length ? supabase.from('contest_photos').select('id, titre, tag_id').in('id', photoIds) : Promise.resolve({ data: [] }),
    ]);
    const pMap = new Map(((profilesRes.data as { id: string; prenom: string; nom: string; classe: string }[]) || []).map(p => [p.id, p]));
    const phMap = new Map(((photosRes.data as { id: string; titre: string; tag_id: string | null }[]) || []).map(p => [p.id, p]));
    setVotes(voteData.map(v => ({
      ...v,
      voter: pMap.get(v.voter_id) ? { prenom: pMap.get(v.voter_id)!.prenom, nom: pMap.get(v.voter_id)!.nom, classe: pMap.get(v.voter_id)!.classe } : undefined,
      photo: phMap.get(v.photo_id) ? { titre: phMap.get(v.photo_id)!.titre, tag_id: phMap.get(v.photo_id)!.tag_id } : undefined,
    })));
  };

  useEffect(() => { if (section === 'moderation') { fetchPhotos(); fetchTags(); } }, [section, moderationStatus]);
  useEffect(() => { if (section === 'settings') fetchSettings(); }, [section]);
  useEffect(() => { if (section === 'tags') fetchTags(); }, [section]);
  useEffect(() => { if (section === 'votes') { fetchVotes(); fetchTags(); } }, [section]);

  const updatePhotoTag = async (photoId: string, newTagId: string) => {
    const { error } = await supabase.from('contest_photos').update({ tag_id: newTagId } as never).eq('id', photoId);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    fetchPhotos();
    toast({ title: 'Catégorie mise à jour' });
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    const { error } = await supabase.from('contest_tags' as never).insert({ label: newTag.trim() } as never);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    setNewTag('');
    fetchTags();
  };

  const removeTag = async (id: string) => {
    if (!confirm('Supprimer ce tag ? Les photos associées perdront leur catégorie.')) return;
    const { error } = await supabase.from('contest_tags' as never).delete().eq('id', id);
    if (error) { toast({ title: 'Erreur', description: error.message, variant: 'destructive' }); return; }
    fetchTags();
  };

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

  const deletePhoto = async (id: string) => {
    const { error } = await supabase.from('contest_photos').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }
    fetchPhotos();
    toast({ title: 'Photo supprimée' });
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
      votes_visibles: settings.votes_visibles,
    } as never).eq('id', settings.id);
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
    ...(role === 'super_admin' ? [
      { key: 'tags' as const, label: `Catégories (${tags.length})` },
      { key: 'settings' as const, label: 'Paramètres concours' },
    ] : []),
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
            <div className="flex gap-2">
              {[
                { key: 'en_attente' as const, label: 'En attente' },
                { key: 'validee' as const, label: 'Validées' },
              ].map((status) => (
                <button
                  key={status.key}
                  onClick={() => setModerationStatus(status.key)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    moderationStatus === status.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>
            ) : photos.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
                <CheckCircle size={48} className="mb-3 text-primary/30" />
                <p className="font-semibold">{moderationStatus === 'en_attente' ? 'Aucune photo en attente' : 'Aucune photo validée'}</p>
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
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
                  <select
                    value={p.tag_id || ''}
                    onChange={e => updatePhotoTag(p.id, e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— Aucune —</option>
                    {tags.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>

                {moderationStatus === 'en_attente' ? (
                  <>
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
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="w-full gap-1 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => deletePhoto(p.id)}>
                    <Trash2 size={14} /> Supprimer
                  </Button>
                )}
              </div>
            ))}
          </>
        )}

        {/* Tags management */}
        {section === 'tags' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3">
              <h2 className="font-display text-base font-bold">Catégories disponibles</h2>
              <div className="space-y-2">
                {tags.map(t => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <span className="flex-1 text-sm">{t.label}</span>
                    <button onClick={() => removeTag(t.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {tags.length === 0 && <p className="text-xs text-muted-foreground">Aucune catégorie</p>}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Nouvelle catégorie…" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} className="flex-1" />
                <Button type="button" size="sm" variant="outline" onClick={addTag}>Ajouter</Button>
              </div>
            </div>
          </div>
        )}

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
