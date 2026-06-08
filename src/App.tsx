import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Topology from "@/pages/Topology";
import Alerts from "@/pages/Alerts";
import Metrics from "@/pages/Metrics";
import DutyCalendar from "@/pages/DutyCalendar";
import EventTimeline from "@/pages/EventTimeline";
import Postmortem from "@/pages/Postmortem";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/topology" element={<Topology />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/duty" element={<DutyCalendar />} />
          <Route path="/timeline" element={<EventTimeline />} />
          <Route path="/postmortem" element={<Postmortem />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
