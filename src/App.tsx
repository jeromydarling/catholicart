import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Browse from "./pages/Browse";
import ArtistProfile from "./pages/ArtistProfile";
import Commission from "./pages/Commission";
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
import NotFound from "./pages/NotFound";

// Heavy pages — code-split so mapbox-gl etc. don't bloat the main bundle.
const MapPage = lazy(() => import("./pages/Map"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/artists/:slug" element={<ArtistProfile />} />
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
      <Route path="/security" element={<Security />} />
      <Route path="/report" element={<Report />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/apprenticeships" element={<Apprenticeships />} />
      <Route path="/prize" element={<Prize />} />
      <Route path="/about" element={<About />} />
      <Route path="/manifesto" element={<Manifesto />} />
      <Route path="/verify/:token" element={<Verify />} />
      <Route path="/chancery/:token" element={<Chancery />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
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
