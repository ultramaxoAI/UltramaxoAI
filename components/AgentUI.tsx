"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────
type ToolCall = {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: "running" | "done" | "error";
};

type ChartData = {
  type: "pie" | "bar" | "line";
  title: string;
  data: { label: string; value: number }[];
};

type MessageBlock =
  | { kind: "text"; content: string }
  | { kind: "tool"; toolCall: ToolCall }
  | { kind: "chart"; chart: ChartData }
  | { kind: "reasoning"; content: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  blocks: MessageBlock[];
  fileAttachment?: { name: string; content: string };
};

// ── Tool label map ─────────────────────────────────────────────────────
const TOOL_META: Record<string, { label: string; icon: string; color: string }> = {
  web_search:    { label: "Searching the web",     icon: "🔍", color: "#3B82F6" },
  generate_chart:{ label: "Generating chart",      icon: "📊", color: "#8B5CF6" },
  analyze_file:  { label: "Analyzing file",        icon: "📄", color: "#10B981" },
};

// ── Mini chart renderer (Canvas-free, SVG) ─────────────────────────────
function MiniChart({ chart }: { chart: ChartData }) {
  const COLORS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#06B6D4"];
  const total = chart.data.reduce((s, d) => s + d.value, 0);

  if (chart.type === "pie") {
    let angle = -Math.PI / 2;
    const cx = 80, cy = 80, r = 65;
    const slices = chart.data.map((d, i) => {
      const sweep = (d.value / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle += sweep;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: COLORS[i % COLORS.length], label: d.label, value: d.value };
    });

    return (
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px", marginTop: 8 }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{chart.title}</p>
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          <svg width={160} height={160} viewBox="0 0 160 160">
            {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} stroke="#0a0a0a" strokeWidth={2} />)}
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {slices.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{s.label}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: "auto" }}>{((s.value / total) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (chart.type === "bar") {
    const max = Math.max(...chart.data.map(d => d.value));
    return (
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px", marginTop: 8 }}>
        <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 600, color: "#fff" }}>{chart.title}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {chart.data.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", width: 90, flexShrink: 0, textAlign: "right" }}>{d.label}</span>
              <div style={{ flex: 1, height: 24, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 4, transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", minWidth: 36, textAlign: "right" }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ── Tool block ─────────────────────────────────────────────────────────
export function ToolBlock({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(toolCall.status === "running");
  const meta = TOOL_META[toolCall.tool] ?? { label: toolCall.tool, icon: "⚙️", color: "#888" };

  useEffect(() => {
    if (toolCall.status === "done") {
      setExpanded(false);
    }
  }, [toolCall.status]);

  return (
    <div style={{ margin: "6px 0", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px", background: "rgba(255,255,255,0.04)",
          border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14 }}>{meta.icon}</span>
        <span style={{ fontSize: 12, color: meta.color, fontWeight: 500 }}>{meta.label}</span>
        {toolCall.status === "running" && (
          <span style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                width: 4, height: 4, borderRadius: "50%", background: meta.color,
                animation: `bounce 1.2s ${i * 0.2}s infinite`,
              }} />
            ))}
          </span>
        )}
        {toolCall.status === "done" && <span style={{ marginLeft: "auto", fontSize: 11, color: "#10B981" }}>✓ done</span>}
        <span style={{ marginLeft: toolCall.status === "running" ? 4 : "auto", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
          {expanded ? "▲" : "▼"}
        </span>
      </button>
      {expanded && (
        <div style={{ padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Input</p>
          <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(toolCall.args, null, 2)}
          </pre>
          {toolCall.result && (
            <>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "10px 0 6px" }}>Output</p>
              <pre style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Reasoning block ───────────────────────────────────────────────────
export function ReasoningBlock({ content, isFinished }: { content: string, isFinished?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  
  useEffect(() => {
    if (isFinished) {
      setExpanded(false);
    }
  }, [isFinished]);

  if (!content && isFinished) return null;

  return (
    <div style={{ margin: "12px 0", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px", background: "rgba(255,255,255,0.02)",
          border: "none", borderBottom: expanded && content ? "1px solid rgba(255,255,255,0.04)" : "none",
          cursor: "pointer", textAlign: "left", fontSize: 12, color: "rgba(255,255,255,0.6)"
        }}
      >
        <span>✦</span>
        {isFinished ? "Thinking Process (Completed)" : "Thinking..."}
        <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && content && (
        <div style={{ padding: "12px 14px", fontSize: 13, color: "rgba(255,255,255,0.7)", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.6 }}>
          {content}
        </div>
      )}
    </div>
  );
}

// ── Message renderer ───────────────────────────────────────────────────
function MessageView({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 4, marginBottom: 20 }}>
      {!isUser && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✦</div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Agent</span>
        </div>
      )}

      {isUser ? (
        <div style={{
          maxWidth: "72%", padding: "10px 14px", borderRadius: "16px 16px 4px 16px",
          background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)",
          fontSize: 14, color: "rgba(255,255,255,0.9)", lineHeight: 1.6,
        }}>
          {msg.fileAttachment && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "6px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>
              <span>📎</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{msg.fileAttachment.name}</span>
            </div>
          )}
          {msg.blocks.map((b, i) => b.kind === "text" ? <span key={i}>{b.content}</span> : null)}
        </div>
      ) : (
        <div style={{ maxWidth: "90%", width: "100%" }}>
          {msg.blocks.map((block, i) => {
            if (block.kind === "text") {
              return (
                <p key={i} style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, margin: "4px 0", whiteSpace: "pre-wrap" }}>
                  {block.content}
                </p>
              );
            }
            if (block.kind === "tool") {
              return <ToolBlock key={i} toolCall={block.toolCall} />;
            }
            if (block.kind === "chart") {
              return <MiniChart key={i} chart={block.chart} />;
            }
            if (block.kind === "reasoning") {
              return <ReasoningBlock key={i} content={block.content} />;
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Agent UI ──────────────────────────────────────────────────────
export default function AgentUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeAssistantId = useRef<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const updateAssistantBlocks = useCallback(
    (updater: (blocks: MessageBlock[]) => MessageBlock[]) => {
      if (!activeAssistantId.current) return;
      const id = activeAssistantId.current;
      setMessages(prev =>
        prev.map(m => m.id === id ? { ...m, blocks: updater(m.blocks) } : m)
      );
    },
    []
  );

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = e => setFile({ name: f.name, content: e.target?.result as string });
    reader.readAsText(f);
  };

  const send = async () => {
    const text = input.trim();
    if (!text && !file) return;
    if (isStreaming) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      blocks: [{ kind: "text", content: text }],
      fileAttachment: file ?? undefined,
    };

    const assistantId = crypto.randomUUID();
    activeAssistantId.current = assistantId;
    const assistantMsg: Message = { id: assistantId, role: "assistant", blocks: [] };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setFile(null);
    setIsStreaming(true);

    // Build messages for API
    const apiMessages = [
      ...messages.map(m => ({
        role: m.role,
        content: m.blocks
          .filter(b => b.kind === "text")
          .map(b => (b as { kind: "text"; content: string }).content)
          .join("\n"),
      })),
      { role: "user" as const, content: text },
    ];

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, fileContent: file?.content }),
      });

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = "";
      // Track running tools by name for this stream session
      let runningToolIndex: number | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "reasoning") {
            updateAssistantBlocks(blocks => {
              const last = blocks[blocks.length - 1];
              if (last?.kind === "reasoning") {
                return [...blocks.slice(0, -1), { kind: "reasoning", content: last.content + data.content }];
              }
              return [...blocks, { kind: "reasoning", content: data.content }];
            });
          }

          if (data.type === "text") {
            updateAssistantBlocks(blocks => {
              const last = blocks[blocks.length - 1];
              if (last?.kind === "text") {
                return [...blocks.slice(0, -1), { kind: "text", content: last.content + data.content }];
              }
              return [...blocks, { kind: "text", content: data.content }];
            });
          }

          if (data.type === "tool_start") {
            updateAssistantBlocks(blocks => {
              runningToolIndex = blocks.length;
              return [...blocks, {
                kind: "tool",
                toolCall: { tool: data.tool, args: data.args, status: "running" },
              }];
            });
          }

          if (data.type === "tool_result") {
            // Check if chart data
            if (data.result?.chart) {
              updateAssistantBlocks(blocks => {
                const updated = blocks.map((b, i) =>
                  i === runningToolIndex && b.kind === "tool"
                    ? { ...b, toolCall: { ...b.toolCall, result: data.result, status: "done" as const } }
                    : b
                );
                return [...updated, { kind: "chart", chart: data.result.chart }];
              });
            } else {
              updateAssistantBlocks(blocks =>
                blocks.map((b, i) =>
                  i === runningToolIndex && b.kind === "tool"
                    ? { ...b, toolCall: { ...b.toolCall, result: data.result, status: "done" as const } }
                    : b
                )
              );
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
      activeAssistantId.current = null;
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        @keyframes bounce {
          0%,80%,100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      <div style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: "#080808", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 12, flexShrink: 0,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>✦</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Ultramaxo Agent</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Search · Chart · Analyze</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Online</span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 12 }}>
              <div style={{ fontSize: 40 }}>✦</div>
              <p style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Ultramaxo Agent</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", maxWidth: 340, lineHeight: 1.6 }}>
                Tanya apa aja — aku bisa search web, bikin chart, dan analisis file kamu secara otomatis.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
                {["Cari berita ekonomi terbaru", "Buat pie chart pangsa pasar", "Analisis file ini"].map(s => (
                  <button key={s} onClick={() => setInput(s)} style={{
                    padding: "8px 14px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)",
                    fontSize: 12, cursor: "pointer",
                  }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map(m => <MessageView key={m.id} msg={m} />)}
          <div ref={bottomRef} style={{ height: 20 }} />
        </div>

        {/* File preview */}
        {file && (
          <div style={{ margin: "0 20px 8px", padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📎</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", flex: 1 }}>{file.name}</span>
            <button onClick={() => setFile(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 }}>×</button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: "12px 20px 20px", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 8,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 14, padding: "10px 12px",
            transition: "border-color 0.2s",
          }}>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px", flexShrink: 0 }}
              title="Upload file"
            >📎</button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ketik perintah di sini..."
              rows={1}
              style={{
                flex: 1, background: "none", border: "none", color: "#fff",
                fontSize: 14, resize: "none", lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto",
              }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={send}
              disabled={isStreaming || (!input.trim() && !file)}
              style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: isStreaming || (!input.trim() && !file) ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#3B82F6,#8B5CF6)",
                border: "none", cursor: isStreaming ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: "#fff", transition: "background 0.2s",
              }}
            >
              {isStreaming ? (
                <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.8s linear infinite", display: "block" }} />
              ) : "↑"}
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
            Enter untuk kirim · Shift+Enter baris baru · Attach file dengan 📎
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
