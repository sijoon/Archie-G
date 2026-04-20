import WebKit

class BridgeManager: NSObject, WKScriptMessageHandler {
    weak var webView: WKWebView?
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "archieBridge" {
            handleMessage(message.body)
        }
    }
    
    private func handleMessage(_ body: Any) {
        print("Received bridge message: \(body)")
        // Native logic triggered by Web
    }
    
    func sendToWeb(event: String, payload: [String: Any]) {
        let json = "JSON.stringify({event: '\(event)', data: \(payload)})"
        webView?.evaluateJavaScript("window.onNativeEvent(\(json))")
    }
}
