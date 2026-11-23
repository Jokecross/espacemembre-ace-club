import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Icone from './Icone.jsx'
import { ACCOMPAGNEMENT } from '../lib/marque'

/**
 * La proposition de rejoindre l'accompagnement ACE Club.
 *
 * [À VALIDER avec le client : à quel moment et comment]. Aujourd'hui, elle
 * n'apparaît qu'une fois l'essentiel reçu : les 10 jours du workshop ouverts,
 * ou tous les modules de la formule vus. Avant, une offre mise en avant au
 * milieu du programme donnerait une cible à l'objection « où est le piège ? ».
 *
 * Le texte vient de la table `prochaines_etapes` (back-office, onglet
 * Accompagnement), éteinte au départ. Sans ligne en base, on retombe sur
 * `ACCOMPAGNEMENT` (src/lib/marque.js). Aucun prix, aucun chiffre de revenus,
 * aucune promesse de gain : ni ici, ni dans le back-office.
 */
export default function CarteAccompagnement({ visible }) {
  const [offre, setOffre] = useState(undefined)

  useEffect(() => {
    if (!visible) return
    supabase
      .from('prochaines_etapes')
      .select('actif, eyebrow, titre, texte, cta_libelle, cta_url, note')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return setOffre(DEFAUT)
        setOffre(data.actif ? data : null)
      })
  }, [visible])

  if (!visible || !offre) return null
  const lien = offre.cta_url && offre.cta_url !== '#' ? offre.cta_url : null

  return (
    <section className="carte-phare mt-10">
      <p className="eyebrow flex items-center gap-2">
        <Icone nom="groupe" taille={15} className="text-accent" />
        {offre.eyebrow || ACCOMPAGNEMENT.eyebrow}
      </p>

      <h2 className="mt-3 max-w-2xl pr-10 text-[24px] sm:text-[30px]">{offre.titre}</h2>

      {offre.texte && (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed">
          {aRemplir(offre.texte) ? <span className="todo">{offre.texte}</span> : offre.texte}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        {lien ? (
          <a href={lien} target="_blank" rel="noopener" className="btn w-full sm:w-auto">
            {offre.cta_libelle}
            <Icone nom="fleche" taille={18} />
          </a>
        ) : (
          <span className="todo">[À FOURNIR : lien de l'accompagnement]</span>
        )}
        {offre.note && (
          <span className={aRemplir(offre.note) ? 'todo' : 'text-sm text-muted'}>{offre.note}</span>
        )}
      </div>
    </section>
  )
}

/** Un emplacement pas encore rempli : « [À FOURNIR…] », « [À VALIDER…] ». */
const aRemplir = (t) => /^\[À (FOURNIR|VALIDER)/.test(t || '')

const DEFAUT = {
  actif: true,
  eyebrow: ACCOMPAGNEMENT.eyebrow,
  titre: ACCOMPAGNEMENT.titre,
  texte: ACCOMPAGNEMENT.texte,
  cta_libelle: ACCOMPAGNEMENT.bouton,
  cta_url: ACCOMPAGNEMENT.lien,
  note: '[À VALIDER avec le client : à quel moment et comment]',
}
