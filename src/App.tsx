import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PanierProvider } from "@/contexts/PanierContext";
import { ProviderAuth } from "@/contexts/AuthContext";
import { FavorisProvider } from "@/contexts/FavorisContext";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BoutonWhatsApp from "@/components/BoutonWhatsApp";
import Accueil from "./pages/Accueil";
import Catalogue from "./pages/Catalogue";
import PageProduit from "./pages/PageProduit";
import Panier from "./pages/Panier";
import Commande from "./pages/Commande";
import Confirmation from "./pages/Confirmation";
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
import AdminCommandes from "./pages/admin/AdminCommandes";
import AdminProduits from "./pages/admin/AdminProduits";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminRapports from "./pages/admin/AdminRapports";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminParametresPaiement from "./pages/admin/AdminParametresPaiement";
import DesinscriptionNewsletter from "./pages/DesinscriptionNewsletter";

const queryClient = new QueryClient();

const AppLayout = () => {
  const location = useLocation();
  const estAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!estAdminRoute && <Header />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/produit/:id" element={<PageProduit />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/commande" element={<Commande />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/nouveautes" element={<Nouveautes />} />
          <Route path="/compte" element={<Compte />} />
          <Route path="/connexion" element={<Connexion />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
          <Route path="/reinitialiser-mot-de-passe" element={<MotDePasseOublie />} />
          <Route path="/favoris" element={<Favoris />} />
          <Route path="/newsletter/desinscription" element={<DesinscriptionNewsletter />} />
          <Route
            path="/admin/dashboard/*"
            element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="produits" element={<AdminProduits />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="utilisateurs" element={<AdminUtilisateurs />} />
            <Route path="commandes" element={<AdminCommandes />} />
            <Route path="parametres-paiement" element={<AdminParametresPaiement />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
            <Route path="rapports" element={<AdminRapports />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!estAdminRoute && <Footer />}
      {!estAdminRoute && <BoutonWhatsApp />}
    </div>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProviderAuth>
          <FavorisProvider>
            <PanierProvider>
              <Toaster />
              <Sonner position="top-center" richColors />
              <BrowserRouter>
                <AppLayout />
              </BrowserRouter>
            </PanierProvider>
          </FavorisProvider>
        </ProviderAuth>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
