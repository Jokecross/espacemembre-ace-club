import { Link, Navigate } from 'react-router-dom'
import PromptCopie from '../components/PromptCopie.jsx'
import Icone from '../components/Icone.jsx'
import { textePromptSecours, useWorkshop } from '../lib/useWorkshop.js'
import { SECOURS } from '../lib/parcours.js'

/**
 * Les prompts de secours, ouverts à tous quel que soit le jour.
 * [À FOURNIR] La liste est vide pour l'instant (src/lib/parcours.js) : la
 * page n'est alors pas proposée, et son adresse ramène au workshop.
 */
export default function WorkshopSecours() {
  const { reglages } = useWorkshop()
  if (!SECOURS.prompts.length) return <Navigate to="/workshop" replace />

  return (
    <>
      <Link
        to="/workshop"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-muted hover:text-navy"
      >
        <span className="rotate-180"><Icone nom="fleche" taille={15} /></span>
        Tous les jours
      </Link>
      <h1 className="mt-2 text-[28px] sm:text-[38px]">Si ça ne <span className="mot-cle">marche pas</span></h1>
      <p className="mt-2.5 max-w-[62ch] text-[15px] leading-relaxed">{SECOURS.intro}</p>

      {!reglages ? (
        <p className="mt-6 text-muted">Chargement…</p>
      ) : (
        SECOURS.prompts.map((p) => (
          <PromptCopie key={p.id} id={p.id} titre={p.titre} avant={p.avant} texte={textePromptSecours(p.id, reglages)} />
        ))
      )}
    </>
  )
}
