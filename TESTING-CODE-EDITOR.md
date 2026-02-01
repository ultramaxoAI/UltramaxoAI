# Testing Code Editor Multi-Language

## Quick Test

1. **Start development server:**
```bash
pnpm dev
```

2. **Test scenarios:**

### Test 1: Python Calculator
Ask: "buatin kode python kalkulator sederhana"
Expected: 
- Artifact opens with Python code
- Language indicator shows "PYTHON"
- Run button executes and shows output in console

### Test 2: HTML Calculator
Ask: "buatin kalkulator sederhana dengan HTML"
Expected:
- Artifact opens with HTML code
- Language indicator shows "HTML"
- Run button renders interactive calculator in iframe

### Test 3: JavaScript Array Operations
Ask: "buatin code javascript untuk filter array"
Expected:
- Artifact opens with JavaScript code
- Language indicator shows "JAVASCRIPT"
- Run button executes and shows console.log output

### Test 4: TypeScript Type Demo
Ask: "buatin contoh TypeScript dengan interface"
Expected:
- Artifact opens with TypeScript code
- Language indicator shows "TYPESCRIPT"

## What to Verify

✅ Artifact opens automatically when AI generates code
✅ Code is editable in the editor
✅ Syntax highlighting works for different languages
✅ Language indicator appears in top-right corner
✅ Run button works for Python, JavaScript, HTML
✅ Output appears in console at bottom
✅ HTML renders in iframe safely
✅ Errors are shown clearly when code fails

## Notes

- First run of Python code may take time (loading Pyodide)
- JavaScript console.log() output appears as text
- HTML output appears as interactive iframe
- Editor supports basic CodeMirror features (syntax highlighting, line numbers, etc.)
