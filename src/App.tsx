import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PanierProvider } from "@/contexts/PanierContext";
import { ProviderAuth } from "@/contexts/AuthContext";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Accueil from "./pages/Accueil";
import Catalogue from "./pages/Catalogue";
import PageProduit from "./pages/PageProduit";
import Panier from "./pages/Panier";
import Promotions from "./pages/Promotions";
import Nouveautes from "./pages/Nouveautes";
import Compte from "./pages/Compte";
import Connexion from "./pages/Connexion";
import Inscription from "./pages/Inscription";
import MotDePasseOublie from "./pages/MotDePasseOublie";
import Favoris from "./pages/Favoris";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminUtilisateurs from "./pages/admin/AdminUtilisateurs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ProviderAuth>
        <PanierProvider>
          <Toaster />
          <Sonner position="top-center" richColors />
          <BrowserRouter>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Accueil />} />
                  <Route path="/catalogue" element={<Catalogue />} />
                  <Route path="/produit/:id" element={<PageProduit />} />
                  <Route path="/panier" element={<Panier />} />
                  <Route path="/promotions" element={<Promotions />} />
                  <Route path="/nouveautes" element={<Nouveautes />} />
                  <Route path="/compte" element={<Compte />} />
                  <Route path="/connexion" element={<Connexion />} />
                  <Route path="/inscription" element={<Inscription />} />
                  <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
                  <Route path="/favoris" element={<Favoris />} />
                  <Route path="/admin/dashboard/*" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="utilisateurs" element={<AdminUtilisateurs />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </BrowserRouter>
        </PanierProvider>
      </ProviderAuth>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;