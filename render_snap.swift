import Foundation
import WebKit
import AppKit

let htmlPath = CommandLine.arguments[1]
let outPath = CommandLine.arguments[2]

let app = NSApplication.shared
let delegate = AppDelegate(htmlPath: htmlPath, outPath: outPath)
app.delegate = delegate
app.run()

class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    let htmlPath: String
    let outPath: String
    var webView: WKWebView!
    var window: NSWindow!

    init(htmlPath: String, outPath: String) {
        self.htmlPath = htmlPath
        self.outPath = outPath
        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        let height = CommandLine.arguments.count > 3 ? Double(CommandLine.arguments[3])! : 5400.0
        let frame = CGRect(x: 0, y: 0, width: 1440, height: height)
        webView = WKWebView(frame: frame, configuration: config)
        webView.navigationDelegate = self

        let url = URL(fileURLWithPath: htmlPath)
        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            webView.evaluateJavaScript("document.documentElement.scrollHeight") { result, error in
                let fullHeight = (result as? CGFloat) ?? 6000.0
                print("Measured document height: \(fullHeight)")
                webView.frame = CGRect(x: 0, y: 0, width: 1440, height: fullHeight)
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    let config = WKSnapshotConfiguration()
                    config.snapshotWidth = 1440
                    self.webView.takeSnapshot(with: config) { image, error in
                        if let image = image, let tiff = image.tiffRepresentation, let rep = NSBitmapImageRep(data: tiff), let png = rep.representation(using: .png, properties: [:]) {
                            try? png.write(to: URL(fileURLWithPath: self.outPath))
                            print("Snapshot saved to \(self.outPath)")
                        } else {
                            print("Error taking snapshot: \(String(describing: error))")
                        }
                        exit(0)
                    }
                }
            }
        }
    }
}
