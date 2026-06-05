import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Send, Cpu, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToolAction {
  raw: string;
  name: string;
  path?: string;
  cmd?: string;
  content: string;
}

export default function ChatPanel() {
  const { 
    activeProject, 
    token, 
    isAgentRunning, 
    setAgentRunning, 
    agentSteps, 
    addAgentStep, 
    updateAgentStep,
    setAgentSteps,
    addMessage,
    webContainer,
    createLocalFile,
    deleteLocalFile
  } = useProjectStore();

  const [prompt, setPrompt] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [executedToolRaws, setExecutedToolRaws] = useState<Set<string>>(new Set());

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeProject?.messages, agentSteps, isAgentRunning]);

  if (!activeProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
        Select or create a project to open chat.
      </div>
    );
  }

  // Parses streaming text for closed XML tool calls
  const extractClosedTools = (text: string): ToolAction[] => {
    const regex = /<tool\s+name="([^"]+)"([^>]*)>([\s\S]*?)<\/tool>/g;
    const tools: ToolAction[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const name = match[1];
      const attributes = match[2];
      const content = match[3];

      const pathMatch = /path="([^"]+)"/.exec(attributes);
      const cmdMatch = /cmd="([^"]+)"/.exec(attributes);

      tools.push({
        raw: match[0],
        name,
        path: pathMatch ? pathMatch[1] : undefined,
        cmd: cmdMatch ? cmdMatch[1] : undefined,
        content,
      });
    }
    return tools;
  };

  // Execution engine for tools inside WebContainer
  const executeTool = async (tool: ToolAction): Promise<string> => {
    const stepId = Math.random().toString(36).substring(7);
    
    // Add visual action indicator to the UI
    const stepName = tool.name === 'run_command' 
      ? `Run: ${tool.cmd}` 
      : `${tool.name === 'write_file' ? 'Write' : 'Modify'} file: ${tool.path}`;
      
    addAgentStep({
      id: stepId,
      name: stepName,
      status: 'running',
      logs: '',
    });

    try {
      if (!webContainer) {
        throw new Error('Sandbox WebContainer is not booted yet.');
      }

      if (tool.name === 'write_file' && tool.path) {
        await createLocalFile(tool.path, tool.content);
        updateAgentStep(stepId, { status: 'success', logs: `Successfully wrote ${tool.content.length} characters to ${tool.path}` });
        return `Success: Wrote to file ${tool.path}`;
      } 
      
      else if (tool.name === 'delete_file' && tool.path) {
        await deleteLocalFile(tool.path);
        updateAgentStep(stepId, { status: 'success', logs: `Deleted file ${tool.path}` });
        return `Success: Deleted file ${tool.path}`;
      } 
      
      else if (tool.name === 'read_file' && tool.path) {
        const fileContent = await webContainer.fs.readFile(tool.path, 'utf-8');
        updateAgentStep(stepId, { status: 'success', logs: `Read ${fileContent.length} characters` });
        return `File: ${tool.path} content:\n${fileContent}`;
      } 
      
      else if (tool.name === 'list_dir') {
        const list = await webContainer.fs.readdir(tool.path || '.');
        updateAgentStep(stepId, { status: 'success', logs: `Found ${list.length} files/folders` });
        return `Success: Directory contents: ${list.join(', ')}`;
      } 
      
      else if (tool.name === 'run_command' && tool.cmd) {
        const args = tool.cmd.split(/\s+/);
        const cmd = args.shift() || '';
        
        const process = await webContainer.spawn(cmd, args);
        
        let outputLogs = '';
        process.output.pipeTo(
          new WritableStream({
            write(data) {
              outputLogs += data;
              updateAgentStep(stepId, { logs: outputLogs });
            },
          })
        );

        const exitCode = await process.exit;
        if (exitCode === 0) {
          updateAgentStep(stepId, { status: 'success' });
          return `Success: Command '${tool.cmd}' exited with code 0. Output:\n${outputLogs}`;
        } else {
          updateAgentStep(stepId, { status: 'error' });
          return `Error: Command '${tool.cmd}' exited with code ${exitCode}. Output:\n${outputLogs}`;
        }
      }

      throw new Error(`Unknown tool action: ${tool.name}`);
    } catch (err: any) {
      console.error(err);
      updateAgentStep(stepId, { status: 'error', logs: err.message || String(err) });
      return `Failure: ${err.message || String(err)}`;
    }
  };

  // Run recursive AI Agent loop
  const triggerAgentLoop = async (currentMessages: any[]) => {
    setAgentRunning(true);
    setAgentSteps([]);

    let loopActive = true;
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops
    let activeHistory = [...currentMessages];

    while (loopActive && iterations < maxIterations) {
      iterations++;
      let assistantResponse = '';
      
      // Add a dummy loading assistant message in the store that we will stream into
      const tempMsgId = 'temp-' + Date.now();
      addMessage({ id: tempMsgId, role: 'assistant', content: '⟳ Thinking...' });

      try {
        const res = await fetch('http://localhost:3000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: activeHistory,
            projectId: activeProject.id,
          }),
        });

        if (!res.ok) {
          throw new Error(`API returned status ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder('utf-8');

        if (!reader) {
          throw new Error('No readable stream returned');
        }

        // Stream reader loop
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(dataStr);
                const content = parsed.choices?.[0]?.delta?.content || '';
                assistantResponse += content;

                // Update the temporary message contents in real-time
                useProjectStore.setState((state) => {
                  if (!state.activeProject) return {};
                  const messages = state.activeProject.messages.map((m) =>
                    m.id === tempMsgId ? { ...m, content: assistantResponse } : m
                  );
                  return { activeProject: { ...state.activeProject, messages } };
                });
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }

        // Finalize assistant message in history
        activeHistory = [...activeHistory, { role: 'assistant', content: assistantResponse }];
        
        // Find if we have completed tools to execute
        const tools = extractClosedTools(assistantResponse);
        const unexecutedTools = tools.filter(t => !executedToolRaws.has(t.raw));

        if (unexecutedTools.length > 0) {
          const toolResults: string[] = [];
          
          for (const tool of unexecutedTools) {
            executedToolRaws.add(tool.raw);
            setExecutedToolRaws(new Set(executedToolRaws));

            // Execute in WebContainer
            const result = await executeTool(tool);
            toolResults.push(`[Result for tool '${tool.name}']\n${result}`);
          }

          // Format tool results as user-like system feedback and continue loop
          const systemFeedback = toolResults.join('\n\n');
          activeHistory = [...activeHistory, { role: 'user', content: systemFeedback }];
          addMessage({ role: 'system', content: `🔧 Executed tools. Sending feedback to AI...` });
        } else {
          // No more tools to execute, agent is done
          loopActive = false;
        }
      } catch (err: any) {
        console.error(err);
        addMessage({ role: 'system', content: `❌ Error in agent loop: ${err.message || String(err)}` });
        loopActive = false;
      }
    }

    setAgentRunning(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAgentRunning) return;

    const userMsg = { role: 'user', content: prompt };
    addMessage(userMsg);
    setPrompt('');

    // Trigger the loop with new history
    const history = [...activeProject.messages, userMsg];
    triggerAgentLoop(history);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 border-r border-zinc-800">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-semibold text-zinc-300 text-xs tracking-wider uppercase flex items-center gap-1.5">
          <Cpu size={14} className="text-purple-400" /> UltraaxoAI Agent
        </span>
        {isAgentRunning && (
          <span className="flex items-center gap-1.5 text-[10px] bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 animate-pulse">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Running
          </span>
        )}
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeProject.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-10 h-10 rounded-full bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-3">
              <Cpu size={20} className="text-purple-400 animate-glow" />
            </div>
            <h3 className="text-zinc-200 font-semibold text-sm">Welcome to UltraaxoAI</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-xs leading-relaxed">
              Describe the website you want to build. The agent will write code, install modules, and serve it live.
            </p>
          </div>
        )}

        {activeProject.messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div key={index} className="flex justify-center my-1">
                <span className="text-[10px] bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-full text-zinc-500 font-mono">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed ${
                isUser 
                  ? 'bg-purple-600 text-white rounded-br-none' 
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-none'
              }`}>
                {/* Clean user and thoughts text output */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content.replace(/<tool[\s\S]*?<\/tool>/g, '[Tool Call Executed]')}
                </div>
              </div>
            </div>
          );
        })}

        {/* Live execution steps (inline Replit-style) */}
        {agentSteps.length > 0 && (
          <div className="space-y-2 mt-4 p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-lg">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-2">Agent Execution Steps:</span>
            {agentSteps.map((step) => (
              <CollapsibleStep key={step.id} step={step} />
            ))}
          </div>
        )}
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-zinc-900/60">
        <div className="relative flex items-center">
          <input
            type="text"
            disabled={isAgentRunning}
            placeholder={isAgentRunning ? "Agent is working..." : "Ask UltraaxoAI to build something..."}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isAgentRunning}
            className="absolute right-1.5 p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-purple-600"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

// Collapsible helper step component to render terminal stdout/logs
function CollapsibleStep({ step }: { step: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-zinc-800/80 bg-zinc-950/80 rounded-md overflow-hidden text-xs">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          {step.status === 'running' && (
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></span>
          )}
          {step.status === 'success' && (
            <CheckCircle2 size={13} className="text-emerald-500" />
          )}
          {step.status === 'error' && (
            <AlertCircle size={13} className="text-red-500" />
          )}
          <span className="font-mono text-zinc-300">{step.name}</span>
        </div>
        {step.logs && (
          <span className="text-[10px] text-zinc-500 hover:underline">
            {isOpen ? 'Hide logs' : 'Show logs'}
          </span>
        )}
      </div>
      
      {isOpen && step.logs && (
        <div className="bg-zinc-950 border-t border-zinc-900 p-3 font-mono text-[10px] text-zinc-400 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
          {step.logs}
        </div>
      )}
    </div>
  );
}
