import { FarmData } from '../types/farm';
import { HealthData } from '../types/health';

export const initialFarmData: FarmData = {
  profile: {
    name: '',
    citizenId: '',
    startDate: new Date().toISOString().substring(0, 10),
    cropYear: '2569',
    address: '',
    phone: '',
    lineId: '',
    goals: { safe: true, household: true, share: true, reduceCost: false, sell: false },
    areaType: { pots: false, potsCount: '', raisedBed: false, raisedBedCount: '', groundPlot: true, groundPlotCount: '2', totalSize: '1 งาน' },
    location: { backyard: true, condo: false, rooftop: false, publicLand: false, other: '' }
  },
  plotList: [
    {
      name: 'แปลงที่ 1',
      areaType: 'แปลงดินบนพื้น',
      size: '1.2 x 5 เมตร',
      soilStatus: 'พร้อมปลูก (สมบูรณ์)',
      mulchType: 'ฟางข้าวคลุมดิน',
      trellisType: 'ไม่มี',
      managementNotes: '',
      crops: [
        { name: '', plantDate: new Date().toISOString().substring(0, 10), harvestDate: '', spacing: '', seedSource: 'เก็บเมล็ดเอง', status: 'กำลังเติบโต' }
      ]
    }
  ],
  soilLogs: [],
  waterLogs: [],
  fertilizerLogs: [],
  ipmLogs: [],
  harvestLogs: [],
  utilizationLogs: [],
  reflection: {
    healthDimension: '',
    economicDimension: '',
    socialDimension: '',
    environmentDimension: '',
    lessonsLearned: '',
    futurePlan: ''
  },
  canvasDataUrl: null
};

export const sampleFarmData: FarmData = {
  profile: {
    name: 'นายสมชาย พอเพียง',
    citizenId: '1-1002-00345-67-8',
    startDate: '2026-05-01',
    cropYear: '2569',
    address: '123 หมู่ 4 ต.คลองสาม อ.คลองหลวง จ.ปทุมธานี',
    phone: '081-234-5678',
    lineId: 'somchai_farm',
    goals: { safe: true, household: true, share: true, reduceCost: true, sell: true },
    areaType: { pots: true, potsCount: '10', raisedBed: true, raisedBedCount: '2', groundPlot: true, groundPlotCount: '3', totalSize: '2 งาน' },
    location: { backyard: true, condo: false, rooftop: false, publicLand: false, other: '' }
  },
  plotList: [
    {
      name: 'แปลงที่ 1 (แคร่ผักสลัด)',
      areaType: 'แปลงยกแคร่',
      size: '1.2 x 4 เมตร',
      soilStatus: 'กำลังปลูกพืช',
      mulchType: 'ฟางข้าวอบความชื้น',
      trellisType: 'มุ้งตาข่ายกันแมลง',
      managementNotes: 'ยกสูงจากพื้น 80 ซม. ป้องกันหอยทาก',
      crops: [
        { name: 'ผักกาดหอม (Green Oak)', plantDate: '2026-05-10', harvestDate: '2026-06-15', spacing: '100 ต้น (20x20 ซม.)', seedSource: 'ซื้อจากร้าน', status: 'เก็บเกี่ยวแล้ว' },
        { name: 'ผักเรดโอ๊ค (Red Oak)', plantDate: '2026-05-12', harvestDate: '2026-06-18', spacing: '80 ต้น (20x20 ซม.)', seedSource: 'แจก/เครือข่าย', status: 'กำลังเติบโต' }
      ]
    },
    {
      name: 'แปลงที่ 2 (กสิกรรมดินเปิด)',
      areaType: 'แปลงดินบนพื้น',
      size: '1.5 x 6 เมตร',
      soilStatus: 'พร้อมปลูก (สมบูรณ์)',
      mulchType: 'เศษหญ้าแห้งหนา 2 นิ้ว',
      trellisType: 'ไม่มี',
      managementNotes: 'หว่านถั่วพร้าปรับบำรุงดินก่อนปลูก',
      crops: [
        { name: 'ผักคะน้าฮ่องกง', plantDate: '2026-05-15', harvestDate: '2026-06-25', spacing: '200 ต้น (15x15 ซม.)', seedSource: 'เก็บเมล็ดเอง', status: 'กำลังเติบโต' }
      ]
    },
    {
      name: 'แปลงที่ 3 (ซุ้มไม้เลื้อย)',
      areaType: 'ซุ้มเลื้อย / นั่งร้าน',
      size: '2 x 3 เมตร',
      soilStatus: 'กำลังปลูกพืช',
      mulchType: 'ฟางข้าวคลุมโคน',
      trellisType: 'ค้างไม้ไผ่สานตารางขนาน',
      managementNotes: 'เด็ดยอดเพื่อให้แตกแขนงเลื้อยขึ้นซุ้ม',
      crops: [
        { name: 'ถั่วพู organic', plantDate: '2026-05-01', harvestDate: '2026-07-01', spacing: '12 กระถางใหญ่', seedSource: 'เก็บเมล็ดเอง', status: 'กำลังเติบโต' }
      ]
    }
  ],
  soilLogs: [
    { date: '2026-05-02', plot: 'แปลงที่ 2 (กสิกรรมดินเปิด)', activity: 'ไถพรวนดินและหว่านปุ๋ยพืชสด (ถั่วพร้า)', materials: 'เมล็ดถั่วพร้า + ปุ๋ยหมักหมักเอง', amount: '10 กก.', source: 'ทำเอง', cost: 150, photo: null },
    { date: '2026-05-10', plot: 'แปลงที่ 1 (แคร่ผักสลัด)', activity: 'ขึ้นแปลงและรองพื้นด้วยปุ๋ยคอก', materials: 'ขี้งัวหมักชีวภาพ', amount: '3 กระสอบ', source: 'ทำเอง', cost: 0, photo: null }
  ],
  waterLogs: [
    { date: '2026-05-16', plot: 'แปลงที่ 1 (แคร่ผักสลัด)', method: 'ระบบสเปรย์/มินิสปริงเกลอร์', duration: '10 นาที (เช้า-เย็น)', notes: 'น้ำสระในฟาร์ม' }
  ],
  fertilizerLogs: [
    { date: '2026-05-25', plot: 'แปลงที่ 2 (กสิกรรมดินเปิด)', type: 'น้ำหมักมูลสุกร + จุลินทรีย์สังเคราะห์แสง', amount: '20 ลิตร', ratio: '200 ซีซี ต่อน้ำ 20 ลิตร', source: 'หมักทำเอง', photo: null }
  ],
  ipmLogs: [
    { date: '2026-06-01', plot: 'แปลงที่ 2 (กสิกรรมดินเปิด)', pestFound: 'หนอนใยผักกัดเจาะใบ', severity: 'น้อย', method: 'ฉีดพ่นน้ำหมักยาสูบผสมสะเดา', materials: 'ยาสูบ + ใบสะเดา', effectiveness: 'ดีมาก', photo: null }
  ],
  harvestLogs: [
    { date: '2026-06-15', plot: 'แปลงที่ 1 (แคร่ผักสลัด)', crop: 'ผักกาดหอม (Green Oak)', weightKg: 12.0, grade: 'เกรด A (สวยงาม)', postHarvest: 'ล้างคราบดิน บรรจุถุงเจาะรู', notes: 'สดกรอบ ไร้รอยแมลง', photo: null },
    { date: '2026-06-25', plot: 'แปลงที่ 2 (กสิกรรมดินเปิด)', crop: 'ผักคะน้าฮ่องกง', weightKg: 15.5, grade: 'เกรด A (สวยงาม)', postHarvest: 'ล้างสะอาด คัดใบเสียออก', notes: 'ต้นใหญ่หวานกรอบ', photo: null }
  ],
  utilizationLogs: [
    { date: '2026-06-16', crop: 'ผักกาดหอม (Green Oak)', totalKg: 12.0, consumeKg: 3.0, shareKg: 4.0, sellKg: 5.0, pricePerUnit: 60, channel: 'ขายเพื่อนร่วมงาน / แจกเพื่อนบ้าน' },
    { date: '2026-06-26', crop: 'ผักคะน้าฮ่องกง', totalKg: 15.5, consumeKg: 3.5, shareKg: 4.0, sellKg: 8.0, pricePerUnit: 50, channel: 'ขายตลาดเขียวชุมชน / แจกญาติ' }
  ],
  reflection: {
    healthDimension: 'ได้กินผักสดไร้สารพิษ สุขภาพกายแข็งแรงขึ้นจากการออกกำลังกายทำแปลง',
    economicDimension: 'ประหยัดค่าผักเข้าบ้านได้กว่า 500 บาท และมีรายได้จากการขายผัก 700 บาท',
    socialDimension: 'ได้แบ่งปันผักให้เพื่อนบ้าน สร้างความสัมพันธ์อันดีในชุมชน',
    environmentDimension: 'ดินมีความร่วนซุยขึ้นอย่างเห็นได้ชัด ไส้เดือนและแมลงตัวดีกลับมา',
    lessonsLearned: 'การใช้สารสกัดสะเดาช่วยควบคุมหนอนใยผักได้ดีหากฉีดพ่นสม่ำเสมอทุก 5-7 วัน',
    futurePlan: 'ขยายแปลงปลูกผักสลัดเพิ่มเติม และทำโรงเรือนกางมุ้งกันแมลงช่วงหน้าฝน'
  },
  canvasDataUrl: null
};

export const holisticQuestions = {
  mental: [
    'ความโกรธ ขี้หงุดหงิด ขี้โมโห',
    'ความกลัว เช่น กลัวตาย กลัวโรค กลัวเรื่องร้าย',
    'ความใจร้อน เร่งผล',
    'ความเครียด / ความกังวลใจในเรื่องต่าง ๆ',
    'ความเบิกบานใจ สดชื่น กระปรี้กระเปร่า',
    'ความสงบ / ความหนักแน่น มั่นคงของจิตใจ'
  ],
  spiritual: [
    'ความผาสุกของจิตวิญญาณ',
    'ความศรัทธาในความดี',
    'ความเชื่อและชัดเจนเรื่องกรรมและผลของกรรม',
    'ความสามารถในการดับทุกข์ใจ',
    'ความเข้าใจในการลดกิเลสในตน / การทำกุศลช่วยเหลือผู้อื่น'
  ],
  social: [
    'ความมีจิตสาธารณะ ยินดี เต็มใจที่จะช่วยเหลือผู้อื่น',
    'ความตั้งใจที่จะเป็นพลเมืองดีของสังคม',
    'ความเข้าใจ / เห็นอกเห็นใจผู้อื่น',
    'ความยินดี เต็มใจที่จะแบ่งปันให้กับผู้อื่น',
    'ความรัก / เคารพ ศรัทธาในความดีของผู้อื่น',
    'ความคิดแก่งแย่งแข่งขันชิงดีชิงเด่น'
  ],
  economic: [
    'ความยึดติดในความสะดวกสบาย',
    'ความยึดติดในสิ่งหรูหรา ฟุ้งเฟ้อ ฟุ่มเฟือย เกินจำเป็น',
    'ความต้องการแสวงหา / สะสมทรัพย์สมบัติให้ได้มาก ๆ',
    'ความมั่นใจในการพึ่งตนเอง ใช้ชีวิตแบบเรียบง่าย'
  ]
};

const createBlankMetrics = (count: number) =>
  Array.from({ length: count }, () => ({
    before: '',
    m1: '',
    m2: '',
    m3: '',
    m4: '',
    m5: '',
    m6: ''
  }));

export const initialHealthData: HealthData = {
  profile: {
    fullName: '',
    citizenId: '',
    age: '',
    gender: '',
    startDate: new Date().toISOString().substring(0, 10),
    address: '',
    phone: '',
    mainHealthIssues: ''
  },
  vitalsData: {
    weight: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' },
    bp: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' },
    fbs: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' },
    waist: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' },
    sleep: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' }
  },
  vitalsNotes: '',
  med9Data: {
    p1: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p2: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p3: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p4: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p5: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p6: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p7: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p8: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' },
    p9: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '', observation: '', image: '' }
  },
  med9Notes: '',
  indicatorsData: {
    comfort: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' },
    lightness: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' },
    vitality: { before: '', m1: '', m2: '', m3: '', m4: '', m5: '', m6: '' }
  },
  indicatorNotes: '',
  holisticData: {
    mental: createBlankMetrics(holisticQuestions.mental.length),
    spiritual: createBlankMetrics(holisticQuestions.spiritual.length),
    social: createBlankMetrics(holisticQuestions.social.length),
    economic: createBlankMetrics(holisticQuestions.economic.length)
  },
  holisticDimensionNotes: {
    mental: '',
    spiritual: '',
    social: '',
    economic: ''
  },
  holisticNotes: '',
  journalData: {
    m1: { success: '', obstacle: '', goal: '' },
    m2: { success: '', obstacle: '', goal: '' },
    m3: { success: '', obstacle: '', goal: '' },
    m4: { success: '', obstacle: '', goal: '' },
    m5: { success: '', obstacle: '', goal: '' },
    m6: { success: '', obstacle: '', goal: '' }
  }
};

export const sampleHealthData: HealthData = {
  profile: {
    fullName: 'นางสาวสมศรี มีสุข',
    citizenId: '3-1005-00987-12-3',
    age: '48',
    gender: 'หญิง',
    startDate: '2026-01-15',
    address: '99/1 หมู่ 3 ต.คลองสาม อ.คลองหลวง จ.ปทุมธานี',
    phone: '081-234-5678',
    mainHealthIssues: 'ความดันโลหิตค่อนข้างสูง ร้อนในบ่อย ปวดคอบ่าไหล่ นอนหลับยาก'
  },
  vitalsData: {
    weight: { before: '68', m1: '67', m2: '66', m3: '65', m4: '64.5', m5: '64', m6: '63.5' },
    bp: { before: '142/90', m1: '138/86', m2: '132/84', m3: '128/82', m4: '125/80', m5: '122/80', m6: '120/78' },
    fbs: { before: '118', m1: '112', m2: '108', m3: '102', m4: '98', m5: '95', m6: '92' },
    waist: { before: '33', m1: '32.5', m2: '32', m3: '31.5', m4: '31', m5: '30.5', m6: '30' },
    sleep: { before: '5', m1: '5.5', m2: '6', m3: '6.5', m4: '7', m5: '7', m6: '7.5' }
  },
  vitalsNotes: 'ระดับความดันโลหิตและน้ำตาลในเลือดปรับลดลงสู่เกณฑ์ปกติ อาการนอนหลับลึกขึ้นมาก',
  med9Data: {
    p1: { before: 'ยังไม่เคยดื่มน้ำสมุนไพร', m1: 'น้ำสกัดย่านาง 1 แก้ว', m2: 'น้ำสกัดย่านาง 2 แก้ว', m3: 'ดื่มสม่ำเสมอ เช้า-เย็น', m4: 'ดื่มเมื่อรู้สึกร้อนตัว', m5: 'ดื่มปรับสมดุล daily', m6: 'ดื่มประจำ', observation: 'อาการร้อนในลดลงอย่างเห็นได้ชัด', image: '' },
    p2: { before: 'ปวดตึงคอบ่าไหล่บ่อย ไม่เคยทำกัวซา', m1: 'ทำสัปดาห์ละ 1 ครั้ง', m2: 'ทำสัปดาห์ละ 2 ครั้ง', m3: 'ทำเมื่อตึงคอบ่าไหล่', m4: 'ทำต่อเนื่อง', m5: 'ทำสัปดาห์ละครั้ง', m6: 'ทำตามความจำเป็น', observation: 'เบาตัว หายปวดคอบ่าไหล่', image: '' },
    p3: { before: 'ท้องผูกถ่ายยาก ไม่เคยดีท็อกซ์', m1: 'ดีท็อกซ์ด้วยน้ำย่านาง', m2: 'ทำสัปดาห์ละครั้ง', m3: 'ทำสัปดาห์ละครั้ง', m4: 'เดือนละ 2 ครั้ง', m5: 'ทำเมื่อรู้สึกอึดอัด', m6: 'ทำสม่ำเสมอ', observation: 'ระบบขับถ่ายดีขึ้นมาก พุงลดลง', image: '' },
    p4: { before: 'ไม่เคยแช่มือแช่เท้าด้วยสมุนไพร', m1: 'แช่สัปดาห์ละครั้ง', m2: 'แช่ช่วงเย็น', m3: 'แช่ต่อเนื่อง', m4: 'แช่เมื่อปวดเมื่อย', m5: 'ทำตามสะดวก', m6: 'ทำประจำ', observation: 'มือเท้าคลายตึง หลับสบายขึ้น', image: '' },
    p5: { before: 'ใช้ยาทาเคมีแผนปัจจุบัน', m1: 'พอกสมุนไพรเย็น', m2: 'พอกเมื่อมีอาการ', m3: 'ใช้อย่างสม่ำเสมอ', m4: 'พอกหน้าพอกตัว', m5: 'ใช้น้ำย่านางเช็ดหน้า', m6: 'ทำประจำ', observation: 'ผื่นคันลดลง ผิวพรรณสดใส', image: '' },
    p6: { before: 'แทบไม่ได้ออกกำลังกาย ยืดเหยียดไม่ได้', m1: 'บริหาร 15 นาที', m2: 'โยคะยืดเส้น 20 นาที', m3: 'กายบริหารเช้า-เย็น', m4: 'ทำประจำ', m5: 'โยคะทุกวัน', m6: 'กายบริหารต่อเนื่อง', observation: 'ยืดเหยียดตัวได้ดีขึ้น ไม่ติดขัด', image: '' },
    p7: { before: 'ทานอาหารรสจัด แปรรูป มัน ทอด บ่อย', m1: 'ลดเผ็ด ลดเค็ม', m2: 'ทานอาหารฤทธิ์เย็น', m3: 'ทานผักพื้นบ้านมากขึ้น', m4: 'เน้นกสิกรรมไร้สารพิษ', m5: 'ปรุงรสอ่อน', m6: 'ทานปรับสมดุลสม่ำเสมอ', observation: 'สบายท้อง ท้องไม่อืด', image: '' },
    p8: { before: 'เครียดง่าย กังวล ฟุ้งซ่าน', m1: 'สวดมนต์ ทำสมาธิ', m2: 'ฝึกสติระหว่างวัน', m3: 'ทำบุญแบ่งปัน', m4: 'ละอารมณ์โกรธ', m5: 'จิตใจมั่นคง', m6: 'ปฏิบัติสม่ำเสมอ', observation: 'จิตใจผ่อนคลาย ปล่อยวางได้ง่ายขึ้น', image: '' },
    p9: { before: 'ทำงานหักโหม พักผ่อนน้อย', m1: 'พักผ่อนให้ตรงเวลา', m2: 'รู้เพียรรู้พัก', m3: 'พักเมื่อเหนื่อย', m4: 'จัดเวลาชีวิตลงตัว', m5: 'พักผ่อนเพียงพอ', m6: 'ปฏิบัติเป็นนิสัย', observation: 'ร่างกายไม่เหนื่อยล้าสะสม มีพลังสดชื่น', image: '' }
  },
  med9Notes: 'เมื่อปฏิบัติครบ 9 เม็ดอย่างต่อเนื่อง รู้สึกได้ชัดเจนว่าสุขภาพดีขึ้นตามลำดับ พึ่งตนเองได้มากขึ้น',
  indicatorsData: {
    comfort: { before: 3, m1: 5, m2: 6, m3: 7, m4: 8, m5: 9, m6: 10 },
    lightness: { before: 4, m1: 5, m2: 6, m3: 8, m4: 8, m5: 9, m6: 9 },
    vitality: { before: 3, m1: 4, m2: 6, m3: 7, m4: 8, m5: 9, m6: 10 }
  },
  indicatorNotes: 'อาการเจ็บป่วยเรื้อรังลดลงเบาบาง มีเรี่ยวแรงสดชื่นตลอดวัน',
  holisticData: {
    mental: [
      { before: 8, m1: 6, m2: 5, m3: 4, m4: 3, m5: 2, m6: 2 },
      { before: 7, m1: 6, m2: 5, m3: 4, m4: 3, m5: 3, m6: 2 },
      { before: 8, m1: 6, m2: 5, m3: 4, m4: 3, m5: 2, m6: 2 },
      { before: 8, m1: 7, m2: 5, m3: 4, m4: 3, m5: 2, m6: 2 },
      { before: 3, m1: 5, m2: 6, m3: 8, m4: 9, m5: 9, m6: 10 },
      { before: 4, m1: 5, m2: 6, m3: 7, m4: 8, m5: 9, m6: 9 }
    ],
    spiritual: [
      { before: 4, m1: 5, m2: 7, m3: 8, m4: 9, m5: 9, m6: 10 },
      { before: 5, m1: 6, m2: 7, m3: 8, m4: 9, m5: 10, m6: 10 },
      { before: 6, m1: 7, m2: 8, m3: 9, m4: 9, m5: 10, m6: 10 },
      { before: 3, m1: 5, m2: 6, m3: 7, m4: 8, m5: 9, m6: 9 },
      { before: 4, m1: 6, m2: 7, m3: 8, m4: 9, m5: 10, m6: 10 }
    ],
    social: [
      { before: 5, m1: 6, m2: 7, m3: 8, m4: 9, m5: 9, m6: 10 },
      { before: 6, m1: 7, m2: 8, m3: 9, m4: 9, m5: 10, m6: 10 },
      { before: 5, m1: 6, m2: 7, m3: 8, m4: 9, m5: 9, m6: 10 },
      { before: 5, m1: 6, m2: 7, m3: 8, m4: 9, m5: 9, m6: 10 },
      { before: 6, m1: 7, m2: 8, m3: 9, m4: 9, m5: 10, m6: 10 },
      { before: 7, m1: 6, m2: 5, m3: 3, m4: 2, m5: 2, m6: 1 }
    ],
    economic: [
      { before: 8, m1: 7, m2: 5, m3: 4, m4: 3, m5: 2, m6: 2 },
      { before: 7, m1: 6, m2: 4, m3: 3, m4: 2, m5: 2, m6: 1 },
      { before: 7, m1: 6, m2: 5, m3: 4, m4: 3, m5: 2, m6: 2 },
      { before: 4, m1: 5, m2: 7, m3: 8, m4: 9, m5: 9, m6: 10 }
    ]
  },
  holisticDimensionNotes: {
    mental: 'ควบคุมอารมณ์ได้ดีขึ้น ไม่ฉุนเฉียวเมื่อเจอสิ่งไม่ได้ดังใจ',
    spiritual: 'ปล่อยวางเรื่องราวภายนอกได้ง่ายขึ้น จิตใจสงบและผาสุก',
    social: 'ยินดีแบ่งปันผักไร้สารพิษและน้ำย่านางให้เพื่อนบ้าน',
    economic: 'ประหยัดค่าใช้จ่ายหมอยาได้มาก ทำอาหารไร้สารพิษทานเอง'
  },
  holisticNotes: 'จิตใจสงบเยือกเย็นขึ้น มีความสุขในการแบ่งปันและใช้ชีวิตอย่างพอเพียง',
  journalData: {
    m1: { success: 'เริ่มปรับตัวดื่มน้ำสมุนไพรและดีท็อกซ์สำเร็จ', obstacle: 'ยังไม่คุ้นชินรสชาติสมุนไพร', goal: 'ออกกำลังกายยืดเหยียดสม่ำเสมอขึ้น' },
    m2: { success: 'ทำกัวซาและแช่มือเท้าลดปวดเมื่อยได้ดีมาก', obstacle: 'งานเยอะทำให้มีเวลาน้อย', goal: 'จัดสรรเวลาพักผ่อนให้เป็นเวลา' },
    m3: { success: 'ความดันโลหิตเริ่มลดลง นอนหลับง่ายขึ้น', obstacle: 'ไม่มี', goal: 'ทานอาหารปรับสมดุลต่อเนื่อง' },
    m4: { success: 'ร่างกายกระปรี้กระเปร่า มีกำลังทำงานแปลงผัก', obstacle: 'ไม่มี', goal: 'ฝึกสติละอารมณ์โกรธ' },
    m5: { success: 'ผลตรวจสุขภาพดีขึ้นทุกตัวชี้วัด', obstacle: 'ไม่มี', goal: 'แบ่งปันผลผลิตและช่วยเหลือผู้อื่น' },
    m6: { success: 'สุขภาพดีขึ้นทุกมิติ ไม่ต้องทานยาแก้ปวดอีกเลย', obstacle: 'ไม่มี', goal: 'ส่งต่อความรู้และสร้างแรงบันดาลใจให้ผู้อื่น' }
  }
};
