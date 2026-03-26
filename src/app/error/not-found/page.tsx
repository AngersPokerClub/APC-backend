import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-satoshiBlack text-primary_brand-100 mb-4">
          404
        </h1>
        <p className="text-xl text-primary_brand-300 mb-6">
          Oups, cette page n&apos;existe pas !
        </p>

        <Link
          href="/"
          className="inline-block bg-primary_brand-100 hover:bg-primary_brand-200 text-white font-satoshiBold px-6 py-3 rounded-xl transition">
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
