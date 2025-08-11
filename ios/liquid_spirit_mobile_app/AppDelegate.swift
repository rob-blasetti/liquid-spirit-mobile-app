import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import UserNotifications

@main
class AppDelegate: RCTAppDelegate, UNUserNotificationCenterDelegate {
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    self.moduleName = "liquid_spirit_mobile_app"
    self.dependencyProvider = RCTAppDependencyProvider()

    // You can add your custom initial props in the dictionary below.
    // They will be passed down to the ViewController used by React Native.
    self.initialProps = [:]

    // Notifications delegate
    UNUserNotificationCenter.current().delegate = self

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
        RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
        Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  override func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return RCTLinkingManager.application(application, open: url, options: options)
  }

  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }

  // MARK: - APNs registration callbacks
  override func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    APNs.shared?.setDeviceToken(token)
  }

  override func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("APNs registration failed: \(error)")
  }

  // Foreground notification presentation
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    completionHandler([.banner, .sound, .badge])
    APNs.shared?.emitNotification(notification: notification)
  }

  // User tapped a notification
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    APNs.shared?.emitNotificationResponse(response: response)
    completionHandler()
  }
}

// MARK: - React Native bridge for APNs
@objc(APNs)
class APNs: RCTEventEmitter {
  static var shared: APNs?
  private var token: String?
  private var lastOpenedPayload: [AnyHashable: Any]?

  override init() {
    super.init()
    APNs.shared = self
  }

  override class func requiresMainQueueSetup() -> Bool { true }
  override func supportedEvents() -> [String]! { ["apnsToken", "notification", "notificationOpened"] }

  @objc func register() {
    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
      DispatchQueue.main.async {
        if granted {
          UIApplication.shared.registerForRemoteNotifications()
        }
      }
    }
  }

  @objc(getToken:rejecter:)
  func getToken(resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(token)
  }

  @objc(getInitialNotification:rejecter:)
  func getInitialNotification(resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
    resolve(lastOpenedPayload)
    lastOpenedPayload = nil
  }

  func setDeviceToken(_ token: String) {
    self.token = token
    sendEvent(withName: "apnsToken", body: ["token": token])
  }

  func emitNotification(notification: UNNotification) {
    let userInfo = notification.request.content.userInfo
    sendEvent(withName: "notification", body: userInfo)
  }

  func emitNotificationResponse(response: UNNotificationResponse) {
    let userInfo = response.notification.request.content.userInfo
    sendEvent(withName: "notificationOpened", body: userInfo)
    lastOpenedPayload = userInfo
  }
}
