import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';

// ─── Constants ───────────────────────────────────────────────────────────────

const String _baseUrl = 'https://ultramaxo.tech';
const Color _bgDark = Color(0xFF09090b);
const Color _bgSurface = Color(0xFF18181b);
const Color _accentColor = Color(0xFF52525b);
const Color _textPrimary = Color(0xFFF4F4F5);
const Color _textMuted = Color(0xFF71717A);

/// Standard Chrome Mobile User-Agent (no `wv` marker).
/// Google detects `; wv)` in WebView UAs and blocks OAuth.
const String _chromeUserAgent =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36';

// ─── Main Entry ──────────────────────────────────────────────────────────────

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: _bgDark,
    systemNavigationBarIconBrightness: Brightness.light,
  ));
  runApp(const UltramaxoApp());
}

class UltramaxoApp extends StatelessWidget {
  const UltramaxoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UltramaxoAI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: const ColorScheme.dark(
          surface: _bgDark,
          primary: _textPrimary,
          secondary: _accentColor,
        ),
        scaffoldBackgroundColor: _bgDark,
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    );
  }
}

// ─── Splash Screen ───────────────────────────────────────────────────────────

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeIn;
  late Animation<double> _scaleIn;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _fadeIn = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _scaleIn = Tween<double>(begin: 0.8, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward();

    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => const MainScreen(),
            transitionsBuilder: (_, animation, __, child) =>
                FadeTransition(opacity: animation, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgDark,
      body: Center(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Opacity(
              opacity: _fadeIn.value,
              child: Transform.scale(
                scale: _scaleIn.value,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF3B82F6).withOpacity(0.3),
                            blurRadius: 30,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Text('U',
                            style: TextStyle(
                                fontSize: 40,
                                fontWeight: FontWeight.bold,
                                color: Colors.white)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text('UltramaxoAI',
                        style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: _textPrimary,
                            letterSpacing: -0.5)),
                    const SizedBox(height: 8),
                    const Text('The Uncensored AI Workspace',
                        style: TextStyle(
                            fontSize: 14,
                            color: _textMuted,
                            letterSpacing: 0.5)),
                    const SizedBox(height: 40),
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: _textMuted.withOpacity(0.5),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with WidgetsBindingObserver {
  late final WebViewController _mainController;
  bool _isLoading = true;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _requestPermissions();
    _initMainController();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.notification,
      Permission.camera,
      Permission.microphone,
    ].request();
  }

  /// Open any external URL in browser
  Future<void> _openInExternalBrowser(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _initMainController() {
    _mainController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(_bgDark)
      // Clean Chrome UA — NO `wv` marker so Google doesn't block OAuth.
      ..setUserAgent(_chromeUserAgent)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (progress == 100 && mounted) {
              setState(() => _isLoading = false);
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() => _isLoading = true);
            }
          },
          onPageFinished: (String url) async {
            if (!mounted) return;
            setState(() => _isLoading = false);
            // Inject mobile-optimized CSS
            _injectMobileCSS();
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('[UltramaxoAI] WebView error: ${error.description}');
          },
          onNavigationRequest: (NavigationRequest request) {
            final url = request.url;

            // ── Block navigation to landing page root ──
            if (url == '$_baseUrl/' || url == _baseUrl) {
              _mainController.loadRequest(Uri.parse('$_baseUrl/login'));
              return NavigationDecision.prevent;
            }

            // ── Allow all ultramaxo.tech navigation, including auth ──
            if (url.contains('ultramaxo.tech') ||
                url.startsWith(_baseUrl)) {
              return NavigationDecision.navigate;
            }

            // Allow Google/GitHub auth inside webview since UA is modified
            if (url.contains('accounts.google.com') ||
                url.contains('accounts.youtube.com') ||
                url.contains('oauth.googleusercontent.com') ||
                url.contains('github.com/login') ||
                url.contains('github.com/sessions')) {
              return NavigationDecision.navigate;
            }

            // ── External links → open in browser ──
            if (!url.startsWith('about:') &&
                !url.startsWith('data:') &&
                !url.startsWith('javascript:')) {
              _openInExternalBrowser(url);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse('$_baseUrl/login'));
  }

  void _injectMobileCSS() {
    _mainController.runJavaScript('''
      (function() {
        if (window.__ultramaxoMobileInjected) return;
        window.__ultramaxoMobileInjected = true;

        document.documentElement.classList.add('dark');

        var style = document.createElement('style');
        style.id = 'ultramaxo-mobile-css';
        style.textContent = `
          /* Improve touch targets */
          button, a, [role="button"] { min-height: 44px; }

          /* Better scrolling */
          * { -webkit-overflow-scrolling: touch; }

          /* Hide scrollbars */
          ::-webkit-scrollbar { display: none !important; }
          * { scrollbar-width: none !important; }

          /* Prevent text selection on chrome */
          button, nav, header, footer { -webkit-user-select: none; user-select: none; }

          /* Safe area padding */
          body {
            padding-top: env(safe-area-inset-top, 0) !important;
            padding-bottom: env(safe-area-inset-bottom, 0) !important;
          }
        `;
        document.head.appendChild(style);
      })();
    ''');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: _bgDark,
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _mainController),
            if (_isLoading)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(
                  minHeight: 2,
                  backgroundColor: Colors.transparent,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    const Color(0xFF3B82F6).withOpacity(0.8),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
