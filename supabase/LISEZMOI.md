# Base de données

L'espace membre partage la base Supabase d'ACE Club avec la page de vente
(son propre dossier) et le CRM (`~/CRM ACE Club`). Le projet Supabase n'existe pas
encore.

Dans Supabase → SQL Editor, dans cet ordre (les deux sont rejouables) :

    1. ~/CRM ACE Club/supabase/INSTALLATION.sql   tout le schéma
    2. ~/Espace Membre ACE Club/scripts/contenu-ace.sql
                                                  les 20 modules, une leçon chacun,
                                                  les trois formules, les 10 jours
                                                  (titres et résumés, sans prompt),
                                                  la carte accompagnement (éteinte)

Le contrat entre la base et ce front : `~/CRM ACE Club/docs/CONTRAT-BASE.md`.
