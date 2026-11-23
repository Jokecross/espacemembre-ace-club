-- =====================================================================
--  ACE Club — le contenu de l'espace membre
--  À passer APRÈS ~/CRM ACE Club/supabase/INSTALLATION.sql.
--  Supabase → SQL Editor → New query → coller → Run. Rejouable.
--
--  Ce que ce fichier pose :
--    1. les trois formules (mêmes clés que la base du CRM) ;
--    2. les 20 modules, dans l'ordre, avec une leçon chacun (« à plat ») ;
--    3. quels modules chaque formule contient (formules_recalculer) :
--         Mensuel Builder (mensuel)         modules 1 à 8
--         Annuel Starter  (annuel)          modules 1 à 14
--         Annuel Builder  (annuel_builder)  modules 1 à 20
--    4. les titres et résumés des 10 jours du workshop (sans prompt) ;
--    5. la carte « accompagnement ACE Club », éteinte.
--
--  Ce qu'il ne pose PAS : aucune vidéo (à déposer dans le back-office,
--  onglet Contenu), aucun prompt (onglet Workshop 10 jours). Aucun prompt
--  n'entre jamais dans ce dépôt.
--
--  Rejouer ce fichier ne touche ni aux vidéos déjà déposées, ni aux
--  progressions des élèves, ni aux prompts, ni aux textes déjà retouchés
--  dans le back-office (seuls les titres des modules sont réécrits).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Les trois formules
-- ---------------------------------------------------------------------
alter table public.plans add column if not exists dernier_module int;

insert into public.plans (code, label, rank, dernier_module) values
  ('mensuel',        'Mensuel Builder', 1, 8),
  ('annuel',         'Annuel Starter',  2, 14),
  ('annuel_builder', 'Annuel Builder',  3, 20)
on conflict (code) do update
  set label = excluded.label, rank = excluded.rank, dernier_module = excluded.dernier_module;

-- ---------------------------------------------------------------------
-- 2. Les 20 modules et leur leçon
-- ---------------------------------------------------------------------
-- Ni introduction ni bonus : les 20 comptent dans la numérotation, et le
-- module 1 « Bienvenue » est le premier du programme.

insert into public.modules (position, title)
select position, title from (values
  ( 1, 'Bienvenue'),
  ( 2, 'Mindset'),
  ( 3, 'Pourquoi l''IA, et pourquoi maintenant'),
  ( 4, 'Ce que tu vends, et à qui'),
  ( 5, 'Ton premier site avec l''IA, en direct'),
  ( 6, 'Le finaliser et le mettre en ligne'),
  ( 7, 'Trouver et contacter tes premiers prospects'),
  ( 8, 'Vendre et te faire payer'),
  ( 9, 'Fixer tes prix'),
  (10, 'Convaincre au téléphone'),
  (11, 'Te faire payer chaque mois'),
  (12, 'Ton portfolio et tes avis clients'),
  (13, 'Gérer tes clients sans galérer'),
  (14, 'Tes 30 prochains jours'),
  (15, 'Les apps à vendre en plus du site'),
  (16, 'Créer une app avec l''IA : la méthode'),
  (17, 'Sécuriser une app avant de la livrer'),
  (18, 'Ajouter de l''IA chez tes clients'),
  (19, 'Proposer une app à tes clients'),
  (20, 'Passer de freelance à agence')
) as a(position, title)
on conflict (position) do update set title = excluded.title;

-- Une leçon par module, au même titre. La vidéo se dépose ensuite dans le
-- back-office : [À FOURNIR : vidéo du module X].
insert into public.lessons (module_id, position, title)
select m.id, 1, a.title
  from (values
  ( 1, 'Bienvenue'),
  ( 2, 'Mindset'),
  ( 3, 'Pourquoi l''IA, et pourquoi maintenant'),
  ( 4, 'Ce que tu vends, et à qui'),
  ( 5, 'Ton premier site avec l''IA, en direct'),
  ( 6, 'Le finaliser et le mettre en ligne'),
  ( 7, 'Trouver et contacter tes premiers prospects'),
  ( 8, 'Vendre et te faire payer'),
  ( 9, 'Fixer tes prix'),
  (10, 'Convaincre au téléphone'),
  (11, 'Te faire payer chaque mois'),
  (12, 'Ton portfolio et tes avis clients'),
  (13, 'Gérer tes clients sans galérer'),
  (14, 'Tes 30 prochains jours'),
  (15, 'Les apps à vendre en plus du site'),
  (16, 'Créer une app avec l''IA : la méthode'),
  (17, 'Sécuriser une app avant de la livrer'),
  (18, 'Ajouter de l''IA chez tes clients'),
  (19, 'Proposer une app à tes clients'),
  (20, 'Passer de freelance à agence')
) as a(position, title)
  join public.modules m on m.position = a.position
on conflict (module_id, position) do update set title = excluded.title;

-- ---------------------------------------------------------------------
-- 3. Le contenu de chaque formule
-- ---------------------------------------------------------------------
-- Le déclencheur `trg_module_dans_les_formules` coche les nouveaux modules,
-- mais l'ordre d'insertion d'un même INSERT n'est pas garanti : on termine
-- donc par `formules_recalculer()` (juste après la transaction,
-- avant les vérifications), qui renumérote les trois formules par `position`.
-- Attendu : mensuel 8, annuel 14, annuel_builder 20.

-- ---------------------------------------------------------------------
-- 4. Les 10 jours du workshop : titres et résumés, rien d'autre
-- ---------------------------------------------------------------------
-- INSTALLATION.sql sème déjà les 10 jours avec leurs titres : on ne touche
-- jamais au titre, on ne pose le résumé que s'il est vide. Les étapes, la
-- vidéo et les prompts : [À FOURNIR], dans le back-office.
insert into public.workshop_jours (jour, titre, resume) values
  ( 1, 'Ton offre et ta cible',        'Tu choisis les commerces que tu vises et ce que tu leur vends.'),
  ( 2, 'Ton premier site avec l’IA',   'Tu sors un vrai site avec le logiciel IA partenaire, sans coder.'),
  ( 3, 'Le rendre pro',                'Textes, photos, version mobile, mise en ligne.'),
  ( 4, 'Ton prix',                     'Tu fixes le prix du site et celui de l’abonnement mensuel.'),
  ( 5, 'Trouver tes prospects',        'Tu fais la liste des commerces à contacter autour de toi.'),
  ( 6, 'La maquette qui vend',         'Tu prépares le site d’un prospect avant même de l’appeler.'),
  ( 7, 'Tes premiers messages',        'Tu contactes tes prospects avec les messages fournis.'),
  ( 8, 'Les relances',                 'Tu relances et tu décroches tes premiers rendez-vous.'),
  ( 9, 'Le rendez-vous',               'Tu montres la maquette et tu annonces ton prix.'),
  (10, 'Le premier oui',               'Tu signes, tu encaisses l’acompte et tu livres.')
on conflict (jour) do update
  set resume = coalesce(nullif(public.workshop_jours.resume, ''), excluded.resume);

-- ---------------------------------------------------------------------
-- 5. La carte « accompagnement ACE Club », éteinte
-- ---------------------------------------------------------------------
-- [À VALIDER avec le client : à quel moment et comment]. Le texte et le
-- lien se remplissent dans le back-office (onglet Accompagnement), puis on
-- coche « Afficher ». Aucun prix, aucun chiffre de revenus, aucune promesse.
insert into public.prochaines_etapes (id, actif, eyebrow, titre, texte, cta_libelle, cta_url, note)
values (
  1,
  false,
  'Accompagnement ACE Club',
  'Rejoins l''accompagnement ACE Club',
  '[À FOURNIR : ce que contient l''accompagnement, en deux ou trois phrases]',
  'Rejoindre l''accompagnement',
  '#',
  null
)
-- La ligne posée par INSTALLATION.sql porte un texte « [À COMPLÉTER …] » :
-- on la remplace par celle-ci. Un texte déjà écrit dans le back-office
-- n'est jamais écrasé.
on conflict (id) do update
  set eyebrow = excluded.eyebrow, titre = excluded.titre, texte = excluded.texte,
      cta_libelle = excluded.cta_libelle
  where public.prochaines_etapes.texte like '[À COMPL%';


-- Les trois formules, renumérotées d'un coup (fonction de la base ACE,
-- service_role / SQL Editor seulement).
select * from public.formules_recalculer();

-- ---------------------------------------------------------------------
-- Vérification
-- ---------------------------------------------------------------------
-- 20 lignes : chaque module, sa leçon, et les formules qui le contiennent.
select m.position,
       m.title,
       count(distinct l.id)                                  as lecons,
       string_agg(distinct pm.plan_code, ', ' order by pm.plan_code) as formules
  from public.modules m
  left join public.lessons l       on l.module_id = m.id
  left join public.plan_modules pm on pm.module_id = m.id
 where m.position between 1 and 20
 group by m.position, m.title
 order by m.position;

-- 3 lignes attendues : mensuel 8, annuel 14, annuel_builder 20.
select p.code, p.label, count(pm.module_id) as modules
  from public.plans p
  left join public.plan_modules pm on pm.plan_code = p.code
 group by p.code, p.label, p.rank
 order by p.rank;

-- 10 lignes attendues, prompts vides au départ.
select jour, titre, (prompt is not null) as a_un_prompt from public.workshop_jours order by jour;
