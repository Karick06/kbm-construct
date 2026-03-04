'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker - use local copy from node_modules
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

type Tool = 'select' | 'linear' | 'polyline' | 'area' | 'count' | 'volume' | 'angle' | 'calibrate';

type Point = { x: number; y: number };

type Measurement = {
  id: string;
  type: 'linear' | 'polyline' | 'area' | 'count' | 'volume' | 'angle';
  points: Point[];
  value: number;
  unit: string;
  label: string;
  color: string;
  depth?: number; // for volume calculations
  fontSize?: number; // custom font size
  lineWidth?: number; // custom line width
  markerSize?: number; // custom marker size for count
};

type DrawingFile = {
  name: string;
  url: string;
  type: 'pdf' | 'image';
  scale: number; // pixels per unit (e.g., pixels per meter)
  scaleUnit: string; // 'mm', 'cm', 'm', 'ft', 'in'
};

export default function DrawingMeasurementPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<DrawingFile | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  
  // Undo/Redo history
  const [history, setHistory] = useState<Measurement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoveredMeasurement, setHoveredMeasurement] = useState<string | null>(null);
  
  // Scale calibration state
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<Point[]>([]);
  const [showScaleDialog, setShowScaleDialog] = useState(false);
  const [knownDistance, setKnownDistance] = useState<string>('');
  const [scaleUnit, setScaleUnit] = useState<string>('m');
  
  // Scale selector state
  const [showScaleSelector, setShowScaleSelector] = useState(false);
  const [selectedScale, setSelectedScale] = useState<string>('1:100');
  const [paperOrientation, setPaperOrientation] = useState<'landscape' | 'portrait'>('landscape');
  
  // Volume depth state
  const [showDepthDialog, setShowDepthDialog] = useState(false);
  const [depth, setDepth] = useState<string>('');
  const [pendingVolumePoints, setPendingVolumePoints] = useState<Point[]>([]);
  
  // Measurement editing state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [editLabel, setEditLabel] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('');
  const [editFontSize, setEditFontSize] = useState<number>(12);
  const [editLineWidth, setEditLineWidth] = useState<number>(2);
  const [editMarkerSize, setEditMarkerSize] = useState<number>(8);
  
  // Selection and dragging state
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [measurementsBeforeDrag, setMeasurementsBeforeDrag] = useState<Measurement[] | null>(null);
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [currentMousePos, setCurrentMousePos] = useState<Point | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [isPopup, setIsPopup] = useState<boolean>(false);

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  
  // Get label for new measurement, using BOQ context if available
  const getMeasurementLabel = (type: string): string => {
    const context = localStorage.getItem('measurement-context');
    if (context) {
      try {
        const ctx = JSON.parse(context);
        return ctx.boqDescription || `${type.charAt(0).toUpperCase() + type.slice(1)} ${measurements.filter(m => m.type === type).length + 1}`;
      } catch (e) {
        // Fall through to default
      }
    }
    return `${type.charAt(0).toUpperCase() + type.slice(1)} ${measurements.filter(m => m.type === type).length + 1}`;
  };
  
  // Common architectural/engineering scales
  const presetScales = [
    { label: '1:1', ratio: 1 },
    { label: '1:5', ratio: 5 },
    { label: '1:10', ratio: 10 },
    { label: '1:20', ratio: 20 },
    { label: '1:50', ratio: 50 },
    { label: '1:100', ratio: 100 },
    { label: '1:200', ratio: 200 },
    { label: '1:500', ratio: 500 },
  ];

  // Update measurements with history tracking
  const updateMeasurements = (newMeasurements: Measurement[]) => {
    // Don't track history if measurements haven't actually changed
    if (JSON.stringify(newMeasurements) === JSON.stringify(measurements)) return;
    
    // Add current state to history before updating
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(measurements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setMeasurements(newMeasurements);
  };
  
  const undo = () => {
    if (historyIndex < 0) return;
    
    const previousState = history[historyIndex];
    setMeasurements(previousState);
    setHistoryIndex(historyIndex - 1);
  };
  
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    
    const nextState = history[historyIndex + 2]; // +2 because we want the next state after current
    if (nextState) {
      setMeasurements(nextState);
      setHistoryIndex(historyIndex + 1);
    }
  };
  
  const clearAllMeasurements = () => {
    if (confirm('Are you sure you want to clear all measurements?')) {
      updateMeasurements([]);
    }
  };
  
  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  // Detect if running in popup window
  useEffect(() => {
    setIsPopup(window.opener !== null);
  }, []);

  // Pop out to new window
  const popOut = () => {
    const width = 1400;
    const height = 900;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    window.open(
      '/drawing-measurement',
      'Drawing Measurement Tool',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const fileType = uploadedFile.type.includes('pdf') ? 'pdf' : 'image';
    const url = URL.createObjectURL(uploadedFile);

    if (fileType === 'image') {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setFile({
          name: uploadedFile.name,
          url,
          type: fileType,
          scale: 100, // default: 100 pixels = 1 meter
          scaleUnit: 'm'
        });
        drawCanvas();
      };
      img.src = url;
    } else {
      // Handle PDF using PDF.js
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); // Get first page
        
        // Calculate scale to fit within max dimensions while maintaining quality
        const baseViewport = page.getViewport({ scale: 1 });
        const maxWidth = 1400;
        const maxHeight = 1000;
        
        // Calculate scale to fit the PDF within max dimensions
        let scale = Math.min(
          maxWidth / baseViewport.width,
          maxHeight / baseViewport.height,
          2 // Cap at 2x for quality
        );
        
        const viewport = page.getViewport({ scale });
        
        // Create a canvas to render the PDF page
        const pdfCanvas = document.createElement('canvas');
        const context = pdfCanvas.getContext('2d');
        if (!context) return;
        
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: pdfCanvas
        }).promise;
        
        // Convert canvas to image
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setFile({
            name: uploadedFile.name,
            url,
            type: fileType,
            scale: 100,
            scaleUnit: 'm'
          });
        };
        img.src = pdfCanvas.toDataURL();
      } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Failed to load PDF. Please try another file.');
      }
    }
  };

  // Draw canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !image) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transforms
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw image
    ctx.drawImage(image, 0, 0);
    
    // Draw measurements
    measurements.forEach(measurement => {
      const hoveredPtIdx = measurement.id === selectedMeasurement ? hoveredPointIndex : null;
      drawMeasurement(
        ctx,
        measurement,
        measurement.id === hoveredMeasurement,
        measurement.id === selectedMeasurement,
        hoveredPtIdx
      );
    });
    
    // Draw current drawing
    if (currentPoints.length > 0) {
      // Draw click points as circles
      currentPoints.forEach((pt, idx) => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 6 / zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw point number
        ctx.save();
        ctx.scale(1 / zoom, 1 / zoom);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((idx + 1).toString(), pt.x * zoom, pt.y * zoom);
        ctx.restore();
      });
      
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      
      if (activeTool === 'linear' || activeTool === 'calibrate') {
        // Draw line through points
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
        
        // Draw preview line to mouse
        if (currentMousePos && currentPoints.length > 0) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
          ctx.beginPath();
          const lastPt = currentPoints[currentPoints.length - 1];
          ctx.moveTo(lastPt.x, lastPt.y);
          ctx.lineTo(currentMousePos.x, currentMousePos.y);
          ctx.stroke();
        }
      } else if (activeTool === 'area' || activeTool === 'volume') {
        // Draw polygon
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach(pt => ctx.lineTo(pt.x, pt.y));
        
        // Draw preview line to mouse
        if (currentMousePos) {
          ctx.lineTo(currentMousePos.x, currentMousePos.y);
          ctx.lineTo(currentPoints[0].x, currentPoints[0].y); // Close to first point
        }
        
        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
        ctx.fill();
        ctx.stroke();
      } else if (activeTool === 'angle') {
        // Draw angle lines
        if (currentPoints.length >= 2) {
          const [p1, vertex] = currentPoints;
          ctx.beginPath();
          ctx.moveTo(vertex.x, vertex.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
          
          if (currentPoints.length === 3) {
            const p2 = currentPoints[2];
            ctx.beginPath();
            ctx.moveTo(vertex.x, vertex.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          } else if (currentMousePos) {
            // Preview second arm
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
            ctx.beginPath();
            ctx.moveTo(vertex.x, vertex.y);
            ctx.lineTo(currentMousePos.x, currentMousePos.y);
            ctx.stroke();
          }
        }
      } else if (activeTool === 'count') {
        // Show total count label
        if (currentPoints.length > 0) {
          const lastPoint = currentPoints[currentPoints.length - 1];
          ctx.save();
          ctx.scale(1 / zoom, 1 / zoom);
          const scaledPoint = { x: lastPoint.x * zoom, y: lastPoint.y * zoom };
          
          const text = `Total: ${currentPoints.length}`;
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          const metrics = ctx.measureText(text);
          const padding = 6;
          const height = 18;
          
          ctx.fillStyle = 'rgba(251, 191, 36, 0.9)';
          ctx.fillRect(
            scaledPoint.x - metrics.width / 2 - padding,
            scaledPoint.y - height - padding - 20,
            metrics.width + padding * 2,
            height + padding
          );
          
          ctx.fillStyle = '#000';
          ctx.fillText(text, scaledPoint.x, scaledPoint.y - 20);
          ctx.restore();
        }
      }
      
      ctx.setLineDash([]);
    } else if (currentMousePos && activeTool !== 'select' && !isPanning) {
      // Draw cursor crosshair for active tools
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
      ctx.lineWidth = 1 / zoom;
      const size = 10 / zoom;
      ctx.beginPath();
      ctx.moveTo(currentMousePos.x - size, currentMousePos.y);
      ctx.lineTo(currentMousePos.x + size, currentMousePos.y);
      ctx.moveTo(currentMousePos.x, currentMousePos.y - size);
      ctx.lineTo(currentMousePos.x, currentMousePos.y + size);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  const drawMeasurement = (ctx: CanvasRenderingContext2D, m: Measurement, isHovered: boolean, isSelected?: boolean, hoveredPtIdx?: number | null) => {
    const lineWidth = m.lineWidth || 2;
    const isHighlight = isSelected || isHovered;
    ctx.strokeStyle = isSelected ? '#fbbf24' : (isHovered ? '#60a5fa' : m.color);
    ctx.fillStyle = isSelected ? '#fbbf24' : (isHovered ? '#60a5fa' : m.color);
    ctx.lineWidth = (isHighlight ? lineWidth + 1 : lineWidth) / zoom;
    ctx.setLineDash([]);

    if (m.type === 'linear') {
      // Draw line
      ctx.beginPath();
      ctx.moveTo(m.points[0].x, m.points[0].y);
      m.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
      
      // Draw points if hovered or selected
      if (isHovered || isSelected) {
        m.points.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 / zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        });
      }
      
      // Draw length label
      const midPoint = m.points[Math.floor(m.points.length / 2)];
      drawLabel(ctx, `${m.value.toFixed(2)} ${m.unit}`, midPoint, m.color, m.fontSize);
    } else if (m.type === 'polyline') {
      // Draw polyline (multi-segment line)
      ctx.beginPath();
      ctx.moveTo(m.points[0].x, m.points[0].y);
      m.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
      
      // Draw points if hovered or selected
      if (isHovered || isSelected) {
        m.points.forEach((pt, idx) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 / zoom, 0, Math.PI * 2);
          // Red for hovered point (indicates it can be deleted)
          ctx.fillStyle = idx === hoveredPtIdx ? '#ef4444' : (isSelected ? '#fbbf24' : '#60a5fa');
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        });
      }
      
      // Draw length label at midpoint
      const midPoint = m.points[Math.floor(m.points.length / 2)];
      drawLabel(ctx, `${m.value.toFixed(2)} ${m.unit}`, midPoint, m.color, m.fontSize);
    } else if (m.type === 'area') {
      // Draw polygon
      ctx.beginPath();
      ctx.moveTo(m.points[0].x, m.points[0].y);
      m.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.closePath();
      ctx.fillStyle = `${m.color}33`;
      ctx.fill();
      ctx.stroke();
      
      // Draw points if hovered or selected
      if (isHovered || isSelected) {
        ctx.fillStyle = isSelected ? '#fbbf24' : (isHovered ? '#60a5fa' : m.color);
        m.points.forEach((pt, idx) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 / zoom, 0, Math.PI * 2);
          // Red for hovered point (indicates it can be deleted)
          ctx.fillStyle = idx === hoveredPtIdx ? '#ef4444' : (isSelected ? '#fbbf24' : '#60a5fa');
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        });
      }
      
      // Draw area label at centroid
      const centroid = calculateCentroid(m.points);
      drawLabel(ctx, `${m.value.toFixed(2)} ${m.unit}²`, centroid, m.color, m.fontSize);
    } else if (m.type === 'count') {
      // Draw count markers
      const markerSize = (m.markerSize || 8) / zoom;
      m.points.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, markerSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = `${(m.fontSize || 12) / zoom}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((idx + 1).toString(), pt.x, pt.y);
        ctx.fillStyle = m.color;
      });
    } else if (m.type === 'volume') {
      // Draw area with volume label
      ctx.beginPath();
      ctx.moveTo(m.points[0].x, m.points[0].y);
      m.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.closePath();
      ctx.fillStyle = `${m.color}44`;
      ctx.fill();
      ctx.stroke();
      
      // Draw points if hovered or selected
      if (isHovered || isSelected) {
        ctx.fillStyle = isSelected ? '#fbbf24' : (isHovered ? '#60a5fa' : m.color);
        m.points.forEach((pt, idx) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 / zoom, 0, Math.PI * 2);
          // Red for hovered point (indicates it can be deleted)
          ctx.fillStyle = idx === hoveredPtIdx ? '#ef4444' : (isSelected ? '#fbbf24' : '#60a5fa');
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        });
      }
      
      const centroid = calculateCentroid(m.points);
      drawLabel(ctx, `${m.value.toFixed(2)} ${m.unit}³`, centroid, m.color, m.fontSize);
    } else if (m.type === 'angle') {
      // Draw angle
      const [p1, vertex, p2] = m.points;
      ctx.beginPath();
      ctx.moveTo(vertex.x, vertex.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.moveTo(vertex.x, vertex.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      
      // Draw points if hovered or selected
      if (isHovered || isSelected) {
        ctx.fillStyle = isSelected ? '#fbbf24' : (isHovered ? '#60a5fa' : m.color);
        [p1, vertex, p2].forEach((pt, idx) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5 / zoom, 0, Math.PI * 2);
          // Red for hovered point (indicates it can be deleted - though angle needs all 3)
          ctx.fillStyle = idx === hoveredPtIdx ? '#ef4444' : (isSelected ? '#fbbf24' : '#60a5fa');
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        });
      }
      
      // Draw arc
      const radius = 30 / zoom;
      const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
      const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
      ctx.beginPath();
      ctx.arc(vertex.x, vertex.y, radius, angle1, angle2, false);
      ctx.stroke();
      
      drawLabel(ctx, `${m.value.toFixed(1)}°`, vertex, m.color, m.fontSize);
    }
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, text: string, point: Point, color: string, fontSize?: number) => {
    ctx.save();
    ctx.scale(1 / zoom, 1 / zoom);
    const scaledPoint = { x: point.x * zoom, y: point.y * zoom };
    
    const size = fontSize || 12;
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    
    // Draw text with slight shadow for visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillStyle = color;
    ctx.fillText(text, scaledPoint.x, scaledPoint.y);
    ctx.restore();
  };

  const calculateCentroid = (points: Point[]): Point => {
    const sum = points.reduce((acc, pt) => ({ x: acc.x + pt.x, y: acc.y + pt.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const calculateArea = (points: Point[]): number => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  };

  const calculateAngle = (p1: Point, vertex: Point, p2: Point): number => {
    const angle1 = Math.atan2(p1.y - vertex.y, p1.x - vertex.x);
    const angle2 = Math.atan2(p2.y - vertex.y, p2.x - vertex.x);
    let angle = (angle2 - angle1) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return angle;
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;
    
    const point = getCanvasPoint(e);
    
    // Handle select tool - click to select measurement
    if (activeTool === 'select') {
      const clickedMeasurement = measurements.find(m => {
        return m.points.some(pt => {
          const dist = Math.sqrt(Math.pow(pt.x - point.x, 2) + Math.pow(pt.y - point.y, 2));
          return dist < 15 / zoom;
        });
      });
      
      if (clickedMeasurement) {
        setSelectedMeasurement(clickedMeasurement.id);
      } else {
        setSelectedMeasurement(null);
      }
      return;
    }
    
    const now = Date.now();
    const isDoubleClick = now - lastClickTime < 300;
    setLastClickTime(now);
    
    if (activeTool === 'calibrate') {
      handleCalibrationClick(point);
      return;
    }
    
    if (activeTool === 'count') {
      // Add point to current count measurement
      setCurrentPoints([...currentPoints, point]);
      return;
    }
    
    if (activeTool === 'linear') {
      const newPoints = [...currentPoints, point];
      if (newPoints.length === 2) {
        completeMeasurement(newPoints);
      } else {
        setCurrentPoints(newPoints);
      }
    } else if (activeTool === 'polyline') {
      // Handle double-click to complete polyline
      if (isDoubleClick && currentPoints.length >= 2) {
        completeMeasurement(currentPoints);
      } else {
        // Add point to polyline
        setCurrentPoints([...currentPoints, point]);
      }
    } else if (activeTool === 'area' || activeTool === 'volume') {
      // Handle double-click to complete polygon
      if (isDoubleClick && currentPoints.length >= 3) {
        completeMeasurement(currentPoints);
      } else {
        // Add point to polygon
        setCurrentPoints([...currentPoints, point]);
      }
    } else if (activeTool === 'angle') {
      const newPoints = [...currentPoints, point];
      if (newPoints.length === 3) {
        completeMeasurement(newPoints);
      } else {
        setCurrentPoints(newPoints);
      }
    }
  };

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (activeTool === 'polyline') {
      if (currentPoints.length >= 2) {
        completeMeasurement(currentPoints);
      }
    } else if (activeTool === 'area' || activeTool === 'volume') {
      if (currentPoints.length >= 3) {
        completeMeasurement(currentPoints);
      }
    } else if (activeTool === 'count') {
      // Right-click to complete count measurement
      if (currentPoints.length > 0) {
        const newMeasurement: Measurement = {
          id: `measure-${Date.now()}`,
          type: 'count',
          points: currentPoints,
          value: currentPoints.length,
          unit: 'items',
          label: getMeasurementLabel('count'),
          color: colors[measurements.length % colors.length]
        };
        updateMeasurements([...measurements, newMeasurement]);
        setCurrentPoints([]);
      }
    }
  };

  const handleCalibrationClick = (point: Point) => {
    const newPoints = [...calibrationPoints, point];
    if (newPoints.length === 2) {
      setCalibrationPoints(newPoints);
      setShowScaleDialog(true);
    } else {
      setCalibrationPoints(newPoints);
      setCurrentPoints(newPoints);
    }
  };

  const completeCalibration = () => {
    if (calibrationPoints.length !== 2 || !knownDistance || !file) return;
    
    const pixelDistance = calculateDistance(calibrationPoints[0], calibrationPoints[1]);
    const realDistance = parseFloat(knownDistance);
    const scale = pixelDistance / realDistance;
    
    setFile({
      ...file,
      scale,
      scaleUnit
    });
    
    setIsCalibrating(false);
    setCalibrationPoints([]);
    setCurrentPoints([]);
    setShowScaleDialog(false);
    setKnownDistance('');
    setActiveTool('select');
  };
  
  const applyPresetScale = () => {
    if (!file || !image) return;
    
    const scale = presetScales.find(s => s.label === selectedScale);
    if (!scale) return;
    
    // A0 dimensions: 841mm x 1189mm
    const a0WidthMM = paperOrientation === 'landscape' ? 1189 : 841;
    
    // Convert A0 width to selected unit
    let a0WidthInUnit: number;
    switch (scaleUnit) {
      case 'mm': a0WidthInUnit = a0WidthMM; break;
      case 'cm': a0WidthInUnit = a0WidthMM / 10; break;
      case 'm': a0WidthInUnit = a0WidthMM / 1000; break;
      case 'in': a0WidthInUnit = a0WidthMM / 25.4; break;
      case 'ft': a0WidthInUnit = a0WidthMM / 304.8; break;
      default: a0WidthInUnit = a0WidthMM / 1000;
    }
    
    // Apply scale ratio to get real-world width represented on the drawing
    const realWorldWidth = a0WidthInUnit * scale.ratio;
    
    // Calculate pixels per unit
    const pixelsPerUnit = image.width / realWorldWidth;
    
    setFile({
      ...file,
      scale: pixelsPerUnit,
      scaleUnit
    });
    
    setShowScaleSelector(false);
  };

  const completeMeasurement = (points: Point[]) => {
    if (!file) return;
    
    let value = 0;
    let unit = file.scaleUnit;
    let type = activeTool as 'linear' | 'polyline' | 'area' | 'volume' | 'angle';
    
    if (activeTool === 'linear' || activeTool === 'polyline') {
      const pixelDistance = points.reduce((sum, pt, i) => {
        if (i === 0) return 0;
        return sum + calculateDistance(points[i - 1], pt);
      }, 0);
      value = pixelDistance / file.scale;
    } else if (activeTool === 'area') {
      const pixelArea = calculateArea(points);
      value = pixelArea / (file.scale * file.scale);
    } else if (activeTool === 'volume') {
      // For volume, show depth dialog instead of completing immediately
      setPendingVolumePoints(points);
      setShowDepthDialog(true);
      return;
    } else if (activeTool === 'angle') {
      value = calculateAngle(points[0], points[1], points[2]);
      unit = '°';
    }
    
    const newMeasurement: Measurement = {
      id: `measure-${Date.now()}`,
      type,
      points,
      value,
      unit,
      label: getMeasurementLabel(type),
      color: colors[measurements.length % colors.length]
    };
    
    updateMeasurements([...measurements, newMeasurement]);
    setCurrentPoints([]);
  };

  const deleteMeasurement = (id: string) => {
    updateMeasurements(measurements.filter(m => m.id !== id));
  };
  
  const openEditDialog = (measurement: Measurement) => {
    setEditingMeasurement(measurement);
    setEditLabel(measurement.label);
    setEditColor(measurement.color);
    setEditFontSize(measurement.fontSize || 12);
    setEditLineWidth(measurement.lineWidth || 2);
    setEditMarkerSize(measurement.markerSize || 8);
    setShowEditDialog(true);
  };
  
  const saveEditChanges = () => {
    if (!editingMeasurement) return;
    
    const updatedMeasurements = measurements.map(m => 
      m.id === editingMeasurement.id
        ? {
            ...m,
            label: editLabel,
            color: editColor,
            fontSize: editFontSize,
            lineWidth: editLineWidth,
            markerSize: editMarkerSize
          }
        : m
    );
    
    updateMeasurements(updatedMeasurements);
    setShowEditDialog(false);
    setEditingMeasurement(null);
  };
  
  const completeVolumeMeasurement = () => {
    if (!file || !depth || pendingVolumePoints.length === 0) return;
    
    const pixelArea = calculateArea(pendingVolumePoints);
    const areaValue = pixelArea / (file.scale * file.scale);
    const depthValue = parseFloat(depth);
    const volumeValue = areaValue * depthValue;
    
    const newMeasurement: Measurement = {
      id: `measure-${Date.now()}`,
      type: 'volume',
      points: pendingVolumePoints,
      value: volumeValue,
      unit: file.scaleUnit,
      label: getMeasurementLabel('volume'),
      color: colors[measurements.length % colors.length],
      depth: depthValue
    };
    
    updateMeasurements([...measurements, newMeasurement]);
    setPendingVolumePoints([]);
    setCurrentPoints([]);
    setShowDepthDialog(false);
    setDepth('');
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Label', 'Type', 'Value', 'Unit'].join(','),
      ...measurements.map(m => 
        [m.label, m.type, m.value.toFixed(2), m.unit].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurements-${Date.now()}.csv`;
    a.click();
  };

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    const mousePos = { x, y };
    
    // Handle select tool for dragging
    if (activeTool === 'select' && selectedMeasurement) {
      const measurement = measurements.find(m => m.id === selectedMeasurement);
      if (!measurement) return;
      
      // Check if clicking on a control point
      const pointIndex = measurement.points.findIndex(pt => {
        const dist = Math.sqrt(Math.pow(pt.x - x, 2) + Math.pow(pt.y - y, 2));
        return dist < 10 / zoom;
      });
      
      if (pointIndex !== -1) {
        // Dragging a control point
        setIsDragging(true);
        setDraggedPointIndex(pointIndex);
        setDragStartPos(mousePos);
        setMeasurementsBeforeDrag([...measurements]); // Save state before dragging
        return;
      } else {
        // Check if clicking on the measurement itself (for moving whole measurement)
        const isOnMeasurement = measurement.points.some(pt => {
          const dist = Math.sqrt(Math.pow(pt.x - x, 2) + Math.pow(pt.y - y, 2));
          return dist < 20 / zoom;
        });
        
        if (isOnMeasurement) {
          setIsDragging(true);
          setDragStartPos(mousePos);
          setMeasurementsBeforeDrag([...measurements]); // Save state before dragging
          return;
        }
      }
    }
    
    // Pan with middle mouse or select tool
    if (e.button === 1 || (e.button === 0 && activeTool === 'select' && !selectedMeasurement)) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    setCurrentMousePos(point);
    
    // Detect hovered control point on selected measurement
    if (!isDragging && selectedMeasurement && activeTool === 'select') {
      const measurement = measurements.find(m => m.id === selectedMeasurement);
      if (measurement) {
        const { x, y } = point;
        const pointIndex = measurement.points.findIndex(pt => {
          const dist = Math.sqrt(Math.pow(pt.x - x, 2) + Math.pow(pt.y - y, 2));
          return dist < 10 / zoom;
        });
        setHoveredPointIndex(pointIndex !== -1 ? pointIndex : null);
      } else {
        setHoveredPointIndex(null);
      }
    } else {
      setHoveredPointIndex(null);
    }
    
    // Handle dragging selected measurement
    if (isDragging && selectedMeasurement && dragStartPos) {
      const measurement = measurements.find(m => m.id === selectedMeasurement);
      if (!measurement) return;
      
      const dx = point.x - dragStartPos.x;
      const dy = point.y - dragStartPos.y;
      
      if (draggedPointIndex !== null) {
        // Dragging a single control point
        const updatedMeasurements = measurements.map(m => {
          if (m.id === selectedMeasurement) {
            const newPoints = m.points.map((pt, idx) => {
              if (idx === draggedPointIndex) {
                return { x: pt.x + dx, y: pt.y + dy };
              }
              return pt;
            });
            
            // Recalculate measurement value based on new points
            let value = m.value;
            if (m.type === 'linear' || m.type === 'polyline') {
              const pixelDistance = newPoints.reduce((sum, pt, i) => {
                if (i === 0) return 0;
                return sum + calculateDistance(newPoints[i - 1], pt);
              }, 0);
              value = pixelDistance / (file?.scale || 100);
            } else if (m.type === 'area' || m.type === 'volume') {
              const pixelArea = calculateArea(newPoints);
              const areaValue = pixelArea / ((file?.scale || 100) ** 2);
              value = m.type === 'volume' ? areaValue * (m.depth || 1) : areaValue;
            } else if (m.type === 'angle') {
              value = calculateAngle(newPoints[0], newPoints[1], newPoints[2]);
            }
            
            return { ...m, points: newPoints, value };
          }
          return m;
        });
        setMeasurements(updatedMeasurements);
      } else {
        // Dragging entire measurement
        const updatedMeasurements = measurements.map(m => {
          if (m.id === selectedMeasurement) {
            const newPoints = m.points.map(pt => ({
              x: pt.x + dx,
              y: pt.y + dy
            }));
            return { ...m, points: newPoints };
          }
          return m;
        });
        setMeasurements(updatedMeasurements);
      }
      
      setDragStartPos(point);
      return;
    }
    
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isDrawing && (activeTool === 'area' || activeTool === 'volume')) {
      setCurrentPoints([...currentPoints, point]);
    }
  };

  const handleMouseUp = () => {
    // Push to history if we were dragging and made changes
    if (isDragging && measurementsBeforeDrag) {
      // Only update history if measurements actually changed
      if (JSON.stringify(measurements) !== JSON.stringify(measurementsBeforeDrag)) {
        const newHistory = history.slice(0,historyIndex + 1);
        newHistory.push(measurementsBeforeDrag);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
      setMeasurementsBeforeDrag(null);    }
    
    setIsPanning(false);
    setIsDrawing(false);
    setIsDragging(false);
    setDraggedPointIndex(null);
    setDragStartPos(null);
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Calculate zoom change
    const delta = -e.deltaY * 0.001;
    const newZoom = Math.min(Math.max(0.1, zoom + delta), 5);
    
    if (newZoom === zoom) return;
    
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate the point under the mouse in world coordinates before zoom
    const worldX = (mouseX - pan.x) / zoom;
    const worldY = (mouseY - pan.y) / zoom;
    
    // Calculate new pan to keep the same world point under the mouse
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  useEffect(() => {
    drawCanvas();
  }, [image, measurements, currentPoints, zoom, pan, hoveredMeasurement, currentMousePos, selectedMeasurement]);
  
  // Load measurements from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('drawing-measurements');
    if (saved) {
      try {
        const parsedMeasurements = JSON.parse(saved);
        setMeasurements(parsedMeasurements);
      } catch (e) {
        console.error('Failed to load measurements:', e);
      }
    }
  }, []);
  
  // Check for BOQ context and load drawing if available
  useEffect(() => {
    const context = localStorage.getItem('measurement-context');
    const drawingData = localStorage.getItem('measurement-drawing');
    
    if (context && drawingData) {
      try {
        const ctx = JSON.parse(context);
        const drawing = JSON.parse(drawingData);
        
        // Load the drawing file
        if (drawing.dataUrl) {
          const fileType = drawing.fileType.includes('pdf') ? 'pdf' : 'image';
          
          if (fileType === 'image') {
            const img = new Image();
            img.onload = () => {
              setImage(img);
              setFile({
                name: drawing.fileName,
                url: drawing.dataUrl,
                type: 'image',
                scale: 100,
                scaleUnit: 'm'
              });
            };
            img.src = drawing.dataUrl;
          } else if (fileType === 'pdf') {
            // Handle PDF
            fetch(drawing.dataUrl)
              .then(res => res.arrayBuffer())
              .then(async (arrayBuffer) => {
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1);
                
                const maxWidth = 1920;
                const maxHeight = 1080;
                const viewport = page.getViewport({ scale: 1.0 });
                const scale = Math.min(
                  maxWidth / viewport.width,
                  maxHeight / viewport.height,
                  2.0
                );
                const scaledViewport = page.getViewport({ scale });
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) return;
                
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;
                
                await page.render({
                  canvas,
                  canvasContext: context,
                  viewport: scaledViewport
                }).promise;
                
                const img = new Image();
                img.onload = () => {
                  setImage(img);
                  setFile({
                    name: drawing.fileName,
                    url: drawing.dataUrl,
                    type: 'pdf',
                    scale: 100,
                    scaleUnit: 'm'
                  });
                };
                img.src = canvas.toDataURL();
              })
              .catch(err => console.error('Failed to load PDF from context:', err));
          }
        }
        
        console.log('Loaded BOQ context:', ctx.boqDescription, '-', ctx.boqUnit);
      } catch (e) {
        console.error('Failed to load BOQ context:', e);
      }
    }
  }, []);
  
  // Save measurements to localStorage when they change
  useEffect(() => {
    if (measurements.length > 0) {
      localStorage.setItem('drawing-measurements', JSON.stringify(measurements));
    } else {
      localStorage.removeItem('drawing-measurements');
    }
  }, [measurements]);
  
  // Listen for storage events to sync measurements across windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drawing-measurements' && e.newValue) {
        try {
          const parsedMeasurements = JSON.parse(e.newValue);
          setMeasurements(parsedMeasurements);
        } catch (err) {
          console.error('Failed to sync measurements:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo/Redo shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      
      if (e.key === 'Escape') {
        setSelectedMeasurement(null);
        setHoveredPointIndex(null);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedMeasurement) {
        // Delete control point if one is hovered
        if (hoveredPointIndex !== null) {
          const measurement = measurements.find(m => m.id === selectedMeasurement);
          if (!measurement) return;
          
          // Check minimum points for each type
          const minPoints: { [key: string]: number } = {
            'linear': 2,
            'polyline': 2,
            'area': 3,
            'volume': 3,
            'angle': 3,
            'count': 1
          };
          
          if (measurement.points.length <= minPoints[measurement.type]) {
            // Can't delete - would make measurement invalid
            return;
          }
          
          // Remove the point
          const newPoints = measurement.points.filter((_, idx) => idx !== hoveredPointIndex);
          
          // Recalculate value
          let value = measurement.value;
          if (measurement.type === 'linear' || measurement.type === 'polyline') {
            const pixelDistance = newPoints.reduce((sum, pt, i) => {
              if (i === 0) return 0;
              return sum + calculateDistance(newPoints[i - 1], pt);
            }, 0);
            value = pixelDistance / (file?.scale || 100);
          } else if (measurement.type === 'area' || measurement.type === 'volume') {
            const pixelArea = calculateArea(newPoints);
            const areaValue = pixelArea / ((file?.scale || 100) ** 2);
            value = measurement.type === 'volume' ? areaValue * (measurement.depth || 1) : areaValue;
          } else if (measurement.type === 'count') {
            value = newPoints.length;
          }
          
          // Update measurement
          const updatedMeasurements = measurements.map(m =>
            m.id === selectedMeasurement ? { ...m, points: newPoints, value } : m
          );
          updateMeasurements(updatedMeasurements);
          setHoveredPointIndex(null);
        } else {
          // Delete entire measurement
          deleteMeasurement(selectedMeasurement);
          setSelectedMeasurement(null);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMeasurement]);

  return (
    <div className={`flex flex-col bg-gray-900 ${isPopup ? 'fixed inset-0 z-50' : 'h-screen'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Drawing Measurement Tool</h1>
          {(() => {
            const context = localStorage.getItem('measurement-context');
            if (context) {
              try {
                const ctx = JSON.parse(context);
                return (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded-full bg-purple-500/20 border border-purple-500/50 px-3 py-1 text-xs font-semibold text-purple-300">
                      📋 Measuring: {ctx.boqDescription} ({ctx.boqUnit})
                    </span>
                  </div>
                );
              } catch (e) {
                // Fall through to default
              }
            }
            return <p className="text-sm text-gray-400">Upload drawings and perform takeoff measurements</p>;
          })()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Cmd/Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="rounded-lg bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Cmd/Ctrl+Shift+Z)"
          >
            ↷ Redo
          </button>
          <div className="border-l border-gray-600 mx-1"></div>
          {!isPopup && (
            <button
              onClick={popOut}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              title="Open in new window"
            >
              ⧉ Pop Out
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            📁 Upload Drawing
          </button>
          {measurements.length > 0 && (
            <button
              onClick={exportToCSV}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
            >
              📊 Export CSV
            </button>
          )}
          {!isPopup ? (
            <button
              onClick={() => router.push('/estimating-overview')}
              className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
            >
              ← Back to Estimating
            </button>
          ) : (
            <button
              onClick={() => window.close()}
              className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
            >
              ✕ Close Window
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-20 border-r border-gray-700 bg-gray-800 p-2">
          <div className="space-y-2">
            {[
              { tool: 'select' as Tool, icon: '↖', label: 'Select' },
              { tool: 'calibrate' as Tool, icon: '📏', label: 'Calibrate' },
              { tool: 'linear' as Tool, icon: '📐', label: 'Length' },
              { tool: 'polyline' as Tool, icon: '📍', label: 'Polyline' },
              { tool: 'area' as Tool, icon: '⬜', label: 'Area' },
              { tool: 'count' as Tool, icon: '🔢', label: 'Count' },
              { tool: 'volume' as Tool, icon: '📦', label: 'Volume' },
              { tool: 'angle' as Tool, icon: '📊', label: 'Angle' },
            ].map(({ tool, icon, label }) => (
              <button
                key={tool}
                onClick={() => {
                  // Complete count measurement before switching tools
                  if (activeTool === 'count' && currentPoints.length > 0) {
                    const newMeasurement: Measurement = {
                      id: `measure-${Date.now()}`,
                      type: 'count',
                      points: currentPoints,
                      value: currentPoints.length,
                      unit: 'items',
                      label: getMeasurementLabel('count'),
                      color: colors[measurements.length % colors.length]
                    };
                    updateMeasurements([...measurements, newMeasurement]);
                  }
                  
                  setActiveTool(tool);
                  setCurrentPoints([]);
                  if (tool === 'calibrate') {
                    setIsCalibrating(true);
                    setCalibrationPoints([]);
                  } else {
                    setIsCalibrating(false);
                  }
                }}
                className={`w-full rounded-lg p-3 text-center transition-all ${
                  activeTool === tool
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={label}
              >
                <div className="text-2xl">{icon}</div>
                <div className="mt-1 text-xs">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="relative flex-1 overflow-auto bg-gray-950">
          {!file ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-6xl">📐</div>
                <h2 className="mb-2 text-xl font-semibold text-white">No Drawing Loaded</h2>
                <p className="mb-4 text-gray-400">Upload a PDF or image to start measuring</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
                >
                  Upload Drawing
                </button>
              </div>
            </div>
          ) : (
            <>
              <canvas
                ref={canvasRef}
                width={image?.width || 800}
                height={image?.height || 600}
                className={`${
                  activeTool === 'select' 
                    ? (selectedMeasurement ? 'cursor-move' : 'cursor-default')
                    : (activeTool === 'calibrate' || activeTool === 'linear' || activeTool === 'polyline' || activeTool === 'area' || activeTool === 'count' || activeTool === 'volume' || activeTool === 'angle' ? 'cursor-crosshair' : 'cursor-default')
                }`}
                onClick={handleCanvasClick}
                onContextMenu={handleCanvasRightClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
              />
              
              {/* Zoom controls */}
              <div className="absolute bottom-4 left-4 flex gap-2 rounded-lg bg-gray-800 p-2" title="Use mouse wheel to zoom">
                <button
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  className="rounded bg-gray-700 px-3 py-1 text-white hover:bg-gray-600"
                  title="Zoom out"
                >
                  −
                </button>
                <span className="px-2 py-1 text-white" title="Scroll to zoom">{(zoom * 100).toFixed(0)}%</span>
                <button
                  onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                  className="rounded bg-gray-700 px-3 py-1 text-white hover:bg-gray-600"
                  title="Zoom in"
                >
                  +
                </button>
                <button
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                  className="ml-2 rounded bg-gray-700 px-3 py-1 text-white hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
              
              {/* Instructions */}
              <div className="absolute top-4 left-4 rounded-lg bg-black/70 p-3 text-sm text-white">
                {activeTool === 'select' && (selectedMeasurement ? 'Drag measurement to move. Drag control points to adjust. Hover point & DEL to remove it. ESC to deselect.' : 'Click a measurement to select it')}
                {activeTool === 'calibrate' && 'Click two points of known distance'}
                {activeTool === 'linear' && 'Click two points to measure distance'}
                {activeTool === 'polyline' && 'Click multiple points. Double-click or right-click to finish.'}
                {activeTool === 'area' && 'Click to place points. Double-click or right-click to close polygon.'}
                {activeTool === 'count' && 'Click to mark items. Right-click or switch tools to finish count.'}
                {activeTool === 'volume' && 'Click to place area points. Double-click or right-click to finish.'}
                {activeTool === 'angle' && 'Click 3 points: first point, vertex, second point'}
              </div>
            </>
          )}
        </div>

        {/* Measurements Panel */}
        <div className="w-80 overflow-y-auto border-l border-gray-700 bg-gray-800 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Measurements</h3>
            {measurements.length > 0 && (
              <button
                onClick={clearAllMeasurements}
                className="rounded px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-900/30"
                title="Clear all measurements"
              >
                🗑️ Clear All
              </button>
            )}
          </div>
          
          {file && (
            <div className="mb-4 space-y-2">
              <div className="rounded-lg border border-gray-600 bg-gray-700 p-3">
                <div className="text-sm text-gray-300">
                  <div className="mb-1 font-semibold">{file.name}</div>
                  <div className="text-xs text-gray-400">
                    Scale: {file.scale.toFixed(2)} px = 1 {file.scaleUnit}
                    {file.scale === 100 && (
                      <span className="ml-2 text-yellow-400">⚠️ Not calibrated</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTool('calibrate');
                    setIsCalibrating(true);
                    setCalibrationPoints([]);
                    setCurrentPoints([]);
                  }}
                  className="w-full rounded-lg border border-blue-500 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20"
                  title="Click two points of known distance on your drawing"
                >
                  📏 Calibrate Scale
                </button>
                <button
                  onClick={() => setShowScaleSelector(true)}
                  className="w-full rounded-lg border border-gray-600 bg-gray-700/50 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700"
                  title="Quick setup assuming A0 paper size"
                >
                  📐 Use Preset Scale (A0)
                </button>
              </div>
            </div>
          )}
          
          {measurements.length === 0 ? (
            <p className="text-gray-400">No measurements yet</p>
          ) : (
            <div className="space-y-2">
              {measurements.map(m => (
                <div
                  key={m.id}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    m.id === selectedMeasurement
                      ? 'border-yellow-500 bg-yellow-900/30 ring-2 ring-yellow-500/50'
                      : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                  }`}
                  onMouseEnter={() => setHoveredMeasurement(m.id)}
                  onMouseLeave={() => setHoveredMeasurement(null)}
                  onClick={() => {
                    setActiveTool('select');
                    setSelectedMeasurement(m.id);
                  }}
                >
                  <div className="mb-1 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      <span className="text-sm font-medium text-white">{m.label}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditDialog(m)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteMeasurement(m.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-orange-400">
                    {m.value.toFixed(2)} {m.unit}{m.type === 'area' ? '²' : m.type === 'volume' ? '³' : ''}
                  </div>
                  <div className="text-xs capitalize text-gray-400">
                    {m.type}
                    {m.type === 'volume' && m.depth && (
                      <span className="ml-2 text-gray-500">
                        (depth: {m.depth.toFixed(2)} {m.unit})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {measurements.length > 0 && (
            <div className="mt-4 rounded-lg border border-gray-600 bg-gray-700 p-3">
              <div className="text-sm font-semibold text-white">Summary</div>
              <div className="mt-2 space-y-1 text-xs text-gray-300">
                <div>Total Measurements: {measurements.length}</div>
                <div>Linear: {measurements.filter(m => m.type === 'linear').length}</div>
                <div>Area: {measurements.filter(m => m.type === 'area').length}</div>
                <div>Count: {measurements.filter(m => m.type === 'count').reduce((sum, m) => sum + m.value, 0)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileUpload}
      />
      
      {/* Scale selector dialog */}
      {showScaleSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[500px] rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Quick Scale Setup (A0 Paper)</h3>
            <p className="mb-4 text-sm text-gray-300">
              Select your drawing scale assuming the paper size is A0 (841mm × 1189mm).
            </p>
            <div className="mb-4 rounded-lg border border-blue-600/50 bg-blue-900/20 p-3">
              <p className="text-xs text-blue-300">
                💡 This is a quick method for standard A0 drawings. For best accuracy, use the <strong>Calibrate tool</strong> instead.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Paper Orientation</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaperOrientation('landscape')}
                    className={`flex-1 rounded border px-4 py-2 text-sm transition-colors ${
                      paperOrientation === 'landscape'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    Landscape (1189mm wide)
                  </button>
                  <button
                    onClick={() => setPaperOrientation('portrait')}
                    className={`flex-1 rounded border px-4 py-2 text-sm transition-colors ${
                      paperOrientation === 'portrait'
                        ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    Portrait (841mm wide)
                  </button>
                </div>
              </div>
              
              <div>
                <label className="mb-2 block text-sm text-gray-400">Drawing Scale</label>
                <div className="grid grid-cols-4 gap-2">
                  {presetScales.map(scale => (
                    <button
                      key={scale.label}
                      onClick={() => setSelectedScale(scale.label)}
                      className={`rounded border px-3 py-2 text-sm transition-colors ${
                        selectedScale === scale.label
                          ? 'border-orange-500 bg-orange-500/20 text-orange-400'
                          : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="mb-1 block text-sm text-gray-400">Measurement Unit</label>
                <select
                  value={scaleUnit}
                  onChange={(e) => setScaleUnit(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="mm">Millimeters (mm)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="m">Meters (m)</option>
                  <option value="in">Inches (in)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={applyPresetScale}
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Apply Scale
                </button>
                <button
                  onClick={() => {
                    setShowScaleSelector(false);
                    setSelectedScale('1:100');
                  }}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit measurement dialog */}
      {showEditDialog && editingMeasurement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[500px] rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Edit Measurement</h3>
            <p className="mb-4 text-sm text-gray-300">
              Customize the appearance and label of this measurement.
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Label</label>
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  placeholder="e.g., Wall Length"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-10 w-16 cursor-pointer rounded border border-gray-600"
                    />
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="flex-1 rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                      placeholder="#ef4444"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Font Size (px)</label>
                  <input
                    type="number"
                    min="8"
                    max="32"
                    value={editFontSize}
                    onChange={(e) => setEditFontSize(parseInt(e.target.value) || 12)}
                    className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">Line Width (px)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editLineWidth}
                    onChange={(e) => setEditLineWidth(parseInt(e.target.value) || 2)}
                    className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>
                
                {editingMeasurement && editingMeasurement.type === 'count' && (
                  <div>
                    <label className="mb-1 block text-sm text-gray-400">Marker Size (px)</label>
                    <input
                      type="number"
                      min="4"
                      max="20"
                      value={editMarkerSize}
                      onChange={(e) => setEditMarkerSize(parseInt(e.target.value) || 8)}
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                    />
                  </div>
                )}
              </div>
              
              <div className="rounded-lg border border-gray-600 bg-gray-700/50 p-3">
                <div className="mb-1 text-xs text-gray-400">Preview</div>
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: editColor }}
                  />
                  <span className="font-medium text-white" style={{ fontSize: `${Math.min(editFontSize, 16)}px` }}>
                    {editLabel}
                  </span>
                  <div
                    className="h-0.5 flex-1"
                    style={{ backgroundColor: editColor, height: `${editLineWidth}px` }}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={saveEditChanges}
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingMeasurement(null);
                  }}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Volume depth dialog */}
      {showDepthDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Enter Volume Depth</h3>
            <p className="mb-4 text-sm text-gray-300">
              You've drawn the area. Now enter the depth to calculate volume.
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Depth ({file?.scaleUnit || 'm'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  placeholder="e.g., 0.3"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && depth) {
                      completeVolumeMeasurement();
                    }
                  }}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Example: For a 300mm deep excavation, enter 0.3 (if unit is meters)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={completeVolumeMeasurement}
                  disabled={!depth}
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Calculate Volume
                </button>
                <button
                  onClick={() => {
                    setShowDepthDialog(false);
                    setPendingVolumePoints([]);
                    setCurrentPoints([]);
                    setDepth('');
                  }}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Scale calibration dialog */}
      {showScaleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-gray-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Set Scale</h3>
            <p className="mb-4 text-sm text-gray-300">
              You drew a line. Enter the known distance of this line.
            </p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Known Distance</label>
                <input
                  type="number"
                  step="0.01"
                  value={knownDistance}
                  onChange={(e) => setKnownDistance(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  placeholder="e.g., 10"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Unit</label>
                <select
                  value={scaleUnit}
                  onChange={(e) => setScaleUnit(e.target.value)}
                  className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white"
                >
                  <option value="mm">Millimeters (mm)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="m">Meters (m)</option>
                  <option value="in">Inches (in)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={completeCalibration}
                  className="flex-1 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Set Scale
                </button>
                <button
                  onClick={() => {
                    setShowScaleDialog(false);
                    setCalibrationPoints([]);
                    setCurrentPoints([]);
                    setKnownDistance('');
                  }}
                  className="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
