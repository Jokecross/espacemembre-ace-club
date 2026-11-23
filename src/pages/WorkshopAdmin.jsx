import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { JOURS, SECOURS } from '../lib/parcours.js'
import { JOURS_WORKSHOP, OUTIL } from '../lib/marque'

/**
 * Le back-office du workshop : le contenu des dix jours, et les réglages
 * qui décident du rythme.
 *
 * Tout le contenu vit ici et pas dans le code : changer une vidéo, une
 * étape ou un prompt ne demande ni déploiement ni développeur. Et un prompt
 * n'entre jamais dans le dépôt.
 */
export default function WorkshopAdmin() {
  const [jours, setJours] = useState(null)
  const [reglages, setReglages] = useState(null)
  const [ouvert, setOuvert] = useState(null)
  const [erreur, setErreur] = useState('')

  async function charger() {
    const [{ data: j, error }, { data: r }] = await Promise.all([
      supabase.from('workshop_jours').select('*').order('jour'),
      supabase.from('workshop_reglages').select('*').eq('id', 1).maybeSingle(),
    ])
    setErreur(error ? error.message : '')
    setJours(j || [])
    setReglages(r)
  }

  useEffect(() => {
    charger()
  }, [])

  if (!jours) return <p className="text-muted">Chargement…</p>

  const remplis = jours.filter((j) => j.prompt).length

  return (
    <>
      {reglages && <Reglages reglages={reglages} onChange={charger} />}

      <h2 className="mt-8 text-lg">Les {JOURS_WORKSHOP} jours</h2>
      <p className="mt-1 text-sm">
        Le jour 1 s'ouvre dès l'inscription, puis un nouveau jour à chaque minuit, à l'heure de
        l'élève. Pour chaque jour : le résumé, les étapes, le ou les prompts, une vidéo et les
        consignes. <b className="text-navy">{remplis} / {JOURS_WORKSHOP}</b> jours ont leur prompt.
      </p>

      {erreur && <p className="mt-3 text-sm font-semibold text-red-600">La base ne répond pas : {erreur}</p>}
      {!erreur && !jours.length && (
        <p className="mt-3 text-sm text-muted">
          Aucun jour en base : passe d'abord <code>INSTALLATION.sql</code> du CRM ACE Club.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {jours.map((j) => (
          <JourAdmin
            key={j.jour}
            jour={j}
            ouvert={ouvert === j.jour}
            onToggle={() => setOuvert(ouvert === j.jour ? null : j.jour)}
            onSave={charger}
          />
        ))}
      </div>
    </>
  )
}

function Reglages({ reglages, onChange }) {
  const [form, setForm] = useState(reglages)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState('')
  const [ok, setOk] = useState(false)

  async function enregistrer(e) {
    e.preventDefault()
    setBusy(true)
    setErreur('')
    const champs = {
      modules_avant_j3: Number(form.modules_avant_j3),
      jour_deblocage: Number(form.jour_deblocage),
      video_systeme_url: form.video_systeme_url?.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (SECOURS.prompts.length) champs.prompts_sos = form.prompts_sos
    const { error } = await supabase.from('workshop_reglages').update(champs).eq('id', 1)
    setBusy(false)
    if (error) return setErreur(`Enregistrement impossible : ${error.message}`)
    setOk(true)
    setTimeout(() => setOk(false), 2500)
    onChange()
  }

  return (
    <form onSubmit={enregistrer} className="card space-y-4 p-5">
      <h2 className="text-lg">Le rythme</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-bold text-navy">Modules ouverts avant le déblocage</span>
          <span className="mt-0.5 block text-xs text-muted">
            Combien de modules du programme sont accessibles pendant les premiers jours.
          </span>
          <input
            type="number"
            min="0"
            className="field mt-2"
            value={form.modules_avant_j3}
            onChange={(e) => setForm({ ...form, modules_avant_j3: e.target.value })}
          />
        </label>

        <label className="block text-sm">
          <span className="font-bold text-navy">Jour qui débloque tout le reste</span>
          <span className="mt-0.5 block text-xs text-muted">
            À partir de ce jour du workshop, chacun retrouve tous les modules de sa formule.
          </span>
          <input
            type="number"
            min="1"
            max={JOURS_WORKSHOP}
            className="field mt-2"
            value={form.jour_deblocage}
            onChange={(e) => setForm({ ...form, jour_deblocage: e.target.value })}
          />
        </label>
      </div>

      <div className="border-t border-line pt-4">
        <label className="block text-sm">
          <span className="font-bold text-navy">La vidéo à regarder avant le jour 1</span>
          <span className="mt-0.5 block text-xs text-muted">
            En haut du workshop. Lien Vimeo, YouTube, Loom ou Google Drive. Vide, l'encadré
            n'apparaît pas.
          </span>
          <input
            className="field mt-2"
            value={form.video_systeme_url || ''}
            onChange={(e) => setForm({ ...form, video_systeme_url: e.target.value })}
            placeholder="https://vimeo.com/…"
          />
        </label>
      </div>

      {SECOURS.prompts.length > 0 && (
        <div className="border-t border-line pt-4">
          <span className="block text-sm font-bold text-navy">Les prompts « Si ça ne marche pas »</span>
          <span className="mt-0.5 block text-xs text-muted">
            Ouverts à tous les élèves, quel que soit leur jour.
          </span>
          <div className="mt-2 space-y-2">
            {SECOURS.prompts.map((p) => (
              <details key={p.id} className="rounded-xl border border-line p-3">
                <summary className="cursor-pointer text-sm font-bold text-navy">{p.titre}</summary>
                <textarea
                  className="field mt-3 font-mono text-xs"
                  rows={8}
                  value={form.prompts_sos?.[p.id] || ''}
                  onChange={(e) =>
                    setForm({ ...form, prompts_sos: { ...form.prompts_sos, [p.id]: e.target.value } })
                  }
                />
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button className="btn" disabled={busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {ok && <span className="text-sm font-bold text-success">Enregistré</span>}
      </div>
      {erreur && <p className="text-sm font-semibold text-red-600">{erreur}</p>}
    </form>
  )
}

/** Les étapes s'écrivent une par ligne ; la base les garde en tableau. */
const versTexte = (etapes) => (Array.isArray(etapes) ? etapes.map((e) => (typeof e === 'string' ? e : e?.texte || '')).join('\n') : '')
const versTableau = (texte) => texte.split('\n').map((l) => l.trim()).filter(Boolean)

function JourAdmin({ jour: j, ouvert, onToggle, onSave }) {
  const [form, setForm] = useState({ ...j, etapes_texte: versTexte(j.etapes) })
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState('')

  const page = JOURS.find((x) => x.jour === j.jour)

  useEffect(() => {
    setForm({ ...j, etapes_texte: versTexte(j.etapes) })
  }, [j])

  async function enregistrer() {
    setBusy(true)
    setErreur('')
    const { error } = await supabase
      .from('workshop_jours')
      .update({
        titre: form.titre?.trim() || page?.titre || `Jour ${j.jour}`,
        resume: form.resume?.trim() || null,
        etapes: versTableau(form.etapes_texte || ''),
        video_url: form.video_url?.trim() || null,
        prompt: form.prompt || null,
        prompt_2_titre: form.prompt_2_titre?.trim() || null,
        prompt_2: form.prompt_2 || null,
        consignes: form.consignes?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('jour', j.jour)
    setBusy(false)
    if (error) return setErreur(`Enregistrement impossible : ${error.message}`)
    onSave()
  }

  const caracteres = (j.prompt?.length || 0) + (j.prompt_2?.length || 0)
  const nbEtapes = Array.isArray(j.etapes) ? j.etapes.length : 0
  const champ = (cle) => ({ value: form[cle] || '', onChange: (e) => setForm({ ...form, [cle]: e.target.value }) })

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`jour-num !h-11 !w-11 ${j.prompt ? 'atteint' : ''}`}>
          <b className="!text-[17px]">{j.jour}</b>
        </span>
        <div className="min-w-0 flex-1">
          <b className="block font-title text-navy">
            Jour {j.jour} · {j.titre || page?.titre}
          </b>
          <span className="text-xs text-muted">
            {j.prompt ? `${caracteres.toLocaleString('fr-FR')} caractères de prompt` : 'Pas de prompt'}
            {' · '}
            {nbEtapes ? `${nbEtapes} étape${nbEtapes > 1 ? 's' : ''}` : 'pas d’étapes'}
            {j.video_url ? ' · vidéo' : ''}
          </span>
        </div>
        <button onClick={onToggle} className="btn-ghost px-4 py-2 text-sm">
          {ouvert ? 'Fermer' : 'Modifier'}
        </button>
      </div>

      {ouvert && (
        <div className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-bold text-navy">Titre</span>
              <input className="field mt-2" {...champ('titre')} placeholder={page?.titre} />
            </label>
            <label className="block text-sm">
              <span className="font-bold text-navy">Résumé (une phrase)</span>
              <input className="field mt-2" {...champ('resume')} placeholder={page?.resume} />
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-bold text-navy">Les étapes</span>
            <span className="mt-0.5 block text-xs text-muted">Une étape par ligne, dans l'ordre.</span>
            <textarea className="field mt-2" rows={6} {...champ('etapes_texte')} />
          </label>

          <label className="block text-sm">
            <span className="font-bold text-navy">Le prompt du jour</span>
            <textarea
              className="field mt-2 font-mono text-xs"
              rows={10}
              {...champ('prompt')}
              placeholder={`Le prompt à coller dans ${OUTIL}`}
            />
          </label>

          <details className="rounded-xl border border-line p-3" open={!!form.prompt_2}>
            <summary className="cursor-pointer text-sm font-bold text-navy">
              Facultatif : un deuxième prompt
            </summary>
            <input className="field mt-3" {...champ('prompt_2_titre')} placeholder="Titre du deuxième prompt" />
            <textarea className="field mt-3 font-mono text-xs" rows={8} {...champ('prompt_2')} />
          </details>

          <label className="block text-sm">
            <span className="font-bold text-navy">Avant demain</span>
            <span className="mt-0.5 block text-xs text-muted">Facultatif. Affiché en bas de la page du jour.</span>
            <textarea className="field mt-2" rows={2} {...champ('consignes')} />
          </label>

          <label className="block text-sm">
            <span className="font-bold text-navy">La vidéo du jour</span>
            <input
              className="field mt-2"
              {...champ('video_url')}
              placeholder="Lien Vimeo, YouTube, Loom ou Google Drive, affiché au-dessus des étapes"
            />
          </label>

          <button onClick={enregistrer} disabled={busy} className="btn">
            {busy ? 'Enregistrement…' : 'Enregistrer ce jour'}
          </button>
          {erreur && <p className="text-sm font-semibold text-red-600">{erreur}</p>}
        </div>
      )}
    </div>
  )
}
