const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    // Wait until network is idle to ensure the Notion SPA loads the content
    await page.goto('https://maiarouter.notion.site/MAIA-Router-API-Quick-Start-2a1e955fd85480738376ed283c352232', { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Extract inner text
    const text = await page.evaluate(() => document.body.innerText);
    
    // Find where the image gen or imagen is mentioned
    const lines = text.split('\n');
    let output = [];
    let capture = false;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('generate') || lines[i].toLowerCase().includes('imagen') || lines[i].toLowerCase().includes('image')) {
            output.push('--- Match found ---');
            output.push(...lines.slice(Math.max(0, i-5), Math.min(lines.length, i+15)));
        }
    }
    
    console.log(output.join('\n'));
    if(output.length === 0) console.log("Nothing found. Here is raw text snippet:\n" + text.slice(0, 500));
  } catch(e) {
      console.error(e);
  } finally {
      await browser.close();
  }
})();
