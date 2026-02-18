import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Camera, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ModeFab: React.FC = () => {
  const { mode, setMode } = useApp();
  const navigate = useNavigate();

  const toggleMode = () => {
    const next = mode === 'vente' ? 'photo' : 'vente';
    setMode(next);
    navigate(next === 'vente' ? '/app' : '/photo');
  };

  return (
    <button
      onClick={toggleMode}
      className={cn(
        "fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 shadow-sage-lg",
        "text-sm font-semibold transition-all duration-300 active:scale-95",
        mode === 'vente'
          ? "bg-primary text-primary-foreground"
          : "bg-primary text-primary-foreground"
      )}
      title={mode === 'vente' ? 'Concours Photo' : 'Vente de vêtements'}
    >
      {mode === 'vente' ? (
        <>
          <Camera size={18} />
          <span className="hidden sm:inline">Concours Photo</span>
        </>
      ) : (
        <>
          <ShoppingBag size={18} />
          <span className="hidden sm:inline">Vente</span>
        </>
      )}
    </button>
  );
};

export default ModeFab;
