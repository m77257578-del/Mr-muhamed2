import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FloatingChat } from './components/FloatingChat';
import { FloatingAiAssistant } from './components/FloatingAiAssistant';
import { StudentSpace } from './components/StudentSpace';
import { ParentSpace } from './components/ParentSpace';
import { TeacherSpace } from './components/TeacherSpace';
import { MediaViewer } from './components/MediaViewer';
import { ExamModal } from './components/ExamModal';
import {
  PublicData,
  StudentData,
  ParentData,
  TeacherData,
  CourseContentItem,
  Exam,
} from './types';
import { apiRequest, tokens } from './services/api';

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('platform-theme') as 'light' | 'dark') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [activeTab, setActiveTab] = useState<'student' | 'parent' | 'teacher'>('student');
  const [publicData, setPublicData] = useState<PublicData | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);

  // Modals
  const [activeMedia, setActiveMedia] = useState<CourseContentItem | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);

  // PWA install prompt
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } else {
      alert(
        /iphone|ipad|ipod/i.test(navigator.userAgent)
          ? 'لتثبيت المنصة: اضغط زر مشاركة بالمتصفح ثم "إضافة إلى الشاشة الرئيسية".'
          : 'لتثبيت المنصة: افتح قائمة المتصفح ثم اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".'
      );
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.body.dataset.theme = next;
    try {
      localStorage.setItem('platform-theme', next);
    } catch {}
  };

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  // Load public data
  const loadPublic = async () => {
    try {
      const data = await apiRequest<PublicData>('public', '/api/public');
      setPublicData(data);
      if (data.name) {
        document.title = data.name;
      }
    } catch (e) {
      console.error('Failed to load public data', e);
    }
  };

  // Load Student
  const loadStudent = async () => {
    if (!tokens.student) {
      setStudentData(null);
      return;
    }
    try {
      const data = await apiRequest<StudentData>('student', '/api/student/me');
      setStudentData(data);
    } catch (e: any) {
      if (e.status === 401 || e.status === 403) {
        tokens.student = '';
        setStudentData(null);
      }
    }
  };

  // Load Parent
  const loadParent = async () => {
    if (!tokens.parent) {
      setParentData(null);
      return;
    }
    try {
      const data = await apiRequest<ParentData>('parent', '/api/parent/me');
      setParentData(data);
    } catch (e: any) {
      if (e.status === 401 || e.status === 403) {
        tokens.parent = '';
        setParentData(null);
      }
    }
  };

  // Load Teacher
  const loadTeacher = async () => {
    if (!tokens.teacher) {
      setTeacherData(null);
      return;
    }
    try {
      const data = await apiRequest<TeacherData>('teacher', '/api/teacher/all');
      setTeacherData(data);
    } catch (e: any) {
      if (e.status === 401 || e.status === 403) {
        tokens.teacher = '';
        setTeacherData(null);
      }
    }
  };

  useEffect(() => {
    loadPublic();
    if (tokens.student) loadStudent();
    if (tokens.parent) loadParent();
    if (tokens.teacher) loadTeacher();
  }, []);

  const currentUserRole = tokens.teacher
    ? 'teacher'
    : tokens.student
    ? 'student'
    : tokens.parent
    ? 'parent'
    : null;

  const currentUserName =
    currentUserRole === 'teacher'
      ? 'الأدمن'
      : currentUserRole === 'student'
      ? studentData?.profile?.name || 'طالب'
      : currentUserRole === 'parent'
      ? parentData?.name || 'ولي أمر'
      : '';

  const handleLoginClick = () => {
    setActiveTab('student');
    setTimeout(() => {
      const el = document.getElementById('s-auth');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleGlobalLogout = () => {
    tokens.student = '';
    tokens.parent = '';
    tokens.teacher = '';
    setStudentData(null);
    setParentData(null);
    setTeacherData(null);
    setActiveTab('student');
  };

  const handleNavigateToAdminSettings = () => {
    setActiveTab('teacher');
    setTimeout(() => {
      const el = document.getElementById('admin-settings');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        {/* Header */}
        <Header
          publicData={publicData}
          theme={theme}
          toggleTheme={toggleTheme}
          onInstall={handleInstallClick}
          onLoginClick={handleLoginClick}
          userRole={currentUserRole}
          userName={currentUserName}
          onLogout={handleGlobalLogout}
          onNavigateToAdminSettings={handleNavigateToAdminSettings}
        />

        {/* Main Navigation Tabs */}
        <nav className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-2 px-4 sm:px-8">
          <button
            type="button"
            className={`rounded-t-2xl py-3.5 font-extrabold text-base transition-all border-t border-x ${
              activeTab === 'student'
                ? 'bg-[#0f1b2d] text-cyan-300 border-cyan-400/50 border-b-4 border-b-cyan-400 shadow-xl'
                : 'bg-[#0a1220]/80 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            onClick={() => setActiveTab('student')}
          >
            مساحة الطالب
          </button>
          <button
            type="button"
            className={`rounded-t-2xl py-3.5 font-extrabold text-base transition-all border-t border-x ${
              activeTab === 'parent'
                ? 'bg-[#0f1b2d] text-cyan-300 border-cyan-400/50 border-b-4 border-b-cyan-400 shadow-xl'
                : 'bg-[#0a1220]/80 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            onClick={() => setActiveTab('parent')}
          >
            مساحة ولي الأمر
          </button>
        </nav>

        {/* Main View Area */}
        <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-8">
          {activeTab === 'student' && (
            <StudentSpace
              studentData={studentData}
              publicData={publicData}
              onRefresh={loadStudent}
              onOpenMedia={(c) => setActiveMedia(c)}
              onStartExam={(e) => setActiveExam(e)}
              onSwitchToTeacher={async () => {
                await loadTeacher();
                setActiveTab('teacher');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onLogout={() => {
                tokens.student = '';
                setStudentData(null);
              }}
            />
          )}

          {activeTab === 'parent' && (
            <ParentSpace
              parentData={parentData}
              onRefresh={loadParent}
              onLogout={() => {
                tokens.parent = '';
                setParentData(null);
              }}
            />
          )}

          {activeTab === 'teacher' && (
            <TeacherSpace
              teacherData={teacherData}
              onRefresh={loadTeacher}
              onUpdatePublic={loadPublic}
              onLogout={() => {
                tokens.teacher = '';
                setTeacherData(null);
                setActiveTab('student');
              }}
              onBackToStudent={() => setActiveTab('student')}
            />
          )}
        </main>
      </div>

      {/* Floating Smart AI Assistant (System 8 & 9) with strict Anti-Cheat guard during exams */}
      <FloatingAiAssistant
        role={activeTab}
        isExamActive={!!activeExam}
        studentName={studentData?.profile?.name}
      />

      {/* Floating Messenger between Student/Parent and Teacher (System 7) */}
      <FloatingChat
        studentProfile={studentData?.profile}
        parentData={parentData}
      />

      {/* Social Media Links & Learn Web Enter Button Footer */}
      <Footer socialLinks={publicData?.socialLinks} />

      {/* Media Viewer Modal */}
      {activeMedia && (
        <MediaViewer
          content={activeMedia}
          role={activeTab === 'teacher' ? 'teacher' : 'student'}
          profile={studentData?.profile}
          onClose={() => setActiveMedia(null)}
        />
      )}

      {/* Exam Modal */}
      {activeExam && (
        <ExamModal
          exam={activeExam}
          onClose={() => setActiveExam(null)}
          onSuccess={(score, total) => {
            setActiveExam(null);
            loadStudent();
            alert(
              score !== null
                ? `تم تصحيح الامتحان تلقائياً: ${score} من ${total}`
                : 'تم إرسال إجاباتك بنجاح للأستاذ للتصحيح.'
            );
          }}
        />
      )}
    </div>
  );
}

export default App;
