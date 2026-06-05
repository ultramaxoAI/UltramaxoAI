import { useEffect, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useProjectStore } from './project-store';

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
      if (webContainer || isWebContainerBooting) return;

      console.log('Booting WebContainer singleton...');
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

    // Only boot in browser environment
    if (typeof window !== 'undefined') {
      initWebContainer();
    }

    return () => {
      active = false;
    };
  }, [webContainer, isWebContainerBooting, setWebContainer, setWebContainerBooting]);

  useEffect(() => {
    const wc = webContainer;
    const proj = activeProject;
    if (!wc || !proj) return;

    let serverProcess: any = null;

    async function mountAndStart() {
      if (!wc || !proj) return;
      try {
        console.log('Mounting files into WebContainer sandbox...');
        const tree = buildFileTree(proj.files);
        await wc.mount(tree);
        console.log('Files mounted successfully.');

        const writeToTerminal = (data: string) => {
          setTerminalOutput((prev) => prev + data);
        };

        wc.on('server-ready', (port, url) => {
          console.log(`WebContainer Server Ready: ${url} (port ${port})`);
          setPreviewUrl(url);
        });

        writeToTerminal('Installing npm packages (npm install)...\r\n');
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
        
        serverProcess = await wc.spawn('npm', ['run', 'dev']);
        serverProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              writeToTerminal(data);
            },
          })
        );
      } catch (err) {
        console.error('Error starting WebContainer sandbox:', err);
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
