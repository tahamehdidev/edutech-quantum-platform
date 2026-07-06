import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./components/layouts/PublicLayout.jsx";
import { AuthenticatedLayout } from "./components/layouts/AuthenticatedLayout.jsx";
import { LandingPage } from "./pages/LandingPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SignupPage } from "./pages/SignupPage.jsx";
import { CourseCatalogPage } from "./pages/CourseCatalogPage.jsx";
import { CourseDetailPage } from "./pages/CourseDetailPage.jsx";
import { LessonPlayerPage } from "./pages/LessonPlayerPage.jsx";
import { PracticeSetPage } from "./pages/PracticeSetPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";

// Placeholder routes for every core screen (Frontend Milestone 0) -- real content, auth gating,
// and data fetching land in later milestones. Route shape here is the thing being proven, not
// the pages themselves.
export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      <Route element={<AuthenticatedLayout />}>
        <Route path="/courses" element={<CourseCatalogPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/lessons/:lessonId" element={<LessonPlayerPage />} />
        <Route path="/practice-sets/:practiceSetId" element={<PracticeSetPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
