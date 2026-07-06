const NOM_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,100}$/;

export function validerNom(valeur: string): string | null {
  if (!NOM_REGEX.test(valeur.trim())) {
    return 'Ne doit contenir que des lettres';
  }
  return null;
}

export function validerTelephoneIvoirien(valeur: string): string | null {
  const nettoye = valeur.replace(/[\s.-]/g, '').replace(/^(\+225|00225|225)/, '');
  if (!/^0[0-9]{9}$/.test(nettoye)) {
    return 'Numéro ivoirien invalide (10 chiffres, ex : 07 08 11 22 33)';
  }
  return null;
}

export function validerForceMotDePasse(valeur: string): string | null {
  if (valeur.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères';
  if (!/[A-Z]/.test(valeur)) return 'Le mot de passe doit contenir au moins une majuscule';
  if (!/[0-9]/.test(valeur)) return 'Le mot de passe doit contenir au moins un chiffre';
  return null;
}
