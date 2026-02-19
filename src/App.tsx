import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/ThemeProvider";

import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Clothes mode
import ClothesHome from "./pages/clothes/ClothesHome";
import SearchPage from "./pages/clothes/SearchPage";
import SellPage from "./pages/clothes/SellPage";
import ListingDetailPage from "./pages/clothes/ListingDetailPage";
import MyListingsPage from "./pages/clothes/MyListingsPage";
import ProfilePage from "./pages/clothes/ProfilePage";
import AdminPage from "./pages/clothes/AdminPage";

// Photo contest mode
import PhotoHome from "./pages/photo/PhotoHome";
import PhotoGallery from "./pages/photo/PhotoGallery";
import PhotoSubmit from "./pages/photo/PhotoSubmit";
import PhotoVote from "./pages/photo/PhotoVote";
import PhotoAdmin from "./pages/photo/PhotoAdmin";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />

              {/* Clothes mode */}
              <Route path="/app" element={<ProtectedRoute><ClothesHome /></ProtectedRoute>} />
              <Route path="/app/rechercher" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/app/vendre" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
              <Route path="/app/annonce/:id" element={<ProtectedRoute><ListingDetailPage /></ProtectedRoute>} />
              <Route path="/app/mes-annonces" element={<ProtectedRoute><MyListingsPage /></ProtectedRoute>} />
              <Route path="/app/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/app/admin" element={<ProtectedRoute requireRole="moderateur"><AdminPage /></ProtectedRoute>} />

              {/* Photo contest mode */}
              <Route path="/photo" element={<ProtectedRoute><PhotoHome /></ProtectedRoute>} />
              <Route path="/photo/galerie" element={<ProtectedRoute><PhotoGallery /></ProtectedRoute>} />
              <Route path="/photo/soumettre" element={<ProtectedRoute><PhotoSubmit /></ProtectedRoute>} />
              <Route path="/photo/voter" element={<ProtectedRoute><PhotoVote /></ProtectedRoute>} />
              <Route path="/photo/admin" element={<ProtectedRoute requireRole="moderateur"><PhotoAdmin /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

