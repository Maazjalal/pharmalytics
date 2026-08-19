import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { HomePage } from "@/pages/HomePage";
import { MedicationsPage } from "@/pages/MedicationsPage";
import { ArchivedPage } from "@/pages/ArchivedPage";
import { ClientDetailPage } from "@/pages/ClientDetailPage";
import { ReportsPage } from "@/pages/ReportsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/medications" element={<MedicationsPage />} />
          <Route path="/archived" element={<ArchivedPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
