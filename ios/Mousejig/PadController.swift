import AudioToolbox
import CoreHaptics
import UIKit
import WebKit

final class PadController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler {
    private var webView: WKWebView!
    private let paper = UIColor(red: 247/255, green: 248/255, blue: 243/255, alpha: 1)

    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = paper
        let configuration = WKWebViewConfiguration()
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = paper
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: safe.topAnchor),
            webView.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: safe.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
        ])
        guard let page = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "app") else {
            preconditionFailure("Mousejig's bundled interface is missing.")
        }
        webView.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        webView.configuration.userContentController.add(self, name: "power")
        if CHHapticEngine.capabilitiesForHardware().supportsHaptics {
            webView.configuration.userContentController.add(self, name: "pulse")
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "power")
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "pulse")
        suspend()
    }

    func userContentController(_ controller: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, let enabled = message.body as? Bool else { return }
        let foreground = view.window?.windowScene?.activationState == .foregroundActive
        if message.name == "power" {
            UIApplication.shared.isIdleTimerDisabled = enabled && foreground
        } else if message.name == "pulse", enabled && foreground {
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        }
    }

    func suspend() {
        UIApplication.shared.isIdleTimerDisabled = false
        webView?.evaluateJavaScript("window.mousejig && window.mousejig.suspend()", completionHandler: nil)
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let local = action.request.url?.isFileURL == true && action.targetFrame?.isMainFrame == true
        decisionHandler(local ? .allow : .cancel)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        UIApplication.shared.isIdleTimerDisabled = false
        webView.reload()
    }
}
