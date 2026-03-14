/**
 * certificateService.ts
 * توليد شهادة تقدير HTML جاهزة للطباعة كـ PDF
 */

interface CertificateData {
    studentName: string;
    teacherName: string;
    platformName: string;
    score?: number;
    quizTitle?: string;
    reason?: string;
    date?: string;
}

export function generateCertificateHTML(data: CertificateData): string {
    const {
        studentName,
        teacherName,
        platformName,
        score,
        quizTitle,
        reason = 'التفوق والتميز الدراسي',
        date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }),
    } = data;

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>شهادة تقدير — ${studentName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Cairo', sans-serif;
    background: #fff;
    width: 297mm; height: 210mm;
    display: flex; align-items: center; justify-content: center;
    print-color-adjust: exact; -webkit-print-color-adjust: exact;
  }
  .cert {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f172a 100%);
    position: relative; overflow: hidden;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 40px;
  }
  /* Decorative circles */
  .circle-1 { position:absolute; top:-80px; right:-80px; width:300px; height:300px; border-radius:50%; background:rgba(249,115,22,0.08); }
  .circle-2 { position:absolute; bottom:-60px; left:-60px; width:250px; height:250px; border-radius:50%; background:rgba(99,102,241,0.08); }
  /* Golden border */
  .border-frame {
    position:absolute; inset:20px;
    border: 3px solid;
    border-image: linear-gradient(135deg, #f59e0b, #f97316, #fbbf24, #f97316, #f59e0b) 1;
    pointer-events:none;
  }
  .inner-frame {
    position:absolute; inset:28px;
    border: 1px solid rgba(245,158,11,0.2);
    pointer-events:none;
  }
  /* Content */
  .logo { font-size: 48px; margin-bottom: 8px; }
  .platform-name { color:#f59e0b; font-size:14px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:24px; }
  .title { font-size: 38px; font-weight:900; color:white; margin-bottom: 6px; }
  .subtitle { font-size:13px; color:#94a3b8; font-weight:700; margin-bottom:32px; letter-spacing:2px; }
  .student-name { font-size: 46px; font-weight:900; color:#f59e0b; margin-bottom:16px; text-shadow: 0 0 30px rgba(245,158,11,0.3); }
  .reason { font-size:16px; color:#e2e8f0; font-weight:700; margin-bottom: 8px; max-width:500px; text-align:center; line-height:1.8; }
  .score-badge {
    background: linear-gradient(135deg, #f59e0b, #f97316);
    color:white; padding:8px 28px; border-radius:100px;
    font-size:18px; font-weight:900; margin: 16px 0 28px;
    box-shadow: 0 8px 20px rgba(249,115,22,0.3);
  }
  .footer { display:flex; justify-content:space-between; width:100%; max-width:600px; margin-top:24px; }
  .footer-item { text-align:center; }
  .footer-line { width:180px; height:1px; background:rgba(245,158,11,0.4); margin-bottom:8px; }
  .footer-label { color:#64748b; font-size:11px; font-weight:700; }
  .footer-value { color:#e2e8f0; font-size:13px; font-weight:900; margin-top:2px; }
  .stars { font-size:22px; letter-spacing:4px; margin-bottom:12px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="cert">
  <div class="circle-1"></div>
  <div class="circle-2"></div>
  <div class="border-frame"></div>
  <div class="inner-frame"></div>

  <div class="logo">Σ</div>
  <div class="platform-name">${platformName}</div>
  <div class="title">شهادة تقدير</div>
  <div class="subtitle">CERTIFICATE OF ACHIEVEMENT</div>

  <div class="stars">⭐ ⭐ ⭐</div>

  <p style="color:#94a3b8;font-size:13px;font-weight:700;margin-bottom:8px;">تُمنح هذه الشهادة للطالب المتميز</p>
  <div class="student-name">${studentName}</div>

  <div class="reason">
    ${quizTitle ? `لحصوله على نتيجة متميزة في اختبار "<strong style="color:#f59e0b">${quizTitle}</strong>"` : `تقديراً لـ${reason}`}
  </div>

  ${score !== undefined ? `<div class="score-badge">🏆 النتيجة: ${score}%</div>` : ''}

  <div class="footer">
    <div class="footer-item">
      <div class="footer-line"></div>
      <div class="footer-label">التاريخ</div>
      <div class="footer-value">${date}</div>
    </div>
    <div class="footer-item" style="text-align:center">
      <div style="font-size:32px">🥇</div>
    </div>
    <div class="footer-item">
      <div class="footer-line"></div>
      <div class="footer-label">المعلم المسؤول</div>
      <div class="footer-value">أ. ${teacherName}</div>
    </div>
  </div>
</div>
<script>
  window.onload = () => setTimeout(() => window.print(), 500);
</script>
</body>
</html>`;
}

export function openCertificate(data: CertificateData): void {
    const html = generateCertificateHTML(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ──────────────────────────────────────────────────────────────
// WhatsApp Parent Report
// ──────────────────────────────────────────────────────────────
interface ParentReportData {
    studentName: string;
    parentPhone: string;
    teacherName: string;
    score?: number;
    quizTitle?: string;
    attendance?: number;
    totalSessions?: number;
    streak?: number;
    badgesCount?: number;
}

export function sendParentWhatsAppReport(data: ParentReportData): void {
    const {
        studentName, parentPhone, teacherName,
        score, quizTitle, attendance, totalSessions, streak = 0, badgesCount = 0,
    } = data;

    const lines: string[] = [
        `السلام عليكم ورحمة الله 🌹`,
        ``,
        `📊 *تقرير أداء الطالب*`,
        `👤 الاسم: *${studentName}*`,
        ``,
    ];

    if (quizTitle && score !== undefined) {
        lines.push(`📝 اختبار: ${quizTitle}`);
        lines.push(`🎯 النتيجة: *${score}%* — ${score >= 70 ? '✅ ناجح' : '❌ راسب'}`);
        lines.push(``);
    }

    if (attendance !== undefined && totalSessions !== undefined) {
        const pct = totalSessions > 0 ? Math.round((attendance / totalSessions) * 100) : 0;
        lines.push(`📅 الحضور: ${attendance}/${totalSessions} (${pct}%)`);
    }

    lines.push(`🔥 تتابع الدراسة: ${streak} يوم متتالي`);
    lines.push(`🏅 الأوسمة المحققة: ${badgesCount}`);
    lines.push(``);
    lines.push(`👨‍🏫 أ. ${teacherName}`);
    lines.push(`📱 MathMaster Pro — منصة التفوق`);

    const message = encodeURIComponent(lines.join('\n'));
    const phone = parentPhone.replace(/[^0-9]/g, '');
    const whatsappPhone = phone.startsWith('0') ? `2${phone}` : phone;
    window.open(`https://wa.me/${whatsappPhone}?text=${message}`, '_blank');
}
