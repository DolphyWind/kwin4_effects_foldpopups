/*
    KWin - the KDE window manager
    This file is part of the KDE project.

    SPDX-FileCopyrightText: 2018 Vlad Zahorodnii <vlad.zahorodnii@kde.org>
    SPDX-FileCopyrightText: 2025 Hecheng Yu <kde-yyds@qq.com>

    SPDX-License-Identifier: GPL-2.0-or-later
*/

"use strict";

var blacklist = [
    // ignore black background behind lockscreen
    "ksmserver ksmserver",
    // The logout screen has to be animated only by the logout effect.
    "ksmserver-logout-greeter ksmserver-logout-greeter",
    // The lockscreen isn't a popup window
    "kscreenlocker_greet kscreenlocker_greet",
    // KDE Plasma splash screen has to be animated only by the login effect.
    "ksplashqml ksplashqml",
    // Fcitx should not be animated due to graphical glitches when typing fast
    "fcitx fcitx"
];

function isPopupWindow(window) {
    // If the window is blacklisted, don't animate it.
    if (blacklist.indexOf(window.windowClass) != -1) {
        return false;
    }

    // Animate combo box popups, tooltips, popup menus, etc.
    if (window.popupWindow) {
        return true;
    }

    // Maybe the outline deserves its own effect.
    if (window.outline) {
        return true;
    }

    // Override-redirect windows are usually used for user interface
    // concepts that are expected to be animated by this effect, e.g.
    // popups that contain window thumbnails on X11, etc.
    if (!window.managed) {
        // Some utility windows can look like popup windows (e.g. the
        // address bar dropdown in Firefox), but we don't want to fold
        // them because the fold effect didn't do that.
        if (window.utility) {
            return false;
        }

        return true;
    }

    // Previously, there was a "monolithic" fold effect, which tried to
    // animate almost every window that was shown or hidden. Then it was
    // split into two effects: one that animates toplevel windows and
    // this one. In addition to popups, this effect also animates some
    // special windows(e.g. notifications) because the monolithic version
    // was doing that.
    if (window.splash || window.toolbar
            || window.notification || window.onScreenDisplay
            || window.criticalNotification
            || window.appletPopup) {
        return true;
    }

    return false;
}

var foldingPopupsEffect = {
    loadConfig: function () {
        foldingPopupsEffect.foldInDuration = animationTime(150) * 2;
        foldingPopupsEffect.foldOutDuration = animationTime(150) * 2;
    },
    slotWindowAdded: function (window) {
        if (effects.hasActiveFullScreenEffect) {
            return;
        }
        if (!isPopupWindow(window)) {
            return;
        }
        if (!window.visible) {
            return;
        }
        if (!effect.grab(window, Effect.WindowAddedGrabRole)) {
            return;
        }
        window.setData(Effect.WindowForceBlurRole, true);
        window.foldInAnimation = animate({
            window: window,
            curve: QEasingCurve.OutExpo,
            duration: foldingPopupsEffect.foldInDuration,
            animations: [
            {
                type: Effect.Size,
                to: {
                    value1: window.width,
                    value2: window.height
                },
                from: {
                    value1: window.width,
                    value2: 0
                }
            },{
                type: Effect.Translation,
                to: {
                    value1: 0,
                    value2: 0
                },
                from: {
                    value1: 0,
                    value2: effects.cursorPos.y - window.y - window.height / 2
                }
            },{
                type: Effect.Opacity,
                from: 0.0,
                to: 1.0
            }
            ]
        });
    },
    slotWindowClosed: function (window) {
        if (effects.hasActiveFullScreenEffect) {
            return;
        }
        if (!isPopupWindow(window)) {
            return;
        }
        if (!window.visible || window.skipsCloseAnimation) {
            return;
        }
        if (!effect.grab(window, Effect.WindowClosedGrabRole)) {
            return;
        }
        window.setData(Effect.WindowForceBlurRole, true);
        window.foldOutAnimation = animate({
            window: window,
            curve: QEasingCurve.OutExpo,
            duration: foldingPopupsEffect.foldOutDuration,
            animations: [
                {
                    type: Effect.Size,
                    to: {
                        value1: window.width,
                        value2: 0
                    },
                    from: {
                        value1: window.width,
                        value2: window.height
                    }
                },{
                    type: Effect.Translation,
                    to: {
                        value1: 0,
                        value2: effects.cursorPos.y - window.y - window.height / 2
                    },
                    from: {
                        value1: 0,
                        value2: 0
                    }
                },{
                    type: Effect.Opacity,
                    from: 1.0,
                    to: 0.0
                }
            ]
        });
    },
    slotWindowDataChanged: function (window, role) {
        if (role == Effect.WindowAddedGrabRole) {
            if (window.foldInAnimation && effect.isGrabbed(window, role)) {
                cancel(window.foldInAnimation);
                delete window.foldInAnimation;
            }
        } else if (role == Effect.WindowClosedGrabRole) {
            if (window.foldOutAnimation && effect.isGrabbed(window, role)) {
                cancel(window.foldOutAnimation);
                delete window.foldOutAnimation;
            }
        }
    },
    init: function () {
        foldingPopupsEffect.loadConfig();

        effect.configChanged.connect(foldingPopupsEffect.loadConfig);
        effects.windowAdded.connect(foldingPopupsEffect.slotWindowAdded);
        effects.windowClosed.connect(foldingPopupsEffect.slotWindowClosed);
        effects.windowDataChanged.connect(foldingPopupsEffect.slotWindowDataChanged);
    }
};

foldingPopupsEffect.init();
