import React, { useState } from 'react';
import { Course, Year, VideoLesson, EducationalSource, CourseModule } from '../types';
import { Plus, Edit2, Trash2, Folder, Video, FileText, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

interface CoursesViewProps {
  courses: Course[];
  years: Year[];
  videoLessons: VideoLesson[];
  educationalSources: EducationalSource[];
  onAddCourse: (course: Course) => void;
  onUpdateCourse: (course: Course) => void;
  onDeleteCourse: (id: string) => void;
}

const CoursesView: React.FC<CoursesViewProps> = ({ courses, years, videoLessons, educationalSources, onAddCourse, onUpdateCourse, onDeleteCourse }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    yearId: string;
    thumbnailUrl: string;
    modules: CourseModule[];
  }>({
    title: '',
    description: '',
    yearId: '',
    thumbnailUrl: '',
    modules: []
  });

  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const resetForm = () => {
    setFormData({ title: '', description: '', yearId: '', thumbnailUrl: '', modules: [] });
    setShowAdd(false);
    setIsEditing(false);
    setEditingCourseId(null);
    setShowAddModule(false);
    setNewModuleTitle('');
  };

  const handleEditClick = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation();
    setFormData({
      title: course.title,
      description: course.description,
      yearId: course.yearId,
      thumbnailUrl: course.thumbnailUrl || '',
      modules: [...course.modules]
    });
    setEditingCourseId(course.id);
    setIsEditing(true);
    setShowAdd(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.yearId) return;

    if (isEditing && editingCourseId) {
      onUpdateCourse({
        id: editingCourseId,
        title: formData.title,
        description: formData.description,
        yearId: formData.yearId,
        thumbnailUrl: formData.thumbnailUrl,
        modules: formData.modules,
        createdAt: courses.find(c => c.id === editingCourseId)?.createdAt || new Date().toISOString()
      });
    } else {
      onAddCourse({
        id: 'crs' + Date.now(),
        title: formData.title,
        description: formData.description,
        yearId: formData.yearId,
        thumbnailUrl: formData.thumbnailUrl,
        modules: formData.modules,
        createdAt: new Date().toISOString()
      });
    }
    resetForm();
  };

  const handleAddModule = () => {
    if (!newModuleTitle) return;
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, { id: 'mod' + Date.now(), title: newModuleTitle, items: [] }]
    }));
    setNewModuleTitle('');
    setShowAddModule(false);
  };

  const handleRemoveModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId)
    }));
  };

  const handleAddItemToModule = (moduleId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map(m => {
        if (m.id === moduleId) {
          if (!m.items.includes(itemId)) {
            return { ...m, items: [...m.items, itemId] };
          }
        }
        return m;
      })
    }));
  };

  const handleRemoveItemFromModule = (moduleId: string, itemId: string) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.map(m => {
        if (m.id === moduleId) {
          return { ...m, items: m.items.filter(id => id !== itemId) };
        }
        return m;
      })
    }));
  };

  const getItemDetails = (itemId: string) => {
    const video = videoLessons.find(v => v.id === itemId);
    if (video) return { title: video.title, type: 'video', icon: <Video size={16} /> };
    
    const doc = educationalSources.find(s => s.id === itemId);
    if (doc) return { title: doc.title, type: 'doc', icon: <FileText size={16} /> };
    
    return { title: 'عنصر غير معروف', type: 'unknown', icon: <FileText size={16} /> };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-['Cairo']" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">إدارة الكورسات</h1>
          <p className="text-slate-500 font-bold">قم بتنظيم الدروس والملفات في كورسات متكاملة</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowAdd(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} /> كورس جديد
        </button>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 mb-8 animate-fadeIn">
          <h2 className="text-2xl font-black text-slate-800 mb-6">{isEditing ? 'تعديل الكورس' : 'إضافة كورس جديد'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الكورس</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="مثال: كورس المراجعة النهائية"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">الصف الدراسي</label>
              <select 
                value={formData.yearId} 
                onChange={(e) => setFormData({...formData, yearId: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">اختر الصف</option>
                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">الوصف</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                placeholder="وصف مختصر لمحتوى الكورس..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">رابط صورة الغلاف (اختياري)</label>
              <input 
                type="text" 
                value={formData.thumbnailUrl} 
                onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                dir="ltr"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">الوحدات والمحتوى</h3>
              <button 
                onClick={() => setShowAddModule(true)}
                className="text-indigo-600 font-bold text-sm flex items-center gap-1 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={16} /> إضافة وحدة
              </button>
            </div>

            {showAddModule && (
              <div className="flex gap-2 mb-6 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <input 
                  type="text" 
                  value={newModuleTitle} 
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                  placeholder="اسم الوحدة (مثال: الوحدة الأولى: الجبر)"
                  autoFocus
                />
                <button onClick={handleAddModule} className="bg-indigo-600 text-white px-4 rounded-lg font-bold text-sm">إضافة</button>
                <button onClick={() => setShowAddModule(false)} className="bg-slate-200 text-slate-600 px-4 rounded-lg font-bold text-sm">إلغاء</button>
              </div>
            )}

            <div className="space-y-4">
              {formData.modules.map((module, mIdx) => (
                <div key={module.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-4 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <GripVertical size={16} className="text-slate-400 cursor-move" />
                      <h4 className="font-black text-slate-800">{module.title}</h4>
                    </div>
                    <button onClick={() => handleRemoveModule(module.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {module.items.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {module.items.map((itemId, iIdx) => {
                          const details = getItemDetails(itemId);
                          return (
                            <div key={`${itemId}-${iIdx}`} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                              <div className="flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${details.type === 'video' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {details.icon}
                                </span>
                                <span className="font-bold text-sm text-slate-700">{details.title}</span>
                              </div>
                              <button onClick={() => handleRemoveItemFromModule(module.id, itemId)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 font-bold text-center py-4">لا يوجد محتوى في هذه الوحدة</p>
                    )}

                    <div className="flex gap-2 mt-2">
                      <select 
                        className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddItemToModule(module.id, e.target.value);
                            e.target.value = ''; // Reset
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>+ إضافة درس أو ملف</option>
                        <optgroup label="الفيديوهات">
                          {videoLessons.filter(v => v.yearId === formData.yearId || !formData.yearId).map(v => (
                            <option key={v.id} value={v.id}>🎥 {v.title}</option>
                          ))}
                        </optgroup>
                        <optgroup label="الملفات">
                          {educationalSources.filter(s => s.yearId === formData.yearId || !formData.yearId).map(s => (
                            <option key={s.id} value={s.id}>📄 {s.title}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              {formData.modules.length === 0 && !showAddModule && (
                <div className="text-center py-8 text-slate-400 font-bold text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  لم يتم إضافة أي وحدات بعد
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">إلغاء</button>
            <button onClick={handleSave} className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
              {isEditing ? 'حفظ التعديلات' : 'إنشاء الكورس'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const year = years.find(y => y.id === course.yearId);
          const totalItems = course.modules.reduce((acc, mod) => acc + mod.items.length, 0);
          
          return (
            <div key={course.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <Folder size={48} className="opacity-50" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-black text-indigo-600 shadow-sm">
                  {year?.name || 'عام'}
                </div>
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={(e) => handleEditClick(e, course)} className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center shadow-lg hover:bg-indigo-50">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); if(window.confirm('حذف الكورس؟')) onDeleteCourse(course.id); }} className="w-8 h-8 bg-white text-rose-600 rounded-lg flex items-center justify-center shadow-lg hover:bg-rose-50">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-black text-slate-800 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-500 font-bold mb-4 line-clamp-2">{course.description}</p>
                
                <div className="flex items-center justify-between text-sm font-bold text-slate-400 mb-4">
                  <span className="flex items-center gap-1"><Folder size={16} /> {course.modules.length} وحدات</span>
                  <span className="flex items-center gap-1"><Video size={16} /> {totalItems} دروس</span>
                </div>

                <button 
                  onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                  className="w-full py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
                >
                  {expandedCourseId === course.id ? (
                    <><ChevronUp size={16} /> إخفاء المحتوى</>
                  ) : (
                    <><ChevronDown size={16} /> عرض المحتوى</>
                  )}
                </button>

                {expandedCourseId === course.id && (
                  <div className="mt-4 space-y-3 pt-4 border-t border-slate-100">
                    {course.modules.map(mod => (
                      <div key={mod.id} className="bg-slate-50 rounded-xl p-3">
                        <h4 className="font-black text-slate-700 text-sm mb-2">{mod.title}</h4>
                        <ul className="space-y-1">
                          {mod.items.map((itemId, idx) => {
                            const details = getItemDetails(itemId);
                            return (
                              <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <span className={details.type === 'video' ? 'text-rose-500' : 'text-blue-500'}>{details.icon}</span>
                                <span className="truncate">{details.title}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {courses.length === 0 && !showAdd && (
          <div className="col-span-full text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Folder size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-600 mb-2">لا توجد كورسات</h3>
            <p className="text-slate-400 font-bold mb-6">قم بإنشاء كورس جديد لتنظيم المحتوى للطلاب</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold inline-flex items-center gap-2 hover:bg-indigo-700 transition-all"
            >
              <Plus size={20} /> إضافة كورس
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesView;
