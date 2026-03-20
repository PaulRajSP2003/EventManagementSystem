// src/App.tsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PageNotFoundCompound from './components/PageNotFoundCompound';
import { AuthProvider } from './owner/context/AuthContext';
import { UserAuthProvider, useUserAuth } from './user/pages/auth/UserAuthContext';
import { SignalRProvider } from './user/context/SignalRContext';
import UserProtectedRoute from './user/pages/auth/UserProtectedRoute';
// User - Auth
import LoginPage from './user/pages/auth/Login';
// User - Profile
import MyProfile from './user/pages/profile/MyProfile';
// User - Dashboard
import Dashboard from './user/pages/dashboard/Dashboard';
// User - Student
import StudentNew from './user/pages/student/StudentNew';
import StudentList from './user/pages/student/StudentList';
import StudentDetail from './user/pages/student/StudentDetail';
import StudentEdit from './user/pages/student/StudentEdit';
import StudentHistory from './user/pages/student/StudentHistory';
// User - Leader
import LeaderNew from './user/pages/leader/LeaderNew';
import LeaderList from './user/pages/leader/LeaderList';
import LeaderDetail from './user/pages/leader/LeaderDetail';
import LeaderEdit from './user/pages/leader/LeaderEdit';
import LeaderHistory from './user/pages/leader/LeaderHistory';
// User - Group
import SubGroupDetails from './user/pages/group/SubGroupDetails';
import FollowingGroupDetails from './user/pages/group/FollowingGroupDetails';
// User - Medical
import ReportNew from './user/pages/medical/ReportNew';
import ReportList from './user/pages/medical/ReportList';
import ReportDetails from './user/pages/medical/ReportDetails';
import ReportEdit from './user/pages/medical/ReportEdit';
// User - Room
import RoomDetails from './user/pages/room/RoomDetails';
// User - Replacement
import ReplacementStudentDetail from './user/pages/replacement/ReplacementStudentDetails';
import ReplacementLeaderDetail from './user/pages/replacement/ReplacementLeaderDetails';
import TaskList from './user/pages/task/TaskList';
import TaskDetail from './user/pages/task/TaskDetail';

// Admin - Event Settings
import EventSettings from './user/pages/admin/EventSettings';
// Admin - User Management
import UserNew from './user/pages/admin/UserNew';
import UserList from './user/pages/admin/UserList';
import UserDetail from './user/pages/admin/UserDetail';
import UserEdit from './user/pages/admin/UserEdit';

// Components
import { NavBar } from './user/pages/components';
import UserPageLayout from './user/pages/components/UserPageLayout';

// Owner - Auth
import OwnerLogin from './owner/pages/auth/OwnerLogin';
import ProtectedRoute from './owner/pages/auth/ProtectedRoute';
// Owner - Dashboard
import OwnerDashboard from './owner/pages/dashboard/OwnerDashboard';
// Owner - Event
import EventList from './owner/pages/event/EventList';
import EventNew from './owner/pages/event/EventNew';
import EventEdit from './owner/pages/event/EventEdit';
import EventDetails from './owner/pages/event/EventDetails';
// Owner - Admin
import AdminList from './owner/pages/admin/AdminList';
import AdminNew from './owner/pages/admin/AdminNew';
import AdminEdit from './owner/pages/admin/AdminEdit';
import AdminDetails from './owner/pages/admin/AdminDetails';
import StudentExcel from './user/pages/student/StudentExcel';
import LeaderExcel from './user/pages/leader/LeaderExcel';
import Bridge from './user/pages/auth/Bridge';

const AppContent = () => {
  const { isLoading } = useUserAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Show Bridge during initial app loading
  if (isLoading && !location.pathname.startsWith('/owner')) {
    return <Bridge noBlur={false} />;
  }
  const hideNavBarPatterns = [
    /^\/$/,
    /^\/login/,
    /^\/register/,
    /^\/user\/login/,
    /^\/user\/register/,
    /^\/owner/,
  ];

  const shouldShowNavBar = !isMobile && !hideNavBarPatterns.some(pattern => pattern.test(location.pathname));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {shouldShowNavBar && <NavBar />}
      <main>
        <Routes>
          {/* Login Routes - Public */}
          <Route path="/user/login/:eventId" element={<LoginPage />} />
          <Route path="/user/login" element={<LoginPage />} />
          <Route path="/login/:eventId" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/user/login" replace />} />

          {/* User Pages - Protected */}
          <Route
            path="/user/*"
            element={
              <UserProtectedRoute>
                <UserPageLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="profile" element={<MyProfile />} />
                    {/* STUDENTS */}
                    <Route path="student" element={<StudentList />} />
                    <Route path="student/new" element={<StudentNew />} />
                    <Route path="student/:id" element={<StudentDetail />} />
                    <Route path="student/edit/:id" element={<StudentEdit />} />
                    <Route path="student/history/:id" element={<StudentHistory />} />
                    <Route path="student/excel" element={<StudentExcel />} />
                    {/* LEADERS */}
                    <Route path="leader" element={<LeaderList />} />
                    <Route path="leader/new" element={<LeaderNew />} />
                    <Route path="leader/:id" element={<LeaderDetail />} />
                    <Route path="leader/edit/:id" element={<LeaderEdit />} />
                    <Route path="leader/history/:id" element={<LeaderHistory />} />
                    <Route path="leader/excel" element={<LeaderExcel />} />
                    {/* GROUPS */}
                    <Route path="group/sub/:groupId/:subGroup?" element={<SubGroupDetails />} />
                    <Route path="group/follow/:groupId/:subGroup?" element={<FollowingGroupDetails />} />
                    {/* MEDICAL */}
                    <Route path="medical" element={<ReportList />} />
                    <Route path="medical/new" element={<ReportNew />} />
                    <Route path="medical/:reportId" element={<ReportDetails />} />
                    <Route path="medical/edit/:reportId" element={<ReportEdit />} />
                    {/* ROOMS */}
                    <Route path="room/:gender" element={<RoomDetails />} />
                    <Route path="room/:gender/:roomName" element={<RoomDetails />} />
                    <Route path="room/:gender/:roomName/:subGroup" element={<RoomDetails />} />
                    <Route path="room/waiting_list" element={<Navigate to="/user/room/male?view=waiting" replace />} />
                    {/* REPLACEMENTS */}
                    <Route path="student/replacement/:id" element={<ReplacementStudentDetail />} />
                    <Route path="leader/replacement/:id" element={<ReplacementLeaderDetail />} />
                    {/* TASKS */}
                    <Route path="task" element={<TaskList />} />
                    <Route path="task/:leaderId/:publicTaskId" element={<TaskDetail />} />
                    <Route path="task/:leaderId/:publicTaskId/:taskId" element={<TaskDetail />} />
                    <Route path="*" element={<PageNotFoundCompound />} />
                  </Routes>
                </UserPageLayout>
              </UserProtectedRoute>
            }
          />

          {/* Admin Pages - Protected */}
          <Route
            path="/admin/*"
            element={
              <UserProtectedRoute>
                <UserPageLayout>
                  <Routes>
                    <Route path="users" element={<UserList />} />
                    <Route path="users/new" element={<UserNew />} />
                    <Route path="users/:id" element={<UserDetail />} />
                    <Route path="users/edit/:id" element={<UserEdit />} />
                    <Route path="event/settings" element={<EventSettings />} />
                    <Route path="*" element={<PageNotFoundCompound />} />
                  </Routes>
                </UserPageLayout>
              </UserProtectedRoute>
            }
          />

          {/* Owner Routes */}
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />
          <Route path="/owner/event" element={<ProtectedRoute><EventList /></ProtectedRoute>} />
          <Route path="/owner/event/new" element={<ProtectedRoute><EventNew /></ProtectedRoute>} />
          <Route path="/owner/event/edit/:id" element={<ProtectedRoute><EventEdit /></ProtectedRoute>} />
          <Route path="/owner/event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/owner/admin" element={<ProtectedRoute><AdminList /></ProtectedRoute>} />
          <Route path="/owner/admin/new" element={<ProtectedRoute><AdminNew /></ProtectedRoute>} />
          <Route path="/owner/admin/edit/:id" element={<ProtectedRoute><AdminEdit /></ProtectedRoute>} />
          <Route path="/owner/admin/:id" element={<ProtectedRoute><AdminDetails /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<PageNotFoundCompound />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <UserAuthProvider>
          <SignalRProvider>
            <AppContent />
          </SignalRProvider>
        </UserAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;