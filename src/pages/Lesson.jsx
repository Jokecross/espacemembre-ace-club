import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import OutilsSousVideo from '../components/OutilsSousVideo.jsx'
import SousVideo from '../components/SousVideo.jsx'
import Icone from '../components/Icone.jsx'
import { chargerProgramme } from '../lib/programme.js'

export default function Lesson() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [video, setVideo] = useState(null) // null = pas encore reçu ; { kind, url }
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  // Tout le programme de l'élève, pour la colonne de droite : savoir où on
  // en est et ce qui vient après compte autant que la vidéo elle-même.
  const [programme, setProgramme] = useState(null)

  useEffect(() => {
    let alive = true
    setVideo(null)
    setError('')

    // Si le module n'est pas débloqué, RLS ne renvoie rien : la leçon est
    // introuvable, et on repart à l'accueil.
    supabase
      .from('lessons')
      .select('id, title, module_id, position, avertissement, sous_video, modules(title, position)')
      .eq('id', lessonId)
      .maybeSingle()
      .then(async ({ data, error: dbError }) => {
        if (!alive) return
        // Une requête en erreur n'est pas une leçon absente : renvoyer à
        // l'accueil sans rien dire donnait l'impression que le clic ne
        // marchait pas, alors qu'il manquait une migration.
        if (dbError) {
          setError(`La leçon n'a pas pu être chargée : ${dbError.message}`)
          setLesson({ id: lessonId, title: 'Leçon indisponible', modules: null })
          return
        }
        if (!data) return navigate('/', { replace: true })
        setLesson(data)

        const { data: p } = await supabase
          .from('lesson_progress')
          .select('lesson_id')
          .eq('lesson_id', data.id)
          .maybeSingle()
        if (alive) setDone(!!p)

        const [{ modules: mods }, { data: liste }, { data: vues }] = await Promise.all([
          // Les modules des autres offres y sont aussi, fermés.
          chargerProgramme(),
          // RLS ne renvoie que les vidéos ouvertes : les autres restent
          // visibles dans la liste, mais sans lien.
          supabase.from('lessons').select('id, module_id, position, title, duration_seconds').order('position'),
          supabase.from('lesson_progress').select('lesson_id'),
        ])
        if (!alive) return
        const faites = new Set((vues || []).map((v) => v.lesson_id))
        setProgramme(
          (mods || [])
            .filter((m) => !m.is_intro && !m.is_bonus)
            .flatMap((m) => {
              const siennes = (liste || []).filter((l) => l.module_id === m.id)
              return siennes.length
                ? siennes.map((l) => ({ ...l, vue: faites.has(l.id), ouverte: true }))
                : [{ id: `module-${m.id}`, title: m.title, vue: false, ouverte: false, offre: m.hors_formule ? m.offre : null }]
            })
        )

        // L'URL de lecture est signée côté serveur et expire au bout de
        // trois heures : copiée ailleurs, elle ne sert plus très longtemps.
        const { data: s } = await supabase.auth.getSession()
        const res = await fetch(`/api/video-token?lessonId=${data.id}`, {
          headers: { Authorization: `Bearer ${s.session.access_token}` },
        })
        if (!alive) return
        if (res.ok) setVideo(await res.json())
        else setError((await res.json().catch(() => ({}))).error || "La vidéo n'est pas disponible pour l'instant.")
      })

    return () => {
      alive = false
    }
  }, [lessonId, navigate])

  async function toggleDone() {
    if (done) {
      await supabase.from('lesson_progress').delete().eq('lesson_id', lesson.id)
      setDone(false)
      marquer(false)
    } else {
      const { data: s } = await supabase.auth.getSession()
      await supabase
        .from('lesson_progress')
        .insert({ lesson_id: lesson.id, member_id: s.session.user.id })
      setDone(true)
      marquer(true)
    }
  }

  function marquer(vue) {
    setProgramme((p) => p?.map((l) => (String(l.id) === String(lesson.id) ? { ...l, vue } : l)) ?? p)
  }

  if (!lesson) return <p className="text-muted">Chargement…</p>

  // Le serveur a répondu, et il n'y a pas de vidéo : la leçon ne tient
  // qu'à son document.
  const sansVideo = !!video && !video.kind && !error

  const total = programme?.length || 0
  const faites = programme?.filter((l) => l.vue).length || 0
  const indice = programme?.findIndex((l) => String(l.id) === String(lesson.id)) ?? -1
  const precedente = indice > 0 ? programme[indice - 1] : null
  const suivante = indice >= 0 ? programme?.[indice + 1] : null
  const numero = indice >= 0 ? indice + 1 : lesson.modules?.position

  return (
    <>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-accent"
      >
        <span className="rotate-180">
          <Icone nom="fleche" taille={15} />
        </span>
        Retour à l'accueil
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
        {/* ---------- La vidéo ---------- */}
        <div className="min-w-0">
          <p className="eyebrow">
            Module {numero}
            {total > 0 && <span className="text-muted"> sur {total}</span>}
          </p>
          <h1 className="mt-2 text-[27px] leading-tight sm:text-[36px]">
            {lesson.title}
          </h1>

          {error && !lesson.modules && (
            <div className="card mt-5 border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {lesson.avertissement && (
            <div className="mt-5 flex gap-3 rounded-xl border border-accent/30 bg-accent/[.07] p-4">
              <p className="whitespace-pre-line text-sm font-semibold leading-relaxed text-navy">
                {lesson.avertissement}
              </p>
            </div>
          )}

          {/* Une leçon peut n'avoir qu'un document — une checklist, par
              exemple. Le serveur répond alors sans vidéo, et le cadre noir
              restait sur « Préparation de la vidéo… » indéfiniment. On ne
              l'affiche plus du tout dans ce cas. */}
          {!sansVideo && (
            <div className="mt-6 rounded-[16px] border border-line-strong bg-surface p-[5px]">
              <div className="aspect-video overflow-hidden rounded-[12px] bg-black">
                {video?.kind === 'lecteur' ? (
                  <iframe
                    key={video.url}
                    src={video.url}
                    title={lesson.title}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                ) : video?.kind ? (
                  <video
                    key={video.url}
                    src={video.url}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="h-full w-full"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3.5 bg-surface px-6 text-center">
                    {/pas encore de contenu/.test(error) ? (
                      <span className="todo">[À FOURNIR : vidéo du module {numero}]</span>
                    ) : (
                      <span className="text-sm text-muted">{error || 'Préparation de la vidéo…'}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Les actions : valider, puis avancer */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button onClick={toggleDone} className={`${done ? 'btn-ghost' : 'btn'} w-full sm:w-auto`}>
              {done ? (
                <>
                  <Icone nom="valide" taille={17} epaisseur={2.2} className="text-success" /> Leçon terminée
                </>
              ) : (
                "J'ai terminé cette leçon"
              )}
            </button>

            {video?.document && (
              <a href={video.document.url} target="_blank" rel="noopener" className="btn-ghost w-full sm:w-auto">
                <Icone nom="document" taille={17} />
                {video.document.name || 'Le document de la leçon'}
              </a>
            )}

            <div className="flex gap-3 sm:ml-auto">
              {precedente?.ouverte && (
                <Link to={`/lecon/${precedente.id}`} className="btn-ghost flex-1 sm:flex-none" aria-label="Module précédent">
                  <span className="rotate-180">
                    <Icone nom="fleche" taille={16} />
                  </span>
                  <span className="sm:hidden">Précédent</span>
                </Link>
              )}
              {suivante?.ouverte && (
                <Link to={`/lecon/${suivante.id}`} className="btn-ghost flex-1 sm:flex-none">
                  Module suivant <Icone nom="fleche" taille={16} />
                </Link>
              )}
            </div>
          </div>

          <SousVideo blocs={lesson.sous_video} />

          <OutilsSousVideo />
        </div>

        {/* ---------- Le programme, à droite ---------- */}
        {programme && programme.length > 1 && (
          <aside className="min-w-0">
            <div className="card p-4 sm:p-5 lg:sticky lg:top-8">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <b className="font-display text-[17px] font-extrabold text-navy" style={{ fontStretch: '112%' }}>
                  Ton programme
                </b>
                <span className="text-xs font-semibold text-muted">
                  <span className="text-navy">{faites}</span> / {total}
                </span>
              </div>

              <span className="mx-1 mt-3 block h-1 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full bg-accent transition-[width] duration-500"
                  style={{ width: `${total ? (faites / total) * 100 : 0}%` }}
                />
              </span>

              <div className="mt-3 flex max-h-[420px] flex-col gap-0.5 overflow-y-auto pr-1 lg:max-h-[calc(100vh-190px)]">
                {programme.map((l, i) => {
                  const actuelle = String(l.id) === String(lesson.id)
                  const contenu = (
                    <>
                      <span
                        className={`w-7 flex-none font-display text-[14px] font-extrabold leading-none ${
                          l.ouverte ? 'text-accent' : 'text-muted/60'
                        }`}
                        style={{ fontStretch: '112%' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`min-w-0 flex-1 text-[13.5px] leading-snug ${
                          actuelle
                            ? 'font-semibold text-navy'
                            : l.ouverte
                              ? 'text-ink'
                              : 'text-muted/60'
                        }`}
                      >
                        {l.title}
                        {l.offre && <span className="block text-[11.5px] text-muted/80">Offre {l.offre}</span>}
                      </span>
                      {!l.ouverte ? (
                        <Icone nom="cadenas" taille={14} className="flex-none text-muted/50" />
                      ) : l.vue ? (
                        <Icone nom="valide" taille={15} epaisseur={2.4} className="flex-none text-accent" />
                      ) : actuelle ? (
                        <Icone nom="lecture" taille={13} className="flex-none text-accent" />
                      ) : l.duration_seconds > 0 ? (
                        <span className="flex-none text-[11px] text-muted">
                          {Math.round(l.duration_seconds / 60)} min
                        </span>
                      ) : null}
                    </>
                  )
                  const classes = `flex items-center gap-2.5 rounded-xl px-2 py-2.5 transition ${
                    actuelle ? 'bg-accent-pastel' : l.ouverte ? 'hover:bg-panel' : ''
                  }`
                  return l.ouverte ? (
                    <Link key={l.id} to={`/lecon/${l.id}`} className={classes}>
                      {contenu}
                    </Link>
                  ) : (
                    <div key={l.id} className={classes}>
                      {contenu}
                    </div>
                  )
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  )
}
