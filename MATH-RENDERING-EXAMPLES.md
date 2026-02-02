# Panduan Menulis Rumus Matematika untuk AI

AI UltramaxoAI sekarang sudah support rendering rumus matematika menggunakan LaTeX/KaTeX! 🎉

## Cara Penggunaan

### 1. Inline Math (di dalam kalimat)
Gunakan `$...$` untuk rumus di tengah kalimat:
```
Rumus kuadrat adalah $ax^2 + bx + c = 0$
```

### 2. Display Math (rumus terpisah/blok)
Gunakan `$$...$$` untuk rumus yang ditampilkan terpisah:
```
$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
```

## Contoh Rumus yang Bisa Digunakan

### Aljabar
- Persamaan linear: `$2x + y = 15.000$`
- Persamaan umum: `$ax + by = c$`
- Kuadrat: `$x^2 + 5x + 6 = 0$`

### Geometri
- Luas lingkaran: `$A = \pi r^2$`
- Teorema Pythagoras: `$a^2 + b^2 = c^2$`
- Volume bola: `$V = \frac{4}{3}\pi r^3$`

### Fisika
- Energi: `$$E = mc^2$$`
- Gaya: `$F = ma$`
- Percepatan gravitasi: `$g = 9.8 \text{ m/s}^2$`

### Kalkulus
- Turunan: `$\frac{dy}{dx}$`
- Integral: `$\int_0^1 x^2 dx$`
- Limit: `$\lim_{x \to \infty} \frac{1}{x} = 0$`

### Statistika
- Mean: `$\bar{x} = \frac{\sum x_i}{n}$`
- Standar deviasi: `$\sigma = \sqrt{\frac{\sum (x_i - \mu)^2}{n}}$`
- Probabilitas: `$P(A \cap B) = P(A) \cdot P(B|A)$`

## Contoh Prompt untuk Testing

Coba tanyakan ke AI:

1. **"Jelaskan rumus kuadrat dan berikan contohnya"**
   - AI akan menulis: $ax^2 + bx + c = 0$ dan solusinya

2. **"Buatkan soal matematika tentang persamaan linear dua variabel"**
   - AI akan buat soal seperti: $2x + y = 15.000$

3. **"Jelaskan teorema Pythagoras dengan rumusnya"**
   - AI akan menulis: $a^2 + b^2 = c^2$

4. **"Berapa rumus luas lingkaran?"**
   - AI akan jawab: $A = \pi r^2$

5. **"Jelaskan rumus Einstein tentang energi"**
   - AI akan menulis: $$E = mc^2$$

## Simbol LaTeX Umum

| Simbol | LaTeX | Hasil |
|--------|-------|-------|
| Pangkat | `x^2` | $x^2$ |
| Subscript | `x_1` | $x_1$ |
| Pecahan | `\frac{a}{b}` | $\frac{a}{b}$ |
| Akar | `\sqrt{x}` | $\sqrt{x}$ |
| Pi | `\pi` | $\pi$ |
| Alpha | `\alpha` | $\alpha$ |
| Beta | `\beta` | $\beta$ |
| Theta | `\theta` | $\theta$ |
| Sigma | `\sigma` | $\sigma$ |
| Sum | `\sum` | $\sum$ |
| Integral | `\int` | $\int$ |
| Infinity | `\infty` | $\infty$ |
| Plus/Minus | `\pm` | $\pm$ |
| Multiply | `\times` | $\times$ |
| Divide | `\div` | $\div$ |
| Greater/Equal | `\geq` | $\geq$ |
| Less/Equal | `\leq` | $\leq$ |

## Tips

1. **Gunakan inline** (`$...$`) untuk rumus pendek di tengah kalimat
2. **Gunakan display** (`$$...$$`) untuk rumus penting yang perlu highlighted
3. **Escape backslash** dengan double backslash `\\` untuk LaTeX commands
4. **Gunakan kurung kurawal** `{}` untuk grouping: `x^{10}` bukan `x^10`

---

Sekarang AI kamu bisa nulis rumus matematika se-keren Google Gemini! 🚀
