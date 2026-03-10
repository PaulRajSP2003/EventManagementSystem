// src/App.tsx
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import PageNotFoundCompound from './components/PageNotFoundCompound';
import { AuthProvider } from './owner/context/AuthContext';
import { UserAuthProvider } from './user/pages/auth/UserAuthContext';
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
// Admin - Event Settings
import EventSettings from './user/pages/admin/EventSettings';
// Admin - User Management (keeping in user for now as these are under admin)
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
// Owner - Profile
import OwnerProfile from './owner/pages/profile/OwnerProfile';
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

const AppContent = () => {
  const location = useLocation();


  const hideNavBarPatterns = [
    /^\/$/,
    /^\/login/,
    /^\/register/,
    /^\/user\/login/,
    /^\/user\/register/,
    /^\/owner/,
  ];

  const shouldShowNavBar = !hideNavBarPatterns.some(pattern => pattern.test(location.pathname));


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {shouldShowNavBar && <NavBar />}
      <main>
        <Routes>
          <Route path="/user/room/waiting_list" element={
            <UserProtectedRoute>
              <Navigate to="/user/room/male?view=waiting" replace />
            </UserProtectedRoute>
          } />
          <Route path="/user/login/:eventId" element={<LoginPage />} />
          <Route path="/user/login" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />

          {/* USER PAGES WRAPPED WITH LAYOUT */}
          <Route
            path="/user/*"
            element={
              <UserPageLayout>
                <Routes>
                  <Route path="dashboard" element={<UserProtectedRoute><Dashboard /></UserProtectedRoute>} />
                  <Route path="profile" element={<UserProtectedRoute><MyProfile /></UserProtectedRoute>} />
                  {/* STUDENTS */}
                  <Route path="student" element={<UserProtectedRoute><StudentList /></UserProtectedRoute>} />
                  <Route path="student/new" element={<UserProtectedRoute><StudentNew /></UserProtectedRoute>} />
                  <Route path="student/:id" element={<UserProtectedRoute><StudentDetail /></UserProtectedRoute>} />
                  <Route path="student/edit/:id" element={<UserProtectedRoute><StudentEdit /></UserProtectedRoute>} />
                  <Route path="student/history/:id" element={<UserProtectedRoute><StudentHistory /></UserProtectedRoute>} />
                  {/* LEADERS */}
                  <Route path="leader" element={<UserProtectedRoute><LeaderList /></UserProtectedRoute>} />
                  <Route path="leader/new" element={<UserProtectedRoute><LeaderNew /></UserProtectedRoute>} />
                  <Route path="leader/:id" element={<UserProtectedRoute><LeaderDetail /></UserProtectedRoute>} />
                  <Route path="leader/edit/:id" element={<UserProtectedRoute><LeaderEdit /></UserProtectedRoute>} />
                  <Route path="leader/history/:id" element={<UserProtectedRoute><LeaderHistory /></UserProtectedRoute>} />
                  {/* GROUPS */}
                  <Route path="group/sub/:groupId" element={<UserProtectedRoute><SubGroupDetails /></UserProtectedRoute>} />
                  <Route path="group/follow/:groupId" element={<UserProtectedRoute><FollowingGroupDetails /></UserProtectedRoute>} />
                  {/* MEDICAL REPORTS */}
                  <Route path="medical" element={<UserProtectedRoute><ReportList /></UserProtectedRoute>} />
                  <Route path="medical/new" element={<UserProtectedRoute><ReportNew /></UserProtectedRoute>} />
                  <Route path="medical/:reportId" element={<UserProtectedRoute><ReportDetails /></UserProtectedRoute>} />
                  <Route path="medical/edit/:reportId" element={<UserProtectedRoute><ReportEdit /></UserProtectedRoute>} />
                  {/* ROOMS */}
                  <Route path="room/:gender" element={<UserProtectedRoute><RoomDetails /></UserProtectedRoute>} />
                  <Route path="room/:gender/:roomName" element={<UserProtectedRoute><RoomDetails /></UserProtectedRoute>} />
                  <Route path="room/:gender/:roomName/:subGroup" element={<UserProtectedRoute><RoomDetails /></UserProtectedRoute>} />
                  {/* REPLACEMENTS */}
                  <Route path="student/replacement/:id" element={<UserProtectedRoute><ReplacementStudentDetail /></UserProtectedRoute>} />
                  <Route path="leader/replacement/:id" element={<UserProtectedRoute><ReplacementLeaderDetail /></UserProtectedRoute>} />
                  <Route path="student/excel" element={<UserProtectedRoute><StudentExcel /></UserProtectedRoute>} />
                  <Route path="leader/excel" element={<UserProtectedRoute><LeaderExcel /></UserProtectedRoute>} />
                  {/* Catch-all route for 404 */}
                  <Route path="*" element={<PageNotFoundCompound />} />
                </Routes>
              </UserPageLayout>
            }
          />

          {/* ADMIN PAGES WRAPPED WITH LAYOUT */}
          <Route
            path="/admin/*"
            element={
              <UserPageLayout>
                <Routes>
                  <Route path="users" element={<UserProtectedRoute><UserList /></UserProtectedRoute>} />
                  <Route path="users/new" element={<UserProtectedRoute><UserNew /></UserProtectedRoute>} />
                  <Route path="users/:id" element={<UserProtectedRoute><UserDetail /></UserProtectedRoute>} />
                  <Route path="users/edit/:id" element={<UserProtectedRoute><UserEdit /></UserProtectedRoute>} />
                  <Route path="event/settings" element={<UserProtectedRoute><EventSettings /></UserProtectedRoute>} />
                  {/* Catch-all route for 404 */}
                  <Route path="*" element={<PageNotFoundCompound />} />
                </Routes>
              </UserPageLayout>
            }
          />

          {/* Owner Section Routes */}
          {/* Public owner route */}
          <Route path="/owner/login" element={<OwnerLogin />} />

          {/* Protected owner routes */}
          <Route path="/owner/dashboard" element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/owner/profile" element={
            <ProtectedRoute>
              <OwnerProfile />
            </ProtectedRoute>
          } />

          {/* Owner Event Management Routes */}
          <Route path="/owner/event" element={
            <ProtectedRoute>
              <EventList />
            </ProtectedRoute>
          } />
          <Route path="/owner/event/new" element={
            <ProtectedRoute>
              <EventNew />
            </ProtectedRoute>
          } />
          <Route path="/owner/event/edit/:id" element={
            <ProtectedRoute>
              <EventEdit />
            </ProtectedRoute>
          } />
          <Route path="/owner/event/:id" element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          } />

          {/* Owner Admin Management Routes */}
          <Route path="/owner/admin" element={
            <ProtectedRoute>
              <AdminList />
            </ProtectedRoute>
          } />
          <Route path="/owner/admin/new" element={
            <ProtectedRoute>
              <AdminNew />
            </ProtectedRoute>
          } />
          <Route path="/owner/admin/edit/:id" element={
            <ProtectedRoute>
              <AdminEdit />
            </ProtectedRoute>
          } />
          <Route path="/owner/admin/:id" element={
            <ProtectedRoute>
              <AdminDetails />
            </ProtectedRoute>
          } />

          {/* ADD THIS CATCH-ALL ROUTE FOR ANY OTHER PATHS */}
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
          <AppContent />
        </UserAuthProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
