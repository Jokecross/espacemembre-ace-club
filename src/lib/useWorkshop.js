import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

/** Le fuseau de l'élève, pour que ses jours s'ouvrent à minuit chez lui. */
function fuseauNavigateur() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

/**
 * Le texte exact d'un prompt de secours, sans aucune retouche : ce qui sort
 * d'ici est ce que l'élève colle dans Base44.
 */
export function textePromptSecours(id, reglages) {
  return reglages?.prompts_sos?.[id] || null
}

/** Les étapes d'un jour : un tableau de textes, quelle que soit la forme reçue. */
export function etapesDuJour(j) {
  const brut = j?.etapes
  if (Array.isArray(brut)) return brut.map((e) => (typeof e === 'string' ? e : e?.texte)).filter(Boolean)
  return []
}

/** Les dix jours tels que la base les ouvre, et les réglages du workshop. */
export function useWorkshop() {
  const [jours, setJours] = useState(null)
  const [reglages, setReglages] = useState(null)

  const recharger = useCallback(
    () => supabase.rpc('mon_workshop').then(({ data }) => setJours(data || [])),
    [],
  )

  useEffect(() => {
    // Les jours partent de l'inscription : `workshop_demarrer` ne fait que
    // relever le fuseau, pour que minuit soit celui de l'élève.
    supabase.rpc('workshop_demarrer', { p_fuseau: fuseauNavigateur() }).then(() => recharger())
    supabase
      .from('workshop_reglages')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => setReglages(data || {}))
  }, [recharger])

  return { jours, reglages, recharger }
}
