import Icone from './Icone.jsx'
import { COACH_WHATSAPP } from '../lib/marque'

/**
 * Le coach IA sur WhatsApp, à portée de pouce.
 *
 * [À VALIDER] avec le client : ce que le coach fait exactement, et à quelles
 * heures il répond (la page de vente dit « jour et nuit », aussi à valider).
 * [À FOURNIR] le lien, dans `COACH_WHATSAPP` (src/lib/marque.js). Tant qu'il
 * est vide, le bouton reste désactivé.
 */
export default function CarteCoach({ compact = false }) {
  const lien = COACH_WHATSAPP

  return (
    <section className={`card flex flex-wrap items-center gap-4 ${compact ? 'p-4 sm:p-5' : 'mt-6 p-5 sm:p-6'}`}>
      <span className="grid h-12 w-12 flex-none place-items-center rounded-xl border border-accent/50 bg-accent-pastel text-accent">
        <Icone nom="coach" taille={22} />
      </span>
      <div className="min-w-[200px] flex-1">
        <b className="block font-title text-[15.5px] font-bold text-navy">
          Ton coach IA sur WhatsApp <span className="todo ml-1">[À VALIDER]</span>
        </b>
        <span className="mt-0.5 block text-[14px] leading-relaxed">
          Tu bloques sur ton site, sur un prix ou sur un message à un prospect ? Écris-lui.
        </span>
      </div>
      {lien ? (
        <a href={lien} target="_blank" rel="noopener" className="btn w-full whitespace-nowrap sm:w-auto">
          Écrire au coach
          <Icone nom="fleche" taille={17} />
        </a>
      ) : (
        <span className="todo w-full text-center sm:w-auto">[À FOURNIR : lien WhatsApp du coach]</span>
      )}
    </section>
  )
}
