import { lazy, Suspense } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Browse from "./pages/Browse";
import ArtistProfile from "./pages/ArtistProfile";
import ArtistEdit from "./pages/ArtistEdit";
import Diocese from "./pages/Diocese";
import Letters from "./pages/Letters";
import Library from "./pages/Library";
import Share from "./pages/Share";
import Commission from "./pages/Commission";
import { artistBySlug } from "./data/artists";
import Workspace from "./pages/Workspace";
import Connect from "./pages/Connect";
import ArtistSignup from "./pages/ArtistSignup";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import ApiStatus from "./pages/ApiStatus";
import Outbox from "./pages/Outbox";
import Preferences from "./pages/Preferences";
import Compare from "./pages/Compare";
import Ledger from "./pages/Ledger";
import Certificate from "./pages/Certificate";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import Partnerships from "./pages/Partnerships";
import IntakeForm from "./pages/IntakeForm";
import IntakeDetail from "./pages/IntakeDetail";
import Admin from "./pages/Admin";
import Security from "./pages/Security";
import Report from "./pages/Report";
import Journal from "./pages/Journal";
import Apprenticeships from "./pages/Apprenticeships";
import Prize from "./pages/Prize";
import About from "./pages/About";
import Manifesto from "./pages/Manifesto";
import Verify from "./pages/Verify";
import Chancery from "./pages/Chancery";
import ComingSoon from "./pages/ComingSoon";
import Features from "./pages/Features";
import Demo from "./pages/Demo";
import NotFound from "./pages/NotFound";

// Heavy pages — code-split so mapbox-gl etc. don't bloat the main bundle.
const MapPage = lazy(() => import("./pages/Map"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/artists/:slug" element={<ArtistProfile />} />
      <Route path="/artists/:slug/edit" element={<ArtistEdit />} />
      <Route path="/commission/:slug" element={<Commission />} />
      <Route path="/workspace/:id" element={<Workspace />} />
      <Route path="/connect/:slug" element={<Connect />} />
      <Route
        path="/map"
        element={
          <Suspense fallback={<MapLoading />}>
            <MapPage />
          </Suspense>
        }
      />
      <Route path="/signup/artist" element={<ArtistSignup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/api-status" element={<ApiStatus />} />
      <Route path="/outbox" element={<Outbox />} />
      <Route path="/preferences" element={<Preferences />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="/ledger" element={<Ledger />} />
      <Route path="/certificate/:id" element={<Certificate />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/partnerships" element={<Partnerships />} />
      <Route path="/partnerships/new" element={<IntakeForm />} />
      <Route path="/partnerships/:id" element={<IntakeDetail />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/dioceses" element={<Diocese />} />
      <Route path="/dioceses/:slug" element={<Diocese />} />
      <Route path="/letters" element={<Letters />} />
      <Route path="/library" element={<Library />} />
      <Route path="/share/:token" element={<Share />} />
      <Route path="/security" element={<Security />} />
      <Route path="/report" element={<Report />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/apprenticeships" element={<Apprenticeships />} />
      <Route path="/prize" element={<Prize />} />
      <Route path="/about" element={<About />} />
      <Route path="/manifesto" element={<Manifesto />} />
      <Route path="/verify/:token" element={<Verify />} />
      <Route path="/chancery/:token" element={<Chancery />} />
      <Route path="/features" element={<Features />} />
      <Route path="/demo" element={<Demo />} />
      {/* In gestation — features that need a real-world dependency
          before they can flip on. Each page is honest about what it
          needs. When the dependency lands, swap the page for the
          working feature. */}
      <Route path="/mass-intentions" element={<ComingSoon pageKey="mass-intentions" />} />
      <Route path="/memorabilia-book" element={<ComingSoon pageKey="memorabilia-book" />} />
      <Route path="/thank-you-card" element={<ComingSoon pageKey="thank-you-card" />} />
      <Route path="/reference-library" element={<ComingSoon pageKey="reference-library" />} />
      <Route path="/wip-timelapse" element={<ComingSoon pageKey="wip-timelapse" />} />
      {/* Vanity URL — the artist's "site" is the existing profile,
          reachable at /:slug as well as /artists/:slug. Reserved
          single-segment paths (declared above) win because they
          appear earlier in the route table. The wrapper checks the
          slug against the artist data to avoid hijacking 404s. */}
      <Route path="/:slug" element={<VanityArtist />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function VanityArtist() {
  const { slug = "" } = useParams<{ slug: string }>();
  const artist = artistBySlug(slug);
  if (!artist) return <NotFound />;
  // Redirect to the canonical /artists/:slug so the URL the artist
  // shares ("arssacra.com/maria-chrysostom") still resolves, but
  // the rest of the app continues to link through /artists/ for
  // back-compat and clarity.
  return <Navigate to={`/artists/${slug}`} replace />;
}

function MapLoading() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="font-sans text-xs uppercase tracking-[0.22em] text-ink-muted">
        Loading the map…
      </div>
    </div>
  );
}
