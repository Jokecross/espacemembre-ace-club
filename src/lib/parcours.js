/* Le parcours du workshop ACE Club : 10 jours, un par nuit.

   Ce fichier ne porte que la charpente : les titres des jours (les mêmes
   que sur la page de vente) et une phrase de résumé. Le reste — les étapes,
   la vidéo, les prompts et les consignes — vit dans la base (workshop_jours)
   et se remplit dans le back-office, onglet « Workshop 10 jours ».

   AUCUN PROMPT ICI. Le dépôt peut être public : un prompt n'entre jamais
   dans le code. La base ne renvoie d'ailleurs le contenu d'un jour qu'une
   fois ce jour ouvert. */

// Les consignes générales, en tête du workshop.
export const COMMENT_CA_MARCHE = [
  "Un jour s'ouvre chaque nuit à minuit, à ton heure. Le jour 1 est ouvert dès ton inscription.",
  "Avance dans l'ordre, sans sauter de jour : chaque étape sert la suivante.",
  "Un jour ouvert le reste : si tu prends du retard, tu peux rattraper.",
  "En fin de journée, dépose une capture de ce que tu as fait : c'est ce qui permet à l'équipe de t'aider.",
  '[À FOURNIR : les consignes générales du workshop (temps par jour, réglages de Base44…)]',
]

export const JOURS = [
  { jour: 1, titre: 'Ton offre et ta cible', resume: 'Tu choisis les commerces que tu vises et ce que tu leur vends.' },
  { jour: 2, titre: 'Ton premier site avec l’IA', resume: 'Tu sors un vrai site avec le logiciel IA partenaire, sans coder.' },
  { jour: 3, titre: 'Le rendre pro', resume: 'Textes, photos, version mobile, mise en ligne.' },
  { jour: 4, titre: 'Ton prix', resume: 'Tu fixes le prix du site et celui de l’abonnement mensuel.' },
  { jour: 5, titre: 'Trouver tes prospects', resume: 'Tu fais la liste des commerces à contacter autour de toi.' },
  { jour: 6, titre: 'La maquette qui vend', resume: 'Tu prépares le site d’un prospect avant même de l’appeler.' },
  { jour: 7, titre: 'Tes premiers messages', resume: 'Tu contactes tes prospects avec les messages fournis.' },
  { jour: 8, titre: 'Les relances', resume: 'Tu relances et tu décroches tes premiers rendez-vous.' },
  { jour: 9, titre: 'Le rendez-vous', resume: 'Tu montres la maquette et tu annonces ton prix.' },
  { jour: 10, titre: 'Le premier oui', resume: 'Tu signes, tu encaisses l’acompte et tu livres.' },
]

/* La page « Si ça ne marche pas » : des prompts de secours, ouverts à tous.
   [À FOURNIR] Tant que la liste est vide, la page n'est pas proposée.
   Chaque entrée : { id: 'SOS_…', titre, avant? } ; le texte du prompt se
   colle dans le back-office (workshop_reglages.prompts_sos[id]). */
export const SECOURS = {
  intro:
    "Un souci dans Base44 ? Choisis le prompt qui correspond à ton problème, colle-le dans le chat de ton projet et envoie. Un seul à la fois.",
  prompts: [],
}
