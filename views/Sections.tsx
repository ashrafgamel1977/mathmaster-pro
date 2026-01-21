
import React, { useState } from 'react';
import { CustomSection } from '../types';
import MathRenderer from '../components/MathRenderer';

interface SectionsProps {
  sections: CustomSection[];
  onUpdateSections: (sections: CustomSection[]) => void;
}

const Sections: React.FC<SectionsProps> = ({ sections, onUpdateSections }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const [deletingSectionId, setDeletingSectionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<CustomSection, 'id'>>({
    title: '',
    icon: '📄',
    content: '',
    isVisibleToStudents: true
  });

  const handleSave = () => {
    if (!formData.title || !formData.content) return alert('يرجى ملء جميع الحقول المطلوبة');

    if (editingSection) {
      const updatedSections = sections.map(sec => 
        sec.id === editingSection.id 
          ? { ...formData, id: sec.id } 
          : sec
      );
      onUpdateSections(updatedSections);
    } else {
      const newSection: CustomSection = {
        ...formData,
        id: 'sec_' + Date.now()
      };
      onUpdateSections([...sections, newSection]);
    }
    
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingSection(null);
    setFormData({ title: '', icon: '📄', content: '', isVisibleToStudents: true });
  };

  const startEdit = (sec: CustomSection) => {
    setEditingSection(sec);
    setFormData({
      title: sec.title,
      icon: sec.icon,
      content: sec.content,
      isVisibleToStudents: sec.isVisibleToStudents
    });
    setShowAddModal(true);
  };

  const requestDelete = (id: string) => {
    setDeletingSectionId(id);
  };

  const confirmDelete = () => {
    if (deletingSectionId) {
      onUpdateSections(sections.filter(s => s.id !== deletingSectionId));
      setDeletingSectionId(null);
    }
  };

  const toggleVisibility = (id: string) => {
    onUpdateSections(sections.map(s => 
      s.id === id ? { ...s, isVisibleToStudents: !s.isVisibleToStudents } : s
    ));
  };

  const sectionToDelete = sections.find(s => s.id === deletingSectionId);

  return (
    <div className="space-y-10 animate-slideUp text-right pb-24" dir="rtl">
      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">الأقسام المخصصة 🧩</h2>
          <p className="text-sm text-slate-400 font-bold mt-1">إضافة صفحات مخصصة ومحتوى إثرائي للطلاب.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          <span>إضافة قسم جديد</span>
          <span className="text-xl">＋</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map(section => (
          <div key={section.id} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-indigo-600">
                {section.icon}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => startEdit(section)} 
                  className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-all"
                >✎</button>
                <button 
                  onClick={() => requestDelete(section.id)} 
                  className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-all"
                >🗑️</button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-2">{section.title}</h3>
            <div className="text-xs text-slate-500 font-medium line-clamp-3 mb-6 min-h-[3em]">
              <MathRenderer content={section.content} inline />
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
              <button 
                onClick={() => toggleVisibility(section.id)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black transition-all flex items-center gap-2 ${section.isVisibleToStudents ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
              >
                <span className={`w-2 h-2 rounded-full ${section.isVisibleToStudents ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                {section.isVisibleToStudents ? 'ظاهر للطلاب' : 'مخفي'}
              </button>
              <span className="text-[9px] font-bold text-slate-300">ID: {section.id.slice(-4)}</span>
            </div>
          </div>
        ))}
        
        {sections.length === 0 && (
          <div className="col-span-full py-24 text-center opacity-30 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
            <span className="text-6xl block mb-6">🧩</span>
            <p className="font-black text-2xl">لا توجد أقسام مخصصة حالياً</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl p-10 rounded-[3.5rem] shadow-2xl relative animate-slideUp overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
              <h3 className="text-2xl font-black text-slate-800">
                {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </h3>
              <button onClick={closeModal} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">الأيقونة</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 rounded-2xl text-center text-2xl outline-none focus:ring-2 focus:ring-indigo-600" 
                    value={formData.icon} 
                    onChange={e => setFormData({...formData, icon: e.target.value})} 
                    placeholder="📄"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">عنوان القسم</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="مثال: مراجعات ليلة الامتحان"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 px-2 uppercase">المحتوى (يدعم Markdown و LaTeX)</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 rounded-[2rem] font-medium text-sm h-64 outline-none focus:ring-2 focus:ring-indigo-600 resize-none leading-relaxed"
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  placeholder="اكتب المحتوى هنا... يمكنك استخدام $ للمعادلات الرياضية."
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl cursor-pointer" onClick={() => setFormData({...formData, isVisibleToStudents: !formData.isVisibleToStudents})}>
                <div className={`w-12 h-7 rounded-full relative transition-all ${formData.isVisibleToStudents ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.isVisibleToStudents ? 'left-1' : 'left-6'}`}></div>
                </div>
                <span className="font-bold text-sm text-slate-600">تفعيل ظهور القسم للطلاب</span>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl hover:scale-[1.01] transition-transform"
              >
                حفظ ونشر ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingSectionId && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl relative animate-slideUp text-center space-y-6">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-4 shadow-sm">
                 🗑️
              </div>
              <div>
                 <h3 className="text-2xl font-black text-slate-800">حذف القسم؟</h3>
                 <p className="text-slate-500 font-bold text-sm mt-2">
                    هل أنت متأكد من رغبتك في حذف القسم <span className="text-slate-800">"{sectionToDelete?.title}"</span>؟ <br/>
                    <span className="text-rose-500 text-xs">لا يمكن استرجاع البيانات بعد الحذف.</span>
                 </p>
              </div>
              <div className="flex gap-4 pt-2">
                 <button onClick={confirmDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">نعم، احذف</button>
                 <button onClick={() => setDeletingSectionId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">إلغاء</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Sections;
