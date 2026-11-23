/* Captures d'écran de l'espace membre, sur des données de démonstration.

   Aucune vraie base : chaque appel à Supabase (REST, RPC, Auth) et à /api
   est intercepté par Playwright et reçoit une réponse fabriquée ici.
   Toutes les données sont marquées « démo ».

   1. Construire avec une URL factice (elle sert aussi à intercepter) :
        VITE_SUPABASE_URL=https://demo.supabase.co VITE_SUPABASE_ANON_KEY=demo npx vite build
   2. Servir le build :   npx vite preview --host 127.0.0.1 --port 4791
   3. Lancer :            node scripts/captures.mjs http://127.0.0.1:4791
   Les images arrivent dans captures/ (ignoré par git). */

import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire('/Users/martinchevalier/.claude/skills/motion-design/tools/')
const { chromium } = require('playwright')

const BASE = process.argv[2] || 'http://127.0.0.1:4791'
const ICI = path.dirname(fileURLToPath(import.meta.url))
const SORTIE = path.join(ICI, '..', 'captures')
mkdirSync(SORTIE, { recursive: true })

/* ------------------------------------------------------------------ */
/*  Les données de démonstration                                       */
/* ------------------------------------------------------------------ */

const TITRES = [
  'Bienvenue', 'Mindset', "Pourquoi l'IA, et pourquoi maintenant", 'Ce que tu vends, et à qui',
  "Ton premier site avec l'IA, en direct", 'Le finaliser et le mettre en ligne',
  'Trouver et contacter tes premiers prospects', 'Vendre et te faire payer', 'Fixer tes prix',
  'Convaincre au téléphone', 'Te faire payer chaque mois', 'Ton portfolio et tes avis clients',
  'Gérer tes clients sans galérer', 'Tes 30 prochains jours', 'Les apps à vendre en plus du site',
  "Créer une app avec l'IA : la méthode", 'Sécuriser une app avant de la livrer',
  "Ajouter de l'IA chez tes clients", 'Proposer une app à tes clients', 'Passer de freelance à agence',
]
const JOURS = [
  ['Ton offre et ta cible', 'Tu choisis les commerces que tu vises et ce que tu leur vends.'],
  ['Ton premier site avec l’IA', 'Tu sors un vrai site avec le logiciel IA partenaire, sans coder.'],
  ['Le rendre pro', 'Textes, photos, version mobile, mise en ligne.'],
  ['Ton prix', 'Tu fixes le prix du site et celui de l’abonnement mensuel.'],
  ['Trouver tes prospects', 'Tu fais la liste des commerces à contacter autour de toi.'],
  ['La maquette qui vend', 'Tu prépares le site d’un prospect avant même de l’appeler.'],
  ['Tes premiers messages', 'Tu contactes tes prospects avec les messages fournis.'],
  ['Les relances', 'Tu relances et tu décroches tes premiers rendez-vous.'],
  ['Le rendez-vous', 'Tu montres la maquette et tu annonces ton prix.'],
  ['Le premier oui', 'Tu signes, tu encaisses l’acompte et tu livres.'],
]
const PLANS = [
  { code: 'mensuel', label: 'Mensuel Builder', rank: 1, dernier: 8 },
  { code: 'annuel', label: 'Annuel Starter', rank: 2, dernier: 14 },
  { code: 'annuel_builder', label: 'Annuel Builder', rank: 3, dernier: 20 },
]
const MODULES = TITRES.map((title, i) => ({ id: i + 1, position: i + 1, title, description: null, is_intro: false, is_bonus: false }))
const LECONS = MODULES.map((m) => ({ id: 100 + m.id, module_id: m.id, position: 1, title: m.title, duration_seconds: null, avertissement: null, sous_video: null, modules: { title: m.title, position: m.position } }))
const PLAN_MODULES = PLANS.flatMap((p) => MODULES.filter((m) => m.position <= p.dernier).map((m) => ({ plan_code: p.code, module_id: m.id })))

function scenario(nom) {
  const s = {
    eleve: { id: '00000000-0000-4000-8000-000000000001', first_name: 'Démo', last_name: null, email: 'demo@exemple.fr', role: 'member', plan_code: 'mensuel', workshop_dispense: false },
    jour: 4,
    vus: [1, 2, 3],
    accompagnement: false,
  }
  if (nom === 'admin') Object.assign(s.eleve, { id: '00000000-0000-4000-8000-000000000009', first_name: 'Équipe', email: 'equipe@exemple.fr', role: 'admin', plan_code: null })
  if (nom === 'fin') Object.assign(s, { jour: 10, vus: MODULES.map((m) => m.id), accompagnement: true, eleve: { ...s.eleve, plan_code: 'annuel_builder' } })
  return s
}

function minuit(dansJours) {
  const d = new Date()
  d.setHours(24 * dansJours, 0, 0, 0)
  return d.toISOString()
}

function repondre(s, url, requete) {
  const u = new URL(url)
  const p = u.pathname.replace('/rest/v1/', '')
  const q = u.searchParams
  const eq = (cle) => q.get(cle)?.replace(/^eq\./, '')
  const equipe = s.eleve.role !== 'member'
  const plan = PLANS.find((x) => x.code === s.eleve.plan_code)
  const dans = (m) => equipe || (plan && m.position <= plan.dernier)

  switch (p) {
    case 'members':
      if (eq('id')) return [s.eleve]
      return [
        s.eleve,
        { id: 'd1', first_name: 'Démo', last_name: 'A', email: 'demo.a@exemple.fr', plan_code: 'mensuel', role: 'member', activated_at: minuit(-3) },
        { id: 'd2', first_name: 'Démo', last_name: 'B', email: 'demo.b@exemple.fr', plan_code: 'annuel', role: 'member', activated_at: minuit(-6) },
      ]
    case 'rpc/mon_guide':
      return { a_faire: false, tour_a_faire: false }
    case 'rpc/mon_etat_workshop':
      return { jour: equipe ? 10 : s.jour, jour_deblocage: 3, dispense: false, equipe, intro_ok: true, modules_avant: 1, fuseau: 'Europe/Paris', ouvre_le: null }
    case 'rpc/workshop_demarrer':
      return null
    case 'rpc/my_modules':
      return MODULES.filter(dans).map((m) => {
        const fait = s.vus.includes(m.id)
        return { ...m, lesson_count: 1, done_count: fait ? 1 : 0, completion: fait ? 1 : 0, unlocked: true }
      })
    case 'modules':
      return MODULES
    case 'plans':
      return PLANS.map(({ dernier, ...x }) => x)
    case 'plan_modules':
      return PLAN_MODULES
    case 'lessons': {
      let l = LECONS.filter((x) => dans(MODULES[x.module_id - 1]))
      if (eq('id')) l = l.filter((x) => String(x.id) === eq('id'))
      if (eq('module_id')) l = l.filter((x) => String(x.module_id) === eq('module_id'))
      return l
    }
    case 'lesson_progress': {
      const l = s.vus.map((id) => ({ lesson_id: 100 + id }))
      return eq('lesson_id') ? l.filter((x) => String(x.lesson_id) === eq('lesson_id')) : l
    }
    case 'tools':
      return [{ id: 1, position: 1, name: 'Base44', description: 'Le logiciel IA partenaire, pour construire tes sites.', promo_code: null, url: 'https://base44.com' }]
    case 'workshop_reglages':
      return [{ id: 1, modules_avant_j3: 1, jour_deblocage: 3, video_systeme_url: null, prompts_sos: {} }]
    case 'rpc/mon_workshop':
      return JOURS.map(([titre, resume], i) => {
        const jour = i + 1
        const ouvert = equipe || jour <= s.jour
        return { jour, titre, resume, video_url: null, prompt: null, prompt_2: null, prompt_2_titre: null, consignes: null, ouvert, ouvre_le: ouvert ? null : minuit(jour - s.jour), capture_faite: jour < s.jour, etapes: [] }
      })
    case 'workshop_jours':
      return JOURS.map(([titre, resume], i) => ({ jour: i + 1, titre, resume, video_url: null, prompt: null, prompt_2: null, prompt_2_titre: null, consignes: null, etapes: [] }))
    case 'prochaines_etapes':
      return s.accompagnement
        ? [{ actif: true, eyebrow: 'Accompagnement ACE Club', titre: "Rejoins l'accompagnement ACE Club", texte: "[À FOURNIR : ce que contient l'accompagnement, en deux ou trois phrases]", cta_libelle: "Rejoindre l'accompagnement", cta_url: '#', note: '[À VALIDER avec le client : à quel moment et comment]' }]
        : [{ actif: false, eyebrow: 'Accompagnement ACE Club', titre: "Rejoins l'accompagnement ACE Club", texte: "[À FOURNIR : ce que contient l'accompagnement, en deux ou trois phrases]", cta_libelle: "Rejoindre l'accompagnement", cta_url: '#', note: null }]
    case 'invites':
      if (requete.method() !== 'GET') return { token: 'demo-0000' }
      return [
        { token: 'demo-1', plan_code: 'mensuel', label: 'Démo (en attente)', created_at: minuit(0), expires_at: minuit(14), used_at: null, created_by: s.eleve.id },
        { token: 'demo-2', plan_code: 'annuel', label: 'Démo (utilisé)', created_at: minuit(-2), expires_at: minuit(12), used_at: minuit(-1), created_by: s.eleve.id },
        { token: 'demo-3', plan_code: 'annuel_builder', label: 'Démo (expiré)', created_at: minuit(-20), expires_at: minuit(-6), used_at: null, created_by: s.eleve.id },
      ]
    case 'rpc/plan_matrix':
      return MODULES.map((m) => ({ module_id: m.id, position: m.position, title: m.title, plan_codes: PLANS.filter((x) => m.position <= x.dernier).map((x) => x.code) }))
    case 'suivi_workshop':
      return [
        { id: 'd1', prenom: 'Démo A', email: 'demo.a@exemple.fr', plan_code: 'mensuel', jour: 4, captures: 2, dernier_jour_depose: 2, jours_de_retard: 2 },
        { id: 'd2', prenom: 'Démo B', email: 'demo.b@exemple.fr', plan_code: 'annuel', jour: 7, captures: 6, dernier_jour_depose: 6, jours_de_retard: 1 },
      ]
    default:
      return []
  }
}

/* ------------------------------------------------------------------ */
/*  Le navigateur                                                      */
/* ------------------------------------------------------------------ */

function jeton(id) {
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${b({ alg: 'HS256', typ: 'JWT' })}.${b({ sub: id, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 36000 })}.demo`
}

async function page(navigateur, largeur, nom, connecte = true) {
  const s = scenario(nom)
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: largeur < 600 ? 844 : 900 },
    deviceScaleFactor: largeur < 600 ? 3 : 1,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  })
  const pg = await contexte.newPage()

  if (connecte) {
    const user = { id: s.eleve.id, aud: 'authenticated', role: 'authenticated', email: s.eleve.email, app_metadata: {}, user_metadata: {}, created_at: minuit(-4) }
    const session = { access_token: jeton(s.eleve.id), token_type: 'bearer', expires_in: 36000, expires_at: Math.floor(Date.now() / 1000) + 36000, refresh_token: 'demo', user }
    await pg.addInitScript((v) => localStorage.setItem('sb-demo-auth-token', v), JSON.stringify(session))
    await pg.route('https://demo.supabase.co/auth/v1/**', (r) => r.fulfill({ json: user }))
  } else {
    await pg.route('https://demo.supabase.co/auth/v1/**', (r) => r.fulfill({ status: 400, json: { error: 'demo' } }))
  }

  await pg.route('https://demo.supabase.co/rest/v1/**', (r) => {
    const req = r.request()
    let corps = repondre(s, req.url(), req)
    const objet = /vnd\.pgrst\.object/.test(req.headers()['accept'] || '')
    if (objet && Array.isArray(corps)) corps = corps[0] ?? null
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(corps) })
  })
  await pg.route('https://demo.supabase.co/storage/v1/**', (r) => r.fulfill({ json: {} }))
  await pg.route('**/api/**', (r) => r.fulfill({ status: 404, json: { error: "Cette leçon n'a pas encore de contenu." } }))
  return { pg, contexte }
}

async function capture(pg, fichier, pleine = true) {
  await pg.waitForLoadState('networkidle')
  await pg.evaluate(() => document.fonts.ready)
  await pg.waitForTimeout(700)
  // En pleine page, la barre d'onglets fixe du téléphone tomberait au milieu
  // de l'image : on la pose en bas de la page, là où l'œil l'attend.
  if (pleine) await pg.addStyleTag({ content: 'body{position:relative} nav.fixed{position:absolute!important}' })
  await pg.screenshot({ path: path.join(SORTIE, fichier), fullPage: pleine })
  console.log('  ', fichier)
}

const navigateur = await chromium.launch()
for (const largeur of [390, 1440]) {
  const suffixe = `-${largeur}.png`
  console.log(`Largeur ${largeur}`)

  let { pg, contexte } = await page(navigateur, largeur, 'eleve', false)
  await pg.goto(`${BASE}/`)
  await pg.getByText('Accéder à mon').waitFor()
  await capture(pg, `01-connexion${suffixe}`, false)
  await contexte.close()

  ;({ pg, contexte } = await page(navigateur, largeur, 'eleve'))
  await pg.goto(`${BASE}/`)
  await pg.getByText('Dans les autres offres').waitFor()
  await capture(pg, `02-accueil-mensuel-builder${suffixe}`)

  await pg.goto(`${BASE}/lecon/104`)
  await pg.getByText("J'ai terminé cette leçon").waitFor()
  await capture(pg, `03-lecon${suffixe}`)

  await pg.goto(`${BASE}/workshop`)
  await pg.getByText('Comment ça marche').waitFor()
  await capture(pg, `04-workshop-10-jours${suffixe}`)

  await pg.goto(`${BASE}/workshop/jour/4`)
  await pg.getByRole('heading', { name: 'Les étapes' }).waitFor()
  await capture(pg, `05-jour-4${suffixe}`)
  await contexte.close()

  ;({ pg, contexte } = await page(navigateur, largeur, 'admin'))
  await pg.goto(`${BASE}/admin`)
  await pg.getByText("Créer un lien d'invitation").waitFor()
  await capture(pg, `06-back-office-invitations${suffixe}`)
  await pg.getByRole('button', { name: 'Workshop 10 jours' }).click()
  await pg.getByText('Le rythme').waitFor()
  await pg.getByRole('button', { name: 'Modifier' }).first().click()
  await capture(pg, `07-back-office-workshop${suffixe}`)
  await pg.getByRole('button', { name: 'Formules' }).click()
  await pg.getByText('Passer de freelance à agence').waitFor()
  await capture(pg, `08-back-office-formules${suffixe}`)
  await contexte.close()

  ;({ pg, contexte } = await page(navigateur, largeur, 'fin'))
  await pg.goto(`${BASE}/`)
  await pg.getByText("Rejoins l'accompagnement ACE Club").waitFor()
  await capture(pg, `09-accueil-fin-accompagnement${suffixe}`)
  await contexte.close()
}
await navigateur.close()
