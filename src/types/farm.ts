export interface FarmProfile {
  name: string;
  citizenId: string;
  startDate: string;
  cropYear: string;
  address: string;
  phone: string;
  lineId: string;
  goals: {
    safe: boolean;
    household: boolean;
    share: boolean;
    reduceCost: boolean;
    sell: boolean;
  };
  areaType: {
    pots: boolean;
    potsCount: string;
    raisedBed: boolean;
    raisedBedCount: string;
    groundPlot: boolean;
    groundPlotCount: string;
    totalSize: string;
  };
  location: {
    backyard: boolean;
    condo: boolean;
    rooftop: boolean;
    publicLand: boolean;
    other: string;
  };
}

export interface CropItem {
  name: string;
  plantDate: string;
  harvestDate: string;
  spacing: string;
  seedSource: 'เก็บเมล็ดเอง' | 'ซื้อจากร้าน' | 'แจก/เครือข่าย' | string;
  status: 'กำลังเติบโต' | 'เก็บเกี่ยวแล้ว' | 'พักแปลง' | string;
}

export interface PlotItem {
  name: string;
  areaType: string;
  size: string;
  soilStatus: string;
  mulchType: string;
  trellisType: string;
  managementNotes: string;
  crops: CropItem[];
}

export interface SoilLog {
  date: string;
  plot: string;
  activity: string;
  materials: string;
  amount: string;
  source: 'ทำเอง' | 'ซื้อ' | 'แบ่งปัน/แจกฟรี' | string;
  cost: number;
  photo?: string | null;
}

export interface WaterLog {
  date: string;
  plot: string;
  method: string;
  duration: string;
  notes: string;
}

export interface FertilizerLog {
  date: string;
  plot: string;
  type: string;
  amount: string;
  ratio: string;
  source: 'หมักทำเอง' | 'ซื้อ' | 'ได้รับสนับสนุน' | string;
  photo?: string | null;
}

export interface IpmLog {
  date: string;
  plot: string;
  pestFound: string;
  severity: 'น้อย' | 'ปานกลาง' | 'มาก' | string;
  method: string;
  materials: string;
  effectiveness: 'ดีมาก' | 'พอใช้' | 'ไม่ได้ผล' | string;
  photo?: string | null;
}

export interface HarvestLog {
  date: string;
  plot: string;
  crop: string;
  weightKg: number;
  grade: 'เกรด A (สวยงาม)' | 'เกรด B (ปานกลาง)' | 'เกรด C (มีตำหนิเล็กน้อย)' | string;
  postHarvest: string;
  notes: string;
  photo?: string | null;
}

export interface UtilizationLog {
  date: string;
  crop: string;
  totalKg: number;
  consumeKg: number;
  shareKg: number;
  sellKg: number;
  pricePerUnit: number;
  channel: string;
}

export interface FarmReflection {
  healthDimension: string;
  economicDimension: string;
  socialDimension: string;
  environmentDimension: string;
  lessonsLearned: string;
  futurePlan: string;
}

export interface FarmData {
  profile: FarmProfile;
  plotList: PlotItem[];
  soilLogs: SoilLog[];
  waterLogs: WaterLog[];
  fertilizerLogs: FertilizerLog[];
  ipmLogs: IpmLog[];
  harvestLogs: HarvestLog[];
  utilizationLogs: UtilizationLog[];
  reflection: FarmReflection;
  canvasDataUrl?: string | null;
}
