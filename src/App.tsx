import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PanierProvider } from "@/contexts/PanierContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Accueil from "./pages/Accueil";
import Catalogue from "./pages/Catalogue";
import PageProduit from "./pages/PageProduit";
import Panier from "./pages/Panier";
import Promotions from "./pages/Promotions";
import Nouveautes from "./pages/Nouveautes";
import Compte from "./pages/Compte";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </PanierProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
