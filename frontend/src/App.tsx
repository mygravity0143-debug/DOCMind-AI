import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentLibraryPage } from './pages/DocumentLibraryPage';
import { UploadPage } from './pages/UploadPage';
import { ResearchChatPage } from './pages/ResearchChatPage';
import { PdfViewerPage } from './pages/PdfViewerPage';
import { ConversationHistoryPage } from './pages/ConversationHistoryPage';
import { StudyToolsPage } from './pages/StudyToolsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

interface PageParams {
  documentId?: string;
  pageNumber?: number;
  highlightText?: string;
  initialSessionId?: string;
  initialTab?: string;
}

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');
  const [pageParams, setPageParams] = useState<PageParams>({});

  const navigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params || {});
    window.scrollTo(0, 0);
  };

  // Global loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060A14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[2px] animate-pulse">
              <div className="w-full h-full bg-[#060A14] rounded-[14px] flex items-center justify-center">
                <span className="text-xl font-bold text-blue-400">D</span>
              </div>
            </div>
          </div>
          <span className="text-sm text-slate-400 animate-pulse">Loading DocMind AI…</span>
        </div>
      </div>
    );
  }

  // Determine if we should show the sidebar layout
  const isPublicPage = ['landing', 'login', 'register'].includes(currentPage);
  const showAppShell = isAuthenticated && !isPublicPage;

  // Redirect authenticated users from landing to dashboard
  if (isAuthenticated && currentPage === 'landing') {
    // Don't auto-redirect — let the user click into Dashboard
  }

  // Redirect unauthenticated users from protected pages to login
  if (!isAuthenticated && !isPublicPage) {
    // Show the landing page instead
    return (
      <div className="min-h-screen bg-[#060A14] text-white">
        <Navbar onNavigate={navigate} currentPage="landing" />
        <LandingPage onNavigate={navigate} />
      </div>
    );
  }

  // Render the appropriate page content
  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={navigate} />;
      case 'login':
        return <LoginPage onNavigate={navigate} />;
      case 'register':
        return <RegisterPage onNavigate={navigate} />;
      case 'dashboard':
        return <DashboardPage onNavigate={navigate} />;
      case 'library':
        return <DocumentLibraryPage onNavigate={navigate} />;
      case 'upload':
        return <UploadPage onNavigate={navigate} />;
      case 'chat':
        return (
          <ResearchChatPage
            initialSessionId={pageParams.initialSessionId}
            onNavigate={navigate}
          />
        );
      case 'pdf-viewer':
        return (
          <PdfViewerPage
            documentId={pageParams.documentId}
            pageNumber={pageParams.pageNumber}
            highlightText={pageParams.highlightText}
            onNavigate={navigate}
          />
        );
      case 'history':
        return <ConversationHistoryPage onNavigate={navigate} />;
      case 'study':
        return (
          <StudyToolsPage
            initialTab={pageParams.initialTab}
            onNavigate={navigate}
          />
        );
      case 'settings':
        return <SettingsPage />;
      case 'admin':
        return <AdminDashboardPage />;
      default:
        return <DashboardPage onNavigate={navigate} />;
    }
  };

  // Public pages (no sidebar)
  if (!showAppShell) {
    return (
      <div className="min-h-screen bg-[#060A14] text-white">
        <Navbar onNavigate={navigate} currentPage={currentPage} />
        {renderPage()}
      </div>
    );
  }

  // Authenticated app shell with sidebar
  return (
    <div className="min-h-screen bg-[#060A14] text-white flex flex-col">
      <Navbar onNavigate={navigate} currentPage={currentPage} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={navigate} />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;
