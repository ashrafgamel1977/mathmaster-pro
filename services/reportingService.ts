
import { QuizResult, Student, PlatformSettings } from '../types';

/**
 * reportingService.ts
 * مسئول عن توليد تقارير PDF احترافية للطلاب والمجموعات
 * يتطلب تثبيت مكتبة jspdf و jspdf-autotable
 */

export const generateQuizReportPDF = async (
  results: QuizResult[], 
  students: Student[], 
  settings: PlatformSettings,
  title: string
) => {
  try {
    // @ts-ignore
    const { jsPDF } = await import('jspdf');
    // @ts-ignore
    await import('jspdf-autotable');

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // إضافة الخطوط العربية (Cairo) إذا كانت متوفرة أو الاعتماد على الخطوط الافتراضية
    // ملاحظة: لدعم العربية بشكل كامل في jsPDF نحتاج لملف الخط .ttf وتحويله لـ base64
    // سنقوم هنا بتنظيم البيانات بشكل يبدو احترافياً

    const primaryColor = settings.branding.primaryColor || '#4f46e5';

    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(settings.platformName, 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`تقرير نتائج: ${title}`, 105, 25, { align: 'center' });
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-EG')}`, 105, 32, { align: 'center' });

    // Table
    const tableData = results.map(r => {
      const student = students.find(s => s.id === r.studentId);
      return [
        student?.name || '---',
        r.score + '%',
        r.status === 'graded' ? 'تم التصحيح' : 'انتظار',
        r.date
      ];
    });

    // @ts-ignore
    doc.autoTable({
      startY: 50,
      head: [['اسم الطالب', 'الدرجة', 'الحالة', 'التاريخ']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'right' },
      bodyStyles: { halign: 'right' },
      styles: { font: 'Arial', fontSize: 10 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(150);
        doc.setFontSize(8);
        doc.text(`تصميم بواسطة ${settings.platformName} - صفحة ${i} من ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`تقرير_${title}_${Date.now()}.pdf`);
    return true;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    alert('حدث خطأ أثناء توليد الملف. تأكد من تثبيت مكتبة jspdf (npm install jspdf jspdf-autotable)');
    return false;
  }
};
