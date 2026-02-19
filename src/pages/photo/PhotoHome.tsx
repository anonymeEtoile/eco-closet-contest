import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import ModeFab from '@/components/ModeFab';
import ThemeToggle from '@/components/ThemeToggle';
import { Camera, Trophy, Calendar, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';



interface ContestSettings {
  titre: string;
  description: string;
  theme: string;
  date_limite: string | null;
  recompenses: string | null;
  votes_actifs: boolean;
  classement_public: boolean;
}

const PhotoHome: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<ContestSettings | null>(null);

  useEffect(() => {
    supabase.from('contest_settings').select('*').single().then(({ data }) => {
      if (data) setSettings(data as ContestSettings);
    });
  }, []);

  return (
    <div className="mode-photo flex min-h-screen flex-col bg-background pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden px-6 pb-12 pt-safe" style={{ background: 'linear-gradient(135deg, hsl(150 15% 8%), hsl(120 25% 14%))' }}>
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full" style={{ background: 'radial-gradient(circle, hsl(120 40% 45% / 0.12), transparent 70%)' }} />
        <div className="mb-4 flex items-center gap-2">
          <Leaf size={20} className="text-primary" />
          <span className="text-sm font-medium text-foreground/70">Lycée Marie Madeleine Fourcade</span>
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight text-foreground">
          {settings?.titre || 'Concours Photo Nature'}
        </h1>
        {settings?.theme && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            🌿 Thème : {settings.theme}
          </p>
        )}
        <p className="mt-4 text-sm leading-relaxed text-foreground/60">
          {settings?.description}
        </p>
      </div>

      {/* Info cards */}
      <div className="px-4 py-4 space-y-3">
        {settings?.date_limite && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Calendar size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date limite</p>
              <p className="font-medium text-foreground">
                {format(new Date(settings.date_limite), 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
          </div>
        )}
        {settings?.recompenses && (
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <Trophy size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Récompenses</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{settings.recompenses}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button className="gap-2 py-5" onClick={() => navigate('/photo/soumettre')}>
            <Camera size={18} /> Ma photo
          </Button>
          <Button variant="outline" className="gap-2 py-5 border-primary/30 text-primary hover:bg-primary/10" onClick={() => navigate('/photo/galerie')}>
            Voir la galerie
          </Button>
        </div>
      </div>

      <BottomNav mode="photo" />
      <ModeFab />
    </div>
  );
};

export default PhotoHome;
