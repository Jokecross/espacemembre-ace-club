import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Icone from './Icone.jsx'
import { APP, JOURS_WORKSHOP, OUTIL } from '../lib/marque'
import { JOURS } from '../lib/parcours.js'

/**
 * « Ta prochaine action » : la seule carte au contour bleu de la page, donc
 * la seule qu'on ne peut pas rater.
 *
 * Elle répond à la question que l'élève se pose en arrivant — qu'est-ce que
 * je fais maintenant ? — et elle le fait à sa place. L'ordre des cas compte :
 * d'abord ce qui bloque (les introductions), puis ce qui est nouveau (le
 * workshop), puis la suite du programme.
 */
export default function CarteAction({ etat, intros, parcours, introFaite, onOuvrirModule }) {
  const action = decider({ etat, intros, parcours, introFaite })
  const naviguer = useNavigate()
  const [cherche, setCherche] = useState(false)
  if (!action) return null

  /* Reprendre un module, c'est reprendre à la première leçon non vue. On
     va la chercher au clic plutôt qu'au chargement : la page d'accueil
     n'a pas besoin de connaître les leçons de tous les modules pour
     afficher une carte. */
  async function reprendre() {
    if (cherche) return
    setCherche(true)
    const [{ data: lecons }, { data: vues }] = await Promise.all([
      supabase
        .from('lessons')
        .select('id, position')
        .eq('module_id', action.module)
        .order('position'),
      supabase.from('lesson_progress').select('lesson_id'),
    ])
    setCherche(false)
    const faites = new Set((vues || []).map((v) => v.lesson_id))
    const suivante = (lecons || []).find((l) => !faites.has(l.id)) || (lecons || [])[0]
    // Sans leçon — module vide, ou requête en échec — on déplie le module
    // sur place : l'élève voit au moins où il en est.
    if (suivante) naviguer(`/lecon/${suivante.id}`)
    else onOuvrirModule?.(action.module)
  }

  return (
    <section className="carte-phare mt-6">

      <div className="relative flex flex-col items-stretch gap-5 sm:flex-row sm:items-center sm:gap-8">
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/60 bg-accent-pastel px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-navy">
            <Icone nom={action.icone} taille={14} />
            {action.etiquette}
          </span>

          <h2 className="mt-4 text-[26px] leading-tight sm:text-[34px]">
            {action.titre}
          </h2>

          <p className="mt-2.5 max-w-[42ch] text-[15px] leading-relaxed text-ink">
            {action.texte}
          </p>

          {action.details && (
            <div className="mt-4 flex items-center gap-3.5 text-[13px] font-bold text-muted">
              {action.details.map((d, i) => (
                <span key={d} className="flex items-center gap-3.5">
                  {i > 0 && <span className="h-[3px] w-[3px] rounded-full bg-accent/60" />}
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>

        {action.module ? (
          <button
            onClick={reprendre}
            disabled={cherche}
            className="btn whitespace-nowrap px-8"
          >
            {cherche ? 'Un instant…' : action.bouton}
            <Icone nom="fleche" taille={18} />
          </button>
        ) : (
          <Link
            to={action.lien}
            className="btn whitespace-nowrap px-8"
          >
            {action.bouton}
            <Icone nom="fleche" taille={18} />
          </Link>
        )}
      </div>
    </section>
  )
}

function decider({ etat, intros, parcours, introFaite }) {
  // 1. Les introductions bloquent tout : rien d'autre ne compte.
  if (intros?.length && !introFaite) {
    return {
      etiquette: 'Commence ici',
      icone: 'lecture',
      titre: 'Regarde ton introduction',
      texte:
        "Les vidéos pour comprendre où tu mets les pieds. Tant qu'elles ne sont pas vues, le reste reste fermé.",
      bouton: 'Regarder',
      lien: `/lecon/${intros[0].id}`,
    }
  }

  // 2. Le workshop, tant que ses dix jours ne sont pas tous ouverts.
  if (etat && !etat.equipe && etat.jour < JOURS_WORKSHOP) {
    const neuf = etat.dispense || etat.jour === 0
    const jour = JOURS.find((j) => j.jour === etat.jour)
    return {
      etiquette: neuf ? 'Commence ici' : 'Ta prochaine action',
      icone: 'outil',
      titre: neuf ? `Ton workshop de ${JOURS_WORKSHOP} jours` : `Jour ${etat.jour} · ${jour?.titre || 'ton workshop'}`,
      texte: neuf
        ? `Un jour après l'autre : ton offre, ton ${APP} dans ${OUTIL}, tes prospects, puis ton premier rendez-vous.`
        : jour?.resume || `Le jour ${etat.jour} de ton workshop t'attend.`,
      details: neuf ? null : [`Jour ${etat.jour} sur ${JOURS_WORKSHOP}`],
      bouton: neuf ? 'Découvrir' : 'Continuer',
      lien: neuf ? '/workshop' : `/workshop/jour/${etat.jour}`,
    }
  }

  // 3. Sinon, la suite du programme.
  const enCours = parcours?.find((m) => m.unlocked && m.completion < 1)
  if (enCours) {
    return {
      etiquette: 'Ta prochaine action',
      icone: 'lecture',
      titre: enCours.title,
      texte: `Module ${parcours.indexOf(enCours) + 1} · ${enCours.done_count} leçon${enCours.done_count > 1 ? 's' : ''} sur ${enCours.lesson_count}.`,
      bouton: 'Reprendre',
      // Le module à ouvrir, pas « / » : on y est déjà.
      module: enCours.id,
    }
  }

  // 4. Tout est fait.
  return {
    etiquette: 'Bravo',
    icone: 'valide',
    titre: 'Tu as terminé ton programme',
    texte: `Tes modules sont vus et les ${JOURS_WORKSHOP} jours de ton workshop sont ouverts. Reviens-y dès que tu prépares un rendez-vous.`,
    bouton: 'Revoir le workshop',
    lien: '/workshop',
  }
}
