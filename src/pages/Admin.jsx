import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { ACCOMPAGNEMENT, JOURS_WORKSHOP, MARQUE } from '../lib/marque.js'
import Contenu from './Contenu.jsx'
import WorkshopAdmin from './WorkshopAdmin.jsx'
import SuiviWorkshop from './SuiviWorkshop.jsx'

/* Ce que chacun voit du back-office. Un setter génère des invitations et
   rien d'autre : le contenu, les formules, les outils et les mots de passe
   des élèves restent aux administrateurs — la base le fait respecter, ces
   onglets ne font que ne pas les proposer. */
const ONGLETS = [
  ['invitations',    'Invitations', true],
  ['suivi',          'Suivi des élèves', true],
  ['membres',        'Membres',     false],
  ['formules',       'Formules',    false],
  ['contenu',        'Contenu',     false],
  ['workshop',       `Workshop ${JOURS_WORKSHOP} jours`, false],
  ['outils',         'Outils',      false],
  ['accompagnement', 'Accompagnement', false],
]

export default function Admin({ role }) {
  const admin = role === 'admin'
  const onglets = ONGLETS.filter(([, , pourSetter]) => admin || pourSetter)
  const [tab, setTab] = useState(onglets[0][0])

  return (
    <>
      <p className="eyebrow">{MARQUE}</p>
      <h1 className="mt-1.5 text-[28px] sm:text-[34px]">Back-office</h1>
      {!admin && (
        <p className="mt-2 text-sm">
          Génère ici le lien d'accès de la personne que tu viens d'inscrire, avec sa formule,
          et envoie-le-lui juste après l'appel.
        </p>
      )}

      {onglets.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {onglets.map(([id, libelle]) => (
            <Tab key={id} active={tab === id} onClick={() => setTab(id)}>
              {libelle}
            </Tab>
          ))}
        </div>
      )}

      <div className="mt-6">
        {tab === 'invitations' && <Invitations admin={admin} />}
        {tab === 'accompagnement' && <Accompagnement />}
        {tab === 'membres' && <Membres />}
        {tab === 'formules' && <Formules />}
        {tab === 'contenu' && <Contenu />}
        {tab === 'outils' && <Outils />}
        {tab === 'workshop' && <WorkshopAdmin />}
        {tab === 'suivi' && <SuiviWorkshop />}
      </div>
    </>
  )
}

function Tab({ active, ...props }) {
  return (
    <button
      {...props}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? 'bg-accent text-on-accent' : 'border border-line-strong bg-surface text-navy hover:border-accent/50'
      }`}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Invitations                                                        */
/* ------------------------------------------------------------------ */

function Invitations({ admin }) {
  const [plans, setPlans] = useState([])
  const [invites, setInvites] = useState([])
  const [equipe, setEquipe] = useState({})
  const [plan, setPlan] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(null)
  const [dernier, setDernier] = useState(null)

  async function load() {
    const [{ data: p }, { data: i }] = await Promise.all([
      supabase.from('plans').select('code, label, rank').order('rank'),
      supabase
        .from('invites')
        .select('token, plan_code, label, created_at, expires_at, used_at, created_by')
        .order('created_at', { ascending: false })
        .limit(50),
    ])
    setPlans(p || [])
    setInvites(i || [])
    if (!plan && p?.length) setPlan(p[0].code)

    // Dix-huit setters partagent cette liste : un administrateur a besoin
    // de voir qui a généré quoi. Les noms sont résolus ici plutôt que par
    // une jointure, qui dépendrait du nom exact de la clé étrangère.
    if (admin) {
      const { data: m } = await supabase.from('members').select('id, first_name, last_name')
      setEquipe(Object.fromEntries((m || []).map((x) => [x.id, x])))
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function create(e) {
    e.preventDefault()
    setBusy(true)
    const { data: s } = await supabase.auth.getSession()
    const { data } = await supabase
      .from('invites')
      .insert({ plan_code: plan, label: label.trim() || null, created_by: s.session.user.id })
      .select('token')
      .single()
    setLabel('')
    setBusy(false)
    if (data) {
      await load()
      copy(data.token)
      setDernier(data.token)
    }
  }

  function linkFor(token) {
    return `${window.location.origin}/bienvenue/${token}`
  }

  function copy(token, quoi = 'lien') {
    const texte = quoi === 'message'
      ? `Bienvenue dans ${MARQUE} ! Voici ton accès à l'espace membre : ${linkFor(token)}\n\nTu choisis ton mot de passe, et ton jour 1 est ouvert tout de suite.`
      : linkFor(token)
    navigator.clipboard.writeText(texte)
    setCopied(`${quoi}:${token}`)
    setTimeout(() => setCopied(null), 2500)
  }

  return (
    <>
      <div className="card p-5">
        <h2 className="text-lg">Créer un lien d'invitation</h2>
        <p className="mt-1 text-sm">
          Choisis ce que la personne a payé. Le lien s'ouvre une seule fois et expire au bout
          de 14 jours — envoie-le après l'appel.
        </p>

        <form onSubmit={create} className="mt-4 flex flex-wrap items-center gap-3">
          <select
            className="field w-auto"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            className="field w-auto flex-1"
            placeholder="Nom de la personne (pour t'y retrouver)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button className="btn" disabled={busy || !plan}>
            {busy ? 'Création…' : 'Générer le lien'}
          </button>
        </form>
      </div>

      {dernier && (
        <div className="carte-phare mt-5">
          <h2 className="pr-12 text-[20px]">Le lien est copié</h2>
          <p className="mt-1.5 max-w-[60ch] text-sm">
            Envoie-le à la personne juste après l'appel. Elle choisit son mot de passe et son
            jour 1 s'ouvre tout de suite.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => copy(dernier, 'message')} className="btn">
              {copied === `message:${dernier}` ? 'Message copié' : 'Copier le message de bienvenue'}
            </button>
            <button type="button" onClick={() => copy(dernier)} className="btn-ghost">
              {copied === `lien:${dernier}` ? 'Lien copié' : 'Copier le lien seul'}
            </button>
          </div>
        </div>
      )}


      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-extrabold">Pour</th>
              <th className="px-5 py-3 font-extrabold">Formule</th>
              {admin && <th className="px-5 py-3 font-extrabold">Par</th>}
              <th className="px-5 py-3 font-extrabold">État</th>
              <th className="px-5 py-3 font-extrabold">Lien</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => {
              const expired = new Date(i.expires_at) < new Date()
              return (
                <tr key={i.token} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 font-bold text-navy">{i.label || '—'}</td>
                  <td className="px-5 py-3">{plans.find((p) => p.code === i.plan_code)?.label || i.plan_code}</td>
                  {admin && (
                    <td className="px-5 py-3 text-muted">
                      {[equipe[i.created_by]?.first_name, equipe[i.created_by]?.last_name]
                        .filter(Boolean)
                        .join(' ') || '—'}
                    </td>
                  )}
                  <td className="px-5 py-3">
                    {i.used_at ? (
                      <span className="text-success">✓ utilisé</span>
                    ) : expired ? (
                      <span className="text-muted">expiré</span>
                    ) : (
                      <span className="text-accent">en attente</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {i.used_at || expired ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <button
                        onClick={() => copy(i.token)}
                        className="font-bold text-accent hover:underline"
                      >
                        {copied === `lien:${i.token}` ? '✓ copié' : 'Copier le lien'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {!invites.length && (
              <tr>
                <td colSpan={admin ? 5 : 4} className="px-5 py-6 text-center text-muted">
                  Aucune invitation pour l'instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Accompagnement ACE Club                                            */
/* ------------------------------------------------------------------ */

/**
 * La carte qui propose de rejoindre l'accompagnement ACE Club (table
 * `prochaines_etapes`, une seule ligne). Le texte d'une offre change plus
 * souvent que le code : il se modifie ici.
 *
 * [À VALIDER avec le client : à quel moment et comment]. Aucun prix, aucun
 * chiffre de revenus, aucune promesse de gain dans ces champs.
 */
function Accompagnement() {
  const [f, setF] = useState(null)
  const [etat, setEtat] = useState('') // '' | 'enregistrement' | 'ok' | message d'erreur
  const [absent, setAbsent] = useState(false)

  useEffect(() => {
    supabase
      .from('prochaines_etapes')
      .select('actif, eyebrow, titre, texte, cta_libelle, cta_url, note')
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setAbsent(true)
        setF(data || {
          actif: false,
          eyebrow: ACCOMPAGNEMENT.eyebrow,
          titre: ACCOMPAGNEMENT.titre,
          texte: ACCOMPAGNEMENT.texte,
          cta_libelle: ACCOMPAGNEMENT.bouton,
          cta_url: ACCOMPAGNEMENT.lien,
          note: null,
        })
      })
  }, [])

  async function enregistrer(e) {
    e.preventDefault()
    setEtat('enregistrement')
    const { error } = absent
      ? await supabase.from('prochaines_etapes').insert({ id: 1, ...f })
      : await supabase.from('prochaines_etapes').update(f).eq('id', 1)
    if (error) return setEtat(`Enregistrement impossible : ${error.message}`)
    setAbsent(false)
    setEtat('ok')
    setTimeout(() => setEtat(''), 2500)
  }

  if (!f) return <p className="text-muted">Chargement…</p>

  const champ = (cle) => ({
    value: f[cle] ?? '',
    onChange: (e) => setF({ ...f, [cle]: e.target.value }),
  })

  return (
    <form onSubmit={enregistrer} className="card max-w-2xl space-y-4 p-6">
      <p className="text-sm">
        La carte « Rejoins l'accompagnement ACE Club » de l'accueil des élèves. Elle n'apparaît
        qu'une fois <b className="text-navy">les {JOURS_WORKSHOP} jours du workshop ouverts</b>, ou
        tous les modules de leur formule vus.{' '}
        <span className="todo">[À VALIDER avec le client : à quel moment et comment]</span>
      </p>
      <p className="text-xs text-muted">
        Pas de prix, pas de chiffre de revenus, pas de promesse de gain.
      </p>

      <label className="flex items-center gap-3 text-sm font-bold text-navy">
        <input
          type="checkbox"
          checked={!!f.actif}
          onChange={(e) => setF({ ...f, actif: e.target.checked })}
          className="h-4 w-4 accent-[#7C9CFF]"
        />
        Afficher la carte aux élèves
      </label>

      <div>
        <span className="eyebrow">Surtitre</span>
        <input className="field mt-1.5" {...champ('eyebrow')} />
      </div>
      <div>
        <span className="eyebrow">Titre</span>
        <input className="field mt-1.5" required {...champ('titre')} />
      </div>
      <div>
        <span className="eyebrow">Texte</span>
        <textarea className="field mt-1.5 min-h-32" {...champ('texte')} />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="min-w-48 flex-1">
          <span className="eyebrow">Libellé du bouton</span>
          <input className="field mt-1.5" required {...champ('cta_libelle')} />
        </div>
        <div className="min-w-64 flex-[2]">
          <span className="eyebrow">Lien</span>
          <input className="field mt-1.5" placeholder="[À FOURNIR] https://…" {...champ('cta_url')} />
        </div>
      </div>
      <div>
        <span className="eyebrow">Mention sous le bouton</span>
        <input className="field mt-1.5" {...champ('note')} />
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button className="btn" disabled={etat === 'enregistrement'}>
          {etat === 'enregistrement' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {etat === 'ok' && <span className="text-sm font-bold text-success">Enregistré</span>}
        {etat && etat !== 'ok' && etat !== 'enregistrement' && (
          <span className="text-sm font-semibold text-red-600">{etat}</span>
        )}
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */
/*  Membres                                                            */
/* ------------------------------------------------------------------ */

function Membres() {
  const [rows, setRows] = useState(null)
  const [plans, setPlans] = useState([])
  const [nouveau, setNouveau] = useState(null) // { email, password }
  const [busy, setBusy] = useState(null)

  async function load() {
    const [{ data: m }, { data: p }] = await Promise.all([
      supabase
        .from('members')
        .select('id, first_name, last_name, email, plan_code, role, activated_at')
        .order('activated_at', { ascending: false }),
      supabase.from('plans').select('code, label, rank').order('rank'),
    ])
    setRows(m || [])
    setPlans(p || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function changePlan(id, plan_code) {
    await supabase.from('members').update({ plan_code }).eq('id', id)
    load()
  }

  async function reinitialiser(m) {
    const nom = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email
    if (!confirm(`Poser un nouveau mot de passe pour ${nom} ? L'ancien cessera de marcher.`)) return
    setBusy(m.id)
    setNouveau(null)
    const { data: s } = await supabase.auth.getSession()
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${s.session.access_token}`,
      },
      body: JSON.stringify({ memberId: m.id }),
    })
    const corps = await res.json()
    setBusy(null)
    if (!res.ok) return alert(corps.error)
    setNouveau(corps)
  }

  if (!rows) return <p className="text-muted">Chargement…</p>

  return (
    <>
      {nouveau && (
        <div className="card mb-4 border-accent/30 bg-accent-pastel p-5">
          <p className="text-sm">
            Nouveau mot de passe pour <b className="text-navy">{nouveau.email}</b>. Il n'est
            affiché qu'ici, une seule fois — transmets-le maintenant.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <code className="rounded-lg bg-surface px-4 py-2 font-title text-lg font-extrabold text-navy">
              {nouveau.password}
            </code>
            <button
              onClick={() => navigator.clipboard?.writeText(nouveau.password)}
              className="btn-ghost"
            >
              Copier
            </button>
            <button onClick={() => setNouveau(null)} className="text-sm font-bold text-muted">
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-5 py-3 font-extrabold">Personne</th>
            <th className="px-5 py-3 font-extrabold">Adresse</th>
            <th className="px-5 py-3 font-extrabold">Formule</th>
            <th className="px-5 py-3 font-extrabold">Accès</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.id} className="border-b border-line last:border-0">
              <td className="px-5 py-3 font-bold text-navy">
                {m.first_name} {m.last_name}
                {m.role === 'admin' && (
                  <span className="ml-2 rounded-full bg-accent-pastel px-2 py-0.5 text-xs text-accent">
                    équipe
                  </span>
                )}
              </td>
              <td className="px-5 py-3 text-muted">{m.email}</td>
              <td className="px-5 py-3">
                <select
                  className="rounded-lg border border-line px-2 py-1 text-sm"
                  value={m.plan_code || ''}
                  onChange={(e) => changePlan(m.id, e.target.value || null)}
                >
                  <option value="">— aucune —</option>
                  {plans.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-5 py-3">
                <button
                  onClick={() => reinitialiser(m)}
                  disabled={busy === m.id}
                  className="text-sm font-bold text-accent hover:underline disabled:opacity-50"
                >
                  {busy === m.id ? 'En cours…' : 'Nouveau mot de passe'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Formules                                                           */
/* ------------------------------------------------------------------ */

function Formules() {
  const [matrix, setMatrix] = useState(null)
  const [plans, setPlans] = useState([])

  async function load() {
    const [{ data: mx }, { data: p }] = await Promise.all([
      supabase.rpc('plan_matrix'),
      supabase.from('plans').select('code, label, rank').order('rank'),
    ])
    setMatrix(mx || [])
    setPlans(p || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function toggle(moduleId, planCode, on) {
    if (on) await supabase.from('plan_modules').insert({ plan_code: planCode, module_id: moduleId })
    else
      await supabase
        .from('plan_modules')
        .delete()
        .eq('plan_code', planCode)
        .eq('module_id', moduleId)
    load()
  }

  if (!matrix) return <p className="text-muted">Chargement…</p>

  return (
    <>
      <p className="text-sm">
        Un nouveau module se coche tout seul : jusqu'au module 8 pour Mensuel Builder, 14 pour
        Annuel Starter et 20 pour Annuel Builder. Tu peux changer une case à la main. Un élève
        voit les modules des autres offres, fermés, avec le nom de l'offre qui les débloque.
      </p>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-extrabold">Module</th>
              {plans.map((p) => (
                <th key={p.code} className="px-5 py-3 text-center font-extrabold">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((m) => (
              <tr key={m.module_id} className="border-b border-line last:border-0">
                <td className="px-5 py-3 font-bold text-navy">
                  {m.position}. {m.title}
                </td>
                {plans.map((p) => {
                  const on = m.plan_codes.includes(p.code)
                  return (
                    <td key={p.code} className="px-5 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(m.module_id, p.code, !on)}
                        className="h-4 w-4 accent-[#7C9CFF]"
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Outils                                                             */
/* ------------------------------------------------------------------ */

function Outils() {
  const [tools, setTools] = useState(null)
  const vide = { name: '', description: '', promo_code: '', url: '' }
  const [form, setForm] = useState(vide)

  async function load() {
    const { data } = await supabase
      .from('tools')
      .select('id, position, name, description, promo_code, url')
      .order('position')
    setTools(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function add(e) {
    e.preventDefault()
    const position = (tools?.at(-1)?.position || 0) + 1
    await supabase.from('tools').insert({
      position,
      name: form.name.trim(),
      description: form.description.trim() || null,
      promo_code: form.promo_code.trim() || null,
      url: form.url.trim() || null,
    })
    setForm(vide)
    load()
  }

  async function remove(t) {
    if (!confirm(`Retirer « ${t.name} » de la liste ?`)) return
    await supabase.from('tools').delete().eq('id', t.id)
    load()
  }

  if (!tools) return <p className="text-muted">Chargement…</p>

  return (
    <>
      <p className="text-sm">
        Ces outils s'affichent pour tous les élèves, quelle que soit leur formule.
      </p>

      <div className="mt-5 space-y-3">
        {tools.map((t) => (
          <div key={t.id} className="card flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <b className="block font-title text-navy">{t.name}</b>
              {t.description && <span className="text-sm">{t.description}</span>}
              <span className="mt-1 block text-xs text-muted">
                {t.promo_code ? `Code : ${t.promo_code}` : 'Sans code'} · {t.url || 'sans lien'}
              </span>
            </div>
            <button
              onClick={() => remove(t)}
              className="text-sm font-bold text-muted hover:text-red-600"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="card mt-5 space-y-3 p-5">
        <h2 className="text-lg">Ajouter un outil</h2>
        <input
          className="field"
          placeholder="Nom de l'outil"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="field"
          placeholder="À quoi il sert, en une phrase"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex flex-wrap gap-3">
          <input
            className="field w-auto flex-1"
            placeholder="Code promo"
            value={form.promo_code}
            onChange={(e) => setForm({ ...form, promo_code: e.target.value })}
          />
          <input
            className="field w-auto flex-[2]"
            type="url"
            placeholder="https://…"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </div>
        <button className="btn">Ajouter</button>
      </form>
    </>
  )
}
