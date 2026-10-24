import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  googleSignIn,
  getAccessToken,
  logoutGoogle,
  initAuth,
  getCurrentUser
} from '../services/googleAuth';
import {
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
  appendToGoogleSheet
} from '../services/googleSheets';
import { FarmData } from '../types/farm';
import { HealthData } from '../types/health';

interface GoogleSheetsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'farm' | 'health';
  farmData?: FarmData;
  healthData?: HealthData;
  onShowToast: (msg: string, icon?: string) => void;
}

export const GoogleSheetsExportModal: React.FC<GoogleSheetsExportModalProps> = ({
  isOpen,
  onClose,
  type,
  farmData,
  healthData,
  onShowToast
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form State
  const storageKeySheetId = `last_google_sheet_id_${type}`;
  const defaultSheetTab = type === 'farm' ? 'บัญชีฟาร์ม_กสิกรรมไร้สารพิษ' : 'บัญชีสุขภาพ_ยา9เม็ด';
  const [sheetUrlOrId, setSheetUrlOrId] = useState(() => localStorage.getItem(storageKeySheetId) || '');
  const [sheetTabName, setSheetTabName] = useState(defaultSheetTab);

  const [datasetChoice, setDatasetChoice] = useState<'summary' | 'harvest' | 'utilization' | 'soil' | 'vitals' | 'indicators' | 'med9'>('summary');

  // Metadata verification
  const [isVerifying, setIsVerifying] = useState(false);
  const [sheetTitle, setSheetTitle] = useState<string | null>(null);
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Confirmation state (MANDATORY per Workspace guidelines)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessInfo, setExportSuccessInfo] = useState<{
    spreadsheetId: string;
    sheetName: string;
    rowsCount: number;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, accessToken) => {
        setCurrentUser(user);
        setToken(accessToken);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setToken(res.accessToken);
        onShowToast('เข้าสู่ระบบ Google สำเร็จ');
      }
    } catch (err: any) {
      onShowToast(err.message || 'เข้าสู่ระบบไม่สำเร็จ', 'fa-solid fa-triangle-exclamation text-rose-400');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setToken(null);
    onShowToast('ออกจากระบบ Google เรียบร้อยแล้ว');
  };

  const handleVerifySheet = async () => {
    const rawId = extractSpreadsheetId(sheetUrlOrId);
    if (!rawId) {
      setVerifyError('กรุณากรอกลิงก์หรือ Spreadsheet ID ของ Google Sheets');
      return;
    }
    setVerifyError(null);
    setIsVerifying(true);
    try {
      const meta = await fetchSpreadsheetMetadata(rawId);
      setSheetTitle(meta.title);
      setAvailableTabs(meta.sheetNames);
      localStorage.setItem(storageKeySheetId, sheetUrlOrId);
      onShowToast(`เชื่อมต่อชีต "${meta.title}" สำเร็จ!`);
    } catch (err: any) {
      setVerifyError(err.message || 'ไม่สามารถเข้าถึง Google Sheets ได้ กรุณาตรวจสอบสิทธิ์และการแชร์');
    } finally {
      setIsVerifying(false);
    }
  };

  // Generate payload rows based on user's choice
  const generatePayload = () => {
    const nowStr = new Date().toLocaleString('th-TH');

    if (type === 'farm' && farmData) {
      const citizenId = farmData.profile.citizenId || '-';
      const name = farmData.profile.name || '-';
      const totalExpenses = farmData.soilLogs.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
      const totalIncome = farmData.utilizationLogs.reduce(
        (sum, item) => sum + (Number(item.sellKg) || 0) * (Number(item.pricePerUnit) || 0),
        0
      );
      const netProfit = totalIncome - totalExpenses;
      const totalHarvestWeight = farmData.harvestLogs.reduce((sum, item) => sum + (Number(item.weightKg) || 0), 0);
      const totalConsumedWeight = farmData.utilizationLogs.reduce((sum, item) => sum + (Number(item.consumeKg) || 0), 0);
      const totalSharedWeight = farmData.utilizationLogs.reduce((sum, item) => sum + (Number(item.shareKg) || 0), 0);
      const totalSoldWeight = farmData.utilizationLogs.reduce((sum, item) => sum + (Number(item.sellKg) || 0), 0);
      const estimatedSavings = farmData.utilizationLogs.reduce((sum, item) => sum + (Number(item.consumeKg) || 0) * 40, 0);

      if (datasetChoice === 'summary') {
        const header = [
          'วันเวลาที่ส่งข้อมูล',
          'เลขประจำตัว',
          'ชื่อ-สกุล',
          'ปีการปลูก',
          'เบอร์โทร',
          'Line ID',
          'ที่อยู่แปลง',
          'พื้นที่รวม',
          'จำนวนแปลงปลูก',
          'ผลผลิตรวม (กก.)',
          'กินในบ้าน (กก.)',
          'แบ่งปัน (กก.)',
          'จำหน่าย (กก.)',
          'รายได้รวม (บาท)',
          'ต้นทุนรวม (บาท)',
          'กำไรสุทธิ (บาท)',
          'มูลค่าประหยัดอาหาร (บาท)',
          'บทเรียนสำคัญ'
        ];
        const row = [
          nowStr,
          citizenId,
          name,
          farmData.profile.cropYear || '-',
          farmData.profile.phone || '-',
          farmData.profile.lineId || '-',
          farmData.profile.address || '-',
          farmData.profile.areaType.totalSize || '-',
          farmData.plotList.length,
          totalHarvestWeight,
          totalConsumedWeight,
          totalSharedWeight,
          totalSoldWeight,
          totalIncome,
          totalExpenses,
          netProfit,
          estimatedSavings,
          farmData.reflection.lessonsLearned || '-'
        ];
        return { header, rows: [row], desc: `ข้อมูลสรุปบัญชีฟาร์ม (1 แถว)` };
      }

      if (datasetChoice === 'harvest') {
        const header = ['วันเวลาส่ง', 'เลขประจำตัว', 'ชื่อเกษตรกร', 'วันที่เก็บเกี่ยว', 'แปลง', 'ชนิดผลผลิต', 'น้ำหนัก (กก.)', 'เกรด', 'การจัดการหลังเก็บเกี่ยว', 'หมายเหตุ'];
        const rows = farmData.harvestLogs.map((h) => [
          nowStr,
          citizenId,
          name,
          h.date || '-',
          h.plot || '-',
          h.crop || '-',
          h.weightKg || 0,
          h.grade || '-',
          h.postHarvest || '-',
          h.notes || '-'
        ]);
        return { header, rows: rows.length ? rows : [[nowStr, citizenId, name, '-', '-', 'ยังไม่มีรายการ', 0, '-', '-', '-']], desc: `รายการเก็บเกี่ยวผลผลิต (${rows.length} แถว)` };
      }

      if (datasetChoice === 'utilization') {
        const header = ['วันเวลาส่ง', 'เลขประจำตัว', 'ชื่อเกษตรกร', 'วันที่', 'ผลผลิต', 'รวม (กก.)', 'กินในบ้าน (กก.)', 'แจก (กก.)', 'ขาย (กก.)', 'ราคา/หน่วย', 'รายได้รวม (บาท)', 'ช่องทางจำหน่าย'];
        const rows = farmData.utilizationLogs.map((u) => [
          nowStr,
          citizenId,
          name,
          u.date || '-',
          u.crop || '-',
          u.totalKg || 0,
          u.consumeKg || 0,
          u.shareKg || 0,
          u.sellKg || 0,
          u.pricePerUnit || 0,
          (u.sellKg || 0) * (u.pricePerUnit || 0),
          u.channel || '-'
        ]);
        return { header, rows: rows.length ? rows : [[nowStr, citizenId, name, '-', '-', 0, 0, 0, 0, 0, 0, '-']], desc: `รายการใช้ประโยชน์และจำหน่าย (${rows.length} แถว)` };
      }

      if (datasetChoice === 'soil') {
        const header = ['วันเวลาส่ง', 'เลขประจำตัว', 'ชื่อเกษตรกร', 'วันที่', 'แปลง', 'กิจกรรม', 'วัสดุ/ปุ๋ย', 'ปริมาณ', 'แหล่งที่มา', 'ต้นทุน (บาท)'];
        const rows = farmData.soilLogs.map((s) => [
          nowStr,
          citizenId,
          name,
          s.date || '-',
          s.plot || '-',
          s.activity || '-',
          s.materials || '-',
          s.amount || '-',
          s.source || '-',
          s.cost || 0
        ]);
        return { header, rows: rows.length ? rows : [[nowStr, citizenId, name, '-', '-', '-', '-', '-', '-', 0]], desc: `รายการเตรียมดินและปุ๋ย (${rows.length} แถว)` };
      }
    }

    if (type === 'health' && healthData) {
      const citizenId = healthData.profile.citizenId || '-';
      const name = healthData.profile.fullName || '-';

      if (datasetChoice === 'summary') {
        const header = [
          'วันเวลาที่ส่งข้อมูล',
          'เลขประจำตัว',
          'ชื่อ-สกุล',
          'อายุ',
          'เพศ',
          'เบอร์โทร',
          'ปัญหาสุขภาพหลัก',
          'น้ำหนัก (ก่อน -> ด.6)',
          'ความดัน (ก่อน -> ด.6)',
          'น้ำตาลในเลือด (ก่อน -> ด.6)',
          'ความสบาย (ก่อน -> ด.6)',
          'ความเบากาย (ก่อน -> ด.6)',
          'ความมีกำลัง (ก่อน -> ด.6)',
          'สรุปการปฏิบัติยา 9 เม็ด',
          'สรุปสุขภาวะ 4 ด้าน'
        ];
        const row = [
          nowStr,
          citizenId,
          name,
          healthData.profile.age || '-',
          healthData.profile.gender || '-',
          healthData.profile.phone || '-',
          healthData.profile.mainHealthIssues || '-',
          `${healthData.vitalsData.weight.before || '-'} -> ${healthData.vitalsData.weight.m6 || '-'}`,
          `${healthData.vitalsData.bp.before || '-'} -> ${healthData.vitalsData.bp.m6 || '-'}`,
          `${healthData.vitalsData.fbs.before || '-'} -> ${healthData.vitalsData.fbs.m6 || '-'}`,
          `${healthData.indicatorsData.comfort.before || '-'} -> ${healthData.indicatorsData.comfort.m6 || '-'}`,
          `${healthData.indicatorsData.lightness.before || '-'} -> ${healthData.indicatorsData.lightness.m6 || '-'}`,
          `${healthData.indicatorsData.vitality.before || '-'} -> ${healthData.indicatorsData.vitality.m6 || '-'}`,
          healthData.med9Notes || '-',
          healthData.holisticNotes || '-'
        ];
        return { header, rows: [row], desc: `ข้อมูลสรุปบัญชีสุขภาพ (1 แถว)` };
      }

      if (datasetChoice === 'vitals') {
        const header = ['วันเวลาส่ง', 'เลขประจำตัว', 'ชื่อผู้บันทึก', 'รายการตรวจวัด', 'ก่อนเริ่ม', 'เดือน 1', 'เดือน 2', 'เดือน 3', 'เดือน 4', 'เดือน 5', 'เดือน 6'];
        const items = [
          ['น้ำหนักตัว (กก.)', healthData.vitalsData.weight],
          ['ความดันโลหิต (mmHg)', healthData.vitalsData.bp],
          ['น้ำตาลในเลือด (mg/dL)', healthData.vitalsData.fbs],
          ['รอบเอว (นิ้ว)', healthData.vitalsData.waist],
          ['การนอนหลับเฉลี่ย (ชม.)', healthData.vitalsData.sleep]
        ] as const;
        const rows = items.map(([title, val]) => [
          nowStr,
          citizenId,
          name,
          title,
          val.before || '-',
          val.m1 || '-',
          val.m2 || '-',
          val.m3 || '-',
          val.m4 || '-',
          val.m5 || '-',
          val.m6 || '-'
        ]);
        return { header, rows, desc: `สัญญาณชีพและกายภาพ (${rows.length} แถว)` };
      }

      if (datasetChoice === 'indicators') {
        const header = ['วันเวลาส่ง', 'เลขประจำตัว', 'ชื่อผู้บันทึก', 'ตัวชี้วัด 3 ประการ', 'ก่อนเริ่ม', 'เดือน 1', 'เดือน 2', 'เดือน 3', 'เดือน 4', 'เดือน 5', 'เดือน 6'];
        const rows = [
          [nowStr, citizenId, name, 'ความสบาย', healthData.indicatorsData.comfort.before || '-', healthData.indicatorsData.comfort.m1 || '-', healthData.indicatorsData.comfort.m2 || '-', healthData.indicatorsData.comfort.m3 || '-', healthData.indicatorsData.comfort.m4 || '-', healthData.indicatorsData.comfort.m5 || '-', healthData.indicatorsData.comfort.m6 || '-'],
          [nowStr, citizenId, name, 'ความเบากาย', healthData.indicatorsData.lightness.before || '-', healthData.indicatorsData.lightness.m1 || '-', healthData.indicatorsData.lightness.m2 || '-', healthData.indicatorsData.lightness.m3 || '-', healthData.indicatorsData.lightness.m4 || '-', healthData.indicatorsData.lightness.m5 || '-', healthData.indicatorsData.lightness.m6 || '-'],
          [nowStr, citizenId, name, 'ความมีกำลัง', healthData.indicatorsData.vitality.before || '-', healthData.indicatorsData.vitality.m1 || '-', healthData.indicatorsData.vitality.m2 || '-', healthData.indicatorsData.vitality.m3 || '-', healthData.indicatorsData.vitality.m4 || '-', healthData.indicatorsData.vitality.m5 || '-', healthData.indicatorsData.vitality.m6 || '-']
        ];
        return { header, rows, desc: `ตัวชี้วัดสุขภาพ 3 ประการ (3 แถว)` };
      }

      if (datasetChoice === 'med9') {
        const header = ['วันเวลาส่ง', 'เลขประจำตัว', 'ชื่อผู้บันทึก', 'เม็ดที่', 'รายการยา 9 เม็ด', 'ก่อนเริ่ม', 'เดือน 1', 'เดือน 2', 'เดือน 3', 'เดือน 4', 'เดือน 5', 'เดือน 6', 'ข้อสังเกต'];
        const med9Titles: Record<string, string> = {
          p1: 'ดื่มน้ำสมุนไพรปรับสมดุล',
          p2: 'การกัวซา',
          p3: 'การดีท็อกซ์',
          p4: 'แช่มือ/แช่เท้าสมุนไพร',
          p5: 'พอก ทา หยอด ประคบ อบ อาบ',
          p6: 'โยคะกายบริหาร',
          p7: 'รับประทานอาหารปรับสมดุล',
          p8: 'ใช้ธรรมะ ละบาป บำเพ็ญบุญ',
          p9: 'การรู้เพียร รู้พัก'
        };
        const rows = Object.entries(healthData.med9Data).map(([key, val], idx) => [
          nowStr,
          citizenId,
          name,
          idx + 1,
          med9Titles[key] || key,
          val.before || '-',
          val.m1 || '-',
          val.m2 || '-',
          val.m3 || '-',
          val.m4 || '-',
          val.m5 || '-',
          val.m6 || '-',
          val.observation || '-'
        ]);
        return { header, rows, desc: `การปฏิบัติยา 9 เม็ด (${rows.length} แถว)` };
      }
    }

    return { header: [], rows: [], desc: 'ไม่มีข้อมูล' };
  };

  const handleStartExport = () => {
    const rawId = extractSpreadsheetId(sheetUrlOrId);
    if (!rawId) {
      setVerifyError('กรุณากรอกลิงก์หรือ Spreadsheet ID ของ Google Sheet ปลายทาง');
      return;
    }
    if (!sheetTabName.trim()) {
      setVerifyError('กรุณาระบุชื่อแท็บแผ่นงาน (Sheet Tab Name)');
      return;
    }
    setVerifyError(null);
    setShowConfirmDialog(true);
  };

  const handleConfirmExecuteExport = async () => {
    const rawId = extractSpreadsheetId(sheetUrlOrId);
    const { header, rows } = generatePayload();
    setIsExporting(true);
    try {
      const result = await appendToGoogleSheet(rawId, sheetTabName.trim(), header, rows);
      localStorage.setItem(storageKeySheetId, sheetUrlOrId);
      setShowConfirmDialog(false);
      setExportSuccessInfo({
        spreadsheetId: rawId,
        sheetName: sheetTabName.trim(),
        rowsCount: result.updatedRows
      });
      onShowToast(`ส่งข้อมูลไปยัง Google Sheet สำเร็จ (${result.updatedRows} แถว)`);
    } catch (err: any) {
      onShowToast(err.message || 'ส่งข้อมูลไม่สำเร็จ', 'fa-solid fa-triangle-exclamation text-rose-400');
    } finally {
      setIsExporting(false);
    }
  };

  const activeIdNumber = type === 'farm' ? farmData?.profile.citizenId : healthData?.profile.citizenId;
  const activeName = type === 'farm' ? farmData?.profile.name : healthData?.profile.fullName;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl text-lime-300">
              <i className="fa-solid fa-file-excel" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                ส่งออกไปยัง Google Sheet ปลายทาง
              </h3>
              <p className="text-xs text-emerald-100">
                {type === 'farm' ? 'แบบบันทึกบัญชีฟาร์ม' : 'สมุดบันทึกบัญชีสุขภาพ'} • Google Workspace API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs sm:text-sm">
          {/* Identity preview badge */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 block">ผู้บันทึกข้อมูลที่จะส่งออก:</span>
              <span className="font-bold text-stone-900 text-sm">{activeName || '(ยังไม่ระบุชื่อ)'}</span>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-900">
              <span className="text-[10px] text-stone-500 block">เลขประจำตัว:</span>
              <strong className="text-xs sm:text-sm font-mono">{activeIdNumber || '(ยังไม่ระบุเลขประจำตัว)'}</strong>
            </div>
          </div>

          {/* Step 1: Google Account Authentication */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <i className="fa-brands fa-google text-rose-500" /> บัญชี Google ผู้ใช้งาน
              </span>
              {currentUser && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full">
                  เข้าสู่ระบบแล้ว
                </span>
              )}
            </div>

            {!currentUser ? (
              <div className="space-y-2">
                <p className="text-stone-600 text-xs">
                  ลงชื่อเข้าใช้ด้วยบัญชี Google เพื่ออนุญาตให้แอปพลิเคชันส่งข้อมูลไปยัง Google Sheet ของคุณ
                </p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs border border-stone-300 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'Sign in with Google'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2.5">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="User Avatar" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-xs text-stone-900">{currentUser.displayName || 'ผู้ใช้ Google'}</div>
                    <div className="text-[11px] text-stone-500">{currentUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  className="text-xs text-stone-500 hover:text-rose-600 underline font-medium"
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Spreadsheet Destination */}
          <div className="space-y-3">
            <label className="block font-bold text-stone-800">
              ลิงก์หรือไอดี Google Sheet ปลายทาง (Spreadsheet URL หรือ ID) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrlOrId}
                onChange={(e) => setSheetUrlOrId(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/.../edit หรือ รหัส Sheet ID"
                className="flex-1 p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-xs"
              />
              <button
                onClick={handleVerifySheet}
                disabled={isVerifying || !sheetUrlOrId.trim() || !currentUser}
                className="bg-stone-800 hover:bg-stone-900 text-white px-3.5 py-2.5 rounded-xl font-medium text-xs whitespace-nowrap disabled:opacity-50 flex items-center gap-1.5 shadow"
              >
                {isVerifying ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-magnifying-glass" />}
                <span>ตรวจสอบชีต</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-500">
              สามารถคัดลอก URL จากแถบที่อยู่ของเบราว์เซอร์ใน Google Sheets ที่ต้องการนำข้อมูลไปเพิ่มมาวางได้โดยตรง
            </p>

            {sheetTitle && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-emerald-600 text-base" />
                <span>
                  พบเอกสาร: <strong>{sheetTitle}</strong>
                </span>
              </div>
            )}

            {verifyError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation text-rose-600 text-base" />
                <span>{verifyError}</span>
              </div>
            )}
          </div>

          {/* Step 3: Tab Name */}
          <div className="space-y-2">
            <label className="block font-bold text-stone-800">
              ชื่อแท็บแผ่นงานปลายทาง (Sheet Tab Name)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetTabName}
                onChange={(e) => setSheetTabName(e.target.value)}
                placeholder="เช่น บัญชีฟาร์ม หรือ Sheet1"
                className="flex-1 p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-500 text-xs"
              />
              {availableTabs.length > 0 && (
                <select
                  onChange={(e) => setSheetTabName(e.target.value)}
                  value={sheetTabName}
                  className="p-2 border border-stone-300 rounded-xl text-xs bg-white"
                >
                  <option value="">-- แท็บที่มีอยู่ --</option>
                  {availableTabs.map((tab) => (
                    <option key={tab} value={tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-[11px] text-stone-500">
              หากแท็บที่ระบุยังไม่มีในไฟล์ ระบบจะสร้างแท็บใหม่ให้โดยอัตโนมัติพร้อมหัวตาราง (Header)
            </p>
          </div>

          {/* Step 4: Dataset Choice */}
          <div className="space-y-2">
            <label className="block font-bold text-stone-800">รูปแบบชุดข้อมูลที่ต้องการส่งออก (Dataset)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2 ${
                  datasetChoice === 'summary' ? 'border-teal-600 bg-teal-50/50 font-bold text-teal-900' : 'bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="dataset"
                  checked={datasetChoice === 'summary'}
                  onChange={() => setDatasetChoice('summary')}
                  className="mt-0.5"
                />
                <div>
                  <div>ข้อมูลสรุปภาพรวม (1 แถวสรุป)</div>
                  <div className="text-[10px] font-normal text-stone-500 mt-0.5">
                    รวมเลขประจำตัว, ชื่อ, พิกัด, ผลผลิต/สัญญาณชีพ, ต้นทุน, กำไร
                  </div>
                </div>
              </label>

              {type === 'farm' && (
                <>
                  <label
                    className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2 ${
                      datasetChoice === 'harvest' ? 'border-teal-600 bg-teal-50/50 font-bold text-teal-900' : 'bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      checked={datasetChoice === 'harvest'}
                      onChange={() => setDatasetChoice('harvest')}
                      className="mt-0.5"
                    />
                    <div>
                      <div>รายการเก็บเกี่ยวผลผลิต (แยกแถว)</div>
                      <div className="text-[10px] font-normal text-stone-500 mt-0.5">
                        ทุกรายการเก็บเกี่ยว พร้อมแปลงและเกรดผลผลิต
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2 ${
                      datasetChoice === 'utilization' ? 'border-teal-600 bg-teal-50/50 font-bold text-teal-900' : 'bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      checked={datasetChoice === 'utilization'}
                      onChange={() => setDatasetChoice('utilization')}
                      className="mt-0.5"
                    />
                    <div>
                      <div>การใช้ประโยชน์และจำหน่าย (แยกแถว)</div>
                      <div className="text-[10px] font-normal text-stone-500 mt-0.5">
                        กินเอง, แจก, ขาย และรายได้แยกตามรายการ
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2 ${
                      datasetChoice === 'soil' ? 'border-teal-600 bg-teal-50/50 font-bold text-teal-900' : 'bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      checked={datasetChoice === 'soil'}
                      onChange={() => setDatasetChoice('soil')}
                      className="mt-0.5"
                    />
                    <div>
                      <div>บันทึกเตรียมดินและปุ๋ย (แยกแถว)</div>
                      <div className="text-[10px] font-normal text-stone-500 mt-0.5">
                        กิจกรรม, วัสดุ, ปริมาณ, และต้นทุน
                      </div>
                    </div>
                  </label>
                </>
              )}

              {type === 'health' && (
                <>
                  <label
                    className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2 ${
                      datasetChoice === 'vitals' ? 'border-teal-600 bg-teal-50/50 font-bold text-teal-900' : 'bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      checked={datasetChoice === 'vitals'}
                      onChange={() => setDatasetChoice('vitals')}
                      className="mt-0.5"
                    />
                    <div>
                      <div>บันทึกสัญญาณชีพรายเดือน (แยกแถว)</div>
                      <div className="text-[10px] font-normal text-stone-500 mt-0.5">
                        น้ำหนัก, ความดัน, น้ำตาล, รอบเอว, การนอนหลับ
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2 ${
                      datasetChoice === 'indicators' ? 'border-teal-600 bg-teal-50/50 font-bold text-teal-900' : 'bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      checked={datasetChoice === 'indicators'}
                      onChange={() => setDatasetChoice('indicators')}
                      className="mt-0.5"
                    />
                    <div>
                      <div>ตัวชี้วัด 3 ประการ (แยกแถว)</div>
                      <div className="text-[10px] font-normal text-stone-500 mt-0.5">
                        สบาย, เบากาย, มีกำลัง เดือนที่ 1-6
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl cursor-pointer flex items-start gap-2 ${
                      datasetChoice === 'med9' ? 'border-teal-600 bg-teal-50/50 font-bold text-teal-900' : 'bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      checked={datasetChoice === 'med9'}
                      onChange={() => setDatasetChoice('med9')}
                      className="mt-0.5"
                    />
                    <div>
                      <div>การปฏิบัติยา 9 เม็ด (แยก 9 แถว)</div>
                      <div className="text-[10px] font-normal text-stone-500 mt-0.5">
                        รายละเอียดการปฏิบัติและข้อสังเกตรายเดือน
                      </div>
                    </div>
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Success Box */}
          {exportSuccessInfo && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <i className="fa-solid fa-circle-check text-emerald-600 text-lg" />
                <span>ส่งข้อมูลไปยัง Google Sheet เรียบร้อยแล้ว!</span>
              </div>
              <p className="text-xs text-emerald-800">
                เพิ่มข้อมูลจำนวน {exportSuccessInfo.rowsCount} แถว ในแท็บ &quot;{exportSuccessInfo.sheetName}&quot;
              </p>
              <div className="pt-2 flex gap-2">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${exportSuccessInfo.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow transition"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" />
                  <span>เปิดดูใน Google Sheet ทันที</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-semibold text-xs hover:bg-stone-200 transition"
          >
            ปิด
          </button>
          <button
            onClick={handleStartExport}
            disabled={!currentUser || !sheetUrlOrId.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <i className="fa-solid fa-cloud-arrow-up" />
            <span>ส่งข้อมูลไปยัง Google Sheet</span>
          </button>
        </div>
      </div>

      {/* MANDATORY Confirmation Dialog per Google Workspace Integration Guide */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
          onClick={() => !isExporting && setShowConfirmDialog(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg">
                <i className="fa-solid fa-file-circle-check" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                  ยืนยันการเพิ่มข้อมูลลงใน Google Sheet
                </h4>
                <p className="text-xs text-stone-500">ตรวจสอบรายละเอียดก่อนบันทึก</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <div>
                <strong className="text-stone-900">เอกสารปลายทาง:</strong> {sheetTitle || extractSpreadsheetId(sheetUrlOrId)}
              </div>
              <div>
                <strong className="text-stone-900">แท็บแผ่นงาน:</strong> {sheetTabName}
              </div>
              <div>
                <strong className="text-stone-900">ผู้บันทึก:</strong> {activeName || '-'}
              </div>
              <div>
                <strong className="text-stone-900">เลขประจำตัว:</strong>{' '}
                <span className="font-mono font-bold text-teal-800">{activeIdNumber || '(ยังไม่ระบุ)'}</span>
              </div>
              <div>
                <strong className="text-stone-900">ชุดข้อมูล:</strong> {generatePayload().desc}
              </div>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed">
              ข้อมูลจะถูกบันทึกต่อท้าย (Append) ในชีตที่คุณกำหนด โดยไม่ลบข้อมูลเดิมที่มีอยู่
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isExporting}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmExecuteExport}
                disabled={isExporting}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow flex items-center gap-1.5 transition"
              >
                {isExporting ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />}
                <span>{isExporting ? 'กำลังบันทึกลงชีต...' : 'ยืนยันและส่งข้อมูล'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
