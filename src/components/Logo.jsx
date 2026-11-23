/** Le logo ACE Club, le même fichier que sur la page de vente. */
export default function Logo({ className = 'h-[26px]' }) {
  return <img src="/logo-ace.svg" alt="ACE Club" className={`block w-auto flex-none ${className}`} />
}
