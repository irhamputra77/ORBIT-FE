"use client";

import { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Filter, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface GraphNode {
  id: string; label: string; type: string; x: number; y: number;
  color: string; size: number; data?: any;
}

interface GraphEdge {
  source: string; target: string; label?: string; color?: string;
}

const nodeTypes = [
  { type: 'engine', label: 'Engine', color: '#0242DB' },
  { type: 'sb', label: 'SB', color: '#00C2FF' },
  { type: 'ad', label: 'AD', color: '#F59E0B' },
  { type: 'eo', label: 'EO', color: '#818CF8' },
  { type: 'to', label: 'TO', color: '#10B981' },
  { type: 'lru', label: 'LRU', color: '#06B6D4' },
  { type: 'finding', label: 'Finding', color: '#EF4444' },
  { type: 'report', label: 'Report', color: '#8B5CF6' },
];

const initialNodes: GraphNode[] = [
  { id: 'e1', label: 'CFM56-7B\nESN 962771', type: 'engine', x: 400, y: 280, color: '#0242DB', size: 42 },
  { id: 'e2', label: 'CFM56-7B\nESN 960367', type: 'engine', x: 180, y: 180, color: '#0242DB', size: 38 },
  { id: 'e3', label: 'LEAP-1B\nESN 660876', type: 'engine', x: 640, y: 180, color: '#0242DB', size: 36 },
  { id: 'sb1', label: 'SB 72-1093 R02', type: 'sb', x: 250, y: 360, color: '#00C2FF', size: 26 },
  { id: 'sb2', label: 'SB 72-0632', type: 'sb', x: 160, y: 440, color: '#00C2FF', size: 24 },
  { id: 'sb3', label: 'SB 79-0031 R02', type: 'sb', x: 90, y: 280, color: '#00C2FF', size: 24 },
  { id: 'sb4', label: 'LEAP-1B SB 72-0399', type: 'sb', x: 700, y: 320, color: '#00C2FF', size: 24 },
  { id: 'ad1', label: 'AD-2026-0012-E', type: 'ad', x: 90, y: 160, color: '#F59E0B', size: 22 },
  { id: 'ad2', label: 'AD-2026-0031-E', type: 'ad', x: 760, y: 220, color: '#F59E0B', size: 22 },
  { id: 'eo1', label: 'EO 10000127027', type: 'eo', x: 530, y: 380, color: '#818CF8', size: 22 },
  { id: 'eo2', label: 'EO 10000061517', type: 'eo', x: 300, y: 460, color: '#818CF8', size: 22 },
  { id: 'eo3', label: 'EO 10000111742', type: 'eo', x: 140, y: 360, color: '#818CF8', size: 20 },
  { id: 'to1', label: 'TO-CFM56-7B-72-001', type: 'to', x: 580, y: 460, color: '#10B981', size: 20 },
  { id: 'to2', label: 'TO-CFM56-7B-72-012', type: 'to', x: 350, y: 500, color: '#10B981', size: 20 },
  { id: 'lru1', label: 'VSV Actuator', type: 'lru', x: 480, y: 180, color: '#06B6D4', size: 20 },
  { id: 'lru2', label: 'HPTACC', type: 'lru', x: 240, y: 260, color: '#06B6D4', size: 20 },
  { id: 'f1', label: 'F-2026-0234', type: 'finding', x: 560, y: 280, color: '#EF4444', size: 20 },
  { id: 'f2', label: 'F-2026-0256', type: 'finding', x: 180, y: 320, color: '#EF4444', size: 20 },
  { id: 'r1', label: 'EES-2026-001', type: 'report', x: 460, y: 480, color: '#8B5CF6', size: 20 },
  { id: 'r2', label: 'SVR-52X60285', type: 'report', x: 290, y: 540, color: '#8B5CF6', size: 18 },
];

const edges: GraphEdge[] = [
  { source: 'e1', target: 'sb1', color: '#00C2FF' },
  { source: 'e1', target: 'sb2', color: '#00C2FF' },
  { source: 'e1', target: 'eo1', color: '#818CF8' },
  { source: 'e1', target: 'lru1', color: '#06B6D4' },
  { source: 'e1', target: 'f1', color: '#EF4444' },
  { source: 'e2', target: 'sb3', color: '#00C2FF' },
  { source: 'e2', target: 'eo2', color: '#818CF8' },
  { source: 'e2', target: 'eo3', color: '#818CF8' },
  { source: 'e2', target: 'lru2', color: '#06B6D4' },
  { source: 'e2', target: 'f2', color: '#EF4444' },
  { source: 'e2', target: 'ad1', color: '#F59E0B' },
  { source: 'e3', target: 'sb4', color: '#00C2FF' },
  { source: 'e3', target: 'ad2', color: '#F59E0B' },
  { source: 'sb1', target: 'eo2', color: '#818CF8' },
  { source: 'sb2', target: 'eo1', color: '#818CF8' },
  { source: 'sb3', target: 'eo3', color: '#818CF8' },
  { source: 'eo1', target: 'to1', color: '#10B981' },
  { source: 'eo2', target: 'to2', color: '#10B981' },
  { source: 'eo1', target: 'r1', color: '#8B5CF6' },
  { source: 'eo2', target: 'r2', color: '#8B5CF6' },
  { source: 'f1', target: 'r1', color: '#8B5CF6' },
  { source: 'f2', target: 'r2', color: '#8B5CF6' },
  { source: 'ad1', target: 'sb3', color: '#F59E0B' },
  { source: 'ad2', target: 'sb4', color: '#F59E0B' },
];

export function KnowledgeGraphPage() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState(initialNodes);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState(new Set(nodeTypes.map(n => n.type)));
  const svgRef = useRef<SVGSVGElement>(null);
  const { openAIPanel } = useApp();

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const visibleNodes = nodes.filter(n => visibleTypes.has(n.type));
  const visibleEdges = edges.filter(e =>
    visibleNodes.some(n => n.id === e.source) && visibleNodes.some(n => n.id === e.target)
  );

  const getNode = (id: string) => nodes.find(n => n.id === id);
  const selectedData = selectedNode ? getNode(selectedNode) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h1 className="text-foreground mb-0.5">Knowledge Graph</h1>
          <p className="text-xs text-muted-foreground">Interactive engineering knowledge graph — {visibleNodes.length} nodes, {visibleEdges.length} relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-1.5 rounded-lg hover:bg-accent transition-colors border" style={{ border: '1px solid var(--border)' }}><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))} className="p-1.5 rounded-lg hover:bg-accent transition-colors border" style={{ border: '1px solid var(--border)' }}><ZoomOut size={14} /></button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors border" style={{ border: '1px solid var(--border)' }}><Maximize2 size={14} /></button>
          <button
            onClick={() => openAIPanel('Analyze the knowledge graph and identify key relationships')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
          >
            <Sparkles size={12} /> AI Analyze Graph
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Filters */}
        <div className="w-44 shrink-0 border-r p-3 space-y-1 overflow-y-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Filter size={10} />Node Types</div>
          {nodeTypes.map(nt => (
            <button
              key={nt.type}
              onClick={() => toggleType(nt.type)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-all"
              style={{
                background: visibleTypes.has(nt.type) ? `${nt.color}12` : 'transparent',
                opacity: visibleTypes.has(nt.type) ? 1 : 0.4,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: nt.color }} />
              <span className="text-xs text-foreground">{nt.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {nodes.filter(n => n.type === nt.type).length}
              </span>
            </button>
          ))}
        </div>

        {/* Graph */}
        <div className="flex-1 relative overflow-hidden" style={{ background: 'var(--background)', cursor: 'grab' }}>
          {/* Mesh bg */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(2,66,219,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ cursor: dragging === 'pan' ? 'grabbing' : 'grab' }}
            onMouseDown={e => {
              if (e.target === svgRef.current || (e.target as Element).tagName === 'svg') {
                setDragging('pan');
                setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
              }
            }}
            onMouseMove={e => {
              if (dragging === 'pan') setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
              if (dragging && dragging !== 'pan') {
                const svgRect = svgRef.current!.getBoundingClientRect();
                const newX = (e.clientX - svgRect.left - pan.x) / zoom;
                const newY = (e.clientY - svgRect.top - pan.y) / zoom;
                setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: newX, y: newY } : n));
              }
            }}
            onMouseUp={() => setDragging(null)}
            onWheel={e => {
              e.preventDefault();
              setZoom(z => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
            }}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <defs>
                <filter id="kgGlow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="rgba(100,120,200,0.4)" />
                </marker>
              </defs>

              {/* Edges */}
              {visibleEdges.map((edge, i) => {
                const src = getNode(edge.source);
                const tgt = getNode(edge.target);
                if (!src || !tgt) return null;
                const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target || selectedNode === edge.source || selectedNode === edge.target;
                return (
                  <line
                    key={i}
                    x1={src.x} y1={src.y}
                    x2={tgt.x} y2={tgt.y}
                    stroke={edge.color || '#5566AA'}
                    strokeWidth={isHighlighted ? 1.8 : 0.8}
                    strokeOpacity={isHighlighted ? 0.7 : 0.2}
                    strokeDasharray={edge.color === '#EF4444' ? '4 3' : undefined}
                  />
                );
              })}

              {/* Nodes */}
              {visibleNodes.map(node => {
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode === node.id;
                const isConnected = selectedNode && edges.some(e => (e.source === selectedNode && e.target === node.id) || (e.target === selectedNode && e.source === node.id));
                const dimmed = selectedNode && !isSelected && !isConnected;

                return (
                  <g
                    key={node.id}
                    filter={isSelected || isHovered ? 'url(#kgGlow)' : undefined}
                    style={{ cursor: 'pointer', opacity: dimmed ? 0.3 : 1, transition: 'opacity 0.2s' }}
                    onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onMouseDown={e => { e.stopPropagation(); setDragging(node.id); setDragStart({ x: e.clientX - node.x * zoom - pan.x, y: e.clientY - node.y * zoom - pan.y }); }}
                  >
                    {(isHovered || isSelected) && (
                      <circle cx={node.x} cy={node.y} r={node.size + 8} fill={node.color} opacity={0.12} />
                    )}
                    <circle cx={node.x} cy={node.y} r={node.size} fill={node.color} opacity={isSelected ? 1 : isHovered ? 0.92 : 0.8} />
                    {isSelected && (
                      <circle cx={node.x} cy={node.y} r={node.size + 3} fill="none" stroke={node.color} strokeWidth="1.5" strokeOpacity="0.5" />
                    )}
                    {node.label.split('\n').map((line, li) => (
                      <text
                        key={li}
                        x={node.x}
                        y={node.y + (li * 10) - (node.label.includes('\n') ? 5 : 0)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={node.size > 35 ? 9 : 7}
                        fill="white"
                        fontFamily="Inter, sans-serif"
                        fontWeight={li === 0 ? '600' : '400'}
                        fillOpacity={li === 0 ? 1 : 0.7}
                      >
                        {line}
                      </text>
                    ))}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground px-2 py-1 rounded-full" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Node Detail Panel */}
        {selectedData && (
          <div className="w-56 shrink-0 border-l overflow-y-auto" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedData.color }} />
                <span className="text-xs font-semibold text-foreground capitalize">{selectedData.type}</span>
                <button onClick={() => setSelectedNode(null)} className="ml-auto text-muted-foreground hover:text-foreground text-base leading-none">×</button>
              </div>
              <div className="text-xs font-bold text-foreground mb-1">{selectedData.id}</div>
              <div className="text-[11px] text-muted-foreground mb-3" style={{ whiteSpace: 'pre-line' }}>{selectedData.label}</div>
              <div className="text-[10px] text-muted-foreground mb-1">Connections</div>
              <div className="space-y-1">
                {edges.filter(e => e.source === selectedData.id || e.target === selectedData.id).map((e, i) => {
                  const other = getNode(e.source === selectedData.id ? e.target : e.source);
                  if (!other) return null;
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: other.color }} />
                      <span className="text-muted-foreground capitalize">{other.type}</span>
                      <span className="text-foreground truncate">{other.id}</span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => openAIPanel(`Analyze ${selectedData.id} and its engineering relationships`)}
                className="w-full mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white justify-center"
                style={{ background: 'linear-gradient(135deg, #0242DB, #00C2FF)' }}
              >
                <Sparkles size={11} /> Analyze Node
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
