import { Link } from 'react-router-dom'
import Icone from '../components/Icone.jsx'
import Anneau from '../components/Anneau.jsx'
import Compte from '../components/CompteJour.jsx'
import CarteCoach from '../components/CarteCoach.jsx'
import { useEtatWorkshop } from '../components/ProgrammeVerrouille.jsx'
import { useWorkshop } from '../lib/useWorkshop.js'
import { lecteur } from '../lib/lecteur.js'
import { COMMENT_CA_MARCHE, JOURS, SECOURS } from '../lib/parcours.js'
import { JOURS_WORKSHOP, OUTIL } from '../lib/marque'

/**
 * Le workshop de 10 jours : l'accueil du parcours, puis une page par jour
 * (`WorkshopJour.jsx`).
 *
 * Un jour s'ouvre à minuit chez l'élève. C'est la base qui le décide
 * (`mon_workshop`), pas le navigateur : le contenu d'un jour à venir n'est
 * tout simplement pas renvoyé. Changer l'heure de son ordinateur ne donne
 * rien. Le jour 1 s'ouvre dès l'inscription.
 */
export default function Workshop() {
  const { jours, reglages } = useWorkshop()
  const etat = useEtatWorkshop(true)

  if (!jours) return <p className="text-muted">Chargement…</p>

  const faits = jours.filter((j) => j.ouvert).length
  const parJour = new Map(jours.map((j) => [j.jour, j]))

  // L'introduction n'est pas vue : c'est elle qui retient tout. On le dit
  // ici, en grand.
  const introAFaire = etat && !etat.intro_ok && !etat.dispense && !etat.equipe

  return (
    <>
      <p className="eyebrow">Ton workshop</p>
      <h1 className="mt-2 text-[30px] sm:text-[40px]">
        Ton workshop en <span className="mot-cle">{JOURS_WORKSHOP} jours</span>
      </h1>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed">
        Un jour à la fois, dans {OUTIL} puis sur le terrain : ton offre, ton site, tes prospects,
        ton rendez-vous.
      </p>

      <section className="carte-phare mt-6">
        <h2 className="pr-12 text-[21px] sm:text-[24px]">Comment ça marche</h2>
        <ul className="mt-3.5 space-y-2.5">
          {COMMENT_CA_MARCHE.map((point) => (
            <li key={point} className="flex gap-3 text-[14.5px] leading-relaxed text-navy">
              <span aria-hidden="true" className="mt-[9px] h-[6px] w-3 flex-none -skew-x-12 rounded-[1px] bg-accent" />
              <span className="min-w-0">
                {point.startsWith('[') ? <span className="todo">{point}</span> : point}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {introAFaire ? (
        <section className="carte-phare mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="min-w-0 flex-1">
              <h2 className="text-[20px] sm:text-[22px]">Regarde ton introduction</h2>
              <p className="mt-2 max-w-[46ch] text-[15px] leading-relaxed">
                Quelques minutes de vidéo pour bien démarrer ton workshop.
              </p>
            </div>
            <Link to="/" className="btn whitespace-nowrap">
              Regarder l'introduction
              <Icone nom="fleche" taille={18} />
            </Link>
          </div>
        </section>
      ) : (
        <div className="card mt-6 flex flex-wrap items-center gap-4 p-5">
          <Anneau valeur={faits / JOURS_WORKSHOP} taille={48} texte={faits} />
          <p className="min-w-0 flex-1 text-sm">
            <b className="block font-title text-[15px] font-bold text-navy">
              {faits >= JOURS_WORKSHOP ? `Tes ${JOURS_WORKSHOP} jours sont ouverts` : `Tu en es au jour ${faits} sur ${JOURS_WORKSHOP}`}
            </b>
            <span className="text-muted">
              {faits >= JOURS_WORKSHOP
                ? 'Tu peux avancer à ton rythme.'
                : 'Le jour suivant s’ouvre cette nuit, à minuit.'}
            </span>
          </p>
        </div>
      )}

      {reglages?.video_systeme_url && <VideoSysteme url={reglages.video_systeme_url} />}

      <ol className="relative mt-7 flex flex-col gap-3">
        {/* Le rail de la page de vente, qui relie les dix jours. */}
        <span aria-hidden="true" className="absolute bottom-6 left-[28px] top-6 w-[2px] bg-line-strong" />
        {JOURS.map((page) => {
          const j = parJour.get(page.jour)
          return (
            <CarteJour
              key={page.jour}
              numero={page.jour}
              titre={j?.titre || page.titre}
              resume={j?.resume || page.resume}
              ouvert={!!j?.ouvert}
              ouvreLe={j?.ouvre_le}
              capture={!!j?.capture_faite}
              phare={page.jour === faits}
            />
          )
        })}
      </ol>

      <div className="mt-8">
        <CarteCoach compact />
      </div>

      {SECOURS.prompts.length > 0 && (
        <Link to="/workshop/si-ca-ne-marche-pas" className="ligne-video mt-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-panel text-accent">
            <Icone nom="prompt" taille={20} />
          </span>
          <span className="min-w-0 flex-1">
            <b className="block font-title text-[15px] font-bold text-navy">Si ça ne marche pas</b>
            <span className="text-[13px] text-muted">De quoi te débloquer seul, à tout moment.</span>
          </span>
          <Icone nom="fleche" taille={18} className="flex-none text-navy" />
        </Link>
      )}
    </>
  )
}

function CarteJour({ numero, titre, resume, ouvert, ouvreLe, capture, phare }) {
  const pastille = (
    <span className={`jour-num relative z-[1] ${ouvert ? 'atteint' : ''}`}>
      <small>Jour</small>
      <b>{numero}</b>
    </span>
  )
  const texte = (
    <span className="min-w-0 flex-1">
      <b className={`block font-title text-[15.5px] font-bold ${ouvert ? 'text-navy' : 'text-muted'}`}>{titre}</b>
      <span className="line-clamp-2 text-[13.5px] text-muted">{resume}</span>
    </span>
  )

  if (!ouvert) {
    return (
      <li className="flex items-center gap-3 sm:gap-4">
        {pastille}
        <div className="ligne-video verrou min-h-[66px] flex-1">
          {texte}
          <Compte ouvreLe={ouvreLe} />
          <span className="rond-etat hidden text-muted sm:grid">
            <Icone nom="cadenas" taille={16} />
          </span>
        </div>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 sm:gap-4">
      {pastille}
      <Link to={`/workshop/jour/${numero}`} className={`ligne-video min-h-[66px] flex-1 ${phare ? 'prochaine' : ''}`}>
        {texte}
        {capture && <Icone nom="valide" taille={17} className="flex-none text-success" />}
        <span className={`rond-etat ${phare ? 'bg-accent text-on-accent' : 'border border-line-strong text-navy'}`}>
          <Icone nom="fleche" taille={16} />
        </span>
      </Link>
    </li>
  )
}

/** La vidéo à regarder avant le jour 1 : elle explique le workshop. */
function VideoSysteme({ url }) {
  return (
    <section className="carte-phare mt-6">
      <span className="pill pill-accent">
        <Icone nom="lecture" taille={14} /> À regarder d'abord
      </span>
      <h2 className="mt-3 text-[19px] sm:text-[22px]">Comment se passent les {JOURS_WORKSHOP} jours</h2>
      <div className="mt-4 aspect-video overflow-hidden rounded-[12px] bg-black">
        <iframe
          src={lecteur(url)}
          title="Vidéo : comment se passe le workshop"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    </section>
  )
}
