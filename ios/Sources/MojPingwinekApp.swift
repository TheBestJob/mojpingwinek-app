import SwiftUI
import WebKit
import UniformTypeIdentifiers
import UIKit

private enum AppConfig {
    // The iOS app shares Firebase login, Firestore, and document storage with the web app.
    static let homepage = URL(string: "https://thebestjob.github.io/mojpingwinek-app/v5.2.html")!
    static let allowedHost = "thebestjob.github.io"
}

@main
struct MojPingwinekApp: App {
    var body: some Scene {
        WindowGroup {
            PingwinekBrowser()
        }
    }
}

@MainActor
final class BrowserState: ObservableObject {
    @Published var loading = true
    @Published var offline = false
    @Published var loadError: String?
    weak var webView: WKWebView?

    func retry() {
        offline = false
        loadError = nil
        loading = true
        webView?.load(URLRequest(url: AppConfig.homepage))
    }
}

struct PingwinekBrowser: View {
    @StateObject private var state = BrowserState()

    var body: some View {
        ZStack {
            Color(red: 0.976, green: 0.976, blue: 1.0).ignoresSafeArea()
            PingwinekWebView(state: state)
                .ignoresSafeArea(edges: .bottom)
            if state.loading {
                VStack(spacing: 14) {
                    ProgressView()
                        .controlSize(.large)
                        .tint(Color(red: 0.0, green: 0.38, blue: 0.5))
                    Text("Łączenie z Mój Pingwinek…")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(24)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            }
            if state.offline {
                VStack(spacing: 15) {
                    Image(systemName: "wifi.slash")
                        .font(.system(size: 35))
                        .foregroundStyle(.secondary)
                    Text("Brak połączenia")
                        .font(.headline)
                    Text(state.loadError ?? "Sprawdź połączenie internetowe i spróbuj ponownie.")
                        .multilineTextAlignment(.center)
                        .font(.subheadline)
                    Button("Spróbuj ponownie") { state.retry() }
                        .buttonStyle(.borderedProminent)
                }
                .padding(30)
                .frame(maxWidth: 360)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 22))
                .padding()
            }
        }
    }
}

struct PingwinekWebView: UIViewRepresentable {
    @ObservedObject var state: BrowserState

    func makeCoordinator() -> Coordinator { Coordinator(state: state) }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.allowsInlineMediaPlayback = true

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.backgroundColor = UIColor(red: 0.976, green: 0.976, blue: 1.0, alpha: 1)
        webView.isOpaque = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = true
        webView.load(URLRequest(url: AppConfig.homepage, cachePolicy: .useProtocolCachePolicy))
        state.webView = webView
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKDownloadDelegate {
        private let state: BrowserState
        private var fileDestination: URL?

        init(state: BrowserState) { self.state = state }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            state.loading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            state.loading = false
            state.offline = false
            state.loadError = nil
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            display(error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            display(error)
        }

        private func display(_ error: Error) {
            let nsError = error as NSError
            // -999 indicates a cancelled navigation; not an offline condition.
            if nsError.code == NSURLErrorCancelled { return }
            state.loading = false
            state.offline = true
            state.loadError = "Nie udało się otworzyć aplikacji. Sprawdź internet i spróbuj ponownie."
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if navigationAction.shouldPerformDownload {
                decisionHandler(.download)
                return
            }
            if url.scheme == "blob" {
                // The web app uses Blob URLs for downloading private Supabase files.
                // WebKit may pass these to WKDownload on supported iOS versions.
                decisionHandler(.download)
                return
            }
            if url.scheme == "about" {
                decisionHandler(.allow)
                return
            }
            if url.scheme == "https", url.host == AppConfig.allowedHost {
                decisionHandler(.allow)
                return
            }
            // Keep third-party pages and non-app links in the system browser.
            if ["http", "https", "mailto", "tel"].contains(url.scheme ?? "") {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationResponse: WKNavigationResponse,
                     decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
            decisionHandler(navigationResponse.canShowMIMEType ? .allow : .download)
        }

        func webView(_ webView: WKWebView, navigationAction: WKNavigationAction,
                     didBecome download: WKDownload) {
            download.delegate = self
        }

        func webView(_ webView: WKWebView, navigationResponse: WKNavigationResponse,
                     didBecome download: WKDownload) {
            download.delegate = self
        }

        func download(_ download: WKDownload, decideDestinationUsing response: URLResponse,
                      suggestedFilename: String, completionHandler: @escaping (URL?) -> Void) {
            let filename = URL(fileURLWithPath: suggestedFilename).lastPathComponent
                .replacingOccurrences(of: "/", with: "_")
            let destination = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString + "-" + filename)
            fileDestination = destination
            completionHandler(destination)
        }

        func downloadDidFinish(_ download: WKDownload) {
            guard let fileDestination else { return }
            // Present the iOS Files export interface; users control where to save files.
            let picker = UIDocumentPickerViewController(forExporting: [fileDestination], asCopy: true)
            if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController {
                var presenter = root
                while let presented = presenter.presentedViewController { presenter = presented }
                presenter.present(picker, animated: true)
            }
            self.fileDestination = nil
        }

        func download(_ download: WKDownload, didFailWithError error: Error,
                      resumeData: Data?) {
            fileDestination = nil
            print("Document download failed: \(error.localizedDescription)")
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil, let url = navigationAction.request.url {
                if url.host == AppConfig.allowedHost {
                    webView.load(URLRequest(url: url))
                } else {
                    UIApplication.shared.open(url)
                }
            }
            return nil
        }
    }
}
