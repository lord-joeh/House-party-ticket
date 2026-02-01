import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Buy from "./pages/Buy";
import Processing from "./pages/Processing";
import Confirmation from "./pages/Confirmation";
import Verify from "./pages/Verify";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/buy" element={<Buy />} />
        <Route path="/processing" element={<Processing />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/verify" element={<Verify />} />
      </Route>
    </Routes>
  );
}
