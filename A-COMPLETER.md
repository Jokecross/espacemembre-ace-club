# À compléter — espace membre ACE Club

## Branchements
- [ ] Créer le projet Supabase d'ACE Club, puis passer `INSTALLATION.sql` (CRM) et `scripts/contenu-ace.sql`
- [ ] URL du projet → `VITE_SUPABASE_URL` et `SUPABASE_URL` (Vercel, et `.env` en local)
- [ ] Clé anon → `VITE_SUPABASE_ANON_KEY` (Vercel, et `.env` en local)
- [ ] Clé service_role → `SUPABASE_SERVICE_ROLE_KEY`, **dans Vercel seulement**, sans préfixe `VITE_`
- [ ] Supabase → Authentication : inscriptions libres fermées (on n'entre que par invitation)
- [ ] Premier compte admin (ligne dans `staff` côté CRM, ou `members.role = 'admin'`)
- [ ] Domaine de l'espace membre → à donner au CRM (`ESPACE_URL`, lien d'invitation)

## Contenu
- [ ] Vidéos des 20 modules : back-office → Contenu → « Déposer la vidéo » ou « Lien vidéo » (Vimeo, Loom, Tella, Google Drive). Tant qu'il manque, l'élève voit `[À FOURNIR : vidéo du module X]`
- [ ] Les 10 jours du workshop, back-office → Workshop 10 jours, pour chaque jour : étapes (une par ligne), **prompt**, vidéo, consignes « Avant demain » (facultatif)
- [ ] Les consignes générales du workshop (temps par jour, réglages de Base44…) → `COMMENT_CA_MARCHE` dans `src/lib/parcours.js` (dernière ligne `[À FOURNIR]`)
- [ ] Vidéo « à regarder avant le jour 1 » (facultatif) → back-office → Workshop 10 jours → Le rythme
- [ ] Prompts « Si ça ne marche pas » (facultatif) → `SECOURS.prompts` dans `src/lib/parcours.js`, textes dans le back-office. La page reste masquée tant que la liste est vide
- [ ] Outils recommandés (Base44 et les autres, codes promo s'il y en a) → back-office → Outils

## Coach IA sur WhatsApp
- [ ] [À FOURNIR] lien WhatsApp du coach (`https://wa.me/…`) → `COACH_WHATSAPP` dans `src/lib/marque.js`
- [ ] [À VALIDER] ce que fait le coach, et à quelles heures (la page de vente dit « jour et nuit », aussi à valider). Retirer la mention `[À VALIDER]` de `src/components/CarteCoach.jsx` une fois validé

## Accompagnement ACE Club
- [ ] [À VALIDER avec le client : à quel moment et comment]. Aujourd'hui : carte en bas de l'accueil, affichée quand les 10 jours du workshop sont ouverts ou quand tous les modules de la formule sont vus (`src/pages/Modules.jsx`, `CarteAccompagnement visible=…`)
- [ ] [À FOURNIR] texte (2-3 phrases) et lien → back-office → Accompagnement, puis cocher « Afficher la carte aux élèves ». Aucun prix, aucun chiffre de revenus, aucune promesse de gain

## À valider avec le client
- [ ] Rythme des modules : 1 module ouvert avant le jour 3, toute la formule au jour 3 (réglable dans le back-office)
- [ ] Pas de « jour 0 » (prompt collé pendant l'appel) : la page de vente dit « tu reçois ton accès et tu attaques le jour 1 ». À rajouter si le client veut que le setter fasse démarrer l'élève pendant l'appel
- [ ] Le prénom du créateur n'apparaît nulle part dans l'espace : `[À FOURNIR : prénom]` si on veut l'ajouter (guide de bienvenue)

## Charte
- [x] Logo (`public/logo-ace.svg`) et favicon (`public/favicon.png`) : ceux de la page de vente
- [x] Polices en local (`public/fonts/`) : Archivo variable + Inter
