import React, { useState, useEffect, useRef } from 'react';
import { FarmData, PlotItem, SoilLog, WaterLog, FertilizerLog, IpmLog, HarvestLog, UtilizationLog } from '../types/farm';
import { sampleFarmData, initialFarmData } from '../data/sampleData';
import { exportToWord, exportToPDF, exportToJsonFile } from '../utils/exportUtils';
import Chart from 'chart.js/auto';
import { GoogleSheetsExportModal } from './GoogleSheetsExportModal';

interface FarmAccountViewProps {
  onShowToast: (msg: string, icon?: string) => void;
  onOpenImageModal: (url: string) => void;
  onNavigateHome?: () => void;
  isModalPreview?: boolean;
}

const STORAGE_KEY = 'farm_account_data_v1';

export const FarmAccountView: React.FC<FarmAccountViewProps> = ({
  onShowToast,
  onOpenImageModal,
  onNavigateHome,
  isModalPreview = false
}) => {
  const [data, setData] = useState<FarmData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return sampleFarmData;
  });

  const [currentTab, setCurrentTab] = useState<'profile' | 'plots' | 'activity' | 'harvest' | 'reflections' | 'analytics' | 'preview'>('profile');
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasTool, setCanvasTool] = useState<'pen' | 'eraser'>('pen');
  const [canvasColor, setCanvasColor] = useState('#15803d');
  const [canvasLineWidth, setCanvasLineWidth] = useState('2');
  const [isDrawing, setIsDrawing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mapUploadInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage quota warning', e);
    }
  }, [data]);

  // Sync canvas with stored dataUrl on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (data.canvasDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = data.canvasDataUrl;
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [currentTab, data.canvasDataUrl]);

  // Drawing handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineWidth = Number(canvasLineWidth);
    ctx.lineCap = 'round';

    if (canvasTool === 'eraser') {
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 15;
    } else {
      ctx.strokeStyle = canvasColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasData();
    }
  };

  const saveCanvasData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setData((prev) => ({ ...prev, canvasDataUrl: dataUrl }));
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvasData();
    onShowToast('ล้างผืนผ้าใบเรียบร้อยแล้ว');
  };

  const uploadMapImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveCanvasData();
        onShowToast('อัปโหลดภาพผังแปลงสำเร็จ');
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Attach photo helper (resizes to max 800px)
  const attachPhoto = (file: File, callback: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(dataUrl);
        onShowToast('แนบรูปถ่ายเรียบร้อยแล้ว');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Calculations
  const totalExpenses = data.soilLogs.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  const totalIncome = data.utilizationLogs.reduce(
    (sum, item) => sum + (Number(item.sellKg) || 0) * (Number(item.pricePerUnit) || 0),
    0
  );
  const netProfit = totalIncome - totalExpenses;
  const totalHarvestWeight = data.harvestLogs.reduce((sum, item) => sum + (Number(item.weightKg) || 0), 0);
  const totalConsumedWeight = data.utilizationLogs.reduce((sum, item) => sum + (Number(item.consumeKg) || 0), 0);
  const totalSharedWeight = data.utilizationLogs.reduce((sum, item) => sum + (Number(item.shareKg) || 0), 0);
  const totalSoldWeight = data.utilizationLogs.reduce((sum, item) => sum + (Number(item.sellKg) || 0), 0);
  const estimatedSelfRelianceSavings = data.utilizationLogs.reduce(
    (sum, item) => sum + (Number(item.consumeKg) || 0) * 40,
    0
  );

  // Charts render on analytics tab
  const utilChartRef = useRef<HTMLCanvasElement | null>(null);
  const finChartRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (currentTab !== 'analytics') return;

    let chart1: Chart | null = null;
    let chart2: Chart | null = null;

    if (utilChartRef.current) {
      chart1 = new Chart(utilChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['บริโภคในบ้าน', 'แบ่งปัน/แจก', 'จำหน่าย'],
          datasets: [
            {
              data: [totalConsumedWeight, totalSharedWeight, totalSoldWeight],
              backgroundColor: ['#f59e0b', '#f43f5e', '#2563eb']
            }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    if (finChartRef.current) {
      chart2 = new Chart(finChartRef.current, {
        type: 'bar',
        data: {
          labels: ['รายได้รวม', 'ต้นทุนรวม', 'มูลค่าประหยัดค่าผัก'],
          datasets: [
            {
              label: 'จำนวนเงิน (บาท)',
              data: [totalIncome, totalExpenses, estimatedSelfRelianceSavings],
              backgroundColor: ['#10b981', '#f43f5e', '#8b5cf6']
            }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    return () => {
      chart1?.destroy();
      chart2?.destroy();
    };
  }, [currentTab, totalConsumedWeight, totalSharedWeight, totalSoldWeight, totalIncome, totalExpenses, estimatedSelfRelianceSavings]);

  // Actions
  const handleFillSample = () => {
    if (window.confirm('ข้อมูลตัวอย่างจะแทนที่ข้อมูลที่กรอกไว้ทั้งหมด ต้องการดำเนินการต่อหรือไม่?')) {
      setData(sampleFarmData);
      onShowToast('โหลดข้อมูลตัวอย่างเรียบร้อยแล้ว');
    }
  };

  const handleExportWord = () => {
    exportToWord('printable-doc-farm', `แบบบันทึกบัญชีฟาร์ม_${data.profile.name || 'ไร้ชื่อ'}`, 'แบบบันทึกบัญชีฟาร์ม');
    onShowToast('ส่งออกเป็นไฟล์ Word สำเร็จ');
  };

  const handleExportPDF = () => {
    onShowToast('กำลังจัดเตรียมไฟล์ PDF...', 'fa-solid fa-spinner fa-spin');
    setCurrentTab('preview');
    setTimeout(() => {
      exportToPDF('printable-doc-farm', `แบบบันทึกบัญชีฟาร์ม_${data.profile.name || 'ไร้ชื่อ'}`, () => {
        onShowToast('บันทึก PDF สำเร็จแล้ว');
      });
    }, 400);
  };

  const handleExportJSON = () => {
    exportToJsonFile(data, `Farm_Record_Backup_${new Date().toISOString().substring(0, 10)}`);
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
          onShowToast('นำเข้าข้อมูลสำเร็จ');
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

  // Add Row Helpers
  const addNewPlot = () => {
    const plotNum = data.plotList.length + 1;
    const newPlot: PlotItem = {
      name: `แปลงที่ ${plotNum}`,
      areaType: 'แปลงดินบนพื้น',
      size: '1.2 x 5 เมตร',
      soilStatus: 'พร้อมปลูก (สมบูรณ์)',
      mulchType: 'ฟางข้าวคลุมดิน',
      trellisType: 'ไม่มี',
      managementNotes: '',
      crops: [
        {
          name: '',
          plantDate: new Date().toISOString().substring(0, 10),
          harvestDate: '',
          spacing: '',
          seedSource: 'เก็บเมล็ดเอง',
          status: 'กำลังเติบโต'
        }
      ]
    };
    setData((prev) => ({ ...prev, plotList: [...prev.plotList, newPlot] }));
    onShowToast('เพิ่มแปลงเกษตรใหม่เรียบร้อยแล้ว');
  };

  const removePlot = (index: number) => {
    setData((prev) => {
      const updated = [...prev.plotList];
      updated.splice(index, 1);
      return { ...prev, plotList: updated };
    });
    onShowToast('ลบแปลงเกษตรแล้ว');
  };

  const addCropToPlot = (plotIndex: number) => {
    setData((prev) => {
      const updated = [...prev.plotList];
      const targetPlot = { ...updated[plotIndex] };
      targetPlot.crops = [
        ...targetPlot.crops,
        {
          name: '',
          plantDate: new Date().toISOString().substring(0, 10),
          harvestDate: '',
          spacing: '',
          seedSource: 'เก็บเมล็ดเอง',
          status: 'กำลังเติบโต'
        }
      ];
      updated[plotIndex] = targetPlot;
      return { ...prev, plotList: updated };
    });
    onShowToast('เพิ่มรายการพืชในแปลงแล้ว');
  };

  const addSoilLog = () => {
    const newLog: SoilLog = {
      date: new Date().toISOString().substring(0, 10),
      plot: data.plotList[0]?.name || 'แปลงที่ 1',
      activity: '',
      materials: '',
      amount: '',
      source: 'ทำเอง',
      cost: 0,
      photo: null
    };
    setData((prev) => ({ ...prev, soilLogs: [...prev.soilLogs, newLog] }));
  };

  const addWaterLog = () => {
    const newLog: WaterLog = {
      date: new Date().toISOString().substring(0, 10),
      plot: data.plotList[0]?.name || 'แปลงที่ 1',
      method: 'รดด้วยสายยาง/ฝักบัว',
      duration: '',
      notes: ''
    };
    setData((prev) => ({ ...prev, waterLogs: [...prev.waterLogs, newLog] }));
  };

  const addFertilizerLog = () => {
    const newLog: FertilizerLog = {
      date: new Date().toISOString().substring(0, 10),
      plot: data.plotList[0]?.name || 'แปลงที่ 1',
      type: '',
      amount: '',
      ratio: '',
      source: 'หมักทำเอง',
      photo: null
    };
    setData((prev) => ({ ...prev, fertilizerLogs: [...prev.fertilizerLogs, newLog] }));
  };

  const addIpmLog = () => {
    const newLog: IpmLog = {
      date: new Date().toISOString().substring(0, 10),
      plot: data.plotList[0]?.name || 'แปลงที่ 1',
      pestFound: '',
      severity: 'น้อย',
      method: '',
      materials: '',
      effectiveness: 'ดีมาก',
      photo: null
    };
    setData((prev) => ({ ...prev, ipmLogs: [...prev.ipmLogs, newLog] }));
  };

  const addHarvestLog = () => {
    const newLog: HarvestLog = {
      date: new Date().toISOString().substring(0, 10),
      plot: data.plotList[0]?.name || 'แปลงที่ 1',
      crop: '',
      weightKg: 0,
      grade: 'เกรด A (สวยงาม)',
      postHarvest: '',
      notes: '',
      photo: null
    };
    setData((prev) => ({ ...prev, harvestLogs: [...prev.harvestLogs, newLog] }));
  };

  const addUtilizationLog = () => {
    const newLog: UtilizationLog = {
      date: new Date().toISOString().substring(0, 10),
      crop: '',
      totalKg: 0,
      consumeKg: 0,
      shareKg: 0,
      sellKg: 0,
      pricePerUnit: 0,
      channel: ''
    };
    setData((prev) => ({ ...prev, utilizationLogs: [...prev.utilizationLogs, newLog] }));
  };

  const tabBtnClass = (tab: typeof currentTab) =>
    currentTab === tab
      ? 'bg-green-700 text-white shadow-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold transition shrink-0'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0';

  return (
    <div className="bg-lime-50/40 min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-green-800 to-lime-900 text-white shadow-md no-print sticky top-0 z-40">
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
            <div className="w-10 h-10 rounded-2xl bg-white text-green-700 flex items-center justify-center text-xl font-bold shadow-md">
              <i className="fa-solid fa-wheat-awn" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold leading-tight">
                แบบบันทึกบัญชีฟาร์ม (กสิกรรมไร้สารพิษและอาหาร)
              </h1>
              <p className="text-xs text-lime-200 hidden sm:block">
                เพื่อเศรษฐกิจและสุขภาวะพึ่งตน ตามวิถีเศรษฐกิจพอเพียง
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-1.5">
            <button
              onClick={handleFillSample}
              className="bg-lime-800 hover:bg-lime-900 text-lime-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm font-medium"
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
      <nav className="bg-white border-b border-stone-200 sticky top-[54px] z-30 no-print shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-2 whitespace-nowrap text-xs sm:text-sm font-medium py-2">
          <button onClick={() => setCurrentTab('profile')} className={tabBtnClass('profile')}>
            <i className="fa-solid fa-id-card" /> 1. ทะเบียนผู้บันทึก & ผังฟาร์ม
          </button>
          <button onClick={() => setCurrentTab('plots')} className={tabBtnClass('plots')}>
            <i className="fa-solid fa-layer-group text-emerald-600" /> 2. จัดการแปลง & พืชที่ปลูก
          </button>
          <button onClick={() => setCurrentTab('activity')} className={tabBtnClass('activity')}>
            <i className="fa-solid fa-seedling text-green-600" /> 3. กิจกรรมแปลง (มีแนบรูป)
          </button>
          <button onClick={() => setCurrentTab('harvest')} className={tabBtnClass('harvest')}>
            <i className="fa-solid fa-basket-shopping text-amber-600" /> 4. เก็บเกี่ยว & ใช้ประโยชน์
          </button>
          <button onClick={() => setCurrentTab('reflections')} className={tabBtnClass('reflections')}>
            <i className="fa-solid fa-book-open text-indigo-600" /> 5. ถอดบทเรียน & ครบทุกมิติ
          </button>
          <button onClick={() => setCurrentTab('analytics')} className={tabBtnClass('analytics')}>
            <i className="fa-solid fa-chart-pie text-teal-600" /> 6. สรุปผล & สถิติ
          </button>
          <button onClick={() => setCurrentTab('preview')} className={tabBtnClass('preview')}>
            <i className="fa-solid fa-print text-amber-600" /> ตัวอย่างแบบฟอร์มฉบับเต็ม
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 flex-grow w-full">
        {/* TAB 1: PROFILE & CANVAS */}
        {currentTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-8">
              <div className="bg-gradient-to-r from-green-800 via-emerald-800 to-lime-900 rounded-2xl p-6 text-white mb-6 shadow-md relative overflow-hidden">
                <div className="relative z-10 max-w-3xl">
                  <span className="inline-block bg-lime-400 text-stone-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                    หลักสูตรการเรียนรู้
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    กสิกรรมไร้สารพิษและอาหารเพื่อเศรษฐกิจและสุขภาวะพึ่งตน
                  </h2>
                  <p className="text-sm text-lime-200 mt-1">
                    ตามวิถีเศรษฐกิจพอเพียง • บันทึกข้อมูลการทำเกษตรเพื่อการเรียนรู้ พัฒนา และพึ่งตนอย่างยั่งยืน
                  </p>
                </div>
              </div>

              {/* Personal Information */}
              <h3 className="text-lg font-bold text-stone-800 border-b pb-2 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-green-700" /> ข้อมูลผู้บันทึก & แปลงเกษตร
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    ชื่อ - สกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={data.profile.name}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, profile: { ...prev.profile, name: e.target.value } }))
                    }
                    placeholder="นาย/นาง/นางสาว..."
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    เลขประจำตัว (ประชาชน / นิสิต / ผู้เรียน)
                  </label>
                  <input
                    type="text"
                    value={data.profile.citizenId || ''}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, profile: { ...prev.profile, citizenId: e.target.value } }))
                    }
                    placeholder="เช่น 1-1002-34567-89-0 หรือ รหัสนิสิต"
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">วันที่เริ่มบันทึก</label>
                  <input
                    type="date"
                    value={data.profile.startDate}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, profile: { ...prev.profile, startDate: e.target.value } }))
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">ปีการปลูก (พ.ศ.)</label>
                  <input
                    type="text"
                    value={data.profile.cropYear}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, profile: { ...prev.profile, cropYear: e.target.value } }))
                    }
                    placeholder="เช่น 2569"
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium text-stone-700 mb-1">ที่อยู่แปลง / ที่พักอาศัย</label>
                  <input
                    type="text"
                    value={data.profile.address}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, profile: { ...prev.profile, address: e.target.value } }))
                    }
                    placeholder="บ้านเลขที่ หมู่ ตำบล อำเภอ จังหวัด..."
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">เบอร์โทรศัพท์ / Line ID</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.profile.phone}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, profile: { ...prev.profile, phone: e.target.value } }))
                      }
                      placeholder="เบอร์โทรศัพท์"
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      value={data.profile.lineId}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, profile: { ...prev.profile, lineId: e.target.value } }))
                      }
                      placeholder="Line ID"
                      className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Goals */}
              <h3 className="text-lg font-bold text-stone-800 border-b pb-2 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-bullseye text-green-700" /> ปรัชญา / เป้าหมายของแปลง
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6 text-sm">
                {[
                  { key: 'safe', label: 'ปลอดภัยเพื่อสุขภาพ', icon: 'fa-solid fa-shield-heart text-green-600' },
                  { key: 'household', label: 'บริโภคในครัวเรือน', icon: 'fa-solid fa-utensils text-amber-600' },
                  { key: 'share', label: 'ปลูกเพื่อแบ่งปัน', icon: 'fa-solid fa-hand-holding-heart text-rose-500' },
                  { key: 'reduceCost', label: 'ลดต้นทุนการผลิต', icon: 'fa-solid fa-piggy-bank text-blue-600' },
                  { key: 'sell', label: 'ปลูกเพื่อจำหน่าย', icon: 'fa-solid fa-store text-emerald-600' }
                ].map((item) => {
                  const isChecked = (data.profile.goals as any)[item.key];
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-lime-50 ${
                        isChecked ? 'border-green-600 bg-lime-50 font-semibold' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              goals: { ...prev.profile.goals, [item.key]: e.target.checked }
                            }
                          }))
                        }
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span>
                        <i className={item.icon} /> {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Area Type and Environment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-stone-50 rounded-2xl mb-6 border border-stone-200 text-sm">
                <div>
                  <h4 className="font-bold text-stone-800 mb-2">1. ภาพรวมลักษณะพื้นที่ปลูก</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.profile.areaType.pots}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              areaType: { ...prev.profile.areaType, pots: e.target.checked }
                            }
                          }))
                        }
                        className="rounded text-green-600"
                      />
                      <span>ในกระถาง/ถุง/กระสอบ</span>
                      <input
                        type="number"
                        value={data.profile.areaType.potsCount}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              areaType: { ...prev.profile.areaType, potsCount: e.target.value }
                            }
                          }))
                        }
                        placeholder="จำนวน"
                        className="w-20 p-1 border rounded text-xs ml-auto"
                      />{' '}
                      ใบ
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.profile.areaType.raisedBed}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              areaType: { ...prev.profile.areaType, raisedBed: e.target.checked }
                            }
                          }))
                        }
                        className="rounded text-green-600"
                      />
                      <span>ยกแคร่</span>
                      <input
                        type="number"
                        value={data.profile.areaType.raisedBedCount}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              areaType: { ...prev.profile.areaType, raisedBedCount: e.target.value }
                            }
                          }))
                        }
                        placeholder="จำนวน"
                        className="w-20 p-1 border rounded text-xs ml-auto"
                      />{' '}
                      แคร่
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.profile.areaType.groundPlot}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              areaType: { ...prev.profile.areaType, groundPlot: e.target.checked }
                            }
                          }))
                        }
                        className="rounded text-green-600"
                      />
                      <span>บนแปลงดิน</span>
                      <input
                        type="number"
                        value={data.profile.areaType.groundPlotCount}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              areaType: { ...prev.profile.areaType, groundPlotCount: e.target.value }
                            }
                          }))
                        }
                        placeholder="จำนวน"
                        className="w-20 p-1 border rounded text-xs ml-auto"
                      />{' '}
                      แปลง
                    </label>
                    <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                      <span className="font-medium">พื้นที่รวม:</span>
                      <input
                        type="text"
                        value={data.profile.areaType.totalSize}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              areaType: { ...prev.profile.areaType, totalSize: e.target.value }
                            }
                          }))
                        }
                        placeholder="เช่น 2 งาน 50 ตร.ว. หรือ 1 ไร่"
                        className="flex-grow p-1.5 border rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-stone-800 mb-2">2. สภาพแวดล้อมโดยรอบ</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.profile.location.backyard}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              location: { ...prev.profile.location, backyard: e.target.checked }
                            }
                          }))
                        }
                        className="rounded text-green-600"
                      />{' '}
                      ข้างบ้าน / หลังบ้าน
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.profile.location.condo}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              location: { ...prev.profile.location, condo: e.target.checked }
                            }
                          }))
                        }
                        className="rounded text-green-600"
                      />{' '}
                      ระเบียงคอนโด
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.profile.location.rooftop}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              location: { ...prev.profile.location, rooftop: e.target.checked }
                            }
                          }))
                        }
                        className="rounded text-green-600"
                      />{' '}
                      ดาดฟ้า
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={data.profile.location.publicLand}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              location: { ...prev.profile.location, publicLand: e.target.checked }
                            }
                          }))
                        }
                        className="rounded text-green-600"
                      />{' '}
                      พื้นที่ส่วนกลาง
                    </label>
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      value={data.profile.location.other}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            location: { ...prev.profile.location, other: e.target.value }
                          }
                        }))
                      }
                      placeholder="ลักษณะอื่นๆ ระบุ..."
                      className="w-full p-2 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Farm Layout Canvas */}
              <h3 className="text-lg font-bold text-stone-800 border-b pb-2 mb-3 flex items-center justify-between">
                <span>
                  <i className="fa-solid fa-map-location-dot text-green-700" /> 3. แผนผังอย่างง่าย (วาดภาพพื้นที่ปลูก / แปลงปลูก)
                </span>
                <span className="text-xs font-normal text-stone-500">
                  <i className="fa-solid fa-compass text-rose-600" /> ทิศเหนือระบุอยู่ด้านบน
                </span>
              </h3>

              <div className="bg-stone-100 p-4 rounded-2xl border border-stone-300">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 no-print">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold">เครื่องมือวาด:</span>
                    <button
                      onClick={() => setCanvasTool('pen')}
                      className={`px-2.5 py-1 rounded-lg border shadow-sm ${
                        canvasTool === 'pen' ? 'bg-green-700 text-white font-bold' : 'bg-white'
                      }`}
                    >
                      <i className="fa-solid fa-pen" /> ดินสอ
                    </button>
                    <button
                      onClick={() => setCanvasTool('eraser')}
                      className={`px-2.5 py-1 rounded-lg border shadow-sm ${
                        canvasTool === 'eraser' ? 'bg-green-700 text-white font-bold' : 'bg-white'
                      }`}
                    >
                      <i className="fa-solid fa-eraser" /> ยางลบ
                    </button>
                    <input
                      type="color"
                      value={canvasColor}
                      onChange={(e) => setCanvasColor(e.target.value)}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <select
                      value={canvasLineWidth}
                      onChange={(e) => setCanvasLineWidth(e.target.value)}
                      className="p-1 border rounded text-xs bg-white"
                    >
                      <option value="2">เส้นเล็ก</option>
                      <option value="5">เส้นกลาง</option>
                      <option value="10">เส้นใหญ่</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button onClick={clearCanvas} className="bg-stone-200 hover:bg-stone-300 px-3 py-1 rounded-lg">
                      <i className="fa-solid fa-rotate-left" /> ล้างรูป
                    </button>
                    <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg cursor-pointer flex items-center gap-1">
                      <i className="fa-solid fa-image" /> อัปโหลดภาพผังแปลง
                      <input
                        type="file"
                        ref={mapUploadInputRef}
                        accept="image/*"
                        onChange={uploadMapImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="relative bg-white border-2 border-dashed border-stone-300 rounded-xl overflow-hidden shadow-inner flex justify-center items-center">
                  <div className="absolute top-3 right-3 bg-white/90 border border-stone-300 px-2 py-1 rounded-lg shadow text-center z-10 pointer-events-none">
                    <div className="font-bold text-rose-600 text-xs">N</div>
                    <i className="fa-solid fa-arrow-up text-rose-600 text-sm" />
                    <div className="text-[10px] text-stone-500">ทิศเหนือ</div>
                  </div>

                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={350}
                    className="w-full h-auto cursor-crosshair bg-stone-50"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-2">
                  <i className="fa-solid fa-circle-info" /> ลากเมาส์หรือนิ้วบนผืนผ้าใบเพื่อวาดโซนแปลง เช่น แปลงผัก, โรงเรือน, บ่อน้ำ, ถังหมักปุ๋ย
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PLOTS & CROPS REGISTER */}
        {currentTab === 'plots' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <i className="fa-solid fa-layer-group text-emerald-700" /> ทะเบียนแปลงเกษตร & พืชที่ปลูกแต่ละแปลง
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">
                    กำหนดรายละเอียดของแต่ละแปลง รายการพืชที่ลงปลูก และการจัดการแปลง (วัสดุคลุมดิน / การทำค้าง / สภาพดิน)
                  </p>
                </div>
                <button
                  onClick={addNewPlot}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
                >
                  <i className="fa-solid fa-plus-circle" /> เพิ่มแปลงเกษตรใหม่
                </button>
              </div>

              <div className="space-y-6">
                {data.plotList.map((plot, pIndex) => (
                  <div key={pIndex} className="bg-stone-50 border border-stone-300 rounded-2xl p-5 shadow-sm hover:shadow transition">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg">
                          {plot.name || `แปลงที่ ${pIndex + 1}`}
                        </span>
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-300">
                          {plot.areaType || 'แปลงดิน'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          onClick={() => addCropToPlot(pIndex)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium flex items-center gap-1"
                        >
                          <i className="fa-solid fa-seedling" /> เพิ่มพืชในแปลงนี้
                        </button>
                        <button
                          onClick={() => removePlot(pIndex)}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-2.5 py-1 rounded-lg font-medium transition"
                          title="ลบแปลงนี้"
                        >
                          <i className="fa-solid fa-trash" /> ลบแปลง
                        </button>
                      </div>
                    </div>

                    {/* Plot Overview Form */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mb-4">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">ชื่อ/รหัสแปลง</label>
                        <input
                          type="text"
                          value={plot.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const updated = [...prev.plotList];
                              updated[pIndex].name = val;
                              return { ...prev, plotList: updated };
                            });
                          }}
                          placeholder="เช่น แปลงที่ 1 (แคร่ผักสลัด)"
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">ลักษณะแปลง</label>
                        <select
                          value={plot.areaType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const updated = [...prev.plotList];
                              updated[pIndex].areaType = val;
                              return { ...prev, plotList: updated };
                            });
                          }}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="แปลงดินบนพื้น">แปลงดินบนพื้น</option>
                          <option value="แปลงยกแคร่">แปลงยกแคร่</option>
                          <option value="กระถาง / ถุงปลูก">กระถาง / ถุงปลูก</option>
                          <option value="โรงเรือนกางมุ้ง">โรงเรือนกางมุ้ง</option>
                          <option value="ซุ้มเลื้อย / นั่งร้าน">ซุ้มเลื้อย / นั่งร้าน</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">ขนาดแปลง / จำนวนกระถาง</label>
                        <input
                          type="text"
                          value={plot.size}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const updated = [...prev.plotList];
                              updated[pIndex].size = val;
                              return { ...prev, plotList: updated };
                            });
                          }}
                          placeholder="เช่น 1.2 x 5 เมตร หรือ 20 กระถาง"
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">สถานะสภาพดิน / แปลง</label>
                        <select
                          value={plot.soilStatus}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const updated = [...prev.plotList];
                              updated[pIndex].soilStatus = val;
                              return { ...prev, plotList: updated };
                            });
                          }}
                          className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                        >
                          <option value="พร้อมปลูก (สมบูรณ์)">พร้อมปลูก (สมบูรณ์)</option>
                          <option value="กำลังปลูกพืช">กำลังปลูกพืช</option>
                          <option value="อยู่ระหว่างพักดิน / หมักดิน">อยู่ระหว่างพักดิน / หมักดิน</option>
                          <option value="ปรับปรุงดินใหม่">ปรับปรุงดินใหม่</option>
                        </select>
                      </div>
                    </div>

                    {/* Plot Management Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-stone-200 mb-4">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          <i className="fa-solid fa-wheat-awn text-amber-600" /> วัสดุคลุมดิน (Mulching)
                        </label>
                        <input
                          type="text"
                          value={plot.mulchType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const updated = [...prev.plotList];
                              updated[pIndex].mulchType = val;
                              return { ...prev, plotList: updated };
                            });
                          }}
                          placeholder="เช่น ฟางข้าวหนา 2 นิ้ว / หญ้าแห้ง"
                          className="w-full p-1.5 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          <i className="fa-solid fa-border-all text-blue-600" /> โครงสร้าง / ค้าง (Trellis)
                        </label>
                        <input
                          type="text"
                          value={plot.trellisType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const updated = [...prev.plotList];
                              updated[pIndex].trellisType = val;
                              return { ...prev, plotList: updated };
                            });
                          }}
                          placeholder="เช่น มีค้างไม้ไผ่ / ไม่มี"
                          className="w-full p-1.5 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          <i className="fa-solid fa-notes-medical text-green-600" /> บันทึกการดูแลจัดการแปลงพิเศษ
                        </label>
                        <input
                          type="text"
                          value={plot.managementNotes}
                          onChange={(e) => {
                            const val = e.target.value;
                            setData((prev) => {
                              const updated = [...prev.plotList];
                              updated[pIndex].managementNotes = val;
                              return { ...prev, plotList: updated };
                            });
                          }}
                          placeholder="เช่น ฉีดพ่นจุลินทรีย์สัปดาห์ละครั้ง"
                          className="w-full p-1.5 border rounded"
                        />
                      </div>
                    </div>

                    {/* Crops Table inside Plot */}
                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                      <div className="bg-stone-100 px-3 py-2 border-b border-stone-200 flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                          <i className="fa-solid fa-list-check text-green-700" /> รายการพืชที่ลงปลูกใน {plot.name || `แปลงที่ ${pIndex + 1}`}
                        </span>
                        <span className="text-[11px] text-stone-500">รวม {plot.crops?.length || 0} ชนิด</span>
                      </div>

                      {(!plot.crops || plot.crops.length === 0) ? (
                        <div className="p-4 text-center text-xs text-stone-400">
                          ยังไม่มีรายการพืชในแปลงนี้ คลิก &quot;เพิ่มพืชในแปลงนี้&quot; เพื่อลงบันทึก
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-stone-50 text-stone-700 border-b">
                                <th className="p-2 w-32">ชนิดพืช / พันธุ์</th>
                                <th className="p-2 w-28">วันที่ปลูก</th>
                                <th className="p-2 w-28">กำหนดเก็บเกี่ยว</th>
                                <th className="p-2 w-28">จำนวน / ระยะปลูก</th>
                                <th className="p-2 w-28">แหล่งพันธุ์</th>
                                <th className="p-2 w-28">สถานะพืช</th>
                                <th className="p-2 w-10 text-center">ลบ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                              {plot.crops.map((crop, cIndex) => (
                                <tr key={cIndex} className="hover:bg-lime-50/40">
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={crop.name}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev) => {
                                          const updated = [...prev.plotList];
                                          updated[pIndex].crops[cIndex].name = val;
                                          return { ...prev, plotList: updated };
                                        });
                                      }}
                                      placeholder="เช่น ผักคะน้าฮ่องกง"
                                      className="w-full p-1 border rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="date"
                                      value={crop.plantDate}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev) => {
                                          const updated = [...prev.plotList];
                                          updated[pIndex].crops[cIndex].plantDate = val;
                                          return { ...prev, plotList: updated };
                                        });
                                      }}
                                      className="w-full p-1 border rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="date"
                                      value={crop.harvestDate}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev) => {
                                          const updated = [...prev.plotList];
                                          updated[pIndex].crops[cIndex].harvestDate = val;
                                          return { ...prev, plotList: updated };
                                        });
                                      }}
                                      className="w-full p-1 border rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={crop.spacing}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev) => {
                                          const updated = [...prev.plotList];
                                          updated[pIndex].crops[cIndex].spacing = val;
                                          return { ...prev, plotList: updated };
                                        });
                                      }}
                                      placeholder="200 ต้น (20x20ซม.)"
                                      className="w-full p-1 border rounded"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={crop.seedSource}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev) => {
                                          const updated = [...prev.plotList];
                                          updated[pIndex].crops[cIndex].seedSource = val;
                                          return { ...prev, plotList: updated };
                                        });
                                      }}
                                      className="w-full p-1 border rounded"
                                    >
                                      <option value="เก็บเมล็ดเอง">เก็บเมล็ดเอง</option>
                                      <option value="ซื้อจากร้าน">ซื้อจากร้าน</option>
                                      <option value="แจก/เครือข่าย">แจก/เครือข่าย</option>
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={crop.status}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setData((prev) => {
                                          const updated = [...prev.plotList];
                                          updated[pIndex].crops[cIndex].status = val;
                                          return { ...prev, plotList: updated };
                                        });
                                      }}
                                      className="w-full p-1 border rounded font-medium"
                                    >
                                      <option value="กำลังเติบโต">🌱 กำลังเติบโต</option>
                                      <option value="เก็บเกี่ยวแล้ว">🧺 เก็บเกี่ยวแล้ว</option>
                                      <option value="พักแปลง">💤 พักแปลง</option>
                                    </select>
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => {
                                        setData((prev) => {
                                          const updated = [...prev.plotList];
                                          updated[pIndex].crops.splice(cIndex, 1);
                                          return { ...prev, plotList: updated };
                                        });
                                      }}
                                      className="text-rose-500 hover:text-rose-700 p-1"
                                    >
                                      <i className="fa-solid fa-xmark" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: FARM ACTIVITY LOGS */}
        {currentTab === 'activity' && (
          <div className="space-y-6">
            {/* Section 4: Soil Preparation */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <i className="fa-solid fa-shovels text-amber-700" /> 4. บันทึกการเตรียมดินและการปรับปรุงบำรุงดิน
                  </h3>
                  <p className="text-xs text-stone-500">เน้นการพึ่งพาตนเองและใช้วัสดุในท้องถิ่นเพื่อลดต้นทุน</p>
                </div>
                <button
                  onClick={addSoilLog}
                  className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <i className="fa-solid fa-plus" /> เพิ่มรายการเตรียมดิน
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b">
                      <th className="p-2.5 w-28">วันที่</th>
                      <th className="p-2.5 w-32">แปลง</th>
                      <th className="p-2.5">กิจกรรม (ไถ/พรวน/หว่านปุ๋ยพืชสด)</th>
                      <th className="p-2.5">วัสดุ/ปุ๋ยที่ใช้</th>
                      <th className="p-2.5 w-24">ปริมาณ</th>
                      <th className="p-2.5 w-28">แหล่งที่มา</th>
                      <th className="p-2.5 w-28">ต้นทุน (บาท)</th>
                      <th className="p-2.5 w-32">รูปถ่ายกิจกรรม</th>
                      <th className="p-2.5 w-10 text-center no-print">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {data.soilLogs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-lime-50/50">
                        <td className="p-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs[idx].date = val;
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.plot}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs[idx].plot = val;
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            {data.plotList.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                            <option value="แปลงรวม/ทั้งหมด">แปลงรวม/ทั้งหมด</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.activity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs[idx].activity = val;
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            placeholder="หมักดินด้วยน้ำหมักชีวภาพ"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.materials}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs[idx].materials = val;
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            placeholder="ปุ๋ยคอก + เศษใบไม้"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs[idx].amount = val;
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            placeholder="20 กก."
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.source}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs[idx].source = val;
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            <option value="ทำเอง">ทำเอง</option>
                            <option value="ซื้อ">ซื้อ</option>
                            <option value="แบ่งปัน/แจกฟรี">แบ่งปัน/แจกฟรี</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.cost || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs[idx].cost = val;
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            placeholder="0"
                            className="w-full p-1.5 border rounded text-right"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {item.photo && (
                              <div className="relative group w-10 h-10 border rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={item.photo}
                                  alt="กิจกรรม"
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => onOpenImageModal(item.photo!)}
                                />
                                <button
                                  onClick={() => {
                                    setData((prev) => {
                                      const logs = [...prev.soilLogs];
                                      logs[idx].photo = null;
                                      return { ...prev, soilLogs: logs };
                                    });
                                  }}
                                  className="absolute top-0 right-0 bg-rose-600 text-white w-4 h-4 rounded-bl text-[9px] flex items-center justify-center no-print"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            <label className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded border text-[11px] cursor-pointer flex items-center gap-1 no-print">
                              <i className="fa-solid fa-camera text-green-600" />
                              {!item.photo && <span>แนบรูป</span>}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    attachPhoto(file, (photoUrl) => {
                                      setData((prev) => {
                                        const logs = [...prev.soilLogs];
                                        logs[idx].photo = photoUrl;
                                        return { ...prev, soilLogs: logs };
                                      });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="p-2 text-center no-print">
                          <button
                            onClick={() => {
                              setData((prev) => {
                                const logs = [...prev.soilLogs];
                                logs.splice(idx, 1);
                                return { ...prev, soilLogs: logs };
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5: Water Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <i className="fa-solid fa-droplet text-blue-600" /> 5. บันทึกการให้น้ำและการจัดการความชื้น
                  </h3>
                  <p className="text-xs text-stone-500">บันทึกระบบให้น้ำ วิธีการ และช่วงเวลา</p>
                </div>
                <button
                  onClick={addWaterLog}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <i className="fa-solid fa-plus" /> เพิ่มบันทึกให้น้ำ
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b">
                      <th className="p-2.5 w-28">วันที่</th>
                      <th className="p-2.5 w-32">แปลง</th>
                      <th className="p-2.5">วิธีให้น้ำ (ฝน/รดมือ/ระบบน้ำหยด)</th>
                      <th className="p-2.5">ปริมาณ / ระยะเวลา</th>
                      <th className="p-2.5">หมายเหตุ</th>
                      <th className="p-2.5 w-10 text-center no-print">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {data.waterLogs.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.waterLogs];
                                logs[idx].date = val;
                                return { ...prev, waterLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.plot}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.waterLogs];
                                logs[idx].plot = val;
                                return { ...prev, waterLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            {data.plotList.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                            <option value="ทุกแปลง">ทุกแปลง</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={item.method}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.waterLogs];
                                logs[idx].method = val;
                                return { ...prev, waterLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            <option value="รดด้วยสายยาง/ฝักบัว">รดด้วยสายยาง/ฝักบัว</option>
                            <option value="ระบบสเปรย์/มินิสปริงเกลอร์">ระบบสเปรย์/มินิสปริงเกลอร์</option>
                            <option value="ระบบน้ำหยด">ระบบน้ำหยด</option>
                            <option value="น้ำฝนธรรมชาติ">น้ำฝนธรรมชาติ</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.waterLogs];
                                logs[idx].duration = val;
                                return { ...prev, waterLogs: logs };
                              });
                            }}
                            placeholder="เช่น 15 นาที วันละ 2 ครั้ง"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.waterLogs];
                                logs[idx].notes = val;
                                return { ...prev, waterLogs: logs };
                              });
                            }}
                            placeholder="ใช้น้ำหมักชีวภาพผสมรด"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2 text-center no-print">
                          <button
                            onClick={() => {
                              setData((prev) => {
                                const logs = [...prev.waterLogs];
                                logs.splice(idx, 1);
                                return { ...prev, waterLogs: logs };
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 6: Fertilizer Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <i className="fa-solid fa-flask text-emerald-700" /> 6. บันทึกการใช้ปุ๋ยและสารปรับปรุงดิน
                  </h3>
                  <p className="text-xs text-stone-500">ปุ๋ยคอก / ปุ๋ยหมัก / น้ำหมักชีวภาพ / จุลินทรีย์สังเคราะห์แสง</p>
                </div>
                <button
                  onClick={addFertilizerLog}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <i className="fa-solid fa-plus" /> เพิ่มบันทึกใส่ปุ๋ย
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b">
                      <th className="p-2.5 w-28">วันที่</th>
                      <th className="p-2.5 w-32">แปลง</th>
                      <th className="p-2.5">ประเภทปุ๋ย / ชีวภัณฑ์</th>
                      <th className="p-2.5 w-24">ปริมาณ</th>
                      <th className="p-2.5">อัตราส่วนผสม</th>
                      <th className="p-2.5 w-28">แหล่งที่มา</th>
                      <th className="p-2.5 w-32">รูปถ่ายชีวภัณฑ์</th>
                      <th className="p-2.5 w-10 text-center no-print">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {data.fertilizerLogs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-lime-50/50">
                        <td className="p-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.fertilizerLogs];
                                logs[idx].date = val;
                                return { ...prev, fertilizerLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.plot}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.fertilizerLogs];
                                logs[idx].plot = val;
                                return { ...prev, fertilizerLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            {data.plotList.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                            <option value="ทุกแปลง">ทุกแปลง</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.fertilizerLogs];
                                logs[idx].type = val;
                                return { ...prev, fertilizerLogs: logs };
                              });
                            }}
                            placeholder="ปุ๋ยหมัก / จุลินทรีย์สังเคราะห์แสง"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.amount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.fertilizerLogs];
                                logs[idx].amount = val;
                                return { ...prev, fertilizerLogs: logs };
                              });
                            }}
                            placeholder="5 กิโลกรัม"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.ratio}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.fertilizerLogs];
                                logs[idx].ratio = val;
                                return { ...prev, fertilizerLogs: logs };
                              });
                            }}
                            placeholder="20 ซีซี ต่อน้ำ 20 ลิตร"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.source}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.fertilizerLogs];
                                logs[idx].source = val;
                                return { ...prev, fertilizerLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            <option value="หมักทำเอง">หมักทำเอง</option>
                            <option value="ซื้อ">ซื้อ</option>
                            <option value="ได้รับสนับสนุน">ได้รับสนับสนุน</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {item.photo && (
                              <div className="relative group w-10 h-10 border rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={item.photo}
                                  alt="ปุ๋ย"
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => onOpenImageModal(item.photo!)}
                                />
                                <button
                                  onClick={() => {
                                    setData((prev) => {
                                      const logs = [...prev.fertilizerLogs];
                                      logs[idx].photo = null;
                                      return { ...prev, fertilizerLogs: logs };
                                    });
                                  }}
                                  className="absolute top-0 right-0 bg-rose-600 text-white w-4 h-4 rounded-bl text-[9px] flex items-center justify-center no-print"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            <label className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded border text-[11px] cursor-pointer flex items-center gap-1 no-print">
                              <i className="fa-solid fa-camera text-green-600" />
                              {!item.photo && <span>แนบรูป</span>}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    attachPhoto(file, (photoUrl) => {
                                      setData((prev) => {
                                        const logs = [...prev.fertilizerLogs];
                                        logs[idx].photo = photoUrl;
                                        return { ...prev, fertilizerLogs: logs };
                                      });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="p-2 text-center no-print">
                          <button
                            onClick={() => {
                              setData((prev) => {
                                const logs = [...prev.fertilizerLogs];
                                logs.splice(idx, 1);
                                return { ...prev, fertilizerLogs: logs };
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 7: IPM Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <i className="fa-solid fa-bug text-rose-600" /> 7. บันทึกการจัดการศัตรูพืชแบบผสมผสาน (IPM)
                  </h3>
                  <p className="text-xs text-stone-500">เน้นการสังเกตและใช้วิธีธรรมชาติ/สารสกัดสมุนไพร เพื่อรักษาสมดุลระบบนิเวศ</p>
                </div>
                <button
                  onClick={addIpmLog}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <i className="fa-solid fa-plus" /> เพิ่มบันทึก IPM
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b">
                      <th className="p-2.5 w-28">วันที่</th>
                      <th className="p-2.5 w-32">แปลง</th>
                      <th className="p-2.5">ศัตรูพืช / โรคที่พบ</th>
                      <th className="p-2.5 w-24">ระดับระบาด</th>
                      <th className="p-2.5">วิธีจัดการ</th>
                      <th className="p-2.5">วัสดุที่ใช้</th>
                      <th className="p-2.5 w-24">ประสิทธิผล</th>
                      <th className="p-2.5 w-32">รูปภาพศัตรูพืช</th>
                      <th className="p-2.5 w-10 text-center no-print">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {data.ipmLogs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-lime-50/50">
                        <td className="p-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs[idx].date = val;
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.plot}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs[idx].plot = val;
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            {data.plotList.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                            <option value="ทุกแปลง">ทุกแปลง</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.pestFound}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs[idx].pestFound = val;
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            placeholder="หนอนใยผัก / เพลี้ยอ่อน"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.severity}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs[idx].severity = val;
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            <option value="น้อย">น้อย</option>
                            <option value="ปานกลาง">ปานกลาง</option>
                            <option value="มาก">มาก</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.method}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs[idx].method = val;
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            placeholder="จับออก / ฉีดน้ำหมักสะเดา"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.materials}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs[idx].materials = val;
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            placeholder="น้ำหมักสะเดา"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.effectiveness}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs[idx].effectiveness = val;
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            <option value="ดีมาก">ดีมาก</option>
                            <option value="พอใช้">พอใช้</option>
                            <option value="ไม่ได้ผล">ไม่ได้ผล</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {item.photo && (
                              <div className="relative group w-10 h-10 border rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={item.photo}
                                  alt="ศัตรูพืช"
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => onOpenImageModal(item.photo!)}
                                />
                                <button
                                  onClick={() => {
                                    setData((prev) => {
                                      const logs = [...prev.ipmLogs];
                                      logs[idx].photo = null;
                                      return { ...prev, ipmLogs: logs };
                                    });
                                  }}
                                  className="absolute top-0 right-0 bg-rose-600 text-white w-4 h-4 rounded-bl text-[9px] flex items-center justify-center no-print"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            <label className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded border text-[11px] cursor-pointer flex items-center gap-1 no-print">
                              <i className="fa-solid fa-camera text-green-600" />
                              {!item.photo && <span>แนบรูป</span>}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    attachPhoto(file, (photoUrl) => {
                                      setData((prev) => {
                                        const logs = [...prev.ipmLogs];
                                        logs[idx].photo = photoUrl;
                                        return { ...prev, ipmLogs: logs };
                                      });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="p-2 text-center no-print">
                          <button
                            onClick={() => {
                              setData((prev) => {
                                const logs = [...prev.ipmLogs];
                                logs.splice(idx, 1);
                                return { ...prev, ipmLogs: logs };
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HARVEST & UTILIZATION */}
        {currentTab === 'harvest' && (
          <div className="space-y-6">
            {/* Section 8: Harvest Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <i className="fa-solid fa-basket-shopping text-emerald-600" /> 8. บันทึกการเก็บเกี่ยวและผลผลิต
                  </h3>
                  <p className="text-xs text-stone-500">บันทึกปริมาณผลผลิต คุณภาพ และการจัดการหลังเก็บเกี่ยว</p>
                </div>
                <button
                  onClick={addHarvestLog}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <i className="fa-solid fa-plus" /> เพิ่มรายการเก็บเกี่ยว
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b">
                      <th className="p-2.5 w-28">วันที่เก็บเกี่ยว</th>
                      <th className="p-2.5 w-32">แปลง</th>
                      <th className="p-2.5">ชนิดผลผลิต</th>
                      <th className="p-2.5 w-24">ผลผลิต (กก.)</th>
                      <th className="p-2.5 w-28">คุณภาพ / เกรด</th>
                      <th className="p-2.5">การจัดการหลังเก็บเกี่ยว</th>
                      <th className="p-2.5">หมายเหตุ</th>
                      <th className="p-2.5 w-28">รูปภาพผลผลิต</th>
                      <th className="p-2.5 w-10 text-center no-print">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {data.harvestLogs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-lime-50/50">
                        <td className="p-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs[idx].date = val;
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.plot}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs[idx].plot = val;
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            {data.plotList.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.crop}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs[idx].crop = val;
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            placeholder="ผักคะน้า organic"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={item.weightKg || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs[idx].weightKg = val;
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            placeholder="0.0"
                            className="w-full p-1.5 border rounded text-right"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.grade}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs[idx].grade = val;
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          >
                            <option value="เกรด A (สวยงาม)">เกรด A (สวยงาม)</option>
                            <option value="เกรด B (ปานกลาง)">เกรด B (ปานกลาง)</option>
                            <option value="เกรด C (มีตำหนิเล็กน้อย)">เกรด C (มีตำหนิ)</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.postHarvest}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs[idx].postHarvest = val;
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            placeholder="ล้างสะอาด / ตัดแต่ง"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs[idx].notes = val;
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            placeholder="อากาศแจ่มใส ผักสดกรอบ"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            {item.photo && (
                              <div className="relative group w-10 h-10 border rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={item.photo}
                                  alt="ผลผลิต"
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => onOpenImageModal(item.photo!)}
                                />
                                <button
                                  onClick={() => {
                                    setData((prev) => {
                                      const logs = [...prev.harvestLogs];
                                      logs[idx].photo = null;
                                      return { ...prev, harvestLogs: logs };
                                    });
                                  }}
                                  className="absolute top-0 right-0 bg-rose-600 text-white w-4 h-4 rounded-bl text-[9px] flex items-center justify-center no-print"
                                >
                                  ×
                                </button>
                              </div>
                            )}
                            <label className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded border text-[11px] cursor-pointer flex items-center gap-1 no-print">
                              <i className="fa-solid fa-camera text-green-600" />
                              {!item.photo && <span>แนบรูป</span>}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    attachPhoto(file, (photoUrl) => {
                                      setData((prev) => {
                                        const logs = [...prev.harvestLogs];
                                        logs[idx].photo = photoUrl;
                                        return { ...prev, harvestLogs: logs };
                                      });
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </td>
                        <td className="p-2 text-center no-print">
                          <button
                            onClick={() => {
                              setData((prev) => {
                                const logs = [...prev.harvestLogs];
                                logs.splice(idx, 1);
                                return { ...prev, harvestLogs: logs };
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 10: Utilization Logs */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <i className="fa-solid fa-hand-holding-heart text-amber-600" /> 10. บันทึกการใช้บริโภค / แบ่งปัน / ตลาดและการจำหน่าย
                  </h3>
                  <p className="text-xs text-stone-500">เชื่อมโยงการผลิตกับการพึ่งตนเอง สร้างสุขภาวะ และรายได้</p>
                </div>
                <button
                  onClick={addUtilizationLog}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 shadow-sm"
                >
                  <i className="fa-solid fa-plus" /> เพิ่มบันทึกการใช้ประโยชน์
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 text-stone-700 border-b">
                      <th className="p-2.5 w-28">วันที่</th>
                      <th className="p-2.5">ผลผลิต</th>
                      <th className="p-2.5 w-20">รวม (กก.)</th>
                      <th className="p-2.5 w-24">กินในบ้าน (กก.)</th>
                      <th className="p-2.5 w-24">แจก/แบ่งปัน (กก.)</th>
                      <th className="p-2.5 w-24">ขาย (กก.)</th>
                      <th className="p-2.5 w-24">ราคา/หน่วย</th>
                      <th className="p-2.5 w-28">รายได้รวม (บาท)</th>
                      <th className="p-2.5">ช่องทางจำหน่าย / ผู้รับแบ่งปัน</th>
                      <th className="p-2.5 w-10 text-center no-print">ลบ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {data.utilizationLogs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-lime-50/50">
                        <td className="p-2">
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].date = val;
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.crop}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].crop = val;
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            placeholder="ผักคะน้า"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={item.totalKg || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].totalKg = val;
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            className="w-full p-1.5 border rounded text-right bg-stone-50 font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={item.consumeKg || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].consumeKg = val;
                                logs[idx].totalKg = val + (logs[idx].shareKg || 0) + (logs[idx].sellKg || 0);
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            placeholder="0"
                            className="w-full p-1.5 border rounded text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={item.shareKg || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].shareKg = val;
                                logs[idx].totalKg = (logs[idx].consumeKg || 0) + val + (logs[idx].sellKg || 0);
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            placeholder="0"
                            className="w-full p-1.5 border rounded text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={item.sellKg || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].sellKg = val;
                                logs[idx].totalKg = (logs[idx].consumeKg || 0) + (logs[idx].shareKg || 0) + val;
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            placeholder="0"
                            className="w-full p-1.5 border rounded text-right"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={item.pricePerUnit || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].pricePerUnit = val;
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            placeholder="0"
                            className="w-full p-1.5 border rounded text-right"
                          />
                        </td>
                        <td className="p-2">
                          <div className="p-1.5 bg-amber-50 text-amber-900 border rounded font-bold text-right">
                            {((item.sellKg || 0) * (item.pricePerUnit || 0)).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.channel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs[idx].channel = val;
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            placeholder="ตลาดเขียว / เพื่อนบ้าน"
                            className="w-full p-1.5 border rounded"
                          />
                        </td>
                        <td className="p-2 text-center no-print">
                          <button
                            onClick={() => {
                              setData((prev) => {
                                const logs = [...prev.utilizationLogs];
                                logs.splice(idx, 1);
                                return { ...prev, utilizationLogs: logs };
                              });
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REFLECTIONS */}
        {currentTab === 'reflections' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-stone-800 border-b pb-3 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-calculator text-indigo-700" /> 9. การวิเคราะห์ต้นทุน-ผลตอบแทน และการพึ่งตนเอง
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-stone-800">
                  <span className="text-xs font-bold text-rose-700 uppercase">ต้นทุนรวมทั้งหมด</span>
                  <div className="text-2xl font-bold text-rose-800 mt-1">
                    {totalExpenses.toLocaleString()} <span className="text-xs font-normal">บาท</span>
                  </div>
                  <p className="text-[11px] text-rose-600 mt-1">(ปัจจัยการผลิต + ปุ๋ย + วัสดุอุปกรณ์)</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-stone-800">
                  <span className="text-xs font-bold text-emerald-700 uppercase">รายได้รวมจากการจำหน่าย</span>
                  <div className="text-2xl font-bold text-emerald-800 mt-1">
                    {totalIncome.toLocaleString()} <span className="text-xs font-normal">บาท</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 mt-1">(รายได้รวมจากการจำหน่ายผลผลิต)</p>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    netProfit >= 0 ? 'bg-green-50 border-green-300 text-green-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  <span className="text-xs font-bold uppercase">ผลตอบแทนสุทธิ (กำไร/ขาดทุน)</span>
                  <div className="text-2xl font-bold mt-1">
                    {netProfit >= 0 ? '+' : ''}
                    {netProfit.toLocaleString()} <span className="text-xs font-normal">บาท</span>
                  </div>
                  <p className={`text-[11px] mt-1 ${netProfit >= 0 ? 'text-green-700' : 'text-amber-700'}`}>
                    {netProfit >= 0 ? 'มีกำไรสุทธิ' : 'ขาดทุนเชิงเงินสด (ดูคุณค่าประหยัดค่าอาหารเพิ่มเติม)'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-stone-800 text-sm">มูลค่าการประหยัดค่าอาหารในครัวเรือน (พึ่งตนเอง)</h4>
                    <p className="text-xs text-stone-500">คำนวณจากผลผลิตที่ปลูกกินเอง × ราคาตลาดเฉลี่ย (40 บาท/กก.)</p>
                  </div>
                  <div className="text-xl font-bold text-green-700">
                    {estimatedSelfRelianceSavings.toLocaleString()} บาท
                  </div>
                </div>
              </div>

              {/* Multidimensional Reflections */}
              <h4 className="font-bold text-stone-800 mb-3 border-b pb-2 flex items-center gap-2 text-sm">
                <i className="fa-solid fa-shapes text-teal-600" /> บันทึกถอดบทเรียนรายมิติ 6 เดือน (Multidimensional Reflection)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-sm space-y-2">
                  <label className="font-bold text-green-800 flex items-center gap-2">
                    <i className="fa-solid fa-heart-pulse text-rose-500" /> 1. มิติด้านสุขภาพ & สุขภาวะ (Health & Physical)
                  </label>
                  <textarea
                    rows={3}
                    value={data.reflection.healthDimension}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        reflection: { ...prev.reflection, healthDimension: e.target.value }
                      }))
                    }
                    placeholder="ร่างกายแข็งแรงขึ้น ไม่สัมผัสสารเคมี อาหารปลอดภัย สุขภาพจิตแจ่มใส..."
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-sm space-y-2">
                  <label className="font-bold text-green-800 flex items-center gap-2">
                    <i className="fa-solid fa-coins text-amber-500" /> 2. มิติด้านเศรษฐกิจ & การลดรายจ่าย (Economic)
                  </label>
                  <textarea
                    rows={3}
                    value={data.reflection.economicDimension}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        reflection: { ...prev.reflection, economicDimension: e.target.value }
                      }))
                    }
                    placeholder="ประหยัดค่าซื้อผักเข้าบ้านวันละ 50-100 บาท มีรายได้เสริมจากการขาย..."
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-sm space-y-2">
                  <label className="font-bold text-green-800 flex items-center gap-2">
                    <i className="fa-solid fa-people-hold text-indigo-500" /> 3. มิติด้านสังคม & การแบ่งปัน (Social & Community)
                  </label>
                  <textarea
                    rows={3}
                    value={data.reflection.socialDimension}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        reflection: { ...prev.reflection, socialDimension: e.target.value }
                      }))
                    }
                    placeholder="ได้แจกผักให้เพื่อนบ้าน สร้างสัมพันธภาพ เกิดการแลกเปลี่ยนเมล็ดพันธุ์..."
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white shadow-sm space-y-2">
                  <label className="font-bold text-green-800 flex items-center gap-2">
                    <i className="fa-solid fa-tree text-emerald-600" /> 4. มิติด้านนิเวศ & สิ่งแวดล้อม (Ecology & Environment)
                  </label>
                  <textarea
                    rows={3}
                    value={data.reflection.environmentDimension}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        reflection: { ...prev.reflection, environmentDimension: e.target.value }
                      }))
                    }
                    placeholder="ดินร่วนซุย มีไส้เดือนเพิ่มขึ้น แมลงศัตรูพืชลดลงด้วยระบบนิเวศสมดุล..."
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    บทเรียนสำคัญที่ได้รับในเทอมนี้ (ข้อดี / อุปสรรค / วิธีแก้ไข)
                  </label>
                  <textarea
                    rows={3}
                    value={data.reflection.lessonsLearned}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        reflection: { ...prev.reflection, lessonsLearned: e.target.value }
                      }))
                    }
                    placeholder="บทเรียนที่สำคัญจากการลงมือทำแปลงเกษตรในระยะเวลา 6 เดือน..."
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    แผนการปรับปรุงการปลูกและการพัฒนาตนเองในอนาคต
                  </label>
                  <textarea
                    rows={3}
                    value={data.reflection.futurePlan}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        reflection: { ...prev.reflection, futurePlan: e.target.value }
                      }))
                    }
                    placeholder="แผนการขยายแปลง ทำระบบน้ำอัตโนมัติ หมักปุ๋ยสูตรใหม่..."
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ANALYTICS & STATS */}
        {currentTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 sm:p-6">
              <h3 className="text-lg font-bold text-stone-800 border-b pb-3 mb-6 flex items-center gap-2">
                <i className="fa-solid fa-chart-line text-teal-600" /> สรุปผลภาพรวม & สถิติฟาร์ม
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-sm">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <i className="fa-solid fa-weight-hanging text-emerald-600 text-2xl mb-1" />
                  <div className="text-xs text-stone-600 font-medium">ผลผลิตรวมทั้งหมด</div>
                  <div className="text-xl font-bold text-emerald-900 mt-1">
                    {totalHarvestWeight.toFixed(1)} <span className="text-xs font-normal">กก.</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <i className="fa-solid fa-utensils text-amber-600 text-2xl mb-1" />
                  <div className="text-xs text-stone-600 font-medium">บริโภคในบ้าน</div>
                  <div className="text-xl font-bold text-amber-900 mt-1">
                    {totalConsumedWeight.toFixed(1)} <span className="text-xs font-normal">กก.</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <i className="fa-solid fa-heart text-rose-600 text-2xl mb-1" />
                  <div className="text-xs text-stone-600 font-medium">แบ่งปันเพื่อนบ้าน</div>
                  <div className="text-xl font-bold text-rose-900 mt-1">
                    {totalSharedWeight.toFixed(1)} <span className="text-xs font-normal">กก.</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                  <i className="fa-solid fa-sack-dollar text-blue-600 text-2xl mb-1" />
                  <div className="text-xs text-stone-600 font-medium">รายได้จากการจำหน่าย</div>
                  <div className="text-xl font-bold text-blue-900 mt-1">
                    {totalIncome.toLocaleString()} <span className="text-xs font-normal">บาท</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <h4 className="font-bold text-stone-800 text-xs text-center mb-3">
                    สัดส่วนการนำผลผลิตไปใช้ประโยชน์ (กก.)
                  </h4>
                  <div className="h-64 flex justify-center items-center">
                    <canvas ref={utilChartRef} />
                  </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <h4 className="font-bold text-stone-800 text-xs text-center mb-3">
                    เปรียบเทียบ รายได้ vs ต้นทุน (บาท)
                  </h4>
                  <div className="h-64 flex justify-center items-center">
                    <canvas ref={finChartRef} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: FULL FORM PRINT / EXPORT PREVIEW */}
        {currentTab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-md border border-stone-300 p-6 sm:p-10 max-w-5xl mx-auto" id="printable-doc-farm">
              <div className="text-center border-b-2 border-green-800 pb-6 mb-6">
                <div className="text-xs text-stone-500 mb-1">
                  หลักสูตรการเรียนรู้กสิกรรมไร้สารพิษและอาหาร เพื่อเศรษฐกิจและสุขภาวะพึ่งตนตามวิถีเศรษฐกิจพอเพียง
                </div>
                <h1 className="text-2xl font-bold text-green-900">แบบบันทึกบัญชีฟาร์ม (Farm Account Record)</h1>
                <p className="text-sm text-stone-700 mt-1">บันทึกข้อมูลการทำเกษตรเพื่อการเรียนรู้ พัฒนา และพึ่งตนอย่างยั่งยืน</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
                <div>
                  <strong>ชื่อ-สกุล:</strong> {data.profile.name || '-'}
                </div>
                <div>
                  <strong>เลขประจำตัว:</strong> {data.profile.citizenId || '-'}
                </div>
                <div>
                  <strong>วันที่เริ่มบันทึก:</strong> {data.profile.startDate || '-'}
                </div>
                <div>
                  <strong>ปีการปลูก (พ.ศ.):</strong> {data.profile.cropYear || '-'}
                </div>
                <div>
                  <strong>เบอร์โทรศัพท์ / Line:</strong> {data.profile.phone || '-'} / {data.profile.lineId || '-'}
                </div>
                <div className="col-span-2">
                  <strong>ที่อยู่แปลง:</strong> {data.profile.address || '-'}
                </div>
                <div className="col-span-2">
                  <strong>เป้าหมายแปลง:</strong>{' '}
                  {data.profile.goals.safe && <span>[✓ ปลอดภัย] </span>}
                  {data.profile.goals.household && <span>[✓ บริโภคในบ้าน] </span>}
                  {data.profile.goals.share && <span>[✓ แบ่งปัน] </span>}
                  {data.profile.goals.reduceCost && <span>[✓ ลดต้นทุน] </span>}
                  {data.profile.goals.sell && <span>[✓ จำหน่าย] </span>}
                </div>
              </div>

              {data.canvasDataUrl && (
                <div className="mb-8 text-center">
                  <h3 className="font-bold text-sm text-stone-800 mb-2 border-b pb-1 text-left">
                    3. แผนผังพื้นที่ปลูก (Farm Layout Plan)
                  </h3>
                  <img src={data.canvasDataUrl} alt="ผังแปลง" className="max-h-64 mx-auto border rounded-xl shadow-sm" />
                </div>
              )}

              {/* Plots & Crops Summary */}
              <div className="mb-8">
                <h3 className="font-bold text-sm text-stone-800 mb-2 border-b pb-1">
                  ทะเบียนแปลงเกษตรและการจัดการแปลง
                </h3>
                <div className="space-y-3">
                  {data.plotList.map((p, i) => (
                    <div key={i} className="border border-stone-300 rounded-lg p-3 text-xs bg-stone-50/50">
                      <div className="font-bold text-green-900 border-b pb-1 mb-2 flex justify-between">
                        <span>
                          {p.name} ({p.areaType} - {p.size})
                        </span>
                        <span className="text-stone-600 font-normal">สถานะ: {p.soilStatus}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] mb-2 text-stone-700">
                        <div>
                          <strong>วัสดุคลุมดิน:</strong> {p.mulchType || '-'}
                        </div>
                        <div>
                          <strong>นั่งร้าน/ค้าง:</strong> {p.trellisType || '-'}
                        </div>
                        <div>
                          <strong>การจัดการแปลง:</strong> {p.managementNotes || '-'}
                        </div>
                      </div>
                      <table className="w-full text-left border border-stone-300 border-collapse bg-white">
                        <thead className="bg-stone-100">
                          <tr>
                            <th className="border border-stone-300 p-1">ชนิดพืช</th>
                            <th className="border border-stone-300 p-1">วันปลูก</th>
                            <th className="border border-stone-300 p-1">กำหนดเก็บเกี่ยว</th>
                            <th className="border border-stone-300 p-1">จำนวน/ระยะ</th>
                            <th className="border border-stone-300 p-1">สถานะ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.crops?.map((c, ci) => (
                            <tr key={ci}>
                              <td className="border border-stone-300 p-1 font-semibold">{c.name || '-'}</td>
                              <td className="border border-stone-300 p-1">{c.plantDate || '-'}</td>
                              <td className="border border-stone-300 p-1">{c.harvestDate || '-'}</td>
                              <td className="border border-stone-300 p-1">{c.spacing || '-'}</td>
                              <td className="border border-stone-300 p-1">{c.status || '-'}</td>
                            </tr>
                          ))}
                          {(!p.crops || p.crops.length === 0) && (
                            <tr>
                              <td colSpan={5} className="border border-stone-300 p-1 text-center text-stone-400">
                                ไม่มีรายการพืชในแปลงนี้
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soil Prep Preview */}
              <div className="mb-8">
                <h3 className="font-bold text-sm text-stone-800 mb-2 border-b pb-1">
                  4. บันทึกการเตรียมดินและการปรับปรุงบำรุงดิน
                </h3>
                <table className="w-full text-left text-xs border border-stone-300 border-collapse">
                  <thead className="bg-stone-100">
                    <tr>
                      <th className="border border-stone-300 p-2">วันที่</th>
                      <th className="border border-stone-300 p-2">แปลง</th>
                      <th className="border border-stone-300 p-2">กิจกรรม</th>
                      <th className="border border-stone-300 p-2">วัสดุ/ปุ๋ย</th>
                      <th className="border border-stone-300 p-2">ปริมาณ</th>
                      <th className="border border-stone-300 p-2">แหล่งที่มา</th>
                      <th className="border border-stone-300 p-2 text-right">ต้นทุน (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.soilLogs.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-stone-300 p-2">{item.date || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.plot || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.activity || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.materials || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.amount || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.source || '-'}</td>
                        <td className="border border-stone-300 p-2 text-right">
                          {(item.cost || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* IPM Preview */}
              <div className="mb-8">
                <h3 className="font-bold text-sm text-stone-800 mb-2 border-b pb-1">
                  7. บันทึกการจัดการศัตรูพืชแบบผสมผสาน (IPM)
                </h3>
                <table className="w-full text-left text-xs border border-stone-300 border-collapse">
                  <thead className="bg-stone-100">
                    <tr>
                      <th className="border border-stone-300 p-2">วันที่</th>
                      <th className="border border-stone-300 p-2">แปลง</th>
                      <th className="border border-stone-300 p-2">ศัตรูพืช/โรค</th>
                      <th className="border border-stone-300 p-2">ความระบาด</th>
                      <th className="border border-stone-300 p-2">วิธีจัดการ</th>
                      <th className="border border-stone-300 p-2">ประสิทธิผล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ipmLogs.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-stone-300 p-2">{item.date || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.plot || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.pestFound || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.severity || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.method || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.effectiveness || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Utilization Preview */}
              <div className="mb-8">
                <h3 className="font-bold text-sm text-stone-800 mb-2 border-b pb-1">
                  10. บันทึกการใช้ประโยชน์ผลผลิต / รายได้จากการจำหน่าย
                </h3>
                <table className="w-full text-left text-xs border border-stone-300 border-collapse">
                  <thead className="bg-stone-100">
                    <tr>
                      <th className="border border-stone-300 p-2">วันที่</th>
                      <th className="border border-stone-300 p-2">ผลผลิต</th>
                      <th className="border border-stone-300 p-2 text-right">รวม (กก.)</th>
                      <th className="border border-stone-300 p-2 text-right">กินเอง</th>
                      <th className="border border-stone-300 p-2 text-right">แจก</th>
                      <th className="border border-stone-300 p-2 text-right">ขาย</th>
                      <th className="border border-stone-300 p-2 text-right">รายได้ (บาท)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.utilizationLogs.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-stone-300 p-2">{item.date || '-'}</td>
                        <td className="border border-stone-300 p-2">{item.crop || '-'}</td>
                        <td className="border border-stone-300 p-2 text-right">{item.totalKg || 0}</td>
                        <td className="border border-stone-300 p-2 text-right">{item.consumeKg || 0}</td>
                        <td className="border border-stone-300 p-2 text-right">{item.shareKg || 0}</td>
                        <td className="border border-stone-300 p-2 text-right">{item.sellKg || 0}</td>
                        <td className="border border-stone-300 p-2 text-right">
                          {((item.sellKg || 0) * (item.pricePerUnit || 0)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reflection Preview */}
              <div className="border-t pt-4 text-xs space-y-2">
                <h3 className="font-bold text-sm text-stone-800 mb-2">9. บทเรียนและการถอดบทเรียน 6 เดือน</h3>
                <p>
                  <strong>มิติด้านสุขภาพ:</strong> {data.reflection.healthDimension || '-'}
                </p>
                <p>
                  <strong>มิติด้านเศรษฐกิจ:</strong> {data.reflection.economicDimension || '-'}
                </p>
                <p>
                  <strong>มิติด้านสังคม:</strong> {data.reflection.socialDimension || '-'}
                </p>
                <p>
                  <strong>มิติด้านสิ่งแวดล้อม:</strong> {data.reflection.environmentDimension || '-'}
                </p>
                <p>
                  <strong>บทเรียนสำคัญ:</strong> {data.reflection.lessonsLearned || '-'}
                </p>
                <p>
                  <strong>แผนการอนาคต:</strong> {data.reflection.futurePlan || '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <GoogleSheetsExportModal
        isOpen={showGoogleSheetModal}
        onClose={() => setShowGoogleSheetModal(false)}
        type="farm"
        farmData={data}
        onShowToast={onShowToast}
      />
    </div>
  );
};
