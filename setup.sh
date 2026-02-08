#!/bin/bash

# Script de démarrage pour Douce Boutique E-commerce

echo ""
echo "========================================"
echo "  Douce Boutique - E-commerce Platform"
echo "========================================"
echo ""

# Vérifier si Python est installé
if ! command -v python3 &> /dev/null; then
    echo "Erreur: Python 3 n'est pas installé"
    exit 1
fi

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Erreur: Node.js n'est pas installé"
    exit 1
fi

echo "[1/6] Installation des dépendances frontend..."
npm install
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'installation des dépendances frontend"
    exit 1
fi

echo ""
echo "[2/6] Création de l'environnement virtuel Python..."
cd backend
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "Erreur lors de la création de l'environnement virtuel"
    exit 1
fi

echo ""
echo "[3/6] Activation de l'environnement virtuel et installation des dépendances..."
source venv/bin/activate
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'installation des dépendances backend"
    exit 1
fi

echo ""
echo "[4/6] Création du fichier .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Fichier .env créé. Veuillez le modifier si nécessaire."
fi

echo ""
echo "[5/6] Application des migrations Django..."
python manage.py migrate
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'application des migrations"
    exit 1
fi

echo ""
echo "[6/6] Création des données de base..."
python init_db.py

echo ""
echo "========================================"
echo "Installation terminée avec succès!"
echo "========================================"
echo ""
echo "Pour démarrer le projet:"
echo ""
echo "1. Ouvrez un terminal dans le dossier backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "2. Ouvrez un autre terminal à la racine du projet:"
echo "   npm run dev"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"
echo "Admin: http://localhost:8000/admin"
echo ""
echo "Identifiants de test:"
echo "Email: admin@douceboutique.fr"
echo "Mot de passe: Admin@12345"
echo ""
