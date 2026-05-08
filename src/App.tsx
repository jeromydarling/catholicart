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
