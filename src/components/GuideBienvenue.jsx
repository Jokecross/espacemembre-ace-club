import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import Icone from './Icone.jsx'
import { APP, JOURS_WORKSHOP, MARQUE, OUTIL } from '../lib/marque'

/**
 * Le guide de bienvenue : quelques cartes posées sur l'espace membre
 * assombri.
 *
 * L'élève vient de créer son accès. Avant d'atterrir sur la liste des
 * modules sans savoir par où commencer, on lui dit, une carte à la fois :
 * où il est, comment marche le workshop, et (s'il y en a une) la vidéo
 * d'introduction. La vidéo n'est pas obligatoire : c'est la fin du guide
 * qui ouvre le programme.
 */
export default function GuideBienvenue({ etat, onFini }) {
  // Sans vidéo d'introduction en base, le guide s'arrête au workshop.
  const avecVideo = (etat.lecons_intro || []).length > 0
  const total = avecVideo ? 3 : 2
  const [etape, setEtape] = useState(Math.min(etat.etape || 0, total - 1))

  const avancer = useCallback((suivante) => {
    setEtape(suivante)
    supabase.rpc('guide_avancer', { p_etape: suivante, p_prompt_recu: null })
  }, [])

  async function terminer() {
    await supabase.rpc('guide_termine')
    onFini()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-canvas/70">
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-6">
        <div className="card w-full max-w-xl border-line-strong p-6 shadow-lift sm:p-9">
          <Compteur etape={etape} total={total} />

          {etape === 0 && <Bienvenue prenom={etat.prenom} onSuivant={() => avancer(1)} />}
          {etape === 1 && <Workshop onSuivant={avecVideo ? () => avancer(2) : terminer} dernier={!avecVideo} />}
          {etape === 2 && avecVideo && <Video lecons={etat.lecons_intro || []} onFini={terminer} />}
        </div>
      </div>
    </div>
  )
}

/* ---------- Le compteur, commun aux cartes ---------- */

function Compteur({ etape, total }) {
  return (
    <div className="flex items-center gap-3">
      <span className="eyebrow">
        Étape {etape + 1} / {total}
      </span>
      <span className="flex flex-1 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 -skew-x-12 rounded-[1px] transition-colors duration-300 ${
              i <= etape ? 'bg-accent' : 'bg-line-strong'
            }`}
          />
        ))}
      </span>
    </div>
  )
}

/* ---------- 1. La bienvenue ---------- */

function Bienvenue({ prenom, onSuivant }) {
  return (
    <>
      <h1 className="mt-6 text-[26px] leading-tight sm:text-[32px]">
        Bienvenue dans <span className="mot-cle">{MARQUE}</span>
        {prenom ? `, ${prenom}` : ''}.
      </h1>

      <p className="mt-4 text-[15px] leading-relaxed">
        Ton accès est ouvert. Ici, tu trouves ton workshop de {JOURS_WORKSHOP} jours, les modules
        vidéo de ta formule et ton coach IA.
      </p>

      <p className="mt-3 text-[15px] leading-relaxed">
        Ce guide prend une minute : il te montre par où commencer. Ensuite, tout l'espace est à
        toi.
      </p>

      <button onClick={onSuivant} className="btn mt-7 w-full">
        Commencer
        <Icone nom="fleche" taille={18} />
      </button>
    </>
  )
}

/* ---------- 2. Le workshop ---------- */

function Workshop({ onSuivant, dernier }) {
  return (
    <>
      <h1 className="mt-6 text-[26px] leading-tight sm:text-[32px]">
        Ton workshop
        <br />
        en <span className="mot-cle">{JOURS_WORKSHOP} jours</span>.
      </h1>

      <p className="mt-4 text-[15px] leading-relaxed">
        Ton jour 1 est ouvert dès maintenant. Ensuite, un nouveau jour s'ouvre chaque nuit à
        minuit : ton offre, ton {APP} dans {OUTIL}, tes prospects, tes messages, puis ton
        rendez-vous.
      </p>

      <p className="mt-3 text-[15px] leading-relaxed">
        Reviens chaque jour : chaque étape sert la suivante.
      </p>

      <div className="mt-5 rounded-[14px] border border-accent/45 bg-panel p-5">
        <p className="font-title font-bold text-navy">Tes modules vidéo s'ouvrent au fil des jours</p>
        <p className="mt-1.5 text-[15px] leading-relaxed">
          Les premiers sont accessibles tout de suite, les autres de ta formule arrivent quelques
          jours plus tard. Ceux des autres offres restent visibles, avec le nom de l'offre qui les
          contient.
        </p>
      </div>

      <button onClick={onSuivant} className="btn mt-7 w-full">
        {dernier ? 'Entrer dans mon espace' : 'Suivant'}
        <Icone nom="fleche" taille={18} />
      </button>
    </>
  )
}

/* ---------- 3. La vidéo d'introduction ---------- */

function Video({ lecons, onFini }) {
  const [n, setN] = useState(0)
  const [source, setSource] = useState(null)
  const [erreur, setErreur] = useState(null)
  const cadre = useRef(null)

  const lecon = lecons[n]
  // S'il n'y a pas d'introduction en base, le guide ne doit pas enfermer
  // l'élève devant un cadre vide.
  const sansVideo = !lecon
  const derniere = n >= lecons.length - 1

  useEffect(() => {
    if (sansVideo) return
    setSource(null)
    setErreur(null)
    let vivant = true
    supabase.auth.getSession().then(async ({ data: s }) => {
      try {
        const res = await fetch(`/api/video-token?lessonId=${lecon.id}`, {
          headers: { Authorization: `Bearer ${s.session.access_token}` },
        })
        if (!vivant) return
        if (!res.ok) throw new Error('indisponible')
        setSource(await res.json())
      } catch {
        if (vivant) setErreur("La vidéo n'a pas pu être chargée.")
      }
    })
    return () => {
      vivant = false
    }
  }, [lecon, sansVideo])

  // Vimeo et Loom annoncent la fin par un message de la fenêtre. On
  // s'abonne auprès du lecteur, puis on écoute.
  useEffect(() => {
    if (source?.kind !== 'lecteur') return

    function abonner() {
      for (const value of ['ready', 'ended', 'finish']) {
        try {
          cadre.current?.contentWindow?.postMessage(
            JSON.stringify({ method: 'addEventListener', value }),
            '*',
          )
        } catch {
          /* le lecteur n'est pas encore prêt : le message suivant le trouvera */
        }
      }
    }

    function ecouter(e) {
      if (!/vimeo|loom/.test(e.origin)) return
      let d = e.data
      if (typeof d === 'string') {
        try {
          d = JSON.parse(d)
        } catch {
          return
        }
      }
      const nom = d?.event || d?.type
      if (nom === 'ready') return abonner()
      if (nom === 'ended' || nom === 'finish') marquerVue()
    }

    window.addEventListener('message', ecouter)
    const t = setTimeout(abonner, 1200)
    return () => {
      window.removeEventListener('message', ecouter)
      clearTimeout(t)
    }
  }, [source])

  // La vidéo n'ouvre plus rien, mais la regarder jusqu'au bout doit rester
  // visible dans la progression de l'élève.
  async function marquerVue() {
    if (!lecon) return
    const { data: s } = await supabase.auth.getSession()
    await supabase
      .from('lesson_progress')
      .upsert(
        { lesson_id: lecon.id, member_id: s.session.user.id },
        { onConflict: 'member_id,lesson_id', ignoreDuplicates: true },
      )
  }

  return (
    <>
      <h1 className="mt-6 text-[26px] leading-tight sm:text-[32px]">
        {lecon?.title || 'Introduction au programme'}
      </h1>

      <p className="mt-4 text-[15px] leading-relaxed">
        Dernière étape : {lecons.length > 1 ? 'ces vidéos t\'expliquent' : "cette vidéo t'explique"}{' '}
        comment le programme est construit et dans quel ordre avancer. Prends le temps de
        {lecons.length > 1 ? ' les ' : ' la '}regarder — tu la retrouveras dans ton espace
        quand tu voudras.
      </p>

      {lecons.length > 1 && (
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-muted">
          Vidéo {n + 1} sur {lecons.length}
        </p>
      )}

      {!sansVideo && (
        <div className="mt-5 aspect-video overflow-hidden rounded-[12px] bg-panel">
          {source?.kind === 'lecteur' ? (
            <iframe
              key={source.url}
              ref={cadre}
              src={source.url}
              title={lecon.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : source?.kind ? (
            <video
              key={source.url}
              src={source.url}
              controls
              controlsList="nodownload"
              onEnded={marquerVue}
              onContextMenu={(e) => e.preventDefault()}
              className="h-full w-full"
            />
          ) : (
            <div className="grid h-full place-items-center px-6 text-center text-sm text-ink">
              {erreur || 'Préparation de la vidéo…'}
            </div>
          )}
        </div>
      )}

      <button onClick={onFini} className="btn mt-6 w-full">
        Accéder à mon espace membre
        <Icone nom="fleche" taille={18} />
      </button>

      {lecons.length > 1 && !derniere && (
        <button
          onClick={() => setN(n + 1)}
          className="mx-auto mt-3 block text-xs font-semibold text-muted underline"
        >
          Passer à la vidéo suivante
        </button>
      )}
    </>
  )
}
