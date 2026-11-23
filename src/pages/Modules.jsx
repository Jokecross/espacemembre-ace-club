import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import Icone from '../components/Icone.jsx'
import Anneau from '../components/Anneau.jsx'
import CarteAction from '../components/CarteAction.jsx'
import CarteCoach from '../components/CarteCoach.jsx'
import BandeOutils from '../components/BandeOutils.jsx'
import CarteAccompagnement from '../components/CarteAccompagnement.jsx'
import ProgrammeVerrouille, { useEtatWorkshop } from '../components/ProgrammeVerrouille.jsx'
import { chargerProgramme } from '../lib/programme.js'
import { JOURS_WORKSHOP } from '../lib/marque.js'

/**
 * La page d'accueil de l'élève.
 *
 * L'ordre suit la priorité, pas l'historique des ajouts : où j'en suis, quoi
 * faire maintenant, le coach, mes outils, mon programme, le reste. Un seul
 * bloc porte le poids visuel — la carte d'action — et tout le reste
 * s'efface derrière.
 */
export default function Modules({ member }) {
  const [modules, setModules] = useState(null)
  const [ouvert, setOuvert] = useState(null)
  const etat = useEtatWorkshop(true)

  const charger = useCallback(() => {
    // my_modules() renvoie déjà le pourcentage et l'état du verrou, calculés
    // côté base ; chargerProgramme y ajoute les modules des autres offres.
    chargerProgramme().then(({ modules: data }) => {
      setModules(data)
      const suite = data.filter((m) => !m.is_intro && !m.is_bonus && !m.hors_formule)
      const prochain = suite.find((m) => m.unlocked && m.completion < 1)
      setOuvert((avant) => avant ?? prochain?.id ?? suite[0]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    charger()
  }, [charger])

  if (!modules) return <p className="text-muted">Chargement du programme…</p>

  const intros = modules.filter((m) => m.is_intro)
  const programme = modules.filter((m) => !m.is_intro && !m.is_bonus)
  // Les modules de la formule de l'élève : eux seuls comptent dans sa
  // progression. Les autres sont affichés, fermés, avec leur offre.
  const parcours = programme.filter((m) => !m.hors_formule)
  const bonus = modules.filter((m) => m.is_bonus)
  // Pourquoi un module de la formule est fermé : le jour de déblocage pas
  // encore atteint.
  const raison =
    etat && !etat.equipe && !etat.dispense && etat.jour < etat.jour_deblocage
      ? `S'ouvre au jour ${etat.jour_deblocage} de ton workshop`
      : 'Pas encore ouvert'
  const faits = parcours.filter((m) => m.completion >= 1).length
  const termine = parcours.length > 0 && faits === parcours.length
  const avancement = parcours.length ? faits / parcours.length : 0
  const workshopOuvert = etat && !etat.equipe && etat.jour >= JOURS_WORKSHOP

  const resteDuProgramme =
    etat && !etat.dispense && !etat.equipe && etat.jour < etat.jour_deblocage

  const premierHors = programme.findIndex((m) => m.hors_formule)

  return (
    <>
      {/* ---------- Où j'en suis ---------- */}
      <div className="flex items-center gap-4 sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{dateDuJour()}</p>
          <h1 className="mt-2 text-[30px] sm:text-[40px]">
            Bonjour{member?.first_name ? <> <span className="mot-cle">{member.first_name}</span></> : ''}
          </h1>
        </div>

        {/* Sur téléphone : un seul anneau à côté du titre. Sur ordinateur :
            les deux compteurs, détaillés. */}
        <Anneau
          valeur={avancement}
          taille={58}
          texte={`${Math.round(avancement * 100)}%`}
          className="sm:hidden"
        />

        <div className="hidden items-center gap-6 sm:flex">
          <Compteur
            valeur={avancement}
            titre="Programme"
            detail={`${faits} / ${parcours.length} modules`}
            texte={`${Math.round(avancement * 100)}%`}
          />
          {etat && !etat.dispense && !etat.equipe && (
            <>
              <span className="h-10 w-px bg-line" />
              <Compteur
                valeur={etat.jour / JOURS_WORKSHOP}
                titre="Ton workshop"
                detail={etat.jour >= JOURS_WORKSHOP ? 'Tous les jours ouverts' : `Jour ${etat.jour} sur ${JOURS_WORKSHOP}`}
                texte={`${etat.jour}/${JOURS_WORKSHOP}`}
              />
            </>
          )}
        </div>
      </div>

      {/* Deux tuiles chiffrées, seulement sur téléphone */}
      <div className="mt-4 flex gap-2.5 sm:hidden">
        <TuileChiffre titre="Programme" valeur={faits} total={parcours.length} />
        {etat && !etat.dispense && !etat.equipe && (
          <TuileChiffre titre="Workshop" valeur={`J${etat.jour}`} total={JOURS_WORKSHOP} />
        )}
      </div>

      {/* ---------- Quoi faire maintenant ---------- */}
      <CarteAction
        etat={etat}
        intros={intros}
        parcours={parcours}
        introFaite
        onOuvrirModule={(id) => {
          setOuvert(id)
          document.getElementById(`module-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
      />

      {/* ---------- Le coach IA ---------- */}
      <CarteCoach />

      {/* ---------- Les outils ---------- */}
      <BandeOutils />

      {/* ---------- Le programme ---------- */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Ton espace</p>
            <h2 className="mt-1.5 text-[24px] sm:text-[28px]">
              Ton <span className="mot-cle">programme</span>
            </h2>
          </div>
          <p className="text-[13px] text-muted">
            <b className="font-display text-navy">{faits}</b> / {parcours.length} modules terminés
          </p>
        </div>

        {resteDuProgramme && (
          <div className="mt-4">
            <ProgrammeVerrouille etat={etat} />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-3">
          {programme.map((m, i) => (
            <div key={m.id} className="contents">
              {i === premierHors && <SeparateurOffres />}
              <CarteModule
                id={`module-${m.id}`}
                module={m}
                numero={i + 1}
                raison={raison}
                ouvert={ouvert === m.id}
                onToggle={() => setOuvert(ouvert === m.id ? null : m.id)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Les bonus ---------- */}
      {bonus.length > 0 && (
        <section className="mt-10">
          <p className="eyebrow">Bonus</p>
          <h2 className="mt-1.5 text-[20px]">Vidéos bonus</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Du plus, à regarder en complément : l'essentiel reste ton workshop et les modules de
            ton programme.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {bonus.map((m) =>
              m.unlocked ? (
                <section key={m.id} id={`module-${m.id}`} className="card overflow-hidden pt-2.5">
                  <ListeLecons moduleId={m.id} />
                </section>
              ) : (
                <div key={m.id} className="ligne-video verrou">
                  <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-xl bg-panel text-muted">
                    <Icone nom="cadenas" taille={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-title text-[15px] font-bold text-muted">
                      {m.lesson_count} vidéo{m.lesson_count > 1 ? 's' : ''} bonus
                    </b>
                    <span className="text-[13px] text-muted">{raison}</span>
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <CarteAccompagnement visible={termine || workshopOuvert} />
    </>
  )
}

/** Entre les modules de la formule et ceux des autres offres. */
function SeparateurOffres() {
  return (
    <div className="mt-5 flex items-center gap-3 px-1">
      <span className="barres" aria-hidden="true" />
      <p className="text-[13px] font-semibold text-navy">
        Dans les autres offres
        <span className="ml-2 font-normal text-muted">Ces modules ne sont pas dans ta formule.</span>
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Compteur({ valeur, titre, detail, texte, couleur }) {
  return (
    <div className="flex items-center gap-3">
      <Anneau valeur={valeur} taille={52} texte={texte} couleur={couleur} />
      <span className="text-[13px] leading-tight text-muted">
        {titre}
        <b className="block font-title text-[15px] font-semibold text-navy">{detail}</b>
      </span>
    </div>
  )
}

function TuileChiffre({ titre, valeur, total }) {
  return (
    <div className="card flex-1 px-3.5 py-3">
      <p className="eyebrow">{titre}</p>
      <p className="mt-1 font-display text-[19px] font-extrabold text-navy" style={{ fontStretch: '112%' }}>
        {valeur}
        <span className="text-[13px] text-muted"> / {total}</span>
      </p>
    </div>
  )
}

function CarteModule({ id, module: m, numero, raison, ouvert, onToggle }) {
  const part = Number(m.completion) || 0
  const fini = part >= 1
  const navigate = useNavigate()
  // Un module d'une seule vidéo : un appui l'ouvre, sans liste à déplier.
  const uneVideo = Number(m.lesson_count) === 1
  const num = String(numero).padStart(2, '0')

  async function ouvrirVideo() {
    const { data } = await supabase.from('lessons').select('id').eq('module_id', m.id).limit(1).maybeSingle()
    if (data) navigate(`/lecon/${data.id}`)
  }

  if (!m.unlocked) {
    // Un module d'une autre offre : on dit laquelle le débloque.
    const pourquoi = m.hors_formule
      ? m.offre
        ? <>Inclus dans l'offre <b className="font-semibold text-ink">{m.offre}</b></>
        : "Pas dans ta formule"
      : raison
    return (
      <div id={id} className="ligne-video verrou">
        <span className="num-video">{num}</span>
        <span className="min-w-0 flex-1">
          <b className="block font-title text-[15px] font-semibold text-muted sm:text-[16px]">{m.title}</b>
          <span className="text-[13px] text-muted">{pourquoi}</span>
        </span>
        <span className="rond-etat text-muted">
          <Icone nom="cadenas" taille={16} />
        </span>
      </div>
    )
  }

  const prochaine = ouvert && !fini

  return (
    <section id={id}>
      <button
        onClick={uneVideo ? ouvrirVideo : onToggle}
        className={`ligne-video ${prochaine ? 'prochaine' : ''}`}
      >
        <span className="num-video">{num}</span>

        <span className="min-w-0 flex-1">
          <b className="block font-title text-[15px] font-semibold text-navy sm:text-[16px]">{m.title}</b>
          <span className={`text-[13px] ${prochaine ? 'font-semibold text-navy' : 'text-muted'}`}>
            {uneVideo
              ? fini ? 'Vidéo vue' : prochaine ? 'Ta prochaine vidéo' : 'À regarder'
              : fini
              ? `${m.lesson_count} leçons · terminé`
              : `${m.done_count} leçon${m.done_count > 1 ? 's' : ''} sur ${m.lesson_count} · en cours`}
          </span>
        </span>

        {uneVideo ? (
          <span
            className={`rond-etat ${
              fini ? 'bg-success-bg text-success' : prochaine ? 'bg-accent text-on-accent' : 'border border-line-strong text-navy'
            }`}
          >
            <Icone nom={fini ? 'valide' : 'lecture'} taille={fini ? 16 : 15} epaisseur={2.2} />
          </span>
        ) : (
          <Anneau valeur={part} taille={38} epaisseur={4} texte="" />
        )}
      </button>

      {ouvert && !uneVideo && (
        <div className="card mt-2">
          <ListeLecons moduleId={m.id} />
        </div>
      )}
    </section>
  )
}

function ListeLecons({ moduleId }) {
  const [lignes, setLignes] = useState(null)

  useEffect(() => {
    let vivant = true
    Promise.all([
      supabase
        .from('lessons')
        .select('id, position, title, duration_seconds')
        .eq('module_id', moduleId)
        .order('position'),
      supabase.from('lesson_progress').select('lesson_id'),
    ]).then(([lecons, progres]) => {
      if (!vivant) return
      const vues = new Set((progres.data || []).map((p) => p.lesson_id))
      setLignes((lecons.data || []).map((l) => ({ ...l, vue: vues.has(l.id) })))
    })
    return () => {
      vivant = false
    }
  }, [moduleId])

  if (!lignes) return <p className="px-5 pb-5 text-sm text-muted">Chargement…</p>

  // La leçon à reprendre : la première non vue.
  const suivante = lignes.find((l) => !l.vue)?.id

  return (
    <div className="px-2.5 pb-3 sm:px-3">
      {lignes.map((l, i) => {
        const active = l.id === suivante
        return (
          <Link
            key={l.id}
            to={`/lecon/${l.id}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
              active ? 'bg-accent-pastel' : 'hover:bg-panel'
            }`}
          >
            <span
              className={`grid h-6 w-6 flex-none place-items-center rounded-full ${
                l.vue ? 'bg-success-bg text-success' : active ? 'bg-accent text-on-accent' : 'bg-canvas text-muted'
              }`}
            >
              {l.vue ? (
                <Icone nom="valide" taille={13} epaisseur={2.4} />
              ) : active ? (
                <Icone nom="lecture" taille={13} />
              ) : (
                <span className="text-[11px] font-bold">{i + 1}</span>
              )}
            </span>

            <span
              className={`min-w-0 flex-1 text-[14px] ${
                active ? 'font-bold text-navy' : l.vue ? 'text-ink' : 'text-muted'
              }`}
            >
              {l.title}
            </span>

            {l.duration_seconds > 0 && (
              <span className="flex-none text-xs text-muted">
                {Math.round(l.duration_seconds / 60)} min
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

function dateDuJour() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
