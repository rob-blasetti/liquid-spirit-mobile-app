import SwiftUI
import UIKit
import WidgetKit

struct CalendarEntry: TimelineEntry {
    let date: Date
    let event: WidgetEvent?
}

struct CalendarProvider: TimelineProvider {
    func placeholder(in context: Context) -> CalendarEntry {
        CalendarEntry(date: Date(), event: WidgetEvent.placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (CalendarEntry) -> Void) {
        completion(CalendarEntry(date: Date(), event: WidgetEventStore.shared.nextEvent()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<CalendarEntry>) -> Void) {
        let now = Date()
        let event = WidgetEventStore.shared.nextEvent()
        let fallbackRefresh = WidgetEvent.nextCheckpoint(after: now)
        let nextUpdate = event?.nextRefreshDate(after: now) ?? fallbackRefresh
        let timeline = Timeline(entries: [CalendarEntry(date: now, event: event)], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct WidgetEvent: Codable {
    let title: String
    let dateText: String
    let dayText: String
    let timeText: String
    let locationText: String
    let startTimestamp: Double
    let updatedAt: Double?
    let isPlaceholder: Bool?

    static let placeholder = WidgetEvent(
        title: "Upcoming community event",
        dateText: "Month day, year",
        dayText: "Weekday",
        timeText: "Time",
        locationText: "Location",
        startTimestamp: Date().addingTimeInterval(60 * 60 * 24).timeIntervalSince1970 * 1000,
        updatedAt: nil,
        isPlaceholder: false
    )

    var hasEventDetails: Bool {
        !(isPlaceholder ?? false)
    }

    static func nextCheckpoint(after date: Date) -> Date {
        let calendar = Calendar.current

        let nextNoon = calendar.nextDate(
            after: date,
            matching: DateComponents(hour: 12, minute: 0, second: 0),
            matchingPolicy: .nextTime,
            direction: .forward
        ) ?? date.addingTimeInterval(60 * 60 * 12)

        let nextMidnight = calendar.nextDate(
            after: date,
            matching: DateComponents(hour: 0, minute: 0, second: 0),
            matchingPolicy: .nextTime,
            direction: .forward
        ) ?? calendar.date(byAdding: .day, value: 1, to: calendar.startOfDay(for: date)) ?? date.addingTimeInterval(60 * 60 * 24)

        return min(nextNoon, nextMidnight)
    }

    func nextRefreshDate(after date: Date) -> Date {
        let calendar = Calendar.current
        let nextRefreshCandidate = Self.nextCheckpoint(after: date)
        let eventDate = Date(timeIntervalSince1970: startTimestamp / 1000)

        guard hasEventDetails else {
            return nextRefreshCandidate
        }

        if eventDate > date {
            return min(eventDate, nextRefreshCandidate)
        }

        return calendar.date(byAdding: .hour, value: 1, to: date) ?? date.addingTimeInterval(60 * 60)
    }
}

final class WidgetEventStore {
    static let shared = WidgetEventStore()

    private let suiteName = "group.org.reactjs.native.example.liquid-spirit-mobile-app"
    private let eventKey = "nextEvent"

    func nextEvent() -> WidgetEvent? {
        guard let defaults = UserDefaults(suiteName: suiteName),
              let json = defaults.string(forKey: eventKey),
              !json.isEmpty,
              let data = json.data(using: .utf8)
        else {
            return nil
        }

        guard var event = try? JSONDecoder().decode(WidgetEvent.self, from: data) else {
            defaults.removeObject(forKey: eventKey)
            defaults.synchronize()
            return nil
        }

        guard event.startTimestamp.isFinite,
              event.startTimestamp >= 0 else {
            defaults.removeObject(forKey: eventKey)
            defaults.synchronize()
            return nil
        }

        let eventDate = Date(timeIntervalSince1970: event.startTimestamp / 1000)
        if event.hasEventDetails && (event.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || eventDate < Date()) {
            defaults.removeObject(forKey: eventKey)
            defaults.synchronize()
            return nil
        }

        if !event.hasEventDetails {
            event = WidgetEvent(
                title: event.title.isEmpty ? "No upcoming events" : event.title,
                dateText: event.dateText,
                dayText: event.dayText,
                timeText: event.timeText,
                locationText: event.locationText.isEmpty ? "Check back soon" : event.locationText,
                startTimestamp: event.startTimestamp,
                updatedAt: event.updatedAt,
                isPlaceholder: true
            )
        }

        return event
    }
}

struct CalendarWidgetView: View {
    @Environment(\.widgetFamily) private var widgetFamily

    let entry: CalendarEntry

    private let primaryColor = Color(red: 49 / 255, green: 39 / 255, blue: 131 / 255)

    private var weekdayText: String {
        entry.date.formatted(.dateTime.weekday(.wide))
    }

    private var gregorianMonthDayText: String {
        entry.date.formatted(.dateTime.day().month(.wide))
    }

    private var gregorianYearText: String {
        String(Calendar.current.component(.year, from: entry.date))
    }

    private var badiDate: BadiDate {
        BadiCalendarConverter.date(from: entry.date)
    }

    private var showsEvent: Bool {
        widgetFamily == .systemMedium
    }

    var body: some View {
        Group {
            if showsEvent, let event = entry.event {
                MediumWidgetContent(
                    primaryColor: primaryColor,
                    weekday: weekdayText,
                    dateContent: dateContent,
                    event: event
                )
            } else {
                DateOnlyWidgetContent(
                    primaryColor: primaryColor,
                    weekday: weekdayText,
                    dateContent: dateContent
                )
            }
        }
        .liquidSpiritWidgetMargins()
        .liquidSpiritWidgetBackground()
    }

    private var dateContent: DateStack {
        DateStack(
            badiMonthDay: "\(badiDate.day) \(badiDate.monthName)",
            badiYear: "\(badiDate.year) BE",
            gregorianMonthDay: gregorianMonthDayText,
            gregorianYear: gregorianYearText
        )
    }
}

private extension View {
    @ViewBuilder
    func liquidSpiritWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) {
                LiquidSpiritWidgetBackground()
            }
        } else {
            background(LiquidSpiritWidgetBackground())
        }
    }

    @ViewBuilder
    func liquidSpiritWidgetMargins() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self
        } else {
            padding(16)
        }
    }
}

private struct LiquidSpiritWidgetBackground: View {
    var body: some View {
        Color.white
    }
}

struct DateOnlyWidgetContent: View {
    let primaryColor: Color
    let weekday: String
    let dateContent: DateStack

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .top) {
                Text(weekday)
                    .font(.system(size: 22))
                    .fontWeight(.regular)
                    .foregroundStyle(primaryColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)

                Spacer(minLength: 8)

                WidgetLogo()
            }

            dateContent

            Spacer(minLength: 0)
        }
    }
}

struct MediumWidgetContent: View {
    let primaryColor: Color
    let weekday: String
    let dateContent: DateStack
    let event: WidgetEvent

    var body: some View {
        GeometryReader { geometry in
            let spacing: CGFloat = 12
            let dividerWidth: CGFloat = 1
            let availableWidth = max(geometry.size.width - (spacing * 2) - dividerWidth, 0)

            HStack(alignment: .top, spacing: spacing) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(weekday)
                        .font(.system(size: 22))
                        .fontWeight(.regular)
                        .foregroundStyle(primaryColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.82)

                    dateContent

                    Spacer(minLength: 0)
                }
                .frame(width: availableWidth / 3, alignment: .leading)

                Divider()
                    .overlay(Color.black.opacity(0.16))
                    .frame(width: dividerWidth)
                    .padding(.vertical, 1)

                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .top) {
                        Text("Next Event")
                            .font(.system(size: 22))
                            .fontWeight(.regular)
                            .foregroundStyle(primaryColor.opacity(0.65))
                            .lineLimit(1)
                            .minimumScaleFactor(0.82)

                        Spacer(minLength: 6)

                        WidgetLogo()
                    }

                    EventWidgetCard(event: event, primaryColor: primaryColor, showsTitle: false)

                    Spacer(minLength: 0)
                }
                .frame(width: availableWidth * 2 / 3, alignment: .leading)
            }
            .frame(width: geometry.size.width, height: geometry.size.height, alignment: .topLeading)
        }
    }
}

struct WidgetLogo: View {
    var body: some View {
        logoImage
            .scaledToFit()
            .frame(width: 18, height: 18)
            .padding(.top, 3)
            .accessibilityHidden(true)
    }

    @ViewBuilder
    private var logoImage: some View {
        if let image = UIImage(named: "LiquidSpiritLogo", in: Bundle.main, compatibleWith: nil) {
            Image(uiImage: image)
                .resizable()
                .renderingMode(.original)
        } else {
            Image("LiquidSpiritLogo")
                .resizable()
                .renderingMode(.original)
        }
    }
}

struct EventWidgetCard: View {
    let event: WidgetEvent
    let primaryColor: Color
    var showsTitle = true

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            if showsTitle {
                Text("Next Event")
                    .font(.system(size: 22))
                    .fontWeight(.regular)
                    .foregroundStyle(primaryColor.opacity(0.65))
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)
            }

            Text(event.title)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(.black)
                .lineLimit(1)
                .minimumScaleFactor(0.82)

            if event.hasEventDetails {
                Text([event.dayText, event.dateText].filter { !$0.isEmpty }.joined(separator: ", "))
                    .font(.system(size: 14))
                    .fontWeight(.regular)
                    .foregroundStyle(.black)
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)

                Text(event.timeText)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.black)
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)
                    .padding(.top, 1)
            }

            if !event.locationText.isEmpty {
                Text(event.locationText)
                    .font(.system(size: 14))
                    .fontWeight(.regular)
                    .foregroundStyle(.black)
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
            }
        }
    }
}

struct DateStack: View {
    let badiMonthDay: String
    let badiYear: String
    let gregorianMonthDay: String
    let gregorianYear: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(badiMonthDay)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(.black)
                .lineLimit(1)
                .minimumScaleFactor(0.82)

            Text(badiYear)
                .font(.system(size: 14))
                .fontWeight(.regular)
                .foregroundStyle(.black)
                .lineLimit(1)

            Text(gregorianMonthDay)
                .font(.headline)
                .fontWeight(.semibold)
                .foregroundStyle(.black)
                .lineLimit(1)
                .minimumScaleFactor(0.82)
                .padding(.top, 1)

            Text(gregorianYear)
                .font(.system(size: 14))
                .fontWeight(.regular)
                .foregroundStyle(.black)
                .lineLimit(1)
        }
    }
}

@main
struct LiquidSpiritCalendarWidget: Widget {
    let kind = "LiquidSpiritCalendarWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CalendarProvider()) { entry in
            CalendarWidgetView(entry: entry)
        }
        .configurationDisplayName("Liquid Spirit")
        .description("Choose a square date widget or a rectangular widget with your next event.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
