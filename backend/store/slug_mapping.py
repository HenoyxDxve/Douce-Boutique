"""
Mapping entre les slugs du frontend et les noms de produits réels
"""

SLUG_TO_PRODUCT_NAME = {
    'robe-fleurie-1': 'Robe Florale Élégante',
    'blouse-soie-1': 'Blouse en Soie Satinée',
    'pantalon-tailleur-1': 'Pantalon Tailleur Chic',
    'sac-cuir-1': 'Sac à Main Cuir Premium',
    'escarpins-1': 'Escarpins Nude Classiques',
    'collier-or-1': 'Collier Or Délicat',
    'robe-cocktail-1': 'Robe Florale Élégante',  # Fallback
    'sandales-dorees-1': 'Sac à Main Cuir Premium',  # Fallback
}

def get_product_by_slug_or_id(produit_id):
    """Récupère un produit par UUID ou slug"""
    from .models import Produit
    import uuid
    
    # Essayer d'abord comme UUID
    try:
        return Produit.objects.get(id=produit_id)
    except (Produit.DoesNotExist, ValueError):
        pass
    
    # Essayer comme slug
    if produit_id in SLUG_TO_PRODUCT_NAME:
        nom = SLUG_TO_PRODUCT_NAME[produit_id]
        try:
            return Produit.objects.get(nom=nom)
        except Produit.DoesNotExist:
            pass
    
    return None
