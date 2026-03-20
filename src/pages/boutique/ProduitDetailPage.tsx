import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import BoutiqueLayout from "@/components/BoutiqueLayout";

export default function ProduitDetailPage() {
  const { produitId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Détail produit</h2>
        <p className="text-gray-500 mt-2">Produit #{produitId}</p>
        <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 text-pink-600 font-semibold mx-auto">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
      </div>
    </div>
  );
}
