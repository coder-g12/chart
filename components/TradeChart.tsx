import React, { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
} from "lightweight-charts";
import { loadData } from "../utils/dataLoader";
import CandleData from "../utils/types";

const GREEN = "#00ff00";
const RED = "#ff0000";
const DEFAULT_HIST_COLOR = "#ffa500";
const IM_GREEN = "#2ed573";
const IM_RED = "#c0392b";
const MM_GREEN = "#2ecc71";
const MM_RED = "#e74c3c";

const TradeChart: React.FC = () => {
  const [data, setData] = useState<CandleData[]>([]);
  const [priceType, setPriceType] = useState<"candle" | "line">("candle");
  const [showIM, setShowIM] = useState(false);
  const [showMM, setShowMM] = useState(false);
  const [showStrs, setShowStrs] = useState<{ [key: string]: boolean[] }>({
    drive: [false, false, false, false, false],
    harmony: [false, false, false, false, false],
    root: [false, false, false, false, false],
    action: [false, false, false, false, false],
    expand: [false, false, false, false, false],
    live: [false, false, false, false, false],
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [alignOn, setAlignOn] = useState(true);
  const [showTB, setShowTB] = useState(false);
  const [mirrorOn, setMirrorOn] = useState(false);
  const [mocOn, setMocOn] = useState(false); // Added MOC state

  const priceRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<{
    chart: IChartApi;
    priceSeries?: ISeriesApi<"Candlestick" | "Line">;
    imSeries?: ISeriesApi<"Histogram">;
    mmSeries?: ISeriesApi<"Histogram">;
    strSeries: Map<string, ISeriesApi<"Line">>;
    originalStrData: Map<string, LineData[]>;
    originalPriceData?: (CandlestickData | LineData)[];
    originalHistIM?: HistogramData[];
    originalHistMM?: HistogramData[];
    timeToTopBottom?: Map<Time, string>;
    updateStrSeries?: () => void;
    updateMirror?: () => void;
    mirrorActive?: boolean;
    imPriceLine?: any;
    mmPriceLine?: any;
    // MOC related fields
    tbTimestamps?: Time[];
    valuesByLineAndTime?: Map<string, Map<Time, number>>;
    updateMoc?: () => void;
    mocActive?: boolean;
  } | null>(null);

  useEffect(() => {
    loadData().then(setData).catch(console.error);
  }, []);

  const getTime = (d: CandleData): Time => {
    const [dateStr, timeStr] = d.time.split(" ");
    const [month, day, year] = dateStr.split("/").map(Number);
    const [hour, min, sec] = timeStr.split(":").map(Number);
    const date = new Date(year, month - 1, day, hour, min, sec);
    return Math.floor(date.getTime() / 1000) as Time;
  };

  // Binary search to find the index of the most recent timestamp <= target
  const findPreviousTbIndex = (timestamps: Time[], target: Time): number => {
    let left = 0;
    let right = timestamps.length - 1;
    let result = -1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (timestamps[mid] <= target) {
        result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return result;
  };

  const computeColorForType = (
    tb: string | undefined,
    mirrorActive: boolean,
    seriesType: "IM" | "MM"
  ) => {
    if (!tb) return DEFAULT_HIST_COLOR;
    const normalized = tb.toString().toUpperCase();
    let baseColor = DEFAULT_HIST_COLOR;
    if (normalized === "T" || normalized === "ET") {
      baseColor = seriesType === "IM" ? IM_GREEN : MM_GREEN;
    } else if (normalized === "B" || normalized === "EB") {
      baseColor = seriesType === "IM" ? IM_RED : MM_RED;
    }
    if (mirrorActive) {
      if (baseColor === (seriesType === "IM" ? IM_GREEN : MM_GREEN))
        return seriesType === "IM" ? IM_RED : MM_RED;
      if (baseColor === (seriesType === "IM" ? IM_RED : MM_RED))
        return seriesType === "IM" ? IM_GREEN : MM_GREEN;
    }
    return baseColor;
  };

  useEffect(() => {
    if (!priceRef.current || !data.length) return;

    const chart = createChart(priceRef.current, {
      width: priceRef.current.clientWidth,
      height: priceRef.current.clientHeight,
      layout: { background: { color: "#1e1e1e" }, textColor: "#ffffff" },
      grid: {
        vertLines: { color: "#2a2a2a" },
        horzLines: { color: "#2a2a2a" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#555555",
        scaleMargins: { top: 0.05, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "#555555",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: any) => {
          const date = new Date(time * 1000);
          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();
          const showDate = hours === 0 && minutes === 0;
          if (showDate) {
            const month = date.toLocaleDateString("en-US", {
              month: "short",
              timeZone: "UTC",
            });
            const day = date.getUTCDate();
            return `${month} ${day}, ${hours
              .toString()
              .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
          } else {
            return `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`;
          }
        },
      },
      localization: {
        timeFormatter: (time: any) => {
          const date = new Date(time * 1000);
          const hours = date.getUTCHours();
          const minutes = date.getUTCMinutes();
          const showDate = hours === 0 && minutes === 0;
          if (showDate) {
            const month = date.toLocaleDateString("en-US", {
              month: "short",
              timeZone: "UTC",
            });
            const day = date.getUTCDate();
            return `${month} ${day}, ${hours
              .toString()
              .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
          } else {
            return `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`;
          }
        },
      },
    });

    const validData = data.filter(
      (d) => d.time && typeof d.time === "string" && d.time.includes(" ")
    );
    const timeToTopBottom = new Map<Time, string>();
    
    // Collect all T/B timestamps (excluding ET and EB)
    const tbTimestamps: Time[] = [];
    validData.forEach((d) => {
      const time = getTime(d);
      const tb = d.topbottom ?? "";
      timeToTopBottom.set(time, tb);
      
      // Only consider pure T and B markers for MOC
      if (tb === "T" || tb === "B") {
        tbTimestamps.push(time);
      }
    });
    
    // Sort timestamps for binary search
    tbTimestamps.sort((a, b) => a - b);

    const imSeries = chart.addHistogramSeries({
      color: DEFAULT_HIST_COLOR,
      priceScaleId: "im-scale",
      visible: false,
    });
    const mmSeries = chart.addHistogramSeries({
      color: DEFAULT_HIST_COLOR,
      priceScaleId: "mm-scale",
      visible: false,
    });

    const histDataIM: HistogramData[] = validData.map((d) => ({
      time: getTime(d),
      value: d.im,
      color: computeColorForType(d.topbottom, false, "IM"),
    }));
    const histDataMM: HistogramData[] = validData.map((d) => ({
      time: getTime(d),
      value: d.mm,
      color: computeColorForType(d.topbottom, false, "MM"),
    }));

    imSeries.setData(histDataIM);
    mmSeries.setData(histDataMM);
    chart
      .priceScale("im-scale")
      .applyOptions({
        scaleMargins: { top: 0.6, bottom: 0.05 },
        borderColor: "#555555",
      });
    chart
      .priceScale("mm-scale")
      .applyOptions({
        scaleMargins: { top: 0.6, bottom: 0.05 },
        borderColor: "#555555",
      });

    const lastIM = histDataIM[histDataIM.length - 1];
    const lastMM = histDataMM[histDataMM.length - 1];
    const imPriceLine = imSeries.createPriceLine({
      price: lastIM.value,
      color: "white",
      lineWidth: 1,
      lineStyle: 0,
      axisLabelVisible: true,
      title: "IM",
    });
    const mmPriceLine = mmSeries.createPriceLine({
      price: lastMM.value,
      color: "white",
      lineWidth: 1,
      lineStyle: 0,
      axisLabelVisible: true,
      title: "MM",
    });

    const updateStrSeries = () => {
      const inst = chartInstanceRef.current;
      if (!inst) return;
      const { chart, strSeries, originalStrData } = inst;
      const visibleRange = chart.timeScale().getVisibleRange();
      if (!visibleRange) return;

      let anchorIndex = -1;
      for (let i = 0; i < validData.length; i++) {
        const time = getTime(validData[i]);
        if (
          time >= visibleRange.from &&
          time <= visibleRange.to &&
          (validData[i].topbottom === "T" || validData[i].topbottom === "B")
        ) {
          anchorIndex = i;
          break;
        }
      }
      if (anchorIndex === -1) return;

      let maxPrice = -Infinity;
      for (let i = 0; i < validData.length; i++) {
        const t = getTime(validData[i]);
        if (t >= visibleRange.from && t <= visibleRange.to) {
          maxPrice = Math.max(
            maxPrice,
            validData[i].high ?? validData[i].close
          );
        }
      }
      maxPrice = maxPrice === -Infinity ? 0 : maxPrice;

      const anchorOriginalPrice = validData[anchorIndex].close;
      const mirrorActive = Boolean(inst.mirrorActive);
      const displayedAnchorPrice = mirrorActive
        ? -anchorOriginalPrice + maxPrice
        : anchorOriginalPrice;

      strSeries.forEach((series, key) => {
        const [strType, iStr] = key.split("-");
        const i = parseInt(iStr);
        const original = originalStrData.get(key);
        if (!original) return;
        const strValAtAnchor = (
          validData[anchorIndex][strType as keyof CandleData] as number[]
        )[i];
        const offset =
          (mirrorActive ? -strValAtAnchor : strValAtAnchor) -
          displayedAnchorPrice;
        const transformed = original.map((pt) => ({
          time: pt.time,
          value: (mirrorActive ? -pt.value : pt.value) - offset,
        }));
        series.setData(transformed);
      });
    };

    const updateMirror = () => {
      const inst = chartInstanceRef.current;
      if (!inst) return;
      const {
        chart,
        priceSeries,
        strSeries,
        originalStrData,
        originalPriceData,
        originalHistIM,
        originalHistMM,
        imSeries: imS,
        mmSeries: mmS,
        timeToTopBottom,
      } = inst;
      if (!originalPriceData || !priceSeries) return;
      const visibleRange = chart.timeScale().getVisibleRange();
      if (!visibleRange) return;

      const inViewport = (t: Time) =>
        t >= visibleRange.from && t <= visibleRange.to;
      let maxPrice = -Infinity;
      for (let i = 0; i < validData.length; i++) {
        const t = getTime(validData[i]);
        if (inViewport(t))
          maxPrice = Math.max(
            maxPrice,
            validData[i].high ?? validData[i].close
          );
      }
      maxPrice = maxPrice === -Infinity ? 0 : maxPrice;

      const transformedPrice = originalPriceData.map((p) => {
        if ("value" in p) {
          const pt = p as LineData;
          return inViewport(pt.time as Time)
            ? { time: pt.time, value: -pt.value + maxPrice }
            : pt;
        } else {
          const cp = p as CandlestickData;
          return inViewport(cp.time as Time)
            ? {
                time: cp.time,
                open: -cp.open + maxPrice,
                high: -cp.high + maxPrice,
                low: -cp.low + maxPrice,
                close: -cp.close + maxPrice,
              }
            : cp;
        }
      });
      priceSeries.setData(transformedPrice as any);

      if (showTB && "setMarkers" in priceSeries) {
        const markers: any[] = [];
        validData.forEach((d) => {
          const time = getTime(d);
          const tb = (d.topbottom ?? "").toString().toUpperCase();
          let isT = tb === "T";
          let isB = tb === "B";
          if (mirrorOn) [isT, isB] = [isB, isT];
          if (isT)
            markers.push({
              time,
              position: "inBar",
              color: GREEN,
              shape: "circle",
              size: 1,
            });
          if (isB)
            markers.push({
              time,
              position: "inBar",
              color: RED,
              shape: "circle",
              size: 1,
            });
        });
        try {
          (priceSeries as any).setMarkers(markers);
        } catch {}
      }

      strSeries.forEach((series, key) => {
        const orig = originalStrData.get(key);
        if (!orig) return;
        const mirrored = orig.map((pt) => ({
          time: pt.time,
          value: -pt.value,
        }));
        series.setData(mirrored);
      });

      let maxIM = -Infinity,
        maxMM = -Infinity;
      for (let i = 0; i < validData.length; i++) {
        const t = getTime(validData[i]);
        if (inViewport(t)) {
          maxIM = Math.max(maxIM, validData[i].im);
          maxMM = Math.max(maxMM, validData[i].mm);
        }
      }
      maxIM = maxIM === -Infinity ? 0 : maxIM;
      maxMM = maxMM === -Infinity ? 0 : maxMM;

      if (originalHistIM && imS) {
        const newIM = originalHistIM.map((h) =>
          inViewport(h.time as Time)
            ? {
                time: h.time,
                value: maxIM - (h.value as number),
                color: computeColorForType(
                  timeToTopBottom?.get(h.time),
                  true,
                  "IM"
                ),
              }
            : h
        );
        imS.setData(newIM);
        const lastNewIM = newIM[newIM.length - 1];
        inst.imPriceLine?.applyOptions({ price: lastNewIM.value });
      }
      if (originalHistMM && mmS) {
        const newMM = originalHistMM.map((h) =>
          inViewport(h.time as Time)
            ? {
                time: h.time,
                value: maxMM - (h.value as number),
                color: computeColorForType(
                  timeToTopBottom?.get(h.time),
                  true,
                  "MM"
                ),
              }
            : h
        );
        mmS.setData(newMM);
        const lastNewMM = newMM[newMM.length - 1];
        inst.mmPriceLine?.applyOptions({ price: lastNewMM.value });
      }
      inst.updateStrSeries?.();
    };

    // Create a mapping of value by series key and timestamp for O(1) lookups
    const valuesByLineAndTime = new Map<string, Map<Time, number>>();
    
    // MOC update function
    const updateMoc = () => {
      const inst = chartInstanceRef.current;
      if (!inst || !inst.mocActive) return;
      
      const { chart, strSeries, originalStrData, tbTimestamps, valuesByLineAndTime } = inst;
      if (!tbTimestamps || !valuesByLineAndTime) return;
      
      const visibleRange = chart.timeScale().getVisibleRange();
      if (!visibleRange) return;
      
      // Group series by type
      const seriesByType: Record<string, string[]> = {};
      for (const key of strSeries.keys()) {
        const [type] = key.split("-");
        if (!seriesByType[type]) seriesByType[type] = [];
        seriesByType[type].push(key);
      }
      
      // Process each group
      Object.entries(seriesByType).forEach(([strType, keys]) => {
        // Sort keys to ensure str1 (index 0) is first
        keys.sort();
        
        // Get base key (str1)
        const baseKey = keys.find(k => k.endsWith("-0"));
        if (!baseKey || keys.length <= 1) return;
        
        const baseValues = valuesByLineAndTime.get(baseKey);
        if (!baseValues) return;
        
        // Process non-base series (str2-str5)
        keys.filter(k => k !== baseKey).forEach(targetKey => {
          const series = strSeries.get(targetKey);
          const original = originalStrData.get(targetKey);
          if (!series || !original) return;
          
          const targetValues = valuesByLineAndTime.get(targetKey);
          if (!targetValues) return;
          
          // Transform points in visible range
          const transformed = original
            .filter(pt => pt.time >= visibleRange.from && pt.time <= visibleRange.to)
            .map(pt => {
              const time = pt.time as Time;
              
              // Find previous T/B timestamp
              const prevIndex = findPreviousTbIndex(tbTimestamps, time);
              if (prevIndex === -1) return pt; // No previous T/B marker, keep original
              
              const prevTbTime = tbTimestamps[prevIndex];
              
              // Get values at the previous T/B marker
              const baseValue = baseValues.get(prevTbTime);
              const targetValue = targetValues.get(prevTbTime);
              
              // If either value is missing, keep original
              if (baseValue === undefined || targetValue === undefined) {
                return pt;
              }
              
              // Apply the transform: adjusted = original - (target_prev - base_prev)
              const adjustment = targetValue - baseValue;
              return {
                time,
                value: pt.value - adjustment
              };
            });
          
          // Set the transformed data
          series.setData(transformed);
        });
      });
    };

    chartInstanceRef.current = {
      chart,
      imSeries,
      mmSeries,
      strSeries: new Map(),
      originalStrData: new Map(),
      originalHistIM: histDataIM,
      originalHistMM: histDataMM,
      timeToTopBottom,
      updateStrSeries,
      updateMirror,
      mirrorActive: false,
      imPriceLine,
      mmPriceLine,
      // MOC related fields
      tbTimestamps,
      valuesByLineAndTime,
      updateMoc,
      mocActive: false
    };

    return () => {
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    const inst = chartInstanceRef.current;
    if (!inst?.updateStrSeries) return;
    const { chart, updateStrSeries } = inst;
    if (alignOn) {
      chart.timeScale().subscribeVisibleTimeRangeChange(updateStrSeries);
      updateStrSeries();
    } else {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(updateStrSeries);
      inst.strSeries.forEach((series, key) => {
        // Don't restore original data if MOC is active
        if (!inst.mocActive) {
          const original = inst.originalStrData.get(key);
          if (original) series.setData(original);
        }
      });
    }
  }, [alignOn]);

  useEffect(() => {
    if (!chartInstanceRef.current || !data.length) return;
    const { chart, priceSeries: oldSeries } = chartInstanceRef.current;
    if (oldSeries) chart.removeSeries(oldSeries);

    const validData = data.filter(
      (d) => d.time && typeof d.time === "string" && d.time.includes(" ")
    );
    let newSeries: ISeriesApi<"Candlestick" | "Line">;
    if (priceType === "candle") {
      newSeries = chart.addCandlestickSeries({
        upColor: "#00ff00",
        downColor: "#ff0000",
        borderUpColor: "#00ff00",
        borderDownColor: "#ff0000",
        wickUpColor: "#00ff00",
        wickDownColor: "#ff0000",
      });
      const candleData: CandlestickData[] = validData.map((d) => ({
        time: getTime(d),
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      newSeries.setData(candleData);
      chartInstanceRef.current!.originalPriceData = candleData;
    } else {
      newSeries = chart.addLineSeries({ color: "#ffffff" });
      const lineData: LineData[] = validData.map((d) => ({
        time: getTime(d),
        value: d.close,
      }));
      newSeries.setData(lineData);
      if (showTB) {
        const markers: any[] = [];
        validData.forEach((d) => {
          const time = getTime(d);
          const tb = (d.topbottom ?? "").toString().toUpperCase();
          let isT = tb === "T",
            isB = tb === "B";
          if (mirrorOn) [isT, isB] = [isB, isT];
          if (isT)
            markers.push({
              time,
              position: "inBar",
              color: GREEN,
              shape: "circle",
              size: 1,
            });
          if (isB)
            markers.push({
              time,
              position: "inBar",
              color: RED,
              shape: "circle",
              size: 1,
            });
        });
        try {
          (newSeries as any).setMarkers(markers);
        } catch {}
      }
      chartInstanceRef.current!.originalPriceData = lineData;
    }
    chartInstanceRef.current!.priceSeries = newSeries;
    if (mirrorOn && chartInstanceRef.current.updateMirror)
      chartInstanceRef.current.updateMirror();
  }, [priceType, data, showTB, mirrorOn]);

  useEffect(() => {
    if (!chartInstanceRef.current || !data.length) return;
    const { 
      chart, 
      strSeries, 
      originalStrData, 
      valuesByLineAndTime 
    } = chartInstanceRef.current;
    const validData = data.filter(
      (d) => d.time && typeof d.time === "string" && d.time.includes(" ")
    );
    const strTypes: (keyof CandleData)[] = [
      "drive",
      "harmony",
      "root",
      "action",
      "expand",
      "live",
    ];
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];

    strTypes.forEach((strType, typeIndex) => {
      const strArray = validData[0][strType] as number[];
      strArray.forEach((_, i) => {
        const key = `${strType}-${i}`;
        if (showStrs[strType][i] && !strSeries.has(key)) {
          const series = chart.addLineSeries({
            color: colors[(typeIndex * 5 + i) % colors.length],
          });
          const lineData: LineData[] = validData.map((d) => ({
            time: getTime(d),
            value: (d[strType] as number[])[i],
          }));
          originalStrData.set(key, lineData);
          series.setData(lineData);
          strSeries.set(key, series);
          
          // Populate value map for MOC
          if (valuesByLineAndTime) {
            const valueMap = new Map<Time, number>();
            validData.forEach(d => {
              valueMap.set(getTime(d), (d[strType] as number[])[i]);
            });
            valuesByLineAndTime.set(key, valueMap);
          }
        } else if (!showStrs[strType][i] && strSeries.has(key)) {
          chart.removeSeries(strSeries.get(key)!);
          strSeries.delete(key);
          originalStrData.delete(key);
          
          // Clean up MOC value maps
          valuesByLineAndTime?.delete(key);
        }
      });
    });
    
    if (mirrorOn && chartInstanceRef.current.updateMirror)
      chartInstanceRef.current.updateMirror();
    else if (chartInstanceRef.current.mocActive && chartInstanceRef.current.updateMoc)
      chartInstanceRef.current.updateMoc();
  }, [showStrs, data, mirrorOn]);

  useEffect(() => {
    if (!chartInstanceRef.current?.chart) return;
    const { chart, imSeries, mmSeries } = chartInstanceRef.current;
    chart.priceScale("right").applyOptions({
      scaleMargins: {
        top: 0.05,
        bottom: showIM && showMM ? 0.6 : showIM || showMM ? 0.35 : 0.1,
      },
    });
    if (imSeries) {
      imSeries.applyOptions({ visible: showIM });
      if (showIM)
        chart.priceScale("im-scale").applyOptions({
          scaleMargins: { top: 0.6, bottom: showMM ? 0.2 : 0.05 },
          borderColor: "#555555",
        });
    }
    if (mmSeries) {
      mmSeries.applyOptions({ visible: showMM });
      if (showMM)
        chart.priceScale("mm-scale").applyOptions({
          scaleMargins: { top: showIM ? 0.8 : 0.6, bottom: 0.0 },
          borderColor: "#555555",
        });
    }
  }, [showIM, showMM]);

  useEffect(() => {
    const inst = chartInstanceRef.current;
    if (!inst) return;
    const { chart, updateMirror } = inst;
    inst.mirrorActive = mirrorOn;
    if (mirrorOn) {
      setAlignOn(true);
      if (updateMirror) {
        chart.timeScale().subscribeVisibleTimeRangeChange(updateMirror);
        updateMirror();
      }
      inst.updateStrSeries?.();
      
      // Turn off MOC if Mirror is turned on
      if (mocOn) setMocOn(false);
    } else {
      if (updateMirror)
        chart.timeScale().unsubscribeVisibleTimeRangeChange(updateMirror);
      if (inst.priceSeries && inst.originalPriceData)
        inst.priceSeries.setData(inst.originalPriceData as any);
      inst.strSeries.forEach((series, key) => {
        const orig = inst.originalStrData.get(key);
        if (orig) series.setData(orig);
      });
      if (inst.imSeries && inst.originalHistIM) {
        inst.imSeries.setData(inst.originalHistIM);
        const lastOrigIM = inst.originalHistIM[inst.originalHistIM.length - 1];
        inst.imPriceLine?.applyOptions({ price: lastOrigIM.value });
      }
      if (inst.mmSeries && inst.originalHistMM) {
        inst.mmSeries.setData(inst.originalHistMM);
        const lastOrigMM = inst.originalHistMM[inst.originalHistMM.length - 1];
        inst.mmPriceLine?.applyOptions({ price: lastOrigMM.value });
      }
      if (showTB && inst.priceSeries) {
        const markers: any[] = [];
        const validData = data.filter(
          (d) => d.time && typeof d.time === "string" && d.time.includes(" ")
        );
        validData.forEach((d) => {
          const time = getTime(d);
          const tb = (d.topbottom ?? "").toString().toUpperCase();
          const isT = tb === "T",
            isB = tb === "B";
          if (isT)
            markers.push({
              time,
              position: "inBar",
              color: GREEN,
              shape: "circle",
              size: 1,
            });
          if (isB)
            markers.push({
              time,
              position: "inBar",
              color: RED,
              shape: "circle",
              size: 1,
            });
        });
        try {
          (inst.priceSeries as any).setMarkers(markers);
        } catch {}
      }
      
      // Apply MOC if it's active after mirror is turned off
      if (mocOn && inst.updateMoc) {
        inst.updateMoc();
      }
    }
  }, [mirrorOn]);
  
  // MOC useEffect handler
  useEffect(() => {
    const inst = chartInstanceRef.current;
    if (!inst) return;
    const { chart, updateMoc } = inst;
    inst.mocActive = mocOn;
    
    if (mocOn) {
      // Turn off ALIGN when MOC is enabled
      if (alignOn) setAlignOn(false);
      
      // Turn off MIRROR if it's on
      if (mirrorOn) setMirrorOn(false);
      
      if (updateMoc) {
        chart.timeScale().subscribeVisibleTimeRangeChange(updateMoc);
        updateMoc();
      }
    } else {
      // Turn off MOC
      if (updateMoc) chart.timeScale().unsubscribeVisibleTimeRangeChange(updateMoc);
      
      // Restore original data
      inst.strSeries.forEach((series, key) => {
        const orig = inst.originalStrData.get(key);
        if (orig) series.setData(orig);
      });
    }
  }, [mocOn]);

  return (
    <div className="w-full h-[600px]">
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() =>
            setPriceType(priceType === "candle" ? "line" : "candle")
          }
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Price: {priceType}
        </button>
        <button
          onClick={() => {
            const newAlign = !alignOn;
            setAlignOn(newAlign);
            if (!newAlign && mirrorOn) setMirrorOn(false);
            // Turn off MOC if ALIGN is turned on
            if (newAlign && mocOn) setMocOn(false);
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Align: {alignOn ? "On" : "Off"}
        </button>
        {priceType === "line" && (
          <button
            onClick={() => setShowTB(!showTB)}
            className="px-4 py-2 bg-gray-700 text-white rounded"
          >
            TB: {showTB ? "On" : "Off"}
          </button>
        )}
        <button
          onClick={() => setShowIM(!showIM)}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          IM: {showIM ? "On" : "Off"}
        </button>
        <button
          onClick={() => setShowMM(!showMM)}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          MM: {showMM ? "On" : "Off"}
        </button>
        <button
          onClick={() => {
            setMirrorOn(!mirrorOn);
            if (!mirrorOn) {
              setAlignOn(true);
              // Turn off MOC if Mirror is turned on
              if (mocOn) setMocOn(false);
            }
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Mirror: {mirrorOn ? "On" : "Off"}
        </button>
        {/* MOC toggle button */}
        <button
          onClick={() => {
            const newMoc = !mocOn;
            setMocOn(newMoc);
            if (newMoc) {
              // Turn off ALIGN when MOC is enabled
              if (alignOn) setAlignOn(false);
              // Turn off MIRROR if it's on
              if (mirrorOn) setMirrorOn(false);
            }
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          MOC: {mocOn ? "On" : "Off"}
        </button>
        {Object.keys(showStrs).map((key) => (
          <div key={key} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === key ? null : key)}
              className="px-4 py-2 bg-gray-700 text-white rounded"
            >
              {key}: {showStrs[key].filter(Boolean).length} selected
            </button>
            {openDropdown === key && (
              <div className="absolute top-full left-0 bg-gray-800 p-2 rounded mt-1 z-10">
                {[0, 1, 2, 3, 4].map((i) => (
                  <label
                    key={i}
                    className="flex items-center gap-1 text-white text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={showStrs[key][i]}
                      onChange={() => {
                        const newArr = [...showStrs[key]];
                        newArr[i] = !newArr[i];
                        setShowStrs({ ...showStrs, [key]: newArr });
                      }}
                    />
                    {i + 1}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white">
          Loading...
        </div>
      ) : (
        <div className="w-full h-full relative">
          <div ref={priceRef} className="absolute inset-0" />
        </div>
      )}
    </div>
  );
};

export default TradeChart;