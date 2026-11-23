import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Icone from '../components/Icone.jsx'
import Capture from '../components/CaptureJour.jsx'
import Compte from '../components/CompteJour.jsx'
import PromptCopie from '../components/PromptCopie.jsx'
import { etapesDuJour, useWorkshop } from '../lib/useWorkshop.js'
import { lecteur } from '../lib/lecteur.js'
import { JOURS, SECOURS } from '../lib/parcours.js'
import { JOURS_WORKSHOP, OUTIL } from '../lib/marque'

/**
 * Une page par jour, toujours dans le même ordre : le titre, ce qu'on fait
 * aujourd'hui, la vidéo, les étapes, le ou les prompts, les consignes, puis
 * la capture.
 *
 * Tout le contenu vient de la base (`mon_workshop`), qui ne le renvoie que
 * pour un jour ouvert. Il se remplit dans le back-office, onglet
 * « Workshop 10 jours ». Ce qui manque encore s'affiche en [À FOURNIR].
 */
export default function WorkshopJour() {
  const { n } = useParams()
  const num = Number(n)
  const page = JOURS.find((j) => j.jour === num)
  const { jours, recharger } = useWorkshop()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [num])

  if (!page) return <Navigate to="/workshop" replace />
  if (!jours) return <p className="text-muted">Chargement…</p>

  const j = jours.find((x) => x.jour === num)
  const ouvert = !!j?.ouvert
  const suivant = jours.find((x) => x.jour === num + 1)
  const etapes = etapesDuJour(j)
  const titre = j?.titre || page.titre
  const resume = j?.resume || page.resume

  return (
    <div className="max-w-[860px]">
      <Link
        to="/workshop"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-muted hover:text-navy"
      >
        <span className="rotate-180"><Icone nom="fleche" taille={15} /></span>
        Tous les jours
      </Link>

      <div className="mt-2 flex items-center gap-4">
        <span className={`jour-num ${ouvert ? 'atteint' : ''}`}>
          <small>Jour</small>
          <b>{num}</b>
        </span>
        <div className="min-w-0">
          <p className="eyebrow">Jour {num} sur {JOURS_WORKSHOP}</p>
          <h1 className="mt-1 text-[26px] sm:text-[36px]">{titre}</h1>
        </div>
      </div>

      {!ouvert ? (
        <div className="ligne-video verrou mt-6">
          <Icone nom="cadenas" taille={18} className="flex-none text-muted" />
          <p className="min-w-0 flex-1 text-sm">Ce jour n'est pas encore ouvert.</p>
          <Compte ouvreLe={j?.ouvre_le} />
        </div>
      ) : (
        <>
          <div className="mt-5">
            <p className="eyebrow">Aujourd'hui</p>
            <p className="mt-1.5 max-w-[68ch] text-[15.5px] leading-relaxed text-navy">{resume}</p>
          </div>

          {j?.video_url ? (
            <div className="mt-5 aspect-video overflow-hidden rounded-[14px] border border-line bg-black">
              <iframe
                src={lecteur(j.video_url)}
                title={`Jour ${num}`}
                allow="fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <div className="mt-5 grid aspect-video place-items-center rounded-[14px] border border-dashed border-line-strong bg-surface px-6 text-center">
              <span className="todo">[À FOURNIR : vidéo du jour {num}]</span>
            </div>
          )}

          <Etapes items={etapes} num={num} />

          {j?.prompt ? (
            <PromptCopie id={`PROMPT_J${num}`} titre={`Le prompt du jour ${num}`} avant={`À coller dans ${OUTIL}.`} texte={j.prompt} />
          ) : (
            <section className="mt-6 rounded-[14px] border border-dashed border-accent/45 bg-surface p-4 sm:p-5">
              <h3 className="text-[16px] font-bold">Le prompt du jour {num}</h3>
              <p className="mt-2"><span className="todo">[À FOURNIR : prompt du jour {num}, à coller dans le back-office]</span></p>
            </section>
          )}
          {j?.prompt_2 && (
            <PromptCopie id={`PROMPT_J${num}_2`} titre={j.prompt_2_titre || `Deuxième prompt du jour ${num}`} texte={j.prompt_2} />
          )}

          {j?.consignes && (
            <div className="mt-6 rounded-xl border border-line-strong bg-surface p-4">
              <b className="block font-title text-[14.5px] font-bold text-navy">Avant demain</b>
              <span className="mt-0.5 block whitespace-pre-line text-sm">{j.consignes}</span>
            </div>
          )}

          <Capture key={num} jour={num} deja={j?.capture_faite} onDepose={recharger} />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {SECOURS.prompts.length > 0 ? (
              <Link
                to="/workshop/si-ca-ne-marche-pas"
                className="inline-flex min-h-[44px] items-center text-[13px] font-semibold text-muted underline underline-offset-2 hover:text-navy"
              >
                Ça coince ? Va dans « Si ça ne marche pas »
              </Link>
            ) : (
              <span />
            )}
            {suivant?.ouvert && num < JOURS_WORKSHOP && (
              <Link to={`/workshop/jour/${num + 1}`} className="btn w-full sm:w-auto">
                Jour {num + 1}
                <Icone nom="fleche" taille={18} />
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/** Les étapes, numérotées et reliées : on voit d'un coup d'œil le chemin. */
function Etapes({ items, num }) {
  return (
    <div className="mt-5 rounded-[14px] border border-line bg-surface p-4 sm:p-5">
      <h3 className="text-[15px] font-bold">Les étapes</h3>
      {!items.length ? (
        <p className="mt-3"><span className="todo">[À FOURNIR : les étapes du jour {num}]</span></p>
      ) : (
        <ol className="mt-4">
          {items.map((texte, i) => (
            <li key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
              {i < items.length - 1 && (
                <span aria-hidden="true" className="absolute bottom-0 left-[16px] top-8 w-px bg-line-strong" />
              )}
              <span className="num-video !h-[30px] !w-[34px] !text-[13px]">{i + 1}</span>
              <p className="min-w-0 flex-1 pt-[4px] text-[14.5px] leading-relaxed text-navy">{texte}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
