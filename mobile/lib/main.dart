import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:permission_handler/permission_handler.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Minta izin notifikasi dan penyimpanan
  await [
    Permission.notification,
    Permission.storage,
    Permission.camera,
    Permission.microphone,
  ].request();

  // Kunci orientasi ke portrait
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  
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
          background: Color(0xFF09090b), // Sesuai dengan background web
          surface: Color(0xFF09090b),
        ),
        useMaterial3: true,
      ),
      home: const WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController controller;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF09090b))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (progress == 100) {
              setState(() {
                isLoading = false;
              });
            }
          },
          onPageStarted: (String url) {
            setState(() {
              isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              isLoading = false;
            });
            // Inject CSS to hide unwanted elements if needed
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('Web Error: ${error.description}');
          },
          onNavigationRequest: (NavigationRequest request) {
            // Cegah user kembali ke landing page (root /)
            if (request.url == 'https://ultramaxo.tech/' || request.url == 'https://ultramaxo.tech') {
              controller.loadRequest(Uri.parse('https://ultramaxo.tech/login'));
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      // Mulai langsung dari halaman login (Skip landing page)
      ..loadRequest(Uri.parse('https://ultramaxo.tech/login'));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090b),
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: controller),
            if (isLoading)
              const Center(
                child: CircularProgressIndicator(
                  color: Colors.white,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
