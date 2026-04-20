import Link from 'next/link'
import { Users, Home, RotateCcw, DollarSign, Shield, ArrowRight, CheckCircle } from 'lucide-react'

const FEATURES = [
  {
    icon: Users,
    title: 'Gestion des membres',
    desc: 'Enregistrez et suivez tous les membres de votre Dahira avec leur profil complet.',
  },
  {
    icon: RotateCcw,
    title: 'Tours automatiques',
    desc: 'Algorithme intelligent qui sélectionne la prochaine maison selon 6 critères d\'équité.',
  },
  {
    icon: DollarSign,
    title: 'Finance & Caisse',
    desc: 'Suivez les cotisations, adiya, dépenses et le solde de caisse en temps réel.',
  },
  {
    icon: Home,
    title: 'Maisons',
    desc: 'Gérez les maisons d\'accueil, capacités et historique des passages reçus.',
  },
  {
    icon: Shield,
    title: 'Multi-tenant sécurisé',
    desc: 'Chaque Dahira a ses données totalement isolées. Aucune fuite entre communautés.',
  },
  {
    icon: CheckCircle,
    title: 'Tâches du dimanche',
    desc: 'Assignez les responsabilités (accueil, thé, sonorisation…) à chaque tour.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow">
            <span className="text-sm font-bold text-white">SGD</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">SaaS Gestion Dahira</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Créer mon Dahira
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Nous avons lancé ! Rejoignez les premiers Dahira qui ont modernisé leur gestion. Inscription gratuite.
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Gérez votre Dahira
          <br />
          <span className="text-emerald-600">simplement et intelligemment</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Membres, tours de réunion, cotisations, tâches du dimanche.
          Tout ce dont votre communauté a besoin, dans un seul outil.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-700 transition-colors shadow-lg"
          >
            Créer mon Dahira gratuitement
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            J&apos;ai déjà un compte
          </Link>
        </div>

        <p className="mt-4 text-sm text-gray-400">Gratuit jusqu&apos;à 50 membres · Sans carte bancaire</p>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-12">
          Tout ce dont votre Dahira a besoin
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <Icon className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-emerald-600 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Votre Dahira mérite un outil professionnel
          </h2>
          <p className="text-emerald-100 mb-8">
            Rejoignez les Dahira qui ont modernisé leur gestion. Inscription en 2 minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors shadow"
          >
            Commencer maintenant
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm text-gray-400">
        SGD v1.0 · SaaS Gestion Dahira · copyright GandiolDesign · 
      </footer>
    </div>
  )
}
