import { supabase } from './supabase.js'

/**
 * Tout le programme vu par l'élève : ses modules, et ceux des autres offres.
 *
 * `my_modules()` ne renvoie que les modules de sa formule (avec progression
 * et verrou, calculés par la base). Les autres modules restent affichés,
 * verrouillés, avec le nom de l'offre qui les contient : un Mensuel Builder
 * voit les modules 9 à 20 et sait qu'ils sont dans l'Annuel Starter ou
 * l'Annuel Builder.
 *
 * Rien ne fuit : `modules`, `plans` et `plan_modules` sont lisibles par tout
 * membre connecté (titres seulement), et la règle de `lessons` ne renvoie
 * jamais une leçon d'un module fermé.
 */
export async function chargerProgramme() {
  const [{ data: miens, error }, { data: tous }, { data: contenus }, { data: plans }] = await Promise.all([
    supabase.rpc('my_modules'),
    supabase.from('modules').select('id, position, title, is_intro, is_bonus').order('position'),
    supabase.from('plan_modules').select('plan_code, module_id'),
    supabase.from('plans').select('code, label, rank').order('rank'),
  ])

  const dejaLa = new Set((miens || []).map((m) => m.id))

  // L'offre qui débloque un module : la plus petite formule qui le contient.
  const offre = (moduleId) =>
    (plans || []).find((p) => (contenus || []).some((c) => c.plan_code === p.code && c.module_id === moduleId))
      ?.label || null

  const autres = (tous || [])
    .filter((m) => !dejaLa.has(m.id) && !m.is_intro && !m.is_bonus)
    .map((m) => ({
      ...m,
      lesson_count: 0,
      done_count: 0,
      completion: 0,
      unlocked: false,
      hors_formule: true,
      offre: offre(m.id),
    }))

  const rang = (m) => (m.is_intro ? 0 : m.is_bonus ? 2 : 1)
  const liste = [...(miens || []), ...autres].sort(
    (a, b) => rang(a) - rang(b) || a.position - b.position,
  )
  return { modules: liste, error }
}
