import React, { useState, useEffect, useRef } from 'react';
import { HealthData } from '../types/health';
import { sampleHealthData, holisticQuestions } from '../data/sampleData';
import { exportToWord, exportToPDF, exportToJsonFile } from '../utils/exportUtils';
import Chart from 'chart.js/auto';
import { GoogleSheetsExportModal } from './GoogleSheetsExportModal';
import { ScoreCriteriaCard } from './ScoreCriteriaCard';

interface HealthAccountViewProps {
  onShowToast: (msg: string, icon?: string) => void;
  onOpenImageModal: (url: string) => void;
  onNavigateHome?: () => void;
  isModalPreview?: boolean;
}

const STORAGE_KEY = 'health_account_data_v2';

export const HealthAccountView: React.FC<HealthAccountViewProps> = ({
  onShowToast,
  onOpenImageModal,
  onNavigateHome,
  isModalPreview = false
}) => {
  const [data, setData] = useState<HealthData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return sampleHealthData;
  });

  const [currentTab, setCurrentTab] = useState<
    'profile' | 'vitals' | 'med9' | 'indicators' | 'holistic' | 'journal' | 'analytics' | 'preview'
  >('profile');
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage quota warning', e);
    }
  }, [data]);

  // Vitals definitions
  const vitalItems = {
    weight: { title: 'น้ำหนักตัว', unit: 'กิโลกรัม (kg)' },
    bp: { title: 'ความดันโลหิต', unit: 'มม.ปรอท (mmHg)' },
    fbs: { title: 'ระดับน้ำตาลในเลือด', unit: 'มก./ดล. (mg/dL)' },
    waist: { title: 'รอบเอว', unit: 'นิ้ว (inches)' },
    sleep: { title: 'การนอนหลับเฉลี่ย', unit: 'ชั่วโมง/คืน (hrs)' }
  };

  // Medicine 9 pills definition
  const med9Items = [
    { key: 'p1' as const, id: 1, title: 'การดื่มน้ำสมุนไพรปรับสมดุล' },
    { key: 'p2' as const, id: 2, title: 'การกัวซา' },
    { key: 'p3' as const, id: 3, title: 'การดีท็อกซ์' },
    { key: 'p4' as const, id: 4, title: 'การแช่มือ/แช่เท้าด้วยสมุนไพร' },
    { key: 'p5' as const, id: 5, title: 'การพอก ทา หยอด ประคบ อบ อาบ เช็ด ถู สูดดม' },
    { key: 'p6' as const, id: 6, title: 'การโยคะกายบริหาร' },
    { key: 'p7' as const, id: 7, title: 'การรับประทานอาหารปรับสมดุล' },
    { key: 'p8' as const, id: 8, title: 'การใช้ธรรมะ ละบาป บำเพ็ญบุญ' },
    { key: 'p9' as const, id: 9, title: 'การรู้เพียร รู้พัก' }
  ];

  const indicatorLabels = {
    comfort: 'ความสบาย (จิตใจและร่างกายปลอดโปร่ง ไม่ตึงเครียด)',
    lightness: 'ความเบากาย (อาการเจ็บป่วยทุเลา เบาสบาย คล่องตัว)',
    vitality: 'ความมีกำลัง (มีเรี่ยวแรงทำกิจวัตร ทำความดีได้ต่อเนื่อง)'
  };

  // Helper styles
  const getScoreBadgeStyle = (score: number) => {
    if (score <= 3) return 'bg-red-50 border-red-200 text-red-700';
    if (score <= 6) return 'bg-amber-50 border-amber-200 text-amber-800';
    if (score <= 8) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    return 'bg-teal-100 border-teal-300 text-teal-900 font-bold';
  };

  const getScoreLabel = (score: number) => {
    const labels = [
      'แย่ที่สุด',
      'รู้สึกไม่ดี',
      'ค่อนข้างไม่ดี',
      'ปานกลาง',
      'รู้สึกเฉยๆ',
      'ค่อนข้างดี',
      'รู้สึกดี',
      'ดีมาก',
      'ประทับใจ',
      'ดีมากที่สุด'
    ];
    return labels[score - 1] || '';
  };

  // Image Upload for med9
  const handleMed9ImageUpload = (key: keyof HealthData['med9Data'], file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 600;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setData((prev) => ({
          ...prev,
          med9Data: {
            ...prev.med9Data,
            [key]: { ...prev.med9Data[key], image: dataUrl }
          }
        }));
        onShowToast('แนบรูปภาพกิจกรรมสำเร็จ!');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Actions
  const handleFillSample = () => {
    if (window.confirm('ข้อมูลตัวอย่างจะแทนที่ข้อมูลที่กรอกไว้ทั้งหมด ต้องการดำเนินการต่อหรือไม่?')) {
      setData(sampleHealthData);
      onShowToast('ใส่ข้อมูลตัวอย่างเรียบร้อยแล้ว!');
    }
  };

  const handleExportWord = () => {
    exportToWord('document-to-export-health', `แบบบันทึกบัญชีสุขภาพ_${data.profile.fullName || 'ผู้บันทึก'}`, 'แบบบันทึกบัญชีสุขภาพ');
    onShowToast('ส่งออกเอกสาร Word (.doc) สำเร็จ!');
  };

  const handleExportPDF = () => {
    onShowToast('กำลังประมวลผล PDF โปรดรอสักครู่...', 'fa-solid fa-spinner fa-spin');
    setCurrentTab('preview');
    setTimeout(() => {
      exportToPDF('document-to-export-health', `แบบบันทึกบัญชีสุขภาพ_${data.profile.fullName || 'ผู้บันทึก'}`, () => {
        onShowToast('ส่งออกไฟล์ PDF สำเร็จ!');
      });
    }, 400);
  };

  const handleExportJSON = () => {
    exportToJsonFile(data, `บัญชีสุขภาพ_${data.profile.fullName || 'ผู้บันทึก'}`);
    onShowToast('สำรองข้อมูล JSON สำเร็จ');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.profile) {
          setData(parsed);
          onShowToast('นำเข้าข้อมูลสุขภาพเรียบร้อยแล้ว!');
        } else {
          onShowToast('รูปแบบไฟล์ JSON ไม่ถูกต้อง', 'fa-solid fa-triangle-exclamation');
        }
      } catch {
        onShowToast('รูปแบบไฟล์ JSON ไม่ถูกต้อง', 'fa-solid fa-triangle-exclamation');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Charts
  const indicatorsChartRef = useRef<HTMLCanvasElement | null>(null);
  const holisticChartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (currentTab !== 'analytics') return;

    let chart1: Chart | null = null;
    let chart2: Chart | null = null;

    if (indicatorsChartRef.current) {
      const months = ['ก่อน', 'เดือน 1', 'เดือน 2', 'เดือน 3', 'เดือน 4', 'เดือน 5', 'เดือน 6'];
      const getDataArr = (key: 'comfort' | 'lightness' | 'vitality') => [
        Number(data.indicatorsData[key]?.before) || 0,
        Number(data.indicatorsData[key]?.m1) || 0,
        Number(data.indicatorsData[key]?.m2) || 0,
        Number(data.indicatorsData[key]?.m3) || 0,
        Number(data.indicatorsData[key]?.m4) || 0,
        Number(data.indicatorsData[key]?.m5) || 0,
        Number(data.indicatorsData[key]?.m6) || 0
      ];

      chart1 = new Chart(indicatorsChartRef.current, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            { label: 'ความสบาย', data: getDataArr('comfort'), borderColor: '#059669', backgroundColor: '#05966922', tension: 0.3 },
            { label: 'ความเบากาย', data: getDataArr('lightness'), borderColor: '#0d9488', backgroundColor: '#0d948822', tension: 0.3 },
            { label: 'ความมีกำลัง', data: getDataArr('vitality'), borderColor: '#d97706', backgroundColor: '#d9770622', tension: 0.3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { min: 0, max: 10 } }
        }
      });
    }

    if (holisticChartRef.current) {
      const getAvg = (arr: any[], field: string) => {
        if (!Array.isArray(arr)) return 0;
        const valid = arr.map((i) => parseFloat(i?.[field]) || 0).filter((v) => v > 0);
        return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
      };

      const beforeScores = [
        getAvg(data.holisticData.mental, 'before'),
        getAvg(data.holisticData.spiritual, 'before'),
        getAvg(data.holisticData.social, 'before'),
        getAvg(data.holisticData.economic, 'before')
      ];

      const month6Scores = [
        getAvg(data.holisticData.mental, 'm6'),
        getAvg(data.holisticData.spiritual, 'm6'),
        getAvg(data.holisticData.social, 'm6'),
        getAvg(data.holisticData.economic, 'm6')
      ];

      chart2 = new Chart(holisticChartRef.current, {
        type: 'radar',
        data: {
          labels: ['จิตใจ', 'จิตวิญญาณ', 'สังคม', 'เศรษฐกิจ'],
          datasets: [
            { label: 'ก่อนเรียนรู้', data: beforeScores, borderColor: '#f59e0b', backgroundColor: '#f59e0b33' },
            { label: 'เดือนที่ 6', data: month6Scores, borderColor: '#10b981', backgroundColor: '#10b98133' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { r: { min: 0, max: 10 } }
        }
      });
    }

    return () => {
      chart1?.destroy();
      chart2?.destroy();
    };
  }, [currentTab, data.indicatorsData, data.holisticData]);

  const tabBtnClass = (tab: typeof currentTab) =>
    currentTab === tab
      ? 'bg-teal-700 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 shrink-0'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 shrink-0';

  return (
    <div className="bg-emerald-50/40 min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-900 text-white shadow-md no-print sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            {onNavigateHome && !isModalPreview && (
              <button
                onClick={onNavigateHome}
                className="bg-white/15 hover:bg-white/25 text-white p-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                title="กลับหน้าหลัก"
              >
                <i className="fa-solid fa-arrow-left" />
                <span className="hidden sm:inline">หน้าหลัก</span>
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-white text-teal-700 flex items-center justify-center text-xl font-bold shadow-md">
              <i className="fa-solid fa-heart-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold leading-tight">
                สมุดบันทึกบัญชีสุขภาพ (ยา 9 เม็ด & ทุกมิติ)
              </h1>
              <p className="text-xs text-teal-100 hidden sm:block">
                กสิกรรมไร้สารพิษและอาหาร เพื่อเศรษฐกิจและสุขภาวะพึ่งตน ตามวิถีเศรษฐกิจพอเพียง
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1.5">
            <button
              onClick={handleFillSample}
              className="bg-teal-800 hover:bg-teal-900 text-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm font-medium"
            >
              <i className="fa-solid fa-wand-magic-sparkles" /> <span>ใส่ข้อมูลตัวอย่าง</span>
            </button>
            <button
              onClick={() => setShowGoogleSheetModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm font-semibold"
              title="ส่งออกและเพิ่มข้อมูลไปยัง Google Sheet ปลายทาง"
            >
              <i className="fa-solid fa-file-excel" /> <span>ส่งออก Google Sheet</span>
            </button>
            <button
              onClick={handleExportWord}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm font-medium"
            >
              <i className="fa-solid fa-file-word" /> <span>บันทึก Word</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm font-medium"
            >
              <i className="fa-solid fa-file-pdf" /> <span>บันทึก PDF</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <i className="fa-solid fa-download" /> <span className="hidden md:inline">สำรอง JSON</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition"
            >
              <i className="fa-solid fa-upload" /> <span className="hidden md:inline">นำเข้า</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleImportJSON}
            />
          </div>
        </div>
      </header>

      {/* Tabs bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-[54px] z-30 no-print shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-2 whitespace-nowrap text-xs sm:text-sm font-medium py-2">
          <button onClick={() => setCurrentTab('profile')} className={tabBtnClass('profile')}>
            <i className="fa-solid fa-id-card" /> ข้อมูลทะเบียน
          </button>
          <button onClick={() => setCurrentTab('vitals')} className={tabBtnClass('vitals')}>
            <i className="fa-solid fa-heart-pulse text-rose-500" /> สัญญาณชีพ & กายภาพ
          </button>
          <button onClick={() => setCurrentTab('med9')} className={tabBtnClass('med9')}>
            <i className="fa-solid fa-pills text-teal-600" /> 1. การปฏิบัติยา 9 เม็ด
          </button>
          <button onClick={() => setCurrentTab('indicators')} className={tabBtnClass('indicators')}>
            <i className="fa-solid fa-stethoscope text-amber-600" /> 2. ตัวชี้วัด 3 ประการ
          </button>
          <button onClick={() => setCurrentTab('holistic')} className={tabBtnClass('holistic')}>
            <i className="fa-solid fa-brain text-purple-600" /> 3. สุขภาวะองค์รวม (4 ด้าน)
          </button>
          <button onClick={() => setCurrentTab('journal')} className={tabBtnClass('journal')}>
            <i className="fa-solid fa-book-bookmark text-indigo-600" /> 4. ไดอารี่บทเรียนรายเดือน
          </button>
          <button onClick={() => setCurrentTab('analytics')} className={tabBtnClass('analytics')}>
            <i className="fa-solid fa-chart-line text-emerald-600" /> สรุปผล & กราฟสถิติ
          </button>
          <button onClick={() => setCurrentTab('preview')} className={tabBtnClass('preview')}>
            <i className="fa-solid fa-print text-amber-600" /> ตัวอย่างเอกสารฉบับเต็ม
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex-grow w-full">
        {/* TAB 1: PROFILE */}
        {currentTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
              <div className="bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 rounded-2xl p-6 text-white mb-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <span className="bg-emerald-500/30 text-emerald-100 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wide border border-emerald-300/30">
                    หลักสูตรการเรียนรู้และบันทึกชีวิต
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-2 mb-2">กสิกรรมไร้สารพิษและอาหาร</h2>
                  <p className="text-sm text-teal-100 leading-relaxed">
                    เพื่อเศรษฐกิจและสุขภาวะพึ่งตน ครอบคลุมทุกมิติชีวิต ตามวิถีเศรษฐกิจพอเพียง
                  </p>
                  <blockquote className="mt-4 border-l-4 border-amber-400 pl-3 italic text-xs text-amber-100">
                    &quot;สุขภาพดี เริ่มต้นที่ตัวเรา พึ่งตน พึ่งธรรมชาติ พึ่งพอเพียง เพื่อชีวิตที่มั่นคงและยั่งยืน&quot;
                  </blockquote>
                </div>
              </div>

              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-user-check text-teal-600" /> ข้อมูลผู้บันทึกสุขภาพ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  บันทึกข้อมูลส่วนบุคคลเพื่อการติดตามผลการดูแลสุขภาพในระยะยาว
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.profile.fullName}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, fullName: e.target.value }
                      }))
                    }
                    placeholder="เช่น นายสมชาย สุขใจ"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขประจำตัว (ประชาชน / รหัสผู้รับการอบรม)
                  </label>
                  <input
                    type="text"
                    value={data.profile.citizenId || ''}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, citizenId: e.target.value }
                      }))
                    }
                    placeholder="เช่น 1-1002-34567-89-0 หรือ รหัสผู้เรียน"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">อายุ (ปี)</label>
                  <input
                    type="number"
                    value={data.profile.age}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, age: e.target.value }
                      }))
                    }
                    placeholder="เช่น 45"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เพศ</label>
                  <select
                    value={data.profile.gender}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, gender: e.target.value }
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm bg-white"
                  >
                    <option value="">-- เลือกเพศ --</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">วันที่เริ่มบันทึก</label>
                  <input
                    type="date"
                    value={data.profile.startDate}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, startDate: e.target.value }
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    value={data.profile.phone}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, phone: e.target.value }
                      }))
                    }
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ที่อยู่ปัจจุบัน</label>
                  <input
                    type="text"
                    value={data.profile.address}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, address: e.target.value }
                      }))
                    }
                    placeholder="ระบุที่อยู่..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  โรคประจำตัว หรือ ปัญหาสุขภาพหลักที่ต้องการปรับปรุง
                </label>
                <textarea
                  rows={2}
                  value={data.profile.mainHealthIssues}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, mainHealthIssues: e.target.value }
                    }))
                  }
                  placeholder="เช่น ความดันโลหิตสูง, ไมเกรน, ภูมิแพ้, ร้อนในบ่อย, นอนไม่ค่อยหลับ..."
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* 4 Pillars Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                  <i className="fa-solid fa-bowl-rice text-2xl text-emerald-600 mb-2" />
                  <h4 className="font-bold text-sm text-emerald-900">กินดี</h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">อาหารปลอดภัย พฤกษเคมี สมุนไพรปรับสมดุล</p>
                </div>
                <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 text-center">
                  <i className="fa-solid fa-house-chimney-window text-2xl text-teal-600 mb-2" />
                  <h4 className="font-bold text-sm text-teal-900">อยู่ดี</h4>
                  <p className="text-[11px] text-teal-700 mt-0.5">สิ่งแวดล้อมดี กายบริหาร พักผ่อนเพียงพอ</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <i className="fa-solid fa-brain text-2xl text-amber-600 mb-2" />
                  <h4 className="font-bold text-sm text-amber-900">คิดดี</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">มีสติ ละความกังวล ฝึกใจให้สงบและพอเพียง</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-center">
                  <i className="fa-solid fa-hand-holding-heart text-2xl text-indigo-600 mb-2" />
                  <h4 className="font-bold text-sm text-indigo-900">ทำดี</h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">แบ่งปัน ช่วยเหลือ เกื้อกูลผู้อื่นและสังคม</p>
                </div>
              </div>

              {/* 10 Score Scale Guide */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <i className="fa-solid fa-scale-balanced text-teal-600" />
                  เกณฑ์ประเมินระดับคะแนน 10 ระดับ (1 = น้อยที่สุด / แย่ที่สุด | 10 = ดีมากที่สุด / ผาสุกที่สุด)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 text-center text-xs">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                    <div key={score} className={`p-2.5 rounded-xl border transition ${getScoreBadgeStyle(score)}`}>
                      <div className="font-bold text-sm mb-0.5">{score}</div>
                      <div className="text-[10px] leading-tight font-medium">{getScoreLabel(score)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VITALS & PHYSICAL */}
        {currentTab === 'vitals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-heart-pulse text-rose-600" /> บันทึกสัญญาณชีพ & สุขภาพกายภาพรายเดือน
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ติดตามพัฒนาการทางกายภาพเชิงประจักษ์ (เช่น น้ำหนัก, ความดัน, น้ำตาลในเลือด, การนอนหลับ)
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left min-w-[750px]">
                  <thead className="bg-rose-50 text-rose-900 font-bold border-b border-rose-200">
                    <tr>
                      <th className="p-3 w-48">รายการตรวจวัดทางกายภาพ</th>
                      <th className="p-2 text-center w-24 border-l border-rose-200 bg-amber-50">ก่อนเริ่ม</th>
                      {[1, 2, 3, 4, 5, 6].map((m) => (
                        <th key={m} className="p-2 text-center border-l border-rose-200">
                          เดือนที่ {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(vitalItems).map(([key, item]) => {
                      const vitalsKey = key as keyof HealthData['vitalsData'];
                      return (
                        <tr key={key} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-semibold text-slate-800 bg-slate-50/50">
                            <div className="text-rose-700 font-bold">{item.title}</div>
                            <div className="text-[10px] text-slate-500">{item.unit}</div>
                          </td>
                          <td className="p-1.5 border-l border-slate-200 bg-amber-50/30 text-center">
                            <input
                              type="text"
                              value={data.vitalsData[vitalsKey]?.before || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setData((prev) => ({
                                  ...prev,
                                  vitalsData: {
                                    ...prev.vitalsData,
                                    [vitalsKey]: { ...prev.vitalsData[vitalsKey], before: val }
                                  }
                                }));
                              }}
                              placeholder="-"
                              className="w-full p-1.5 border rounded-lg text-xs text-center font-bold text-amber-900 focus:ring-1 focus:ring-rose-500 outline-none"
                            />
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((m) => {
                            const monthKey = `m${m}` as keyof typeof data.vitalsData.weight;
                            return (
                              <td key={m} className="p-1.5 border-l border-slate-200 text-center">
                                <input
                                  type="text"
                                  value={data.vitalsData[vitalsKey]?.[monthKey] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setData((prev) => ({
                                      ...prev,
                                      vitalsData: {
                                        ...prev.vitalsData,
                                        [vitalsKey]: { ...prev.vitalsData[vitalsKey], [monthKey]: val }
                                      }
                                    }));
                                  }}
                                  placeholder="-"
                                  className="w-full p-1.5 border rounded-lg text-xs text-center font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 outline-none"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-notes-medical text-rose-600" /> บันทึกเพิ่มเติมสัญญาณชีพ & ผลการตรวจสุขภาพจากแพทย์
                </label>
                <textarea
                  rows={3}
                  value={data.vitalsNotes}
                  onChange={(e) => setData((prev) => ({ ...prev, vitalsNotes: e.target.value }))}
                  placeholder="บันทึกผลการตรวจเลือด, ยาที่ปรับลดลง, หรือการเปลี่ยนแปลงของสัญญาณชีพ..."
                  className="w-full p-3 text-xs border rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDICINE 9 PILLS */}
        {currentTab === 'med9' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-pills text-teal-600" />
                  1. แบบบันทึกการปฏิบัติในการดูแลสุขภาพพึ่งตนด้วยเทคนิค 9 ข้อ (ยา 9 เม็ด)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ระบุรายละเอียดการปฏิบัติตั้งแต่ก่อนเริ่ม จนถึงการติดตามผลรายเดือน พร้อมแนบรูปภาพประกอบ
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left min-w-[1050px]">
                  <thead className="bg-teal-50 text-teal-900 font-bold uppercase border-b border-teal-200">
                    <tr>
                      <th className="p-3 w-1/5">การปฏิบัติยา 9 เม็ด</th>
                      <th className="p-2 text-center w-28 border-l border-teal-200 bg-amber-100/80 text-amber-900">ก่อนเริ่ม</th>
                      {[1, 2, 3, 4, 5, 6].map((m) => (
                        <th key={m} className="p-2 text-center w-24 border-l border-teal-200">
                          เดือนที่ {m}
                        </th>
                      ))}
                      <th className="p-3 border-l border-teal-200 w-52">ข้อสังเกต & รูปภาพประกอบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {med9Items.map((item) => (
                      <tr key={item.key} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-semibold text-slate-800 bg-slate-50/50">
                          <div className="text-teal-700 font-bold mb-0.5">เม็ดที่ {item.id}</div>
                          <div>{item.title}</div>
                        </td>
                        {/* Before */}
                        <td className="p-1.5 border-l border-slate-200 bg-amber-50/40 text-center">
                          <textarea
                            rows={3}
                            value={data.med9Data[item.key]?.before || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => ({
                                ...prev,
                                med9Data: {
                                  ...prev.med9Data,
                                  [item.key]: { ...prev.med9Data[item.key], before: val }
                                }
                              }));
                            }}
                            placeholder="สภาวะการปฏิบัติก่อนเริ่ม..."
                            className="w-full p-1.5 border rounded-lg text-[11px] focus:ring-1 focus:ring-teal-500 outline-none resize-none font-medium text-amber-950 bg-amber-50/30"
                          />
                        </td>
                        {/* Months 1-6 */}
                        {[1, 2, 3, 4, 5, 6].map((m) => {
                          const monthKey = `m${m}` as keyof typeof data.med9Data.p1;
                          return (
                            <td key={m} className="p-1.5 border-l border-slate-200 text-center">
                              <textarea
                                rows={3}
                                value={(data.med9Data[item.key] as any)?.[monthKey] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setData((prev) => ({
                                    ...prev,
                                    med9Data: {
                                      ...prev.med9Data,
                                      [item.key]: { ...prev.med9Data[item.key], [monthKey]: val }
                                    }
                                  }));
                                }}
                                placeholder="รายละเอียด..."
                                className="w-full p-1.5 border rounded-lg text-[11px] focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                              />
                            </td>
                          );
                        })}
                        {/* Observation and Photo */}
                        <td className="p-2 border-l border-slate-200 space-y-2 align-top">
                          <textarea
                            rows={2}
                            value={data.med9Data[item.key]?.observation || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => ({
                                ...prev,
                                med9Data: {
                                  ...prev.med9Data,
                                  [item.key]: { ...prev.med9Data[item.key], observation: val }
                                }
                              }));
                            }}
                            placeholder="อาการที่เปลี่ยนไป..."
                            className="w-full p-1.5 border rounded-lg text-[11px] focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                          />

                          <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                            {data.med9Data[item.key]?.image ? (
                              <div className="relative group inline-block">
                                <img
                                  src={data.med9Data[item.key].image}
                                  alt="รูปกิจกรรม"
                                  className="w-16 h-16 object-cover rounded-lg border border-teal-300 shadow-sm cursor-pointer hover:opacity-90 transition"
                                  onClick={() => onOpenImageModal(data.med9Data[item.key].image!)}
                                  title="คลิกเพื่อดูรูปขยาย"
                                />
                                <button
                                  onClick={() => {
                                    setData((prev) => ({
                                      ...prev,
                                      med9Data: {
                                        ...prev.med9Data,
                                        [item.key]: { ...prev.med9Data[item.key], image: '' }
                                      }
                                    }));
                                    onShowToast('ลบรูปภาพแล้ว');
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow hover:bg-rose-600 transition"
                                  title="ลบรูป"
                                >
                                  <i className="fa-solid fa-xmark" />
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] rounded-lg border border-teal-200 font-medium transition shadow-sm">
                                <i className="fa-solid fa-camera" />
                                <span>แนบรูปกิจกรรม</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleMed9ImageUpload(item.key, file);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-comment-dots text-teal-600" /> สรุปบันทึกการปฏิบัติ ยา 9 เม็ด เพิ่มเติม
                </label>
                <textarea
                  rows={3}
                  value={data.med9Notes}
                  onChange={(e) => setData((prev) => ({ ...prev, med9Notes: e.target.value }))}
                  placeholder="บันทึกข้อสรุป ภาพรวม หรือข้อสังเกตเพิ่มเติมเกี่ยวกับการปฏิบัติยา 9 เม็ด..."
                  className="w-full p-3 text-xs border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 3 INDICATORS */}
        {currentTab === 'indicators' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-stethoscope text-amber-600" />
                  2. แบบบันทึกตัวชี้วัดสุขภาพตามหลักการแพทย์วิถีธรรม (3 ประการ)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ประเมินระดับคะแนน (1-10) จาก ความสบาย, ความเบากาย และความมีกำลัง
                </p>
              </div>

              {/* เกณฑ์ประเมินระดับคะแนน 10 ระดับ */}
              <ScoreCriteriaCard context="indicators" defaultExpanded={true} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-6">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-face-smile" /> สบาย
                  </div>
                  <p className="text-slate-600">จิตใจและร่างกายปลอดโปร่ง ไม่ตึงเครียด หรือเกิดความอึดอัด</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
                  <div className="font-bold text-teal-800 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-feather" /> เบากาย
                  </div>
                  <p className="text-slate-600">อาการเจ็บป่วยทุเลาลง หรือรู้สึกร่างกายเบาสบาย คล่องตัว</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                  <div className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                    <i className="fa-solid fa-bolt" /> มีกำลัง
                  </div>
                  <p className="text-slate-600">
                    มีเรี่ยวแรงในการทำกิจวัตรประจำวันและการทำความดีได้อย่างต่อเนื่อง ไม่อ่อนเพลีย
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left min-w-[700px]">
                  <thead className="bg-amber-50 text-amber-900 font-bold border-b border-amber-200">
                    <tr>
                      <th className="p-3" rowSpan={2}>
                        ตัวชี้วัดสุขภาพ
                      </th>
                      <th className="p-2 text-center border-l border-amber-200 bg-amber-100/80">ก่อนเรียนรู้</th>
                      <th className="p-2 text-center border-l border-amber-200" colSpan={6}>
                        หลังการเรียนรู้ยา 9 เม็ด (ระดับคะแนน 1-10)
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-center border-l border-amber-200 bg-amber-100/80">(1-10)</th>
                      {[1, 2, 3, 4, 5, 6].map((m) => (
                        <th key={m} className="p-2 text-center w-20 border-l border-amber-200">
                          เดือนที่ {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Object.entries(indicatorLabels).map(([key, label]) => {
                      const indKey = key as keyof HealthData['indicatorsData'];
                      return (
                        <tr key={key} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800">{label}</td>
                          <td className="p-2 border-l border-slate-200 bg-amber-50/30 text-center">
                            <select
                              value={data.indicatorsData[indKey]?.before || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setData((prev) => ({
                                  ...prev,
                                  indicatorsData: {
                                    ...prev.indicatorsData,
                                    [indKey]: { ...prev.indicatorsData[indKey], before: val }
                                  }
                                }));
                              }}
                              className="w-full p-1 border rounded text-xs text-center font-bold text-amber-900 bg-white"
                            >
                              <option value="">-</option>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                  {n} ({getScoreLabel(n)})
                                </option>
                              ))}
                            </select>
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((m) => {
                            const monthKey = `m${m}` as keyof typeof data.indicatorsData.comfort;
                            return (
                              <td key={m} className="p-2 border-l border-slate-200 text-center">
                                <select
                                  value={data.indicatorsData[indKey]?.[monthKey] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setData((prev) => ({
                                      ...prev,
                                      indicatorsData: {
                                        ...prev.indicatorsData,
                                        [indKey]: { ...prev.indicatorsData[indKey], [monthKey]: val }
                                      }
                                    }));
                                  }}
                                  className="w-full p-1 border rounded text-xs text-center font-bold text-emerald-800 bg-white"
                                >
                                  <option value="">-</option>
                                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>
                                      {n} ({getScoreLabel(n)})
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-notes-medical text-amber-600" /> สรุปการประเมินตัวชี้วัด 3 ประการ
                </label>
                <textarea
                  rows={3}
                  value={data.indicatorNotes}
                  onChange={(e) => setData((prev) => ({ ...prev, indicatorNotes: e.target.value }))}
                  placeholder="บันทึกข้อสังเกต พัฒนาการ หรือการเปลี่ยนแปลงของความสบาย เบากาย มีกำลัง..."
                  className="w-full p-3 text-xs border rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HOLISTIC 4 DIMENSIONS */}
        {currentTab === 'holistic' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-brain text-purple-600" />
                  3. แบบประเมินสุขภาวะองค์รวม 4 ด้าน (จิตใจ จิตวิญญาณ สังคม เศรษฐกิจ)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  ประเมินระดับคะแนน 1-10 ตามความเป็นจริงเพื่อสังเกตการเปลี่ยนแปลง
                </p>
              </div>

              {/* เกณฑ์ประเมินระดับคะแนน 10 ระดับ */}
              <ScoreCriteriaCard context="holistic" defaultExpanded={true} />

              {/* 4 Dimension blocks */}
              {(['mental', 'spiritual', 'social', 'economic'] as const).map((dimKey) => {
                const dimLabels = {
                  mental: { title: '1. มิติด้านจิตใจ (Mental Dimension)', icon: 'fa-solid fa-brain text-rose-500' },
                  spiritual: { title: '2. มิติด้านจิตวิญญาณ (Spiritual Dimension)', icon: 'fa-solid fa-peace text-teal-600' },
                  social: { title: '3. มิติด้านสังคม (Social Dimension)', icon: 'fa-solid fa-people-roof text-indigo-600' },
                  economic: { title: '4. มิติด้านเศรษฐกิจ / การพึ่งตน (Economic Dimension)', icon: 'fa-solid fa-coins text-amber-600' }
                };

                const questions = holisticQuestions[dimKey];

                return (
                  <div key={dimKey} className="mb-8 p-4 rounded-2xl bg-slate-50/60 border border-slate-200">
                    <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                      <i className={dimLabels[dimKey].icon} /> {dimLabels[dimKey].title}
                    </h3>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white mb-3">
                      <table className="w-full text-xs text-left min-w-[700px]">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                          <tr>
                            <th className="p-2.5">คำถามประเมิน</th>
                            <th className="p-2 text-center w-24 border-l bg-amber-50">ก่อน</th>
                            {[1, 2, 3, 4, 5, 6].map((m) => (
                              <th key={m} className="p-2 text-center w-20 border-l">
                                ด.{m}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {questions.map((qText, qIdx) => (
                            <tr key={qIdx} className="hover:bg-slate-50">
                              <td className="p-2.5 text-slate-800 font-medium">{qText}</td>
                              <td className="p-1 border-l bg-amber-50/30 text-center">
                                <select
                                  value={data.holisticData[dimKey]?.[qIdx]?.before || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setData((prev) => {
                                      const updatedList = [...prev.holisticData[dimKey]];
                                      updatedList[qIdx] = { ...updatedList[qIdx], before: val };
                                      return {
                                        ...prev,
                                        holisticData: { ...prev.holisticData, [dimKey]: updatedList }
                                      };
                                    });
                                  }}
                                  className="w-full p-1 border rounded text-xs text-center font-bold text-amber-900 bg-white"
                                >
                                  <option value="">-</option>
                                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>
                                      {n} ({getScoreLabel(n)})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              {[1, 2, 3, 4, 5, 6].map((m) => {
                                const mKey = `m${m}` as keyof typeof data.indicatorsData.comfort;
                                return (
                                  <td key={m} className="p-1 border-l text-center">
                                    <select
                                      value={data.holisticData[dimKey]?.[qIdx]?.[mKey] || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev) => {
                                          const updatedList = [...prev.holisticData[dimKey]];
                                          updatedList[qIdx] = { ...updatedList[qIdx], [mKey]: val };
                                          return {
                                            ...prev,
                                            holisticData: { ...prev.holisticData, [dimKey]: updatedList }
                                          };
                                        });
                                      }}
                                      className="w-full p-1 border rounded text-xs text-center font-bold text-emerald-800 bg-white"
                                    >
                                      <option value="">-</option>
                                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                        <option key={n} value={n}>
                                          {n} ({getScoreLabel(n)})
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        บันทึกข้อสังเกต / ถอดบทเรียนใน{dimLabels[dimKey].title}
                      </label>
                      <input
                        type="text"
                        value={data.holisticDimensionNotes[dimKey]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setData((prev) => ({
                            ...prev,
                            holisticDimensionNotes: { ...prev.holisticDimensionNotes, [dimKey]: val }
                          }));
                        }}
                        placeholder="บันทึกพัฒนาการในมิตินี้..."
                        className="w-full p-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                  </div>
                );
              })}

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-shapes text-teal-600" /> สรุปภาพรวมสุขภาวะองค์รวม 4 ด้าน
                </label>
                <textarea
                  rows={3}
                  value={data.holisticNotes}
                  onChange={(e) => setData((prev) => ({ ...prev, holisticNotes: e.target.value }))}
                  placeholder="บันทึกข้อสรุปภาพรวมของสุขภาวะ 4 ด้าน..."
                  className="w-full p-3 text-xs border rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: MONTHLY JOURNAL */}
        {currentTab === 'journal' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="fa-solid fa-book-bookmark text-indigo-600" />
                  4. ไดอารี่ถอดบทเรียนรายเดือน (6 เดือนแห่งการเปลี่ยนแปลง)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  บันทึกความสำเร็จ อุปสรรค และเป้าหมายของแต่ละเดือน
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((m) => {
                  const mKey = `m${m}` as keyof typeof data.journalData;
                  const item = data.journalData[mKey];
                  return (
                    <div key={m} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-sm text-indigo-900 flex items-center gap-1.5">
                          <i className="fa-solid fa-calendar-day text-indigo-600" /> เดือนที่ {m}
                        </span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-semibold">
                          Journal
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                          <i className="fa-solid fa-circle-check text-emerald-600" /> สิ่งที่ทำได้ดี / สำเร็จ
                        </label>
                        <textarea
                          rows={2}
                          value={item.success}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => ({
                              ...prev,
                              journalData: {
                                ...prev.journalData,
                                [mKey]: { ...prev.journalData[mKey], success: val }
                              }
                            }));
                          }}
                          placeholder="เช่น ปฏิบัติยา 9 เม็ดต่อเนื่อง..."
                          className="w-full p-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-800 mb-1">
                          <i className="fa-solid fa-triangle-exclamation text-amber-600" /> อุปสรรค / ปัญหาที่พบ
                        </label>
                        <textarea
                          rows={2}
                          value={item.obstacle}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => ({
                              ...prev,
                              journalData: {
                                ...prev.journalData,
                                [mKey]: { ...prev.journalData[mKey], obstacle: val }
                              }
                            }));
                          }}
                          placeholder="เช่น ยังไม่คุ้นเคยรสชาติ..."
                          className="w-full p-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-800 mb-1">
                          <i className="fa-solid fa-bullseye text-indigo-600" /> เป้าหมายเดือนถัดไป
                        </label>
                        <textarea
                          rows={2}
                          value={item.goal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => ({
                              ...prev,
                              journalData: {
                                ...prev.journalData,
                                [mKey]: { ...prev.journalData[mKey], goal: val }
                              }
                            }));
                          }}
                          placeholder="เช่น ออกกำลังกายสม่ำเสมอ..."
                          className="w-full p-2 border rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: ANALYTICS & CHARTS */}
        {currentTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-3 mb-6 flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-emerald-600" /> สรุปผล & กราฟสถิติพัฒนาการสุขภาวะ
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs text-center mb-3">
                    แนวโน้มตัวชี้วัดสุขภาพ 3 ประการ (ความสบาย • เบากาย • มีกำลัง)
                  </h4>
                  <div className="h-72 flex justify-center items-center">
                    <canvas ref={indicatorsChartRef} />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs text-center mb-3">
                    เรดาร์สุขภาวะองค์รวม 4 ด้าน (ก่อนเริ่ม vs เดือนที่ 6)
                  </h4>
                  <div className="h-72 flex justify-center items-center">
                    <canvas ref={holisticChartRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: FULL FORM PRINT / EXPORT PREVIEW */}
        {currentTab === 'preview' && (
          <div className="space-y-6">
            <div
              className="bg-white rounded-2xl shadow-md border border-slate-300 p-6 sm:p-10 max-w-5xl mx-auto"
              id="document-to-export-health"
            >
              <div className="text-center border-b-2 border-teal-800 pb-6 mb-6">
                <div className="text-xs text-slate-500 mb-1">
                  หลักสูตรการเรียนรู้กสิกรรมไร้สารพิษและอาหาร เพื่อเศรษฐกิจและสุขภาวะพึ่งตนตามวิถีเศรษฐกิจพอเพียง
                </div>
                <h1 className="text-2xl font-bold text-teal-900">
                  สมุดบันทึกบัญชีสุขภาพทุกมิติ (Holistic Health Record)
                </h1>
                <p className="text-sm text-slate-700 mt-1">
                  บันทึกการดูแลสุขภาพพึ่งตนด้วยยา 9 เม็ด และการติดตามผลสุขภาวะองค์รวม
                </p>
              </div>

              {/* Trainee Details */}
              <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <strong>ชื่อ-สกุล:</strong> {data.profile.fullName || '-'}
                </div>
                <div>
                  <strong>เลขประจำตัว:</strong> {data.profile.citizenId || '-'}
                </div>
                <div>
                  <strong>อายุ / เพศ:</strong> {data.profile.age || '-'} ปี / {data.profile.gender || '-'}
                </div>
                <div>
                  <strong>วันที่เริ่มบันทึก:</strong> {data.profile.startDate || '-'}
                </div>
                <div>
                  <strong>เบอร์โทรศัพท์:</strong> {data.profile.phone || '-'}
                </div>
                <div className="col-span-2">
                  <strong>ที่อยู่:</strong> {data.profile.address || '-'}
                </div>
                <div className="col-span-2">
                  <strong>ปัญหาสุขภาพหลัก:</strong> {data.profile.mainHealthIssues || '-'}
                </div>
              </div>

              {/* Vitals Summary Table */}
              <div className="mb-8">
                <h3 className="font-bold text-sm text-slate-800 mb-2 border-b pb-1">
                  สัญญาณชีพและสุขภาพกายภาพรายเดือน
                </h3>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 p-1.5">รายการตรวจวัด</th>
                      <th className="border border-slate-300 p-1.5 text-center">ก่อน</th>
                      {[1, 2, 3, 4, 5, 6].map((m) => (
                        <th key={m} className="border border-slate-300 p-1.5 text-center">
                          ด.{m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(vitalItems).map(([key, item]) => {
                      const vKey = key as keyof HealthData['vitalsData'];
                      return (
                        <tr key={key}>
                          <td className="border border-slate-300 p-1.5 font-medium">
                            {item.title} ({item.unit})
                          </td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">
                            {data.vitalsData[vKey]?.before || '-'}
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((m) => (
                            <td key={m} className="border border-slate-300 p-1.5 text-center">
                              {(data.vitalsData[vKey] as any)?.[`m${m}`] || '-'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 3 Indicators Table */}
              <div className="mb-8">
                <div className="flex flex-wrap justify-between items-baseline border-b pb-1 mb-2">
                  <h3 className="font-bold text-sm text-slate-800">
                    2. ตัวชี้วัดสุขภาพ 3 ประการ (ระดับคะแนน 1-10)
                  </h3>
                  <span className="text-[10px] text-slate-600 font-medium">
                    เกณฑ์ 10 ระดับ: 1-3 (ไม่สบาย/ปรับปรุง), 4-5 (ปานกลาง), 6-8 (ดี/เบากาย สบายใจ), 9-10 (ดีเยี่ยม/ผาสุกยิ่ง)
                  </span>
                </div>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 p-1.5">ตัวชี้วัด</th>
                      <th className="border border-slate-300 p-1.5 text-center">ก่อน</th>
                      {[1, 2, 3, 4, 5, 6].map((m) => (
                        <th key={m} className="border border-slate-300 p-1.5 text-center">
                          ด.{m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(indicatorLabels).map(([key, label]) => {
                      const indKey = key as keyof HealthData['indicatorsData'];
                      return (
                        <tr key={key}>
                          <td className="border border-slate-300 p-1.5 font-medium">{label}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold">
                            {data.indicatorsData[indKey]?.before || '-'}
                          </td>
                          {[1, 2, 3, 4, 5, 6].map((m) => (
                            <td key={m} className="border border-slate-300 p-1.5 text-center">
                              {(data.indicatorsData[indKey] as any)?.[`m${m}`] || '-'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Medicine 9 Pills Table */}
              <div className="mb-8">
                <h3 className="font-bold text-sm text-slate-800 mb-2 border-b pb-1">
                  1. การปฏิบัติยา 9 เม็ด & ข้อสังเกต
                </h3>
                <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 p-1.5 w-1/4">เม็ดที่ & การปฏิบัติ</th>
                      <th className="border border-slate-300 p-1.5">ก่อนเริ่ม</th>
                      <th className="border border-slate-300 p-1.5">เดือนที่ 3</th>
                      <th className="border border-slate-300 p-1.5">เดือนที่ 6</th>
                      <th className="border border-slate-300 p-1.5">ข้อสังเกต</th>
                    </tr>
                  </thead>
                  <tbody>
                    {med9Items.map((item) => (
                      <tr key={item.key}>
                        <td className="border border-slate-300 p-1.5 font-medium">
                          เม็ดที่ {item.id}: {item.title}
                        </td>
                        <td className="border border-slate-300 p-1.5">{data.med9Data[item.key]?.before || '-'}</td>
                        <td className="border border-slate-300 p-1.5">{data.med9Data[item.key]?.m3 || '-'}</td>
                        <td className="border border-slate-300 p-1.5">{data.med9Data[item.key]?.m6 || '-'}</td>
                        <td className="border border-slate-300 p-1.5">{data.med9Data[item.key]?.observation || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="border-t pt-4 text-xs space-y-2">
                <h3 className="font-bold text-sm text-slate-800 mb-2">สรุปภาพรวมและถอดบทเรียน</h3>
                <p>
                  <strong>สรุปยา 9 เม็ด:</strong> {data.med9Notes || '-'}
                </p>
                <p>
                  <strong>สรุปตัวชี้วัด 3 ประการ:</strong> {data.indicatorNotes || '-'}
                </p>
                <p>
                  <strong>สรุปสุขภาวะ 4 ด้าน:</strong> {data.holisticNotes || '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <GoogleSheetsExportModal
        isOpen={showGoogleSheetModal}
        onClose={() => setShowGoogleSheetModal(false)}
        type="health"
        healthData={data}
        onShowToast={onShowToast}
      />
    </div>
  );
};
