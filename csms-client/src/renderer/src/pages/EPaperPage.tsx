import React, { useState, useEffect, useRef, useCallback } from "react";

/* ==========================================================================
   E-Paper Models & Specs
   ========================================================================== */
interface ModelSpec {
  width: number;
  height: number;
  dpi: number;
  physWidth: string;
  physHeight: string;
  label: string;
}

const MODELS_SPEC: Record<string, ModelSpec> = {
  GDEY0266T90: {
    width: 296,
    height: 152,
    dpi: 125,
    physWidth: "60.09",
    physHeight: "30.70",
    label: "GDEY0266T90",
  },
  GDEY027T91: {
    width: 264,
    height: 176,
    dpi: 117,
    physWidth: "57.29",
    physHeight: "38.19",
    label: "GDEY027T91",
  },
  GDEY029T94: {
    width: 296,
    height: 128,
    dpi: 112,
    physWidth: "66.90",
    physHeight: "29.06",
    label: "GDEY029T94",
  },
};

interface DraftCardInfo {
  id: number;
  model: string;
  draft: string;
  title: string;
  modelTag: string;
}

const DRAFT_CARDS: DraftCardInfo[] = [
  {
    id: 1,
    model: "GDEY0266T90",
    draft: "1",
    title: "시안 1",
    modelTag: 'T90 (2.66")',
  },
  {
    id: 2,
    model: "GDEY0266T90",
    draft: "2",
    title: "시안 2",
    modelTag: 'T90 (2.66")',
  },
  {
    id: 3,
    model: "GDEY0266T90",
    draft: "3",
    title: "시안 3",
    modelTag: 'T90 (2.66")',
  },
  {
    id: 4,
    model: "GDEY027T91",
    draft: "1",
    title: "시안 4",
    modelTag: 'T91 (2.7")',
  },
  {
    id: 5,
    model: "GDEY027T91",
    draft: "2",
    title: "시안 5",
    modelTag: 'T91 (2.7")',
  },
  {
    id: 6,
    model: "GDEY027T91",
    draft: "3",
    title: "시안 6",
    modelTag: 'T91 (2.7")',
  },
  {
    id: 7,
    model: "GDEY029T94",
    draft: "1",
    title: "시안 7",
    modelTag: 'T94 (2.9")',
  },
  {
    id: 8,
    model: "GDEY029T94",
    draft: "2",
    title: "시안 8",
    modelTag: 'T94 (2.9")',
  },
  {
    id: 9,
    model: "GDEY029T94",
    draft: "3",
    title: "시안 9",
    modelTag: 'T94 (2.9")',
  },
];

/* ==========================================================================
   Multi-language dictionary
   ========================================================================== */
interface Dictionary {
  batteryTitle: string;
  sysOk: string;
  normal: string;
  pass: string;
  faultPrefix: string;
  soc: string;
  socLevel: string;
  sum: string;
  chg: string;
  dchg: string;
  cellVoltages: string;
  cell: string;
  volts: string;
  status: string;
  diagTitle: string;
  analyzerTitle: string;
  diagMsgNormal: string;
  diagMsgFault: string;
  packSoc: string;
  sysLife: string;
  packCapacity: string;
  packSumVolt: string;
  err: string;
  ok: string;
}

const I18N_DICT: Record<"ko" | "ja" | "en", Dictionary> = {
  ko: {
    batteryTitle: "배터리 모니터",
    sysOk: "NORMAL",
    normal: "정상",
    pass: "NORMAL",
    faultPrefix: "에러 ",
    soc: "SOC",
    socLevel: "SOC 잔량",
    sum: "합계",
    chg: "충전",
    dchg: "방전",
    cellVoltages: "배터리 상태",
    cell: "CELL",
    volts: "전압",
    status: "상태",
    diagTitle: "배터리 진단",
    analyzerTitle: "배터리 상태",
    diagMsgNormal:
      "시스템 정상 작동 중.<br>총전압: {sumV}V<br>{chg}:{chgA}A | {dchg}:{disA}A",
    diagMsgFault:
      "[비상 셧다운]<br>에러 코드: FAULT {code}<br>셀 출력이 차단되었습니다.",
    packSoc: "팩 SOC",
    sysLife: "배터리 상태",
    packCapacity: "SOC",
    packSumVolt: "팩전압",
    err: "오류",
    ok: "정상",
  },
  ja: {
    batteryTitle: "バッテリーモニター",
    sysOk: "NORMAL",
    normal: "正常",
    pass: "NORMAL",
    faultPrefix: "エラー ",
    soc: "SOC",
    socLevel: "SOC残量",
    sum: "合計",
    chg: "充電",
    dchg: "放電",
    cellVoltages: "バッテリー状態",
    cell: "セル",
    volts: "電圧",
    status: "状態",
    diagTitle: "バッテリー診断",
    analyzerTitle: "バッテリー状態",
    diagMsgNormal:
      "システム正常稼働中。<br>合計電圧: {sumV}V<br>{chg}:{chgA}A | {dchg}:{disA}A",
    diagMsgFault:
      "[緊急システム遮断]<br>エラーコード: FAULT {code}<br>セル出力が遮断されました。",
    packSoc: "パックSOC",
    sysLife: "バッテリー状態",
    packCapacity: "SOC",
    packSumVolt: "パック電圧",
    err: "異常",
    ok: "正常",
  },
  en: {
    batteryTitle: "BATTERY MONITOR",
    sysOk: "NORMAL",
    normal: "NORMAL",
    pass: "NORMAL",
    faultPrefix: "FAULT ",
    soc: "SOC",
    socLevel: "SOC LEVEL",
    sum: "SUM",
    chg: "CHG",
    dchg: "DCHG",
    cellVoltages: "BATTERY STATUS",
    cell: "CELL",
    volts: "VOLT",
    status: "STATUS",
    diagTitle: "BATTERY DIAG",
    analyzerTitle: "BATTERY STATUS",
    diagMsgNormal:
      "System normal.<br>Pack Sum: {sumV}V<br>{chg}: {chgA}A | {dchg}: {disA}A",
    diagMsgFault:
      "[EMERGENCY SHUTDOWN]<br>Fault Code: FAULT {code}<br>Cell output cut off.",
    packSoc: "PACK SOC",
    sysLife: "BATTERY STATUS",
    packCapacity: "SOC",
    packSumVolt: "PACK VOLT",
    err: "ERR",
    ok: "OK",
  },
};

/* Format Current Helper */
function formatCurrent(val: number): string {
  const num = Math.max(0, val || 0);
  const fixed = num.toFixed(2);
  const parts = fixed.split(".");
  const integerPart = parts[0].padStart(2, "0");
  return `${integerPart}.${parts[1]}`;
}

function formatFaultCode(code: string): string {
  if (!code || code === "Normal") return "Normal";
  const clean = code.replace(/^FAULT\s*/i, "").trim();
  if (clean === "Normal") return "Normal";
  if (/^E\d+$/i.test(clean)) {
    const num = parseInt(clean.substring(1), 10);
    return "E" + String(num).padStart(2, "0");
  }
  return clean;
}

/* ==========================================================================
   Main EPaperPage Component
   ========================================================================== */
export default function EPaperPage() {
  // Model & Draft selection
  const [currentModel, setCurrentModel] = useState<string>("GDEY0266T90");
  const [currentDraft, setCurrentDraft] = useState<string>("1");
  const [activeDraftId, setActiveDraftId] = useState<number>(1);

  // Simulation controls
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [viewScaleMode, setViewScaleMode] = useState<string>("fit");
  const [viewRotation, setViewRotation] = useState<number>(0);
  const [paperTexture, setPaperTexture] = useState<boolean>(true);

  // Battery data
  const [soc, setSoc] = useState<number>(80);
  const [faultStatus, setFaultStatus] = useState<string>("Normal");
  const [cellVoltages, setCellVoltages] = useState<number[]>([
    3.3, 3.28, 3.31, 3.29, 3.3, 3.27,
  ]);
  const [chgCurr, setChgCurr] = useState<number>(15.0);
  const [disCurr, setDisCurr] = useState<number>(0.0);
  const [lang, setLang] = useState<"ko" | "ja" | "en">("en");

  // Refreshes & Animation state
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshOverlayActive, setRefreshOverlayActive] =
    useState<boolean>(false);
  const [partialFlash, setPartialFlash] = useState<boolean>(false);
  const [refreshStatusText, setRefreshStatusText] = useState<string>("대기 중");
  const [refreshStatusColor, setRefreshStatusColor] = useState<string>(
    "var(--epaper-text-sec)",
  );

  // UI state
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] =
    useState<boolean>(true);
  const [voteToast, setVoteToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // UUID & Vote States
  const [voterUuid, setVoterUuid] = useState<string | null>(null);
  const [isUuidValid, setIsUuidValid] = useState<boolean>(true);
  const [isVoted, setIsVoted] = useState<boolean>(false);
  const [votedSelector, setVotedSelector] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [commentInput, setCommentInput] = useState<string>("");
  const [voteSubmitting, setVoteSubmitting] = useState<boolean>(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const [voteStatus, setVoteStatus] = useState<{
    totalTargetVoters: number;
    completedCount: number;
    progressPercent: number;
    tallies: { selector: string; count: number; pct: number }[];
    topSelector: string | null;
  }>({
    totalTargetVoters: 8,
    completedCount: 0,
    progressPercent: 0,
    tallies: Array.from({ length: 9 }, (_, i) => ({
      selector: String(i + 1),
      count: 0,
      pct: 0,
    })),
    topSelector: null,
  });

  // URL에서 UUID 추출 및 상태 검증
  const checkUuidVoteStatus = useCallback(async (uuidStr: string) => {
    try {
      const res = await fetch(
        `/v1/api/daily-votes/check?uuid=${encodeURIComponent(uuidStr)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setIsUuidValid(Boolean(data.valid));
        if (data.valid) {
          setIsVoted(data.isVoted);
          if (data.votedSelector) {
            setVotedSelector(data.votedSelector);
          }
        }
      } else {
        setIsUuidValid(false);
      }
    } catch {
      const localVoted = localStorage.getItem(`epaper_voted_${uuidStr}`);
      if (localVoted) {
        setIsVoted(true);
        setVotedSelector(localVoted);
      }
    }
  }, []);

  const fetchGlobalStatus = useCallback(async () => {
    try {
      const res = await fetch("/v1/api/daily-votes/status");
      if (res.ok) {
        const data = await res.json();
        setVoteStatus(data);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    let uuidVal: string | null = null;
    if (typeof window !== "undefined") {
      const search = window.location.search || "";
      const params = new URLSearchParams(search);
      if (params.has("uuid")) {
        uuidVal = params.get("uuid");
      } else {
        const match = search.match(/uuid[=-]([a-zA-Z0-9-]+)/i);
        if (match && match[1]) {
          uuidVal = match[1];
        }
      }
    }

    if (uuidVal) {
      setVoterUuid(uuidVal);
      checkUuidVoteStatus(uuidVal);
    } else {
      setIsUuidValid(false);
    }
    fetchGlobalStatus();
  }, [checkUuidVoteStatus, fetchGlobalStatus]);

  // 투표 버튼 클릭 이벤트
  const handleVoteClick = () => {
    if (!voterUuid || !isUuidValid) {
      setVoteToast("유효하지 않거나 등록되지 않은 UUID 링크입니다.");
      setTimeout(() => setVoteToast(null), 3000);
      return;
    }

    if (isVoted) {
      setVoteToast("투표해주셔서 감사합니다.");
      setTimeout(() => setVoteToast(null), 3000);
      return;
    }

    setVoteError(null);
    setCommentInput("");
    setShowFeedbackModal(true);
  };

  // 피드백/투표 제출 처리
  const handleFeedbackSubmit = async () => {
    if (!voterUuid) {
      setVoteError("유효한 UUID가 필요합니다.");
      return;
    }

    setVoteSubmitting(true);
    setVoteError(null);

    try {
      const res = await fetch("/v1/api/daily-votes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: voterUuid,
          selector: String(activeDraftId),
          comment: commentInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "투표 제출 중 오류가 발생했습니다.");
      }

      setIsVoted(true);
      setVotedSelector(String(activeDraftId));
      localStorage.setItem(`epaper_voted_${voterUuid}`, String(activeDraftId));
      setShowFeedbackModal(false);
      setVoteToast(`시안 ${activeDraftId}번 투표가 성공적으로 완료되었습니다!`);
      setTimeout(() => setVoteToast(null), 4000);
      fetchGlobalStatus();
    } catch (err: any) {
      setVoteError(err.message || "투표 제출에 실패했습니다.");
    } finally {
      setVoteSubmitting(false);
    }
  };

  // Refs
  const hardwareFrameRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

  const activeSpec = MODELS_SPEC[currentModel] || MODELS_SPEC["GDEY0266T90"];
  const t = I18N_DICT[lang] || I18N_DICT.en;

  /* --------------------------------------------------------------------------
     Refresh Animations
     -------------------------------------------------------------------------- */
  const triggerPartialRefresh = useCallback(
    (manual = false) => {
      if (isRefreshing) return;
      setRefreshStatusText(
        manual ? "수동 부분 리프레시" : "부분 리프레시 (Fast)",
      );
      if (manual) {
        setPartialFlash(true);
        setTimeout(() => {
          setPartialFlash(false);
        }, 200);
      }
    },
    [isRefreshing],
  );

  const triggerFullRefresh = useCallback(() => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshStatusText("전체 리프레시 (Clear Cycle...)");
    setRefreshStatusColor("#f59e0b");
    setRefreshOverlayActive(true);

    setTimeout(() => {
      // mid-way clear
    }, 900);

    setTimeout(() => {
      setRefreshOverlayActive(false);
      setRefreshStatusText("완료 (쌍안정 유지)");
      setRefreshStatusColor("#9aa4b7");
      setIsRefreshing(false);
    }, 1800);
  }, [isRefreshing]);

  /* --------------------------------------------------------------------------
     Auto Simulation Interval
     -------------------------------------------------------------------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      if (!autoRefresh || isRefreshing) return;

      if (faultStatus !== "Normal") {
        setCellVoltages([0, 0, 0, 0, 0, 0]);
        return;
      }

      if (Math.random() > 0.85) {
        setSoc((prev) =>
          Math.max(0, Math.min(100, prev + (Math.random() > 0.5 ? 1 : -1))),
        );
      }

      setCellVoltages((prev) =>
        prev.map((v) => {
          const delta = (Math.random() - 0.5) * 0.02;
          return Math.min(
            3.65,
            Math.max(2.5, parseFloat((v + delta).toFixed(2))),
          );
        }),
      );
    }, 1200);

    return () => clearInterval(timer);
  }, [autoRefresh, isRefreshing, faultStatus]);

  /* --------------------------------------------------------------------------
     Scale & Transform Computation
     -------------------------------------------------------------------------- */
  const computeTransformScale = useCallback(() => {
    if (viewScaleMode === "pixel") return 1.0;
    if (viewScaleMode === "zoom-2") return 2.0;
    if (viewScaleMode === "zoom-3") return 3.0;
    if (viewScaleMode === "physical") return 96 / activeSpec.dpi;

    if (viewScaleMode === "fit" && stageContainerRef.current) {
      const stageW = stageContainerRef.current.clientWidth - 100;
      const stageH = stageContainerRef.current.clientHeight - 100;
      const isSwapped = viewRotation === 90 || viewRotation === 270;
      const frameW = (isSwapped ? activeSpec.height : activeSpec.width) + 40;
      const frameH = (isSwapped ? activeSpec.width : activeSpec.height) + 120;
      const calcScale = Math.min(stageW / frameW, stageH / frameH);
      return Math.max(0.5, Math.min(calcScale, 4.0));
    }

    return 1.0;
  }, [viewScaleMode, activeSpec, viewRotation]);

  const scaleVal = computeTransformScale();

  /* --------------------------------------------------------------------------
     Drag to Rotate Engine
     -------------------------------------------------------------------------- */
  const dragRef = useRef<{
    startAngle: number;
    initialRotation: number;
    dragging: boolean;
  }>({ startAngle: 0, initialRotation: 0, dragging: false });

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button, input, select, a")) return;

    const frameEl = hardwareFrameRef.current;
    if (!frameEl) return;

    const rect = frameEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const rad = Math.atan2(clientY - centerY, clientX - centerX);
    const angle = rad * (180 / Math.PI);

    dragRef.current = {
      startAngle: angle,
      initialRotation: viewRotation,
      dragging: true,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current.dragging || !hardwareFrameRef.current) return;
      if (e.cancelable) e.preventDefault();

      const rect = hardwareFrameRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rad = Math.atan2(clientY - centerY, clientX - centerX);
      const currentAngle = rad * (180 / Math.PI);
      const delta = currentAngle - dragRef.current.startAngle;

      let newRot = (dragRef.current.initialRotation + delta) % 360;
      if (newRot < 0) newRot += 360;
      setViewRotation(Math.round(newRot));
    };

    const handleEnd = () => {
      if (!dragRef.current.dragging) return;
      dragRef.current.dragging = false;
      setIsDragging(false);

      setViewRotation((prev) => (Math.round(prev / 90) * 90) % 360);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [viewRotation]);

  /* --------------------------------------------------------------------------
     Fault & Cell Change Handlers
     -------------------------------------------------------------------------- */
  const handleFaultChange = (val: string) => {
    setFaultStatus(val);
    if (val !== "Normal") {
      setCellVoltages([0, 0, 0, 0, 0, 0]);
    } else {
      setCellVoltages([3.3, 3.28, 3.31, 3.29, 3.3, 3.27]);
    }
    triggerPartialRefresh();
  };

  const handleCellVoltageChange = (index: number, val: number) => {
    setCellVoltages((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
    triggerPartialRefresh();
  };

  const handleDraftSelect = (card: DraftCardInfo) => {
    setActiveDraftId(card.id);
    setCurrentModel(card.model);
    setCurrentDraft(card.draft);
    triggerPartialRefresh();
  };

  /* --------------------------------------------------------------------------
     Calculated Values for Screen Rendering
     -------------------------------------------------------------------------- */
  const isFault = faultStatus !== "Normal";
  const displayVoltages = isFault ? [0, 0, 0, 0, 0, 0] : cellVoltages;
  const sumV = displayVoltages.reduce((a, b) => a + b, 0).toFixed(2);
  const maxV = Math.max(...displayVoltages).toFixed(2);
  const minV = Math.min(...displayVoltages).toFixed(2);
  const chgA = isFault ? "00.00" : formatCurrent(chgCurr);
  const disA = isFault ? "00.00" : formatCurrent(disCurr);
  const formattedFault = formatFaultCode(faultStatus);
  const faultLabel = isFault ? `${t.faultPrefix}${formattedFault}` : t.normal;
  const sysOkText = isFault ? `${t.faultPrefix}${formattedFault}` : t.sysOk;
  const passText = isFault ? `${t.faultPrefix}${formattedFault}` : t.pass;

  /* --------------------------------------------------------------------------
     Draft JSX Components
     -------------------------------------------------------------------------- */
  const renderScreenContent = () => {
    const key = `${currentModel}_D${currentDraft}`;

    switch (key) {
      case "GDEY0266T90_D1":
        return (
          <div className="layout-266-draft1">
            <div className="top-bar">
              <span className="top-title ep-font-sans">{t.batteryTitle}</span>
              <span className="top-status ep-bg-black">{sysOkText}</span>
            </div>
            <div className="main-grid">
              {displayVoltages.map((v, i) => (
                <div
                  key={i}
                  className={`grid-cell ${isFault ? "ep-bg-black" : ""}`}
                >
                  <span className="cell-label">
                    {t.cell} {i + 1}
                  </span>
                  <span className="cell-val ep-font-mono">{v.toFixed(2)}V</span>
                </div>
              ))}
            </div>
            <div className="footer-bar">
              <div className="soc-container">
                <span
                  className="ep-font-sans"
                  style={{ fontSize: "9px", textTransform: "uppercase" }}
                >
                  {t.soc}
                </span>
                <div className="soc-bar-outer">
                  <div className="soc-bar-inner" style={{ width: `${soc}%` }} />
                </div>
                <span
                  className="ep-font-mono"
                  style={{ fontWeight: "bold", fontSize: "11px" }}
                >
                  {soc}%
                </span>
              </div>
              <div className="footer-current-info ep-font-mono">
                <span>
                  {t.sum}:{sumV}V | {t.chg}:{chgA}A
                </span>
                <span>
                  {t.dchg}:{disA}A
                </span>
              </div>
            </div>
          </div>
        );

      case "GDEY0266T90_D2":
        return (
          <div className="layout-266-draft2">
            <div className="left-soc-panel">
              <span
                className="ep-font-sans"
                style={{
                  fontSize: "10px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {t.socLevel}
              </span>
              <div className="soc-circle-outer">
                <div className="soc-circle-inner ep-font-mono">{soc}%</div>
              </div>
              <div
                className={`status-alert-box ${isFault ? "ep-bg-black" : "ep-bg-light"}`}
              >
                {faultLabel}
              </div>
            </div>
            <div className="right-chart-panel">
              <div
                className="chart-title ep-font-sans"
                style={{ display: "flex", flexDirection: "column", gap: "1px" }}
              >
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <span>
                    {t.sum}:{sumV}V
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "8px",
                    fontWeight: "bold",
                    textAlign: "right",
                  }}
                >
                  {t.chg}:{chgA}A / {t.dchg}:{disA}A
                </div>
              </div>
              <div className="chart-bars-container">
                {displayVoltages.map((v, i) => {
                  const pct = isFault
                    ? 0
                    : Math.min(100, Math.max(0, ((v - 2.5) / 1.15) * 100));
                  return (
                    <div key={i} className="chart-bar-wrapper">
                      <div className="chart-bar-outer">
                        <span className="chart-bar-val ep-font-mono">
                          {v.toFixed(2)}
                        </span>
                        <div
                          className={`chart-bar-inner ${isFault ? "unbalance-highlight" : ""}`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span className="chart-bar-label">C{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "GDEY0266T90_D3":
        return (
          <div className="layout-266-draft3">
            <div className="big-soc-section">
              <span
                className="sys-label ep-font-sans"
                style={{ textTransform: "uppercase" }}
              >
                {t.socLevel}
              </span>
              <div className="big-soc-num ep-font-mono">{soc}%</div>
              <div
                className={`sys-status-text ${isFault ? "ep-bg-black" : "sys-status-normal"}`}
              >
                {faultLabel}
              </div>
            </div>
            <div className="values-list-section">
              <span className="list-title ep-font-sans">{t.cellVoltages}</span>
              <div className="list-items ep-font-mono">
                {displayVoltages.map((v, i) => (
                  <div key={i} className="list-item">
                    C{i + 1}: {v.toFixed(2)}V
                  </div>
                ))}
              </div>
              <div className="aux-info ep-font-mono">
                <div>
                  {t.sum}: {sumV}V
                </div>
                <div>
                  {t.chg}: {chgA}A
                </div>
                <div>
                  {t.dchg}: {disA}A
                </div>
              </div>
            </div>
          </div>
        );

      case "GDEY027T91_D1":
        return (
          <div className="layout-27-draft1">
            <div
              className="header-title ep-font-sans"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                marginBottom: "4px",
                paddingBottom: "2px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                }}
              >
                <span>{t.diagTitle}</span>
                <span>
                  {t.sum}:{sumV}V
                </span>
              </div>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: "bold",
                  textAlign: "right",
                }}
              >
                {t.chg}:{chgA}A / {t.dchg}:{disA}A
              </div>
            </div>
            <div className="content-body">
              <div className="battery-visual-panel">
                <div className="battery-graphic">
                  <div
                    className={`battery-fill ${soc < 25 ? "low-soc" : ""}`}
                    style={{ transform: `scaleY(${soc / 100})` }}
                  />
                </div>
                <span className="soc-large-text ep-font-mono">{soc}%</span>
                <div
                  className={`system-status-indicator ${isFault ? "ep-bg-black" : "ep-bg-light"}`}
                >
                  {passText}
                </div>
              </div>
              <div className="cell-table-panel">
                <table className="cell-table">
                  <thead>
                    <tr>
                      <th className="ep-font-sans">{t.cell}</th>
                      <th
                        className="ep-font-sans"
                        style={{ textAlign: "right" }}
                      >
                        {t.volts}
                      </th>
                      <th
                        className="ep-font-sans"
                        style={{ textAlign: "right" }}
                      >
                        {t.status}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayVoltages.map((v, i) => (
                      <tr key={i} className={isFault ? "cell-fault-row" : ""}>
                        <td>Cell 0{i + 1}</td>
                        <td style={{ textAlign: "right" }}>{v.toFixed(2)}V</td>
                        <td style={{ textAlign: "right", fontSize: "10px" }}>
                          {isFault ? t.err : t.ok}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "GDEY027T91_D2":
        return (
          <div className="layout-27-draft2">
            <div className="top-section">
              <div className="sub-info ep-font-mono">
                <span>
                  {t.packSumVolt}: {sumV}V
                </span>
                <span className="sep">|</span>
                <span>
                  {t.chg}:{chgA}A
                </span>
                <span>
                  {t.dchg}:{disA}A
                </span>
              </div>
              <div className="soc-block ep-font-mono">
                <span
                  className="soc-lbl"
                  style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                >
                  SOC
                </span>
                <span className="soc-val">{soc}%</span>
              </div>
            </div>

            <div
              className={`fault-alert-strip ${isFault ? "ep-bg-black" : "ep-bg-white ep-border-dashed"}`}
            >
              {t.status}: {faultLabel}
            </div>

            <div className="bars-panel">
              {displayVoltages.map((v, i) => {
                const pct = isFault
                  ? 0
                  : Math.min(100, Math.max(0, ((v - 2.5) / 1.15) * 100));
                return (
                  <div key={i} className="bar-row">
                    <span className="bar-row-label ep-font-mono">C{i + 1}</span>
                    <div className="bar-outer">
                      <div
                        className={`bar-inner ${isFault ? "warning-bar" : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="bar-row-val ep-font-mono">
                      {v.toFixed(2)}V
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "GDEY027T91_D3":
        const msgText = isFault
          ? t.diagMsgFault.replace("{code}", formattedFault)
          : t.diagMsgNormal
              .replace("{sumV}", sumV)
              .replace("{chg}", t.chg)
              .replace("{chgA}", chgA)
              .replace("{dchg}", t.dchg)
              .replace("{disA}", disA);

        return (
          <div className="layout-27-draft3">
            <div className="circle-stage">
              <div className="segmented-battery">
                <div className="segment-border" />
                <span className="segmented-soc-num ep-font-mono">{soc}%</span>
                <span
                  className="segmented-label ep-font-sans"
                  style={{ textTransform: "uppercase" }}
                >
                  {t.soc}
                </span>
              </div>
              <div className="status-speech-bubble">
                <div
                  className="bubble-message ep-font-sans"
                  dangerouslySetInnerHTML={{ __html: msgText }}
                />
              </div>
            </div>

            <div className="grid-voltages">
              {displayVoltages.map((v, i) => (
                <div
                  key={i}
                  className={`grid-item ${isFault ? "ep-bg-black" : ""}`}
                >
                  <div className="grid-label">CELL{i + 1}</div>
                  <div className="grid-val ep-font-mono">{v.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case "GDEY029T94_D1":
        return (
          <div className="layout-29-draft1">
            <div className="soc-visual-block">
              <span className="soc-large-pct ep-font-mono">{soc}%</span>
              <div className="battery-mini-icon">
                <div
                  className="battery-mini-fill"
                  style={{ width: `${soc}%` }}
                />
              </div>
              <span
                className="ep-font-sans"
                style={{
                  fontSize: "7px",
                  fontWeight: "bold",
                  marginTop: "2px",
                }}
              >
                {t.packSoc}
              </span>
            </div>
            <div className="cell-values-row">
              {displayVoltages.map((v, i) => (
                <div
                  key={i}
                  className={`cell-slot ${isFault ? "ep-bg-black" : ""}`}
                >
                  <span className="slot-lbl">C{i + 1}</span>
                  <span className="slot-val ep-font-mono">{v.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className={`fault-sidebar ${isFault ? "ep-bg-black" : ""}`}>
              <span className="fault-icon-symbol">{isFault ? "⚠" : "✔"}</span>
              <span className="fault-text-desc ep-font-sans">{sysOkText}</span>
              <span
                className="ep-font-mono"
                style={{
                  fontSize: "7px",
                  fontWeight: "bold",
                  marginTop: "2px",
                  whiteSpace: "nowrap",
                }}
              >
                {t.sum}:{sumV}V
              </span>
              <div
                className="ep-font-mono"
                style={{
                  fontSize: "6px",
                  fontWeight: "bold",
                  marginTop: "1px",
                  lineHeight: 1.15,
                  textAlign: "center",
                }}
              >
                <div>
                  {t.chg}:{chgA}A
                </div>
                <div>
                  {t.dchg}:{disA}A
                </div>
              </div>
            </div>
          </div>
        );

      case "GDEY029T94_D2":
        return (
          <div className="layout-29-draft2">
            <div className="split-left ep-bg-black">
              <span className="split-title ep-font-sans">{t.sysLife}</span>
              <div className="split-soc-num ep-font-mono">{soc}%</div>
              <div className="split-fault-box ep-bg-white ep-font-sans">
                {passText}
              </div>
            </div>
            <div className="split-right">
              <div className="bar-chart-title ep-font-sans">
                <span>
                  {t.sum}: {sumV}V
                </span>
                <span>
                  {t.chg}:{chgA}A / {t.dchg}:{disA}A
                </span>
              </div>
              <div className="horizontal-charts-container">
                {displayVoltages.map((v, i) => {
                  const pct = isFault
                    ? 0
                    : Math.min(100, Math.max(0, ((v - 2.5) / 1.15) * 100));
                  return (
                    <div key={i} className="h-bar-row">
                      <span className="h-label">C{i + 1}</span>
                      <div className="h-bar-outer">
                        <div
                          className="h-bar-inner"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isFault
                              ? "var(--epaper-black)"
                              : "var(--epaper-dark-gray)",
                          }}
                        />
                      </div>
                      <span className="h-val ep-font-mono">{v.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "GDEY029T94_D3":
        return (
          <div className="layout-29-draft3">
            <div className="minimal-top">
              <div className="min-soc-block">
                <span className="min-lbl ep-font-sans">{t.packCapacity}</span>
                <span className="min-soc-val ep-font-mono">{soc}%</span>
              </div>
              <div className="min-sum-block ep-font-mono">
                <span className="min-lbl ep-font-sans">{t.packSumVolt}</span>
                <span className="min-sum-val">{sumV}V</span>
              </div>
              <div
                className={`min-status-badge ${isFault ? "ep-bg-black" : "min-status-normal"}`}
              >
                {faultLabel}
              </div>
            </div>

            <div className="minimal-center-voltages ep-font-mono">
              {displayVoltages.map((v, i) => (
                <div key={i} className="min-voltage-item">
                  <span className="min-cell-name">C{i + 1}</span>
                  <span className="min-cell-val">
                    {v.toFixed(2)}
                    <small>V</small>
                  </span>
                </div>
              ))}
            </div>

            <div className="minimal-bottom ep-font-mono">
              <span>
                {t.chg}: {chgA}A
              </span>
              <span className="min-divider">|</span>
              <span>
                {t.dchg}: {disA}A
              </span>
            </div>
          </div>
        );

      default:
        return <div>Unknown Template</div>;
    }
  };

  return (
    <div className="epaper-standalone-app">
      {/* Scoped CSS Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Fira+Code:wght@400;500&display=swap');

        .epaper-standalone-app {
          --bg-dark: #0f1013;
          --bg-sidebar: #15171c;
          --bg-panel: #1d212a;
          --border-color: #2e3545;
          --text-primary: #f0f3f8;
          --text-secondary: #9aa4b7;
          --accent-blue: #10b981;
          --accent-green: #10b981;
          --accent-orange: #f59e0b;
          --accent-red: #ef4444;

          --epaper-bg: #e3e4e0;
          --epaper-black: #0a0b0a;
          --epaper-dark-gray: #0a0b0a;
          --epaper-light-gray: #e3e4e0;
          --epaper-white: #f4f5f0;
          --epaper-text-sec: #9aa4b7;

          display: flex;
          width: 100%;
          height: 100%;
          min-height: 0;
          flex: 1;
          background-color: var(--bg-dark);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          overflow: hidden;
          position: relative;
          border-radius: 8px;
        }

        .epaper-standalone-app * {
          box-sizing: border-box;
        }

        /* Sidebar Left */
        .epaper-left-sidebar {
          width: 340px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 5;
          overflow: hidden;
          flex-shrink: 0;
        }

        .epaper-sidebar-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color);
          background-color: var(--bg-panel);
          flex-shrink: 0;
        }

        .epaper-sidebar-close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          padding: 2px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .epaper-sidebar-close-btn:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.12);
        }

        .epaper-sidebar-backdrop {
          display: none;
        }

        .epaper-left-sidebar.collapsed {
          margin-left: -340px;
        }

        .epaper-sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .epaper-control-group {
          margin-bottom: 20px;
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 14px;
        }

        .epaper-group-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--accent-blue);
          margin-bottom: 12px;
          display: block;
        }

        .epaper-control-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .epaper-switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }

        .epaper-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .epaper-slider-round {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--border-color);
          transition: .3s;
          border-radius: 20px;
        }

        .epaper-slider-round:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }

        .epaper-switch input:checked + .epaper-slider-round {
          background-color: var(--accent-blue);
        }

        .epaper-switch input:checked + .epaper-slider-round:before {
          transform: translateX(20px);
        }

        .epaper-btn-group {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .epaper-btn {
          flex: 1;
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.15s ease;
        }

        .epaper-btn:hover {
          background-color: var(--border-color);
        }

        .epaper-btn.primary {
          background-color: var(--accent-blue);
          border-color: var(--accent-blue);
          color: #fff;
        }

        .epaper-btn.primary:hover {
          background-color: #2563eb;
        }

        .epaper-select {
          width: 100%;
          background-color: var(--bg-sidebar);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 12px;
          outline: none;
        }

        .epaper-slider-control {
          margin-bottom: 12px;
        }

        .epaper-slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 6px;
        }

        .epaper-slider-val {
          font-family: 'Fira Code', monospace;
          color: var(--accent-blue);
          font-weight: 600;
        }

        .epaper-range-slider {
          width: 100%;
          -webkit-appearance: none;
          background: var(--border-color);
          height: 5px;
          border-radius: 3px;
          outline: none;
        }

        .epaper-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent-blue);
          cursor: pointer;
        }

        .epaper-cell-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .epaper-cell-row span {
          font-size: 11px;
          font-family: 'Fira Code', monospace;
          width: 20px;
        }

        .epaper-cell-val {
          width: 44px !important;
          text-align: right;
          font-size: 11px;
          color: var(--text-secondary);
        }

        /* Main Workbench */
        .epaper-workbench {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          position: relative;
          background-image: 
            radial-gradient(var(--border-color) 1px, transparent 1px),
            radial-gradient(var(--border-color) 1px, var(--bg-dark) 1px);
          background-size: 24px 24px;
          background-position: 0 0, 12px 12px;
          overflow: hidden;
        }

        .epaper-toggle-btn {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 8;
          width: 36px;
          height: 36px;
          background-color: rgba(21, 23, 28, 0.85);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          border-radius: 6px;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(8px);
        }

        .epaper-stage-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          padding: 40px;
        }

        /* Hardware Frame & PCB */
        .epaper-hardware-frame {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center center;
          cursor: grab;
          user-select: none;
        }

        .epaper-hardware-frame.is-dragging {
          cursor: grabbing;
          transition: none;
        }

        .epaper-pcb-board {
          position: absolute;
          width: calc(${activeSpec.width}px + 64px);
          height: calc(${activeSpec.height}px + 82px);
          background-color: #0e3020;
          border-radius: 10px;
          z-index: 1;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), 0 2px 5px rgba(255, 255, 255, 0.05) inset;
          border: 2px solid #1a5c3d;
          padding: 10px;
          top: -18px;
          left: -18px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .epaper-pcb-traces {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.15;
          background-image: 
            linear-gradient(45deg, #e3a817 25%, transparent 25%),
            linear-gradient(-45deg, #e3a817 25%, transparent 25%),
            linear-gradient(90deg, #e3a817 1px, transparent 1px),
            linear-gradient(0deg, #e3a817 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          border-radius: 6px;
        }

        .epaper-fpc-cable {
          position: absolute;
          width: calc(${activeSpec.width}px - 80px);
          height: 35px;
          background: linear-gradient(90deg, #e59f27, #cf8212, #e59f27);
          border: 1px solid #9e5d03;
          z-index: 2;
          top: calc(${activeSpec.height}px + 10px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          background-image: repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 6px);
        }

        .epaper-module {
          position: relative;
          width: fit-content;
          height: fit-content;
          background-color: #ffffff;
          border-radius: 4px;
          z-index: 3;
          padding: 2px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          border: 1px solid #cccccc;
        }

        .epaper-bezel {
          width: fit-content;
          height: fit-content;
          background-color: #212121;
          border-radius: 2px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .epaper-model-label {
          font-size: 8px;
          color: #999999;
          font-family: 'Fira Code', monospace;
          letter-spacing: 1px;
        }

        .epaper-screen-border {
          border: 1.5px solid #0a0b0a;
          border-radius: 1px;
          overflow: hidden;
          width: fit-content;
          height: fit-content;
          box-sizing: border-box;
        }

        .epaper-active-screen {
          position: relative;
          width: ${activeSpec.width}px;
          height: ${activeSpec.height}px;
          background-color: var(--epaper-bg);
          overflow: hidden;
          user-select: none;
          isolation: isolate;
          contain: paint;
          transform: translateZ(0);
          box-sizing: border-box;
        }

        .epaper-standalone-app ul,
        .epaper-standalone-app ol,
        .epaper-standalone-app li,
        .epaper-active-screen ul,
        .epaper-active-screen ol,
        .epaper-active-screen li {
          list-style: none !important;
          list-style-type: none !important;
          margin: 0;
          padding: 0;
        }

        .epaper-active-screen * {
          font-smooth: never;
          -webkit-font-smoothing: none;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          list-style: none !important;
        }

        .epaper-paper-texture {
          position: absolute;
          inset: 0;
          z-index: 50;
          pointer-events: none;
          opacity: 0.13;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }

        .epaper-refresh-flicker {
          position: absolute;
          inset: 0;
          z-index: 100;
          pointer-events: none;
          background-color: transparent;
        }

        .epaper-refresh-flicker.full-active {
          animation: epaper-full-refresh-cycle 1.8s steps(1, end) 1;
        }

        @keyframes epaper-full-refresh-cycle {
          0%   { background-color: var(--epaper-black); }
          15%  { background-color: var(--epaper-white); }
          30%  { background-color: var(--epaper-black); }
          45%  { background-color: var(--epaper-white); }
          60%  { background-color: var(--epaper-black); }
          75%  { background-color: var(--epaper-white); }
          100% { background-color: transparent; }
        }

        .epaper-screen-content {
          width: 100%;
          height: 100%;
          color: var(--epaper-black);
          image-rendering: pixelated;
          letter-spacing: -0.2px;
          overflow: hidden;
        }

        .epaper-screen-content.partial-flash {
          animation: epaper-partial-refresh-flicker 0.20s linear 1;
        }

        @keyframes epaper-partial-refresh-flicker {
          0%   { filter: brightness(1.15) contrast(0.9); }
          50%  { filter: brightness(0.92) contrast(1.05); }
          100% { filter: none; }
        }

        /* Common Screen Typography & Helpers */
        .ep-font-mono { font-family: 'Share Tech Mono', 'Courier New', monospace; }
        .ep-font-sans { font-family: 'Inter', sans-serif; font-weight: 600; }
        .ep-bg-black { background-color: var(--epaper-black); color: var(--epaper-white); }
        .ep-bg-white { background-color: var(--epaper-white); color: var(--epaper-black); }
        .ep-bg-light { background-color: var(--epaper-light-gray); color: var(--epaper-black); }
        .ep-border-dashed { border: 1px dashed var(--epaper-black); }

        /* Draft Layouts - Scaled to fit DPI & Pixel Specs */
        .layout-266-draft1 { display: flex; flex-direction: column; height: 100%; padding: 4px; box-sizing: border-box; overflow: hidden; }
        .layout-266-draft1 .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px double var(--epaper-black); padding-bottom: 2px; margin-bottom: 3px; }
        .layout-266-draft1 .top-title { font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .layout-266-draft1 .top-status { font-size: 10px; font-family: 'Share Tech Mono', monospace; padding: 0 4px; border: 1px solid var(--epaper-black); }
        .layout-266-draft1 .main-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; flex: 1; min-height: 0; }
        .layout-266-draft1 .grid-cell { border: 1px solid var(--epaper-black); padding: 3px 4px; display: flex; flex-direction: column; justify-content: space-between; }
        .layout-266-draft1 .cell-label { font-size: 8.5px; font-weight: bold; }
        .layout-266-draft1 .cell-val { font-size: 14px; font-family: 'Share Tech Mono', monospace; font-weight: bold; text-align: right; }
        .layout-266-draft1 .footer-bar { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--epaper-black); padding-top: 3px; margin-top: 3px; font-size: 10px; }
        .layout-266-draft1 .soc-container { display: flex; align-items: center; gap: 4px; width: 45%; }
        .layout-266-draft1 .soc-bar-outer { flex: 1; height: 8px; border: 1px solid var(--epaper-black); padding: 1px; }
        .layout-266-draft1 .soc-bar-inner { height: 100%; background-color: var(--epaper-black); }
        .layout-266-draft1 .footer-current-info { font-size: 8px; font-family: 'Share Tech Mono', monospace; font-weight: bold; text-align: right; display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }

        .layout-266-draft2 { display: flex; height: 100%; padding: 4px; gap: 6px; box-sizing: border-box; overflow: hidden; }
        .layout-266-draft2 .left-soc-panel { width: 86px; border-right: 1.5px dashed var(--epaper-black); display: flex; flex-direction: column; justify-content: space-around; align-items: center; padding-right: 4px; }
        .layout-266-draft2 .soc-circle-outer { width: 50px; height: 50px; border-radius: 50%; border: 3px solid var(--epaper-black); display: flex; align-items: center; justify-content: center; }
        .layout-266-draft2 .soc-circle-inner { font-size: 15px; font-family: 'Share Tech Mono', monospace; font-weight: 900; }
        .layout-266-draft2 .status-alert-box { width: 100%; text-align: center; font-size: 10px; font-weight: bold; padding: 2px 0; }
        .layout-266-draft2 .right-chart-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .layout-266-draft2 .chart-bars-container { flex: 1; display: flex; justify-content: space-around; align-items: flex-end; border-bottom: 2px solid var(--epaper-black); padding-bottom: 3px; padding-top: 8px; }
        .layout-266-draft2 .chart-bar-wrapper { display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; width: 22px; }
        .layout-266-draft2 .chart-bar-outer { width: 12px; height: 46px; border: 1px solid var(--epaper-black); background-color: var(--epaper-white); display: flex; align-items: flex-end; position: relative; }
        .layout-266-draft2 .chart-bar-inner { width: 100%; background-color: var(--epaper-black); }
        .layout-266-draft2 .chart-bar-label { font-size: 8px; margin-top: 2px; font-weight: bold; }
        .layout-266-draft2 .chart-bar-val { font-size: 8px; position: absolute; top: -11px; left: 50%; transform: translateX(-50%); font-weight: bold; }

        .layout-266-draft3 { display: flex; height: 100%; padding: 5px; box-sizing: border-box; overflow: hidden; }
        .layout-266-draft3 .big-soc-section { flex: 1.1; display: flex; flex-direction: column; justify-content: center; border-right: 2px solid var(--epaper-black); padding-right: 6px; }
        .layout-266-draft3 .sys-label { font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .layout-266-draft3 .big-soc-num { font-size: 44px; font-family: 'Share Tech Mono', monospace; font-weight: 800; line-height: 0.95; margin: 2px 0; }
        .layout-266-draft3 .sys-status-text { font-size: 10px; font-weight: bold; padding: 2px 6px; border: 1px solid var(--epaper-black); margin-top: 4px; text-align: center; }
        .layout-266-draft3 .values-list-section { flex: 1; padding-left: 8px; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
        .layout-266-draft3 .list-title { font-size: 9px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid var(--epaper-black); padding-bottom: 2px; }
        .layout-266-draft3 .list-items { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 6px; margin: 2px 0 1px 0; }
        .layout-266-draft3 .list-item { font-size: 11px; font-family: 'Share Tech Mono', monospace; font-weight: bold; }
        .layout-266-draft3 .aux-info { font-size: 8.5px; font-family: 'Share Tech Mono', monospace; font-weight: 600; letter-spacing: 0.2px; border-top: 1px solid var(--epaper-black); padding-top: 2px; margin-top: 1px; display: flex; flex-direction: column; align-items: flex-end; line-height: 1.15; }

        .layout-27-draft1 { display: flex; flex-direction: column; height: 100%; padding: 4px; box-sizing: border-box; overflow: hidden; }
        .layout-27-draft1 .content-body { display: flex; flex: 1; gap: 8px; min-height: 0; }
        .layout-27-draft1 .battery-visual-panel { flex: 0.8; border: 1px solid var(--epaper-black); display: flex; flex-direction: column; justify-content: space-around; align-items: center; padding: 4px; }
        .layout-27-draft1 .battery-graphic { width: 30px; height: 60px; border: 2px solid var(--epaper-black); border-radius: 3px; position: relative; padding: 2px; }
        .layout-27-draft1 .battery-fill { width: 100%; height: 100%; background-color: var(--epaper-black); transform-origin: bottom center; }
        .layout-27-draft1 .soc-large-text { font-size: 20px; font-family: 'Share Tech Mono', monospace; font-weight: bold; }
        .layout-27-draft1 .cell-table-panel { flex: 1.2; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
        .layout-27-draft1 .cell-table { width: 100%; border-collapse: collapse; }
        .layout-27-draft1 .cell-table th { font-size: 8.5px; border-bottom: 1.5px solid var(--epaper-black); text-align: left; padding-bottom: 2px; }
        .layout-27-draft1 .cell-table td { padding: 1px 0; font-size: 10px; font-family: 'Share Tech Mono', monospace; font-weight: bold; border-bottom: 1px solid var(--epaper-bg); }
        .layout-27-draft1 .system-status-indicator { font-size: 8.5px; font-weight: bold; padding: 2px; text-align: center; border: 1px solid var(--epaper-black); margin-top: 3px; }

        .layout-27-draft2 { display: flex; flex-direction: column; height: 100%; padding: 6px 8px; box-sizing: border-box; overflow: hidden; }
        .layout-27-draft2 .top-section { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--epaper-black); padding-bottom: 3px; margin-bottom: 4px; }
        .layout-27-draft2 .sub-info { font-size: 8px; color: var(--epaper-black); font-weight: bold; display: flex; gap: 4px; align-items: center; line-height: 1; }
        .layout-27-draft2 .sub-info .sep { opacity: 0.5; }
        .layout-27-draft2 .soc-block { display: flex; align-items: baseline; gap: 3px; background-color: var(--epaper-black); color: var(--epaper-white); padding: 1px 5px; border-radius: 1px; }
        .layout-27-draft2 .soc-lbl { font-size: 7.5px; font-weight: bold; text-transform: uppercase !important; }
        .layout-27-draft2 .soc-val { font-size: 12px; font-weight: 900; line-height: 1; }
        .layout-27-draft2 .fault-alert-strip { font-size: 9px; font-weight: bold; padding: 2px 4px; text-align: center; border: 1px solid var(--epaper-black); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.1; }
        .layout-27-draft2 .bars-panel { display: flex; flex-direction: column; gap: 3px; flex: 1; justify-content: flex-start; min-height: 0; }
        .layout-27-draft2 .bar-row { display: flex; align-items: center; gap: 5px; height: 14px; }
        .layout-27-draft2 .bar-row-label { font-size: 8.5px; font-weight: bold; width: 16px; text-align: left; }
        .layout-27-draft2 .bar-outer { flex: 1; height: 8px; border: 1px solid var(--epaper-black); background-color: var(--epaper-white); padding: 1px; }
        .layout-27-draft2 .bar-inner { height: 100%; background-color: var(--epaper-black); }
        .layout-27-draft2 .bar-row-val { font-size: 9px; font-weight: bold; width: 34px; text-align: right; }

        .layout-27-draft3 { display: flex; flex-direction: column; height: 100%; padding: 5px; justify-content: space-between; box-sizing: border-box; overflow: hidden; }
        .layout-27-draft3 .circle-stage { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 2px; }
        .layout-27-draft3 .segmented-battery { width: 70px; height: 70px; border: 3.5px solid var(--epaper-black); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
        .layout-27-draft3 .segmented-soc-num { font-size: 20px; font-family: 'Share Tech Mono', monospace; font-weight: 900; }
        .layout-27-draft3 .segmented-label { font-size: 7.5px; font-weight: bold; }
        .layout-27-draft3 .status-speech-bubble { flex: 1; border: 1.5px solid var(--epaper-black); border-radius: 4px; padding: 4px 6px; min-height: 54px; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
        .layout-27-draft3 .bubble-message { font-size: 9px; font-weight: 700; line-height: 1.3; }
        .layout-27-draft3 .grid-voltages { display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; border-top: 1.5px double var(--epaper-black); padding-top: 4px; margin-top: 3px; }
        .layout-27-draft3 .grid-item { text-align: center; border: 1px solid var(--epaper-black); padding: 2px 0; }
        .layout-27-draft3 .grid-label { font-size: 7.5px; font-family: 'Share Tech Mono', monospace; }
        .layout-27-draft3 .grid-val { font-size: 9.5px; font-family: 'Share Tech Mono', monospace; font-weight: bold; }

        .layout-29-draft1 { display: flex; align-items: center; height: 100%; padding: 2px; box-sizing: border-box; overflow: hidden; }
        .layout-29-draft1 .soc-visual-block { width: 62px; border-right: 1.5px solid var(--epaper-black); height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding-right: 2px; flex-shrink: 0; }
        .layout-29-draft1 .soc-large-pct { font-size: 22px; font-family: 'Share Tech Mono', monospace; font-weight: bold; }
        .layout-29-draft1 .battery-mini-icon { width: 30px; height: 14px; border: 1.5px solid var(--epaper-black); position: relative; padding: 1px; margin-top: 2px; }
        .layout-29-draft1 .battery-mini-fill { height: 100%; background-color: var(--epaper-black); }
        .layout-29-draft1 .cell-values-row { flex: 1; padding: 0 6px; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr 1fr; gap: 3px; min-width: 0; }
        .layout-29-draft1 .cell-slot { border: 1px dashed var(--epaper-black); padding: 2px 4px; display: flex; justify-content: space-between; align-items: center; gap: 4px; }
        .layout-29-draft1 .slot-lbl { font-size: 8.5px; font-family: 'Share Tech Mono', monospace; font-weight: bold; }
        .layout-29-draft1 .slot-val { font-size: 11.5px; font-family: 'Share Tech Mono', monospace; font-weight: 800; }
        .layout-29-draft1 .fault-sidebar { width: 62px; border-left: 1.5px solid var(--epaper-black); height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0 2px; text-align: center; flex-shrink: 0; }
        .layout-29-draft1 .fault-icon-symbol { font-size: 14px; margin-bottom: 1px; font-weight: bold; }
        .layout-29-draft1 .fault-text-desc { font-size: 7.5px; font-weight: 900; line-height: 1.1; text-transform: uppercase; }

        .layout-29-draft2 { display: flex; height: 100%; padding: 0; box-sizing: border-box; overflow: hidden; }
        .layout-29-draft2 .split-left { width: 90px; height: 100%; padding: 5px; display: flex; flex-direction: column; justify-content: space-between; flex-shrink: 0; }
        .layout-29-draft2 .split-title { font-size: 9px; font-weight: bold; text-transform: uppercase; }
        .layout-29-draft2 .split-soc-num { font-size: 30px; font-family: 'Share Tech Mono', monospace; font-weight: 900; line-height: 1; }
        .layout-29-draft2 .split-fault-box { font-size: 8.5px; font-weight: bold; padding: 2px; text-align: center; }
        .layout-29-draft2 .split-right { flex: 1; height: 100%; padding: 5px; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
        .layout-29-draft2 .bar-chart-title { font-size: 8.5px; font-weight: bold; display: flex; justify-content: space-between; }
        .layout-29-draft2 .horizontal-charts-container { display: flex; flex-direction: column; gap: 2.5px; margin: 2px 0; }
        .layout-29-draft2 .h-bar-row { display: flex; align-items: center; gap: 4px; height: 11px; }
        .layout-29-draft2 .h-label { font-size: 8px; font-family: 'Share Tech Mono', monospace; width: 14px; }
        .layout-29-draft2 .h-bar-outer { flex: 1; height: 6px; border: 1px solid var(--epaper-black); position: relative; }
        .layout-29-draft2 .h-bar-inner { height: 100%; background-color: var(--epaper-black); }
        .layout-29-draft2 .h-val { font-size: 8.5px; font-family: 'Share Tech Mono', monospace; font-weight: bold; width: 32px; text-align: right; }

        .layout-29-draft3 { display: flex; flex-direction: column; height: 100%; padding: 5px 8px; justify-content: space-between; box-sizing: border-box; overflow: hidden; }
        .layout-29-draft3 .minimal-top { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--epaper-black); padding-bottom: 3px; }
        .layout-29-draft3 .min-soc-block,
        .layout-29-draft3 .min-sum-block { display: flex; align-items: baseline; gap: 5px; }
        .layout-29-draft3 .min-lbl { font-size: 9px; font-weight: bold; text-transform: uppercase; margin-right: 2px; }
        .layout-29-draft3 .min-soc-val { font-size: 17px; font-family: 'Share Tech Mono', monospace; font-weight: 900; line-height: 1; }
        .layout-29-draft3 .min-sum-val { font-size: 14.5px; font-family: 'Share Tech Mono', monospace; font-weight: 900; line-height: 1; }
        .layout-29-draft3 .min-status-badge { border: 1px solid var(--epaper-black); padding: 2px 5px; font-size: 9.5px; font-weight: 800; }
        .layout-29-draft3 .minimal-center-voltages { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px 10px; padding: 3px 2px; flex: 1; align-content: center; }
        .layout-29-draft3 .min-voltage-item { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px dashed var(--epaper-black); padding-bottom: 1px; }
        .layout-29-draft3 .min-cell-name { font-size: 9px; font-family: 'Share Tech Mono', monospace; font-weight: bold; }
        .layout-29-draft3 .min-cell-val { font-size: 13.5px; font-family: 'Share Tech Mono', monospace; font-weight: 900; }
        .layout-29-draft3 .minimal-bottom { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 8.5px; font-family: 'Share Tech Mono', monospace; font-weight: bold; border-top: 1px solid var(--epaper-black); padding-top: 3px; }

        /* Workbench Footer */
        .epaper-footer {
          height: 64px;
          padding: 0 24px;
          background-color: rgba(15, 16, 19, 0.85);
          border-top: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          backdrop-filter: blur(8px);
          flex-shrink: 0;
        }

        .epaper-info-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .epaper-info-tag .tag-title {
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 13px;
          line-height: 1;
        }

        .epaper-info-tag .tag-value {
          color: var(--text-primary);
          font-family: 'Fira Code', monospace;
          font-weight: 600;
          font-size: 13px;
          line-height: 1;
        }

        .epaper-disclaimer {
          margin-left: auto;
          display: flex;
          align-items: center;
        }

        .epaper-disclaimer .disclaimer-text {
          font-size: 11px;
          color: var(--accent-blue);
          font-weight: 500;
          letter-spacing: 0.2px;
          line-height: 1;
        }

        /* Sidebar Left (Draft Cards & Voting) */
        .epaper-draft-sidebar {
          width: 280px;
          background-color: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100%;
          flex-shrink: 0;
          z-index: 6;
        }

        .epaper-right-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }

        .epaper-right-header h2 {
          font-size: 15px;
          font-weight: 700;
        }

        .epaper-draft-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .epaper-draft-card {
          background-color: var(--bg-panel);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;

          &:hover {
            border-color: var(--accent-blue);
            background-color: rgba(16, 185, 129, 0.08);
          }

          &.active {
            background-color: rgba(16, 185, 129, 0.15);
            border-color: var(--accent-blue);
          }
        }

        .epaper-draft-num {
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-blue);
          background: rgba(16, 185, 129, 0.15);
          padding: 4px 7px;
          border-radius: 6px;
          min-width: 28px;
          text-align: center;
        }

        .epaper-draft-card.active .epaper-draft-num {
          background: var(--accent-blue);
          color: #fff;
        }

        .epaper-draft-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .epaper-draft-title {
          font-size: 12px;
          font-weight: 600;
        }

        .epaper-draft-tag {
          font-size: 10px;
          color: var(--text-secondary);
          font-family: 'Fira Code', monospace;
        }

        .epaper-vote-footer {
          padding: 14px 16px;
          border-top: 1px solid var(--border-color);
        }

        .epaper-vote-btn {
          width: 100%;
          height: 40px;
          background-color: #10b981;
          border: none;
          border-radius: 8px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s ease;
          letter-spacing: 0.5px;
        }

        .epaper-vote-btn:hover {
          background-color: #059669;
        }

        .epaper-vote-btn:active {
          opacity: 0.9;
        }

        /* Mobile Responsive Enhancements (< 768px) */
        @media (max-width: 768px) {
          .epaper-standalone-app {
            flex-direction: column;
            height: 100%;
            overflow-y: auto;
          }

          .epaper-draft-sidebar {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            z-index: 20;
          }

          .epaper-right-header {
            padding: 10px 14px;
          }

          .epaper-right-header h2 {
            font-size: 13px;
          }

          .epaper-draft-list {
            flex-direction: row;
            overflow-x: auto;
            padding: 8px 12px;
            gap: 8px;
            -webkit-overflow-scrolling: touch;
          }

          .epaper-draft-card {
            flex-shrink: 0;
            width: 160px;
            padding: 8px 10px;
          }

          .epaper-vote-footer {
            padding: 8px 12px;
          }

          .epaper-vote-btn {
            height: 36px;
            font-size: 12px;
          }

          .epaper-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            z-index: 140;
          }

          .epaper-left-sidebar {
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 85%;
            max-width: 320px;
            z-index: 150;
            box-shadow: 10px 0 30px rgba(0, 0, 0, 0.7);
          }

          .epaper-left-sidebar.collapsed {
            margin-left: -100%;
          }

          .epaper-workbench {
            flex: 1;
            width: 100%;
            min-height: 420px;
          }

          .epaper-stage-container {
            padding: 20px 10px;
          }

          .epaper-footer {
            height: auto;
            padding: 10px 14px;
            flex-wrap: wrap;
            gap: 6px 12px;
            font-size: 11px;
          }

          .epaper-info-tag, .epaper-info-tag .tag-title, .epaper-info-tag .tag-value {
            font-size: 11px;
          }

          .epaper-disclaimer .disclaimer-text {
            font-size: 10px;
          }
        }
      `}</style>

      {/* Left Sidebar (Draft Selection & Voting) */}
      <aside className="epaper-draft-sidebar">
        <div className="epaper-right-header">
          <h2>전자종이 디자인 투표</h2>
          {isVoted && (
            <div style={{ marginTop: "10px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                  fontWeight: 600,
                }}
              >
                <span>투표 진행률</span>
                <span style={{ color: "#10b981" }}>
                  {voteStatus.completedCount} / {voteStatus.totalTargetVoters}명
                  ({voteStatus.progressPercent}%)
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${voteStatus.progressPercent}%`,
                    height: "100%",
                    backgroundColor: "#10b981",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="epaper-draft-list">
          {DRAFT_CARDS.map((card) => {
            const tally = voteStatus.tallies.find(
              (t) => t.selector === String(card.id),
            );
            return (
              <button
                key={card.id}
                type="button"
                className={`epaper-draft-card ${activeDraftId === card.id ? "active" : ""}`}
                onClick={() => handleDraftSelect(card)}
              >
                <span className="epaper-draft-num">
                  {String(card.id).padStart(2, "0")}
                </span>
                <div className="epaper-draft-info">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span className="epaper-draft-title">{card.title}</span>
                  </div>
                  <span className="epaper-draft-tag">{card.modelTag}</span>
                </div>
                {isVoted && tally && tally.count > 0 && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#10b981",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    {tally.count}표 ({tally.pct}%)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          className="epaper-vote-footer"
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          {isVoted && (
            <div
              style={{
                fontSize: "11px",
                color: "#10b981",
                fontWeight: 600,
                textAlign: "center",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(16, 185, 129, 0.25)",
              }}
            >
              ✓ 시안 {votedSelector || ""}번 투표 완료
            </div>
          )}

          {(!voterUuid || !isUuidValid) && (
            <div
              style={{
                fontSize: "11px",
                color: "#f59e0b",
                fontWeight: 500,
                textAlign: "center",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                padding: "6px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
            >
              ⚠️ 유효하지 않거나 등록되지 않은 UUID 링크입니다.
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="epaper-vote-btn"
              style={{
                flex: 1,
                opacity: !voterUuid || !isUuidValid || isVoted ? 0.6 : 1,
                cursor:
                  !voterUuid || !isUuidValid || isVoted
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={!voterUuid || !isUuidValid || isVoted}
              onClick={handleVoteClick}
            >
              {isVoted ? "투표해주셔서 감사합니다" : "투표하기"}
            </button>
          </div>
        </div>
      </aside>

      {/* Dim Backdrop Overlay for Mobile Drawer */}
      {!leftSidebarCollapsed && (
        <div
          className="epaper-sidebar-backdrop"
          onClick={() => setLeftSidebarCollapsed(true)}
        />
      )}

      {/* Left Sidebar (Battery Controls) */}
      <aside
        className={`epaper-left-sidebar ${leftSidebarCollapsed ? "collapsed" : ""}`}
      >
        <div className="epaper-sidebar-header">
          <button
            type="button"
            className="epaper-sidebar-close-btn"
            onClick={() => setLeftSidebarCollapsed(true)}
            title="닫기"
          >
            ✕
          </button>
        </div>
        <div className="epaper-sidebar-body">
          <div className="epaper-control-group">
            <span className="epaper-group-title">시뮬레이터 제어</span>
            <div className="epaper-control-row">
              <span>실시간 무작위 데이터</span>
              <label className="epaper-switch">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span className="epaper-slider-round" />
              </label>
            </div>
            <div className="epaper-btn-group">
              <button
                type="button"
                className="epaper-btn"
                onClick={() => triggerPartialRefresh(true)}
              >
                부분 리프레시
              </button>
              <button
                type="button"
                className="epaper-btn primary"
                onClick={triggerFullRefresh}
              >
                전체 리프레시
              </button>
            </div>
          </div>

          <div className="epaper-control-group">
            <span className="epaper-group-title">부가 설정</span>

            <div className="epaper-slider-control">
              <label
                style={{
                  fontSize: "12px",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                디스플레이 언어
              </label>
              <select
                className="epaper-select"
                value={lang}
                onChange={(e) => setLang(e.target.value as "ko" | "ja" | "en")}
              >
                <option value="ko">한국어</option>
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>

            <div className="epaper-slider-control">
              <div className="epaper-slider-header">
                <span>SOC</span>
                <span className="epaper-slider-val">{soc}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={soc}
                onChange={(e) => {
                  setSoc(parseInt(e.target.value));
                  triggerPartialRefresh();
                }}
                className="epaper-range-slider"
              />
            </div>

            <div className="epaper-slider-control">
              <label
                style={{
                  fontSize: "12px",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                Fault 상태 설정
              </label>
              <select
                className="epaper-select"
                value={faultStatus}
                onChange={(e) => handleFaultChange(e.target.value)}
              >
                <option value="Normal">Normal</option>
                {[
                  "E01",
                  "E02",
                  "E03",
                  "E04",
                  "E05",
                  "E06",
                  "E07",
                  "E08",
                  "E12",
                  "E20",
                  "E30",
                ].map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div className="epaper-slider-control">
              <div className="epaper-slider-header">
                <span>충전 전류</span>
                <span className="epaper-slider-val">{chgA}A</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.1"
                value={chgCurr}
                onChange={(e) => {
                  setChgCurr(parseFloat(e.target.value));
                  triggerPartialRefresh();
                }}
                className="epaper-range-slider"
              />
            </div>

            <div className="epaper-slider-control">
              <div className="epaper-slider-header">
                <span>방전 전류</span>
                <span className="epaper-slider-val">{disA}A</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.1"
                value={disCurr}
                onChange={(e) => {
                  setDisCurr(parseFloat(e.target.value));
                  triggerPartialRefresh();
                }}
                className="epaper-range-slider"
              />
            </div>

            <div
              style={{
                borderTop: "1px dashed var(--border-color)",
                paddingTop: "12px",
                marginTop: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                셀별 전압 (C1 ~ C6)
              </span>
              {cellVoltages.map((val, idx) => (
                <div key={idx} className="epaper-cell-row">
                  <span>C{idx + 1}</span>
                  <input
                    type="range"
                    min="2.50"
                    max="3.65"
                    step="0.01"
                    value={val}
                    disabled={isFault}
                    onChange={(e) =>
                      handleCellVoltageChange(idx, parseFloat(e.target.value))
                    }
                    className="epaper-range-slider"
                  />
                  <span className="epaper-cell-val">{val.toFixed(2)}V</span>
                </div>
              ))}
            </div>
          </div>

          <div className="epaper-control-group">
            <span className="epaper-group-title">뷰 설정</span>
            <div className="epaper-control-row">
              <span>스케일 모드</span>
              <select
                className="epaper-select"
                style={{ width: "130px" }}
                value={viewScaleMode}
                onChange={(e) => setViewScaleMode(e.target.value)}
              >
                <option value="fit">자동 크기 맞춤</option>
                <option value="physical">실물 크기 비율</option>
                <option value="pixel">픽셀 1:1 모드</option>
                <option value="zoom-2">200% 확대</option>
                <option value="zoom-3">300% 확대</option>
              </select>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Stage */}
      <main className="epaper-workbench">
        <button
          type="button"
          className="epaper-toggle-btn"
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          title="배터리 설정 패널"
        >
          ☰
        </button>

        <div className="epaper-stage-container" ref={stageContainerRef}>
          <div
            ref={hardwareFrameRef}
            className={`epaper-hardware-frame ${isDragging ? "is-dragging" : ""}`}
            style={{
              transform: `rotate(${viewRotation}deg) scale(${scaleVal})`,
            }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onDoubleClick={() => setViewRotation(0)}
          >
            <div className="epaper-pcb-board">
              <div className="epaper-pcb-traces" />
            </div>

            <div className="epaper-fpc-cable" />

            <div className="epaper-module">
              <div className="epaper-bezel">
                <div className="epaper-model-label">{activeSpec.label}</div>
                <div className="epaper-screen-border">
                  <div className="epaper-active-screen">
                    {paperTexture && <div className="epaper-paper-texture" />}
                    <div
                      className={`epaper-refresh-flicker ${refreshOverlayActive ? "full-active" : ""}`}
                    />
                    <div
                      className={`epaper-screen-content ${partialFlash ? "partial-flash" : ""}`}
                    >
                      {renderScreenContent()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workbench Footer */}
        <footer className="epaper-footer">
          <div className="epaper-info-tag">
            <span className="tag-title">해상도:</span>
            <span className="tag-value">
              {activeSpec.width} x {activeSpec.height} px
            </span>
          </div>
          <div className="epaper-info-tag">
            <span className="tag-title">물리 크기:</span>
            <span className="tag-value">
              {activeSpec.physWidth} x {activeSpec.physHeight} mm
            </span>
          </div>
          <div className="epaper-info-tag">
            <span className="tag-title">DPI:</span>
            <span className="tag-value">{activeSpec.dpi} DPI</span>
          </div>
          <div className="epaper-disclaimer">
            <span className="disclaimer-text">
              ※ 실제 인디케이터와 다를 수 있습니다.
            </span>
          </div>
        </footer>
      </main>

      {/* Toast popup for vote */}
      {voteToast && (
        <div
          style={{
            position: "fixed",
            bottom: "60px",
            right: "20px",
            backgroundColor: "rgba(16, 185, 129, 0.95)",
            color: "#fff",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
            zIndex: 1100,
          }}
        >
          {voteToast}
        </div>
      )}

      {/* Feedback Comment Modal */}
      {showFeedbackModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#181b20",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "440px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                투표하기 : 시안 {activeDraftId}번
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                선택하신 시안 {activeDraftId}번에 대한 의견이나 피드백 남겨주실
                수 있을까요 ?
              </p>
            </div>

            <div>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                의견 (선택사항)
              </label>
              <textarea
                rows={4}
                maxLength={255}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="예: 가독성이 뛰어나고 레이아웃 구성을 선호합니다."
                style={{
                  width: "100%",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  padding: "10px 12px",
                  fontSize: "13px",
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div
                style={{
                  textAlign: "right",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  marginTop: "4px",
                }}
              >
                {commentInput.length} / 255 자
              </div>
            </div>

            {voteError && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "6px",
                  color: "#f87171",
                  fontSize: "12px",
                }}
              >
                {voteError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
                marginTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                disabled={voteSubmitting}
                style={{
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleFeedbackSubmit}
                disabled={voteSubmitting}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: voteSubmitting ? "wait" : "pointer",
                  opacity: voteSubmitting ? 0.7 : 1,
                }}
              >
                {voteSubmitting ? "제출 중..." : "보내기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
