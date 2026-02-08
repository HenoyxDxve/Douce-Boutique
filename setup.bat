@echo off
REM Script de démarrage pour Douce Boutique E-commerce

echo.
echo ========================================
echo  Douce Boutique - E-commerce Platform
echo ========================================
echo.

REM Vérifier si Python est installé
python --version >nul 2>&1
if errorlevel 1 (
    echo Erreur: Python n'est pas installé ou non présent dans le PATH
    pause
    exit /b 1
)

REM Vérifier si Node.js est installé
node --version >nul 2>&1
if errorlevel 1 (
    echo Erreur: Node.js n'est pas installé ou non présent dans le PATH
    pause
    exit /b 1
)

echo [1/6] Installation des dépendances frontend...
call npm install
if errorlevel 1 (
    echo Erreur lors de l'installation des dépendances frontend
    pause
    exit /b 1
)

echo.
echo [2/6] Création de l'environnement virtuel Python...
cd backend
python -m venv venv
if errorlevel 1 (
    echo Erreur lors de la création de l'environnement virtuel
    pause
    exit /b 1
)

echo.
echo [3/6] Activation de l'environnement virtuel et installation des dépendances...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo Erreur lors de l'installation des dépendances backend
    pause
    exit /b 1
)

echo.
echo [4/6] Création du fichier .env...
if not exist .env (
    copy .env.example .env
    echo Fichier .env créé. Veuillez le modifier si nécessaire.
)

echo.
echo [5/6] Application des migrations Django...
python manage.py migrate
if errorlevel 1 (
    echo Erreur lors de l'application des migrations
    pause
    exit /b 1
)

echo.
echo [6/6] Création des données de base...
python init_db.py

echo.
echo ========================================
echo Installation terminée avec succès!
echo ========================================
echo.
echo Pour démarrer le projet:
echo.
echo 1. Ouvrez un terminal dans le dossier backend:
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python manage.py runserver
echo.
echo 2. Ouvrez un autre terminal à la racine du projet:
echo    npm run dev
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
echo Admin: http://localhost:8000/admin
echo.
echo Identifiants de test:
echo Email: admin@douceboutique.fr
echo Mot de passe: Admin@12345
echo.
pause
