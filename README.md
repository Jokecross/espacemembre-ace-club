# Espace membre — ACE Club (programme 10 jours)

Le portail des élèves d'ACE Club : workshop de 10 jours, modules vidéo selon la
formule, coach IA sur WhatsApp, puis la proposition de rejoindre
l'accompagnement ACE Club. Vite + React + Tailwind, fonctions `api/` sur Vercel ;
données, comptes et vidéos dans la base Supabase d'ACE Club, partagée avec la
page de vente (son propre dossier) et le CRM (`~/CRM ACE Club`).

Charte : la même que la page de vente (`ace.css` de la page) — fond
#07090F, cartes #0E121C, un seul accent #7C9CFF, Archivo 800 élargie pour les
titres, Inter pour le texte, polices en local (`public/fonts/`), motif des barres
du « E » penchées à -12°. Variables dans `src/index.css` (`:root`), noms dans
`tailwind.config.js`.

Noms affichés : `src/lib/marque.js` (MARQUE ACE Club, OFFRE Programme 10 jours,
OUTIL Base44, APP « premier site », lien du coach, accompagnement).

```
src/lib/marque.js            noms, durée du workshop, lien du coach, accompagnement
src/lib/parcours.js          les 10 jours (titres, résumés), consignes générales, secours
src/lib/programme.js         modules de la formule + modules des autres offres (verrouillés)
src/lib/useWorkshop.js       les jours tels que la base les ouvre
src/pages/Login.jsx          connexion (e-mail + mot de passe)
src/pages/Invite.jsx         /bienvenue/<jeton> : l'élève crée son compte
src/pages/Modules.jsx        accueil : prochaine action, coach, outils, programme, accompagnement
src/pages/Lesson.jsx         le lecteur, « j'ai terminé », le programme à droite
src/pages/Workshop.jsx       les 10 jours
src/pages/WorkshopJour.jsx   un jour : résumé, vidéo, étapes, prompt(s), consignes, capture
src/pages/WorkshopSecours.jsx « Si ça ne marche pas » (masquée tant que la liste est vide)
src/pages/Outils.jsx         les outils recommandés
src/pages/Admin.jsx          back-office : invitations, suivi, membres, formules, contenu,
                             workshop 10 jours, outils, accompagnement
src/components/CarteCoach.jsx          le coach IA sur WhatsApp
src/components/CarteAccompagnement.jsx la carte « Rejoins l'accompagnement ACE Club »
api/invite-accept.js         crée le compte depuis une invitation (clé service_role)
api/reset-password.js        un admin pose un nouveau mot de passe
api/video-token.js           URL de lecture d'une leçon, après contrôle des droits
scripts/contenu-ace.sql      les 20 modules, leurs leçons, les formules, les 10 jours (sans prompt)
scripts/captures.mjs         captures d'écran sur données de démonstration (Playwright)
```

**Aucun prompt n'entre dans ce dépôt.** Les prompts du workshop vivent dans la
base (`workshop_jours.prompt`, `prompt_2`) et se collent dans le back-office,
onglet « Workshop 10 jours ». La base ne renvoie le contenu d'un jour qu'une fois
ce jour ouvert. `.gitignore` écarte tout `scripts/*prompts*.sql`.

## Installer la base

1. `~/CRM ACE Club/supabase/INSTALLATION.sql` (tout le schéma, partagé avec le CRM).
2. `scripts/contenu-ace.sql` (le contenu de l'espace). Rejouable.

Voir `supabase/LISEZMOI.md`.

## Comment un élève entre

1. Après la vente, le setter crée l'invitation (CRM, ou `/admin` → **Invitations**,
   avec la formule) et envoie le lien `/bienvenue/<jeton>` (14 jours, usage unique).
2. L'élève choisit son e-mail et son mot de passe : compte créé, formule appliquée.
3. Un guide de bienvenue (2 ou 3 cartes), un tour de l'espace, puis l'accueil.

## Le rythme

- Le jour 1 s'ouvre dès l'inscription, puis un jour de plus à chaque minuit, à
  l'heure de l'élève, jusqu'au jour 10. C'est la base qui compte (`workshop_jour`).
- Avant le jour 3, seul le premier module est ouvert ; au jour 3, toute la
  formule. Réglable dans **Workshop 10 jours**.
- Formules : Mensuel Builder modules 1 à 8, Annuel Starter 1 à 14, Annuel
  Builder 1 à 20. Un module hors formule reste visible, fermé, avec le nom de
  l'offre qui le contient.

## Variables

| Variable | Où | Valeur |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel + `.env` | l'URL du projet Supabase d'ACE Club |
| `VITE_SUPABASE_ANON_KEY` | Vercel + `.env` | clé anon (publique) |
| `SUPABASE_URL` | Vercel | la même URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel seulement | clé service_role — **jamais** de préfixe `VITE_` |

En local : copier `.env.example` en `.env` (ignoré par git) et remplir les deux
`VITE_`. Construire sans base (vérifier que ça compile) :

```
VITE_SUPABASE_URL=https://demo.supabase.co VITE_SUPABASE_ANON_KEY=demo npx vite build
```


## Captures

```
VITE_SUPABASE_URL=https://demo.supabase.co VITE_SUPABASE_ANON_KEY=demo npx vite build
npx vite preview --host 127.0.0.1 --port 4791 &
node scripts/captures.mjs http://127.0.0.1:4791
```

Toutes les réponses de Supabase sont simulées (interception Playwright), aucune
vraie base n'est appelée. Les images vont dans `captures/` (ignoré par git).

Ce qui reste à fournir ou à valider : `A-COMPLETER.md`.
