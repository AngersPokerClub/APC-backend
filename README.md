# 🃏 APC Tournament — Gestion de Tournois Poker

![Next.js](https://img.shields.io/badge/Next.js-15.2.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)
![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748?logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1?logo=mysql)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?logo=vercel)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

> Application de gestion de tournois poker pour l'**Angers Poker Club**. Gère les tournois APT, Sit&Go, Superfinale, Spéciaux et SoliPoker avec répartition automatique des tables, rééquilibrage intelligent, niveaux/blinds en temps réel, et classement final.

---

## 📋 Table des Matières

1. [🚀 Quick Start (5 min)](#-quick-start-5-min)
2. [🏗️ Architecture](#️-architecture)
3. [📁 Structure des Fichiers](#-structure-des-fichiers)
4. [🗄️ Base de Données](#️-base-de-données)
5. [🔧 Déploiement](#-déploiement)
6. [⚙️ Configuration](#️-configuration)
7. [🐛 Debug & Logs](#-debug--logs)
8. [👥 Rôles & Auth](#-rôles--auth)
9. [📱 Pages & Features](#-pages--features)
10. [📈 Performances](#-performances)
11. [🔄 Maintenance](#-maintenance)
12. [🤝 Support & Contact](#-support--contact)

---

## 🚀 Quick Start (5 min)

### Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9
- Accès à la **base de données MySQL** (Hostinger)

### Installation Copier-Coller

```bash
# 1. Cloner le projet
git clone <URL_DU_REPO> apc-tournament
cd apc-tournament

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
# Copier le bloc ci-dessous dans un fichier .env à la racine
# (voir section Configuration pour les valeurs)

# 4. Générer le client Prisma
npx prisma generate

# 5. Lancer en développement
npm run dev
```

L'application est accessible sur **http://localhost:3000**.

### Commandes Disponibles

| Commande              | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `npm run dev`         | Lancer le serveur de développement                      |
| `npm run build`       | Build de production (`prisma generate` + `next build`)  |
| `npm run start`       | Lancer le serveur de production                         |
| `npm run lint`        | Vérifier le code avec ESLint                            |
| `npm run lint:fix`    | Corriger automatiquement les erreurs de lint            |
| `npx prisma studio`   | Ouvrir l'interface graphique pour voir/éditer la BDD    |
| `npx prisma db pull`  | Synchroniser le schéma Prisma depuis la BDD existante   |
| `npx prisma generate` | Regénérer le client Prisma après modification du schéma |

---

## 🏗️ Architecture

### Vue d'ensemble

```mermaid
graph TB
    subgraph Client["🖥️ Client (Navigateur)"]
        Pages["Pages React (App Router)"]
        Hooks["Hooks TanStack Query"]
        Context["TournamentContext"]
    end

    subgraph NextJS["⚡ Next.js 15 (Serveur)"]
        AppRouter["App Router"]
        API["API Routes (/api/*)"]
        Middleware["Middleware Auth"]
    end

    subgraph Data["🗄️ Data Layer"]
        Prisma["Prisma ORM 6.7"]
        Adapters["Adapters (sérialisation)"]
    end

    subgraph DB["💾 Base de Données"]
        MySQL["MySQL (Hostinger)"]
        WP["Tables WordPress (wp_users)"]
    end

    subgraph External["🌐 Externe"]
        WordPress["WordPress (angers-poker-club.fr)"]
        Vercel["Vercel (Hébergement)"]
    end

    Pages --> Hooks
    Hooks -->|fetch + polling| API
    Context --> Pages
    AppRouter --> Pages
    AppRouter --> API
    Middleware --> AppRouter
    API --> Prisma
    Prisma --> Adapters
    Adapters --> API
    Prisma --> MySQL
    MySQL --- WP
    WordPress -->|Sync tournois/users| API
    NextJS --> Vercel
```

### Stack Technique

| Couche          | Technologie                               | Rôle                                 |
| --------------- | ----------------------------------------- | ------------------------------------ |
| **Frontend**    | React 19 + Next.js 15 (App Router)        | UI + Routing                         |
| **UI Kit**      | HeroUI (ex-NextUI) v2.7                   | Composants prêts à l'emploi          |
| **Styling**     | Tailwind CSS 3.4 + Satoshi Font           | Design system                        |
| **State**       | TanStack React Query v5                   | Fetching, cache, polling             |
| **Context**     | React Context (TournamentProvider)        | Données tournoi partagées            |
| **Animations**  | Framer Motion 12                          | Transitions et animations            |
| **Drag & Drop** | @dnd-kit                                  | Réorganisation des tables            |
| **Dates**       | Luxon 3                                   | Manipulation dates/heures + timezone |
| **ORM**         | Prisma 6.7                                | Accès base de données                |
| **BDD**         | MySQL (Hostinger)                         | Stockage des données                 |
| **Déploiement** | Vercel                                    | Hébergement + CI/CD                  |
| **Auth**        | WordPress JWT (désactivé, via middleware) | Authentification admin               |

### Flux Données Temps Réel (Polling)

L'application utilise du **polling** via TanStack Query pour les mises à jour en temps réel :

- **Dashboard admin** → polling toutes les **60 secondes** (via `refetchInterval`)
- **Page Game (affichage public)** → polling toutes les **5 secondes** (timer, blinds, éliminations)
- Les données transitent via le hook `useTournamentData` → API `/api/tournament/[id]/details`

---

## 📁 Structure des Fichiers

```
apc-tournament/
├── prisma/
│   └── schema.prisma          # Schéma BDD (30+ modèles)
├── public/
│   └── images/                # Assets statiques (logos, fonds)
├── src/
│   ├── app/
│   │   ├── (withSidebar)/     # Pages avec barre latérale (admin)
│   │   │   ├── _shared/       # Composants partagés entre catégories
│   │   │   │   └── tournament/
│   │   │   │       ├── tabs/  # Onglets : Général, Niveaux, Joueurs, Tables, Jetons
│   │   │   │       ├── dashboard/     # Page dashboard admin
│   │   │   │       └── edit-rankings/ # Édition classement post-tournoi
│   │   │   ├── apt/           # Champions APT
│   │   │   ├── sitandgo/      # Tournois Sit&Go
│   │   │   ├── superfinale/   # Super Finales
│   │   │   ├── special/       # Tournois Spéciaux
│   │   │   ├── solipoker/     # SoliPoker (3 jours)
│   │   │   ├── malette/       # Gestion des stacks/malettes
│   │   │   ├── season/        # Gestion des saisons
│   │   │   └── layout.tsx     # Layout commun (sidebar + contenu)
│   │   │
│   │   ├── (withoutSidebar)/  # Pages sans sidebar (affichage public)
│   │   │   ├── game/[id]/     # 📺 DISPLAY TEMPS RÉEL (blinds, timer, tables)
│   │   │   └── showTableFullScreen/ # Table plein écran
│   │   │
│   │   ├── api/               # API Routes (Next.js Route Handlers)
│   │   │   ├── tournament/[id]/
│   │   │   │   ├── route.ts                  # GET tournoi complet
│   │   │   │   ├── details/route.ts          # GET données détaillées
│   │   │   │   ├── status/route.ts           # PATCH status
│   │   │   │   ├── end/route.ts              # PATCH fin de tournoi
│   │   │   │   ├── pause/route.ts            # PATCH toggle pause
│   │   │   │   ├── backgrounds/route.ts      # PUT background images
│   │   │   │   ├── day2-stack/route.ts       # GET stack moyen Day2 SoliPoker
│   │   │   │   ├── level/
│   │   │   │   │   ├── route.ts              # CRUD niveaux
│   │   │   │   │   └── generate/route.ts     # POST génération auto niveaux
│   │   │   │   ├── player/
│   │   │   │   │   ├── route.ts              # POST inscription joueur
│   │   │   │   │   └── [playerId]/
│   │   │   │   │       ├── elimination/route.ts       # POST élimination
│   │   │   │   │       ├── cancelElimination/route.ts # POST annuler élimination
│   │   │   │   │       └── status/route.ts            # PATCH statut joueur
│   │   │   │   ├── table/
│   │   │   │   │   ├── route.ts              # CRUD tables
│   │   │   │   │   └── move/route.ts         # POST déplacer joueur
│   │   │   │   ├── table_assignement/
│   │   │   │   │   ├── route.ts              # GET assignations
│   │   │   │   │   ├── generate/route.ts     # POST générer tables + places
│   │   │   │   │   └── regenerate/route.ts   # POST regénérer (rééquilibrage)
│   │   │   │   └── update-rankings/route.ts  # PUT édition classement
│   │   │   ├── tournaments/route.ts          # GET liste tous tournois
│   │   │   ├── users/route.ts                # GET liste utilisateurs WordPress
│   │   │   ├── sync-wordpress-tournament/    # Sync depuis WordPress
│   │   │   ├── seasons/                      # CRUD saisons
│   │   │   ├── stack/                        # CRUD stacks/malettes
│   │   │   ├── chip/                         # CRUD jetons
│   │   │   └── images/                       # Gestion images
│   │   │
│   │   ├── components/        # Composants UI réutilisables
│   │   │   ├── sideBar.tsx    # Barre latérale navigation
│   │   │   ├── button.tsx     # Bouton custom
│   │   │   ├── popup.tsx      # Modale/popup
│   │   │   ├── tabBar.tsx     # Barre d'onglets
│   │   │   ├── infoItem.tsx   # Bloc d'info
│   │   │   ├── chipLegend.tsx # Légende des jetons
│   │   │   ├── form/          # Composants de formulaire
│   │   │   ├── table/         # Composants d'affichage table poker
│   │   │   └── tournament-mobile-cards.tsx
│   │   │
│   │   ├── hook/              # 31 hooks custom (TanStack Query)
│   │   │   ├── useTournamentData.ts     # ⭐ Chargement données tournoi
│   │   │   ├── useTournamentsData.ts    # Liste tous les tournois
│   │   │   ├── useGenerateTables.ts     # Génération tables
│   │   │   ├── useEliminatePlayer.ts    # Élimination joueur
│   │   │   ├── useMovePlayer.ts         # Déplacement joueur
│   │   │   ├── useLaunchTournament.ts   # Lancement tournoi
│   │   │   ├── useEndTournament.ts      # Fin tournoi
│   │   │   ├── useTogglePause.ts        # Pause/reprise
│   │   │   ├── useUpdateRankings.ts     # Mise à jour classement
│   │   │   └── ... (22 autres hooks)
│   │   │
│   │   ├── types/             # 17 fichiers de types TypeScript
│   │   ├── utils/             # Utilitaires
│   │   │   ├── reequilibrate.ts    # ⭐ ALGORITHME RÉÉQUILIBRAGE (565 lignes)
│   │   │   ├── date.ts             # Helpers dates
│   │   │   ├── api-params.ts       # Extraction params API
│   │   │   └── serializeBigInt.ts  # Sérialisation BigInt → JSON
│   │   │
│   │   ├── providers/
│   │   │   ├── TournamentContextProvider.tsx  # Context React pour tournoi
│   │   │   └── NotificationProvider.tsx       # Snackbar / notifications
│   │   │
│   │   ├── constants/string.ts  # Textes UI (sidebar, labels, statuts)
│   │   ├── lib/adapter/          # Adapteurs Prisma → Frontend
│   │   │   ├── tournament.adapter.ts
│   │   │   ├── tournament_level.adapter.ts
│   │   │   ├── tournament_table.adapter.ts
│   │   │   ├── quarter_ranking.adapter.ts
│   │   │   └── season.adapter.ts
│   │   │
│   │   ├── error/             # Pages d'erreur
│   │   ├── globals.css        # Styles globaux
│   │   ├── layout.tsx         # Layout racine (providers)
│   │   └── page.tsx           # Page d'accueil
│   │
│   ├── generated/prisma/      # Client Prisma auto-généré (NE PAS MODIFIER)
│   ├── lib/prisma.ts          # ⭐ Instance Prisma + middleware perf
│   ├── middleware.ts          # Middleware auth (désactivé)
│   └── mock/                  # Données de mock pour dev
│
├── .env                       # Variables d'environnement (non versionné)
├── next.config.ts             # Configuration Next.js
├── vercel.json                # Configuration Vercel
├── tailwind.config.js         # Tailwind + HeroUI + Design tokens
├── tsconfig.json              # Configuration TypeScript
└── package.json               # Dépendances et scripts
```

### Fichiers Clés à Connaître

| Fichier                                                           | Pourquoi c'est important                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/app/utils/reequilibrate.ts`                                  | **LE cœur métier.** Algorithme 3 phases de rééquilibrage des tables |
| `src/app/hook/useTournamentData.ts`                               | Hook principal, charge TOUTES les données d'un tournoi              |
| `src/app/providers/TournamentContextProvider.tsx`                 | Contexte React partagé pour un tournoi                              |
| `src/lib/prisma.ts`                                               | Instance Prisma unique + middleware de monitoring perf              |
| `src/app/api/tournament/[id]/end/route.ts`                        | Logique de fin de tournoi (inscription survivants au dimanche)      |
| `src/app/api/tournament/[id]/table_assignement/generate/route.ts` | Génération initiale des tables avec répartition équilibrée          |
| `src/app/(withoutSidebar)/game/[id]/page.tsx`                     | Affichage temps réel public (timer, blinds, stack moyen)            |
| `src/app/constants/string.ts`                                     | Tous les textes et labels de l'UI                                   |

---

## 🗄️ Base de Données

### Connexion

- **Type** : MySQL (MariaDB compatible)
- **Hébergeur** : Hostinger (`srv1906.hstgr.io`)
- **ORM** : Prisma 6.7 (client généré dans `src/generated/prisma/`)
- **Schéma** : `prisma/schema.prisma` (622 lignes)

### Modèles Principaux

```mermaid
erDiagram
    tournament ||--o{ registration : "a des inscriptions"
    tournament ||--o{ tournament_level : "a des niveaux"
    tournament ||--o{ tournament_table : "a des tables"
    tournament ||--o{ tournament_ranking : "a un classement"
    tournament }o--|| stack : "utilise un stack"

    registration }o--|| wp_users : "joueur WordPress"
    registration }o--|| tournament : "inscrit à"
    registration ||--o{ table_assignment : "assigné à"
    registration ||--o{ tournament_ranking : "classé"

    tournament_table ||--o{ table_assignment : "contient"
    tournament_table }o--|| tournament : "appartient à"

    table_assignment }o--|| registration : "joueur"
    table_assignment }o--|| tournament_table : "table"
    table_assignment }o--o| registration : "éliminé par (user_kill_id)"

    wp_users ||--o{ registration : "inscriptions"
    wp_users ||--o{ wp_usermeta : "métadonnées"

    season ||--o{ trimester : "trimestres"
    trimester ||--o{ repechage : "repêchages"
    repechage }o--|| wp_users : "joueur"

    stack ||--o{ stack_chip : "contient"
    stack_chip }o--|| chip : "jeton"
```

### Détail des Modèles Essentiels

#### `tournament`

| Champ                       | Type          | Description                                                   |
| --------------------------- | ------------- | ------------------------------------------------------------- |
| `id`                        | BigInt (auto) | Identifiant unique                                            |
| `tournament_name`           | String        | Nom du tournoi                                                |
| `tournament_category`       | Enum          | `APT`, `SITANDGO`, `SUPERFINALE`, `SOLIPOKER`, `SPECIAUX`     |
| `tournament_status`         | Enum          | `in_coming` (à venir), `start` (en cours), `finish` (terminé) |
| `tournament_start_date`     | DateTime      | Date et heure de début                                        |
| `tournament_open_date`      | DateTime      | Date d'ouverture des inscriptions                             |
| `tournament_trimestry`      | BigInt        | ID du trimestre associé                                       |
| `tournament_stack`          | Int           | FK vers le stack utilisé                                      |
| `tournament_pause`          | Boolean       | Tournoi en pause ?                                            |
| `estimate_duration`         | Int           | Durée estimée (minutes)                                       |
| `tournament_background_1/2` | String?       | URLs images de fond pour l'affichage game                     |

#### `registration`

| Champ              | Type     | Description                         |
| ------------------ | -------- | ----------------------------------- |
| `user_id`          | BigInt   | FK → `wp_users.ID`                  |
| `tournament_id`    | BigInt   | FK → `tournament.id`                |
| `statut`           | Enum     | `Confirmed`, `Pending`, `Cancelled` |
| `inscription_date` | DateTime | Date d'inscription                  |

#### `table_assignment`

| Champ               | Type    | Description                     |
| ------------------- | ------- | ------------------------------- |
| `registration_id`   | BigInt  | FK → `registration.id`          |
| `table_id`          | BigInt  | FK → `tournament_table.id`      |
| `table_seat_number` | TinyInt | Numéro de siège (1 à 9)         |
| `eliminated`        | Boolean | Joueur éliminé ?                |
| `user_kill_id`      | BigInt? | FK → `registration.id` du tueur |

#### `tournament_level`

| Champ                                     | Type     | Description           |
| ----------------------------------------- | -------- | --------------------- |
| `level_number`                            | Int      | Numéro du niveau      |
| `level_start` / `level_end`               | DateTime | Début/fin du niveau   |
| `level_small_blinde` / `level_big_blinde` | Int      | Valeurs des blindes   |
| `level_pause`                             | Boolean  | Niveau de pause ?     |
| `level_chip_race`                         | Boolean  | Color-up des jetons ? |
| `level_ante`                              | Int?     | Mise ante (optionnel) |

#### `tournament_ranking`

| Champ              | Type   | Description                           |
| ------------------ | ------ | ------------------------------------- |
| `registration_id`  | BigInt | FK → `registration.id`                |
| `tournament_id`    | BigInt | FK → `tournament.id`                  |
| `ranking_position` | Int    | Position finale (1 = premier éliminé) |
| `ranking_score`    | Int    | Points attribués                      |

#### `wp_users` (table WordPress partagée)

| Champ            | Type   | Description              |
| ---------------- | ------ | ------------------------ |
| `ID`             | BigInt | Identifiant WordPress    |
| `display_name`   | String | Nom affiché              |
| `pseudo_winamax` | String | Pseudo Winamax du joueur |
| `photo_url`      | String | URL photo de profil      |
| `user_email`     | String | Email                    |

### Enums

```typescript
// Catégories de tournois
enum tournament_tournament_category {
  APT          // Championnat principal
  SITANDGO     // Sit & Go (pas de rééquilibrage)
  SUPERFINALE  // Super Finale trimestrielle
  SOLIPOKER    // SoliPoker (3 jours : vendredi, samedi, dimanche)
  SPECIAUX     // Tournois spéciaux
}

// Statut du tournoi
enum tournament_tournament_status {
  in_coming    // À venir (inscriptions ouvertes)
  start        // En cours
  finish       // Terminé
}

// Statut d'inscription
enum registration_statut {
  Confirmed    // Confirmé
  Pending      // En attente
  Cancelled    // Annulé
}

// Statut de saison
enum season_status {
  draft        // Brouillon
  in_progress  // En cours
  past         // Terminée
}
```

---

## 🔧 Déploiement

### Environnement de Production (Vercel)

L'application est déployée sur **Vercel** avec déploiement automatique depuis Git.

```
Commit → Push → Vercel Build → next build (avec prisma generate) → Deploy
```

#### Configuration Vercel (`vercel.json`)

- **API Functions** : timeout max 30 secondes
- **Headers sécurité** : `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- **Cache** : `no-store` sur toutes les routes `/api/*` (pas de cache API)
- **Assets statiques** : cache 1 an sur `/images/*` et `/fonts/*`

#### Variables à configurer sur Vercel

```
DATABASE_URL = mysql://user:password@host:3306/database_name
MOCK = false
NEXT_PUBLIC_BASE_URL = https://ton-domaine.vercel.app
NODE_ENV = production
DATABASE_CONNECTION_LIMIT = 10
DATABASE_TIMEOUT = 30000
CACHE_TTL = 300000
VERCEL_TZ = Europe/Paris
```

### Build de Production

```bash
# Le build exécute automatiquement :
# 1. prisma generate (génère le client)
# 2. next build (compile l'app)
npm run build
```

> ⚠️ **Important** : Le `prisma generate` est obligatoire avant le build car le client est généré dans `src/generated/prisma/`. Si le client n'est pas généré, le build échouera.

---

## ⚙️ Configuration

### Variables d'Environnement (`.env`)

```bash
# ═══════════════════════════════════════
# 🗄️ BASE DE DONNÉES
# ═══════════════════════════════════════
# Format : mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="mysql://user:password@srv1906.hstgr.io:3306/database_name"

# ═══════════════════════════════════════
# 🔧 APPLICATION
# ═══════════════════════════════════════
# Mode mock : si "true", l'API renvoie des données fictives (pour dev sans BDD)
MOCK=false

# URL publique de l'application
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# ═══════════════════════════════════════
# 📈 PERFORMANCES
# ═══════════════════════════════════════
NODE_ENV=production
DATABASE_CONNECTION_LIMIT=10
DATABASE_TIMEOUT=30000
CACHE_TTL=300000

# ═══════════════════════════════════════
# 🌍 TIMEZONE
# ═══════════════════════════════════════
VERCEL_TZ=Europe/Paris
```

### Mode Mock

Si `MOCK=true` dans le `.env`, les API routes renvoient des données fictives depuis `src/mock/`. Utile pour développer sans accès à la BDD.

### Tailwind Design Tokens

Les couleurs principales sont définies dans `tailwind.config.js` :

| Token               | Valeur    | Usage                                    |
| ------------------- | --------- | ---------------------------------------- |
| `primary_brand-500` | `#165829` | Vert principal (boutons, sidebar active) |
| `primary_brand-700` | `#103e1d` | Vert foncé (hover)                       |
| `background`        | `#11181C` | Fond principal (dark mode natif)         |
| `danger-500`        | `#EF4444` | Actions destructives (élimination)       |
| `success-500`       | `#22C55E` | Actions positives (confirmation)         |
| `warning-500`       | `#F97316` | Alertes                                  |

La font principale est **Satoshi** (variantes : Regular, Bold, Medium, Light, Black, Italic).

---

## 🐛 Debug & Logs

### Console Serveur (Prisma)

En développement, Prisma affiche **tous les logs** de requêtes :

```typescript
// src/lib/prisma.ts
log: process.env.NODE_ENV === "development"
  ? ["query", "error", "warn"]
  : ["error"];
```

### Détection des Requêtes Lentes

Un middleware Prisma intégré détecte et log les requêtes > 1 seconde :

```
⚠️ Slow query detected: tournament.findMany took 1234ms
```

Ce log apparaît en production dans les **Vercel Function Logs**.

### Prisma Studio (Visualiser la BDD)

```bash
npx prisma studio
```

Ouvre une interface web sur **http://localhost:5555** pour explorer et modifier les données directement.

### Vérifier les Erreurs API

Toutes les erreurs API sont loguées avec un emoji indicatif :

```
❌ Erreur lors de la génération des tables : [error details]
❌ Error in PATCH tournament finish: [error details]
```

### Debug du Polling

Si les données ne se mettent pas à jour en temps réel :

1. Ouvrir les **DevTools → Network**
2. Filtrer par `details` pour voir les requêtes de polling
3. Vérifier que les réponses reviennent en **< 1 seconde**

### Logs Utiles pour le Support

| Situation               | Où chercher                                                 |
| ----------------------- | ----------------------------------------------------------- |
| Erreur de connexion BDD | Vercel → Logs → Chercher `PrismaClientInitializationError`  |
| Requête lente           | Vercel → Logs → Chercher `Slow query detected`              |
| Erreur de rééquilibrage | Vercel → Logs → Chercher `reequilibrate`                    |
| Échec fin de tournoi    | Vercel → Logs → Chercher `Error in PATCH tournament finish` |

---

## 👥 Rôles & Auth

### Architecture Auth

L'authentification est gérée via **WordPress** (angers-poker-club.fr). Le code middleware existe dans `src/middleware.ts` mais est **actuellement désactivé** (entièrement commenté).

Le middleware était prévu pour :

1. Récupérer un token JWT depuis les query params ou cookies
2. Valider le token via l'API WordPress (`/wp-json/custom/validate-token`)
3. Stocker un cookie sécurisé `admin_token` si valide
4. Rediriger vers `/error/unauthorized` si invalide

### Utilisateurs

Les utilisateurs proviennent de la table **`wp_users`** de WordPress :

```
WordPress (angers-poker-club.fr) → Table wp_users → Partagée avec l'app Next.js
```

L'application lit directement la table `wp_users` en base. Les champs utilisés :

- `display_name` : nom affiché dans les listes
- `pseudo_winamax` : pseudo de jeu
- `photo_url` : avatar du joueur

### Vérifier un Utilisateur

```bash
# Via Prisma Studio
npx prisma studio
# Ouvrir la table wp_users → chercher par display_name ou user_email
```

> 📌 **Pas de système de rôles admin dans l'app** : actuellement, toutes les pages admin sont accessibles sans authentification. Le middleware est prêt à être réactivé quand nécessaire.

---

## 📱 Pages & Features

### Navigation (Sidebar)

La sidebar est collapsible et contient :

| Page               | URL            | Description                       |
| ------------------ | -------------- | --------------------------------- |
| Championnat APT    | `/apt`         | Liste et gestion des tournois APT |
| Championnat Sit&Go | `/sitandgo`    | Liste et gestion des Sit&Go       |
| Super Finale       | `/superfinale` | Gestion des super finales         |
| Tournois Spéciaux  | `/special`     | Tournois spéciaux                 |
| SoliPoker          | `/solipoker`   | Tournois SoliPoker (3 jours)      |
| Stack / Malette    | `/malette`     | Gestion des stacks de jetons      |
| Saison             | `/season`      | Gestion des saisons et trimestres |

### Dashboard Tournoi (`/[categorie]/[id]`)

Accessible via un clic sur un tournoi dans la liste. Contient **5 onglets** :

1. **Général** — Infos du tournoi, statut, durée, actions (lancer, terminer, mettre en pause)
2. **Niveaux** — Liste des niveaux/blindes, génération automatique, pauses, chip race
3. **Joueurs** — Liste des inscrits, inscription manuelle, annulation, élimination + choix du tueur
4. **Tables** — Visualisation des tables, drag & drop, génération, rééquilibrage manuel
5. **Jetons** — Légende des jetons du stack utilisé

### Page Game / Display (` /game/[id]`)

**Page d'affichage temps réel** projetée sur un écran pendant le tournoi.

Affiche en temps réel :

- ⏱️ Timer du niveau en cours (synchronisé avec le serveur)
- 💰 Blindes actuelles (Small/Big/Ante)
- 👥 Joueurs restants / total
- 📊 Stack moyen des survivants
- ⏸️ Indicateur de pause
- 🔜 Prochaine pause avec compte à rebours
- 🎰 Légende des jetons
- 🖼️ Images de fond personnalisables

> 📌 **SoliPoker Day 2** : le stack moyen est calculé spécialement en incluant les stacks des Day 1 (vendredi + samedi).

### Édition Classement (`/[categorie]/[id]/edit-rankings`)

Permet d'éditer les positions et scores du classement **après** la fin d'un tournoi :

- Réorganisation drag & drop des positions
- Édition des scores manuellement
- Sauvegarde via l'API `PUT /api/tournament/[id]/update-rankings`

### Fonctionnalités Clés par Catégorie

| Feature                         | APT | Sit&Go     | Superfinale | SoliPoker | Spéciaux |
| ------------------------------- | --- | ---------- | ----------- | --------- | -------- |
| Tables multi (8 max)            | ✅  | ✅ (9 max) | ✅          | ✅        | ✅       |
| Rééquilibrage auto              | ✅  | ❌         | ✅          | ✅        | ✅       |
| Shuffle dernière table          | ✅  | ❌         | ✅          | ✅        | ✅       |
| Table finale 9 joueurs          | ✅  | ✅         | ✅          | ✅        | ✅       |
| Inscription survivants Dimanche | ❌  | ❌         | ❌          | ✅        | ❌       |
| Stack moyen Day 2               | ❌  | ❌         | ❌          | ✅        | ❌       |

---

### 🎯 Algorithme de Rééquilibrage (`reequilibrate.ts`)

L'algorithme fonctionne en **3 phases séquentielles** :

```
PHASE 1 : Fermeture de table
→ Si tous les joueurs de la table la plus haute peuvent être redistribués
→ Fermer cette table et redistribuer aléatoirement

PHASE 2 : Table avec moins de 4 joueurs
→ Si une table a < 4 joueurs actifs
→ Fermer cette table et redistribuer

PHASE 3 : Écart (gap) ≥ 2
→ Si la différence entre la table la plus pleine et la moins pleine est ≥ 2
→ Déplacer aléatoirement un joueur de la plus pleine vers la moins pleine
```

**Règles critiques :**

- Les **Sit&Go sont exclus** du rééquilibrage
- La sélection du joueur à déplacer est **100% aléatoire** (Fisher-Yates)
- Les tables sont fermées **par le numéro le plus élevé** en premier
- Après fermeture, les tables restantes sont **renumérotées séquentiellement**
- Le shuffle de la dernière table se fait **sauf pour les Sit&Go**

---

## 📈 Performances

### Optimisations en Place

| Optimisation            | Détail                                             |
| ----------------------- | -------------------------------------------------- |
| **Middleware Prisma**   | Détecte et log les requêtes > 1s                   |
| **Singleton Prisma**    | Une seule instance par env (pas de connexion leak) |
| **Cache images**        | 1 an (`max-age=31536000, immutable`)               |
| **SWC Minify**          | Activé dans `next.config.ts`                       |
| **Headers sécurité**    | `nosniff`, `DENY`, `XSS-Protection`                |
| **No cache API**        | `Cache-Control: no-store` sur `/api/*`             |
| **Compression**         | Activée (`compress: true`)                         |
| **Image optimization**  | WebP / AVIF automatique                            |
| **Batch DB operations** | Utilisation de `$transaction` et `createMany`      |

### Indexes de la Base de Données

Les indexes essentiels sont définis dans le schema Prisma :

```
registration       → tournament_id, user_id, inscription_date, statut
table_assignment   → registration_id, table_id, eliminated, table_seat_number
tournament         → tournament_category, tournament_start_date, tournament_status, tournament_trimestry
tournament_level   → tournament_id, level_number, level_start
tournament_ranking → registration_id, tournament_id, ranking_position, ranking_score
tournament_table   → tournament_id, table_capacity, table_number
```

### Polling Optimisé

- **Page admin** : polling toutes les 60s (données rarement changées par d'autres)
- **Page game** : polling toutes les 5s (besoin de réactivité pour le timer et les éliminations)
- TanStack Query gère automatiquement le **dedup** des requêtes et le **cache en mémoire**

### Points à Surveiller

- **API `/api/tournament/[id]/details`** : c'est la requête la plus lourde (charge tout le tournoi). S'assurer que les indexes sont corrects.
- **Table `wp_users`** : partagée avec WordPress, peut devenir volumineuse. Les requêtes filtrant par `ID` sont indexées.
- **BigInt serialization** : `serializeBigInt` convertit les BigInt en Number pour le JSON. Attention si les IDs dépassent `Number.MAX_SAFE_INTEGER` (peu probable).

---

## 🔄 Maintenance

### Mise à Jour du Schéma BDD

La BDD est gérée en mode **"database-first"** (le schéma vient de la BDD, pas l'inverse).

```bash
# 1. Modifier le schéma directement en base (PHPMyAdmin, MySQL CLI, etc.)

# 2. Synchroniser Prisma avec la BDD
npx prisma db pull

# 3. Regénérer le client
npx prisma generate

# 4. Tester localement
npm run dev

# 5. Commiter et push les changements de schéma
git add prisma/schema.prisma
git commit -m "chore: sync prisma schema"
git push
```

> ⚠️ **Ne pas utiliser `prisma migrate`** sauf si vous passez en mode "schema-first". L'app utilise actuellement `db pull` pour rester synchronisée avec la base partagée avec WordPress.

### Backup Base de Données

```bash
# Backup via mysqldump (depuis un accès SSH ou local)
mysqldump -u USER -p DATABASE_NAME > backup_$(date +%Y%m%d).sql

# Restore
mysql -u USER -p DATABASE_NAME < backup_20260225.sql
```

> 📌 **Hostinger** propose des backups automatiques via leur panneau d'administration. Vérifier que les backups auto sont activés.

### Mise à Jour des Dépendances

```bash
# Voir les packages outdated
npm outdated

# Mettre à jour (attention aux breaking changes)
npm update

# Pour les majors (Next.js, Prisma, etc.)
npm install next@latest react@latest react-dom@latest
npm install @prisma/client@latest
npm install -D prisma@latest

# Toujours regénérer Prisma après mise à jour
npx prisma generate
```

### Clear Cache

```bash
# Cache Next.js
rm -rf .next

# Cache node_modules (si problèmes)
rm -rf node_modules
npm install

# Regénérer le client Prisma
npx prisma generate
```

### Ajout d'une Nouvelle Catégorie de Tournoi

1. Ajouter la valeur dans l'enum `tournament_tournament_category` en base
2. `npx prisma db pull` + `npx prisma generate`
3. Ajouter un dossier page dans `src/app/(withSidebar)/nouvelle-categorie/`
4. Copier la structure depuis `apt/` (page.tsx + [id]/)
5. Ajouter l'entrée dans `src/app/constants/string.ts → sidebar.menu_item`
6. Adapter les règles dans `reequilibrate.ts → getMaxCapacityForCategory()`
7. Adapter les capacités dans `table_assignement/generate/route.ts → getTableCapacities()`

---

## 🤝 Support & Contact

### Site Web

- **Angers Poker Club** : [https://angers-poker-club.fr](https://angers-poker-club.fr)
- **Dashboard de l'app** : Déployé sur Vercel (URL dans les variables d'environnement)

### Accès nécessaires pour la maintenance

| Accès                | Pourquoi                                      |
| -------------------- | --------------------------------------------- |
| **Repository Git**   | Code source + déploiement Vercel              |
| **Vercel Dashboard** | Logs, variables d'env, domaines, déploiements |
| **Hostinger (BDD)**  | phpMyAdmin, backups, accès MySQL direct       |
| **WordPress Admin**  | Gestion utilisateurs, sync tournois           |

### En cas de problème critique

1. **Vérifier les logs Vercel** → Dashboard Vercel → Fonctions → Logs
2. **Vérifier la BDD** → `npx prisma studio` ou phpMyAdmin
3. **Relancer un déploiement** → Dashboard Vercel → Deployments → Redeploy
4. **Rollback** → Dashboard Vercel → Deployments → Clic sur un ancien déploiement → Promote to Production

---

## 📝 Changelog & Versions

L'application suit le **versionnement sémantique** :

| Version | Date    | Description                                       |
| ------- | ------- | ------------------------------------------------- |
| `0.1.0` | Initial | Première version — Gestion APT, Sit&Go, SoliPoker |

---

> 📌 **Ce README est un document vivant.** Mettez-le à jour à chaque changement majeur de l'architecture, des features ou de la configuration.
# APC-backend
# APC-backend
# APC-backend
