
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <header className="landing-header">
        <Link href="/" className="landing-brand">
          WARD COSMETICS
        </Link>
        <span>BEAUTY · CARE · STYLE</span>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-eyebrow">YOUR BEAUTY DESTINATION</span>
          <h1>Beauty,<br />thoughtfully<br />selected.</h1>
          <p>
            Discover a considered collection of beauty and
            skincare favourites, selected with care.
          </p>
          <div className="landing-actions">
            <Link href="/shop" className="landing-store">
              Explore the store <span>↗</span>
            </Link>
            <Link href="/login" className="landing-staff">
              Staff login <span>→</span>
            </Link>
          </div>
        </div>

        <div className="landing-visual">
          <div className="landing-circle"><span>W</span></div>
          <div className="landing-visual-caption">
            <span>WARD COSMETICS</span>
            <span>THE BEAUTY COLLECTION</span>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <span>WARD COSMETICS</span>
        <span>Discover something beautiful.</span>
      </footer>
    </main>
  );
}
