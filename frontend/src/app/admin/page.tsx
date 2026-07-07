"use client";

import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import {
  useAdminAnalytics,
  useAdminStudents,
  useAdminStudentProgress,
  useAdminUpdateUserRole,
  useAdminResetUserPassword,
  useAdminDeleteUser,
  useCourses,
  useSemesters,
  useSubject,
  useAdminCreateSemester,
  useAdminUpdateSemester,
  useAdminDeleteSemester,
  useAdminCreateSubject,
  useAdminUpdateSubject,
  useAdminDeleteSubject,
  useAdminCreateChapter,
  useAdminUpdateChapter,
  useAdminDeleteChapter,
  useAdminCreateLesson,
  useAdminUpdateLesson,
  useAdminDeleteLesson
} from "@/hooks/useApi";
import {
  Loader2,
  Users,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Settings,
  Trash2,
  Plus,
  BookOpen,
  FolderOpen,
  Calendar,
  Sparkles,
  Key,
  KeyRound,
  ShieldCheck,
  Search,
  Eye,
  Edit2
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"analytics" | "curriculum" | "users">("analytics");
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();
  const { data: students = [], isLoading: studentsLoading } = useAdminStudents();

  // Curriculum Editor states
  const [selectedCourseId] = useState(1); // Default A-level Course ID
  const { data: semesters = [], isLoading: semestersLoading } = useSemesters(selectedCourseId);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const { data: subjectDetails } = useSubject(selectedSubjectId || 0);

  // User list search state
  const [userSearch, setUserSearch] = useState("");

  // Modals state
  const [progressModalUser, setProgressModalUser] = useState<any | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<any | null>(null);
  const [passModalUser, setPassModalUser] = useState<any | null>(null);

  // CMS modal state
  const [activeCmsModal, setActiveCmsModal] = useState<{
    type: "semester" | "subject" | "chapter" | "lesson";
    action: "create" | "edit";
    id?: number; // target ID to edit/delete
    parentId?: number; // parent container ID
    initialData?: any;
  } | null>(null);

  // Form input states
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formVideoProvider, setFormVideoProvider] = useState("youtube");
  const [formVideoId, setFormVideoId] = useState("");
  const [formPrerequisites, setFormPrerequisites] = useState("");
  const [formOutcomes, setFormOutcomes] = useState("");
  const [formRole, setFormRole] = useState("student");
  const [formPassword, setFormPassword] = useState("");

  // API mutations
  const updateRoleMutation = useAdminUpdateUserRole();
  const resetPassMutation = useAdminResetUserPassword();
  const deleteUserMutation = useAdminDeleteUser();

  const createSemMutation = useAdminCreateSemester();
  const updateSemMutation = useAdminUpdateSemester();
  const deleteSemMutation = useAdminDeleteSemester();

  const createSubMutation = useAdminCreateSubject();
  const updateSubMutation = useAdminUpdateSubject();
  const deleteSubMutation = useAdminDeleteSubject();

  const createChapterMutation = useAdminCreateChapter();
  const updateChapterMutation = useAdminUpdateChapter();
  const deleteChapterMutation = useAdminDeleteChapter();

  const createLessonMutation = useAdminCreateLesson();
  const updateLessonMutation = useAdminUpdateLesson();
  const deleteLessonMutation = useAdminDeleteLesson();

  // Reset modal input values
  const resetFormStates = () => {
    setFormTitle("");
    setFormDesc("");
    setFormCode("");
    setFormOrder(0);
    setFormVideoProvider("youtube");
    setFormVideoId("");
    setFormPrerequisites("");
    setFormOutcomes("");
    setFormPassword("");
    setActiveCmsModal(null);
  };

  const handleOpenCmsModal = (type: any, action: any, parentId?: number, item?: any) => {
    resetFormStates();
    setActiveCmsModal({ type, action, parentId, id: item?.id, initialData: item });
    if (item) {
      setFormTitle(item.title || "");
      setFormDesc(item.description || "");
      setFormCode(item.code || "");
      setFormOrder(item.order || 0);
      setFormVideoProvider(item.video_provider || "youtube");
      setFormVideoId(item.video_id || "");
      setFormPrerequisites(item.prerequisites || "");
      setFormOutcomes(item.outcomes || "");
    }
  };

  const handleCmsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCmsModal) return;

    const { type, action, id, parentId } = activeCmsModal;

    if (type === "semester") {
      if (action === "create") {
        createSemMutation.mutate({ course_id: selectedCourseId, title: formTitle, description: formDesc, order: Number(formOrder) }, { onSuccess: resetFormStates });
      } else if (action === "edit" && id) {
        updateSemMutation.mutate({ id, title: formTitle, description: formDesc, order: Number(formOrder) }, { onSuccess: resetFormStates });
      }
    } else if (type === "subject") {
      if (action === "create" && parentId) {
        createSubMutation.mutate({ semester_id: parentId, title: formTitle, description: formDesc, code: formCode, order: Number(formOrder) }, { onSuccess: resetFormStates });
      } else if (action === "edit" && id) {
        updateSubMutation.mutate({ id, title: formTitle, description: formDesc, code: formCode, order: Number(formOrder) }, { onSuccess: resetFormStates });
      }
    } else if (type === "chapter") {
      if (action === "create" && parentId) {
        createChapterMutation.mutate({ subject_id: parentId, title: formTitle, description: formDesc, order: Number(formOrder) }, { onSuccess: resetFormStates });
      } else if (action === "edit" && id) {
        updateChapterMutation.mutate({ id, title: formTitle, description: formDesc, order: Number(formOrder) }, { onSuccess: resetFormStates });
      }
    } else if (type === "lesson") {
      if (action === "create" && parentId) {
        createLessonMutation.mutate({
          chapter_id: parentId,
          title: formTitle,
          description: formDesc,
          video_provider: formVideoProvider,
          video_id: formVideoId,
          duration_seconds: 0,
          order: Number(formOrder),
          prerequisites: formPrerequisites,
          outcomes: formOutcomes
        }, { onSuccess: resetFormStates });
      } else if (action === "edit" && id) {
        updateLessonMutation.mutate({
          id,
          title: formTitle,
          description: formDesc,
          video_provider: formVideoProvider,
          video_id: formVideoId,
          order: Number(formOrder),
          prerequisites: formPrerequisites,
          outcomes: formOutcomes
        }, { onSuccess: resetFormStates });
      }
    }
  };

  const handleUpdateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalUser) return;
    updateRoleMutation.mutate({ userId: roleModalUser.id, role: formRole }, {
      onSuccess: () => {
        setRoleModalUser(null);
        setFormRole("student");
      }
    });
  };

  const handleResetPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passModalUser || !formPassword.trim()) return;
    resetPassMutation.mutate({ userId: passModalUser.id, password: formPassword }, {
      onSuccess: () => {
        setPassModalUser(null);
        setFormPassword("");
      }
    });
  };

  const handleDeleteUserClick = (userId: number) => {
    if (confirm("Are you sure you want to permanently delete this user account? This cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Filter students by search query
  const filteredStudents = students.filter((std: any) =>
    std.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    std.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen overflow-hidden bg-bg-dark tech-grid">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-brand-500 tracking-wider uppercase">Founder Administration</span>
                <h1 className="text-xl font-extrabold text-foreground mt-0.5 glow-text-indigo">Academy Operations Hub</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Manage student profiles, update credentials, change roles, and curate courses, semesters, subjects, chapters, and lessons.
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-card-dark/60 border border-border/60 rounded-xl p-1 shrink-0">
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "analytics"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-foreground"
                  }`}
                >
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab("curriculum")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "curriculum"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-foreground"
                  }`}
                >
                  Curriculum CMS
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "users"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-foreground"
                  }`}
                >
                  User Operations
                </button>
              </div>
            </div>

            {/* TAB CONTENT: ANALYTICS */}
            {activeTab === "analytics" && (
              analyticsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
              ) : !analytics ? (
                <div className="p-8 text-center border border-border bg-card-dark rounded-2xl max-w-sm mx-auto space-y-4">
                  <ShieldAlert className="w-10 h-10 text-danger-500 mx-auto" />
                  <h3 className="text-xs font-bold text-foreground">Access Restricted</h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Only administrators hold permissions to view analytics logs.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl border border-border bg-card-dark flex items-center justify-between glass-card">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Registered Accounts</span>
                        <span className="text-xl font-black text-foreground mt-1 block">{analytics.total_students}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-brand-glow text-brand-500 border border-brand-500/10">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border bg-card-dark flex items-center justify-between glass-card">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Active Learners Today</span>
                        <span className="text-xl font-black text-foreground mt-1 block">{analytics.active_today}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/15">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-border bg-card-dark flex items-center justify-between glass-card">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Average Study Progress</span>
                        <span className="text-xl font-black text-foreground mt-1 block">{analytics.average_completion_percentage}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/15">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* High-XP Ledger */}
                    <div className="md:col-span-2 p-5 rounded-2xl border border-border bg-card-dark space-y-4 glass-card">
                      <span className="text-xs font-extrabold text-foreground block pb-2 border-b border-border/40">Top Performers Leaderboard</span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="text-gray-500 border-b border-border/40 pb-2">
                              <th className="font-semibold pb-2">Name</th>
                              <th className="font-semibold pb-2 text-center">Score XP</th>
                              <th className="font-semibold pb-2 text-center">Streak</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {analytics.top_performers?.map((std: any, idx: number) => (
                              <tr key={idx} className="hover:bg-bg-dark/40 transition-colors">
                                <td className="py-2.5 font-bold text-foreground">{std.name}</td>
                                <td className="py-2.5 text-center font-bold text-brand-500">{std.xp}</td>
                                <td className="py-2.5 text-center text-orange-500 font-bold">{std.streak}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Difficult Chapters */}
                    <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4 glass-card">
                      <span className="text-xs font-extrabold text-foreground block pb-2 border-b border-border/40">Difficult Concepts Alert</span>
                      <div className="space-y-3">
                        {analytics.difficult_chapters?.length === 0 ? (
                          <p className="text-xs text-gray-500 py-4 text-center">All topics hold strong compliance averages.</p>
                        ) : (
                          analytics.difficult_chapters?.map((ch: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-xl bg-bg-dark border border-danger-500/10 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />
                              <div>
                                <h4 className="text-[11px] font-bold text-foreground leading-snug">{ch.chapter_title}</h4>
                                <span className="text-[9px] text-danger-500 font-bold mt-1 block">Avg Quiz score: {ch.avg_score}%</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* TAB CONTENT: CURRICULUM CMS */}
            {activeTab === "curriculum" && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left panel: Semester and Subject list */}
                <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4 glass-card">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <span className="text-xs font-extrabold text-foreground">Syllabus Explorer</span>
                    <button
                      onClick={() => handleOpenCmsModal("semester", "create")}
                      className="p-1 rounded bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Semester</span>
                    </button>
                  </div>

                  {semestersLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
                  ) : semesters.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-6">No semesters created yet.</p>
                  ) : (
                    <div className="space-y-6">
                      {semesters.map((sem: any) => (
                        <div key={sem.id} className="space-y-2">
                          {/* Semester heading */}
                          <div className="flex justify-between items-center group bg-bg-dark/40 px-2 py-1.5 rounded-lg border border-border/20">
                            <div>
                              <span className="text-xs font-bold text-foreground">{sem.title}</span>
                              <p className="text-[9px] text-gray-500">{sem.description}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-all">
                              <button
                                onClick={() => handleOpenCmsModal("semester", "edit", undefined, sem)}
                                className="p-1 text-gray-400 hover:text-brand-500"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Delete this semester? All child subjects, chapters, and lessons will be cascade deleted!")) {
                                    deleteSemMutation.mutate(sem.id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-danger-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Subjects list */}
                          <div className="space-y-1.5 pl-3 border-l border-border/40">
                            {sem.subjects?.map((sub: any) => (
                              <div
                                key={sub.id}
                                onClick={() => setSelectedSubjectId(sub.id)}
                                className={`p-2 rounded-lg border transition-all flex justify-between items-center group cursor-pointer ${
                                  selectedSubjectId === sub.id
                                    ? "bg-brand-600/10 border-brand-500 text-brand-400"
                                    : "bg-bg-dark/20 border-border/40 hover:border-brand-500/20 text-gray-400 hover:text-foreground"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                  <span className="text-[11px] font-bold truncate max-w-[120px]">{sub.title}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenCmsModal("subject", "edit", undefined, sub);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-brand-500 transition-all"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Delete this subject? Chapters and lessons will be cascade deleted!")) {
                                        deleteSubMutation.mutate(sub.id);
                                        if (selectedSubjectId === sub.id) setSelectedSubjectId(null);
                                      }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-danger-500 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            <button
                              onClick={() => handleOpenCmsModal("subject", "create", sem.id)}
                              className="w-full py-1 border border-dashed border-border/60 hover:border-brand-500/30 text-gray-500 hover:text-brand-500 rounded text-[10px] font-bold flex items-center justify-center gap-1 mt-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Subject</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right panel: Chapters and Lessons inside selected Subject */}
                <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-card-dark space-y-4 glass-card">
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Syllabus Details</span>
                      <h3 className="text-xs font-bold text-foreground">
                        {selectedSubjectId ? `Subject: ${subjectDetails?.title || "Loading..."}` : "Select a Subject to inspect curriculum"}
                      </h3>
                    </div>
                    {selectedSubjectId && (
                      <button
                        onClick={() => handleOpenCmsModal("chapter", "create", selectedSubjectId)}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Chapter</span>
                      </button>
                    )}
                  </div>

                  {!selectedSubjectId ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
                      <FolderOpen className="w-10 h-10 mb-2 opacity-40 text-brand-500" />
                      <p className="text-xs font-bold">No Subject Selected</p>
                      <p className="text-[10px] max-w-xs mt-1 leading-relaxed">
                        Select a module from the explorer panel on the left to review, create, or modify its active syllabus chapters.
                      </p>
                    </div>
                  ) : !subjectDetails?.chapters || subjectDetails.chapters.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-10">No chapters found for this subject. Create one above.</p>
                  ) : (
                    <div className="space-y-6">
                      {subjectDetails.chapters.map((ch: any) => (
                        <div key={ch.id} className="p-4 rounded-xl border border-border/60 bg-bg-dark/40 space-y-3">
                          {/* Chapter Header */}
                          <div className="flex justify-between items-center pb-2 border-b border-border/20 group">
                            <div>
                              <h4 className="text-xs font-bold text-foreground">{ch.title}</h4>
                              <p className="text-[9px] text-gray-500 leading-snug">{ch.description}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-all">
                              <button
                                onClick={() => handleOpenCmsModal("chapter", "edit", undefined, ch)}
                                className="p-1 text-gray-400 hover:text-brand-500"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Delete this chapter? All child lessons will be cascade deleted!")) {
                                    deleteChapterMutation.mutate(ch.id);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-danger-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Lessons Grid list */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {ch.lessons?.map((ls: any) => (
                              <div key={ls.id} className="p-3 rounded-lg bg-card-dark border border-border/40 hover:border-brand-500/20 transition-all flex flex-col justify-between h-28 group relative">
                                <div>
                                  <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-glow border border-brand-500/10 text-brand-500">
                                      Lesson
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1.5 transition-all">
                                      <button
                                        onClick={() => handleOpenCmsModal("lesson", "edit", undefined, ls)}
                                        className="p-0.5 text-gray-400 hover:text-brand-500"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm("Delete this lesson?")) {
                                            deleteLessonMutation.mutate(ls.id);
                                          }
                                        }}
                                        className="p-0.5 text-gray-400 hover:text-danger-500"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <h5 className="text-[11px] font-extrabold text-foreground mt-2 line-clamp-1">{ls.title}</h5>
                                  <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{ls.description || "No notes content provided."}</p>
                                </div>
                                <span className="text-[9px] text-gray-500 font-bold block pt-1.5 border-t border-border/20">
                                  Video ID: {ls.video_id || "None"}
                                </span>
                              </div>
                            ))}

                            <button
                              onClick={() => handleOpenCmsModal("lesson", "create", ch.id)}
                              className="h-28 rounded-lg border border-dashed border-border/60 hover:border-brand-500/30 text-gray-500 hover:text-brand-500 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Lesson</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: USER OPERATIONS */}
            {activeTab === "users" && (
              studentsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
              ) : (
                <div className="p-5 rounded-2xl border border-border bg-card-dark space-y-4 glass-card">
                  {/* Ledger header + Search */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-border/40">
                    <span className="text-xs font-extrabold text-foreground">Registered Accounts Ledger</span>
                    <div className="flex items-center relative w-full sm:w-64">
                      <input
                        type="text"
                        placeholder="Search student by name/email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-bg-dark border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs text-foreground focus:outline-none focus:border-brand-500"
                      />
                      <Search className="absolute left-3 w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-gray-500 border-b border-border/40 pb-2">
                          <th className="font-semibold pb-2">Name</th>
                          <th className="font-semibold pb-2">Email</th>
                          <th className="font-semibold pb-2">Role</th>
                          <th className="font-semibold pb-2 text-center">XP</th>
                          <th className="font-semibold pb-2 text-center">Streak</th>
                          <th className="font-semibold pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-10 text-gray-500">No matching student accounts found.</td>
                          </tr>
                        ) : (
                          filteredStudents.map((std: any) => (
                            <tr key={std.id} className="hover:bg-bg-dark/40 transition-colors">
                              <td className="py-3 font-bold text-foreground">{std.name}</td>
                              <td className="py-3 text-gray-400">{std.email}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase border ${
                                  std.role === "student"
                                    ? "bg-brand-500/10 border-brand-500/20 text-brand-400"
                                    : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                                }`}>
                                  {std.role}
                                </span>
                              </td>
                              <td className="py-3 text-center font-bold text-brand-500">{std.xp}</td>
                              <td className="py-3 text-center text-orange-500 font-bold">{std.streak}</td>
                              <td className="py-3 text-right space-x-1.5">
                                <button
                                  onClick={() => setProgressModalUser(std)}
                                  className="px-2 py-1 rounded bg-brand-600/10 hover:bg-brand-600 text-brand-500 hover:text-white border border-brand-500/20 text-[10px] font-bold cursor-pointer"
                                  title="View detailed student metrics"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setRoleModalUser(std);
                                    setFormRole(std.role);
                                  }}
                                  className="px-2 py-1 rounded bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 text-[10px] font-bold cursor-pointer"
                                  title="Update role"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setPassModalUser(std)}
                                  className="px-2 py-1 rounded bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/20 text-[10px] font-bold cursor-pointer"
                                  title="Reset password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUserClick(std.id)}
                                  className="px-2 py-1 rounded bg-danger-500/10 hover:bg-danger-500 text-danger-500 hover:text-white border border-danger-500/20 text-[10px] font-bold cursor-pointer"
                                  title="Deactivate account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* MODAL 1: STUDENT DETAILED PROGRESS OVERVIEW */}
            {progressModalUser && (
              <StudentProgressModal
                user={progressModalUser}
                onClose={() => setProgressModalUser(null)}
              />
            )}

            {/* MODAL 2: UPDATE USER ROLE */}
            {roleModalUser && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleUpdateRoleSubmit} className="w-full max-w-sm bg-card-dark border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-left glass-card">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Update User Permission Role</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Assign permissions for {roleModalUser.name} ({roleModalUser.email}).</p>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">System Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                    >
                      <option value="student">Student (Standard preparation workspace)</option>
                      <option value="admin">Administrator (Full operational hub access)</option>
                      <option value="super_admin">Super Admin (System root permissions)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setRoleModalUser(null)}
                      className="px-3.5 py-1.5 border border-border hover:bg-white/5 text-gray-400 hover:text-foreground rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateRoleMutation.isPending}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                      Update Role
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODAL 3: ADMIN PASSWORD RESET */}
            {passModalUser && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleResetPassSubmit} className="w-full max-w-sm bg-card-dark border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-left glass-card">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Reset User Password</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Set a new security password for {passModalUser.name} ({passModalUser.email}).</p>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Password</label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPassModalUser(null)}
                      className="px-3.5 py-1.5 border border-border hover:bg-white/5 text-gray-400 hover:text-foreground rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formPassword.trim() || formPassword.length < 6 || resetPassMutation.isPending}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                      Reset Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* MODAL 4: CURRICULUM CMS MODAL */}
            {activeCmsModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <form onSubmit={handleCmsSubmit} className="w-full max-w-md bg-card-dark border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-left glass-card">
                  <div>
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      {activeCmsModal.action === "create" ? "Create" : "Update"} {activeCmsModal.type}
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Fill in curriculum details below.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                        placeholder={`${activeCmsModal.type} title`}
                      />
                    </div>

                    {(activeCmsModal.type === "semester" || activeCmsModal.type === "subject" || activeCmsModal.type === "chapter" || activeCmsModal.type === "lesson") && (
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                        <textarea
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                          rows={2}
                          className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                          placeholder={`${activeCmsModal.type} details/notes`}
                        />
                      </div>
                    )}

                    {activeCmsModal.type === "subject" && (
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subject Code</label>
                        <input
                          type="text"
                          required
                          value={formCode}
                          onChange={(e) => setFormCode(e.target.value)}
                          className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                          placeholder="e.g. A3-R5"
                        />
                      </div>
                    )}

                    {/* Lesson specific fields */}
                    {activeCmsModal.type === "lesson" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Video Provider</label>
                          <select
                            value={formVideoProvider}
                            onChange={(e) => setFormVideoProvider(e.target.value)}
                            className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                          >
                            <option value="youtube">YouTube</option>
                            <option value="cloudflare">Cloudflare Stream</option>
                            <option value="vimeo">Vimeo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Video ID</label>
                          <input
                            type="text"
                            value={formVideoId}
                            onChange={(e) => setFormVideoId(e.target.value)}
                            className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                            placeholder="e.g. video_url_id"
                          />
                        </div>
                      </div>
                    )}

                    {activeCmsModal.type === "lesson" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prerequisites</label>
                          <input
                            type="text"
                            value={formPrerequisites}
                            onChange={(e) => setFormPrerequisites(e.target.value)}
                            className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                            placeholder="Optional prerequisites"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Outcomes</label>
                          <input
                            type="text"
                            value={formOutcomes}
                            onChange={(e) => setFormOutcomes(e.target.value)}
                            className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                            placeholder="Optional study outcomes"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Display Order Index</label>
                      <input
                        type="number"
                        value={formOrder}
                        onChange={(e) => setFormOrder(Number(e.target.value))}
                        className="w-full bg-bg-dark border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand-500"
                        placeholder="Sorting index"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetFormStates}
                      className="px-3.5 py-1.5 border border-border hover:bg-white/5 text-gray-400 hover:text-foreground rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Separate component for Student Progress Modal to prevent re-renders
function StudentProgressModal({ user, onClose }: { user: any; onClose: () => void }) {
  const { data: progress, isLoading } = useAdminStudentProgress(user.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card-dark border border-border rounded-2xl p-6 shadow-2xl space-y-4 text-left glass-card">
        <div className="flex justify-between items-start pb-2 border-b border-border/40">
          <div>
            <h3 className="text-xs font-extrabold text-foreground">Student Workspace Metrics</h3>
            <p className="text-[10px] text-gray-500">Review learning index calibration for {user.name}.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-border rounded-lg text-gray-400 hover:text-foreground hover:bg-white/5"
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-500" /></div>
        ) : !progress ? (
          <p className="text-xs text-gray-500 text-center py-6">Could not fetch user stats.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-dark border border-border/60 rounded-xl">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Account Email</span>
                <span className="text-[11px] font-bold text-foreground mt-0.5 block truncate">{progress.email}</span>
              </div>
              <div className="p-3 bg-bg-dark border border-border/60 rounded-xl">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Study Streak</span>
                <span className="text-[11px] font-bold text-orange-500 mt-0.5 block">{progress.streak} Days</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-bg-dark border border-border/60 rounded-xl">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Curriculum Progress</span>
                <span className="text-[11px] font-bold text-brand-500 mt-0.5 block">{progress.completion_percentage}%</span>
              </div>
              <div className="p-3 bg-bg-dark border border-border/60 rounded-xl">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Quiz Accuracy</span>
                <span className="text-[11px] font-bold text-emerald-500 mt-0.5 block">{progress.quiz_accuracy}%</span>
              </div>
            </div>

            {progress.onboarding_profile ? (
              <div className="p-3 bg-bg-dark border border-border/60 rounded-xl space-y-2">
                <span className="text-[9px] text-gray-500 font-bold block uppercase">Onboarding Profile</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-300">
                  <div>Gender: <span className="text-foreground capitalize">{progress.onboarding_profile.gender || "Not set"}</span></div>
                  <div>Mobile: <span className="text-foreground">{progress.onboarding_profile.mobile_number || "Not set"}</span></div>
                  <div>Target: <span className="text-foreground capitalize">{progress.onboarding_profile.course || "Not set"}</span></div>
                  <div>Time goal: <span className="text-foreground">{progress.onboarding_profile.daily_time || "Not set"}</span></div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 italic">User has not completed the onboarding flow.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
