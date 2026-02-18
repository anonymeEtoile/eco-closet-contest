import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, List, User, Shield } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS_ELEVE = [
  { path: '/app', icon: Home, label: 'Accueil' },
  { path: '/app/rechercher', icon: Search, label: 'Rechercher' },
  { path: '/app/vendre', icon: PlusSquare, label: 'Vendre' },
  { path: '/app/mes-annonces', icon: List, label: 'Mes annonces' },
  { path: '/app/profil', icon: User, label: 'Profil' },
];

const NAV_ITEMS_PHOTO = [
  { path: '/photo', icon: Home, label: 'Accueil' },
  { path: '/photo/soumettre', icon: PlusSquare, label: 'Ajouter' },
  { path: '/photo/galerie', icon: List, label: 'Galerie' },
  { path: '/photo/voter', icon: Search, label: 'Voter' },
];

interface BottomNavProps {
  mode?: 'vente' | 'photo';
}

const BottomNav: React.FC<BottomNavProps> = ({ mode = 'vente' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useApp();

  const isMod = role === 'moderateur' || role === 'super_admin';

  const items = mode === 'vente'
    ? isMod
      ? [...NAV_ITEMS_ELEVE, { path: '/app/admin', icon: Shield, label: 'Admin' }]
      : NAV_ITEMS_ELEVE
    : isMod
      ? [...NAV_ITEMS_PHOTO, { path: '/photo/admin', icon: Shield, label: 'Admin' }]
      : NAV_ITEMS_PHOTO;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-40 border-t safe-bottom",
      mode === 'photo'
        ? "border-border bg-card/95 backdrop-blur-md"
        : "border-border bg-card/95 backdrop-blur-md"
    )}>
      <div className="flex items-stretch justify-around">
        {items.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || (path !== '/app' && path !== '/photo' && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={cn(
                  "transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-normal")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
