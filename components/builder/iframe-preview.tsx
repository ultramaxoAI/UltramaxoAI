"use client";

import { useState, useRef } from 'react';
import { Monitor, Tablet, Smartphone, RotateCw, ExternalLink } from 'lucide-react';

interface IframePreviewProps {
  previewUrl: string | null;
  terminalOutput: string;
}

export default function IframePreview({ previewUrl, terminalOutput }: IframePreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return '375px';
      case 'tablet':
        return '768px';
      default:
        return '100%';
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div className="flex-grow flex flex-col h-full bg-[#050505]">
      {/* Mock browser address bar */}
      <div className="bg-[#0c0c0f] border-b border-white/[0.06] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleReload}
            disabled={!previewUrl}
            className="p-1 hover:bg-white/[0.04] rounded text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30"
          >
            <RotateCw size={14} />
          </button>
          
          <div className="bg-black/60 border border-white/[0.06] rounded px-3 py-1 text-xs text-zinc-400 font-mono w-[300px] flex items-center justify-between">
            <span className="truncate">{previewUrl || 'http://localhost:5173/'}</span>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300">
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewport('desktop')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'desktop' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Desktop View"
          >
            <Monitor size={15} />
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'tablet' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Tablet View"
          >
            <Tablet size={15} />
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`p-1.5 rounded transition-colors ${
              viewport === 'mobile' ? 'bg-purple-600/20 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Mobile View"
          >
            <Smartphone size={15} />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-grow bg-[#09090b]/50 p-4 flex items-center justify-center overflow-auto">
        {previewUrl ? (
          <div 
            style={{ width: getViewportWidth(), height: '100%', transition: 'width 0.3s ease' }}
            className="bg-white rounded-lg shadow-2xl border border-zinc-850 overflow-hidden"
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Live Preview"
              className="w-full h-full border-none"
            />
          </div>
        ) : (
          <div className="w-full max-w-2xl h-full flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-zinc-350 text-sm font-medium">Booting Sandbox & Dev Server...</p>
              <p className="text-zinc-500 text-xs mt-1">Downloading npm modules via WebContainer.</p>
            </div>
            
            <div className="bg-[#050507] border border-white/[0.06] rounded-lg p-4 font-mono text-[11px] text-zinc-400 h-[250px] overflow-y-auto shadow-inner">
              <span className="text-purple-400 font-bold block mb-1">Sandbox Build Logs:</span>
              <pre className="whitespace-pre-wrap">{terminalOutput || 'Waiting for build process to spawn...'}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
