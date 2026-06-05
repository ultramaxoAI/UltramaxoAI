import { useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useProjectStore } from '../store/projectStore';

// Converts flat list of paths to nested tree structure required by WebContainers
// e.g. [{"path": "src/App.tsx", "content": "..."}] -> { src: { directory: { "App.tsx": { file: { contents: "..." } } } } }
export function buildFileTree(files: Array<{ path: string; content: string }>) {
  const tree: any = {};

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = tree;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;

      if (isLast) {
        current[part] = {
          file: {
            contents: file.content,
          },
        };
      } else {
        if (!current[part]) {
          current[part] = {
            directory: {},
          };
        }
        current = current[part].directory;
      }
    });
  });

  return tree;
}

export function useWebContainer() {
  const { webContainer, setWebContainer, isWebContainerBooting, setWebContainerBooting, activeProject } = useProjectStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>('');

  useEffect(() => {
    let active = true;

    async function initWebContainer() {
      // If WebContainer is already booting or booted, skip
      if (webContainer || isWebContainerBooting) return;

      console.log('Booting WebContainer...');
      setWebContainerBooting(true);
      
      try {
        const instance = await WebContainer.boot();
        if (active) {
          setWebContainer(instance);
          console.log('WebContainer booted successfully.');
        }
      } catch (err) {
        console.error('Failed to boot WebContainer:', err);
      } finally {
        if (active) {
          setWebContainerBooting(false);
        }
      }
    }

    initWebContainer();

    return () => {
      active = false;
    };
  }, [webContainer, isWebContainerBooting, setWebContainer, setWebContainerBooting]);

  // Mount files when project changes and WebContainer is ready
  useEffect(() => {
    const wc = webContainer;
    const proj = activeProject;
    if (!wc || !proj) return;

    let serverProcess: any = null;

    async function mountAndStart() {
      if (!wc || !proj) return;
      try {
        console.log('Mounting files into WebContainer...');
        const tree = buildFileTree(proj.files);
        await wc.mount(tree);
        console.log('Files mounted.');

        // Simple terminal logger callback
        const writeToTerminal = (data: string) => {
          setTerminalOutput((prev) => prev + data);
        };

        // Listen for server-ready events
        wc.on('server-ready', (port, url) => {
          console.log(`WebContainer Server Ready on port ${port}: ${url}`);
          setPreviewUrl(url);
        });

        // Trigger npm install
        writeToTerminal('Installing dependencies (npm install)...\r\n');
        const installProcess = await wc.spawn('npm', ['install']);
        
        installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              writeToTerminal(data);
            },
          })
        );

        const installExitCode = await installProcess.exit;
        if (installExitCode !== 0) {
          writeToTerminal('\r\nnpm install failed!\r\n');
          return;
        }

        writeToTerminal('\r\nStarting dev server (npm run dev)...\r\n');
        
        // Start dev server
        serverProcess = await wc.spawn('npm', ['run', 'dev']);
        serverProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              writeToTerminal(data);
            },
          })
        );
      } catch (err) {
        console.error('Error mounting/starting project in WebContainer:', err);
        setTerminalOutput((prev) => prev + `\r\nError: ${err}\r\n`);
      }
    }

    mountAndStart();

    return () => {
      if (serverProcess) {
        try {
          serverProcess.kill();
        } catch (e) {
          // Ignore
        }
      }
      setPreviewUrl(null);
      setTerminalOutput('');
    };
  }, [webContainer, activeProject]);

  return { previewUrl, terminalOutput };
}
