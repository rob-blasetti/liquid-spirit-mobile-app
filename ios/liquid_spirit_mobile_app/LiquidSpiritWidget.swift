import Foundation
import React
import WidgetKit

@objc(LiquidSpiritWidget)
class LiquidSpiritWidget: NSObject {
  private let suiteName = "group.org.reactjs.native.example.liquid-spirit-mobile-app"
  private let eventKey = "nextEvent"
  private let widgetKind = "LiquidSpiritCalendarWidget"

  @objc static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(updateNextEvent:resolver:rejecter:)
  func updateNextEvent(
    _ payload: NSDictionary,
    resolver resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: suiteName) else {
      reject("widget_storage_unavailable", "Unable to open shared widget storage.", nil)
      return
    }

    do {
      let data = try JSONSerialization.data(withJSONObject: payload, options: [])
      guard let json = String(data: data, encoding: .utf8) else {
        reject("widget_encoding_failed", "Unable to encode widget event payload.", nil)
        return
      }

      defaults.set(json, forKey: eventKey)
      defaults.synchronize()
      WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
      resolve(nil)
    } catch {
      reject("widget_encoding_failed", "Unable to encode widget event payload.", error)
    }
  }

  @objc(clear:rejecter:)
  func clear(
    _ resolve: RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: suiteName) else {
      reject("widget_storage_unavailable", "Unable to open shared widget storage.", nil)
      return
    }

    defaults.removeObject(forKey: eventKey)
    defaults.synchronize()
    WidgetCenter.shared.reloadTimelines(ofKind: widgetKind)
    resolve(nil)
  }
}
