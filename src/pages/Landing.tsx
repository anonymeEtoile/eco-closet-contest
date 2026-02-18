import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Recycle, Calendar, MapPin, ArrowRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventSettings {
  presentation_text: string;
  semaine_collecte_start: string | null;
  semaine_collecte_end: string | null;
  point_collecte_date: string | null;
  lieux_depot: string[];
}

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [settings, setSettings] = useState<EventSettings | null>(null);

  useEffect(() => {
    if (user) navigate('/app');
  }, [user, navigate]);

  useEffect(() => {
    supabase.from('event_settings').select('*').single().then(({ data }) => {
      if (data) setSettings(data as EventSettings);
    });
  }, []);

  const formatDate = (d: string | null) => {
    if (!d) return null;
    try {
      return format(new Date(d), 'd MMMM yyyy', { locale: fr });
    } catch { return d; }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero px-6 pb-16 pt-16 text-primary-foreground">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-foreground/5" />
        <div className="pointer-events-none absolute -left-8 bottom-0 h-48 w-48 rounded-full bg-primary-foreground/5" />

        <div className="relative mx-auto max-w-lg">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/15">
              <Recycle size={22} className="text-primary-foreground" />
            </div>
            <span className="text-sm font-medium opacity-90">Éco-délégués</span>
          </div>

          <h1 className="font-display mb-3 text-4xl font-bold leading-tight">
            Lycée Marie Madeleine Fourcade
          </h1>
          <p className="mb-2 text-lg font-medium opacity-90">
            Vente &amp; Don de Vêtements
          </p>
          <p className="text-sm leading-relaxed opacity-75">
            {settings?.presentation_text || 'Les éco-délégués organisent une collecte de vêtements solidaire. Donnez une seconde vie à vos vêtements !'}
          </p>
        </div>
      </section>

      {/* Info cards */}
      <section className="px-6 py-6">
        <div className="mx-auto max-w-lg space-y-3">
          {settings?.semaine_collecte_start && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Calendar size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Semaine de collecte</p>
                <p className="mt-0.5 font-medium text-foreground">
                  {formatDate(settings.semaine_collecte_start)}
                  {settings.semaine_collecte_end && ` → ${formatDate(settings.semaine_collecte_end)}`}
                </p>
              </div>
            </div>
          )}

          {settings?.point_collecte_date && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-terracotta/10">
                <Leaf size={18} className="text-terracotta" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Point de collecte</p>
                <p className="mt-0.5 font-medium text-foreground">{formatDate(settings.point_collecte_date)}</p>
              </div>
            </div>
          )}

          {settings?.lieux_depot && settings.lieux_depot.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sage-light/50">
                <MapPin size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Lieux de dépôt</p>
                <ul className="mt-0.5 space-y-0.5">
                  {settings.lieux_depot.map((lieu, i) => (
                    <li key={i} className="font-medium text-foreground">{lieu}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-lg space-y-3">
          <Button
            className="w-full gap-2 py-6 text-base font-semibold"
            onClick={() => navigate('/auth')}
          >
            Se connecter
            <ArrowRight size={18} />
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 py-6 text-base"
            onClick={() => navigate('/auth?tab=signup')}
          >
            Créer un compte élève
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
