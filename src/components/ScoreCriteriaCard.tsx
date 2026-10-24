import React, { useState } from 'react';

interface ScoreCriteriaCardProps {
  context?: 'indicators' | 'holistic';
  defaultExpanded?: boolean;
}

export const ScoreCriteriaCard: React.FC<ScoreCriteriaCardProps> = ({
  context = 'indicators',
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const scoreLevels = [
    { score: 1, label: 'แย่ที่สุด', desc: 'ไม่สบายอย่างยิ่ง หนักตัวมาก อ่อนเพลีย ไม่มีกำลัง', group: 'low' },
    { score: 2, label: 'รู้สึกไม่ดี', desc: 'ไม่สบายตัว/ใจ อาการรบกวนมาก กำลังเหลือน้อย', group: 'low' },
    { score: 3, label: 'ค่อนข้างไม่ดี', desc: 'ยังอึดอัด หนักกาย ยังมีอาการเจ็บป่วยหรือกังวล', group: 'low' },
    { score: 4, label: 'พอใช้ / ปานกลางต่ำ', desc: 'พอทนได้ อาการทรงตัว เริ่มทุเลาลงเล็กน้อย', group: 'mid' },
    { score: 5, label: 'ปานกลาง (เฉยๆ)', desc: 'รู้สึกเฉยๆ ทรงตัว ไม่ดีขึ้นแต่ไม่แย่ลง', group: 'mid' },
    { score: 6, label: 'ค่อนข้างดี', desc: 'เริ่มสบายขึ้น ร่างกายเบาลง มีเรี่ยวแรงทำกิจวัตร', group: 'good' },
    { score: 7, label: 'รู้สึกดี', desc: 'สบาย เบากายชัดเจน อาการทุเลาอย่างเห็นได้ชัด', group: 'good' },
    { score: 8, label: 'ดีมาก', desc: 'สบายใจ ปลอดโปร่ง มีเรี่ยวแรงกำลังอย่างต่อเนื่อง', group: 'good' },
    { score: 9, label: 'ประทับใจ', desc: 'ดีเยี่ยม ร่างกายคล่องตัว จิตใจสงบเบิกบาน ผาสุกยิ่ง', group: 'excellent' },
    { score: 10, label: 'ดีมากที่สุด', desc: 'สมบูรณ์แบบ สมดุล เบาสบาย มีพลังเต็มเปี่ยม ไร้ทุกข์', group: 'excellent' }
  ];

  const getBadgeColor = (group: string) => {
    switch (group) {
      case 'low':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'mid':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'good':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'excellent':
        return 'bg-teal-100 text-teal-900 border-teal-400 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getNumberColor = (group: string) => {
    switch (group) {
      case 'low':
        return 'bg-rose-600 text-white';
      case 'mid':
        return 'bg-amber-500 text-white';
      case 'good':
        return 'bg-emerald-600 text-white';
      case 'excellent':
        return 'bg-teal-700 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/70 via-emerald-50/40 to-teal-50/60 rounded-2xl border border-amber-200/80 shadow-sm overflow-hidden mb-6 transition-all">
      {/* Header bar */}
      <div
        className="px-4 py-3 sm:px-5 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-emerald-600 text-white flex items-center justify-center text-sm shadow-sm">
            <i className="fa-solid fa-scale-balanced" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
              เกณฑ์ประเมินระดับคะแนน 10 ระดับ (Rating Scale 1 - 10)
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 hidden sm:inline-block">
                คู่มือการให้คะแนน
              </span>
            </h3>
            <p className="text-xs text-stone-600">
              {context === 'indicators'
                ? 'ใช้ประเมินความรู้สึกจริงของร่างกายและจิตใจ: ความสบาย • ความเบากาย • ความมีกำลัง'
                : 'ใช้ประเมินสุขภาวะองค์รวม 4 ด้าน: จิตใจ • จิตวิญญาณ • สังคม • เศรษฐกิจพึ่งตน'}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 shadow-sm flex items-center gap-1.5 transition shrink-0"
        >
          <span>{isExpanded ? 'ย่อเกณฑ์' : 'ดูเกณฑ์ประเมิน'}</span>
          <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px]`} />
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2 border-t border-amber-200/50 space-y-4">
          {/* Quick Summary Bands */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-rose-600 text-white text-[11px] flex items-center justify-center">1-3</span>
                <span>ระดับต้องปรับปรุง / ไม่สบาย</span>
              </div>
              <p className="text-[11px] text-rose-700 mt-1">อึดอัด ทรมาน หนักกาย ร่างกายเสียสมดุล</p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white text-[11px] flex items-center justify-center">4-5</span>
                <span>ระดับปานกลาง / ทรงตัว</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-1">พอทนได้ รู้สึกเฉยๆ ยังรอการฟื้นฟู</p>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-600 text-white text-[11px] flex items-center justify-center">6-8</span>
                <span>ระดับดี / เบากาย สบายใจ</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1">อาการทุเลา เบาสบาย ปฏิบัติได้ถูกทาง</p>
            </div>

            <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-300 text-teal-900">
              <div className="font-bold flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-teal-700 text-white text-[11px] flex items-center justify-center">9-10</span>
                <span>ระดับดีเยี่ยม / ผาสุกยิ่ง</span>
              </div>
              <p className="text-[11px] text-teal-700 mt-1">สมดุล เบิกบาน มีกำลังเต็มเปี่ยม ไร้กังวล</p>
            </div>
          </div>

          {/* Detailed 10 Levels Grid */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
              {scoreLevels.map((item) => (
                <div key={item.score} className="p-3 flex flex-col justify-between hover:bg-stone-50 transition">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-lg ${getNumberColor(
                        item.group
                      )} font-bold text-xs flex items-center justify-center shadow-xs shrink-0`}
                    >
                      {item.score}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getBadgeColor(item.group)}`}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-relaxed mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Context Explanatory Guide */}
          {context === 'indicators' ? (
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <i className="fa-solid fa-circle-info text-amber-600 mt-0.5 text-sm" />
              <div className="leading-relaxed">
                <strong>คำแนะนำในการประเมินตัวชี้วัด 3 ประการ:</strong> ให้ประเมินจากความรู้สึกจริงขณะนั้น
                โดย <strong>“สบาย”</strong> หมายถึง ใจและกายปลอดโปร่งไม่เครียดอึดอัด, <strong>“เบากาย”</strong> หมายถึง อาการเจ็บป่วยทุเลาลง เคลื่อนไหวคล่องตัว, 
                และ <strong>“มีกำลัง”</strong> หมายถึง มีเรี่ยวแรงทำกิจวัตร ทำความดีได้อย่างต่อเนื่อง ไม่อ่อนเพลีย
                (คะแนน 1 คือน้อย/แย่ที่สุด ถึง 10 คือมาก/ดีที่สุด)
              </div>
            </div>
          ) : (
            <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
              <i className="fa-solid fa-circle-info text-purple-600 mt-0.5 text-sm" />
              <div className="leading-relaxed">
                <strong>คำแนะนำในการประเมินสุขภาวะองค์รวม 4 ด้าน:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px] text-purple-800">
                  <li><strong>ข้อพฤติกรรมเชิงบวก/คุณธรรม</strong> (เช่น ความผาสุก, การแบ่งปัน, ความมั่นใจในการพึ่งตน): 1 = น้อยที่สุด, 10 = มีมากที่สุด/ดีเยี่ยม</li>
                  <li><strong>ข้อกิเลสหรืออาการรบกวนที่ต้องการลด</strong> (เช่น ความโกรธ, ความกลัว, ความเครียด, การยึดติด): สามารถให้คะแนนตามระดับที่ท่านสามารถ *ลด ละ ปล่อยวาง หรือจัดการได้อย่างราบรื่น* (1 = ยังมีมาก/จัดการไม่ได้, 10 = ดับทุกข์ได้หมดจด/ปล่อยวางได้เบาสบาย)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
