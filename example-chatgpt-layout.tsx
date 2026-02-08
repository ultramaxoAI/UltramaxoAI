/**
 * Contoh Layout Chat dengan ChatGPT Dark Mode Theme
 * 
 * Warna yang digunakan:
 * - bg-gpt-main: #343541 (background chat area)
 * - bg-gpt-sidebar: #202123 (sidebar)
 * - bg-gpt-card: #444654 (bubble chat / input box)
 * - text-gpt-text: #ECECF1 (text utama)
 */

export default function ChatGPTLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - ChatGPT Style */}
      <aside className="w-64 bg-gpt-sidebar border-r border-white/10 flex flex-col">
        {/* Header Sidebar */}
        <div className="p-3">
          <button className="w-full bg-gpt-card hover:bg-gpt-main text-gpt-text rounded-lg px-4 py-3 text-left transition-colors flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {/* Sample Chat Items */}
          <div className="bg-gpt-card text-gpt-text rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gpt-main transition-colors">
            💬 Previous conversation 1
          </div>
          <div className="text-gpt-text/70 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gpt-card transition-colors">
            💬 Previous conversation 2
          </div>
          <div className="text-gpt-text/70 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gpt-card transition-colors">
            💬 Previous conversation 3
          </div>
        </div>

        {/* User Info at Bottom */}
        <div className="p-3 border-t border-white/10">
          <div className="bg-gpt-card hover:bg-gpt-main text-gpt-text rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              U
            </div>
            <span>User Name</span>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 bg-gpt-main flex flex-col">
        {/* Chat Header */}
        <header className="bg-gpt-main border-b border-white/10 px-6 py-4">
          <h1 className="text-gpt-text text-xl font-semibold">UltramaxoAI Chat</h1>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
            {/* User Message Bubble */}
            <div className="flex justify-end">
              <div className="bg-gpt-card text-gpt-text rounded-2xl px-5 py-3 max-w-[80%] shadow-lg">
                <p className="text-sm leading-relaxed">
                  Halo! Tolong jelaskan tentang AI dan machine learning dengan bahasa yang sederhana.
                </p>
              </div>
            </div>

            {/* AI Response Bubble */}
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                {/* AI Avatar */}
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">
                  AI
                </div>
                {/* Message Content */}
                <div className="bg-gpt-card text-gpt-text rounded-2xl px-5 py-4 shadow-lg">
                  <p className="text-sm leading-relaxed mb-3">
                    Tentu! AI (Artificial Intelligence) adalah teknologi yang membuat komputer bisa "berpikir" 
                    seperti manusia. Bayangkan komputer yang bisa:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-2 text-gpt-text/90">
                    <li>Mengenali wajah dalam foto</li>
                    <li>Memahami pertanyaan kamu dan menjawabnya</li>
                    <li>Memprediksi cuaca besok</li>
                    <li>Merekomendasikan video yang kamu suka</li>
                  </ul>
                  <p className="text-sm leading-relaxed mt-3">
                    Machine Learning adalah cara komputer "belajar" dari pengalaman. Bukan diprogram satu per satu, 
                    tapi komputer belajar dari data yang diberikan.
                  </p>
                </div>
              </div>
            </div>

            {/* Another User Message */}
            <div className="flex justify-end">
              <div className="bg-gpt-card text-gpt-text rounded-2xl px-5 py-3 max-w-[80%] shadow-lg">
                <p className="text-sm leading-relaxed">
                  Menarik! Bisakah kamu berikan contoh penggunaan AI dalam kehidupan sehari-hari?
                </p>
              </div>
            </div>

            {/* AI Response with Code Example */}
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 mt-1">
                  AI
                </div>
                <div className="bg-gpt-card text-gpt-text rounded-2xl px-5 py-4 shadow-lg">
                  <p className="text-sm leading-relaxed mb-3">
                    Contoh AI dalam kehidupan sehari-hari:
                  </p>
                  <ol className="list-decimal list-inside text-sm space-y-2 text-gpt-text/90">
                    <li><strong>Voice Assistant</strong> - Siri, Google Assistant, Alexa</li>
                    <li><strong>Rekomendasi</strong> - Netflix, Spotify, YouTube</li>
                    <li><strong>Filter Spam Email</strong> - Gmail secara otomatis memblokir spam</li>
                    <li><strong>Face Unlock</strong> - Smartphone mengenali wajah kamu</li>
                    <li><strong>Google Maps</strong> - Prediksi traffic dan rute terbaik</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area at Bottom */}
        <div className="bg-gpt-main border-t border-white/10 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-gpt-card rounded-2xl shadow-xl flex items-center gap-3 px-4 py-3 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              {/* Attachment Button */}
              <button className="text-gpt-text/60 hover:text-gpt-text transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              {/* Text Input */}
              <input 
                type="text"
                placeholder="Send a message..."
                className="flex-1 bg-transparent text-gpt-text placeholder:text-gpt-text/40 outline-none text-sm"
              />

              {/* Send Button */}
              <button className="bg-primary hover:bg-primary/90 text-white rounded-lg p-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>

            {/* Footer Text */}
            <p className="text-center text-gpt-text/40 text-xs mt-3">
              UltramaxoAI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
