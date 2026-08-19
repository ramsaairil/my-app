"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Truck,
  Package,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ZoomIn,
  ZoomOut,
  Printer,
  X,
  Zap,
  Compass,
  BarChart3,
  Plus,
  Minus,
  Check,
  MousePointer
} from "lucide-react";
import {
  Vehicle,
  CargoMasterItem,
  CargoInputSelection,
  OptimizationResult,
  PlacedBox3D
} from "../../lib/types";
import { getStoredVehicles, getStoredCargos, calculateVolumeM3 } from "../../lib/storage";
import {
  evaluateAllVehicles,
  packVehicle,
  MAX_OPTIMIZATION_ITEM_TYPES,
  MAX_OPTIMIZATION_TOTAL_ITEMS,
  canFitInAnyVehicle
} from "../../lib/binPacking";
import { fetchTrucksFromDb, fetchCargosFromDb } from "../../lib/db";

// Standard professional color palette per cargo category
const COLOR_MAP: Record<string, string> = {
  "Box Small": "#3B82F6",   // Royal Blue
  "Box Medium": "#10B981",  // Emerald Green
  "Box Large": "#F59E0B",   // Warm Amber
  "Box Long": "#EC4899",    // Rose Pink
  "Default": "#8B5CF6"      // Purple
};

// --- THREE.JS HIGH-VISIBILITY 3D CANVAS COMPONENT ---
interface ThreeCanvasProps {
  vehicle?: Vehicle;
  packedBoxes: PlacedBox3D[];
  animCurrentStep: number;
  selectedBoxId: string | null;
  onSelectBox: (box: PlacedBox3D | null) => void;
}

const ThreeDCanvasViewport: React.FC<ThreeCanvasProps> = ({
  vehicle,
  packedBoxes,
  animCurrentStep,
  selectedBoxId,
  onSelectBox
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const boxesGroupRef = useRef<THREE.Group | null>(null);
  const containerGroupRef = useRef<THREE.Group | null>(null);

  // Hover & Tooltip State
  const [hoveredBox, setHoveredBox] = useState<PlacedBox3D | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize Three.js WebGL Engine
  useEffect(() => {
    const containerEl = mountRef.current;
    if (!containerEl) return;

    const width = containerEl.clientWidth || 800;
    const height = 480;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1120); // Dark Navy Clean Background
    sceneRef.current = scene;

    // 2. Camera Setup (3-Quarter Isometric Default Angle)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High-Quality Depth Buffer & Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    containerEl.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent camera flipping below floor
    controlsRef.current = controls;

    // 5. Studio Multi-Angle Lighting (Ensures Front, Side, and Top Faces are crystal clear)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    // Main Key Light (Front-Right-Top)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(12, 20, 15);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill Light (Back-Left)
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.4);
    fillLight.position.set(-12, 10, -10);
    scene.add(fillLight);

    // Top Overhead Light
    const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
    topLight.position.set(0, 15, 0);
    scene.add(topLight);

    // Groups
    const containerGroup = new THREE.Group();
    scene.add(containerGroup);
    containerGroupRef.current = containerGroup;

    const boxesGroup = new THREE.Group();
    scene.add(boxesGroup);
    boxesGroupRef.current = boxesGroup;

    // Render Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerEl || !rendererRef.current || !cameraRef.current) return;
      const newW = containerEl.clientWidth || 800;
      cameraRef.current.aspect = newW / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (containerEl && renderer.domElement) {
        containerEl.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Render Vehicle Container (Ultra-Light Translucent Glass & Emerald Wireframe Frame)
  useEffect(() => {
    if (!containerGroupRef.current || !cameraRef.current || !controlsRef.current) return;

    const group = containerGroupRef.current;
    group.clear();

    const vW = (vehicle?.widthCm || 200) / 100;   // X in meters
    const vH = (vehicle?.heightCm || 200) / 100;  // Y in meters
    const vL = (vehicle?.lengthCm || 450) / 100;  // Z in meters

    // 1. Vehicle Container Outer Box (Ultra-Light Translucent Glass Wall)
    const boxGeo = new THREE.BoxGeometry(vW, vH, vL);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x087f5b,
      transparent: true,
      opacity: 0.06,  // Ultra-light tint so cargo inside is 100% visible
      roughness: 0.1,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const containerMesh = new THREE.Mesh(boxGeo, boxMat);
    containerMesh.position.set(0, vH / 2, 0);
    group.add(containerMesh);

    // 2. Container Border Outline (Clean Emerald/Teal Line)
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x087f5b,
      transparent: true,
      opacity: 0.75,
      linewidth: 2
    });
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    lineSegments.position.set(0, vH / 2, 0);
    group.add(lineSegments);

    // 3. Vehicle Floor Surface (Restricted strictly to vehicle footprint)
    const floorGeo = new THREE.PlaneGeometry(vW, vL);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      side: THREE.DoubleSide,
      roughness: 0.8,
      transparent: true,
      opacity: 0.25
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = Math.PI / 2;
    floorMesh.position.set(0, 0.001, 0);
    group.add(floorMesh);

    // 4. Floor Grid (Restricted to vehicle floor area, no large outside grid!)
    const gridHelper = new THREE.GridHelper(Math.max(vW, vL), 10, 0x087f5b, 0x334155);
    gridHelper.position.set(0, 0.002, 0);
    gridHelper.scale.set(vW / Math.max(vW, vL), 1, vL / Math.max(vW, vL));
    group.add(gridHelper);

    // 5. Default 3-Quarter Isometric Camera Angle
    const maxDim = Math.max(vW, vH, vL);
    cameraRef.current.position.set(vW * 1.5, vH * 1.6, vL * 1.5);
    controlsRef.current.target.set(0, vH * 0.4, 0);
    controlsRef.current.update();
  }, [vehicle]);

  // Render SOLID Cargo Boxes with High Depth Visibility
  useEffect(() => {
    if (!boxesGroupRef.current || !vehicle) return;

    const group = boxesGroupRef.current;
    group.clear();

    const vW = vehicle.widthCm / 100;
    const vH = vehicle.heightCm / 100;
    const vL = vehicle.lengthCm / 100;

    const visibleBoxes = packedBoxes.slice(0, animCurrentStep);

    visibleBoxes.forEach((b) => {
      const boxW = b.wCm / 100;
      const boxH = b.hCm / 100;
      const boxL = b.lCm / 100;

      // Convert origin coordinate to Three.js centered coordinates
      const posX = -vW / 2 + (b.xCm / 100) + boxW / 2;
      const posY = (b.yCm / 100) + boxH / 2;
      const posZ = -vL / 2 + (b.zCm / 100) + boxL / 2;

      const isSelected = selectedBoxId === b.id;
      const isHovered = hoveredBox?.id === b.id;

      // Determine SOLID vibrant color
      const baseColor = b.color || COLOR_MAP[b.cargoCode] || COLOR_MAP["Default"];

      // SOLID Box Geometry & Material (opacity 0.98, transparent false for true depth rendering)
      const geometry = new THREE.BoxGeometry(boxW, boxH, boxL);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(baseColor),
        transparent: false,
        opacity: 1.0,
        roughness: 0.35,
        metalness: 0.05,
        depthTest: true,
        depthWrite: true,
        emissive: isSelected
          ? new THREE.Color(0x38bdf8)
          : isHovered
          ? new THREE.Color(0x087f5b)
          : new THREE.Color(0x000000),
        emissiveIntensity: isSelected ? 0.45 : isHovered ? 0.25 : 0
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(posX, posY, posZ);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { boxData: b };

      // Subtle Thin Outline (Not wireframe, just thin edge definition)
      const edges = new THREE.EdgesGeometry(geometry);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isSelected ? 0xffffff : 0x0f172a,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.35,
        linewidth: isSelected ? 2 : 1
      });
      const edgeLines = new THREE.LineSegments(edges, edgeMat);
      mesh.add(edgeLines);

      group.add(mesh);
    });
  }, [vehicle, packedBoxes, animCurrentStep, selectedBoxId, hoveredBox]);

  // Mouse Hover & Click Raycaster Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !boxesGroupRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTooltipPos({ x: mouseX + 12, y: mouseY + 12 });

    const mouse = new THREE.Vector2(
      (mouseX / rect.width) * 2 - 1,
      -(mouseY / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(boxesGroupRef.current.children);
    if (intersects.length > 0) {
      const hoveredMesh = intersects[0].object as THREE.Mesh;
      if (hoveredMesh.userData && hoveredMesh.userData.boxData) {
        setHoveredBox(hoveredMesh.userData.boxData as PlacedBox3D);
        return;
      }
    }

    setHoveredBox(null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !boxesGroupRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(boxesGroupRef.current.children);
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      if (clickedMesh.userData && clickedMesh.userData.boxData) {
        onSelectBox(clickedMesh.userData.boxData as PlacedBox3D);
        return;
      }
    }

    onSelectBox(null);
  };

  return (
    <div
      ref={mountRef}
      onMouseMove={handleMouseMove}
      onClick={handleCanvasClick}
      className="w-full h-[480px] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing select-none relative"
    >
      {/* Interactive Floating Micro-Tooltip on Mouse Hover */}
      {hoveredBox && (
        <div
          style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          className="absolute z-30 pointer-events-none bg-slate-900/95 border border-slate-700 backdrop-blur-md px-3 py-2 rounded-lg text-white text-[11px] font-mono shadow-xl space-y-0.5"
        >
          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: hoveredBox.color }} />
            <span>{hoveredBox.cargoName}</span>
          </div>
          <div className="text-slate-300">Dimensi: {hoveredBox.wCm} × {hoveredBox.hCm} × {hoveredBox.lCm} cm</div>
          <div className="text-slate-400">Step Load: #{hoveredBox.stepIndex}</div>
        </div>
      )}
    </div>
  );
};

export default function CustomOptimizationPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [cargoMaster, setCargoMaster] = useState<CargoMasterItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [activeResult, setActiveResult] = useState<OptimizationResult | null>(null);
  const [allComparisonResults, setAllComparisonResults] = useState<OptimizationResult[]>([]);

  // Selection Inspection
  const [selectedBox, setSelectedBox] = useState<PlacedBox3D | null>(null);

  // Animation State
  const [animCurrentStep, setAnimCurrentStep] = useState<number>(0);
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [loadedSimNumber, setLoadedSimNumber] = useState<number | null>(null);

  const availableVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status !== "Nonaktif");
  }, [vehicles]);

  useEffect(() => {
    async function loadMasterData() {
      const [dbTrucks, dbCargos] = await Promise.all([
        fetchTrucksFromDb(),
        fetchCargosFromDb()
      ]);

      let loadedVehicles = getStoredVehicles();
      if (dbTrucks && dbTrucks.length > 0) {
        const mappedTrucks: Vehicle[] = dbTrucks.map((t) => ({
          id: t.id,
          name: t.truck_name || t.id,
          type: "Box Truck 3D",
          lengthCm: t.length_cm || 450,
          widthCm: t.width_cm || 200,
          heightCm: t.height_cm || 200,
          volumeM3: Number(t.max_volume_m3 || 18.0),
          status: t.status === "Maintenance" ? "Nonaktif" : "Aktif"
        }));
        loadedVehicles = mappedTrucks;
      }
      setVehicles(loadedVehicles);

      let loadedCargos = getStoredCargos();
      if (dbCargos && dbCargos.length > 0) {
        const mappedCargos: CargoMasterItem[] = dbCargos.map((item, idx) => {
          const dimsStr = (item.dimension || "40x30x30").replace(/\s*cm/gi, "").replace(/[\*×]/g, "x");
          const parts = dimsStr.split("x").map((n) => Number(n.trim()) || 30);
          const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444"];
          return {
            id: item.id,
            name: item.name || item.id,
            code: item.category || item.id,
            lengthCm: parts[0] || 40,
            widthCm: parts[1] || 30,
            heightCm: parts[2] || 30,
            volumeM3: Number(item.volume_m3 || calculateVolumeM3(parts[0] || 40, parts[1] || 30, parts[2] || 30)),
            color: colors[idx % colors.length]
          };
        });
        loadedCargos = mappedCargos;
      }
      setCargoMaster(loadedCargos);

      // Check if full pre-computed simulation optimization result exists in storage
      // Only load it if explicitly requested via query param ?simId=...
      let simulationPreloadData: {
        simulationNumber: number;
        combination: Record<string, number>;
        optimizationResult: OptimizationResult;
      } | null = null;

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const simId = searchParams.get('simId');

        if (simId) {
          const storedRes = sessionStorage.getItem("SIMULATION_PRELOAD_RESULT") || localStorage.getItem("SIMULATION_PRELOAD_RESULT");
          if (storedRes) {
            const parsed = JSON.parse(storedRes);
            if (parsed && String(parsed.simulationNumber) === simId) {
              simulationPreloadData = parsed;
              
              // Clear storage so it won't be loaded accidentally in the future
              sessionStorage.removeItem("SIMULATION_PRELOAD_RESULT");
              localStorage.removeItem("SIMULATION_PRELOAD_RESULT");
            }
          }
          
          // Remove ?simId from URL so refresh doesn't trigger it again
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error("Error reading SIMULATION_PRELOAD_RESULT", e);
      }

      if (simulationPreloadData && simulationPreloadData.optimizationResult) {
        const preResult = simulationPreloadData.optimizationResult;
        setActiveResult(preResult);
        setAnimCurrentStep(preResult.packedBoxes.length);
        setLoadedSimNumber(simulationPreloadData.simulationNumber);
        if (simulationPreloadData.combination) {
          setItemQuantities(simulationPreloadData.combination);
        }
      } else {
        const initialQty: Record<string, number> = {};
        loadedCargos.forEach((c, idx) => {
          if (idx === 0) initialQty[c.id] = 20;
          else if (idx === 1) initialQty[c.id] = 15;
          else if (idx === 2) initialQty[c.id] = 8;
          else initialQty[c.id] = 0;
        });
        setItemQuantities(initialQty);
      }
    }

    loadMasterData();
  }, []);

  const currentSelections: CargoInputSelection[] = useMemo(() => {
    return Object.entries(itemQuantities)
      .map(([cargoId, quantity]) => ({ cargoId, quantity }))
      .filter((s) => s.quantity > 0);
  }, [itemQuantities]);

  const maxVehicleVolM3 = useMemo(() => {
    const activeVehicles = availableVehicles.filter((v) => v.status !== "Nonaktif");
    if (activeVehicles.length === 0) return 0;
    return Math.max(...activeVehicles.map((v) => v.volumeM3));
  }, [availableVehicles]);

  const requestedStats = useMemo(() => {
    let totalBoxes = 0;
    let totalVolM3 = 0;
    let distinctTypes = 0;
    let oversizedCargoError: string | null = null;
    let invalidCustomError: string | null = null;

    currentSelections.forEach((sel) => {
      const cargo = cargoMaster.find((c) => c.id === sel.cargoId);
      if (cargo && sel.quantity > 0) {
        distinctTypes += 1;
        totalBoxes += sel.quantity;
        totalVolM3 += cargo.volumeM3 * sel.quantity;

        if (cargo.lengthCm <= 0 || cargo.widthCm <= 0 || cargo.heightCm <= 0) {
          invalidCustomError = `Barang ${cargo.name} memiliki dimensi tidak valid (${cargo.lengthCm}×${cargo.widthCm}×${cargo.heightCm} cm).`;
        }

        if (!oversizedCargoError && !canFitInAnyVehicle(cargo, availableVehicles)) {
          oversizedCargoError = `Barang "${cargo.name}" (${cargo.lengthCm}×${cargo.widthCm}×${cargo.heightCm} cm) melebihi seluruh dimensi kendaraan yang tersedia.`;
        }
      }
    });

    let isValid = true;
    let errorMessage: string | null = null;

    if (totalBoxes === 0) {
      isValid = false;
      errorMessage = "Harap masukkan setidaknya 1 jumlah barang muatan.";
    } else if (invalidCustomError) {
      isValid = false;
      errorMessage = invalidCustomError;
    } else if (distinctTypes > MAX_OPTIMIZATION_ITEM_TYPES) {
      isValid = false;
      errorMessage = `Maksimal ${MAX_OPTIMIZATION_ITEM_TYPES} jenis barang per proses optimasi. (Saat ini: ${distinctTypes})`;
    } else if (totalBoxes > MAX_OPTIMIZATION_TOTAL_ITEMS) {
      isValid = false;
      errorMessage = `Total muatan melebihi batas maksimum ${MAX_OPTIMIZATION_TOTAL_ITEMS} unit per proses optimasi. (Saat ini: ${totalBoxes} unit)`;
    } else if (totalVolM3 > maxVehicleVolM3 && maxVehicleVolM3 > 0) {
      isValid = false;
      errorMessage = `Total volume muatan (${totalVolM3.toFixed(2)} m³) melebihi kapasitas kendaraan terbesar (${maxVehicleVolM3.toFixed(2)} m³).`;
    } else if (oversizedCargoError) {
      isValid = false;
      errorMessage = oversizedCargoError;
    }

    return {
      totalBoxes,
      totalVolM3: Number(totalVolM3.toFixed(3)),
      distinctTypes,
      maxVehicleVolM3: Number(maxVehicleVolM3.toFixed(2)),
      isValid,
      errorMessage
    };
  }, [currentSelections, cargoMaster, availableVehicles, maxVehicleVolM3]);

  const handleQuantityChange = (cargoId: string, value: number) => {
    const qty = Math.max(0, Math.floor(value || 0));
    setItemQuantities((prev) => ({
      ...prev,
      [cargoId]: qty
    }));
  };

  const handleRunOptimization = () => {
    if (!requestedStats.isValid) {
      alert(requestedStats.errorMessage || "Input muatan tidak valid untuk dioptimalkan.");
      return;
    }

    setIsSolving(true);
    setSelectedBox(null);

    setTimeout(() => {
      const activeVehicles = availableVehicles.filter((v) => v.status !== "Nonaktif");
      const { results, recommendedResult } = evaluateAllVehicles(
        activeVehicles,
        cargoMaster,
        currentSelections
      );
      setAllComparisonResults(results);
      if (recommendedResult) {
        setActiveResult(recommendedResult);
        setAnimCurrentStep(recommendedResult.packedBoxes.length);
      }

      setIsSolving(false);
    }, 400);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAnim && activeResult) {
      if (animCurrentStep < activeResult.packedBoxes.length) {
        timer = setTimeout(() => {
          setAnimCurrentStep((prev) => prev + 1);
        }, 150);
      } else {
        timer = setTimeout(() => {
          setIsPlayingAnim(false);
        }, 0);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlayingAnim, animCurrentStep, activeResult]);

  const handlePlayPauseAnim = () => {
    if (!activeResult) return;
    if (animCurrentStep >= activeResult.packedBoxes.length) {
      setAnimCurrentStep(0);
    }
    setIsPlayingAnim(!isPlayingAnim);
  };

  const activeVehicle = useMemo(() => {
    if (activeResult) return activeResult.vehicle;
    return availableVehicles[0];
  }, [activeResult, availableVehicles]);

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased">

      {/* Main Page Scroll Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-7 sm:p-9 space-y-7">
        <div className="max-w-[1320px] mx-auto space-y-7">

          {/* Simulation Preload Banner */}
          {loadedSimNumber !== null && (
            <div className="bg-[#E8F7F1] border border-[#087F5B]/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-[#087F5B] text-white text-xs font-bold rounded">
                  HASIL SIMULASI PRE-COMPUTED
                </span>
                <span className="text-xs text-[#172033] font-semibold">
                  Menampilkan layout 3D presisi dari Percobaan #{loadedSimNumber} (Hasil identik tanpa kalkulasi ulang)
                </span>
              </div>

              <Link
                href="/simulasi"
                className="px-3.5 py-1.5 bg-white border border-[#E7EBF0] hover:bg-[#F8FAFC] text-[#172033] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>← Kembali ke Simulasi</span>
              </Link>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7EBF0]">
            <div>
              <h1 className="text-3xl font-bold text-[#172033] tracking-tight">
                Optimasi Muatan 3D
              </h1>
              <p className="text-[14px] text-[#667085] mt-1">
                Optimalkan penempatan muatan berdasarkan kapasitas ruang kendaraan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunOptimization}
                disabled={isSolving || !requestedStats.isValid}
                className={`px-5 py-2 text-white text-[13px] font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                  isSolving || !requestedStats.isValid
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#087F5B] hover:bg-[#066B4D]"
                }`}
              >
                {isSolving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses 3D...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Optimalkan Muatan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-[#E7EBF0]">
            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Total Muatan</span>
              <span className="text-xl sm:text-2xl font-bold text-[#172033] mt-0.5 block">{requestedStats.totalBoxes} Unit</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Total Volume</span>
              <span className="text-xl sm:text-2xl font-bold text-[#087F5B] mt-0.5 block">{requestedStats.totalVolM3} m³</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Kapasitas Maksimal</span>
              <span className="text-xl sm:text-2xl font-bold text-[#172033] mt-0.5 block">{requestedStats.maxVehicleVolM3} m³</span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider block">Estimasi Utilisasi</span>
              <span className="text-xl sm:text-2xl font-bold text-[#087F5B] mt-0.5 block">
                {activeResult ? `${activeResult.utilizationPercent.toFixed(1)}%` : "0%"}
              </span>
            </div>
          </div>

          {/* Result Summary Horizontal Banner (Appears after Optimization) */}
          {activeResult && (
            <div className={`border rounded-xl p-4 sm:px-6 flex flex-wrap items-center justify-between gap-4 ${
              activeResult.totalBoxesUnpacked === 0
                ? "bg-[#E8F7F1] border-[#087F5B]/30"
                : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-center gap-6 font-sans">
                <div>
                  <span className="text-[11px] text-[#667085] font-medium uppercase tracking-wider block">Kendaraan Terpilih</span>
                  <span className="text-base font-bold text-[#172033]">{activeResult.vehicle.name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#667085] font-medium uppercase tracking-wider block">Volume Terpakai</span>
                  <span className="text-base font-bold text-[#087F5B]">{activeResult.usedVolumeM3} m³</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#667085] font-medium uppercase tracking-wider block">Utilisasi Ruang</span>
                  <span className="text-base font-bold text-[#087F5B]">{activeResult.utilizationPercent.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#667085] font-medium uppercase tracking-wider block">Status Penempatan</span>
                  <span className="text-base font-bold text-[#172033]">
                    {activeResult.totalBoxesPacked} / {activeResult.totalBoxesRequested} box ditempatkan
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeResult.totalBoxesUnpacked === 0 ? (
                  <span className="px-3.5 py-1 bg-[#087F5B] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    <span>✓ {activeResult.totalBoxesPacked}/{activeResult.totalBoxesRequested} muatan ditempatkan</span>
                  </span>
                ) : (
                  <span className="px-3.5 py-1 bg-amber-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    <span>⚠️ {activeResult.totalBoxesPacked}/{activeResult.totalBoxesRequested} muatan ditempatkan</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Main Grid: Left Output & Input (4 cols) | Right Three.js 3D Visualizer (8 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

            {/* Left Column: Vehicle Output & Cargo Input List (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Card 1: Kendaraan Terpilih Otomatis */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#E7EBF0]">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Kendaraan Terpilih Otomatis
                  </h3>
                  <span className="text-[11px] font-semibold text-[#087F5B] bg-[#E8F7F1] px-2 py-0.5 rounded">
                    Rekomendasi sistem
                  </span>
                </div>

                {!activeResult ? (
                  <div className="bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg p-4 text-center space-y-1.5 py-6">
                    <Truck size={28} className="mx-auto text-[#667085]" />
                    <p className="text-xs font-bold text-[#172033]">Kendaraan Belum Terpilih</p>
                    <p className="text-[12px] text-[#667085] leading-relaxed">
                      Sistem akan merekomendasikan kendaraan terbaik secara otomatis setelah Anda menekan tombol <span className="font-semibold text-[#087F5B]">&quot;Optimalkan Muatan&quot;</span>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg p-3.5 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-[#667085] font-semibold uppercase tracking-wider block">KENDARAAN TERPILIH</span>
                          <h4 className="font-bold text-sm text-[#172033]">{activeResult.vehicle.name}</h4>
                          <p className="text-[11px] text-[#667085]">{activeResult.vehicle.type}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#087F5B] text-white">
                          1 Unit
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#E7EBF0] grid grid-cols-2 gap-2 text-[12px]">
                        <div>
                          <span className="text-[10px] text-[#667085] block">Dimensi Ruang</span>
                          <span className="font-semibold text-[#172033]">{activeResult.vehicle.lengthCm}×{activeResult.vehicle.widthCm}×{activeResult.vehicle.heightCm} cm</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#667085] block">Kapasitas Volume</span>
                          <span className="font-bold text-[#087F5B]">{activeResult.vehicle.volumeM3.toFixed(2)} m³</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Daftar Muatan (Input) */}
              <div className="bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-[#E7EBF0]">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Daftar Muatan
                  </h3>
                  <span className="text-[12px] font-mono text-[#667085]">
                    {requestedStats.distinctTypes} / {MAX_OPTIMIZATION_ITEM_TYPES} Jenis
                  </span>
                </div>

                {/* Cargo Items List with [-] [qty] [+] */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                  {cargoMaster.map((cargo) => {
                    const qty = itemQuantities[cargo.id] || 0;
                    return (
                      <div
                        key={cargo.id}
                        className="p-3 bg-[#F8FAFC] border border-[#E7EBF0] rounded-lg flex items-center justify-between gap-3 hover:border-[#087F5B]/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cargo.color }} />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-[#172033] truncate">{cargo.name}</h4>
                            <p className="text-[11px] text-[#667085] font-mono">
                              {cargo.lengthCm}×{cargo.widthCm}×{cargo.heightCm} cm • {cargo.volumeM3.toFixed(3)} m³
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(cargo.id, qty - 1)}
                            className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-[#172033] border border-[#E7EBF0] flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Minus size={12} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => handleQuantityChange(cargo.id, parseInt(e.target.value) || 0)}
                            className="w-10 text-center py-1 text-xs border border-[#E7EBF0] rounded font-mono font-bold bg-white focus:outline-none focus:border-[#087F5B]"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(cargo.id, qty + 1)}
                            className="w-7 h-7 rounded bg-[#087F5B] hover:bg-[#066B4D] text-white border border-[#087F5B] flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {requestedStats.errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-start gap-2">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>{requestedStats.errorMessage}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: High-Visibility Three.js 3D Viewport (8 Cols) */}
            <div className="lg:col-span-8 bg-white border border-[#E7EBF0] rounded-xl p-5 space-y-4">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-[#E7EBF0]">
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">
                    Visualisasi Penempatan Muatan 3D
                  </h2>
                  <p className="text-[12px] text-[#667085]">
                    Tampilan kontainer 3D realistis. Klik box untuk melihat detail penempatan.
                  </p>
                </div>

                {/* Controls Info */}
                <div className="flex items-center gap-2 text-xs text-[#667085] bg-[#F8FAFC] border border-[#E7EBF0] px-3 py-1.5 rounded-lg font-medium">
                  <MousePointer size={14} className="text-[#087F5B]" />
                  <span>Klik & Rotate 3D Orbit</span>
                </div>
              </div>

              {/* Three.js 3D Viewport Stage */}
              <div className="w-full relative flex items-center justify-center overflow-hidden bg-[#0B1120] rounded-xl border border-slate-800 shadow-inner">
                <ThreeDCanvasViewport
                  vehicle={activeVehicle}
                  packedBoxes={activeResult ? activeResult.packedBoxes : []}
                  animCurrentStep={activeResult ? animCurrentStep : 0}
                  selectedBoxId={selectedBox ? selectedBox.id : null}
                  onSelectBox={(box) => setSelectedBox(box)}
                />

                {/* Viewport Top Status Banner */}
                {activeResult && (
                  <div className="absolute top-4 left-4 z-20">
                    {activeResult.totalBoxesUnpacked === 0 ? (
                      <div className="bg-slate-900/90 border border-[#087F5B]/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-emerald-400 font-mono text-xs font-semibold flex items-center gap-2 shadow-md">
                        <CheckCircle2 size={14} />
                        <span>✓ {activeResult.totalBoxesPacked}/{activeResult.totalBoxesRequested} muatan ditempatkan (100% Valid & Stabil)</span>
                      </div>
                    ) : (
                      <div className="bg-slate-900/90 border border-amber-500/60 backdrop-blur-md px-3.5 py-1.5 rounded-lg text-amber-400 font-mono text-xs font-semibold flex items-center gap-2 shadow-md">
                        <AlertTriangle size={14} />
                        <span>⚠️ {activeResult.totalBoxesPacked}/{activeResult.totalBoxesRequested} muatan ditempatkan ({activeResult.totalBoxesUnpacked} box tidak muat)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic Selected Box Inspector Panel */}
                {selectedBox && (
                  <div className="absolute top-4 right-4 z-20 bg-slate-900/95 border border-slate-700 backdrop-blur-md p-3.5 rounded-xl text-slate-200 text-xs space-y-1.5 max-w-[240px] shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedBox.color }} />
                        <h4 className="font-bold text-white text-xs truncate">{selectedBox.cargoName}</h4>
                      </div>
                      <button
                        onClick={() => setSelectedBox(null)}
                        className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className="space-y-1 font-mono text-[11px] text-slate-300">
                      <div>Dimensi: <span className="text-white font-bold">{selectedBox.wCm} × {selectedBox.hCm} × {selectedBox.lCm} cm</span></div>
                      <div>Volume: <span className="text-emerald-400 font-bold">{((selectedBox.wCm * selectedBox.hCm * selectedBox.lCm) / 1000000).toFixed(3)} m³</span></div>
                      <div>Posisi 3D: <span className="text-slate-200">X:{selectedBox.xCm} Y:{selectedBox.yCm} Z:{selectedBox.zCm} cm</span></div>
                      <div>Urutan Load: <span className="text-emerald-400 font-bold">Step #{selectedBox.stepIndex}</span></div>
                    </div>
                  </div>
                )}

                {/* Bottom Vehicle Overlay Specs Badge */}
                <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3.5 py-2 rounded-lg text-slate-300 font-mono text-[11px] space-y-0.5">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Truck size={13} className="text-[#087F5B]" />
                    <span>{activeVehicle?.name} ({activeVehicle?.type})</span>
                  </div>
                  <div>Ruang: {activeVehicle?.lengthCm}×{activeVehicle?.widthCm}×{activeVehicle?.heightCm} cm • {activeVehicle?.volumeM3.toFixed(2)} m³</div>
                </div>

                {/* Step Animation Controls */}
                {activeResult && (
                  <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-2 rounded-lg flex items-center gap-3">
                    <button
                      onClick={handlePlayPauseAnim}
                      className="px-3 py-1 bg-[#087F5B] hover:bg-[#066B4D] text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play size={12} />
                      <span>{isPlayingAnim ? "Pause" : "Play Step"}</span>
                    </button>

                    <span className="text-xs font-mono text-slate-300">
                      Step {animCurrentStep} / {activeResult.packedBoxes.length}
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}