import Cocoa

var fnDown = false
var modifierState: CGEventFlags = []
var tapPort: CFMachPort?

let modifierKeycodes: [Int64: String] = [
    63: "Fn",
    58: "Alt", 61: "Alt",
    56: "Shift", 60: "Shift",
    59: "Control", 62: "Control",
    55: "Meta", 54: "Meta",
]

let modifierFlags: [(CGEventFlags.Element, String)] = [
    (.maskSecondaryFn, "Fn"),
    (.maskAlternate, "Alt"),
    (.maskShift, "Shift"),
    (.maskControl, "Control"),
    (.maskCommand, "Meta"),
]

func myCGEventCallback(
    proxy: CGEventTapProxy,
    type: CGEventType,
    event: CGEvent,
    refcon: UnsafeMutableRawPointer?
) -> Unmanaged<CGEvent>? {

    if type == .tapDisabledByTimeout || type == .tapDisabledByUserInput {
        if let port = tapPort {
            CGEvent.tapEnable(tap: port, enable: true)
        }
        return Unmanaged.passRetained(event)
    }

    let keycode = event.getIntegerValueField(.keyboardEventKeycode)

    if type == .flagsChanged {
        let newFlags = event.flags

        if let modName = modifierKeycodes[keycode] {
            for (flag, name) in modifierFlags {
                if name != modName { continue }
                let wasSet = modifierState.contains(flag)
                let isSet = newFlags.contains(flag)

                if isSet && !wasSet {
                    print("key:down:\(modName)")
                    fflush(stdout)
                    modifierState = newFlags

                    if modName == "Fn" {
                        fnDown = true
                        // Don't return nil (causes tap disable).
                        // Strip the Fn flag so macOS doesn't see it.
                        var cleaned = event.flags
                        cleaned.remove(.maskSecondaryFn)
                        event.flags = cleaned
                        return Unmanaged.passRetained(event)
                    }
                    return Unmanaged.passRetained(event)
                } else if !isSet && wasSet {
                    print("key:up:\(modName)")
                    fflush(stdout)
                    modifierState = newFlags

                    if modName == "Fn" {
                        fnDown = false
                        var cleaned = event.flags
                        cleaned.remove(.maskSecondaryFn)
                        event.flags = cleaned
                        return Unmanaged.passRetained(event)
                    }
                    return Unmanaged.passRetained(event)
                }
                break
            }
        }

        modifierState = newFlags
        return Unmanaged.passRetained(event)
    }

    // NX_SYSDEFINED (type 14) — macOS triggers emoji picker via this
    if type.rawValue == 14 {
        if let nsEvent = NSEvent(cgEvent: event), nsEvent.subtype.rawValue == 8 {
            let sysKeycode = (nsEvent.data1 & 0xFFFF0000) >> 16
            if sysKeycode == 0x3F {
                // Neutralize: flip the key-state bit so macOS sees it as already released
                let data1 = nsEvent.data1
                let neutralized = data1 & ~0x100
                event.setIntegerValueField(.mouseEventNumber, value: Int64(neutralized))
                return Unmanaged.passRetained(event)
            }
        }
    }

    return Unmanaged.passRetained(event)
}

let eventMask: CGEventMask =
    (1 << CGEventType.flagsChanged.rawValue) |
    (1 << 14)

guard let eventTap = CGEvent.tapCreate(
    tap: .cghidEventTap,
    place: .headInsertEventTap,
    options: .defaultTap,
    eventsOfInterest: eventMask,
    callback: myCGEventCallback,
    userInfo: nil
) else {
    print("error:tap_failed")
    fflush(stdout)
    exit(1)
}

tapPort = eventTap

let runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, eventTap, 0)
CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, .commonModes)
CGEvent.tapEnable(tap: eventTap, enable: true)

print("started")
fflush(stdout)

CFRunLoopRun()
