/* Les noms affichés partout dans l'espace membre. Un seul endroit à
   modifier quand l'offre ou l'outil changent de nom. */

export const MARQUE = 'ACE Club'

// L'offre, telle qu'elle figure sur la page de vente : le programme de
// 10 jours pour vendre son premier site.
export const OFFRE = 'Programme 10 jours'

// La durée du workshop. Le jour 1 s'ouvre à l'inscription, puis un jour de
// plus à chaque minuit chez l'élève. C'est la base qui compte les jours
// (workshop_jour) : ce nombre ne sert qu'à l'affichage.
export const JOURS_WORKSHOP = 10

// Le logiciel IA partenaire, dans lequel l'élève construit ses sites.
// Il est nommé dans l'espace membre ; la page de vente dit « logiciel IA partenaire ».
// Écrit pour se lire dans une phrase : « colle ce prompt dans Base44 ».
export const OUTIL = 'Base44'

// Ce que l'élève construit pendant le workshop. Écrit pour se lire après
// « ton » : « ton premier site prend forme ».
export const APP = 'premier site'

// Le coach IA sur WhatsApp. [À VALIDER] ce qu'il fait exactement, avec le
// client. [À FOURNIR] le lien (https://wa.me/…). Vide = bouton désactivé.
export const COACH_WHATSAPP = ''

// L'accompagnement ACE Club, proposé dans l'espace membre.
// [À VALIDER avec le client : à quel moment et comment]. Aujourd'hui la
// carte apparaît quand les 10 jours du workshop sont ouverts, ou quand
// tous les modules de la formule sont vus.
// Le texte se règle dans le back-office (onglet Accompagnement, table
// prochaines_etapes) ; ces valeurs ne servent que si la base n'a rien.
// Aucun prix, aucun chiffre de revenus, aucune promesse de gain.
export const ACCOMPAGNEMENT = {
  eyebrow: 'Accompagnement ACE Club',
  titre: "Rejoins l'accompagnement ACE Club",
  texte: "[À FOURNIR : ce que contient l'accompagnement, en deux ou trois phrases]",
  bouton: "Rejoindre l'accompagnement",
  lien: '', // [À FOURNIR]
}
