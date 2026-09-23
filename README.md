# Alliance Power Tracker

Un outil de suivi hebdomadaire pour les alliés, avec :
- mot de passe hebdomadaire partagé par le chef d’alliance ;
- connexion des joueurs ;
- sélection de pseudo dans une liste déroulante ;
- création d’un nouveau membre avec validation par e-mail ;
- ajout d’une case “T11” ;
- historique des mises à jour ;
- statistiques et graphiques d’évolution ;
- synchronisation avec un Google Sheet.

## Stack

- Node.js + Express
- EJS templates
- Google Sheets API
- Nodemailer pour les codes d’inscription et le mot de passe hebdomadaire
- Chart.js côté front pour les graphiques

## Pré-requis

1. Un compte Google Cloud avec un service account activé.
2. Une feuille Google Sheets partagée avec le service account.
3. Un compte SMTP actif pour l’envoi des messages.
4. Node.js installé.

## Configuration

1. Crée un fichier `.env` à partir de `.env.example`.
2. Remplis les variables Google Sheets.
3. Le document Google Sheet doit contenir 4 onglets :
   - `Members`
   - `History`
   - `PendingMembers`
   - `Config`
4. Ajoute le service account Google à la feuille avec les droits d’édition.
5. Installe les dépendances :

```bash
npm install
```

6. Lance le projet :

```bash
npm start
```

## Structure du site

### Connexion hebdomadaire

Le mot de passe hebdomadaire est vérifié à partir de la feuille `Config`.

### Table d’administration

Les alliés connectés peuvent :
- filtrer les joueurs ;
- choisir leur pseudo ;
- modifier Tank / Avion / Missile ;
- cocher la case T11 ;
- enregistrer leurs données.

### Historique

À chaque validation, une ligne est ajoutée dans `History`.

### Graphiques

Le tableau de bord affiche :
- l’évolution individuelle d’un joueur ;
- le classement général ;
- la comparaison de la puissance totale.

## Google Sheets

La feuille cible doit être accessible avec l’API Google Sheets.

### Exemples de colonnes

#### `Members`

- PSEUDO
- EMAIL
- TANK
- AVION
- MISSILE
- TOTAL
- T11
- LAST_UPDATED
- CREATED_AT

#### `History`

- DATE
- PSEUDO
- TANK
- AVION
- MISSILE
- TOTAL
- T11

#### `PendingMembers`

- PSEUDO
- EMAIL
- CODE
- EXPIRES_AT
- CREATED_AT
- USED

#### `Config`

- KEY
- VALUE

## Rotation du mot de passe

Le mot de passe est changé automatiquement chaque dimanche à 4h, heure de Paris, grâce à `node-cron`.

## Sécurité

Le code d’inscription est envoyé par e-mail avec un délai de 15 minutes maximum.

Le mot de passe hebdomadaire ne doit pas être exposé en clair dans le code ; il est conseillé de le gérer via les variables d’environnement et la feuille `Config`.

## Démarrage rapide

```bash
cp .env.example .env
npm install
npm start
```

Ensuite ouvrez :

```text
http://localhost:3000/login
```

## Prochaines améliorations possibles

- ajout d’un rôle admin séparé ;
- écriture globale des joueurs dans un tableau public après connexion ;
- export CSV ;
- gestion plus stricte des droits d’accès selon le rôle.
