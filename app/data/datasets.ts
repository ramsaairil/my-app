import rawDatasets from './benchmarkDatasets.json';

export interface CargoItem {
  id: string;
  badge: string;
  badgeColor: string;
  type: string;
  qty: string;
  dimension: string;
  method: string;
}

export interface BaselineDataset {
  name: string;
  slots: any[];
  shipments: CargoItem[];
}

const descriptions: Record<string, string> = {
  "3dBPP_1": "51 items (Dim. Restrictions)",
  "3dBPP_2": "51 items (Max Weight 1000kg)",
  "3dBPP_3": "52 packages",
  "3dBPP_4": "52 items (Heavy Bottom Items)",
  "3dBPP_5": "54 packages",
  "3dBPP_6": "54 items (Incompatibilities)",
  "3dBPP_7": "46 items",
  "3dBPP_8": "46 packages (Affinity & Incompatible)",
  "3dBPP_9": "47 items (Center of Mass 750,750)",
  "3dBPP_10": "47 items (Center of Mass 900,500)",
  "3dBPP_11": "38 items (Max Weight 800kg & CoM)",
  "3dBPP_12": "38 items (Max Weight 900kg & CoM)",
  "3dBPP_test": "Benchmark Test Set"
};

const convertRawToShipments = (items: any[]): CargoItem[] => {
  return items.map((item, idx) => {
    const isHeavy = item.weight >= 40;
    const isLarge = item.quantity >= 5;
    
    let badge = "Standard";
    let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
    
    if (isHeavy) {
      badge = "Heavy";
      badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (isLarge) {
      badge = "Volume Tinggi";
      badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (idx % 3 === 0) {
      badge = "Express";
      badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    const len = Number((item.length * 0.0035).toFixed(2));
    const wid = Number((item.width * 0.003).toFixed(2));
    const hgt = Number((item.height * 0.003).toFixed(2));
    const dimM = `${Math.min(2.4, Math.max(0.4, len))}x${Math.min(2.0, Math.max(0.4, wid))}x${Math.min(1.8, Math.max(0.3, hgt))} m`;
    
    return {
      id: `ITEM-${item.id}`,
      badge,
      badgeColor,
      type: item.weight >= 35 ? "Pallet" : "Box",
      qty: `${item.quantity} ${item.weight >= 35 ? "pallets" : "boxes"}`,
      dimension: dimM,
      method: "Pickup"
    };
  });
};

export const benchmarkBaselines: Record<string, BaselineDataset> = {};

Object.entries(rawDatasets).forEach(([key, data]: [string, any]) => {
  const desc = descriptions[key] || `${data.items.length} items`;
  benchmarkBaselines[key] = {
    name: `${key} - ${desc}`,
    slots: [],
    shipments: convertRawToShipments(data.items)
  };
});
