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

/// Google OAuth domains that MUST be opened in external browser.
/// WebView is blocked by Google's "Secure Browsers" policy (403 disallowed_useragent).
const List<String> _oauthDomains = [
  'accounts.google.com',
  'accounts.youtube.com',
  'oauth.googleusercontent.com',
  'github.com/login/oauth',
  'github.com/sessions',
];

/// Standard Chrome Mobile User-Agent (no `wv` marker).
/// Google detects `; wv)` in WebView UAs and blocks OAuth.
const String _chromeUserAgent =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 '
    '(KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36';

// ─── Main Entry ──────────────────────────────────────────────────────────────

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUIOverlayStyle(
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
  String _pageTitle = 'UltramaxoAI';
  bool _canGoBack = false;
  bool _wasInBackground = false;

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

  /// Detect when app comes back from background (after OAuth in browser).
  /// Reload the WebView to pick up the authenticated session.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      _wasInBackground = true;
    }
    if (state == AppLifecycleState.resumed && _wasInBackground) {
      _wasInBackground = false;
      // User came back from external browser (likely after OAuth).
      // Reload to check if they are now authenticated.
      debugPrint('[UltramaxoAI] App resumed — reloading WebView');
      _mainController.reload();
    }
  }

  Future<void> _requestPermissions() async {
    await [
      Permission.notification,
      Permission.camera,
      Permission.microphone,
    ].request();
  }

  /// Check if a URL is a Google/GitHub OAuth URL that must open externally.
  bool _isOAuthUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return false;
    return _oauthDomains.any((domain) => uri.host.contains(domain) || url.contains(domain));
  }

  /// Open Google/GitHub OAuth in Chrome Custom Tab.
  /// Google blocks OAuth in embedded WebViews (Error 403: disallowed_useragent)
  /// but ALLOWS Chrome Custom Tabs — they are Google's recommended solution.
  /// Chrome Custom Tabs also share cookies with the default browser.
  Future<void> _handleOAuthInBrowser(String url) async {
    final uri = Uri.parse(url);
    debugPrint('[UltramaxoAI] Opening OAuth in Chrome Custom Tab: $url');

    if (await canLaunchUrl(uri)) {
      // Use Chrome Custom Tab (inAppBrowserView) — Google allows OAuth here
      // Unlike externalApplication, this keeps the user in the app experience
      await launchUrl(
        uri,
        mode: LaunchMode.inAppBrowserView,
        browserConfiguration: const BrowserConfiguration(showTitle: true),
      );

      // Show instruction to user
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'Login selesai? Page akan reload otomatis.',
              style: TextStyle(color: Colors.white, fontSize: 13),
            ),
            backgroundColor: const Color(0xFF3B82F6),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            duration: const Duration(seconds: 3),
            margin: const EdgeInsets.all(16),
          ),
        );
      }
    } else {
      // Fallback: open in external browser
      debugPrint('[UltramaxoAI] Chrome Custom Tab unavailable, trying external');
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
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

            final canGoBack = await _mainController.canGoBack();
            if (mounted) setState(() => _canGoBack = canGoBack);

            final title = await _mainController.getTitle();
            if (mounted && title != null && title.isNotEmpty) {
              setState(() => _pageTitle = title);
            }

            // Inject mobile-optimized CSS
            _injectMobileCSS();
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('[UltramaxoAI] WebView error: ${error.description}');
          },
          onNavigationRequest: (NavigationRequest request) {
            final url = request.url;

            // ── Allow OAuth callback URLs to process inside WebView ──
            // These are our own domain URLs that complete the OAuth flow
            if (url.contains('/api/auth/callback/') ||
                url.contains('/api/auth/signin') ||
                url.contains('/oauth/google') ||
                url.contains('/oauth/github')) {
              return NavigationDecision.navigate;
            }

            // ── Google/GitHub OAuth → try Chrome Custom Tab ──
            // Google blocks OAuth in embedded WebViews (Error 403: disallowed_useragent)
            // We detect Google's auth pages and open them externally
            if (_isOAuthUrl(url)) {
              _handleOAuthInBrowser(url);
              return NavigationDecision.prevent;
            }

            // ── Block navigation to landing page root ──
            if (url == '$_baseUrl/' || url == _baseUrl) {
              _mainController.loadRequest(Uri.parse('$_baseUrl/login'));
              return NavigationDecision.prevent;
            }

            // ── Allow all ultramaxo.tech navigation ──
            if (url.contains('ultramaxo.tech') ||
                url.startsWith(_baseUrl)) {
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
        style.textContent = \`
          /* Hide desktop sidebar trigger in app */
          [data-sidebar="trigger"] { display: none !important; }
          [data-sidebar="rail"] { display: none !important; }

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
        \`;
        document.head.appendChild(style);
      })();
    ''');
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;
    final statusBarHeight = MediaQuery.of(context).padding.top;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: _bgDark,

      // ── Swipe-open Drawer (ChatGPT-style) ──
      drawer: _AppDrawer(
        onNavigate: (url) {
          _mainController.loadRequest(Uri.parse(url));
          Navigator.of(context).pop();
        },
      ),
      drawerEdgeDragWidth: 40,
      drawerEnableOpenDragGesture: true,

      body: SafeArea(
        child: Column(
          children: [
            // ── Top Bar ──
            _TopBar(
              title: _pageTitle,
              canGoBack: _canGoBack,
              isLoading: _isLoading,
              onMenuTap: () => _scaffoldKey.currentState?.openDrawer(),
              onBackTap: () => _mainController.goBack(),
              onRefreshTap: () => _mainController.reload(),
            ),

            // ── WebView ──
            Expanded(
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
          ],
        ),
      ),
    );
  }
}

// ─── App Drawer ──────────────────────────────────────────────────────────────

class _AppDrawer extends StatelessWidget {
  final void Function(String url) onNavigate;

  const _AppDrawer({required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: MediaQuery.of(context).size.width * 0.82,
      backgroundColor: _bgDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ── Header ──
            Container(
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
              decoration: BoxDecoration(
                border: Border(
                  bottom:
                      BorderSide(color: _accentColor.withOpacity(0.3), width: 1),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      gradient: const LinearGradient(
                          colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)]),
                    ),
                    child: const Center(
                      child: Text('U',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('UltramaxoAI',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: _textPrimary,
                            letterSpacing: -0.3)),
                  ),
                  _DrawerIconButton(
                    icon: Icons.add_rounded,
                    onTap: () => onNavigate('$_baseUrl/chat'),
                    tooltip: 'New Chat',
                  ),
                ],
              ),
            ),

            // ── Quick Actions ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: _QuickActionChip(
                      icon: Icons.chat_bubble_outline_rounded,
                      label: 'New Chat',
                      onTap: () => onNavigate('$_baseUrl/chat'),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _QuickActionChip(
                      icon: Icons.settings_rounded,
                      label: 'Settings',
                      onTap: () => onNavigate('$_baseUrl/settings'),
                    ),
                  ),
                ],
              ),
            ),

            Divider(color: _accentColor.withOpacity(0.2), height: 1),

            // ── Navigation Items ──
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _DrawerNavItem(
                    icon: Icons.home_rounded,
                    label: 'Home',
                    onTap: () => onNavigate('$_baseUrl/chat'),
                  ),
                  _DrawerNavItem(
                    icon: Icons.history_rounded,
                    label: 'Chat History',
                    onTap: () => onNavigate('$_baseUrl/chat'),
                  ),
                  _DrawerNavItem(
                    icon: Icons.code_rounded,
                    label: 'IDE Mode',
                    onTap: () => onNavigate('$_baseUrl/chat'),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Divider(color: _accentColor, height: 1),
                  ),
                  _DrawerNavItem(
                    icon: Icons.person_rounded,
                    label: 'Profile',
                    onTap: () => onNavigate('$_baseUrl/settings'),
                  ),
                  _DrawerNavItem(
                    icon: Icons.help_outline_rounded,
                    label: 'Help & FAQ',
                    onTap: () => onNavigate('$_baseUrl'),
                  ),
                ],
              ),
            ),

            // ── Footer ──
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: _accentColor.withOpacity(0.2), width: 1),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('UltramaxoAI',
                      style: TextStyle(
                          fontSize: 12,
                          color: _textMuted,
                          fontWeight: FontWeight.w500)),
                  Text(' • v1.0.0',
                      style: TextStyle(fontSize: 12, color: _textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Top Bar ─────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final String title;
  final bool canGoBack;
  final bool isLoading;
  final VoidCallback onMenuTap;
  final VoidCallback onBackTap;
  final VoidCallback onRefreshTap;

  const _TopBar({
    required this.title,
    required this.canGoBack,
    required this.isLoading,
    required this.onMenuTap,
    required this.onBackTap,
    required this.onRefreshTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 52,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: _bgDark,
        border: Border(
          bottom: BorderSide(color: _accentColor.withOpacity(0.2), width: 0.5),
        ),
      ),
      child: Row(
        children: [
          _TopBarButton(
            icon: canGoBack ? Icons.arrow_back_rounded : Icons.menu_rounded,
            onTap: canGoBack ? onBackTap : onMenuTap,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _cleanTitle(title),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: _textPrimary,
                  letterSpacing: -0.2),
            ),
          ),
          _TopBarButton(icon: Icons.refresh_rounded, onTap: onRefreshTap),
        ],
      ),
    );
  }

  String _cleanTitle(String raw) {
    return raw
        .replaceAll(RegExp(r'\s*\|\s*UltramaxoAI'), '')
        .replaceAll('UltramaxoAI - The Uncensored AI Workspace', 'UltramaxoAI')
        .trim();
  }
}

// ─── Reusable Widgets ────────────────────────────────────────────────────────

class _TopBarButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _TopBarButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          child: Icon(icon, color: _textPrimary, size: 22),
        ),
      ),
    );
  }
}

class _DrawerIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final String tooltip;

  const _DrawerIconButton(
      {required this.icon, required this.onTap, required this.tooltip});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            child: Icon(icon, color: _textMuted, size: 20),
          ),
        ),
      ),
    );
  }
}

class _DrawerNavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerNavItem(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 20, color: _textMuted),
              const SizedBox(width: 16),
              Text(label,
                  style: const TextStyle(
                      fontSize: 15,
                      color: _textPrimary,
                      fontWeight: FontWeight.w400)),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickActionChip(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _bgSurface,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 16, color: _textMuted),
              const SizedBox(width: 6),
              Text(label,
                  style: const TextStyle(
                      fontSize: 13,
                      color: _textPrimary,
                      fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}
