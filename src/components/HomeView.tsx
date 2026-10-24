import React from 'react';

interface HomeViewProps {
  onNavigate: (view: 'farm' | 'health') => void;
  onOpenPreview: (type: 'farm' | 'health') => void;
  onInstall: () => void;
  canInstall: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenPreview,
  onInstall,
  canInstall
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white pt-14 pb-24 overflow-hidden bg-emerald-900" style={{
        backgroundImage: 'radial-gradient(#10b981 0.75px, transparent 0.75px), radial-gradient(#10b981 0.75px, #064e3b 0.75px)',
        backgroundSize: '30px 30px',
        backgroundPosition: '0 0, 15px 15px'
      }}>
        {/* Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs px-3.5 py-1.5 rounded-full font-semibold mb-5 backdrop-blur-sm shadow-sm">
            <i className="fa-solid fa-book-open-reader text-lime-300" /> หลักสูตรการเรียนรู้และเครื่องมือบันทึกปฏิบัติการ
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight text-white mb-5 tracking-tight">
            กสิกรรมไร้สารพิษและอาหาร
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-200 to-teal-300">
              เพื่อเศรษฐกิจและสุขภาวะพึ่งตนอย่างยั่งยืน
            </span>
          </h2>

          <p className="text-sm sm:text-base text-emerald-100/90 max-w-3xl mx-auto mb-8 font-light leading-relaxed">
            บูรณาการระหว่าง <strong>“การจัดการแปลงเกษตรธรรมชาติ”</strong> เพื่อสร้างความมั่นคงทางอาหาร และ <strong>“การดูแลสุขภาพพึ่งตนด้วยยา 9 เม็ด”</strong>{' '}
            ช่วยบันทึก วิเคราะห์ พัฒนา และถอดบทเรียนทุกมิติชีวิต พร้อมเครื่องมือส่งออกเอกสาร Word, PDF และกราฟสถิติครบวงจร
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
            <a
              href="#applications"
              className="bg-gradient-to-r from-lime-500 to-emerald-600 hover:from-lime-600 hover:to-emerald-700 text-stone-950 font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-emerald-500/30 transition transform hover:-translate-y-0.5 text-sm flex items-center gap-2"
            >
              <i className="fa-solid fa-arrow-down" />
              <span>เลือกเข้าใช้งานสมุดบันทึก</span>
            </a>
            <button
              onClick={() => onOpenPreview('farm')}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20 font-semibold px-5 py-3 rounded-2xl backdrop-blur-sm transition text-sm flex items-center gap-2"
            >
              <i className="fa-solid fa-desktop" />
              <span>ดูตัวอย่างในหน้านี้ (Preview)</span>
            </button>
          </div>

          {/* Stats/Badges Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12 max-w-4xl mx-auto text-left">
            <div className="bg-white/10 border border-white/15 p-3.5 rounded-2xl backdrop-blur-md">
              <div className="text-lime-300 font-bold text-lg">
                <i className="fa-solid fa-shield-halved" /> 100% ปลอดภัย
              </div>
              <div className="text-[11px] text-emerald-100">เก็บข้อมูลในเครื่องคุณ (Local-First)</div>
            </div>
            <div className="bg-white/10 border border-white/15 p-3.5 rounded-2xl backdrop-blur-md">
              <div className="text-lime-300 font-bold text-lg">
                <i className="fa-solid fa-file-excel" /> ส่งออก Google Sheet
              </div>
              <div className="text-[11px] text-emerald-100">เพิ่มแถว Google Sheets, Word & PDF</div>
            </div>
            <div className="bg-white/10 border border-white/15 p-3.5 rounded-2xl backdrop-blur-md">
              <div className="text-lime-300 font-bold text-lg">
                <i className="fa-solid fa-chart-pie" /> กราฟสถิติครบ
              </div>
              <div className="text-[11px] text-emerald-100">สรุปผลผลิต ต้นทุน และเรดาร์สุขภาวะ</div>
            </div>
            <div className="bg-white/10 border border-white/15 p-3.5 rounded-2xl backdrop-blur-md">
              <div className="text-lime-300 font-bold text-lg">
                <i className="fa-solid fa-mobile-screen-button" /> ทุกอุปกรณ์
              </div>
              <div className="text-[11px] text-emerald-100">รองรับมือถือ แท็บเล็ต และคอมพิวเตอร์</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Applications Selector Section */}
      <section id="applications" className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* APP CARD 1: FARM ACCOUNT */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden flex flex-col hover:border-emerald-500/50 transition duration-300 group">
            <div className="bg-gradient-to-r from-emerald-800 to-lime-800 p-6 sm:p-7 text-white flex justify-between items-start">
              <div>
                <span className="inline-block bg-lime-400 text-stone-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  ระบบที่ 1 • แปลงเกษตร
                </span>
                <h3 className="text-2xl font-bold">แบบบันทึกบัญชีฟาร์ม</h3>
                <p className="text-xs sm:text-sm text-lime-200 mt-1">Farm Account Record & Soil Management</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl text-lime-300 group-hover:scale-110 transition duration-300">
                <i className="fa-solid fa-wheat-awn" />
              </div>
            </div>

            <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between space-y-6">
              <div className="space-y-4 text-xs sm:text-sm text-stone-600">
                <p className="leading-relaxed">
                  ระบบบันทึกจัดการแปลงกสิกรรมไร้สารพิษ ตั้งแต่การวางผังพื้นที่ วงจรการเพาะปลูก ปัจจัยการผลิต ไปจนถึงการกระจายผลผลิตและการเงิน
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-lime-50/70 border border-lime-200 text-stone-700">
                    <i className="fa-solid fa-paintbrush text-lime-600" />
                    <span>ผืนผ้าใบวาดผังแปลง (Canvas)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-lime-50/70 border border-lime-200 text-stone-700">
                    <i className="fa-solid fa-layer-group text-emerald-600" />
                    <span>ทะเบียนแปลง & พืชที่ปลูก</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-lime-50/70 border border-lime-200 text-stone-700">
                    <i className="fa-solid fa-bug text-rose-500" />
                    <span>บันทึก IPM & การจัดการศัตรูพืช</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-lime-50/70 border border-lime-200 text-stone-700">
                    <i className="fa-solid fa-camera text-blue-600" />
                    <span>แนบภาพกิจกรรม & ผลผลิต</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-lime-50/70 border border-lime-200 text-stone-700">
                    <i className="fa-solid fa-basket-shopping text-amber-600" />
                    <span>บันทึก กินในบ้าน / แจก / ขาย</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-lime-50/70 border border-lime-200 text-stone-700">
                    <i className="fa-solid fa-chart-column text-teal-600" />
                    <span>วิเคราะห์ต้นทุน-กำไรสุทธิ</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-2.5">
                <button
                  onClick={() => onNavigate('farm')}
                  className="flex-1 min-w-[150px] bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl text-center shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" />
                  <span>เปิดใช้งานบัญชีฟาร์ม</span>
                </button>
                <button
                  onClick={() => onOpenPreview('farm')}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 px-4 rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  title="พรีวิวในหน้านี้"
                >
                  <i className="fa-solid fa-magnifying-glass" />
                  <span>พรีวิว</span>
                </button>
              </div>
            </div>
          </div>

          {/* APP CARD 2: HEALTH ACCOUNT */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-stone-200/80 shadow-xl overflow-hidden flex flex-col hover:border-teal-500/50 transition duration-300 group">
            <div className="bg-gradient-to-r from-teal-800 to-emerald-900 p-6 sm:p-7 text-white flex justify-between items-start">
              <div>
                <span className="inline-block bg-teal-300 text-teal-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                  ระบบที่ 2 • สุขภาพพึ่งตน
                </span>
                <h3 className="text-2xl font-bold">สมุดบันทึกบัญชีสุขภาพ</h3>
                <p className="text-xs sm:text-sm text-teal-200 mt-1">Holistic Health & 9 Natural Remedies</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl text-teal-300 group-hover:scale-110 transition duration-300">
                <i className="fa-solid fa-heart-pulse" />
              </div>
            </div>

            <div className="p-6 sm:p-7 flex-grow flex flex-col justify-between space-y-6">
              <div className="space-y-4 text-xs sm:text-sm text-stone-600">
                <p className="leading-relaxed">
                  ระบบบันทึกและประเมินสุขภาวะองค์รวมตามหลักการแพทย์วิถีธรรม (ยา 9 เม็ด) เพื่อสังเกตพัฒนาการทางกาย จิตใจ สังคม และเศรษฐกิจ
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-stone-700">
                    <i className="fa-solid fa-pills text-teal-600" />
                    <span>การปฏิบัติยา 9 เม็ด + แนบรูป</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-stone-700">
                    <i className="fa-solid fa-stethoscope text-amber-600" />
                    <span>ตัวชี้วัด สบาย • เบากาย • มีกำลัง</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-stone-700">
                    <i className="fa-solid fa-heart-circle-check text-rose-500" />
                    <span>สัญญาณชีพ (BP, FBS, น้ำหนัก)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-stone-700">
                    <i className="fa-solid fa-brain text-purple-600" />
                    <span>สุขภาวะ 4 ด้าน (จิต-วิญญาณ-สังคม-เงิน)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-stone-700">
                    <i className="fa-solid fa-book-bookmark text-indigo-600" />
                    <span>ไดอารี่ถอดบทเรียน 6 เดือน</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-stone-700">
                    <i className="fa-solid fa-chart-radar text-emerald-600" />
                    <span>เรดาร์ชาร์ตเปรียบเทียบก่อน-หลัง</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-2.5">
                <button
                  onClick={() => onNavigate('health')}
                  className="flex-1 min-w-[150px] bg-teal-700 hover:bg-teal-800 text-white font-bold py-3 px-4 rounded-xl text-center shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square" />
                  <span>เปิดใช้งานบัญชีสุขภาพ</span>
                </button>
                <button
                  onClick={() => onOpenPreview('health')}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 px-4 rounded-xl transition text-xs sm:text-sm flex items-center justify-center gap-1.5"
                  title="พรีวิวในหน้านี้"
                >
                  <i className="fa-solid fa-magnifying-glass" />
                  <span>พรีวิว</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Philosophy Section */}
      <section id="philosophy" className="py-16 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider bg-emerald-100/60 px-3 py-1 rounded-full">
              แนวคิดและความเชื่อมโยง
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-2">
              จากดินสู่จาน จากอาหารสู่สุขภาวะพึ่งตน
            </h3>
            <p className="text-stone-500 text-xs sm:text-sm mt-2">
              การทำกสิกรรมไร้สารพิษไม่ได้เป็นเพียงแค่การปลูกพืช แต่คือการสร้างปัจจัยพื้นฐานเพื่อสุขภาพที่แข็งแรง และเป็นรากฐานของความพอเพียง 4 ประการ
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-4 font-bold">
                <i className="fa-solid fa-bowl-rice" />
              </div>
              <h4 className="font-bold text-base text-stone-900 mb-1">กินดี (Good Food)</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                บริโภคอาหารที่ผลิตจากธรรมชาติ ไร้สารเคมี ปรุงรสตามสมดุลร้อนเย็น ร่างกายได้รับสารอาหารแท้จริง
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 hover:border-teal-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-xl mb-4 font-bold">
                <i className="fa-solid fa-house-chimney-window" />
              </div>
              <h4 className="font-bold text-base text-stone-900 mb-1">อยู่ดี (Good Living)</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                สัมผัสดิน น้ำ ลม และแสงแดดในแปลงเกษตร ได้ออกกำลังกาย ออกเหงื่อ พักผ่อนและผ่อนคลายในวิถีธรรมชาติ
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 hover:border-amber-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mb-4 font-bold">
                <i className="fa-solid fa-brain" />
              </div>
              <h4 className="font-bold text-base text-stone-900 mb-1">คิดดี (Good Mind)</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                ฝึกสติ ละความเร่งร้อน ปล่อยวางความเครียด มีความสุขกับความเรียบง่ายและผลผลิตที่งอกงามตามกาลเวลา
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 hover:border-indigo-500/50 transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-xl mb-4 font-bold">
                <i className="fa-solid fa-hand-holding-heart" />
              </div>
              <h4 className="font-bold text-base text-stone-900 mb-1">ทำดี (Good Deed)</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                แบ่งปันผลผลิตที่ปลอดภัยให้เพื่อนบ้าน เกื้อกูลสังคม และส่งต่อความรู้การพึ่งตนเองอย่างยั่งยืน
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider bg-emerald-100/60 px-3 py-1 rounded-full">
              คุณสมบัติเด่น
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-4 mb-3">
              เครื่องมือบันทึกที่ใช้ได้จริงในแปลงและที่บ้าน
            </h2>
            <p className="text-stone-600 text-sm sm:text-base">
              ติดตั้งลงมือถือครั้งเดียว ใช้งานต่อได้แม้ไม่มีสัญญาณอินเทอร์เน็ต
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-shield-halved" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">เก็บข้อมูลในเครื่องคุณ</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                บันทึกอัตโนมัติลงอุปกรณ์ ไม่ส่งข้อมูลขึ้นเซิร์ฟเวอร์ ข้อมูลสุขภาพเป็นของคุณคนเดียว
              </p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-wifi" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">ใช้งานออฟไลน์ได้</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                เปิดครั้งแรกตอนมีเน็ต ระบบจะเก็บทุกอย่างไว้ในเครื่อง หลังจากนั้นใช้ในไร่ได้เลย
              </p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-file-export" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">ส่งออก Word / PDF / JSON</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                สร้างเอกสารพร้อมส่ง และสำรองข้อมูลเป็นไฟล์ JSON เพื่อย้ายเครื่องหรือกันข้อมูลหาย
              </p>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-xl mb-4">
                <i className="fa-solid fa-chart-pie" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">กราฟสถิติครบ</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                สรุปผลผลิต ต้นทุน-กำไร และเรดาร์สุขภาวะ เปรียบเทียบก่อน-หลังการปฏิบัติ
              </p>
            </div>
          </div>

          <div className="mt-10 bg-emerald-900 text-emerald-50 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">ติดตั้งเป็นแอปบนหน้าจอโฮม</h3>
              <p className="text-sm text-emerald-200 mt-1">
                Android / Chrome: กด &quot;ติดตั้งแอป&quot; • iPhone: Safari &rarr; แชร์ &rarr; เพิ่มไปยังหน้าจอโฮม
              </p>
            </div>
            {canInstall && (
              <button
                onClick={onInstall}
                className="bg-lime-400 hover:bg-lime-300 text-emerald-950 font-bold px-5 py-2.5 rounded-xl shadow transition flex items-center gap-2 whitespace-nowrap"
              >
                <i className="fa-solid fa-download" /> ติดตั้งแอป
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-emerald-950 text-emerald-200 text-xs py-8 px-4 text-center">
        <p className="font-semibold text-emerald-100 mb-1">
          กสิกรรมไร้สารพิษและอาหารเพื่อเศรษฐกิจและสุขภาวะพึ่งตน
        </p>
        <p>ข้อมูลทั้งหมดถูกเก็บในอุปกรณ์ของคุณ • แนะนำให้กด &quot;สำรอง JSON&quot; เป็นระยะ</p>
      </footer>
    </div>
  );
};
