# NeoStation source notes

Extracted from [misobadev/neostation-frontend](https://github.com/misobadev/neostation-frontend) at
`d9bece5` (September 2026). Every value is cited `lib/...:LINE` into that commit. Sizes are in the
source's own units - `12.r`, `8.w`, `4.h`, `14.sp`, or plain logical px where the source writes no
suffix - and colours are theme roles; the per-theme values are generated into
`app/src/themes/neostation/palettes.ts` by `extract-palettes.py`. English strings for every key are
in [`strings.txt`](strings.txt).

## Units

flutter_screenutil 5.9.3, `designSize: 640x480, minTextAdapt: true, splitScreenMode: true`
(`lib/main.dart:1021-1024`). From the package's own definitions
([`flutter_screenutil-5.9.3-screen_util.dart.txt`](flutter_screenutil-5.9.3-screen_util.dart.txt),
lines 216-258), in logical px for a logical screen W x H:

| Unit | Value |
| --- | --- |
| `.w` | W / 640 |
| `.h` | max(H, 700) / 480 - `splitScreenMode` floors the height at 700 |
| `.r` | min(`.w`, `.h`) |
| `.sp` | min(`.w`, `.h`), because of `minTextAdapt` |
| `.dm` | max(`.w`, `.h`) |

The two devices the port renders, in device px per unit. The Odin's pixel ratio is measured from
the website frames: the header's tab slot is `32.r` and 96px wide.

| Device | Device px | DPR | Logical | `.r` / `.sp` / `.w` | `.h` | Breakpoint |
| --- | --- | --- | --- | --- | --- | --- |
| `odin2-mini` | 1920x1080 | 3 | 640x360 | 3 | 4.375 | Small |
| `rg40xx` | 640x480 | 1 | 640x480 | 1 | 1.458 | Small |

`.h` is larger than `.r` on both, so anything the source sizes in `.h` is taller than the same
number in `.r`.

Anta's vertical metrics are ascent 1966, descent 534, no line gap, at 2048 units per em (hhea,
typo and win all agree), so a line of Anta is 1.2207 of its size tall.


## App shell, header and global input

Source: `misobadev/neostation-frontend` at `d9bece5`. All citations are `lib/...:LINE`. Sizes are in source units exactly as written (`12.r`, plain logical px when no suffix). Colours are theme roles; the per-theme hex values and `CornerRadii` presets are extracted elsewhere.

### Units and scaling

| Fact | Value | Citation |
| --- | --- | --- |
| ScreenUtil design size | `Size(640, 480)` | `lib/main.dart:1022` |
| `minTextAdapt` | `true` | `lib/main.dart:1023` |
| `splitScreenMode` | `true` | `lib/main.dart:1024` |
| Global text scaler clamp | `textScaler.clamp(minScaleFactor: 0.6, maxScaleFactor: 1.4)` | `lib/main.dart:1057-1060` |
| Desktop window default size | `Size(1280, 720)` | `lib/main.dart:223` |
| Desktop window minimum size | `Size(640, 480)` | `lib/main.dart:226` |
| Desktop fullscreen default | `true` unless `user_config.is_fullscreen` is `0` (Windows, macOS, Linux) | `lib/main.dart:235-259` |
| Android/iOS | `SystemUiMode.immersiveSticky`, no overlays; orientations `landscapeLeft`, `landscapeRight` only | `lib/main.dart:280-291` |

Almost every header dimension uses `.r`. A few use plain logical px - these are called out where they occur (NeoGlass padding on the status pill, NeoGlass rim stroke width, notification dropdown offsets).

`Responsive.isHandheldXS` is `MediaQuery.size.width < 560` (logical px, not design units) - `lib/responsive.dart:22-23`.

### Root widget tree (`lib/main.dart`)

Order from the top:

1. `MultiProvider` (`lib/main.dart:975-1018`)
2. `Consumer<ThemeProvider>` (`lib/main.dart:1019`)
3. `ScreenUtilInit(designSize: 640x480)` (`lib/main.dart:1021-1025`)
4. `FocusTraversalGroup(policy: NoFocusTraversalPolicy())` - Flutter focus traversal is disabled app-wide; all navigation goes through `GamepadNavigation` (`lib/main.dart:1027-1028`, policy at `lib/main.dart:55-83`)
5. `Shortcuts` binding `Alt+Enter` to `ToggleFullscreenIntent` (`lib/main.dart:1029-1035`), `Actions` (`lib/main.dart:1036-1037`). The action is a no-op on Android/iOS (`lib/main.dart:113-135`).
6. `MaterialApp` (`lib/main.dart:1038`): `navigatorKey: rootNavigatorKey`, `debugShowCheckedModeBanner: false`, `title: 'NeoStation'`, `scrollBehavior: CustomScrollBehavior()` (drag with touch, mouse and trackpad - `lib/utils/custom_scroll_behavior.dart:11-15`).
7. `MaterialApp.builder` wraps every route in `MediaQuery` (text scaler clamp) then `Stack(children: [child!, const BackSwipeZone()])` - the only global overlay (`lib/main.dart:1054-1070`).
8. `home: PermissionCheckWrapper(child: AppLifecycleHandler(child: MainScreen()))` (`lib/main.dart:1094-1096`). `PermissionCheckWrapper` shows `Scaffold(body: SplashStatusLayout(children: []))` while checking and `SetupWizard` on first run (`lib/widgets/permission_check_wrapper.dart:131,136`).
9. `MainScreen` = `Scaffold(key: MenuAppProvider.scaffoldKey, body: ScrapingNotificationListener(child: MusicNotificationListener(child: AppScreen())))` (`lib/screens/main_screen.dart:13-18`).

#### Theme applied to MaterialApp

`theme: themeProvider.currentTheme.copyWith(...)` (`lib/main.dart:1072-1093`):

| Property | Value | Citation |
| --- | --- | --- |
| `textTheme` | `GoogleFonts.antaTextTheme(themeProvider.currentTheme.textTheme)` - the theme's own `TextTheme` re-skinned in **Anta** | `lib/main.dart:1073-1075` |
| `iconTheme` | `IconThemeData(fill: 1.0)` - Material Symbols render filled | `lib/main.dart:1076` |
| `visualDensity` | `VisualDensity.adaptivePlatformDensity` | `lib/main.dart:1077` |
| `materialTapTargetSize` | `MaterialTapTargetSize.padded` | `lib/main.dart:1078` |
| `pageTransitionsTheme` | `FadeUpwardsPageTransitionsBuilder()` for android, iOS, windows, macOS, linux | `lib/main.dart:1079-1092` |

The base `TextTheme` every built-in theme ships (identical across all 14 built-ins; `custom_theme.dart` has the same values):

| Style | Size | Weight | Colour | Citation |
| --- | --- | --- | --- | --- |
| `displayLarge` | 32 | bold | `onSurface` | `lib/themes/dark_theme.dart:61-65` |
| `titleLarge` | 24 | w600 | `onSurface` | `lib/themes/dark_theme.dart:66-70` |
| `titleMedium` | 18 | w500 | `onSurface` | `lib/themes/dark_theme.dart:71-75` |
| `bodyLarge` | 16 | - | `onSurface` | `lib/themes/dark_theme.dart:77` |
| `bodyMedium` | 14 | - | `onSurface` | `lib/themes/dark_theme.dart:78` |
| `bodySmall` | 12 | - | `onSurface` | `lib/themes/dark_theme.dart:79` |
| `labelLarge` | 14 | w500 | `onSurface` | `lib/themes/dark_theme.dart:81-85` |

These sizes are plain logical px (no `.r`). Header widgets pass their own `TextStyle(fontSize: 12.r ...)` without a `fontFamily`, so they inherit Anta from the ambient `DefaultTextStyle`. The only other GoogleFonts call is `GoogleFonts.anta(...)` on the startup loading text (`lib/main.dart:680`). Anta has no `tnum` table, which is why `MonospacedClock` exists (`lib/widgets/monospaced_clock.dart:5-11`).

Every built-in `ThemeData` is `useMaterial3: true` and carries `extensions: [CornerRadii.<preset>(), ChromeSurface.standard()]` (`lib/themes/dark_theme.dart:11,58`). Built-ins set `scaffoldBackgroundColor: _backgroundColor` (`lib/themes/dark_theme.dart:57`); imported custom themes set `scaffoldBackgroundColor: surface` (`lib/themes/custom_theme.dart:188`).

CornerRadii preset per theme (from the `extensions:` line):

| Preset | Themes | Citation |
| --- | --- | --- |
| `CornerRadii.m()` | dark, light, oled, valentine, aqua, horizon, palenight, tokyo_night | e.g. `lib/themes/dark_theme.dart:58` |
| `CornerRadii.s()` | abyss, retro | `lib/themes/abyss_theme.dart:58`, `lib/themes/retro_theme.dart:58` |
| `CornerRadii.xs()` | nord | `lib/themes/nord_theme.dart:58` |
| `CornerRadii.l()` | coffee | `lib/themes/coffee_theme.dart:58` |
| `CornerRadii.xl()` | dracula | `lib/themes/dracula_theme.dart:58` |
| `CornerRadii.zero()` | cyberpunk | `lib/themes/cyberpunk_theme.dart:58` |
| from JSON `effects` | custom themes | `lib/themes/custom_theme.dart:190` |

#### Startup screens (before the main app)

| Fact | Value | Citation |
| --- | --- | --- |
| First frame | `runApp(const StartupLoadingApp())` before any init | `lib/main.dart:201` |
| Background | `StartupThemeCache` palette `background` (last theme mirrored to prefs); starts on `StartupThemeColors.fallback` (dark) | `lib/main.dart:557-565,582` |
| Loading layout | `SplashStatusLayout` with animated (shimmering) logo pinned at screen centre | `lib/main.dart:594-595` |
| Loading text | `AppLocale.startupLoading` = "Preparing NeoStation. Waiting for storage and services..." | `lib/main.dart:675`, `lib/l10n/app_locale_en.dart:25-26` |
| Loading text style | `GoogleFonts.anta`, `foreground.withValues(alpha: 0.6)`, `fontSize: 17 * textScale`, `letterSpacing: 0.3`, centred, max width `440 * scale` | `lib/main.dart:673,680-684` |
| Loading text motion | hidden (laid out) then `AnimatedOpacity` 0 -> 1, `400ms`, default curve (linear), after a `1500ms` timer | `lib/main.dart:642,669-671` |
| Storage error layout | centred column, padding `32 * scale`, logo `112 * scale`, gap `24 * scale`, wordmark "NeoStation" `28 * textScale` w600 letterSpacing 1.2 | `lib/main.dart:596-617` |
| Storage error text | `AppLocale.startupStorageUnavailable` = "NeoStation could not reach the folder where your data is stored. Check that the SD card or drive is connected." `16 * textScale`, alpha 0.8; path below at `13 * textScale`, alpha 0.55, gap `12 * scale` | `lib/main.dart:740-757`, `lib/l10n/app_locale_en.dart:21-22` |
| Storage error buttons | `ElevatedButton` "Retry" (`startupStorageRetry`), gap `16 * scale`, `TextButton` "Continue without it" (`startupStorageUseDefault`) | `lib/main.dart:760-776`, `lib/l10n/app_locale_en.dart:23-24` |
| Storage error keys | `gameButtonA`, `Enter`, `select`, `space` = Retry; `gameButtonB`, `Escape` = Continue without it; key-down only | `lib/main.dart:709-725` |

`scale` / `textScale` come from `SplashStatusLayout.scaleOf` / `textScaleOf` (not read here - outside this area).

### AppScreen (`lib/screens/app_screen.dart`)

#### Layer stack

`Scaffold(body: Stack(...))` inside `PopScope(canPop: false)` (`lib/screens/app_screen.dart:708-711`):

1. `Positioned.fill(Container(color: Theme.of(context).scaffoldBackgroundColor))` (`:714-718`)
2. `Positioned.fill(_buildCurrentTabContent())` - content is full-screen; the header floats over it (`:721`)
3. `Positioned(top: 0, left: 0, right: 0)` -> `FixedHeader` when `configProvider.initialized || !configProvider.isLoading`, else `SizedBox.shrink()` (`:724-735`)
4. `Positioned(bottom: 0, left: 0, right: 0)` footer placeholder, shown when `hasRomFolder && !isLoading && !isScanning` - but `_buildFooterForCurrentTab()` returns `SizedBox.shrink()`, so there is no global footer (`:738-759`)

`FixedHeader` is a pass-through to `Header` (`lib/widgets/fixed_header.dart:15-20`).

#### Tab order and what each mounts

`AppTabs` constants and `NavTab` enum must agree (`lib/screens/app_screen.dart:50-61`, `lib/utils/nav_tabs.dart:12`). Default selected tab is `0` (`lib/screens/app_screen.dart:98`).

| Index | `NavTab` | Header icon | Label key -> English | Mounts | App-level input while mounted | Hidable | Citation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `systems` | `assets/images/icons/grids.webp` | `systems` -> "Systems" | `SystemContent(selectedIndex, onCardTapped)` | app layer stays active; directions/A delegated to systems grid's own layer (A calls `InitialSetupWidget.selectCurrent()` for first-run card) | no | `lib/utils/nav_tabs.dart:65-68`, `lib/screens/app_screen.dart:764-768,545-551` |
| 1 | `search` | none - `Symbols.search_rounded` | `search_title` -> "Search" | `const SearchScreen()` | app layer deactivated post-frame | yes (`hideTabSearch`) | `lib/utils/nav_tabs.dart:69-77`, `lib/screens/app_screen.dart:769-775` |
| 2 | `sync` | `assets/images/icons/cloud-add.webp` | `neo_sync` -> "NeoSync" | `const NeoSyncContent()` | app layer deactivated post-frame | yes (`hideTabSync`) | `lib/utils/nav_tabs.dart:78-85`, `lib/screens/app_screen.dart:776-781` |
| 3 | `achievements` | `assets/images/icons/enhance-prize.webp` | `achievements` -> "Achievements" | `RAContent()` (pushes its own layer) | - | yes (`hideTabAchievements`) | `lib/utils/nav_tabs.dart:86-93`, `lib/screens/app_screen.dart:782-783,502-505` |
| 4 | `scraper` | `assets/images/icons/box-search.webp` | `scraping` -> "Scraping" | `ScraperContent()` | Up/Down/Left/Right/A/B delegated to `NewScraperOptionsScreen` statics | yes (`hideTabScraper`) | `lib/utils/nav_tabs.dart:94-101`, `lib/screens/app_screen.dart:784-785,477-540` |
| 5 | `romm` | `assets/images/icons/romm-light.svg` (SVG, tinted via `ColorFilter.mode(tint, BlendMode.srcIn)`) | `romm_library` -> "RomM Library" | `const RommTab()` | app layer deactivated post-frame | yes (`hideTabRomm`) | `lib/utils/nav_tabs.dart:102-109`, `lib/screens/app_screen.dart:786-792`, `lib/widgets/header.dart:665-670` |
| 6 | `settings` | `assets/images/icons/setting.webp` | `settings` -> "Settings" | `NewSettingsScreen()` | Up/Down/Left/Right/A/B delegated to `NewSettingsScreen` statics; X = `NewSettingsScreen.deleteCurrent()` (removes imported themes) | no | `lib/utils/nav_tabs.dart:110-113`, `lib/screens/app_screen.dart:793-794,562-566` |

`default:` falls back to `SystemContent` (`lib/screens/app_screen.dart:795-799`). Tab labels are passed to `_buildTabButton` but never drawn - the strip is icon-only with no tooltip (`lib/widgets/header.dart:624-659`).

AppScreen's `GamepadNavigation` callbacks: up/down/left/right, previous/next tab, select (A), settings (Start), back (B), X (`lib/screens/app_screen.dart:144-155`). `_handleSettings` does nothing on any tab (`:530-534`). It is registered as the base layer `'app_screen'` post-frame (`:158-170`).

#### Tab cycling

| Behaviour | Detail | Citation |
| --- | --- | --- |
| Next / previous | `_cycleTab(+1)` / `_cycleTab(-1)` bound to LB/RB (and keyboard Q/E) via `onPreviousTab` / `onNextTab` | `lib/screens/app_screen.dart:684-686,149-150` |
| Wrap | wraps at both ends: `(from + step + visible.length) % visible.length` | `lib/screens/app_screen.dart:680` |
| Hidden tabs | skipped - cycling walks `visibleNavTabs(config)` only | `lib/screens/app_screen.dart:657-659,672` |
| On a hidden tab | steps from position 0 | `lib/screens/app_screen.dart:677-679` |
| Blocked | no-op whenever a route is pushed over AppScreen (`Navigator.maybeOf(context)?.canPop()`) | `lib/screens/app_screen.dart:670` |
| On select | `setState` sets tab and resets `_selectedSystemIndex = 0`; post-frame `GamepadNavigationManager.reactivate()` (re-activates top of stack, not AppScreen unconditionally) | `lib/screens/app_screen.dart:580-596` |
| Selected tab hidden by config | post-frame jump to Systems | `lib/screens/app_screen.dart:693-700` |
| Tap on an icon | `SfxService().playNavSound()` then `onTabSelected(tabIndex)` | `lib/widgets/header.dart:647-650` |
| `AppNavigation` statics | `goToTab`, `deactivate`, `activate`, `nextTab`, `previousTab` for deep widgets | `lib/screens/app_screen.dart:67-92` |

### Tab visibility settings

| Setting | Config field | SQLite column + default | `ConfigModel` default | Settings row (key -> English) | Citation |
| --- | --- | --- | --- | --- | --- |
| Search | `hideTabSearch` | `hide_tab_search INTEGER DEFAULT 0` | `false` | `show_search_tab` -> "Show Search tab" / `show_search_tab_subtitle` -> "Display the Search tab in the navigation bar" | `lib/models/config_model.dart:142,277`, `lib/data/datasources/sqlite_service.dart:1936`, `lib/l10n/app_locale_en.dart:240-242` |
| NeoSync | `hideTabSync` | `hide_tab_sync INTEGER DEFAULT 0` | `false` | `show_sync_tab` -> "Show NeoSync tab" / "Display the NeoSync tab in the navigation bar" | `lib/models/config_model.dart:130,273`, `lib/data/datasources/sqlite_service.dart:1932`, `lib/l10n/app_locale_en.dart:229-231` |
| Achievements | `hideTabAchievements` | `hide_tab_achievements INTEGER DEFAULT 0` | `false` | `show_achievements_tab` -> "Show Achievements tab" / "Display the RetroAchievements tab in the navigation bar" | `lib/models/config_model.dart:133,274`, `lib/data/datasources/sqlite_service.dart:1933`, `lib/l10n/app_locale_en.dart:232-234` |
| Scraper | `hideTabScraper` | `hide_tab_scraper INTEGER DEFAULT 0` | `false` | `show_scraper_tab` -> "Show Scraper tab" / "Display the Scraping tab in the navigation bar" | `lib/models/config_model.dart:136,275`, `lib/data/datasources/sqlite_service.dart:1934`, `lib/l10n/app_locale_en.dart:235-237` |
| RomM | `hideTabRomm` | `hide_tab_romm INTEGER DEFAULT 0` | `false` | `show_romm_tab` -> "Show RomM tab" / "Display the RomM tab in the navigation bar" | `lib/models/config_model.dart:139,276`, `lib/data/datasources/sqlite_service.dart:1935`, `lib/l10n/app_locale_en.dart:238-239` |
| Systems, Settings | - | - | never hidable | - | `lib/utils/nav_tabs.dart:61-63` |

All tabs visible by default. Settings > General renders one `SettingRow` per hidable tab in canonical order (Search, NeoSync, Achievements, Scraper, RomM), gap `12.r` above each, trailing `CustomToggleSwitch(value: !hidden, activeColor: colorScheme.primary)` (`lib/screens/settings_screen/new_settings_options/general_settings_content.dart:826-854`, order from `lib/utils/nav_tabs.dart:147-149`).

### Header (`lib/widgets/header.dart`)

#### Container

| Fact | Value | Citation |
| --- | --- | --- |
| Height | `46.r` | `lib/widgets/header.dart:199` |
| Background | `Colors.transparent`, border transparent width `0.r` - the header has no fill of its own | `lib/widgets/header.dart:195-198` |
| Layout | `Stack(alignment: Alignment.center)` of three independent children: left dropdown, centred tab strip, right status pill | `lib/widgets/header.dart:307-309` |

#### Left: view-mode button (Systems tab only)

Shown only when `selectedTabIndex == AppTabs.systems` (`lib/widgets/header.dart:310-317`), aligned `centerLeft`.

| Fact | Value | Citation |
| --- | --- | --- |
| Outer margin | `EdgeInsets.symmetric(horizontal: 10.r)` | `lib/widgets/header_sort_dropdown.dart:122` |
| Widget | `GamepadControl(label: AppLocale.viewMode, iconPath: 'assets/images/gamepad/Xbox_X_button.png')` | `lib/widgets/header_sort_dropdown.dart:123-125` |
| Label | `view_mode` -> "View Mode" | `lib/l10n/app_locale_en.dart:646` |
| Background | `colorScheme.tertiaryFixed` | `lib/widgets/header_sort_dropdown.dart:130` |
| Text / glyph colour | `colorScheme.onTertiaryFixed` | `lib/widgets/header_sort_dropdown.dart:131` |
| Tap | `playNavSound()` then `showSystemViewDropdown(context)` | `lib/widgets/header_sort_dropdown.dart:126-129` |

`GamepadControl` geometry (`lib/widgets/core_footer.dart:121-214`):

| Part | Value | Citation |
| --- | --- | --- |
| Padding | `EdgeInsets.symmetric(horizontal: 6.r, vertical: 4.r)` | `lib/widgets/core_footer.dart:165` |
| Radius | `CornerRadii.radiusInternal ?? BorderRadius.circular(6.r)` | `lib/widgets/core_footer.dart:168-170` |
| Border | `lightenColor(buttonBg, 0.05)` (HSL lightness +0.05), width `1.r` | `lib/widgets/core_footer.dart:171`, `lib/utils/color.dart:3-7` |
| Shadow | `colorScheme.shadow.withValues(alpha: 0.1)`, blur `4.r`, offset `(2.0.r, 2.0.r)` | `lib/widgets/core_footer.dart:172-178` |
| Glyph | asset in `SizedBox(18.r x 18.r)`, `color: contentColor`, `BlendMode.srcIn` | `lib/widgets/core_footer.dart:193-201` |
| Gap after glyph | `4.r` | `lib/widgets/core_footer.dart:202` |
| Label | `fontSize: 12.r`, `FontWeight.w600`, `letterSpacing: 0.2.r` | `lib/widgets/core_footer.dart:203-211` |
| Trailing gap | `4.r` | `lib/widgets/core_footer.dart:212` |
| Splash | `contentColor.withValues(alpha: 0.2)`; highlight transparent | `lib/widgets/core_footer.dart:160-161` |
| Defaults when unset | bg `onSurface.withValues(alpha: 0.1)`, content `onPrimary` | `lib/widgets/core_footer.dart:150-152` |

#### Centre: tab strip

Row of `LB glyph` + `NeoGlass pill` + `RB glyph`, `Alignment.center` (`lib/widgets/header.dart:320-441`).

| Part | Value | Citation |
| --- | --- | --- |
| Shoulder glyph wrapper | `Container(padding: EdgeInsets.symmetric(horizontal: 6.r, vertical: 2.r))` | `lib/widgets/header.dart:676-680` |
| Shoulder glyph | `BumperGlyph(isLeft, size: 24.r)` | `lib/widgets/header.dart:679` |
| Pill | `NeoGlass(cornerRadius: CornerRadii.radiusExternalRadius ?? 8.r)` | `lib/widgets/header.dart:329-334` |
| Pill inner height | `SizedBox(height: 32.r)` | `lib/widgets/header.dart:335-336` |
| Pill inner padding | `EdgeInsets.symmetric(horizontal: 4.r)` | `lib/widgets/header.dart:337-338` |
| Slot | `SizedBox(32.r x 32.r)` per visible tab | `lib/widgets/header.dart:397-400` |
| Indicator | `Positioned(left: slot * 32.r, top: 4.r, bottom: 4.r, width: 32.r)`, fill `colorScheme.primary`, radius `CornerRadii.radiusInternal ?? BorderRadius.circular(4.r)` | `lib/widgets/header.dart:371-389` |
| Tab button padding | `EdgeInsets.all(8.r)` (so the icon box is 16.r) | `lib/widgets/header.dart:651-652` |
| Symbol icon (Search) | `Icon(iconData, size: 16.r, color: tint)` | `lib/widgets/header.dart:653-654` |
| Asset icon | `Image.asset(icon, color: tint)` (webp); SVG via `SvgPicture.asset(colorFilter: srcIn, fit: BoxFit.contain)` | `lib/widgets/header.dart:664-673` |
| Tint | `Color.lerp(colorScheme.onSurface, colorScheme.onPrimary, coverage)` | `lib/widgets/header.dart:632-636` |
| Coverage | `(1.0 - (animatedSlot - index).abs()).clamp(0.0, 1.0)` | `lib/widgets/header.dart:409-413` |
| Tap feedback | `InkWell` with focus/hover/highlight/splash all `Colors.transparent`, `canRequestFocus: false` | `lib/widgets/header.dart:638-646` |

Motion:

| Animation | Duration | Curve | Delay | Citation |
| --- | --- | --- | --- | --- |
| Indicator slide + icon tint (one shared `TweenAnimationBuilder<double>` over slot index) | `160ms` | `Curves.easeInOut` | none | `lib/widgets/header.dart:360-367` |
| Scrolling-strip slide (`AnimatedPositioned left: -_windowStart * 32.r`) | `160ms` | `Curves.easeInOut` | none | `lib/widgets/header.dart:600-607` |

The indicator tracks the tab's position in the *visible* strip, not its canonical index (`lib/widgets/header.dart:341-346`). If the selected tab is hidden (`selectedSlot < 0`) the tween target is 0 (`:362`).

##### Scrolling strip (more visible tabs than slots)

| Fact | Value | Citation |
| --- | --- | --- |
| Minimum slots | `minNavTabSlots = 5` | `lib/utils/nav_tabs.dart:159` |
| Slot count | `navStripMaxSlots(totalWidth, statusPillWidth(worst case))` - see formula below | `lib/widgets/header.dart:226-260` |
| Static strip | when `visibleTabs.length <= maxSlots`, `_windowStart = 0`, no clipping | `lib/widgets/header.dart:423-426` |
| Viewport | `SizedBox(width: maxSlots * 32.r, height: 32.r)`, `ClipRect` | `lib/widgets/header.dart:570,575-578` |
| Window start | centred: `selectedSlot - (maxSlots - 1) ~/ 2`, clamped to `[0, tabCount - maxSlots]`; `selectedSlot == -1` keeps current start | `lib/utils/nav_tabs.dart:172-183` |
| Edge fades | `ShaderMask` `BlendMode.dstIn`, `LinearGradient` stops `[0, fade, 1 - fade, 1]`, colours transparent/white at a scrollable edge, white otherwise; `fade = 12.r / viewportWidth` | `lib/widgets/header.dart:571-589` |

With the default 7 tabs all visible and the default layout this does not engage on a normal display (`lib/widgets/header.dart:452-456`).

##### Header geometry formulas (`lib/utils/header_layout.dart`)

All inputs already `.r`-scaled by the caller.

- `navStripWidth = shoulder*2 + pillPadding*2 + slot*tabCount`, defaults `slot 32`, `shoulder 36`, `pillPadding 4` (`lib/utils/header_layout.dart:21-26`). Shoulder 36 = 24 glyph + 6 + 6 padding (`:18-20`).
- `statusPillWidth = horizontalPadding*2 + bell + bellGap + clockTextWidth [+ glyph + glyphGap] [+ batteryGap + batteryIcon + batteryIconGap + batteryTextWidth]`, defaults padding 10, bell 14, bellGap 10, glyph 14, glyphGap 4, batteryGap 12, batteryIcon 16, batteryIconGap 4 (`lib/utils/header_layout.dart:38-57`).
- `statusPillMaxWidth = max(0, (totalWidth - navStripWidth)/2 - margin - gutter)`, margin 8, gutter 4 (`lib/utils/header_layout.dart:66-74`).
- `navStripMaxSlots = max(minSlots, ((totalWidth - 2*(statusPillWidth + margin + gutter)) - shoulder*2 - pillPadding*2) ~/ slot)` (`lib/utils/header_layout.dart:91-104`).

Header calls: slot count uses the worst-case clock string (`widestClockText`: `"23:59"` 24h, `"12:59 PM"` 12h - `lib/utils/time_format.dart:24-25`) and battery text `"100%"`, **without** the clock glyph (`lib/widgets/header.dart:226-260`). The pill allowance uses `navStripWidth(min(visibleTabs, maxSlots))` (`:262-278`). The clock glyph is shown only when the live pill width (current clock, current battery %, with glyph) is `<= pillAllowance` (`:285-305`). Text is measured with the live `TextScaler` (`:543-550`).

#### Right: status pill

| Part | Value | Citation |
| --- | --- | --- |
| Alignment | `Alignment.centerRight` | `lib/widgets/header.dart:457-458` |
| Bound | `ConstrainedBox(maxWidth: pillAllowance)` + `FittedBox(fit: BoxFit.scaleDown, alignment: centerRight)` - shrinks rather than collide | `lib/widgets/header.dart:459-463` |
| Right margin | `EdgeInsets.only(right: 8.r)` | `lib/widgets/header.dart:464-465` |
| Surface | `NeoGlass(cornerRadius: CornerRadii.radiusExternalRadius ?? 14.r)` | `lib/widgets/header.dart:466-471` |
| Padding | `EdgeInsets.symmetric(horizontal: 10, vertical: 4)` - plain logical px, **not** `.r` | `lib/widgets/header.dart:472-475` |
| Row | `NotificationBell`, `10.r`, [`Symbols.schedule` `14.r` `onSurface`, `4.r`], clock text, [`12.r`, battery icon `16.r`, `4.r`, battery text] | `lib/widgets/header.dart:476-522` |
| Clock text | `formatClockTime(_now, use12Hour)`, `onSurface`, `fontSize: 12.r`, `FontWeight.w500`, `letterSpacing: 0.3.r` | `lib/widgets/header.dart:491-501` |
| Battery text | `"$_batteryLevel%"`, battery colour, `12.r`, w500, `letterSpacing: 0.3.r` | `lib/widgets/header.dart:512-520` |

Clock format (`lib/utils/time_format.dart:7-16`): 24h `"${hour}:${mm}"` with the hour **not** zero-padded (e.g. `14:09`, `9:05`); 12h `"${h}:${mm} AM|PM"`, midnight/noon `12`. Default `use12HourClock = false` (`lib/models/config_model.dart:264`; SQLite `use_12_hour_clock INTEGER DEFAULT 0` at `lib/data/datasources/sqlite_service.dart:1949`). The header clock is plain `Text`, not `MonospacedClock`.

Clock tick: first update at the next minute boundary (`60 - now.second` seconds), then `Timer.periodic(1 minute)`; each tick also re-reads the battery level (`lib/widgets/header.dart:100-129`).

Battery:

| Condition | Result | Citation |
| --- | --- | --- |
| Shown when | `_batteryLevel != -1 && !_isTelevision && !Responsive.isHandheldXS(context)` | `lib/widgets/header.dart:206-209,502-504` |
| No battery | read throws, or Linux reports `0` -> `-1` | `lib/widgets/header.dart:131-152` |
| TV | Android only: `PermissionService.isTelevision()` | `lib/widgets/header.dart:68-72` |
| Initial level | `100` before first read | `lib/widgets/header.dart:43` |
| Icon: charging or full state (or level -1) | `Symbols.battery_android_frame_bolt` | `lib/widgets/header.dart:157-163` |
| Icon: `>= 90` | `Symbols.battery_full` | `lib/widgets/header.dart:165` |
| Icon: `>= 75` | `Symbols.battery_android_frame_6` | `:166` |
| Icon: `>= 60` | `Symbols.battery_android_frame_5` | `:167` |
| Icon: `>= 45` | `Symbols.battery_android_frame_4` | `:168` |
| Icon: `>= 30` | `Symbols.battery_android_frame_3` | `:169` |
| Icon: `>= 15` | `Symbols.battery_android_frame_2` | `:170` |
| Icon: below 15 | `Symbols.battery_android_frame_1` | `:171` |
| Colour: level -1 | `customColors.batteryPower` | `lib/widgets/header.dart:175-177` |
| Colour: `> 20` | `customColors.batteryFull` | `:178-179` |
| Colour: `> 5` | `customColors.batteryMedium` | `:180-181` |
| Colour: `<= 5` | `customColors.batteryLow` | `:182-183` |

`customColors` = `AppThemes.getCustomColors(context)` resolved by theme name (`lib/widgets/header.dart:189`, `lib/themes/app_themes.dart:119-126`). Custom themes map battery colours to status colours: full = success, medium = warning, low = error, power = info (`lib/themes/custom_theme.dart:222-227`).

### BumperGlyph (`lib/widgets/bumper_glyph.dart`)

| Fact | Value | Citation |
| --- | --- | --- |
| Default size | `22.r` (header passes `24.r`) | `lib/widgets/bumper_glyph.dart:44` |
| Assets | `assets/images/gamepad/Xbox_LB_bumper.png` / `Xbox_RB_bumper.png` (lettering knocked out); `..._filled.png` variants (lettering closed) | `lib/widgets/bumper_glyph.dart:46-51` |
| Layer 1 (halo) | filled asset tinted `colorScheme.surface.withValues(alpha: 0.5)`, `ImageFilter.blur(sigmaX: 1.5.r, sigmaY: 1.5.r)` | `lib/widgets/bumper_glyph.dart:37,40,62-71` |
| Layer 2 | filled asset tinted `colorScheme.surface` (fills the letters) | `lib/widgets/bumper_glyph.dart:73` |
| Layer 3 | outline asset tinted `colorScheme.onSurface` | `lib/widgets/bumper_glyph.dart:74` |
| Clip | `Clip.none` (halo can spill) | `lib/widgets/bumper_glyph.dart:60` |

Net look: an `onSurface` blob with `surface`-coloured "LB"/"RB" lettering and a soft surface halo. Not interactive.

### NeoGlass (`lib/widgets/neo_glass.dart`)

| Fact | Value | Citation |
| --- | --- | --- |
| Default `cornerRadius` | `14` (plain px) | `lib/widgets/neo_glass.dart:31` |
| `rimIntensity` default | `1` | `lib/widgets/neo_glass.dart:35` |
| Prefs source | `context.watch<SqliteConfigProvider>().config` -> `neoglassBlur`, `neoglassTransparency`, `neoglassBorderWidth` | `lib/widgets/neo_glass.dart:77-86` |
| Fallback without provider | `blur: 0, transparency: 10, borderWidth: 2` | `lib/widgets/neo_glass.dart:88` |
| Tint | `scaffoldBackgroundColor.withValues(alpha: (60 - transparency) / 60.0)` | `lib/widgets/neo_glass.dart:101-109` |
| Surface | `ColoredBox(glassTint)` + optional `Padding`; wrapped in `BackdropFilter(ImageFilter.blur(sigma = blur))` only when `blur > 0`; `ClipRRect(BorderRadius.circular(cornerRadius))` | `lib/widgets/neo_glass.dart:111-140` |
| Rim | `CustomPaint.foregroundPainter`, stroke drawn **outside** the box: rect inflated by `strokeWidth/2`, radius `cornerRadius + strokeWidth/2` | `lib/widgets/neo_glass.dart:128-135,173-178` |
| Rim paint | `PaintingStyle.stroke`, `strokeWidth` (plain px), anti-aliased, `BlendMode.overlay`, `LinearGradient(topLeft -> bottomRight)` colours `white @0.96*i`, `white @0.64*i`, `white @0.16*i`, stops `0.0, 0.60, 1.0` | `lib/widgets/neo_glass.dart:152-156,184-197` |
| Rim skipped | when intensity `<= 0` or stroke `<= 0` | `lib/widgets/neo_glass.dart:168` |

Defaults resolve to tint alpha `50/60 = 0.8333`, no blur, 2 px rim.

#### NeoGlass config defaults

| Setting | Config default | SQLite column default | Range / clamp | Settings steps (cycled with A) | Citation |
| --- | --- | --- | --- | --- | --- |
| Blur | `neoglassBlur = 0` | `neoglass_blur INTEGER DEFAULT 0` | clamp `0..2` | `[0, 1, 2]`, 0 shown as "Off" | `lib/models/config_model.dart:234,296,532-537`, `lib/data/datasources/sqlite_service.dart:1962`, `lib/data/datasources/sqlite_config_service.dart:292-294`, `lib/screens/settings_screen/new_settings_options/themes_settings_content.dart:60,542-543` |
| Transparency | `neoglassTransparency = 10` | `neoglass_transparency INTEGER DEFAULT 10` | clamp `0..30` | `[0, 10, 20, 30]` | `lib/models/config_model.dart:241,297`, `lib/data/datasources/sqlite_service.dart:1963`, `lib/data/datasources/sqlite_config_service.dart:296-301`, `themes_settings_content.dart:64` |
| Border width | `neoglassBorderWidth = 2` | `neoglass_border_width REAL DEFAULT 2` | clamp `0.0..8.0` | `[0, 1, 2, 3, 4]`, 0 shown as "Off" | `lib/models/config_model.dart:245,298,546-554`, `lib/data/datasources/sqlite_service.dart:1964`, `lib/data/datasources/sqlite_config_service.dart:303-308`, `themes_settings_content.dart:67,546-548` |

Legacy `neoglassOpacity` (0.0-1.0) maps to transparency via `(1 - opacity) * 60` (`lib/models/config_model.dart:556-574`). These three rows sit at the top of Settings > Themes (`themes_settings_content.dart:56-57`). Strings: `neoglassGroup` "NeoGlass", `neoglassBlur` "Glass Blur" / "Frost strength: Off, 1 or 2", `neoglassBlurOff` "Off", `neoglassBlurGpuWarning` "Only enable on a powerful GPU - on low-end hardware the frosted blur may not stay smooth." (source uses an em dash), `neoglassTransparency` "Glass Transparency" / "0 = no transparency, 30 = 50% transparency", `neoglassBorderWidth` "Glass Border" / "Width of the glass edge" (`lib/l10n/app_locale_en.dart:84-94`).

### ChromeSurface (`lib/themes/chrome_surface.dart`)

`ThemeExtension` shared by every theme, always `ChromeSurface.standard()`:

| Token | Value | Use | Citation |
| --- | --- | --- | --- |
| `opacity` | `0.75` | `ChromeSurface.fill(context)` = `colorScheme.surface.withValues(alpha: 0.75)` for pills, toolbars, letter indicator | `lib/themes/chrome_surface.dart:55,71-74` |
| `fadeLeading` | `0.78` | left edge of faded panels | `lib/themes/chrome_surface.dart:56` |
| `fadeTrailing` | `0.38` | `fade(context)` right edge (game list sidebar) | `lib/themes/chrome_surface.dart:57,77-80` |
| `fadeTrailingNarrow` | `0.48` | `fadeNarrow(context)` right edge (action rail) | `lib/themes/chrome_surface.dart:58,83-87` |

Gradient: `LinearGradient(centerLeft -> centerRight, [surface @fadeLeading, surface @trailing])` (`lib/themes/chrome_surface.dart:89-99`). Modal dialogs deliberately do not use these (`:27-28`). The header itself does not use ChromeSurface - it uses NeoGlass.

### Theme name resolution ('system')

| Fact | Value | Citation |
| --- | --- | --- |
| Default stored name | `theme_name TEXT DEFAULT 'system'` | `lib/data/datasources/sqlite_service.dart:1908` |
| In-memory default | `_currentThemeName = 'system'` | `lib/providers/theme_provider.dart:26` |
| `currentTheme` for `'system'` | `platformBrightness == dark ? availableThemes['dark'] : availableThemes['light']` | `lib/providers/theme_provider.dart:32-42` |
| Live brightness change | re-resolved in `didChangePlatformBrightness` only while on `'system'` | `lib/providers/theme_provider.dart:112-118` |
| Custom colours for `'system'` | same brightness rule -> `'dark'` / `'light'` | `lib/themes/app_themes.dart:72-79` |
| Unknown / deleted theme | falls back to `'system'` (persisted only if the custom-theme load was complete) | `lib/providers/theme_provider.dart:176-211` |
| `getThemeDataByName` / `getCustomColorsByName` default | dark | `lib/themes/app_themes.dart:113-114,212-213` |
| Built-in ids | dark, light, oled, valentine, dracula, nord, coffee, tokyo_night, retro, abyss, cyberpunk, aqua, palenight, horizon | `lib/providers/theme_provider.dart:50-65` |
| Display names | System, Dark, Light, OLED, Valentine, Dracula, Nord, Coffee, Tokyo Night, Retro, Abyss, Cyberpunk, Aqua, Palenight, Horizon | `lib/providers/theme_provider.dart:68-84` |
| `isOled` | `currentThemeName == 'oled'` | `lib/providers/theme_provider.dart:47` |

### View-mode / sort dropdown (`lib/widgets/header_sort_dropdown.dart`)

#### What opens it

| Trigger | Where | Citation |
| --- | --- | --- |
| Tap the header "View Mode" button | Systems tab header | `lib/widgets/header_sort_dropdown.dart:126-129` |
| X button, systems grid (unless the host overrides `onXPressed`) | `HeaderSortDropdown.globalKey.currentState?.showDropdown()` | `lib/screens/systems_screen/my_systems_section/my_systems_grid/gamepad_grid_nav.dart:52-56` |
| X button, systems carousel (same override rule) | same | `lib/screens/systems_screen/my_systems_section/my_systems_carousel.dart:302-306` |
| X in the collections browser | `showSystemViewDropdown(includeSorting: false, includeCollectionSorting: true, includeCardStyle: true)` | `lib/screens/collections_screen/collections_browser_screen.dart:333-347` |

There is no keyboard key for X (see keyboard table), so from a keyboard it is mouse-only.

#### Open state container

| Fact | Value | Citation |
| --- | --- | --- |
| Route | `showGeneralDialog<String>(barrierDismissible: true, barrierLabel: "Sort Dropdown", barrierColor: Colors.transparent)` | `lib/widgets/header_sort_dropdown.dart:55-59` |
| Entry / exit | `FadeTransition(opacity: animation)`; `showGeneralDialog` default transition duration (not overridden; Flutter default is 200ms, linear) | `lib/widgets/header_sort_dropdown.dart:60-62` |
| Width | `180.r` | `lib/widgets/header_sort_dropdown.dart:64` |
| Position | `Positioned(top: 42.r, left: 6.r)` in screen space | `lib/widgets/header_sort_dropdown.dart:827-830` |
| Max height | `screenHeight - 42.r - bottomPadding - 16.r` | `lib/widgets/header_sort_dropdown.dart:821-823,834` |
| Padding | `EdgeInsets.symmetric(vertical: 8.r)` | `lib/widgets/header_sort_dropdown.dart:835` |
| Fill | `colorScheme.surface` (opaque) | `lib/widgets/header_sort_dropdown.dart:837` |
| Radius | `CornerRadii.radiusExternal ?? BorderRadius.circular(12.r)`; content clipped with a fixed `BorderRadius.circular(12.r)` | `lib/widgets/header_sort_dropdown.dart:838-842,857-858` |
| Border | `colorScheme.outline`, width `1.r` | `lib/widgets/header_sort_dropdown.dart:843-846` |
| Shadow | `colorScheme.shadow.withValues(alpha: 0.5)`, blur `4.r`, offset `(2.r, 2.r)` | `lib/widgets/header_sort_dropdown.dart:847-855` |
| Scroll | `SingleChildScrollView(BouncingScrollPhysics)`, no scrollbar | `lib/widgets/header_sort_dropdown.dart:871-876` |
| Edge fades | when scrollable: `ShaderMask(dstIn)`, vertical gradient stops `[0, up ? 0.05 : 0, down ? 0.95 : 1, 1]`, colours transparent, white, white, transparent | `lib/widgets/header_sort_dropdown.dart:792-815` |

#### Items (systems caller, default flags)

Groups are drawn in this order; each group gets a header, and every group after the first is preceded by a divider.

| # | Value | Label key -> English | Icon | Group key -> English | Condition | Citation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `view_grid` | `grid_view` -> "Grid View" | `Symbols.grid_view_rounded` | `view_mode_group` -> "VIEW MODE" | always | `lib/widgets/header_sort_dropdown.dart:388-393` |
| 2 | `view_carousel` | `carousel_view` -> "Carousel View" | `Symbols.view_carousel_rounded` | "VIEW MODE" | always | `:394-399` |
| 3 | `card_size` (segmented S / M / L / XL) | - | `Symbols.crop_free_rounded` | `card_size_group` -> "CARD SIZE" | only when `systemViewMode == 'grid'` | `:402-412` |
| - | `card_style` (segmented Fanart / Box) | `fanart_card` -> "Fanart", `box_card` -> "Box" | `Symbols.image_rounded` | `card_style_group` -> "CARD STYLE" | only `includeCardStyle` (collections) | `:414-424,550-551` |
| 4 | `sort_alpha` | `alphabetical` -> "Alphabetical" | `Symbols.sort_by_alpha_rounded` | `sort_by_group` -> "SORT BY" | `includeSorting` | `:465-470` |
| 5 | `sort_year` | `release_year` -> "Release Year" | `Symbols.calendar_today_rounded` | "SORT BY" | `includeSorting` | `:471-476` |
| 6 | `sort_manufacturer` | `manufacturer` -> "Manufacturer" | `Symbols.business_rounded` | "SORT BY" | `includeSorting` | `:477-482` |
| 7 | `sort_manufacturer_type` | `manufacturer_type` -> "Manufacturer / Type" | `Symbols.category_rounded` | "SORT BY" | `includeSorting` | `:483-488` |
| 8 | `order_asc` | `ascending` -> "Ascending" | `Symbols.arrow_upward_rounded` | `order_group` -> "ORDER" | `includeSorting` | `:489-494` |
| 9 | `order_desc` | `descending` -> "Descending" | `Symbols.arrow_downward_rounded` | "ORDER" | `includeSorting` | `:495-500` |

Collections variant replaces rows 4-9 with `csort_name` "Alphabetical", `csort_date` `dateAdded` -> "Date added" (`calendar_today_rounded`), `csort_count` `sortByGameCount` -> "Game count" (`tag_rounded`), `corder_asc`, `corder_desc` (`lib/widgets/header_sort_dropdown.dart:426-460`). English strings: `lib/l10n/app_locale_en.dart:659-676`.

Card size values `['S','M','L','XL']`, default `M` (`systemGridColumns = 'M'`, `lib/models/config_model.dart:281`); card style values `['fanart','box']`, default `fanart` (`lib/models/config_model.dart:283`). Other defaults: `systemViewMode 'grid'`, `systemSortBy 'alphabetical'`, `systemSortOrder 'asc'` (`lib/models/config_model.dart:253,265-266`).

#### Row styling

| Element | Value | Citation |
| --- | --- | --- |
| Group header | `Padding(h 16.r, v 6.r)`, `fontSize: 10.r`, `letterSpacing: 1.r`, `onSurface.withValues(alpha: 0.4)` | `lib/widgets/header_sort_dropdown.dart:523-536` |
| Divider | `height: 4.r`, `thickness: 1`, `colorScheme.outline` | `lib/widgets/header_sort_dropdown.dart:515-521` |
| Normal row | `height: 24.r`, margin `h 4.r, v 2.r`, inner padding `h 12.r`, radius `BorderRadius.circular(8.r)` (fixed, not CornerRadii) | `lib/widgets/header_sort_dropdown.dart:710-744` |
| Focused row | fill `primary.withValues(alpha: 0.15)`, border `primary.withValues(alpha: 0.3)` width `1` | `lib/widgets/header_sort_dropdown.dart:714-725` |
| Row icon | `14.r`; `primary` when the row is the active value, else `onSurface` | `lib/widgets/header_sort_dropdown.dart:746-752` |
| Icon-label gap | `8.r` | `:753` |
| Row label | `fontSize: 12.r`; active: `primary` w700; else `onSurface` w500; ellipsis | `lib/widgets/header_sort_dropdown.dart:755-767` |
| Active check | `Symbols.check_rounded` `14.r` `primary`, trailing | `lib/widgets/header_sort_dropdown.dart:769-774` |
| Segmented row | `height: 28.r`, margin `h 4.r, v 2.r`, padding `h 12.r`, radius `CornerRadii.radiusExternal ?? 8.r`, same focused fill/border | `lib/widgets/header_sort_dropdown.dart:571-594` |
| Segmented icon | `14.r`, `onSurface.withValues(alpha: 0.5)`, gap `8.r` | `lib/widgets/header_sort_dropdown.dart:597-604` |
| Segments | `Row(mainAxisAlignment: spaceEvenly)`; each padding `h 6.r, v 2.r`, radius `CornerRadii.radiusInternal ?? 4.r` | `lib/widgets/header_sort_dropdown.dart:605-654` |
| Segment selected | fill `primary`, text `onPrimary`; else transparent / `onSurface`; `fontSize: 11.r`, w700 | `lib/widgets/header_sort_dropdown.dart:646-663` |
| Segment "selected" rule | focused row shows the staged index; unfocused row shows the saved value | `lib/widgets/header_sort_dropdown.dart:611-613` |

"Active value" per row compares against config (`lib/widgets/header_sort_dropdown.dart:678-705`).

#### Dropdown input

Own `GamepadNavigation`, pushed as layer `'sort_dropdown_overlay'` post-frame (not modal) (`lib/widgets/header_sort_dropdown.dart:242-271`).

| Button | Action | Citation |
| --- | --- | --- |
| Up / Down | move focus, **wraps**; nav sound; scroll into view | `lib/widgets/header_sort_dropdown.dart:243-258` |
| Left / Right | on a segmented row: step S/M/L/XL (wraps mod 4) or Fanart/Box (wraps), nav sound, and **apply immediately**; elsewhere nothing | `lib/widgets/header_sort_dropdown.dart:305-342` |
| A | pop with the row's value (segmented rows apply then pop `card_size_X` / `card_style_X`); caller applies it and plays nav sound | `lib/widgets/header_sort_dropdown.dart:357-374,73-108` |
| B | `Navigator.pop(context)` - closes without change | `lib/widgets/header_sort_dropdown.dart:262` |
| Barrier tap | closes | `lib/widgets/header_sort_dropdown.dart:57` |
| Pointer | tap row = focus + select; hover = focus; tap segment = focus + stage + apply | `lib/widgets/header_sort_dropdown.dart:727-736,614-630` |

Initial focus index `0` (Grid View) (`lib/widgets/header_sort_dropdown.dart:190`). Scroll-to-focus: `animateTo(position, 150ms, Curves.easeInOut)` where position is summed as top pad `8.r` + per group header `16.r` + divider `4.r` + row `28.r` (normal) or `32.r` (segmented) (`lib/widgets/header_sort_dropdown.dart:281-301`).

### Notification bell (`lib/widgets/notification_bell.dart`)

#### Bell

| Fact | Value | Citation |
| --- | --- | --- |
| Icon, empty | `Symbols.notifications_rounded`, `colorScheme.onSurface`, `14.r` | `lib/widgets/notification_bell.dart:153-161` |
| Icon, has notifications | `Symbols.notifications_active_rounded`, `customColors.warningColor`, `14.r` | same |
| Badge | only when non-empty: `Positioned(top: 0, right: 0)` circle `5.r x 5.r`, fill `warningColor`, border `colorScheme.surface` width `0.8.r`; no count | `lib/widgets/notification_bell.dart:163-179` |
| Pulse | `AnimationController(1200ms)`, `Tween(1.0 -> 0.4)`, `Curves.easeInOut`, drives `FadeTransition` on the icon only | `lib/widgets/notification_bell.dart:55-60,151-152` |
| Pulse trigger | only when the count increases: `repeat(reverse: true, count: 6)` (3 round trips, ends opaque); stops and resets to opaque when count hits 0; never on mount | `lib/widgets/notification_bell.dart:46,103-121` |
| Tap | toggle dropdown | `lib/widgets/notification_bell.dart:143` |
| Select (View) button | app-wide toggle via `GamepadNavigation.globalSelectTap`, only when the bell's route is current and the active layer has no `onSelectButton` of its own | `lib/widgets/notification_bell.dart:77,86-90`, `lib/utils/gamepad_nav.dart:260-268,311-316` |

#### Panel (open state)

Inserted as an `OverlayEntry` (not a route): full-screen translucent `GestureDetector` that closes on tap, plus the panel at `Positioned(top: bellGlobalY + bellHeight + 14, right: 8)` - both offsets plain px (`lib/widgets/notification_bell.dart:40-43,195-222`). No open/close animation (inserted and removed directly).

| Element | Value | Citation |
| --- | --- | --- |
| Surface | `Material(color: colorScheme.surface, elevation: 6, shadowColor: shadow.withValues(alpha: 0.3))` | `lib/widgets/notification_bell.dart:401-406` |
| Shape | `RoundedRectangleBorder(CornerRadii.of(context).radiusExternal, side: outline.withValues(alpha: 0.3))`, `Clip.antiAlias` | `lib/widgets/notification_bell.dart:407-415` |
| Size | `minWidth: 200.r`, `maxWidth: 300.r`, `maxHeight: 360.r` | `lib/widgets/notification_bell.dart:416-421` |
| Header row | padding `h 12.r, v 10.r`, `spaceBetween` | `lib/widgets/notification_bell.dart:426-433` |
| Title | `notifications` -> "Notifications", `onSurface`, `12.r`, bold | `lib/widgets/notification_bell.dart:434-441`, `lib/l10n/app_locale_en.dart:318` |
| "Clear all" | shown only if any notification is not `ongoing`; padding `h 6.r, v 2.r`, radius `CornerRadii.radiusInternal`, fill `primary.withValues(alpha: 0.15)` when D-pad-selected else transparent; text `clear_all` -> "Clear all", `primary`, `10.r`, w600 | `lib/widgets/notification_bell.dart:447-476`, `lib/l10n/app_locale_en.dart:319` |
| Empty state | `Padding(16.r)`, centred `no_active_notifications` -> "No active notifications", `onSurface.withValues(alpha: 0.6)`, `11.r` | `lib/widgets/notification_bell.dart:480-494`, `lib/l10n/app_locale_en.dart:320` |
| List | `ListView.separated(shrinkWrap, padding: zero)`, divider `height: 1.r`, `outline.withValues(alpha: 0.2)` | `lib/widgets/notification_bell.dart:496-507` |
| Order | insertion order; an updated notification moves to the end | `lib/services/global_notification_service.dart:85-92` |

Row (`_NotificationDropdownItem`, `lib/widgets/notification_bell.dart:552-641`):

| Element | Value | Citation |
| --- | --- | --- |
| Row fill | selected: `primary.withValues(alpha: 0.15)`; else transparent | `:572-574` |
| Padding | `h 12.r, v 10.r` | `:575` |
| Layout | `Row(crossAxisAlignment: start)`: icon, `8.r`, text column (expanded), `8.r`, close | `:576-637` |
| Type icon | success `Symbols.check_circle_rounded` `Colors.green.shade400`; error `Symbols.error_rounded` `colorScheme.error`; info `Symbols.info_rounded` `colorScheme.primary`; size `16.r` | `:556-566,579` |
| Title (optional) | `onSurface`, `11.r`, bold, 1 line, ellipsis | `:586-596` |
| Message | `onSurface.withValues(alpha: 0.8)`, `10.r`, max 6 lines, ellipsis | `:597-612` |
| Progress (optional) | gap `6.r`, `LinearProgressIndicator(minHeight: 3.r, color: iconColor, backgroundColor: iconColor @0.2, borderRadius: 2.r)` | `:613-622` |
| Close | `Symbols.close_rounded`, `onSurface.withValues(alpha: 0.5)`, `14.r`; tap dismisses that notification | `:627-636` |

Notification types: `info`, `success`, `error` (`lib/services/global_notification_service.dart:5`); they never auto-dismiss (`lib/widgets/notification_bell.dart:95-99`).

#### Panel input

Own `GamepadNavigation`, layer `'notification_dropdown'`, **modal** (`lib/widgets/notification_bell.dart:262,277-296`).

| Button | Action | Citation |
| --- | --- | --- |
| Up / Down | move through entries, wraps; nav sound; no hold-repeat (`allowRepeat: false`) | `lib/widgets/notification_bell.dart:278-285,323-332` |
| A | enter sound; on "Clear all" dismiss all non-ongoing, else dismiss the highlighted one; close panel if list becomes empty | `lib/widgets/notification_bell.dart:364-387`, `lib/services/global_notification_service.dart:139-141` |
| B | close | `lib/widgets/notification_bell.dart:281` |
| Select | close (toggle) | `lib/widgets/notification_bell.dart:283` |
| Tap row | move highlight only (does not dismiss) | `lib/widgets/notification_bell.dart:514-520,568-570` |

Entry order: "Clear all" first (when present), then each notification (`lib/widgets/notification_bell.dart:308-313`). Initial highlight index `0`. Scroll-to-highlight: "Clear all" -> `animateTo(0, 160ms, Curves.easeOut)`; a row -> `Scrollable.ensureVisible(alignment: 0.5, 160ms, Curves.easeOut)` (`lib/widgets/notification_bell.dart:334-361`).

### MonospacedClock (`lib/widgets/monospaced_clock.dart`)

Not used by the header clock. Used by footers for play time.

| Fact | Value | Citation |
| --- | --- | --- |
| Format | `HH:MM:SS`, each part zero-padded to 2 | `lib/widgets/monospaced_clock.dart:26-32` |
| Cell width, digits | width of the widest digit `0-9` in the given style and text scaler | `lib/widgets/monospaced_clock.dart:55-60` |
| Cell width, `:` | its own measured width | `lib/widgets/monospaced_clock.dart:60,76` |
| Each glyph | `SizedBox(width: cell)` with `Text(textAlign: center)` | `lib/widgets/monospaced_clock.dart:71-80` |

### BackSwipeZone (global touch overlay)

| Fact | Value | Citation |
| --- | --- | --- |
| Hit strip | left edge, full height, width `32.0.r` | `lib/widgets/back_swipe_zone.dart:47,58-62` |
| Fires when | rightward travel `>= 36.0` px from touch-down, or fling velocity `>= 120.0` | `lib/widgets/back_swipe_zone.dart:42-43,70-77` |
| Action | `GamepadNavigation.triggerBack()` - the active layer's B action, with back sound; silent no-op if none | `lib/utils/gamepad_nav.dart:477-485` |

### Global input

#### Logical button set

`GamepadInputType` (`lib/utils/gamepad_translator.dart:7-37`): `dpadUp/Down/Left/Right`, `buttonA/B/X/Y`, `buttonLB/RB/LT/RT`, `buttonStart`, `buttonSelect`, `buttonHome`, `leftStickX/Y`, `rightStickX/Y`, `leftStickButton`, `rightStickButton`, `unknown`.

Dispatch in `GamepadNavigation._handleTranslatedEvent` (`lib/utils/gamepad_nav.dart:947-1072`):

| Input | Callback | Sound | Fires on | Citation |
| --- | --- | --- | --- | --- |
| D-pad / left stick | `onNavigateUp/Down/Left/Right` | nav sound only if the action reports it moved | press | `lib/utils/gamepad_nav.dart:948-1024,1289-1292` |
| A | `onSelectItem` | enter | Android: press; desktop: release | `lib/utils/gamepad_nav.dart:1026-1029,927` |
| B | `onBack` | back | Android: press; desktop: release | `:1031-1034` |
| Y | `onFavorite` | nav | same | `:1036-1039` |
| X | `onXButton` | nav | same | `:1041-1044` |
| Start | `onSettings` | nav | same | `:1046-1049` |
| Select | tap -> `onSelectButton`, else `globalSelectTap` (bell); held -> chord modifier | - | release (deferred) | `:877-890,303-318` |
| Select + A/B/X/Y | `onSelectModifierA/B/X/Y` | nav | press | `:894-907` |
| LB / RB | `onLeftBumper ?? onPreviousTab` / `onRightBumper ?? onNextTab` | nav (only if bound) | press | `:1054-1057,1432-1441` |
| L3 / R3 | `onLeftStickClick` / `onRightStickClick` | none | desktop release / Android press | `:1062-1067` |
| LT, RT, Home, right stick | no action | - | - | `:1070-1071` (RT passes the press gate at `:923` but has no case) |

Android, while a `TextField` is focused: only LB, RB and B are processed (`lib/utils/gamepad_nav.dart:868-875`).

#### A/B swap (Nintendo layout)

Not found. No setting, config field or code path swaps A/B or X/Y (searched `nintendo`, `swap`, `buttonLayout`, `faceButton` across `lib/`). The only remap is hardware-level: Sony controllers (VID `054c`) get Cross = A, Circle = B, Square = X, Triangle = Y on Windows DirectInput and Linux hid-sony (`lib/utils/gamepad_translator.dart:571-638`).

#### Keyboard map

Handled by `GamepadNavigation._handleKeyEvent`, registered on `ServicesBinding.instance.keyboard` for every active navigator (`lib/utils/gamepad_nav.dart:391-394,1094-1240`):

| Key | Logical button | Citation |
| --- | --- | --- |
| `W`, `ArrowUp` | D-pad up (with hold-repeat) | `lib/utils/gamepad_nav.dart:1164-1170` |
| `S`, `ArrowDown` | D-pad down | `:1171-1178` |
| `A`, `ArrowLeft` | D-pad left | `:1179-1186` |
| `D`, `ArrowRight` | D-pad right | `:1187-1194` |
| `Q` | LB (previous tab) | `:1195-1200` |
| `E` | RB (next tab) | `:1201-1203` |
| `Enter` | A | `:1204-1209` |
| `Backspace` | B (only consumed if the layer has `onBack`) | `:1210-1217` |
| `Y` | Y (`onFavorite`) | `:1218-1223` |
| `Escape` | Start (`onSettings`) | `:1224-1229` |
| `Alt+Enter` | toggle fullscreen (desktop) | `:1131-1136`, `lib/main.dart:1030-1035` |
| any key with Ctrl or Shift held | ignored | `lib/utils/gamepad_nav.dart:1139-1141` |
| X, Select, L3/R3, LT/RT | no keyboard key - not found | - |

Only `KeyDownEvent` / `KeyUpEvent` are handled; OS key-repeat (`KeyRepeatEvent`) is ignored, repeat is synthesized by the timer below (`lib/utils/gamepad_nav.dart:1095-1097`). Key-up stops the direction's repeat timer. Any focused `TextField` disables the keyboard map (`:1122-1125`).

`lib/utils/keyboard_nav.dart` defines a separate `KeyboardNavigation` (100ms throttle, `Delete` = back, no repeat) but nothing instantiates it - it is dead code (`lib/utils/keyboard_nav.dart:25,123-125`; only reference is its own constructor).

#### Timing constants

| Constant | Value | Applies to | Citation |
| --- | --- | --- | --- |
| `_initialRepeatDelay` | `300ms` | first repeat of a held direction | `lib/utils/gamepad_nav.dart:225` |
| `_repeatInterval` | `80ms` | repeat cadence (default: fixed) | `lib/utils/gamepad_nav.dart:228,1367-1369` |
| `accelerateRepeats` | default `false` | when true, interval ramps linearly `80ms -> 35ms` over 14 repeats | `lib/utils/gamepad_nav.dart:100,233,236,1378-1386` |
| `_minRepeatInterval` | `35ms` | ramp floor | `lib/utils/gamepad_nav.dart:233` |
| `_rampRepeats` | `14` | ramp length | `lib/utils/gamepad_nav.dart:236` |
| `_letterJumpAfter` | `1200ms` | held direction on the letter axis switches to letter jumps (only when a view supplies `onLetterJump`) | `lib/utils/gamepad_nav.dart:243,1355-1361` |
| `_letterJumpInterval` | `360ms` | dwell per letter | `lib/utils/gamepad_nav.dart:247` |
| repeat stop | repeat ends when the action returns `false` (boundary), or `allowRepeat: false` | | `lib/utils/gamepad_nav.dart:1301-1309` |
| `_directionalThrottleMs` | `128ms` | minimum gap between events of the same continuing gamepad direction (not Windows) | `lib/utils/gamepad_nav.dart:131,807-813` |
| stick threshold | `0.60` (`0.65` Windows; Windows release below `0.5`) | left stick to direction | `lib/utils/gamepad_nav.dart:799-801,965-1023` |
| `_actionDebounceMs` | `128ms` | face buttons / Start (Select chords exempt) | `lib/utils/gamepad_nav.dart:216,836-851` |
| `_throttleDelayMs` (keyboard) | `128ms` | arrows, Enter, Backspace, Escape swallowed within 128ms of the last handled key-down | `lib/utils/gamepad_nav.dart:252,1146-1159` |
| `_reactivationGraceMs` | `150ms` | inputs ignored after a layer activates; LB/RB and Q/E exempt | `lib/utils/gamepad_nav.dart:326,753-763,1104-1112` |
| `_shoulderTapDebounceMs` | `50ms` | between two separate bumper taps | `lib/utils/gamepad_nav.dart:162` |
| `_shoulderRepeatIntervalMs` | `255ms` | held bumper walks tabs (~4/s) | `lib/utils/gamepad_nav.dart:158` |
| `_shoulderHoldLapsedMs` | `500ms` | a gap this long means the bumper was released | `lib/utils/gamepad_nav.dart:166` |
| `_shoulderHoldStartDelay` | `400ms` | desktop synthetic bumper repeat starts after this, then every 255ms | `lib/utils/gamepad_nav.dart:208,1456-1476` |
| `_shoulderHoldMaxMs` | `10000ms` | safety cap on a synthetic bumper hold | `lib/utils/gamepad_nav.dart:213` |
| `SelectTap.chordWindow` | `400ms` | Select chord window and tap-dispatch deferral | `lib/utils/select_tap.dart:25` |
| `SelectTap.tapMax` | `500ms` | longest Select press that counts as a tap | `lib/utils/select_tap.dart:28` |
| `_keycodeRepressGapMs` | `200ms` | Android dropped-ACTION_UP recovery | `lib/utils/gamepad_translator.dart:106` |

Opposite directions are mutually exclusive: starting Up cancels Down's repeat, etc. (`lib/utils/gamepad_nav.dart:1250-1287`).

#### Navigation-layer stack (`lib/services/gamepad/gamepad_navigation_manager.dart`)

A static `List<NavLayer>` where only the top layer's navigator is active (`:25-27`). Each `NavLayer` has `id`, `onActivate`, `onDeactivate`, `modal` (`:4-19`).

| Operation | Behaviour | Citation |
| --- | --- | --- |
| `pushLayer(id)` | deactivates the current top, appends, activates the new one | `:114-137` |
| `pushLayer(..., modal: true)` | modal layers keep focus; a later non-modal push is inserted beneath the lowest modal and not activated | `:91-112` |
| `pushLayer(..., background: true)` | inserted beneath the current top without taking focus (for widgets on a non-current route) | `:74-89` |
| `popLayer(id)` | removes it; if it was the top, deactivates it and activates the new top | `:141-173` |
| `reactivate()` | activates the current top | `:260-271` |
| `deactivateAll()` | deactivates the top (game launch) | `:178-187` |
| `rememberFocusOwner` / `restoreFocusOwner` | on game exit, moves the owner back to the top and reactivates | `:198-257` |
| `popLayersAbove(id)` | pops everything above `id` and reactivates it | `:277-306` |

Known layer ids in this area: `'app_screen'` (base, `lib/screens/app_screen.dart:163-167`), `'sort_dropdown_overlay'` (`lib/widgets/header_sort_dropdown.dart:266-270`), `'notification_dropdown'` modal (`lib/widgets/notification_bell.dart:290-295`).

Desktop input is dropped while the window is unfocused (`DesktopWindowFocus.allowsInput`) (`lib/utils/gamepad_nav.dart:744-747`).

#### Hardware mappings (reference)

`GamepadMappingDetector` per platform (`lib/utils/gamepad_mapping.dart`). Windows uses the GameInput named-key path first (`a`, `b`, `x`, `y`, `dpadup`..., `leftshoulder`, `rightshoulder`, `lefttrigger`, `righttrigger`, `menu` = Start, `view` = Select, `leftthumbstick`, `rightthumbstick`, stick axes) (`lib/utils/gamepad_translator.dart:345-401`). Android uses `keycode_button_*` and `axis_hat_x/y` (`lib/utils/gamepad_mapping.dart:291-320`, `lib/utils/gamepad_translator.dart:728-757`). Linux USB/wireless: buttons 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 Select, 7 Start, 8 Home, 9 L3, 10 R3; D-pad on axes 6/7 (`lib/utils/gamepad_translator.dart:673-697,528-548`). Linux Bluetooth: 0 A, 1 B, 3 X, 4 Y, 6 LB, 7 RB, 10 Select, 11 Start, 13 Home, 14 L3, 15 R3 (`lib/utils/gamepad_translator.dart:646-671`).

#### Sounds

`SfxService`: nav = random of `assets/sounds/nav1.wav`, `nav2.wav`, `nav3.wav` (no immediate repeat); enter = `assets/sounds/enter.wav`; back = `assets/sounds/back.wav` (`lib/services/sfx_service.dart:16-37`). Defaults `sfxEnabled = true`, `sfxVolume = 0.75` (`lib/models/config_model.dart:262-263`).

### Global motion settings

| Item | Finding | Citation |
| --- | --- | --- |
| `AnimationConfig` | `scrollFast` 640ms, `scrollNormal` 640ms, `scaleCard` 512ms, `scaleGame` 512ms, `textScrollDuration` 2s, `textScrollDelay` 512ms, `smoothCurve` / `fastCurve` `Curves.fastOutSlowIn`, `animationSpeedFactor` 0.5 with `applySpeedFactor(d) = d * 0.5` | `lib/utils/animation_config.dart:6-37` |
| `AnimationConfig` usage | not referenced anywhere outside its own file - dead code | grep over `lib/` |
| Reduce motion / animation toggle | not found (no config field, no `disableAnimations` read, no `timeDilation` use) | grep over `lib/` |
| Page transitions | `FadeUpwardsPageTransitionsBuilder` on all platforms | `lib/main.dart:1079-1092` |

## Systems tab

Source: `misobadev/neostation-frontend` at `d9bece5`. All paths below are relative to that repo. Sizes are in source units exactly as written (`12.r`, plain logical px when there is no suffix). flutter_screenutil is initialised with `designSize: Size(640, 480)`, `minTextAdapt: true`, `splitScreenMode: true` (`lib/main.dart:1021-1024`), so at a 640x480 viewport `1.r == 1px`. Where a "worked example at 640x480" is given it is arithmetic from the source numbers, not a source value.

Theme roles (`colorScheme.surface`, `primary`, ...) are resolved per theme and are not listed here. Corner radii come from the `CornerRadii` theme extension (`lib/themes/corner_radii.dart:15-90`): `radiusExternal` / `radiusInternal` are `m` = 14/10 on most bundled themes (light, oled, aqua, palenight, horizon, valentine), `s` = 8/5 (retro, abyss), `xs` = 3/2 (nord), `xl` = 24/20 (dracula, custom themes default), `zero` = 0/0 (cyberpunk) (`lib/themes/*_theme.dart:57-58`, `lib/themes/custom_theme.dart:290-293`). Each widget below also lists the literal fallback it uses when the extension is missing.

### Phases of the tab

`SystemContent` picks one of three phases and cross-fades between them (`lib/screens/systems_screen/system_content.dart:45-108`).

| Phase | Condition | Widget | Cite |
| --- | --- | --- | --- |
| Splash | `isLoading \|\| isScanning \|\| raProgress.holdsSplash` | `SplashStatusLayout` (shimmering logo + progress) | `system_content.dart:58-64, 81-85` |
| Initial setup | not splash, `!hasDetectedSystems`, `scanCompleted` | `InitialSetupWidget` | `system_content.dart:67-70, 86-90` |
| Content | not splash, `scanCompleted`, not setup | `MySystems` (grid or carousel) | `system_content.dart:73-74, 91-98` |
| Empty | otherwise | `SizedBox.shrink` | `system_content.dart:99-101` |

Transition: `AnimatedSwitcher(duration: 400ms)` with the default curve (linear) and default fade transition (`system_content.dart:104-107`). No minimum splash time (`system_content.dart:60-64`).

Inside `MySystems` there are two more guard states before content (`lib/screens/systems_screen/my_systems_section/my_systems_grid.dart:97-106`): `isGlobalScanning` shows `GridLoadingState`; `!hasDetectedSystems` shows `GridEmptyState`.

Tab entry: switching to any tab resets the systems selection to index 0 (`lib/screens/app_screen.dart:580-584`). Default focus is therefore the first card (the Recent card if present, else the first system).

#### Splash phase

- Layout: `SplashStatusLayout` (`lib/widgets/splash_status_layout.dart:27-178`). Logo is `ShimmeringLogo` centred on screen; base width 280, aspect 772/510, capped at 55% of width and 40% of height (`splash_status_layout.dart:39-51, 131-138`). Status column sits `gap` = 16 (scaled) below the logo, max width 480 (scaled) minus 32 (scaled) padding each side, bottom inset 12 (scaled) (`splash_status_layout.dart:54-62, 140-173`). Scale = `max(1, min(w/640, max(h,700)/480))` (`splash_status_layout.dart:82-88`). Text scale = `sqrt(max(1, scale/1.4))` (`splash_status_layout.dart:98-110`).
- Logo asset: `assets/images/logo_transparent.png` (`lib/widgets/shimmering_logo.dart:138-142`).
- Shimmer: `AnimationController` 2000ms, `repeat()` when progress is null; with progress it `animateTo(progress)` over 250ms `Curves.easeOut` (`shimmering_logo.dart:44-54, 88-101`). Gradient is white at alpha 0 / 0 / 0.55 / 0 / 0, stops 0.0/0.38/0.5/0.62/1.0, from `Alignment(-1.0,-0.4)` to `Alignment(1.0,0.4)`, `BlendMode.srcATop`, translated by `bounds.width * (progress*3.2 - 1.6)` (`shimmering_logo.dart:114-161`).
- Progress bar (scan or RetroAchievements pass): width `220.r`, `ClipRRect` radius `2.r`, `LinearProgressIndicator(minHeight: 3.r)`, track `onSurface.withValues(alpha: 0.12)` (`system_content.dart:135-149, 169-181`). Then `SizedBox(height: 16.r)`.
- Status text: `bodySmall` at `fontSize: 17 * textScaleOf(context)`, `onSurface.withValues(alpha: 0.6)`, centred, 1 line, ellipsis (`system_content.dart:151-167, 183-198`).
- Strings: scan status is the provider's own `scanStatus` string, else `AppLocale.scanningSystemsRoms` = "Scanning systems and ROMs..." (`system_content.dart:184-186`, `lib/l10n/app_locale_en.dart:773`). RA pass: `raMatchProgressCounted` = "Matching RetroAchievements... {done}/{total}" or `raMatchProgressBusy` = "Matching RetroAchievements..." (`system_content.dart:152-157`, `app_locale_en.dart:209-210`).

#### GridLoadingState (blocking global scan)

`lib/screens/systems_screen/my_systems_section/widgets/grid_loading_state.dart:13-102`.

- Card: max width 400, padding 32, margin h 16, gradient `surface` -> `surface.withValues(alpha: 0.95)` topLeft -> bottomRight, radius `14.r`, border `primary.withValues(alpha: 0.15)` width 1, shadow black 0.1 blur `16.r` offset (0,4) (`:18-46`).
- Icon tile: padding 14, fill `primary`, radius `radiusInternal` (fallback `12.r`), shadow `primary` 0.3 blur 12 offset (0,2); `Symbols.sync_rounded` white size 32 (`:51-75`).
- 24 gap, title `AppLocale.settingUpLibrary` = "Setting up your library" in `headlineSmall` bold `onSurface`; 8 gap; `AppLocale.detectingSystems` = "Detecting and configuring systems..." in `bodyLarge` `onSurface` 0.7; 24 gap; `SystemScanProgressWidget()` (`:76-96`, `app_locale_en.dart:852-853`).

#### GridEmptyState (no systems detected)

`lib/screens/systems_screen/my_systems_section/widgets/grid_empty_state.dart:14-154`.

- Card: max width 400, padding 32, margin h 16, same gradient, radius `16.r`, border `outline` 0.2 width 1, shadow black 0.1 blur 16 offset (0,4) (`:21-47`).
- Icon tile: padding 16, `surfaceContainerHighest` 0.5, radius `12.r`; `assets/images/icons/folder-add-bulk.png` 48x48 tinted `onSurface` 0.5 (`:51-69`).
- Title: `hasRomFolders ? noSystemsFoundTitle ("No Systems Found") : welcomeNeoStation ("Welcome to NeoStation!")`, `headlineSmall` bold (`:71-80`, `app_locale_en.dart:854, 777`).
- Body: `hasRomFolders ? noSystemsFoundDesc : selectRomFolderDescShort`, `bodyMedium` `onSurface` 0.7 (`:82-92`). English: "No supported systems were found in your ROM folder. Try selecting a different folder or check that your ROMs are properly organized." / "Select a ROM folder to start scanning your game library." (`app_locale_en.dart:855, 857`).
- Button: `primary` fill radius `8.r`, shadow primary 0.3 blur 8 offset (0,2); padding h 20 v 12; `Symbols.folder_rounded` white 20, 8 gap, `selectRomFolderButton` = "SELECT ROM FOLDER" white w600 (`:95-143`, `app_locale_en.dart:822`). Tap calls `selectRomFolder` (`:118-121`). No gamepad layer is registered by this widget (not found).

#### InitialSetupWidget (first run)

`lib/screens/systems_screen/my_systems_section/initial_setup_widget.dart`.

- Breakpoint: on XS (<560) or Small (560-689) width it shows only the ROM-selection card; otherwise a `Row` of ROM card + 16 gap + help card, max width 720 (`:63-95`).
- ROM card: max width 420, padding 32, `surface`, radius 32, border `primary` 0.2 width 1.5, shadow black 0.1 blur 20 offset (0,10) (`:107-125`).
- Icon: circle, padding 20, fill `primary` 0.15, border `primary` 0.3 width 2; `folder-add-bulk.png` 60x60 tinted `primary` (`:131-149`).
- Title `setupLibrary` = "Setup Your Library": `headlineMedium` w900 size 28 letterSpacing -0.5 (`:153-162`, `app_locale_en.dart:817`). Body `chooseRomFolderOrganize` = "Choose your ROM folder to automatically detect systems and organize your collection." `bodyLarge` 0.8 size 15 height 1.4 (`:166-174`, `app_locale_en.dart:818`).
- Button (idle): outer padding 4, radius 22, border `primary` 2; inner height 64, `primary`, radius 18, shadow primary 0.3 blur 12 offset (0,4); label `changeFolder` "CHANGE FOLDER" or `selectRomFolderButton` "SELECT ROM FOLDER", 16 w800 letterSpacing 1.2 `onPrimary` (`:250-291`, `app_locale_en.dart:821-822`).
- Button (loading): height 64, radius 18, `primary` 0.3; 24x24 spinner stroke 3 + 16 gap + `scanningButton` "SCANNING..." 16 w800 ls 1.2 `primary` (`:200-235`, `app_locale_en.dart:820`).
- Error box: padding 16, `errorContainer`, radius 12, `warning-bulk.png` 20x20 (`:295-323`). Success box: padding 16, `primary` 0.1, radius 12, `check-bulk.png`, `configurationComplete` "Configuration Complete!", `foundSystemsInFolder` "Found {count} systems in your ROM folder.", `lastScanLabel` "Last scan: {date}" with date `d/m/yyyy h:mm` (`:327-394, 491-493`, `app_locale_en.dart:823-825`).
- Help card: `Card` elevation 0, `surfaceContainerHighest` 0.666, padding 20; `lightbulb-bulk.png` 20x20 + `howItWorks` "How it works"; four steps (`step1SelectFolder`..`step4Desc`), each title `bodyMedium` w600 + 4 gap + description `bodySmall` 0.7, bottom padding 12 (`:398-488`, `app_locale_en.dart:826-837`).
- Input: A on the Systems tab calls `InitialSetupWidget.selectCurrent()` from the app-level handler (`lib/screens/app_screen.dart:544-551`); it is a no-op while loading or scanning (`initial_setup_widget.dart:51-55`).

### Content layout (both view modes)

View mode is `config.systemViewMode`, `'grid'` (default) or `'carousel'` (`lib/models/config_model.dart:253`; `my_systems_grid.dart:111`).

The app's header floats over the tab content (`lib/screens/app_screen.dart:713-736`), which is why the content has a top inset:

| Mode | Top inset | Side inset | Bottom | Cite |
| --- | --- | --- | --- | --- |
| Grid | `46.r` | `6.0.r` left/right | `0.r` then `SystemsGridFooter` | `my_systems_grid.dart:219-271` |
| Carousel | `42.r` | none | `SystemsGridFooter` | `my_systems_grid.dart:117-147` |

When a non-blocking background scan is running, a `SystemScanProgressWidget` with `EdgeInsets.all(8.0)` is inserted above the content; a post-game RetroAchievements pass puts it below the content instead (`my_systems_grid.dart:158-186`).

The header shows the X / "View Mode" button only on the Systems tab, left-aligned (`lib/widgets/header.dart:309-316`). That button is `HeaderSortDropdown`: `GamepadControl` with margin h `10.r`, `Xbox_X_button.png`, label `AppLocale.viewMode` = "View Mode", colours `tertiaryFixed` / `onTertiaryFixed` (`lib/widgets/header_sort_dropdown.dart:118-134`, `app_locale_en.dart:646`).

### System list: contents and order

`buildSystemsList` (`lib/screens/systems_screen/my_systems_section/system_list_builder.dart:21-91`) returns `[...recentGames, ...detectedSystems]` (`:90`).

1. Recent card: at most one (`const recentCount = 1`), the most recently played game; zero when `config.hideRecentCard` is true (`:32-36`). Converted with `SystemInfo.fromGameModel` (`:38-41`).
2. Detected systems from `configProvider.detectedSystems`, minus user-hidden folders (`hiddenSystemFolders`), minus `favorites` when `totalFavorites == 0` (`:43-52`).
3. Per-card overrides: `all` gets `numOfRoms = totalGames`; `favorites` gets `numOfRoms = totalFavorites`; `collections` gets `numOfRoms = collections.totalGameCount` (sum of games inside collections); `android` keeps its `romCount` (apps) (`:56-86`).

Order of detected systems (`lib/providers/sqlite_config_provider/scanning.dart:1262-1329`): virtual systems always float to the top in fixed order `all` (1), `favorites` (2), `collections` (3), `music` (4), `android` (5) regardless of sort (`:1269-1283`). Real systems are then sorted by `config.systemSortBy` and reversed when `systemSortOrder == 'desc'` (`:1265-1266, 1327`):

| `systemSortBy` | Comparison | Cite |
| --- | --- | --- |
| `alphabetical` (default) | `realName` lowercased | `scanning.dart:1320-1325`, `config_model.dart:265` |
| `year` | `launchDate` string, missing = `'9999'` | `scanning.dart:1292-1296` |
| `manufacturer` | manufacturer lowercased, then launchDate | `scanning.dart:1297-1305` |
| `manufacturer_type` | manufacturer, then `type`, then launchDate | `scanning.dart:1306-1319` |

Default order is `asc` (`config_model.dart:266`).

Platform condition: the `android` system is dropped from the detected list on any platform other than Android (`lib/repositories/system_repository.dart:62-65`). So the Android card exists only on Android.

Virtual systems and what they open (`my_systems_grid.dart:503-565`, carousel copy at `my_systems_carousel.dart:518-566`):

| folderName | JSON name / short | Opens |
| --- | --- | --- |
| `all` | "All Systems" / "All" | `SystemGamesList` on a synthesized `all` model (`my_systems_grid.dart:508-523, 643-669`). Fallback colour `#ff006a`, fallback name `AppLocale.allSystems` = "All Systems" (`:656-658`, `app_locale_en.dart:815`) |
| `favorites` | "Favorites" / "Fav" | `SystemGamesList` for that system (`:548-564`) |
| `collections` | "Collections" / "Coll" | `CollectionsBrowserScreen` (`:524-535`) |
| `music` | "Music" / "Music" | `SystemGamesList` (music player lives in the games view, not this area) |
| `android` | "Android" / "Android" | `AndroidAppsGrid` (Android only) (`:536-547`) |
| recent game card | game name | launches the game directly via `launchGameWithDialog` (`:407-501`) |

### Grid view

#### Card size setting and column count

`config.systemGridColumns` holds `'S' | 'M' | 'L' | 'XL'`, default `'M'` (`config_model.dart:281`). It maps to a fixed column count regardless of screen width (`lib/responsive.dart:100-114`):

| Size | Columns |
| --- | --- |
| S | 7 |
| M (default) | 6 |
| L | 5 |
| XL | 4 |
| any other value | 6 |

The width breakpoints are not applied to the systems grid. `Responsive.getSystemsCrossAxisCount(context)` (7/6/5/4/4 by breakpoint, `responsive.dart:49-55`) has no caller in `lib/` (zero hits for `getSystemsCrossAxisCount(`). The breakpoints themselves (`responsive.dart:22-40`):

| Name | Width | Where applied in this area |
| --- | --- | --- |
| XS | `< 560` | InitialSetupWidget single-column (`initial_setup_widget.dart:63-64`); Android apps grid 5 cols |
| Small | `>= 560 && < 690` | InitialSetupWidget single-column; Android apps grid 6 cols |
| Medium | `>= 690 && < 840` | Android apps grid 8 cols |
| Large | `>= 840 && < 1280` | Android apps grid 10 cols |
| XL | `>= 1280` | Android apps grid 10 cols |

(Android apps grid: `responsive.dart:118-124`.) The header also uses XS (`lib/widgets/header.dart:209, 504`), out of scope here.

Where the size is changed: the X picker's CARD SIZE row (grid mode only), or a two-finger pinch on Android (see below). `hideSystemLogos` (Settings > system art) switches every card to square (`my_systems_grid.dart:233-235`).

#### Geometry

`calculateGridDimensions` (`lib/screens/systems_screen/my_systems_section/grid_geometry.dart:122-151`):

- `crossAxisSpacing = 6.0.r`, `mainAxisSpacing = 6.0.r` (`:127-128`).
- `itemWidth = (width - 6.0.r * (cols - 1)) / cols` where width is the `LayoutBuilder` max width (grid area after the `6.0.r` side padding) (`:130-132`, `my_systems_grid.dart:1139`).
- Layout height per card = `colWidth / childAspectRatio`; `childAspectRatio` is `0.80` normally, `1.0` when `hideSystemLogos` (`my_systems_grid.dart:233-235, 1163, 1213`). So a normal card is `1.25 x` its width tall.
- Each row's height is the tallest card in it; a 1x1 card is vertically centred in its row band (`my_systems_grid.dart:1153-1168, 1212-1217`).
- Scroll view: `SingleChildScrollView`, `clipBehavior: Clip.none`, `BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics())`, scrollbars off (`my_systems_grid.dart:1006-1014, 1350-1363`). Scrollbar theme is set but hidden: thumb `onSurface` 0.1, track 0.05, thickness 6, radius `3.r` (`:882-896`).

Worked example at 640x480 (`.r = 1`): grid width 640 - 12 = 628.

| Size | Cols | Card width | Card height (0.80) | Card height (square) |
| --- | --- | --- | --- | --- |
| S | 7 | 84.57 | 105.71 | 84.57 |
| M | 6 | 99.67 | 124.58 | 99.67 |
| L | 5 | 120.8 | 151.0 | 120.8 |
| XL | 4 | 152.5 | 190.63 | 152.5 |

Visible grid viewport = 480 - 46 (top) - 42 (footer) = 392.

#### The Recent card (span)

`config.recentCardSize` is `'default'` or `'2x1'` (`lib/constants/recent_card_sizes.dart:6-12`), set in Settings as "Recent Card Size" with values "Default" / "Compact" (`lib/screens/settings_screen/new_settings_options/systems_settings_content.dart:100-114`, `app_locale_en.dart:78-82`).

`recentCardSpan` (`grid_geometry.dart:17-22`):

| Setting | cols >= threshold | Span (w x h) | Otherwise |
| --- | --- | --- | --- |
| `default` | cols >= 3 | 3 x 2 | 1 x 1 |
| `2x1` | cols >= 2 | 2 x 1 | 1 x 1 |

Packing is first-fit row-major into a virtual grid; the Recent card is index 0 so it takes the top-left block and 1x1 system cards flow around it (`grid_geometry.dart:31-94`). Recent-card pixel size = `spanW*colWidth + (spanW-1)*spX` wide and the sum of its rows' heights plus `(spanH-1)*spY` tall (`my_systems_grid.dart:1197-1211`). Example at 640x480, M, default span: 311.0 x 255.17.

#### System card (no art pack installed)

`SystemCard` (`lib/screens/systems_screen/my_systems_section/system_card.dart`).

Box model, outside in:

1. `Padding(EdgeInsets.all(2.r))` (`:261-262`).
2. `Container`: fill `colorScheme.surface`, radius `radiusExternal` (fallback `14.r`), border `colorScheme.outline` width `1.r`, shadow `colorScheme.shadow.withValues(alpha: 0.1)` blur `4.r` offset `(2.0.r, 2.0.r)` (`:265-284`). The border insets the child by `1.r`.
3. `ClipRRect` radius `radiusInternal` (fallback `9.r`) (`:285-288`).
4. `InkWell` with all overlay colours transparent (`:289-309`).
5. `Padding(top: 4.r, bottom: 0.r, left: 4.r, right: 4.r)` (`:310-316`).
6. System card: `Column[ AspectRatio(1) artwork stack, footer ]` (`:347-361`). With `hideSystemLogos` (and not a single collection): `Column[ Expanded(artwork stack) ]`, no footer (`:243-247, 332-346`).

Artwork with no art pack: `NeoAssetsProvider.getBackgroundForSystemSync` returns null when there is no active theme (`lib/providers/neo_assets_provider.dart:206-212`), so there is no background file and `_buildArtlessBackground` draws (`system_card.dart:459-481, 490-512`):

- `Container(color: colorScheme.surface)` then `Container(color: color1.withValues(alpha: 0.4))` on top (`:492-497`). `color1` is `colors[0]` from the system JSON (see "System data"). `color2` is not used on the card.
- Clipped to `radiusInternal` (fallback `9.r`) (`:465-469`).
- Only collections get a `CoverMosaic` instead (gutter `2.r`) (`:499-511`).

A custom background (set per system in the settings dialog) takes priority: `Image.file` `BoxFit.cover`, `cacheWidth` 512 (grid) or 1024 (carousel); GIFs use `ShaderGifWidget` over `surface` (`:412-481`, `:52, 1052` of carousel). The `music` card switches to `MusicCardShaderBackground` tinted `color1` (fallback `primary`) while music plays (`:374-401`).

Footer (logo strip), system cards only (`:696-719`):

- `Expanded` below the square art, padding `top 1.r, bottom 1.r, left 2.r, right 2.r`.
- `FittedBox(fit: BoxFit.contain)` around the logo requested at `height: 128.r`, so the logo scales to fit the strip.
- Logo asset: `assets/images/logos/<primaryFolderName or folderName or 'all'>.webp` (`:760-767`), `cacheWidth: 256`, `BoxFit.contain` (`:553-562`).
- Tint: `ColorFilter.mode(colorScheme.onSurface, BlendMode.srcIn)` applied via `frameBuilder` (`:545-551, 711`). Logos are white-on-transparent art tinted to `onSurface`.
- A user custom logo (`customLogoPath`) replaces the asset, same tint; on error it falls back to the asset (`:564-575`).
- If the asset fails to load: `SystemLogoFallback` text, already in `onSurface` (`:560-561, 587-594`).

Worked example at 640x480, M: slot 99.67 x 124.58 -> container 95.67 x 120.58 -> inside border 93.67 x 118.58 -> art 85.67 x 85.67 -> footer strip ~28.9 tall (before its 1.r/2.r padding).

`SystemLogoFallback` (`lib/widgets/system_logo_fallback.dart:26-52`): text `(shortName ?? title ?? 'SYSTEM').toUpperCase()`, padding h `4.r`, centred, 1 line, ellipsis, colour param (else white), `fontSize` `16.r` if height < `40.r` else `42.r` (the grid passes `128.r`, so `42.r`, then the FittedBox scales it), `FontWeight.w900`, letterSpacing 1, shadow black blur 5 offset (3,3).

Logo assets missing for these system JSONs, which therefore render the text fallback: `amazon`, `gb-hacks`, `gba-hacks`, `gbc-hacks`, `genesis-hacks`, `gg-hacks`, `gog`, `md-hacks`, `model3`, `nes-hacks`, `sfc-hacks`, `snes-hacks`, `triforce` (checked against `assets/images/logos/`).

Text and badges on a system card: none by default. The count pill `_buildCountPill` is only drawn when `showCount` is true (`system_card.dart:340-341, 355-356`); the systems grid never sets it and the systems carousel passes `showCardCounts` default `false` (`my_systems_carousel.dart:70, 1061`). The count appears in the footer pill instead. For reference, the pill: left/bottom `8.r`, padding h `10.r` v `4.r`, `surface` 0.82, radius `100.r`, border `outline` 0.6 width `1.r`, text uppercased `systemCountLabel`, `10.r` w800 letterSpacing 1.0 `onSurface` (`system_card.dart:728-757`).

#### Recent card (game card)

Built from the most recent game (`lib/models/my_systems.dart:220-254`):

- Background: game `fanarts` image, else `screenshots`, else the foreground image (`:228-248`).
- Foreground ("wheel"): game `wheels` image, else `boxarts` (`:233-249`).
- `folderName = 'recent_<romname>'`, `primaryFolderName = 'recent_games'`, `numOfRoms = 1` (`:238-252`).

Card structure: `Column[ Expanded(Stack[background, main content]), footer ]` (`system_card.dart:317-331`).

- Background as a custom background (`BoxFit.cover`). If the file is missing: artless background (surface + `color1` 0.4; a game card has no `color1`, so plain `surface`) (`:459-481, 490-497`).
- RECENT badge: top `6.r`, right `6.r`, padding h `8.r` v `4.r`, fill `colorScheme.secondary`, radius `radiusInternal` (fallback `9.r`), text `AppLocale.recentBadge` = "RECENT" `onSecondary` `8.r` w900 letterSpacing 1.2 (`:601-623`, `app_locale_en.dart:806`).
- Wheel: centred `Image.file` height `256.r`, `BoxFit.contain`, inset `min(48.r, shortestSide * 0.15)` on all sides; nothing when the wheel file does not exist (`:628-651`).
- Footer: height `32.r`, padding h `8.r`, centred text `AppLocale.timePlayedLabel` "Time Played: {time}" uppercased, `onSurface` `10.r` w800 letterSpacing 1.0, 1 line (`:657-688`, `app_locale_en.dart:839`). `{time}` = `GameUtils.formatPlayTime(fullWords: true)`: hours if >= 1h, else minutes, else seconds; singular/plural `Hour/Hours`, `Minute/Minutes`, `Second/Seconds`; `0 Seconds` at zero (`lib/utils/game_utils.dart:20-54`, `app_locale_en.dart:840-848`). Example: "TIME PLAYED: 3 HOURS".

#### Focus treatment (grid)

There is no scale, no glow, no card-level border change and no dimming of unfocused cards: `SystemCard` does not read `isSelected` for its appearance (it only picks the tap sound) (`system_card.dart:291-301`). All focus styling is one sliding overlay painted above every card (`my_systems_grid.dart:1303-1348, 1360`):

- `AnimatedPositioned`, `duration: 256ms`, `curve: Curves.fastOutSlowIn` (`:1308-1311`).
- Rect: the selected slot inset `1.r` each side (`left + 1.r`, `top + 1.r`, `width - 2.r`, `height - 2.r`) (`:1312-1315`). Since the card itself is inset `2.r`, the focus border overlaps the card's outer edge.
- Border: `primary.withValues(alpha: 0.55)`, width `2.r` (`:1338-1343`).
- Radius: `radiusExternal` (fallback `14.r`) (`:1319-1323`).
- Fill: `LinearGradient` bottomCenter -> topCenter, `primary` 0.28 -> `primary` 0.08 -> transparent, stops 0.0 / 0.35 / 1.0 (`:1324-1337`). This tints the lower third of the focused card.
- Spans the Recent card when it is focused (the rect follows the card's span) (`:1219-1224`).

Scroll follow: centres the selected row, `animateTo` 360ms (180ms while a direction is auto-repeating) `Curves.easeOutQuart` (`lib/screens/systems_screen/my_systems_section/my_systems_grid/gamepad_grid_nav.dart:185-233`). Note the scroll maths uses `itemHeight = itemWidth + 32.r` for non-square cards (`grid_geometry.dart:136-141`), not the `width / 0.80` the layout uses, so centring is approximate.

#### Grid navigation and wrap

`_navigateVirtual` (`gamepad_grid_nav.dart:94-183`):

- Up / Down: step one virtual row, wrapping top <-> bottom (modulo row count); an empty cell resolves to the nearest occupied cell in that row, searching outward left then right (`:118-143`, `grid_geometry.dart:100-113`).
- Left: move to the cell left of the card's leftmost column; from column 0 go to the last occupied cell of the previous row, wrapping first row -> last row (`:144-160`).
- Right: move to the cell right of the card's rightmost column; from the last column go to the first occupied cell of the next row, wrapping last row -> first row (`:161-177`).
- Spanning cards are handled by skipping all cells that belong to the current card (`:146-148, 163-165`).

#### Touch gestures (grid)

- Tap unselected card: select it (60ms throttle); tap selected card: enter it (`my_systems_grid.dart:1227-1247`). Sounds: nav vs enter (`system_card.dart:295-299`).
- Long-press: select, then open the context menu one frame later (`my_systems_grid.dart:841-847, 1262-1264`).
- Android only, pull past top: progress = `-pixels / 75`, spinner `32.r` at top padding `16.r`, stroke 3, determinate until 100% then indeterminate; `AnimatedOpacity` 150ms; releasing at 100% calls `scanSystems()` (`my_systems_grid.dart:800-802, 1016-1080`, `my_systems_grid/pull_to_refresh.dart:46-82`).
- Android only, two-finger pinch: distance change > 35 px steps S -> M -> L -> XL (spread = larger cards), < -35 px steps back; throttle 120ms; clamped at the ends (`pull_to_refresh.dart:17-44, 85-102`). A label pill with the new size shows for 1200ms (`:104-110`): padding h `20.r` v `10.r`, `primary` 0.9, radius `24.r`, text `onPrimary` `18.r` w800 letterSpacing `2.r`, `AnimatedOpacity` 200ms (`my_systems_grid.dart:1081-1118`).

### Carousel view

`MySystemsCarousel` (`lib/screens/systems_screen/my_systems_section/my_systems_carousel.dart`) using `NativeCarousel` (`lib/widgets/native_carousel.dart`).

#### Sizes

- Structure: `Column[ Expanded(carousel), SizedBox(height: 40.r, chip bar) ]` (`my_systems_carousel.dart:955-1227`), inside the `42.r` top inset and above the `42.r` footer.
- Page size: `footerHeight: 60.r` (0 with `hideSystemLogos`) (`:1008`). `pageWidth = maxHeight - footerHeight`, page aspect `pageWidth / maxHeight`; square pages when footerHeight is 0 (`native_carousel.dart:351-362`).
- `viewportFraction = (pageWidth / availableWidth).clamp(0.18, 1.0)` (`native_carousel.dart:364-366`). `padEnds: true`, `clipBehavior: Clip.none` (`:401-405`).
- Card inside each page is the same `SystemCard` (`backgroundCacheWidth: 1024`, `showCount: false`) wrapped in `AspectRatio(pageAspectRatio)` (`my_systems_carousel.dart:1046-1062`, `native_carousel.dart:420-425`). The card's own square art + footer layout applies.
- Worked example at 640x480: carousel height = 480 - 42 - 42 - 40 = 356; page 296 x 356; viewportFraction 0.4625.

#### Depth falloff

Per page: `distance = |index - page| - 0.6`; `scale = (1 - distance * scaleFalloff).clamp(minScale, 1)`; `opacity = (opacityBase - distance * opacityFalloff).clamp(minOpacity, 1)`; `pull = (distance - 0.4).clamp(0,1) * edgePull * pageWidth * sign(page - index)` as an x translation toward centre (`native_carousel.dart:430-458`). Applied as `Opacity(Transform.translate(Transform.scale(alignment: center)))`.

Systems carousel values: `minScale 0.7`, `opacityBase 0.75`, `opacityFalloff 0.55`, `minOpacity 0.3`, `edgePull 0.15`, `scaleFalloff` default `0.4` (`my_systems_carousel.dart:1016-1022`, `native_carousel.dart:16-23`).

| Distance from centre (at rest) | Scale | Opacity | X pull toward centre |
| --- | --- | --- | --- |
| 0 | 1.0 | 1.0 | 0 |
| 1 | 0.84 | 0.53 | 0 |
| 2 | 0.7 (floor) | 0.3 (floor) | 0.15 x pageWidth |
| 3+ | 0.7 | 0.3 | 0.15 x pageWidth (capped) |

The centred card has no border, focus box, or glow; focus is shown only by the depth envelope and the chip bar.

#### Motion and wrap

- D-pad left/right: `animateToPage` 260ms `Curves.easeOutQuart`; the new index is published at the start of the move; pointer input is ignored while it runs (`native_carousel.dart:258-319, 377-380`).
- No wrap: `NativeCarousel.wrap` defaults to false and the systems carousel does not set it, so left at the first card and right at the last do nothing (`native_carousel.dart:128-147, 258-276`).
- Up/down are not bound on the carousel (`my_systems_carousel.dart:292-312`).
- Touch: fling physics that settle on the nearest page with a spring (not capped at one page) (`native_carousel.dart:55-109, 409-410`). Tap an off-centre card to animate to it; tap the centred card to enter (`my_systems_carousel.dart:1026-1036`). Long-press on the centred card opens the context menu (`:1058-1060`).
- Page-change sound: nav sound when the change reason is manual (touch) (`:1090-1093`).
- External index changes use `jumpToPage` (`:266-278`).
- Vertical drag down on the carousel (any platform, the gesture is not platform-gated): content translates down by the drag up to 75, releasing at 100% triggers `scanSystems()`; the spinner overlay (`32.r`, top `16.r`, `AnimatedOpacity` 150ms) is Android only (`:189-192, 959-998, 1229-1258, 1320-1327`).

#### Chip bar (bottom indicator strip)

`my_systems_carousel.dart:1108-1225`.

- Container height `40.r`; horizontal `SingleChildScrollView`, padding v `6.r` h `4.r` (`:1109-1114`).
- Chip label: `(shortName ?? title ?? AppLocale.unknown).toUpperCase()` (`:1203-1208`; "Unknown" at `app_locale_en.dart:843`).
- Chip width: text width measured at `10.r` bold + `24.r` (`:752-764, 944-948`). Chip height declared `32.r`, right margin `4.r` (`:1122-1125, 1194-1197`). The 40.r bar minus 6.r top/bottom padding leaves 28.r, so the declared 32.r is constrained (inference from layout rules, not a source value).
- Background track: every chip `colorScheme.surface`, radius `radiusExternal` (fallback `14.r`) (`:1119-1138`).
- Sliding cursor: `primary` fill, same radius, left/width interpolated from the fractional page every frame so it tracks the swipe (`:1143-1170, 673-687`).
- Text: unselected `onSurface` `10.r` `FontWeight.normal`; selected (`page.round()`) `onPrimary` bold (`:934-942, 1178-1215`).
- Bar scroll: centres the selected chip, `offset = itemOffset - screenWidth/2 + itemWidth/2 + 10.r`; per-frame `jumpTo` while scrolling, `animateTo` 200ms `Curves.easeOutCubic` for discrete jumps (`:701-746`).
- Tap chip: nav sound + `animateToPage(index)` (`:1189-1193`).
- Wrap: no.

#### Dynamic background (carousel)

On selection change the carousel pushes an image to `SystemBackgroundProvider`: custom background, else theme background, else asset `assets/images/systems/grid/<folder>-background.webp` (`my_systems_carousel.dart:807-836`). That asset directory does not exist in the repo (`assets/images/` has no `systems/`), and no widget on the Systems tab consumes `SystemBackgroundProvider` (its only registration is `lib/main.dart:998`; the tab background is a plain `scaffoldBackgroundColor` fill, `lib/screens/app_screen.dart:713-718`). Net visible effect on this tab: none found.

### Footer

`SystemsGridFooter extends CoreFooter` (`lib/widgets/systems_grid_footer.dart:11-81`), used in both modes (`my_systems_grid.dart:135-146, 262-270`).

- Strip: height `kCoreFooterHeight.r` = `42.r`, padding h `12.r`, transparent background (split layout) (`lib/widgets/core_footer.dart:14, 60-71`). No version label (`systems_grid_footer.dart:31-35`).
- Layout: `Row[ Expanded(left pill), Row(controls) ]` (`core_footer.dart:105-117`).

Left: `FooterLabelPill` (`lib/widgets/footer_label_pill.dart:11-94`):

- Label: system card -> `title` (JSON `name`); recent card -> `"${AppLocale.lastPlayed}: ${title}"` = "Last Played: <game>" (`systems_grid_footer.dart:39-43`, `app_locale_en.dart:653`).
- Count chip: `"${numOfRoms} ${Apps|Tracks|Games}"` using `AppLocale.apps` "Apps" for `android`, `AppLocale.tracks` "Tracks" for `music`, else `AppLocale.games` "Games"; hidden for the recent card (`systems_grid_footer.dart:44-50`, `app_locale_en.dart:654-656`). Note this is always the plural noun ("1 Games"); the singular helpers in `lib/utils/count_label.dart` are only used by the card pill.
- Pill: padding top/bottom `4.r`, left `12.r`, right `6.r` with a chip or `12.r` without; fill `tertiaryFixed`; radius `radiusExternal` (fallback `24.r`); shadow `shadow` 0.3 blur `3.r` offset `(2.0.r, 2.0.r)` (`footer_label_pill.dart:27-47`).
- Label text: `onTertiaryFixed` `14.r` bold, ellipsis (`:51-60`).
- Chip: `SizedBox(width: 10.r)` gap; padding h `8.r` v `2.r`; fill `surface`; radius `radiusInternal` (fallback `12.r`); same shadow; text `onSurface` `10.r` w900 letterSpacing `0.5.r` (`:62-87`).

Right: two `GamepadControl` hint pills, `SizedBox(width: 8.r)` between (`systems_grid_footer.dart:55-80`):

| Order | Glyph asset | Label (key -> English) | Colours (bg / text) | Action |
| --- | --- | --- | --- | --- |
| 1 | `assets/images/gamepad/Xbox_Y_button.png` | `hintOptions` -> "Options" | `tertiaryFixed` / `onTertiaryFixed` | open context menu |
| 2 | `assets/images/gamepad/Xbox_A_button.png` | `enter` -> "Enter" (system) or `play` -> "Play" (recent card) | `tertiary` / `onTertiary` | enter system / launch game (plays enter sound) |

(`app_locale_en.dart:616, 657, 28`.)

`GamepadControl` look (`core_footer.dart:121-226`): `InkWell` radius `radiusInternal` (fallback `6.r`), splash `content` 0.2; container padding h `6.r` v `4.r`, fill bg, radius same, border `lightenColor(bg, 0.05)` (HSL lightness +0.05, `lib/utils/color.dart:3-7`) width `1.r`, shadow `shadow` 0.1 blur `4.r` offset `(2.0.r, 2.0.r)`; glyph `18.r` x `18.r` tinted content colour (`srcIn`); `4.r` gap; label `12.r` w600 letterSpacing `0.2.r`; trailing `4.r`. Default bg when none given: `onSurface` 0.1; default text `onPrimary`.

### Button map (Systems tab, grid and carousel)

Dispatch table: `lib/utils/gamepad_nav.dart:1026-1072` (pad), `:1161-1230` (keyboard). Grid bindings `gamepad_grid_nav.dart:13-64`; carousel bindings `my_systems_carousel.dart:292-312`; host callbacks `my_systems_grid.dart:122-146, 229-270`.

| Button | Grid | Carousel | Notes / cite |
| --- | --- | --- | --- |
| D-pad / left stick | move in 4 directions, wraps (see above) | left/right only, no wrap; up/down unbound | stick threshold 0.60 (0.65 on Windows) `gamepad_nav.dart:964-1024` |
| A | enter system / launch recent game | same | enter sound `gamepad_nav.dart:1026-1029` |
| B | unbound (root tab) | unbound | `gamepad_grid_nav.dart:50-52`, `my_systems_carousel.dart:302` |
| X | open view/sort picker (`HeaderSortDropdown`) | same | `gamepad_grid_nav.dart:53-57`, `my_systems_carousel.dart:303-307` |
| Y | open card context menu | same | `onFavorite -> onYPressed`, host passes the menu in both modes (`my_systems_grid.dart:127-131, 241-245`). The doc comments saying "Unbound on the systems screen" (`my_systems_grid.dart:717-720`, `my_systems_carousel.dart:92`) are stale |
| Start | open System Settings dialog directly | same | `onSettings` (`my_systems_grid.dart:252-257`, `my_systems_carousel.dart:589-633`) |
| Select | no screen binding; falls back to the global Select tap (header notification bell) | same | `gamepad_nav.dart:260-268, 303-318` |
| LB / RB | previous / next app tab, wraps across visible tabs | same | `gamepad_grid_nav.dart:60-63`, `lib/screens/app_screen.dart:663-686`. Held: Android auto-repeat paced at 255ms; desktop synthetic repeat after 400ms then every 255ms, max 10s (`gamepad_nav.dart:155-213, 1447-1477`). Tap debounce 50ms |
| LT / RT | unbound (no case in the dispatch switch) | unbound | `gamepad_nav.dart:1054-1071` |
| L3 / R3 | unbound on this screen | unbound | `gamepad_nav.dart:1062-1068` |

Keyboard: arrows or WASD = D-pad, Enter = A, Backspace = B (only when bound, so unhandled here), Y = Y, Escape = Start, Q/E = LB/RB; there is no keyboard key for X (`gamepad_nav.dart:1164-1230`). Keyboard throttle 128ms (`:252, 1145-1159`). Alt+Enter toggles fullscreen (`:1131-1136`).

Timing: directional repeat starts after 300ms, first repeats every 80ms, ramping to 35ms over 14 repeats (`gamepad_nav.dart:224-236`); directional throttle 128ms (`:131`); action debounce 128ms (`:216`); 150ms input grace after a layer activates (`:326`). On Android face buttons fire on press, on desktop on release (`:925-928`).

Sounds: nav sound on moves, X, Y, Start, LB/RB; enter sound on A; back sound on B (`gamepad_nav.dart:1026-1048, 1438`).

### Context menu (Y / long-press on a card)

Built in `MySystems._openSystemContextMenu` (`my_systems_grid.dart:290-348`), drawn by `showAnchoredContextMenu` (`lib/widgets/context_menu/anchored_context_menu.dart:125-168`). Same items for every card, including the Recent card.

Items:

| Row | id | Label (key -> English) | Icon | Extra |
| --- | --- | --- | --- | --- |
| 1 | `settings` | `settings` -> "Settings" | `Symbols.settings_rounded` | opens System Settings dialog (recent card resolves to its game's system) |
| 2 | `view_mode` | `viewMode` -> "View Mode" | `Symbols.grid_view_rounded` | `separatorBefore: true`, submenu |
| 2.1 | `view_grid` | `gridView` -> "Grid View" | `Symbols.grid_view_rounded` | check when current mode is grid |
| 2.2 | `view_carousel` | `carouselView` -> "Carousel View" | `Symbols.view_carousel_rounded` | check when current mode is carousel |

(`my_systems_grid.dart:299-325`, `app_locale_en.dart:40, 646, 659, 661`.) Selecting grid/carousel calls `updateSystemViewMode` (`my_systems_grid.dart:340-347`).

Placement: anchored to the selected card via a sibling `SizedBox` carrying the key (`my_systems_grid.dart:1282-1294`, `my_systems_carousel.dart:1072-1084`); `ContextMenuAlignment.overAnchor` (`my_systems_grid.dart:333`). Width `200.r` default (`anchored_context_menu.dart:531`). `overAnchor` puts the panel's left edge at the card's left edge and its top `6.r` below the card's bottom; flips above if it would overflow; if both fail (tall carousel card) it centres vertically on the card; then clamps to an `8.r` viewport margin. Because a row has a submenu, room for a second panel (`width * 2 + 6.r`) is reserved to the right (`anchored_context_menu.dart:549-612`). Falls back to screen centre when no anchor (`:173-190`).

Panel: padding v `8.r`; fill `surface`; radius `12.r`; border `primary` 0.2 width 1; shadow black 0.5 blur 15 offset (0,5) (`anchored_context_menu.dart:622-638`). Height = `8.r*2 + 30.r per row + 9.r per separator`, capped to viewport minus margins, scrolls if taller with a scrollbar shown only then (`:99-105, 518-525, 542-547, 649-664`).

Rows: height `30.r`, outer padding h `4.r`, inner padding h `8.r`; focused row `primary` 0.15 fill + `primary` 0.3 border width 1, radius `8.r`; icon `14.r` `onSurface` 0.9 + `8.r` gap; label `12.r`, w700 focused / w500 otherwise, `onSurface`; trailing chevron `Symbols.chevron_right_rounded` `14.r` `onSurface` 0.7 for a submenu, or `Symbols.check_rounded` `14.r` `primary` for a selected row (`:674-789`). Separator: `Divider(height: 9.r, thickness: 1, outline 0.15)` (`:678-686`).

Motion: `showGeneralDialog` with `transitionDuration: 120ms`, `FadeTransition`, transparent barrier (`:142-165`); submenu the same (`:479-501`). Reveal scroll `ensureVisible` 120ms `Curves.easeOut` (jump while repeating) (`:365-380`).

Menu buttons: up/down move, single press wraps, held repeat stops at the ends (`:390-406`); right or A on a parent opens the submenu anchored to that row (`:418-428, 468-508`); A on a leaf returns its id; B closes one level; left closes a submenu (inert at root); Y closes the whole stack (`:306-323, 408-416`). Hover selects, tap activates (`:694-703`).

### View/sort picker (X)

`showSystemViewDropdown` (`lib/widgets/header_sort_dropdown.dart:47-109`) with `SortDropdownOverlay(width: 180.r)`. This is the picker the Systems tab uses; `GameViewModeDropdown` (`lib/widgets/game_view_mode_dropdown.dart`) is only mounted by the games list (`lib/screens/game_screen/my_games_list.dart:907`) and is not used on this tab.

Rows (`header_sort_dropdown.dart:385-504`):

| Group header (key -> English) | Row | Label | Icon | Shown |
| --- | --- | --- | --- | --- |
| `viewModeGroup` -> "VIEW MODE" | `view_grid` | "Grid View" | `grid_view_rounded` | always |
| | `view_carousel` | "Carousel View" | `view_carousel_rounded` | always |
| `cardSizeGroup` -> "CARD SIZE" | `card_size` | segmented S / M / L / XL | `crop_free_rounded` | grid mode only (`:402-412`) |
| `sortByGroup` -> "SORT BY" | `sort_alpha` | `alphabetical` -> "Alphabetical" | `sort_by_alpha_rounded` | always on Systems tab |
| | `sort_year` | `releaseYear` -> "Release Year" | `calendar_today_rounded` | |
| | `sort_manufacturer` | `manufacturer` -> "Manufacturer" | `business_rounded` | |
| | `sort_manufacturer_type` | `manufacturerType` -> "Manufacturer / Type" | `category_rounded` | |
| `orderGroup` -> "ORDER" | `order_asc` | `ascending` -> "Ascending" | `arrow_upward_rounded` | |
| | `order_desc` | `descending` -> "Descending" | `arrow_downward_rounded` | |

(`app_locale_en.dart:659-676`.) The card-style row ("CARD STYLE", Fanart/Box) is only offered to the collections browser (`includeCardStyle` default false, `:50, 414-424`).

Panel: `Positioned(top: 42.r, left: 6.r, width: 180.r)`; max height `screenHeight - 42.r - bottomPadding - 16.r`; padding v `8.r`; `surface`; radius `radiusExternal` (fallback `12.r`); border `outline` width `1.r`; shadow `shadow` 0.5 blur `4.r` offset `(2.r, 2.r)`; content clipped at `12.r` (`:818-859`). Opens with `showGeneralDialog` + `FadeTransition`, transparent barrier, default transition duration (`:55-71`). Edge fades via `ShaderMask` dstIn at 5% / 95% when scrollable (`:792-815`).

- Group header: padding h `16.r` v `6.r`, `10.r` letterSpacing `1.r` `onSurface` 0.4; groups separated by `Divider(height: 4.r, thickness: 1, outline)` (`:511-539`).
- Normal row: height `24.r`, margin h `4.r` v `2.r`, focused fill `primary` 0.15 + border `primary` 0.3 width 1, radius `8.r`; inner padding h `12.r`; icon `14.r`; `8.r` gap; label `12.r`; current value in `primary` w700 with trailing `Symbols.check_rounded` `14.r`, otherwise `onSurface` w500 (`:707-780`).
- Segmented card-size row: height `28.r`, margin h `4.r` v `2.r`, padding h `12.r`, same focus fill/border, radius `radiusExternal` (fallback `8.r`); icon `14.r` `onSurface` 0.5; values `spaceEvenly`, each padding h `6.r` v `2.r`, radius `radiusInternal` (fallback `4.r`), selected `primary` fill + `onPrimary` text, else transparent + `onSurface`, text `11.r` w700 (`:541-676`).
- Buttons: up/down move with wrap, `animateTo` 150ms `Curves.easeInOut` (`:242-258, 274-303`); left/right on the card-size row cycle S/M/L/XL with wrap and apply immediately (`:305-349`); A selects and closes (`:357-374`); B closes (`:262`). Hover focuses a normal row, tap activates (`:727-736`).
- Initial focus row index 0 (`:190`).

### System Settings dialog (Start, or context menu > Settings)

`SystemEmulatorSettingsDialog` (`lib/widgets/system_emulator_settings_dialog.dart` plus `system_emulator_settings_dialog/*.dart`). Opened with `showDialog` after a 50ms delay (`my_systems_grid.dart:374-382`). If the system cannot be resolved: notification `systemSettingsNotAvailable` = "System settings not available" (`my_systems_grid.dart:385-392`, `app_locale_en.dart:859`).

Frame (`system_emulator_settings_dialog.dart:1048-1094`): `Dialog` transparent, `insetPadding` `16.r` all sides; container max `640.r` x `480.r`, `surface`, radius `12.r`, border `outline` 0.1, shadow `shadow` 0.5 blur `10.r` offset (0,4). Column: header, tab strip, body, footer.

Header (`system_emulator_settings_dialog/chrome.dart:75-138`): padding h `12.r` v `8.r`; title `systemSettings` "System Settings" `12.r` bold `onSurface`; `1.r` gap; system `realName` `10.r` w500 `onSurface` 0.6; close `Symbols.close_rounded` `18.r` `onSurface` 0.5 in padding `6.r`.

Tab strip (`chrome.dart:140-229`): padding h `12.r`, bottom border `outline` 0.1; `Xbox_LB_bumper.png` height `24.r` `onSurface` 0.5 + `8.r`; tabs separated by `16.r`; Spacer; `Xbox_RB_bumper.png`. Tab: padding v `8.r`, bottom border `2.r` `primary` when selected; label uppercase `10.r`, bold `primary` selected / w500 `onSurface` 0.5 otherwise, letterSpacing `0.5.r`.

Tabs (`system_emulator_settings_dialog.dart:392-401`): "General" (`general`) always; "Emulators" (`emulators`) unless the system is an aggregate (`all`, `favorites`, `collections`, a collection) or `android`; "Appearance" (`appearance`) always; "Hidden" (`hiddenGames`) unless the system is `android` with no hidden games (`app_locale_en.dart:41, 71, 72, 1289`). LB/RB cycle tabs with wrap (`system_emulator_settings_dialog/gamepad_nav.dart:150-171`).

Footer (`chrome.dart:231-266`): padding `10.r`; left `GamepadControl` `Xbox_D-pad_ALL.png` "Navigate" (`navigate`) bg `tertiary` text `onPrimary`; right `Xbox_B_button.png` "Close" (`close`) bg `error` text `onError` (`app_locale_en.dart:4, 7`).

General tab (`system_emulator_settings_dialog/tabs.dart:12-18, 472-620`): ListView padding h `12.r` v `6.r`; toggle rows separated by `4.r`. Row: focused fill `primary` 0.2, radius `radiusInternal` (fallback `9.r`), padding h `12.r` v `6.r`; title `10.r` w600 (`primary` when focused); subtitle `9.r` `onSurface` 0.6; trailing `CustomToggleSwitch`; disabled rows at opacity 0.4. Rows:

| # | Title key -> English | Shown |
| --- | --- | --- |
| 0 | `alwaysShowRomName` -> "Always show ROM file name" | always |
| 1 | `hideExtension` -> "Hide file extension (ROM file name only)" | always |
| 2 | `hideParentheses` -> "Hide parentheses in file name ()" | always |
| 3 | `hideBrackets` -> "Hide brackets in file name []" | always |
| 4 | `recursiveScan` -> "Recursive ROMs Scan" | not `all`/`favorites`/`android`/`collections`/collection |
| 5 | `subfolderView` -> "Show Subfolders" | as above and not `music`; disabled unless recursive scan is on |

(`app_locale_en.dart:104-124`; conditions `system_emulator_settings_dialog.dart:344-358`, `lib/constants/system_folder_names.dart:21-44`.)

`CustomToggleSwitch` (`lib/widgets/custom_toggle_switch.dart:41-81`): `AnimatedToggleSwitch.dual`, indicator `24.r`, height `28.r`, spacing `16.r`, borderWidth `2.r`; track `surface` (off) or `primary` 0.20 blended over `surface` (on); thumb `onSurfaceVariant` (off) / `primary` (on); thumb icon check/close `12.r`; "ON"/"OFF" text `8.r` bold `onSurfaceVariant`.

Appearance tab (`tabs.dart:20-182`): section title `systemImages` "System Images" `12.r` bold; two picker rows ("Background Image" / "System Logo") height `50.r`, padding h `12.r`, focused `primary` 0.1 + border `primary` 0.5, radius `radiusExternal` (fallback `9.r`); 36.r thumb `Colors.black26`; title `12.r` w500; subtitle `10.r` 0.6 or `customImageSet` "✨ Custom image set" in `primary` bold; upload icon button (`primary`) and reset (`error`) `16.r`. Files are copied to `<userData>/media/systems/<folder>_background.<ext>` / `<folder>_logo.<ext>` (`tabs.dart:210-219, 342-350`). Subtitles: "jpg, png, webp, gif | 1024x1024px or less" / "jpg, png, webp | 512x512px or less" (`app_locale_en.dart:247-251`). Android TV uses `TvDirectoryPicker` (`tabs.dart:188-193`).

Emulators tab (`tabs.dart:844-905`, `system_emulator_settings_dialog/row_builders.dart`): list padding h `8.r` v `4.r`, rows margin bottom `6.r`, padding h `8.r` v `4.r`; selected fill `primary` 0.2 (grouped RetroArch) or 0.15 (core/standalone); 24.r icon tile (`assets/images/emulators/retroarch.webp` tinted, or `Symbols.apps_rounded` for standalones); name `12.r` w600; status line `Installed`/`Not installed` (Android) or `Configured`/`Not configured` (desktop) at `10.r`/`11.r`; RetroArch group has a `28.r`-tall core dropdown (success colour when a core is chosen, label "Select Core"); standalone rows have a "Select" / "Selected!" button with the A glyph `12.r`; desktop rows add a folder-picker button selected with D-pad right (`gamepad_nav.dart:136-148`). Group names: "RetroArch", "RetroArch 64", "RetroArch 32", "RetroArch Plus" (`system_emulator_settings_dialog.dart:679-703`). Empty: `gamepad_rounded` `28.r` + "No emulators available for this system" (`tabs.dart:849-872`, `app_locale_en.dart:901`).

Hidden tab (`tabs.dart:625-842`): empty state `visibility_off_rounded` `28.r` + "No hidden games" / "Hide a game from its own settings and it appears here."; rows `10.r`/`9.r` with an "Unhide" pill (`primary` 0.15, border 0.4, radius `4.r`, `9.r` w600); an "Unhide All" row when more than one (`app_locale_en.dart:1284-1291`).

Dialog buttons: up/down move within the tab with wrap; A activates; B closes (or closes an open core menu first); LB/RB switch tabs; left/right only on the Emulators tab on desktop (`system_emulator_settings_dialog/gamepad_nav.dart:11-225`). Row reveal: `ensureVisible` 300ms `Curves.easeInOut`, alignment 0.5 (`system_emulator_settings_dialog.dart:512-553`).

### Android apps grid (Android only)

Reached from the `android` card (`my_systems_grid.dart:536-547`). `AndroidAppsGrid` (`lib/screens/game_screen/android_apps/android_apps_grid.dart`).

- Columns by breakpoint: XS 5, Small 6, Medium 8, Large 10, XL 10 (`lib/responsive.dart:118-124`).
- Header: padding top `12.r`, left/right `16.r`, bottom `4.r`; `Symbols.grid_view_rounded` `16.r` `onSurface` 0.6 at opacity 0.8; `8.r`; "ANDROID APPS" (literal, not localised) `12.r` w900 letterSpacing 2.0 `onSurface` 0.8; right "`<n>` ITEMS" (literal) `9.r` `onSurface` 0.4 w800 letterSpacing 1.0 (`:327-365`).
- Grid: spacing `8.r`, horizontal padding `12.r` (half each side), vertical padding `8.r`, square cells `itemWidth = (width - 8.r*(cols-1) - 12.r) / cols` (`:370-400`).
- Cell (`lib/screens/game_screen/android_apps/android_app_card.dart:64-138`): centred app icon `40.r`; while loading a `16.r` spinner stroke `2.r` `primary` 0.3; missing icon `Symbols.android_rounded` white at 0.5; selected adds a circular glow behind the icon (`50.r` circle, shadow `secondary` 0.3 blur `15.r` spread `2.r`).
- Focus box: `AnimatedPositioned` 300ms (120ms when moving faster than 150ms between presses) `Curves.easeOutQuart`, cell rect grown by `1.r` each side, border `secondary` width `4.r`, radius `16.r` (`:441-461`).
- Scroll: first row -> top, last row -> bottom, else centre; `animateTo` 360ms / 180ms `Curves.easeOutQuart` (`:175-216`).
- Navigation: no wrap. Left/right step by 1 and stop at ends; up stops at the first row; down from the last full row jumps to the last app (`:127-155`).
- Buttons: A launches the app (1500ms cooldown), B goes back; nothing else bound (`:79-87, 223-268`).
- Footer `AndroidAppsFooter` (`lib/widgets/android_apps_footer.dart:9-63`): 42.r split footer; left app name uppercased `14.r` w700 letterSpacing `1.2.r` `onSurface`; right `Xbox_B_button.png` `hintBack` "Back" (`tertiary` / `onTertiary`), `8.r`, `Xbox_A_button.png` `launch` "Launch" with literal `Color(0xFF2ECC71)` background and white text (`app_locale_en.dart:608, 35`).
- Empty: `Symbols.apps_rounded` `48.r` `onSurface` at opacity 0.2 (`:471-482`).

### System data (assets/systems/*.json)

123 JSON files in `assets/systems/`. Parsed by `JsonConfigService` into a flat map (`lib/services/json_config_service.dart:91-121`). Fields this screen uses:

| JSON path | Model field | Used for | Cite |
| --- | --- | --- | --- |
| `system.id` | `folderName` (and `id`) | identity, logo path, routing | `json_config_service.dart:92-93` |
| `system.name` | `realName` | footer label, carousel chip fallback, alphabetical sort, dialog subtitle | `:94` |
| `system.short_name` | `shortName` | carousel chip label, logo text fallback | `:95` |
| `system.colors[0]` | `color1` | card tint (`color1` at 0.4 over surface), music shader tint | `:107-111` |
| `system.colors[1]` | `color2` | secondary display shader only; not drawn on the card | `:112-116`; `my_systems_grid.dart:627-628` |
| `system.details.release_date` | `launchDate` | year sort | `:96` |
| `system.details.manufacturer` | `manufacturer` | manufacturer sorts | `:98` |
| `system.details.type` | `type` | manufacturer/type sort | `:99` |
| (derived) | `iconImage = 'assets/images/systems/<id>-icon.png'` | `primaryFolderName` is derived from it (the part before `-icon.png`) | `:104`; `lib/models/system_model.dart:220-239` |

Hex parsing: 6 digits get `0xFF` alpha; an unparsable value gives null (no tint) (`lib/models/my_systems.dart:205-217`).

Assets the cards use:

- Logos: `assets/images/logos/<id>.webp`, 111 files, white-on-transparent, tinted `onSurface` (`system_card.dart:760-767`). Includes `all.webp`, `favorites.webp`, `collections.webp`, `music.webp`, `android.webp`.
- Gamepad glyphs: `assets/images/gamepad/Xbox_A_button.png`, `Xbox_B_button.png`, `Xbox_X_button.png`, `Xbox_Y_button.png`, `Xbox_LB_bumper.png`, `Xbox_RB_bumper.png`, `Xbox_D-pad_ALL.png` (footers, header, dialog).
- `assets/images/icons/folder-add-bulk.png`, `check-bulk.png`, `warning-bulk.png`, `lightbulb-bulk.png` (empty/setup states); `assets/images/logo_transparent.png` (splash); `assets/images/emulators/retroarch.webp` (dialog).
- No bundled per-system background art: backgrounds only come from an installed art pack or a user custom image.

#### Twelve example systems

Colours are `system.colors` in each file; the line cited is the `"colors": [` line, values on the next two lines.

| System | File | `id` | `name` | `short_name` | `colors[0]` (card tint) | `colors[1]` | Cite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Game Boy Advance | `assets/systems/gba.json` | gba | Game Boy Advance | GBA | `#5e35b1` | `#9ccc65` | `gba.json:26` |
| Super Nintendo | `assets/systems/snes.json` | snes | Super Nintendo Entertainment System | SNES | `#d1d5db` | `#6d28d9` | `snes.json:28` |
| NES | `assets/systems/nes.json` | nes | Nintendo Entertainment System | NES | `#bdbdbd` | `#e53935` | `nes.json:26` |
| Genesis | `assets/systems/genesis.json` | genesis | Sega Genesis | Genesis | `#424242` | `#90A4AE` | `genesis.json:25` |
| Mega Drive | `assets/systems/md.json` | md | Sega Mega Drive | MD | `#263238` | `#CFD8DC` | `md.json:29` |
| Nintendo 64 | `assets/systems/n64.json` | n64 | Nintendo 64 | N64 | `#546e7a` | `#ff8a65` | `n64.json:27` |
| PlayStation | `assets/systems/ps1.json` | ps1 | Sony PlayStation | PS1 | `#bdbdbd` | `#3f51b5` | `ps1.json:28` |
| Game Boy | `assets/systems/gb.json` | gb | Game Boy | GB | `#90A4AE` | `#CFD8DC` | `gb.json:28` |
| Game Boy Color | `assets/systems/gbc.json` | gbc | Game Boy Color | GBC | `#CE93D8` | `#80CBC4` | `gbc.json:26` |
| Arcade | `assets/systems/arc.json` | arc | Arcade | Arcade | `#EF5350` | `#FFB74D` | `arc.json:26` |
| PC Engine | `assets/systems/pce.json` | pce | PC Engine | PCE | `#E0E0E0` | `#FF7043` | `pce.json:27` |
| Nintendo DS | `assets/systems/ds.json` | ds | Nintendo DS | DS | `#B0BEC5` | `#ECEFF1` | `ds.json:26` |
| Game Gear | `assets/systems/gg.json` | gg | Sega Game Gear | GG | `#37474F` | `#78909C` | `gg.json:26` |

Other arcade-family files: `mame.json` (M.A.M.E. / MAME, `#07a0c3` / `#f0f3bd`, :26), `fbneo.json` (FinalBurn Neo / FBNeo, `#263238` / `#ff9100`, :30), `neogeo.json` (Neo Geo, `#263238` / `#ffc107`, :27). Regional variants: `sfc.json` (SFC, `#EEEEEE` / `#1976D2`, :26), `fc.json` (FC, `#D32F2F` / `#F5F5F5`, :28), `tg16.json` (TG-16, `#F44336` / `#212121`, :27).

Virtual systems:

| File | `name` / `short_name` | colors | Cite |
| --- | --- | --- | --- |
| `assets/systems/all.json` | All Systems / All | `#9575cd`, `#B0BEC5` | `all.json:20` |
| `assets/systems/favorites.json` | Favorites / Fav | `#ff006a`, `#B0BEC5` | `favorites.json:20` |
| `assets/systems/collections.json` | Collections / Coll | `#7C4DFF`, `#B0BEC5` | `collections.json:20` |
| `assets/systems/music.json` | Music / Music | `#30d1a1`, `#4db6ac` | `music.json:20` |
| `assets/systems/android.json` | Android / Android | `#C5E1A5`, `#455A64` | `android.json:20` |

### Files in the requested list that are not used by the Systems tab

- `lib/widgets/recent_systems.dart`: a demo `DataTable` card titled "Recent Systems" (hardcoded English, `demoRecentSystems`) (`recent_systems.dart:5-60`). No caller found (zero hits for `RecentSystems()`).
- `lib/screens/systems_screen/system_details_card/system_details.dart`: `SystemDetails` panel; no caller found outside its own file. It references `assets/images/systems/grid/<folder>-detail-background.webp`, which is not in the repo (`system_details.dart:209-214`).
- `lib/widgets/dpad_glyph.dart`: used by the game details tab header (`lib/screens/game_screen/game_details_card/widgets/game_details_tabs_header.dart:75, 133`), not this tab. For reference: default size `22.r`, `Xbox_D-pad_L.png`/`_R.png` tinted `onSurface` over a `surface` 0.5 copy blurred sigma `1.5.r` (`dpad_glyph.dart:25-57`).
- `lib/widgets/letter_indicator.dart`: games list only (`my_games_list.dart:915-916`). `120.r` square, `ChromeSurface.fill`, radius `radiusExternal`, border `outline` `1.r`, letter `72.r` w900, `AnimatedOpacity` 150ms (`letter_indicator.dart:23-63`).
- `lib/widgets/marquee_text.dart`: games list / music only. Scrolls only when the text overflows and `isActive`: blank space `24.r`, velocity 50, pause 3s, accel 1s linear, decel 500ms easeOut (`marquee_text.dart:50-66`).
- `lib/widgets/game_view_mode_dropdown.dart`: games list only (see "View/sort picker").
- `lib/widgets/context_menu/game_context_menu.dart`: games list only (`lib/screens/game_screen/my_games_list/context_menu.dart`).
- `lib/widgets/shimmering_logo.dart`: used via `SplashStatusLayout` in the splash phase (covered above) and the games list loading state.

## System games screens (list, grid, carousel, details card, dialogs)

Source: `misobadev/neostation-frontend` at commit `d9bece5`. All paths below are relative to that repo. Units are source units exactly as written (`12.r` etc., screenutil designSize 640x480; bare numbers are logical px). Colours are theme roles or literal hex. "not found" means the source was searched and has no such thing.

### Route and view switching

| Fact | Value | Cite |
| --- | --- | --- |
| Widget | `SystemGamesList` (pushed route over the app) | `lib/screens/game_screen/my_games_list.dart:71` |
| Root | `PopScope(canPop: _canPop)` -> `Scaffold(backgroundColor: scaffoldBackgroundColor)` -> `Stack` | `lib/screens/game_screen/my_games_list.dart:860-868` |
| Non-OLED ambient layer | `Positioned.fill` Container coloured `scaffoldBackgroundColor` (only `if (!isOled)`) | `lib/screens/game_screen/my_games_list.dart:871-879` |
| Content hidden while launching | the whole content layer is omitted `if (_isGameLaunching)`; only the scaffold colour shows behind the launch dialog | `lib/screens/game_screen/my_games_list.dart:882` |
| View pick | `config.gameViewMode`: `'grid'` -> `GamesGrid`, `'carousel'` -> `GamesCarousel`, anything else -> list; `music` system always list | `lib/screens/game_screen/my_games_list.dart:890-899` |
| Default view mode | `'list'` | `lib/models/config_model.dart:252` |
| Letter overlay | `LetterIndicator` drawn over everything when `_currentLetter != null && !_isGameLaunching` (list view only drives it) | `lib/screens/game_screen/my_games_list.dart:905-906`, `:915-917` |
| View-mode dropdown host | `GameViewModeDropdown()` is always in the stack (renders `SizedBox.shrink`; opens an overlay on demand) | `lib/screens/game_screen/my_games_list.dart:907`, `lib/widgets/game_view_mode_dropdown.dart:76-78` |

#### Loading state

- Centered column: `ShimmeringLogo(width: 200.r)`, gap `24.r`, `AppLocale.loadingGames` ("Loading Games") 20.r w600 `onSurface` letterSpacing 0.5, gap `8.r`, `AppLocale.preparingLibrary` ("Preparing your game library...") 14.r w400 `onSurface.withValues(alpha: 0.7)` letterSpacing 0.3. `lib/screens/game_screen/my_games_list.dart:921-952`

#### Empty state (no games)

`lib/screens/game_screen/my_games_list.dart:963-1321`

- Card: `maxWidth: 600.r`, padding h `24.r` v `16.r`, margin all `32.r`, vertical gradient `primary.withValues(alpha: 0.5)` -> `secondary.withValues(alpha: 0.45)`, radius `16.r`, shadows `shadow@0.3 blur 16.r offset (0,8)` + `shadow@0.1 blur 32.r offset (0,16)`, border `outline@0.15` `1.r` (`:970-1006`).
- Title `AppLocale.noGamesFoundFor` ("No games found for {name}", `{name}` = `shortName ?? realName`) 16.r w600 `onSurface` ls 0.3 (`:1010-1024`).
- Subtitle 11.r w400 `onSurface@0.5` ls 0.2: collection -> `AppLocale.emptyCollection` ("This collection has no games yet"); else `AppLocale.checkRomFiles` ("Check if ROM files are properly placed or are in a supported format.") (`:1026-1040`).
- Recursive-scan row (not for aggregate views, not for `recursiveScanExcluded`, not collections): container margin bottom `12.r`, padding h `12.r` v `8.r`, `Colors.black@0.2`, radius `12.r`, border `Colors.white@0.05`; icon `Symbols.folder_shared_rounded` 16.r `white@0.7`; `AppLocale.recursiveScan` ("Recursive ROMs Scan") white 12.r w500; `AppLocale.recursiveScanSubtitle` ("Scan for ROMs in subdirectories") `white@0.5` 10.r; a Material `Switch` `activeThumbColor: primary` (`:1047-1151`).
- Scan progress box (while scanning): width `320.r`, padding `12.r`, `black@0.2`, radius `12.r`, border `primary@0.2`; status + percent 10.r bold `primary`; `LinearProgressIndicator` minHeight `6.r` radius `4.r`; `AppLocale.scanningSystemOf` ("Scanning system {current} of {total}") 9.r `white@0.6` (`:1154-1249`).
- Back pill: padding t/b `4.r` l `8.r` r `12.r`, `primary@0.9`, radius `8.r`, shadow `primary@0.3 blur 8.r offset (0,2)`; `Xbox_B_button.png` 18.r tinted white; gap `6.r`; `AppLocale.back` ("Back") white 14.r w600. Tap plays back SFX and goes back (`:1256-1316`).

### List view layout

`_buildGamesList` - `lib/screens/game_screen/my_games_list.dart:1403-1461`

```
Stack
  Positioned.fill (only if !music && a game is selected)
    RepaintBoundary > Stack(fit expand)
      fanart AnimatedSwitcher (full screen)
      Container(color: colorScheme.shadow @ 0.2)        <- the only scrim
  Row(crossAxisAlignment: stretch)
    AnimatedContainer(width 200.r, margin l 12.r t 12.r b 12.r)  250ms easeOutCubic
      NeoGlass(cornerRadius: radiusExternalRadius ?? 14.r) > sidebar
    Expanded > details panel (GameDetailsCardList)
```

#### Background (fanart)

| Fact | Value | Cite |
| --- | --- | --- |
| Source | `game.getImagePath(<game's system or list system>, 'fanarts', ...)`; no screenshot fallback in the list view background | `lib/screens/game_screen/my_games_list.dart:1468-1475` |
| Missing file | `SizedBox.shrink()` (scaffold colour shows through) | `:1504-1515` |
| Image | `Image.file(fit: BoxFit.cover, width/height infinity, cacheWidth: 1920)` | `:1506-1513` |
| Switch | `AnimatedSwitcher(duration: 512ms, switchInCurve: Curves.easeOutExpo, switchOutCurve: Curves.easeInCubic)`; previous + current stacked (`StackFit.expand`) | `:1477-1487` |
| Transition | `FadeTransition(opacity)` wrapping `ScaleTransition(Tween 1.0 -> 1.1, CurvedAnimation(curve: Curves.easeOut))` - the incoming image scales from 1.0 up to 1.1 as it fades in, i.e. it rests at 1.1 | `:1488-1498` |
| Key | `'list_fanart_${romPath ?? romname}_v$artworkVersion'` | `:1500-1502` |
| Scrim | one flat `colorScheme.shadow.withValues(alpha: 0.2)` over the fanart. No gradient scrim found; no blur on the fanart itself | `:1420-1424` |
| Aggregate views | fanart path uses the game's own `systemFolderName` | `:1468-1469` |

#### Glass sidebar (NeoGlass)

- Width `200.r`; margin left `12.r`, top `12.r`, bottom `12.r`; wrapped in `AnimatedContainer(duration: 250ms, curve: Curves.easeOutCubic)` (no animated property actually changes in this build). `lib/screens/game_screen/my_games_list.dart:1439-1443`
- Corner radius: `CornerRadii.radiusExternalRadius` (theme token) fallback `14.r`. `:1447-1451`
- NeoGlass (`lib/widgets/neo_glass.dart`):
  - Tint `scaffoldBackgroundColor.withValues(alpha: (60 - transparency) / 60)` (`:101`, `:105-109`). Default transparency `10` -> alpha 0.8333 (`lib/models/config_model.dart:297`).
  - Backdrop blur sigma = `config.neoglassBlur`; default `0` = no blur at all (`lib/models/config_model.dart:296`, `lib/widgets/neo_glass.dart:118-126`).
  - Rim: stroke width `config.neoglassBorderWidth` default `2` (`lib/models/config_model.dart:298`), painted OUTSIDE the box (rect inflated by half the stroke, radius + half stroke), `BlendMode.overlay`, linear gradient topLeft -> bottomRight, colours `white@0.96`, `white@0.64`, `white@0.16` at stops 0.0/0.60/1.0 (`lib/widgets/neo_glass.dart:152-156`, `:173-197`).
  - Clipped with `ClipRRect(borderRadius: circular(cornerRadius))` (`:136-139`).
- Corner radius tokens (`lib/themes/corner_radii.dart:27-54`): zero 0/0, xs 3/2, s 8/5, m 14/10, l 16/12, xl 24/20 (external/internal, each `.r`). Most shipped themes use `m` (e.g. `lib/themes/light_theme.dart:58`); retro/abyss `s`, nord `xs`, dracula `xl`, cyberpunk `zero`.

#### Sidebar contents (`GameListView`)

`lib/screens/game_screen/game_list_view.dart`

Column: header, `Expanded(Stack[highlight, ListView])`, `SizedBox(height: 11.r)` bottom slack (`:313-589`, `_bottomSlack = 11.0` `:96`).

Header (`:692-719`):
- margin l `8.r` r `8.r` t `8.r` b `4.r`, then logo, then `SizedBox(height: 4.r)`.
- Logo: `assets/images/logos/<primaryFolderName>.webp` (or custom logo file), `height: 38.r`, `cacheWidth: 256`, `BoxFit.contain`, tinted `ColorFilter.mode(onSurface, BlendMode.srcIn)` (`:722-776`). Fallback `SystemLogoFallback(title, shortName, height 38.r)`.
- In aggregate views ("all"/favourites/collection) the header shows the selected game's own system logo (`:695-707`).

Rows (`:375-580`):
| Fact | Value | Cite |
| --- | --- | --- |
| Row height | `_itemHeightBase = 26.0` -> `26.r` | `:92`, `:309` |
| ListView padding | vertical `2.r`, horizontal `8.r` | `:378-381` |
| Row inner padding | horizontal `8.r`, vertical `2.r`, `Alignment.centerLeft` | `:421-425` |
| Favourite marker | leading `Symbols.favorite_rounded` 11.r, margin right `4.r`; colour `onPrimary` when selected else `Colors.redAccent`; only `if (game.isFavorite == true)` | `:428-438` |
| Title | `MarqueeText(GameUtils.formatGameName(name.isNotEmpty ? name : romname), isActive: isSelected)` | `:459-466` |
| Title style | 11.r, `FontWeight.bold` if selected else `FontWeight.normal`, colour `onPrimary` if selected else `onSurface`, family `textTheme.bodyMedium.fontFamily`; style change animates `AnimatedDefaultTextStyle(200ms, Curves.easeOut)` | `:441-458` |
| Trailing marks, in order | 1) cloud-sync `NeoSyncStatusIcon(size: 11, showBackground: false, showGlyphShadow: false, mutedColor: onPrimary, margin left 4.r)` on the SELECTED row only, and only when `config.showCloudSyncIcon` and a sync provider is active; 2) `CollectionBadge.inline` (bookmark 11.r) `onPrimary` selected / `primary` unselected, left pad `4.r`, suppressed inside a collection's own view; 3) `AchievementsBadge.inline` (trophy `Symbols.emoji_events_rounded` 11.r) `onPrimary` selected / `onSurface` unselected, only when `config.showAchievementsBadge` and the game is RA-matched with >0 achievements | `:496-555`, `lib/widgets/collection_badge.dart:40-45`, `lib/widgets/achievements_badge.dart:43-62` |
| Defaults | `showCloudSyncIcon = true`, `showAchievementsBadge = false` | `lib/models/config_model.dart:291-292` |
| Folder row (subfolder view) | leading `Symbols.folder_rounded` 12.r fill 1, colour `secondary` (unselected) / `onPrimary` (selected), margin right `4.r`; name 11.r, bold selected / w500 unselected, ellipsis; gap `4.r`; trailing game count 9.r `fg@0.7` | `:619-689` |

Highlight bar (`:321-369`):
- A separate layer under the rows: `Positioned(top: selection*26.r + 2.r - scrollOffset, left: 8.r, right: 8.r, height: 26.r)`.
- Fill `colorScheme.primary`, radius `CornerRadii.radiusInternal` fallback `14.r`, shadow `shadow@0.1 blur 4.r offset (2.r, 2.r)`.
- Motion: an `AnimationController` tweening the fractional index. On each selection change: duration `360ms` normally, `180ms` while `isNavigatingFast`, curve `Curves.easeOutQuart` (`:200-213`). The tween is rewound to 0 in the build and `forward()` is started one frame later so it shares a clock with the scroll (`:227-232`). Initial controller duration 120ms is overwritten on first move (`:150-153`).

Scrolling - centred (`lib/utils/centered_scroll_controller.dart`):
- `CenteredScrollController(centerPosition: 0.5)` (`lib/screens/game_screen/game_list_view.dart:148`), item extent `26.r`, top padding `2.r` (`:311`).
- Target offset = `2.r + index*26.r + 13.r - viewportHeight*0.5`, clamped to `[0, maxScrollExtent]` - so the selected row sits at the vertical middle except near the ends (`lib/utils/centered_scroll_controller.dart:217-224`).
- On every selection change the scroll `animateTo` uses the same duration and curve as the highlight (360 / 180ms, `Curves.easeOutQuart`) (`lib/screens/game_screen/game_list_view.dart:234-239`). Mid-list, bar and rows move together so the bar appears still while the list slides under it.
- Initial centring: jump (no animation) 100ms after the first frame (`lib/utils/centered_scroll_controller.dart:93-99`). Controller defaults if no duration given: 360ms `Curves.easeInOut` (`:47-48`).

Marquee on the selected row (`lib/widgets/marquee_text.dart`):
- Only when the text overflows AND the row is active; otherwise single-line ellipsis (`:35`, `:50-76`).
- `blankSpace: 24.r`, `velocity: 50.0` px/s, `pauseAfterRound: 3s`, `accelerationDuration: 1s` `Curves.linear`, `decelerationDuration: 500ms` `Curves.easeOut` (`:56-65`). Box height = text height + `fontSize*0.2` descender guard (`:43-45`).

Touch: tap unselected row = select (nav SFX); tap selected row = confirm/launch (enter SFX); long-press = context menu (`lib/screens/game_screen/game_list_view.dart:399-416`).

#### Title cleaning

- `GameUtils.formatGameName` is a no-op (returns the name unchanged) (`lib/utils/game_utils.dart:7-10`).
- The real cleaning happens when the list is loaded (`lib/services/game/game_list_service.dart`):
  - If the game has a ScreenScraper real name: that name, whitespace collapsed, space before an extension removed; `showRomFileNameSubtitle = true` (`:100-105`, `:68-73`).
  - Else if a non-filename name exists (realName/titleName): used as is (`:106-108`).
  - Else the filename, with (per-system settings, all default ON) the extension stripped if it is one of the system's extensions, every `(...)` removed (region tags), every `[...]` removed (dump flags), whitespace collapsed (`:36-66`, regexes `:25-27`, defaults `hide_extension`/`hide_parentheses`/`hide_brackets` `?? 1` at `:163-165`).
  - `prefer_file_name` setting forces the cleaned filename path and no subtitle (`:89-99`, `:162`).
- Sort order: `ORDER BY ur.is_favorite DESC, LOWER(game_display_name) ASC` - favourites first, then case-insensitive name (`lib/data/datasources/sqlite_service.dart:4506`). Marking a favourite while browsing does NOT move the row; unmarking re-seats it (`lib/screens/game_screen/my_games_list/favorites_reorder.dart:69-90`).

#### Letter indicator (list view)

`lib/widgets/letter_indicator.dart`
- Centered `120.r x 120.r` box, fill `ChromeSurface.fill` = `surface.withValues(alpha: 0.75)` (`lib/themes/chrome_surface.dart:55`, `:71-74`), radius `radiusExternal` fallback `14.r`, border `outline` `1.r`, shadow `shadow@0.5 blur 3.r offset (2.r, 2.r)` (`:28-49`).
- Letter 72.r `FontWeight.w900` `onSurface` (`:51-57`).
- `AnimatedOpacity(duration: 150ms)` (no curve given = linear) visible only while a held-direction letter jump is running (`:23-25`, `lib/screens/game_screen/my_games_list.dart:916`).
- Letter = first char upper-cased after dropping a leading "THE ", `A-Z0-9` else `#` (`lib/utils/letter_jump.dart:27-34`). Folder rows show no letter (`lib/screens/game_screen/my_games_list.dart:660`).
- Timing: fast-nav threshold 150ms between moves (`lib/screens/game_screen/my_games_list.dart:306`); burst end 300ms normal / 600ms letter jump (`:311-312`); letter cleared 200ms after the burst ends (`:685-689`).

### List view button map

Registered in `lib/screens/game_screen/my_games_list/gamepad_nav.dart:68-98`. In this table a bare `gamepad_nav.dart` means that file, and a bare `game_details_card_list.dart` means `lib/screens/game_screen/game_details_card/game_details_card_list.dart`; the shared input engine is always cited as `lib/utils/gamepad_nav.dart`.

| Button | Action | Cite |
| --- | --- | --- |
| D-pad up / down | previous / next game, wraps at both ends (`(i-1+n)%n`, `(i+1)%n`). If a details panel is active (entered with A), moves inside that panel instead | `gamepad_nav.dart:101-126` |
| Held up / down | repeat after 300ms, 80ms interval ramping linearly to 35ms over 14 repeats (`accelerateRepeats: true`); after 1200ms held, switches to letter jumps every 360ms. Jump forward = first item of next letter group; back = start of current group, then previous group. At alphabet end falls back to a normal (wrapping) step | `gamepad_nav.dart:74-75`, `:132-151`; `lib/utils/gamepad_nav.dart:225-247`, `:1340-1386`; `lib/utils/letter_jump.dart:47-70` |
| D-pad left / right | previous / next details-card tab, wraps; never auto-repeats (handler returns false); if a panel is active, goes to the panel | `gamepad_nav.dart:18-23`, `:155-173`; `lib/screens/game_screen/game_details_card/game_details_card_list.dart:1252-1268` |
| A | if the current tab is Game info or Achievements and has something to drive: enter the panel (or, in achievements, run the focused header chip); otherwise launch the game (folder row: descend) | `gamepad_nav.dart:30-33`; `game_details_card_list.dart:1305-1325` |
| B | leave the active panel if one holds the D-pad; else back (in subfolder view ascends one folder level first) | `gamepad_nav.dart:37-40`; `lib/screens/game_screen/my_games_list.dart:700-705` |
| X | open the view-mode dropdown (music system: toggle shuffle) | `gamepad_nav.dart:51-65` |
| Y | open the game context menu (music: toggle favourite) | `gamepad_nav.dart:78`; `lib/screens/game_screen/my_games_list/context_menu.dart:33-40` |
| Start | game settings dialog (not for folder rows) | `gamepad_nav.dart:81`; `lib/screens/game_screen/my_games_list.dart:588-607` |
| Select (tap, fires on release) | toggle video sound (mute) on every tab | `gamepad_nav.dart:44-47`, `:82`; `game_details_card_list.dart:588-594` |
| Select + A | scrape the selected game (details card path) | `gamepad_nav.dart:83`; `game_details_card_list.dart:449`, `:1009-1025` |
| Select + Y | random game dialog | `gamepad_nav.dart:84` |
| LB / RB (and Q/E keys) | unbound on this screen, silent | `gamepad_nav.dart:13-14`, `:86-87`; `lib/utils/gamepad_nav.dart:1425-1438` |
| LT / RT | not bound (L3 is the stick click, not LT) | `lib/utils/gamepad_nav.dart:1058-1064` |
| L3 / R3 | none (`onRightStickClick: null`, no L3 handler) | `gamepad_nav.dart:85` |

Every move plays the nav SFX; A plays enter, B plays back, X/Y/Start play nav (`lib/utils/gamepad_nav.dart:1027-1049`).

Keyboard (same dispatcher): arrows or WASD = D-pad, Enter = A, Backspace = B, Y = Y, Escape = Start, Q/E = bumpers (`lib/utils/gamepad_nav.dart:1164-1228`). Keyboard throttle 128ms (`:252`).

### Details card (right panel)

`GameDetailsCardList` - `lib/screens/game_screen/game_details_card/game_details_card_list.dart`

In this section, bare `game_details_card_list.dart`, `widgets/...`, `tabs/...` and `detail_tab.dart` citations are relative to `lib/screens/game_screen/game_details_card/`; a bare `:N` refers to the file named in the nearest heading or lead-in line.

Frame: `Card(color: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: circular(0.r)), shadowColor: transparent)` with Flutter's default Card margin (4 logical px, not set in source) (`:849-852`). Children in a `Stack(fit: expand)`, in paint order:

1. Tab header (top) - `:859-869`
2. Footer (bottom) - `:872-887`
3. Tab panels, all in one horizontally sliding strip, wrapped in a translucent horizontal-drag `GestureDetector` - `:896-989`
4. `ScrapingProgressPanel` while a scrape runs - `:994-1002`

If no game is selected the panel instead shows: 64.r box `ChromeSurface.fill`, radius `radiusExternal`/14.r, border `outline` 1.r, shadow `shadow@0.5 blur 3.r offset (2.r,2.r)`, icon `Symbols.videogame_asset_rounded` 32.r `white@0.5`; gap 16.r; `AppLocale.selectAGame` ("Select a Game") 18.r w500 `white@0.7` ls 0.5; gap 8.r; `AppLocale.chooseGameFromList` ("Choose a game from the list to view details") 14.r w400 `white@0.5` ls 0.3 (`lib/screens/game_screen/my_games_list.dart:1712-1772`).

Folder row selected: centered mosaic of up to 4 covers (1 = full, else 2x2 `GridView`, spacing `4.r`, tile radius `8.r`) sized `min(width*0.82, height*0.68)` clamped `[200, max(460, 460.r)]`, else `Symbols.folder_rounded` at `side*0.8` in the system colour; gap 16.r; folder name 18.r w600 `white@0.8`; gap 8.r; count 14.r `white@0.5` (`lib/screens/game_screen/my_games_list.dart:1567-1710`).

#### Tabs

Order (enum order, also the D-pad walk order): `wheel, box2d, screenshotVideo, gameInfo, achievements` (`lib/screens/game_screen/game_details_card/detail_tab.dart:5`).

| Tab | Icon | Available when | Cite |
| --- | --- | --- | --- |
| wheel (logo) | `Symbols.branding_watermark_rounded` | always | `widgets/game_details_tabs_header.dart:161` |
| box2d (box art) | `Symbols.filter_frames_rounded` | always | `:162` |
| screenshotVideo | `Symbols.image_rounded` | hidden when a secondary screen is active and `hideBottomScreen` is false | `:163`; `game_details_card_list.dart:295-299`, `:1229` |
| gameInfo | `Symbols.info_rounded` | always | `:164` |
| achievements | `Symbols.emoji_events_rounded` | only if the (effective) system has a non-empty, non-"0" `raId` | `:165`; `game_details_card_list.dart:330-333`, `:1230` |

So 4 or 5 tabs normally (3-5 in edge cases). Unavailable tabs are absent, not disabled (`widgets/game_details_tabs_header.dart:19-21`, `:47-52`).

- Switched with D-pad left/right, wrapping at both ends (`game_details_card_list.dart:1252-1268`). Bumpers are not used (see button map). Touch: tap an icon, or swipe horizontally across the panels.
- Remembered: the chosen tab is persisted (`config.gameDetailsTab`, default `'wheel'`) and restored without animation when a card is built; falls back to wheel if unavailable (`game_details_card_list.dart:352-365`, `:1239-1249`; `lib/models/config_model.dart:272`).

Tab strip (`lib/screens/game_screen/game_details_card/widgets/game_details_tabs_header.dart:65-137`):
- Positioned `left 0, right 0, top 0` in the card; container height `46.r`, padding top `4.r` right `8.r`; row: `Spacer`, left D-pad glyph, `6.r`, pill, `6.r`, right D-pad glyph -> right-aligned at the card's top-right.
- D-pad glyphs: `assets/images/gamepad/Xbox_D-pad_L.png` / `Xbox_D-pad_R.png`, `22.r` square, tinted `onSurface`, over a blurred copy tinted `surface@0.5` with blur sigma `1.5.r` (`lib/widgets/dpad_glyph.dart:25-56`). No LB/RB glyphs on this strip (the LB/RB `BumperGlyph` widget exists but is not used here).
- Pill: `NeoGlass(cornerRadius: radiusExternalRadius ?? 12.r)`, height `36.r`, inner padding horizontal `8.r`, width = `numTabs * 36.r` (`tabWidth = 36.r`) (`:55-56`, `:79-91`).
- Cursor: `AnimatedPositioned(duration: 160ms, curve: Curves.easeInOut, left: visualIndex*36.r, top 4.r, bottom 4.r, width 36.r)`, fill `primary`, radius `radiusInternal` fallback `14.r` (`:95-111`).
- Tab item: `36.r x 36.r`, icon `18.r`, colour `onPrimary` selected else `onSurface`; icons are drawn filled (app-wide `fill: 1.0`, per comment `:155-158`). Tap = nav SFX + switch; ink splash `onSurface@0.1` (`:188-213`).

Panel slide (`game_details_card_list.dart`):
- Two panels move as one strip via `FractionalTranslation` (fraction of card width) inside a `ClipRect` (`:1074-1104`).
- D-pad / tap step: `_stepDuration = 240ms`, `_stepCurve = Curves.easeInOutCubic`; incoming panel starts one width to the side it came from (`:263-264`, `:1372-1382`).
- Released swipe settle: `_settleDuration = 220ms`, `_settleCurve = Curves.easeOutCubic` (`:269-270`).
- Swipe commits if |velocity| > 400 px/s in the right direction, or if dragged past 25% of the width (`:1199-1203`).
- Forced changes (restoring the stored tab, closing overlays) cut with no slide (`:1357-1385`, `:1412-1416`).
- The media tab stays mounted (hidden via `Visibility(maintainState...)`) so video does not restart (`:929-950`).

Panel geometry: all panels except wheel sit at `left 12.r, right 12.r, top 55.r, bottom <panelBottomOffset>.r`, where `panelBottomOffset = 26 + 6 + 40 + 11 + 13 = 96` (clock line + gap + row + bottom padding + panel gap) (`widgets/game_details_footer.dart:720-721`, `:595`, `:681`, `:695`, `:698`, `:701`). The wheel tab uses its own box: `left 10.r, right 10.r, top 44.r, bottom 88.r` (`tabs/game_details_general_tab.dart:43-47`).

#### Tab 1 - wheel (logo)

`lib/screens/game_screen/game_details_card/tabs/game_details_general_tab.dart`
- Wheel image from `wheels` folder, `BoxFit.contain`, `height 140.r`, `width 280.r`, `cacheWidth 640`, centered (`:36-40`, `:122-133`).
- Drop shadow: the same image tinted `colorScheme.shadow@0.5`, offset `Offset(6.r, 6.r)`, `FilterQuality.low`, `cacheWidth 256`, drawn under it (`:52-79`).
- Both swap via `AnimatedSwitcher(320ms, switchInCurve: Curves.easeOutQuint, switchOutCurve: Curves.easeInQuint)` with a plain `FadeTransition` (`:56-62`, `:115-121`).
- No wheel: empty (`SizedBox.shrink`). Android app on Android only: app icon `60.r` (shadow tinted `shadow@0.7`) (`:80-106`, `:134-152`).

#### Tab 2 - box2d (box art)

`lib/screens/game_screen/game_details_card/tabs/game_details_box2d_tab.dart`
- Box `left 12.r right 12.r top 55.r bottom bottomOffset.r`, centered (`:179-184`).
- Art aspect-fit via `AspectRatio(measured ratio)`, `BoxFit.contain`, `cacheWidth 640`; placeholder ratio `3/4` until measured (ratios cached per path+version) (`:45`, `:206-217`).
- Clip + radius `radiusInternal` fallback `14.r`, shadow `shadow@0.3 blur 3.r offset (3.r, 3.r)` (`:185-205`).
- Missing art: `Icons.inventory_2_outlined` 48.r `Colors.white24` (`:218-224`).

#### Tab 3 - screenshot / video

`lib/screens/game_screen/game_details_card/tabs/game_details_screenshot_video_tab.dart`
- Padding `fromLTRB(12.r, 55.r, 12.r, bottomOffset.r)`, centered; same radius/shadow as box art (`:128-151`).
- Aspect: video's own ratio once playing, else measured screenshot ratio, else `16/9` (`:116-126`).
- Content: `VideoPlayer` if the video is initialized and the 3s delay is over; else screenshot `BoxFit.cover`, `cacheHeight 640`; else `Symbols.videogame_asset_rounded` 48.r `white24` (`:157-185`).
- Mute pill (only while video shows): bottom-right `8.r`/`8.r`, `Colors.black54`, radius `radiusExternal`; padding h `8.r` v `4.r`; `Xbox_View_button.png` 14.r white, gap `4.r`, `Symbols.volume_off_rounded`/`volume_up_rounded` 12.r white. Tap toggles sound (`:187-248`).
- Video timing: entering this tab sets `showGameInfo = true`, volume 0, starts a 3s delay, then `play()` (`game_details_card_list.dart:1392-1395`, `:615-633`). The list separately waits `_videoDelay = 1500ms` after selection before initialising the controller (only while `showGameInfo`), looping, starting at volume 0 (`lib/screens/game_screen/my_games_list.dart:282-284`; `my_games_list/secondary_display.dart:389-409`, `:476-495`). Volume = 0 if `!config.videoSound` or a secondary screen is active, else 1.0 (`game_details_card_list.dart:806-822`). `videoSound` default `false` (`lib/models/config_model.dart:261`).

#### Tab 4 - game info

`lib/screens/game_screen/game_details_card/tabs/game_details_game_info_tab.dart`

Panel: `left 12.r right 12.r top 55.r bottom bottomOffset.r` (`:233-237`); `AnimatedContainer(PanelGateHighlight.duration = 160ms, Curves.easeOut)`, fill `ChromeSurface.fill` (surface@0.75), radius `radiusExternal`/14.r, border 2.r (`PanelGateHighlight`), shadow `shadow@0.25 blur 2.r offset (2.r,2.r)` (`:248-273`).

Panel gate edge (`widgets/panel_gate_highlight.dart:25-64`): width always `2.r`; resting colour `outline`; drivable (description longer than its pane) `secondary@0.5`; active `secondary` plus glow `secondary@0.35 blur 8.r`.

Layout (top to bottom):
- Header, padding `fromLTRB(8.r, 8.r, 8.r, 0)`: `Symbols.info_rounded` 13.r `onSurface`, gap `8.r`, then the facts strip in a `16.r`-tall `ScrollingStatusLine` (`:277-315`, `:494`). Divider `onSurface@0.1` height `10.r` (`:316-321`). No title text.
- Facts, in order, each only if non-empty (`:507-528`): developer `Symbols.business_rounded`; publisher `Symbols.storefront_rounded`; players `Symbols.people_rounded`; year (first 4-digit run of the date, else raw) `Symbols.calendar_today_rounded`; genre `Symbols.category_rounded`. There is no rating in this tab.
- Fact pill (`_InfoPill`, `:582-625`): horizontal padding `4.r`; icon 10.r; gap 4.r; text 9.r; colour `onSurface@0.6`.
- Facts strip marquee (`widgets/scrolling_status_line.dart:67-76`, `:104-137` of that file): 34 px/s via 50ms ticks, waits 900ms before starting, holds 1400ms at each end, then reverses (ping-pong). Only scrolls when it overflows.
- Body: `Expanded`, padding `8.r`; description `SingleChildScrollView(BouncingScrollPhysics)`, text 11.r `onSurface@0.8` line height 1.6; extra padding `12.r` all sides when there is no per-language map, else horizontal `12.r` (`:326-340`, `:536-579`). Description language = app language (`ja` -> `jp`, `zh`/`zh_Hant` -> `zh`) falling back to English; HTML entities and `<br>` cleaned (`:59-63`, `:212-218`; `lib/utils/game_utils.dart:57-69`).
- Identity footer, padding `fromLTRB(8.r, 0, 8.r, 8.r)`: divider `onSurface@0.1` h `10.r`; `Symbols.label_rounded` + display name (alpha 0.85); gap `2.r`; `Symbols.description_rounded` + ROM filename (alpha 0.6); each line `15.r` tall, text 10.r, marquee when long (`:350-418`).
- Empty state (description empty or equals `AppLocale.noDescription` "No description available."): `FittedBox(scaleDown)` column: `AppLocale.incompleteMetadata` ("Incomplete Metadata") 20.r bold `onSurface`; gap 12.r; `AppLocale.scrapeToDownload` ("This game doesn't have metadata yet. Scrape it to download its description, genre, boxart, and videos.") 12.r `onSurface@0.7` height 1.5 width `300.r`; gap 32.r; then either `AppLocale.scrapingUnavailableAndroid` ("Scraping unavailable for Android apps.") 10.r grey for `android-apps`, or `AppLocale.loginToScrape` ("Log in to ScreenScraper via Settings to enable downloading.") 10.r italic `colorScheme.error` when not logged in (`:224-227`, `:430-490`). Header facts are hidden in this state.
- Controls: A enters (only if the text overflows); up/down scroll `56.r` per press via `animateTo(140ms, Curves.easeOut)`; left/right swallowed (no-op); B exits; A while inside stays consumed (no launch). Tap on the panel = enter (`:78`, `:121-171`, `:241-247`; `game_details_card_list.dart:1315-1321`). New game resets to the top and exits the panel (`:184-191`).

#### Tab 5 - achievements (RetroAchievements)

`lib/screens/game_screen/game_details_card/tabs/game_details_achievements_tab.dart`

Panel box: `left 12.r right 12.r top 55.r bottom bottomOffset.r` (defaults `:65-68`, card passes `bottomOffset` `game_details_card_list.dart:975`). Fill `ChromeSurface.fill`, radius `radiusExternal`. Content horizontal inset `_contentInsetH = 12.0` -> `12.r` (`:24`).

States:
1. Loading (no info yet, loading): same shell with an invisible 2.r border and shadow `black@0.25 blur 2.r offset (2.r,2.r)`; header row trophy 13.r `Colors.orange`, gap 8.r, and if the offline snapshot knows a total: `"– / N  ·  –%"` 11.r w600 `onSurface@0.75`; a hidden REFRESH chip reserves height; an indeterminate `LinearProgressIndicator` `1.r` tall in a `10.r` band (`onSurface@0.1` track, `onSurface@0.35` bar) where the divider will be; body = empty left pane (flex 4) + 12.r gap + skeleton grid (flex 6): 6 columns, spacing `4.r`, square tiles `onSurface@0.06` radius `radiusInternal`, count = snapshot total or 24, capped 36; hash line at the foot (`:376-526`, `:910-945`).
2. None found: `Symbols.videogame_asset_off_rounded` 48.r `onSurface`; gap 16.r; `AppLocale.noAchievementsFound` ("No achievements found for this game.") 14.r; gap 12.r; FIX MATCH chip (`AppLocale.raFixMatch` "Fix match", upper-cased) `primary`/`onPrimary`; hash line at the foot (`:529-607`).
3. Loaded (`:611-801`):
   - Header, padding `fromLTRB(12.r, 8.r, 12.r, 0)`: trophy 13.r orange; gap 8.r; `"$unlocked / $total  ·  $percentage%"` 11.r w600 `onSurface@0.75` (percentage rounded to 0 dp); `Spacer`; chips REFRESH (`AppLocale.refresh` "Refresh", only when info exists) and FIX MATCH, 6.r apart, bg `surfaceContainerHighest`, fg `onSurface`; divider `onSurface@0.1` h `10.r`.
   - Chip (`widgets/header_action_button.dart:29-64`): padding h `6.r` v `3.r`, radius `radiusInternal`, border 2.r transparent; label 8.r bold; focused = bg and border `secondary`, text `onSecondary`.
   - Body row: left pane (flex 4) selected achievement: title 10.r bold (`Colors.orange` if unlocked else `onSurface`), gap 6.r, description 9.r `onSurface@0.8` height 1.4, gap 8.r, points chip (`"<points> pts"`, `AppLocale.points` = "pts") padding h 6.r v 2.r `secondary` radius `radiusInternal` white 9.r, plus `AppLocale.unlocked` ("Unlocked!") 10.r bold `Colors.greenAccent` when earned; all centered at the top (`:816-900`). Gap 12.r. Right pane (flex 6) badge grid: 6 columns, spacing 4.r, square; badge `https://media.retroachievements.org/Badge/<badgeName>.png` (or `_lock.png` if locked), `cacheWidth 64`, `BoxFit.cover`, radius `radiusInternal`; border: selected `secondary` (alpha 1.0 when the grid owns the D-pad, 0.35 otherwise) width `2.r`; unlocked `orange@0.5` 1.r; else transparent 1.r (`:947-1019`).
   - Sort: unlocked first, then `displayOrder` (`:198-212`).
   - Panel edge: drivable (has achievements) `secondary@0.5`, active `secondary` + glow, resting transparent (`:642-658`).
- Hash line (all states): padding `fromLTRB(12.r, 4.r, 12.r, 8.r)`; `Symbols.tag_rounded` 12.r; `"<AppLocale.raHash>:"` ("RA hash:") 11.r; value monospace 11.r, scaled down to fit, en dash when unhashed; colour `onSurface@0.5` (`:319-369`).
- Controls (only after A): up/down move 6 badges (no wrap; up from the top row goes to the header chips); left/right move 1 badge wrapping `(i±1)%count`; in the header, left/right move between chips clamped (no wrap), down returns to the grid; A on a chip runs it; B exits. Focused badge scrolls into view with `Scrollable.ensureVisible(200ms, Curves.easeOut, alignment 0.5)` (`:107-151`, `:184-190`, `:215-306`). Tap a badge = enter + select. Refresh/fix-match no longer have a Select binding (`game_details_card_list.dart:588-594`).
- Loading chrome appears only if a lookup stays outstanding 250ms (unless the offline snapshot already reports achievements) (`game_details_card_list.dart:210`, `:709-728`).

#### Scraping progress overlay

`lib/screens/game_screen/game_details_card/widgets/scraping_progress_panel.dart`
- `left 12.r right 12.r top 55.r bottom 110.r`; `surface@0.9`; radius `radiusExternal`; border `outline` 1.r; shadow `shadow@0.25 blur 2.r offset (2.r,2.r)` (`:30-49`).
- Centre: circle `padding 16.r` `primary@0.1` with `CircularProgressIndicator(strokeWidth: 3)` 24.r `primary`; gap 24.r; `AppLocale.scrapingGameData` ("Scraping Game Data...") 18.r bold `onSurface`; gap 12.r; 250.r wide `LinearProgressIndicator` (track `Colors.white10`, bar `primary`, radius 4.r); gap 8.r; status text 10.r `onSurface@0.6` (`:50-102`).
- Result toasts: `AppLocale.scrapeSuccessful` ("Scraping successful!"), `AppLocale.scrapeErrorGame` ("Error scraping game."); not logged in: hardcoded "Please log in to ScreenScraper in the Scraping tab first." (`game_details_card_list.dart:1444-1451`, `:1527-1548`).

#### Footer (PLAY row)

`lib/screens/game_screen/game_details_card/widgets/game_details_footer.dart`

Positioned `bottom -0.5.r, left -0.5.r, right -0.5.r`; padding left `12.r` right `12.r` bottom `11.r` (`:121-132`, `_bottomPadding = 11` `:698`). Two lines:

Line 1 - height `26.r` (`_clockLine = 26`, `:681`), always reserved:
- Left: ROM filename (only when `showRomFileNameSubtitle`, i.e. scraped games) white 15.r w600 height 1.15, shadow `Shadow(blurRadius: 1.r, color: black, offset: (2,2))`; ping-pongs via `ScrollingStatusLine` when too long (`:941-1016`, `:913-915`).
- Right (only if play time > 0): gap `10.r`, `Symbols.schedule_rounded` 17.r white `fill: 0` with the same shadow, gap `5.r`, `HH:MM:SS` in white 15.r w700 height 1.15 with shadow, drawn in fixed-width digit cells (`MonospacedClock`) (`:155-158`, `:1030-1073`; `lib/widgets/monospaced_clock.dart:26-32`).

Gap `6.r` (`_clockRowGap`, `:695`).

Line 2 - height `40.r` (`_bottomRow = 40`, `:595`), `ExcludeFocus` (touch only), items separated by `5.r` (`_rowGap`, `:602`), left to right:
| Item | Look | Tap | Cite |
| --- | --- | --- | --- |
| Rating (only if `rating > 0`) | NeoGlass chip radius `40.r` (fully round), width `64.r`, padding l `4.r` r `6.r`; `Symbols.star_rounded` 16.r fill 1; gap 3.r; whole number 16.r w800 `onSurface` height 1.15. Value = `ceil(clamp(rating/2, 0, 10))`; star colour `lerp(errorColor, successColor, (value-1)/9)` | go to game-info tab | `:176-179`, `:809-906`, `:631` |
| Achievements pill (`Expanded`, left-aligned) | NeoGlass radius `40.r`, width `min(available, 132.r)`, hidden if available < `64.r`; padding h `6.r` v `4.r`; RA game icon `30.r` square (`(40-10).r`) radius `radiusInternal` on `surface`, fallback trophy 16.r; gap 6.r; text 11.r bold ls 0.5 upper-cased; gap 4.r; bar `minHeight 6.r` radius 4.r, right pad 6.r, track `onSurface@0.1`, colour `Colors.orange` when progress is known else `onSurface` | go to achievements tab | `:180-198`, `:385-551`, `:651`, `:662`, `:707` |
| Random | NeoGlass circle `40.r`, `Symbols.casino_rounded` 21.r `onSurface` | random dialog | `:201-209`, `:730-777` |
| Favourite | same, `Symbols.favorite_rounded`; when favourite: `fill 1` and `AppThemes.getCustomColors(context).errorColor`, else `fill 0` `onSurface` | toggle favourite | `:210-217`, `:764-771` |
| Settings | same, `Symbols.settings_rounded` | game settings dialog | `:219-222` |
| PLAY | width `88.r`, height `40.r`, fill `#2ECC71`, border `#36F184` 1.r, radius `radiusExternal`/14.r (theme corner, not round), shadow `shadow@0.1 blur 4.r offset (2.r,2.r)`; right padding 8.r; `Xbox_A_button.png` 28.r tinted `onPrimary`; gap 6.r; `AppLocale.playButton` ("PLAY") 13.r w900 ls 1.0 height 1.0 `onPrimary`, scaled down to fit | launch (enter SFX) | `:244-327` |

Achievements pill text (`:412-418`): total > 0 -> `"<earned>/<total>"` or `"–/<total>"` while earned is unknown; total 0 -> "Loading..." (`AppLocale.loading`) while loading, else "No Achievements" (`AppLocale.noAchievements`) if RA answered zero, else "Unknown" (`AppLocale.raCoverageUnknown`). The pill is omitted entirely unless the system has RA, the user is connected, and (loading or total > 0) (`:364-382`).

There is no "last played" stat on the details card (only accumulated play time). Not found.

Music system replaces the footer with `MusicPlayer` (`:79-86`) - out of scope here.

### Grid view

`lib/screens/game_screen/my_games_grid.dart` (`GamesGrid`). No full-screen fanart background: the grid sits on the route's `scaffoldBackgroundColor`.

Columns by card size (`config.gameGridColumns`, default `'M'`, `lib/models/config_model.dart:282`):
| Size | Columns | Cite |
| --- | --- | --- |
| S | 7 | `my_games_grid.dart:591-593` |
| M | 6 | `:594-596` |
| L | 5 | `:597-599` |
| XL | 4 | `:600-602` |
| other | 6 (5 if config unreadable) | `:603-608` |

Layout (`:474-540`, `:1233-1264`):
- Scroll padding: top `12`, bottom `80`, left `16`, right `16` (plain logical px, no `.r`).
- Spacing `spX = spY = 6.0.r`.
- Card width = `(availableWidth - 32 - (cols-1)*6.r) / cols`.
- Card height: box style = width x box art's h/w (from the DB `box2dAspectRatio`, else read from the PNG/JPEG header, else 1:1); fanart style = square (ratio 1.0); folder tiles square. Row height = tallest card; shorter cards are vertically centred in the row (`:390-418`, `:516-524`).
- Rows render via `SliverVariedExtentList` with exact extents `rowHeight + 6.r`.

Card, box style (`:1397-1502`):
- Container radius `12.r`, `Clip.antiAlias`, shadow `black@0.25 blur 2.r offset (2.r,2.r)`; image `BoxFit.contain` decoded at a width bucketed to 64 px steps of `cardWidth*1.5`; fades in `AnimatedOpacity(200ms, Curves.easeIn)` when loaded async (`:1440-1458`, `:1129-1134`, `:1883-1894`).
- Missing art placeholder: `surface`, radius `6.r`, `Icons.videogame_asset_rounded` 32.r `onSurface@0.4`, gap 4.r, name 7.r `onSurface@0.5` max 2 lines, h padding 4.r (`:1902-1945`).
- Favourite: top-right `6.r/6.r` circle `22.r` `black@0.45` with heart 12.r `Colors.redAccent` (`:1459-1476`).
- Collection badge: circle 22.r under the heart (`top 32.r` if favourite else `6.r`), bookmark `size*0.56` fill 1 `primary` on `black@0.45` (`:1477-1484`; `lib/widgets/collection_badge.dart:47-63`).
- Achievements badge (if `showAchievementsBadge`): top-left `6.r`, pill `black@0.6` radius 9.r padding h 5.r v 2.r, trophy 12.r white, gap 3.r, count 9.r w700 white (`:1485-1490`; `lib/widgets/achievements_badge.dart:65-92`).
- Scrape progress strip (bottom): height 20.r `black@0.7`, bottom radius 12.r, padding h 8.r; `Symbols.search_rounded` 10.r white70; bar (white24 track, primary); percent 9.r w600 white70 (`:1504-1538`).

Card, fanart style (`:1540-1683`): radius 12.r; background fanart, else screenshot, else fallback (`surfaceContainerHighest`, same icon/name as the placeholder), `BoxFit.cover`, `cacheWidth 388`; scrim gradient top -> bottom `transparent, black@0.5, black@0.85` at stops `0.5, 0.75, 1.0`; wheel logo `Positioned(left 10.r, right 10.r, bottom 5.r)` with padding h 6.r v 4.r, `BoxFit.contain`; same favourite / collection / achievements / scrape overlays.

Folder tile (`:1685-1772`): radius 12.r, `surfaceContainerHighest`; edge-to-edge mosaic of up to 4 covers (1 full; 2 columns; 3-4 in two rows, no gutter) or `Symbols.folder_rounded` 40.r fill 1 in the system colour.

Focus: a `4.r` border in `colorScheme.secondary`, radius `12.r`, drawn inside the selected cell (no animation - it jumps with the selection) (`:1136`, `:1182-1204`). No scale or glow.

Scrolling: selected card centred vertically. Normal move `animateTo(500ms, Curves.easeOutQuart)`; during fast nav (moves < 150ms apart) `jumpTo` (`:1040-1059`, `:154`). After a layout change (size/style) recentre `animateTo(350ms, Curves.easeOutCubic)` (`:791-802`).

Card-size toast (pinch only): centered pill padding h 20.r v 10.r `primary@0.9` radius 24.r, label 18.r w800 ls 2.r `onPrimary`; `AnimatedOpacity(200ms)`; hides after 1200ms. Pinch threshold 35 px, 120ms cooldown; spreading = bigger size (`:641-647`, `:649-677`, `:1266-1300`).

Footer: `GameViewFooter` flush at the bottom (see below). Its content follows a "settled" selection: updated immediately on a slow move, 160ms after a fast burst (`:165`, `:893-906`). RA lookup debounced 280ms (`:152`).

Grid button map (`:735-755`):
| Button | Action |
| --- | --- |
| D-pad up/down | move one row (`±cols`); up from the top row wraps to the same column in the last row; down past the end wraps to the same column in the first row (`:834-855`) |
| D-pad left/right | move one card, wrapping within the row (left at column 0 -> last card of the row; right at end of row -> first card of the row) (`:857-880`) |
| Held D-pad | repeat 300ms then every 80ms (no acceleration, no letter jump in the grid) (`lib/utils/gamepad_nav.dart:225-228`, `:1368`) |
| A | play/launch (folder: descend) (`:741`; `lib/screens/game_screen/my_games_list/launch_flow.dart:141-144`) |
| B | back (`:742`) |
| X | view-mode dropdown (`:744-748`) |
| Y | context menu (`:743`) |
| Start | game settings (`:753`) |
| Select tap | toggle video sound (`:750`, `:760-763`) |
| Select + A | scrape (`:751`) |
| Select + Y | random game (`:752`) |
| L3 (left stick click) | random game (`:749`) |
| LB/RB, LT/RT | unbound |

Touch: tap = select, tap selected = play, long-press = context menu (`:1416-1436`, `:1369-1385`).

### Carousel view

`lib/screens/game_screen/my_games_carousel.dart` (`GamesCarousel`) + `lib/widgets/native_carousel.dart`.

Layout (`:1381-1544`): Column of (1) `Expanded` carousel with horizontal padding `60.r`, (2) letter bar `SizedBox(height: 30.r)`, (3) `GameViewFooter`. No full-screen background is drawn by this screen; it pushes fanart/screenshot/logo into `SystemBackgroundProvider` (`:711-756`), but no widget that renders that provider was found on the games route (the Scaffold background is opaque `scaffoldBackgroundColor`).

Pages (`lib/widgets/native_carousel.dart:345-468`):
- Square pages: page width = available height; `viewportFraction = pageWidth / availableWidth` clamped `0.18..1.0`; `padEnds: true`, `clipBehavior: Clip.none`.
- Depth envelope per card with `distance = |index - page| - 0.6`: `scale = clamp(1 - distance*0.4, 0.25, 1.0)`, `opacity = clamp(0.6 - distance*1.0, 0.1, 1.0)`, `edgePull = 0` (defaults `:16-23`, maths `:430-446`). So the centred card is at scale 1.0 opacity 1.0; neighbours (distance 0.4) at scale 0.84 opacity 0.2; further ones scale 0.44 / opacity 0.1 floor.
- Step: `animateToPage(260ms, Curves.easeOutQuart)`; input is ignored during the slide; wrap past either end is a `jumpToPage` (no animation) because `wrap: true` for games (`:299-319`, `:274-284`; `my_games_carousel.dart:1400`).
- Fling: momentum carries across many cards then snaps to the nearest (`native_carousel.dart:55-109`).

Fanart card (`my_games_carousel.dart:849-957`): margin `5.r`, radius `24.r`, shadow `black@0.5 blur 8.r offset (2.r,2.r)`; fanart else screenshot else fallback (`surfaceContainerHighest`, `Symbols.videogame_asset_rounded` 64.r `onSurface@0.3`, gap 12.r, name 14.r w600 `onSurface@0.6` max 3 lines, h padding 16.r); `BoxFit.cover`, `cacheWidth 1024`; gradient top -> bottom `transparent, transparent, black@0.6, black@0.9` at `0.0, 0.4, 0.7, 1.0`; wheel logo at the bottom with padding `fromLTRB(48.r, 4.r, 48.r, 8.r)`, `BoxFit.contain`, `FilterQuality.medium`, `cacheWidth 512`; favourite circle `32.r` at top-right `8.r` with heart 18.r redAccent; collection badge 32.r below it (`top 44.r` if favourite); achievements badge top-left `8.r`; scrape strip height 24.r, bottom radius 24.r, icon 14.r, percent 11.r.

Box card (`:1192-1338`, style `'box'`): aspect-fit inside the page using the box art's w/h (DB value or header read, default 1.0), margin `5.r`, radius `8.r`, `surfaceContainerHighest` behind, `BoxFit.cover`; shadow `black@0.6 blur 12.r` when centred, `black@0.3 blur 6.r` otherwise, offset `(2.r,2.r)`; same overlays. No box art -> the fallback card.

Folder card (`:995-1139`): same frame (margin 5.r, radius 24.r, shadow); body `surfaceContainerHighest`; mosaic inset `14.r` with 8.r gutters and 10.r tile radius, or `Symbols.folder_rounded` 96.r in system colour; bottom bar `black@0.55` padding h 14.r v 10.r: folder icon 18.r, gap 8.r, name white 14.r w700, gap 8.r, count 12.r w600 `white@0.7`.

Focus treatment: only the depth envelope (scale/opacity) plus the stronger shadow on box cards. No border or cursor.

Letter bar (`:1466-1533`):
- Height `30.r`, horizontal scroll, padding h `4.r`.
- Groups: `★` for the leading favourites run, then the first letter of each run of names (non-letters as-is upper-cased; empty -> `#`) (`lib/utils/letter_bar.dart:39-66`; `my_games_carousel.dart:249`).
- Chip: width = text width + `20.r`, height 30.r, margin right `6.r`, fill `primary@0.1`, radius `12.r`; text 11.r normal `onSurface`; selected text w800 `onPrimary` (`:788-799`, `:1369-1377`, `:1509-1526`).
- Highlight: `AnimatedPositioned(120ms, Curves.easeInOut)` block in `secondary`, radius `12.r`, under the chips (`:1475-1495`).
- Bar auto-scrolls to centre the current letter `animateTo(200ms, Curves.easeOutCubic)` (`:758-786`). No chip highlighted while a folder is centred.
- Tap a chip = animate to that letter's first game.

Carousel button map (`:398-438`):
| Button | Action |
| --- | --- |
| D-pad left/right | previous/next card (wraps); held: repeat 300ms/80ms, after 1200ms letter jumps every 360ms (`letterJumpAxis: horizontal`, `jumpToPage`) (`:400-407`, `:420-421`, `:453-470`) |
| D-pad up/down | unbound |
| A | play (folder: descend) (`:408-412`) |
| B | back |
| X | view-mode dropdown |
| Y | context menu |
| Start | game settings |
| Select tap | toggle video sound |
| Select + A | scrape |
| Select + Y | random |
| L3 | random |
| LB/RB | deliberately unbound (`:427-437`) |

Touch: tap off-centre card = centre it; tap centred = play; long-press centred = context menu (`:1429-1455`, `:495-498`).

### Grid/carousel footer (`GameViewFooter`)

`lib/widgets/game_view_footer.dart`. Sits on the plain scaffold surface, so it uses theme colours with no text shadows (`:78-85`).

- Padding h `12.r` v `8.r`; row (`:87-89`).
- Left (`Expanded`): title `MarqueeText` always active, 18.r bold `onSurface`; subtitle ROM filename (only for scraped games, line always reserved via strut) 12.r w400 `onSurface@0.72` (`:93-127`).
- Gap `12.r`, then the right group (`ExcludeFocus`), each followed by 6.r (8.r after the sync icon):
  1. Cloud-sync icon `NeoSyncStatusIcon(size: 16.0)` (not for folders, only when `showCloudSyncIcon`) (`:149-164`).
  2. Mute pill (only when a video exists and no secondary screen): `Xbox_View_button.png` 15.r + volume icon 15.r `onSurface` (`:165-168`, `:588-642`).
  3. Rating pill (rating > 0): star 15.r lerp(error, success), gap 4.r, number 13.r w900, width reserved for "10" (`:169-172`, `:364-417`).
  4. RA pill: width `101.r`, height `32.r`, padding h 8.r v 3.r; icon 22.r; text 8.r bold upper (width 56.r); bar 46.r wide, minHeight `3.5.r`; tap opens `GameAchievementsDialog` (`:180-194`, `:420-583`).
  5. Play-time pill (if played): `Symbols.schedule_rounded` 15.r + `HH:MM:SS` 12.r w800 tabular (`:198-201`, `:320-362`).
  6. PLAY button: height `32.r`, padding l 8.r r 10.r, `#2ECC71` (focused `#36F184`, 200ms `AnimatedContainer`), border `#36F184` 1.r, radius `radiusExternal`; `Xbox_A_button.png` 20.r `onPrimary`; gap 5.r; "PLAY" or, for a folder, `AppLocale.enter` upper-cased ("ENTER"), 11.r w900 ls 1.5 `onPrimary` (`:211-284`).
- Shared pill decoration: `ChromeSurface.fill` (surface@0.75), radius `radiusExternal`, border `outline` 1.r, shadow `shadow@0.1 blur 4.r offset (2.r,2.r)`; all pills 32.r tall, padding h 8.r v 4.r (`:300-315`).

### Game context menu (Y)

`lib/screens/game_screen/my_games_list/context_menu.dart`, `lib/widgets/context_menu/game_context_menu.dart`, `lib/widgets/context_menu/anchored_context_menu.dart`.

Not opened for folder rows; music system uses Y = favourite instead (`context_menu.dart:33-40`).

Items (`game_context_menu.dart:94-147`):
| # | Row | Icon | Notes |
| --- | --- | --- | --- |
| 1 | `AppLocale.gameSettings` "Game Settings" | `Symbols.settings_rounded` | initial cursor; opens the settings dialog |
| 2 | `AppLocale.hintScrape` "Scrape" | `Symbols.cloud_download_rounded` | only if the game's system id is known |
| 3 | `AppLocale.addTo` "Add to…" | `Symbols.playlist_add_rounded` | submenu (chevron) |
| 4 | `AppLocale.viewMode` "View Mode" | `Symbols.grid_view_rounded` | separator above; opens the view-mode dropdown |
| 5 | `AppLocale.randomGame` "Random Game" | `Symbols.casino_rounded` | random dialog |

"Add to…" submenu: `AppLocale.favorite` "Favorite" (`Symbols.favorite_rounded`) then one row per collection (`Symbols.bookmark_rounded`), each a checkbox (`Symbols.check_box_rounded` `primary` when ticked, `Symbols.check_box_outline_blank_rounded` `onSurface@0.45` when not); separator; `AppLocale.newCollection` "New collection…" (`Symbols.add_rounded`) which creates `"Collection {number}"` and toasts `"Added to {name}"` (`context_menu.dart:66-104`, `:196-228`; `anchored_context_menu.dart:758-773`). Toggling keeps the menu open.

Panel (`anchored_context_menu.dart`):
- `showGeneralDialog`, transparent barrier, `transitionDuration: 120ms`, `FadeTransition` (`:142-165`).
- Width `200.r`; padding v `8.r`; `surface`; radius `12.r`; border `primary@0.2` 1px; shadow `black@0.5 blur 15 offset (0,5)` (`:531`, `:620-638`).
- Row height `30.r`; separator (Divider) `9.r` tall, `outline@0.15`; row padding h `4.r`, inner padding h `8.r`; focused row fill `primary@0.15` + border `primary@0.3` 1px, radius `8.r`; icon 14.r `onSurface@0.9`, gap 8.r; label 12.r, w700 focused / w500 otherwise, `onSurface`; chevron 14.r `onSurface@0.7` (`:101-105`, `:674-789`).
- Placement for games: `overAnchor` - left edge aligned to the selected row/card, top = anchor bottom + `6.r`; flips above if it would overflow; margin `8.r` from screen edges; reserves room for the submenu to the right (`game_context_menu.dart:156`; `anchored_context_menu.dart:549-612`). Submenu opens beside its row.
- Keys: up/down move (single press wraps; held stops at the ends; repeat 35ms scrolls jump instead of animate); right or A opens a submenu; left closes a submenu (inert at the root); A activates; B closes one level; Y closes the whole stack (`:306-323`, `:390-406`). Reveal scroll `ensureVisible(120ms, Curves.easeOut)` (`:365-379`).

### View-mode dropdown (X)

`lib/widgets/game_view_mode_dropdown.dart`
- `showGeneralDialog`, transparent barrier, default transition, `FadeTransition` (`:41-55`).
- Panel fixed at `top 12.r, left 6.r`, width `170.r` (the computed anchor offset is ignored) (`:340-348`, `:51`); padding v `8.r`, `surface`, radius `12.r`, border `primary@0.2` 1px, shadow `black@0.5 blur 15 offset (0,5)` (`:351-369`).
- Group headers 10.r w800 ls `1.r` `onSurface@0.5`, padding h 16.r v 6.r: `AppLocale.viewModeGroup` "VIEW MODE", `AppLocale.cardSizeGroup` "CARD SIZE" (grid only), `AppLocale.cardStyleGroup` "CARD STYLE" (grid and carousel) (`:285-331`, `:408-423`). Dividers `4.r` `outline@0.1` between groups.
- Options: `AppLocale.listView` "List View" (`Symbols.list_rounded`), `AppLocale.gridView` "Grid View" (`Symbols.grid_view_rounded`), `AppLocale.carouselView` "Carousel View" (`Symbols.view_carousel_rounded`); row height `24.r`, margin h 4.r v 2.r, padding h 12.r; icon 14.r; label 12.r; current mode in `secondary` w700 with a trailing `Symbols.check_rounded` 14.r; focused fill `primary@0.15` border `primary@0.3` radius 8.r (`:550-633`).
- Card size row (`Symbols.crop_free_rounded`, 28.r tall): segmented `S M L XL`; card style row (`Symbols.style_rounded`): `AppLocale.fanartCard` "Fanart" / `AppLocale.boxCard` "Box"; selected segment `secondary` bg, `onSecondary` text, radius 4.r, 11.r w700 (`:427-547`).
- Keys: up/down wrap; left/right cycle size/style (applied live, wraps); A selects and closes; B closes (`:141-162`, `:201-273`). Scroll `animateTo(150ms, Curves.easeInOut)` (`:193-197`).

### Launch flow and launch dialog

A in list/grid/carousel calls `_selectCurrentGame` - there is no confirmation; it launches straight away behind a status dialog (`lib/screens/game_screen/my_games_list/launch_flow.dart:137-383`). Folder rows descend instead (`:141-144`).

Sequence: content layer hidden (`_isGameLaunching = true`), input deactivated, image caches and the game list freed, then `launchGameWithDialog` shows `GameLaunchDialog` (`barrierDismissible: true`), waits at least 2s (and up to 8s for a cloud-save pull), then starts the emulator (`lib/utils/game_launch_utils.dart:47-84`).

`GameLaunchDialog` (`lib/widgets/game_launch_dialog.dart:244-328`):
- `Dialog(transparent)`; box width `320.r`, padding `16.r`, fill `scaffoldBackgroundColor`, radius `16.r`, shadow `black@0.25 blur 2.r offset (2.r,2.r)`.
- Wheel image `height 100.r`, radius `7.w`, `BoxFit.contain`, `cacheWidth 400`; fallback system logo asset (padding 12.r) then `Symbols.videogame_asset_rounded` 40.r `surface@0.5`.
- Gap 4.r; status 24.r w600 `onSurface` ls `0.5.r`: `AppLocale.launchingGame` "Launching Game..." -> `AppLocale.gameExecuting` "Game executing..." -> `AppLocale.closingGame` "Closing Game..." (`:52`, `:121-136`).
- Gap 4.r; game name (or romname) 16.r w400 `onSurface` ls `0.3.r`, centred, max 2 lines.
- Keys: A, B, Enter, Space, Z, X, Escape, Backspace all call `userDismiss` (`:61-64`, `:230-241`). Closes itself 1s after the game ends (`:195-208`).

Failure dialogs (`launch_flow.dart:242-379`, `:395-512`): `AlertDialog` `Colors.grey[900]`, radius 16.r, border red@0.5 (or orange@0.5) 2.r; title icon 32.r + `AppLocale.launchGameFailed` "Failed to Launch Game" / `AppLocale.launchError` "Launch Error" 20.r white; body `AppLocale.unableToLaunch` "Unable to launch \"{name}\"" / `AppLocale.unexpectedLaunchError` "An unexpected error occurred while trying to launch \"{name}\""; error box; `AppLocale.technicalDetails` "Technical Details:"; `AppLocale.tryAgainGameConfig` "Please try again or check the game configuration."; OK button (`AppLocale.ok` "OK") `red[700]`/`orange[700]`, padding h 24.r v 12.r. Escape/Backspace/Enter close.

### Random game dialog

`lib/screens/game_screen/game_details_card/random_game_dialog.dart`. Opened from Select+Y, L3 (grid/carousel), the footer dice, or the context menu. `barrierDismissible: false` (`lib/screens/game_screen/my_games_list/launch_flow.dart:535-538`).

- `Dialog(transparent)`, `insetPadding h 40.r v 30.r`; box `maxWidth 320.r`, `maxHeight 180.r`, `surface`, radius `10.r`, border 1.r `primary@0.35` while spinning / `secondary@0.4` when settled; shadows `(primary|secondary)@0.12 blur 18.r spread 1.r` + `black@0.3 blur 8.r offset (0, 3.r)` (`:222-255`).
- Fade in `180ms Curves.easeOut` (`:69-77`).
- Header, padding h 10.r v 5.r, fill `(primary|secondary)@0.08`, bottom border 1.r `@0.12`: icon 13.r `Symbols.casino_rounded` (spinning) / `Symbols.stars_rounded` (settled); gap 5.r; `AppLocale.randomGame` "Random Game" / `AppLocale.selected` "Selected!" 11.r w700 `onSurface@0.85` ls 0.5; spacer; when settled a RANDOM chip (padding h 8.r v 6.r, `surface`, radius 6.r, shadow `black@0.25 blur 2.r offset (2.r,2.r)`, `Xbox_X_button.png` 14.r + `AppLocale.random` "RANDOM" 10.r bold ls 0.8, both `tertiary`); gap 6.r; BACK chip (same shape, `error` fill, `Xbox_B_button.png` 14.r + `AppLocale.back` upper "BACK" 10.r bold `onError`) (`:272-419`).
- Body: background screenshot (else fanart) `BoxFit.cover`, masked left -> right `white, white@0.15, white@0.35, transparent` at `0.0, 0.45, 0.75, 1.0` (`BlendMode.dstIn`), swapped with `AnimatedSwitcher(60ms)` (`:422-476`). Right-aligned info column `width 180.r`, padding 8.r: wheel `height 36.r` (else `Symbols.videogame_asset_rounded` 28.r), gap 6.r, name (`AnimatedSwitcher(55ms)`) 11.r while spinning / 13.r settled, w700, max 2 lines; gap 3.r; system badge padding h 6.r v 2.r `primary` radius 4.r text 8.r w600 `onPrimary@0.8`; gap 10.r; spinner (16.r, stroke `1.5.r`, `primary@0.5`) or the PLAY button (`:489-653`).
- PLAY button: padding h 20.r v 8.r, gradient `#2ECC71` -> `#1E8449` (topLeft -> bottomRight), radius 7.r, shadow `black@0.25 blur 2.r offset (2.r,2.r)`; `Xbox_A_button.png` 14.r white; gap 6.r; "PLAY" 11.r w900 ls 1.5 white with shadow `black@0.3 offset (0,1) blur 2`. Reveal: scale `0.88 -> 1.0` `Curves.easeOutBack` + fade `Curves.easeOut`, 320ms (`:79-88`, `:571-640`).
- Spin: 18 ticks every 80ms (random picks, then the last 4 ticks step toward the target one index at a time); nav SFX every 2nd tick; enter SFX on land (`:57-59`, `:140-193`).
- Keys: A (settled) = play; X (settled) = re-roll; B = close (`:95-115`). On play the list selects the game, scrolls to it, and launches 1s later (`launch_flow.dart:546-564`).
- Empty list: box width 260.r, padding 16.r, `surface`, radius 10.r, border `error@0.25`; casino icon 28.r `onSurface@0.3`; `AppLocale.noGamesAvailable` "No games available" 12.r w700; CLOSE `FilledButton` height 24.r `surfaceContainerHighest`, radius 6.r, `AppLocale.close` "Close" 11.r (`:656-713`).

### Game metadata and empty states (summary)

| Field | Where shown | Empty state | Cite |
| --- | --- | --- | --- |
| Display name | list row, grid/carousel footer title, game info identity footer, launch dialog | romname if name empty | `game_list_view.dart:460-464`; `tabs/game_details_game_info_tab.dart:383-388` |
| ROM filename | details footer line 1 (scraped only); game info identity footer (always if non-empty); grid/carousel footer subtitle (scraped only) | line left blank but height reserved | `widgets/game_details_footer.dart:948-949`; `lib/widgets/game_view_footer.dart:112-125` |
| Developer, publisher, players, year, genre | game info header strip | each dropped when empty; whole strip hidden when unscraped | `tabs/game_details_game_info_tab.dart:507-528` |
| Rating (0-20 source, shown /2, whole number) | details footer chip; grid/carousel rating pill | chip omitted when 0 | `widgets/game_details_footer.dart:89`, `:820-833` |
| Description | game info body | "Incomplete Metadata" notice | `tabs/game_details_game_info_tab.dart:224-227` |
| Play time | details footer line 1 right; grid/carousel pill | omitted when 0s | `widgets/game_details_footer.dart:90-91` |
| Last played | not shown on these screens | not found | - |
| Favourite | heart before the list title (redAccent / onPrimary); heart circle on grid/carousel cards; filled red heart button in the details footer | no mark | `game_list_view.dart:428-438`; `my_games_grid.dart:1459-1476` |
| Achievements | footer pill, tab 5, optional inline trophy | pill hidden unless RA system + signed in + (loading or total > 0) | `widgets/game_details_footer.dart:364-382` |

### Game settings dialog, delete dialog, achievements dialog

Unless a full path is given, citations in this section are relative to `lib/screens/game_screen/game_settings_dialog/` (settings dialog and tabs), `lib/widgets/` (delete dialog, confirm dialog, toggle), or `lib/screens/game_screen/game_details_card/` (achievements dialog, RA picker).

#### Shared behaviour

- Game settings dialog: plain `showDialog` (no barrier or transition arguments, so Flutter M3 defaults: `Colors.black54` barrier, barrier-dismissible, fade in) from `lib/screens/game_screen/my_games_list.dart:587-607`. Triggers: Start in every view (list: `lib/screens/game_screen/my_games_list/gamepad_nav.dart:81`; grid `lib/screens/game_screen/my_games_grid.dart:753`; carousel `lib/screens/game_screen/my_games_carousel.dart:426`), the details footer cog, and the context menu's "Game Settings". Nav SFX first; never for folder rows (`my_games_list.dart:591-593`). The comment at `my_games_list.dart:584-586` saying Start belongs to the details card in list mode is stale: the details card registers no Start handler, and the list layer binds Start to this dialog.
- Delete, reset-play-time confirm and RA picker pass `barrierDismissible: false` (`game_settings_manage_tab.dart:297`, `lib/widgets/confirm_action_dialog.dart:51`, `dialogs/ra_match_picker_dialog.dart:54`).
- Face buttons fire on press on Android and on release on desktop; D-pad, stick and bumpers on press (`lib/utils/gamepad_nav.dart:940-954`). None of these dialogs set `accelerateRepeats`, so held D-pad repeats at 300ms then 80ms.
- Footer chip `GamepadControl` (`lib/widgets/core_footer.dart:121-226`): padding h `6.r` v `4.r`; radius `radiusInternal` fallback `6.r`; border 1.r `lightenColor(bg, 0.05)`; shadow `shadow@0.1 blur 4.r offset (2.0.r, 2.0.r)`; glyph 18.r tinted `srcIn`; gap 4.r; label 12.r w600 ls `0.2.r`; trailing 4.r.

#### Game settings dialog shell

`game_settings_dialog.dart`
- `Dialog(transparent)`, `insetPadding` h/v `16.r`; box `maxWidth 640.r, maxHeight 480.r`, `surface`, radius `12.r`, border `outline@0.1` width 1, shadow `shadow@0.5 blur 10.r offset Offset(0, 4)` (`:234-251`).
- Column: header, tab strip, `Expanded(IndexedStack)` of 3 tabs, footer (`:253-295`). Header, strip and footer hide while the soft keyboard is up (`:227`, `:256-259`, `:293`).
- Header (`:300-357`): padding h `12.r` v `8.r`; `AppLocale.gameSettings` "Game Settings" 12.r bold `onSurface`; gap `1.r`; game name (else romname) 10.r w500 `onSurface@0.6` one line; right: close button, InkWell radius `8.r`, padding `6.r`, `Symbols.close_rounded` 18.r `onSurface@0.5`, tap = back SFX + pop.
- Tab strip (`:359-437`): padding h `12.r`, bottom border `outline@0.1`; `Xbox_LB_bumper.png` height `24.r` tinted `onSurface@0.5` (right pad 8.r); tabs `AppLocale.emulator` "Emulator", `AppLocale.scraping` "Scraping", `AppLocale.manage` "Manage" with `16.r` gaps; `Spacer`; `Xbox_RB_bumper.png` same style (left pad 8.r). Tab item: padding v `8.r`, bottom border `2.r` `secondary` when selected else transparent, label upper-cased 10.r ls `0.5.r`, selected bold `secondary`, unselected w500 `onSurface@0.5`. No animation; content swaps instantly (`IndexedStack` `:261`).
- Footer (`:439-479`): padding `8.r`, `surfaceContainerHighest@0.05`, bottom corners `12.r`; chip `Xbox_D-pad_ALL.png` + `AppLocale.navigate` "Navigate" on `tertiary` / `onPrimary` (no tap); gap 8.r; chip `Xbox_B_button.png` + `AppLocale.close` "Close" on `error` / `onError`, tap = close.

Button map (layer `game_settings_dialog`, `:85-104`):
| Button | Action | Cite |
| --- | --- | --- |
| LB / RB (Q / E) | previous / next tab, wraps modulo 3 (nav SFX plays twice: dispatcher and `_switchTab`) | `:92-93`, `:114-120`; `lib/utils/gamepad_nav.dart:1438` |
| D-pad up / down | current tab's row cursor | `:122-142` |
| D-pad left / right | Scraping tab only: sub-tab; no-op elsewhere | `:144-156` |
| A | current tab's `trigger()` | `:158-167` |
| B | while a Scraping text field is being edited: leave the field; else close | `:173-182` |
| X, Y, Start, Select | not bound | - |

Closes on B, the close button, the Close chip, a barrier tap, and automatically after delete or hide (`:184-192`).

#### Emulator tab

`game_settings_emulator_tab.dart`, rows from `lib/widgets/settings_rows.dart:104-259`
- No emulators: centred `AppLocale.noEmulator` "No Emulator Configured" 12.r `onSurface@0.6` (`:147-158`).
- Scroll view padding `12.r`; section header padding l `4.r` b `4.r`: `Symbols.sports_esports_rounded` 12.r + "Emulator" 11.r w600, both `onSurface@0.6` (`:161-191`).
- Row 0 `AppLocale.systemDefault` "System Default"; then one row per emulator (`:193-224`).
- Row: margin bottom `4.r`; fill `secondary@0.15` selected else `surfaceContainerHighest@0.1`; radius `6.r`; padding h `8.r` v `4.r`; icon tile `22.r` (fill `secondary@0.2`/`@0.1`, radius `4.r`, padding `3.r`, `assets/images/emulators/retroarch.webp` tinted `secondary`/`onSurface`, fallback `Symbols.gamepad_rounded` 12.r); gap 8.r; label 12.r w600 (`secondary`/`onSurface`); gap `1.r`; status: optional RA badge (margin r `5.r`, padding h `4.r` v `1.r`, `#FFFFD700`, radius `3.r`, border `#FF00387D@0.2` `0.5.r`, trophy 9.r `#FF00387D`), then `check_circle_rounded` `#FF56C288` or `error_outline_rounded` `#FFFDAF1E` 10.r, gap `3.r`, hardcoded "Ready" / "Not configured" 10.r; active row trailing `check_circle_rounded` 14.r `secondary`. Not-installed rows at opacity 0.4 and inert (`settings_rows.dart:124-251`).
- Up/down clamp (no wrap), `ensureVisible(200ms, Curves.easeOut, alignment 0.5)`; default focus 0; A on row 0 clears the override, other rows set it if installed (`:79-118`).

#### Scraping tab

`game_settings_scrapping_tab.dart`
- Sub-tab bar (`:509-540`, item `:715-770`): padding h `12.r` v `8.r`, bottom border `outline@0.1`; two `Expanded` items 8.r apart: `AppLocale.scrapingData` "Scraping Data", `AppLocale.scrapingMedia` "Scraping Media". Item padding v `6.r`, fill `secondary@0.15` selected / `surfaceContainerHighest@0.3`, radius `6.r`, border 1.r `secondary@0.5` / `outline@0.1`, label upper-cased centred 10.r ls `0.5.r`, bold `secondary` / w600 `onSurface@0.6`. D-pad left = Data, right = Media, no wrap; switching leaves any field, nav SFX, cursor to 0 (`:239-247`, `:408-427`).
- Data rows (indices 0-11, `:63-70`, `:542-667`):
| Idx | Row |
| --- | --- |
| 0 | `Symbols.refresh_rounded` `AppLocale.forceRescrape` "Force Rescrape", subtitle `AppLocale.rescrape` "Rescrape"; while scraping subtitle "Scraping {n}%" and trailing `LinearProgressIndicator` width `60.r` minHeight `4.r` (`:552-581`) |
| - | section header `Symbols.edit_rounded` `AppLocale.description` "Description" |
| 1-4 | text fields `AppLocale.gameTitle` "Title", `AppLocale.developer` "Developer", `AppLocale.publisher` "Publisher", `AppLocale.genre` "Genre" |
| 5-10 | 3-line fields "Description (EN)", "(ES)", "(FR)", "(DE)", "(IT)", "(PT)" (`:627-639`, `:76`) |
| - | gap `8.r` |
| 11 | `Symbols.save_rounded` `AppLocale.save` "Save"; spinner 16.r stroke 2 `secondary` while saving (`:642-663`) |
- Section header (`:773-804`): padding l `4.r` t `8.r` b `4.r`; icon 12.r + text 11.r w600, `onSurface@0.6`.
- Nav row (`:807-894`): margin b `4.r`; fill `secondary@0.15` selected; radius `6.r`; padding h `8.r` v `6.r`; icon tile `18.r` (fill `secondary@0.2`/`@0.1`, radius `4.r`, icon 11.r); gap 8.r; label 12.r w600; subtitle 10.r `onSurface@0.7`.
- Field row (`:897-1017`): margin b `4.r`; fill `secondary@0.12` selected; radius `6.r`; border 1.r `secondary@0.6` while editing else `outline@0.15`; padding h `8.r` v `4.r`; label column `92.r` wide, top pad `4.r`, 10.r w600 (`secondary` / `onSurface@0.7`), max 2 lines; value 11.r `onSurface` (empty value shows a U+2014 dash character, hardcoded `:967-979`); editing = borderless dense `TextField` 11.r, content padding v `4.r`.
- Media rows (`:669-711`, row `:1020-1120`): section header `Symbols.image_rounded` `AppLocale.systemArt` "System Art"; rows `AppLocale.screenshot` "Screenshot", `AppLocale.wheel` "Wheel", `AppLocale.fanart` "Fanart", `AppLocale.boxart` "Boxart" (types `screenshots, wheels, fanarts, box2d`). Row: margin b `4.r`, fill `secondary@0.15` selected, radius `6.r`, padding h `8.r` v `4.r`; thumbnail `40.r` square radius `4.r` on `surfaceContainerHighest` `BoxFit.cover` (missing: `Symbols.image_rounded` 16.r `onSurface@0.4`; error: `Symbols.broken_image_rounded`); gap 8.r; label 12.r w600; "Change" pill (`AppLocale.change`) padding h `8.r` v `3.r`, `secondary@0.12`, radius `4.r`, border 1.r `secondary@0.4`, 11.r w600 `secondary`.
- Keys: up/down clamp, inert while editing, `ensureVisible(200ms, easeOut, 0.5)` (`:381-405`, `:475-487`). A: rescrape / focus field / save / open OS image picker (`:429-452`). A while editing: Title -> Developer -> Publisher -> Genre -> Save (no effect in description fields) (`:229-237`). B or Escape leaves a field.
- Toasts: "Scraping completed" / "Scraping failed: {message}" (hardcoded, `:298-300`); `AppLocale.metadataSaved` "Metadata saved"; `AppLocale.imageUpdated` "Image updated"; failure `AppLocale.failedToSaveSetting` "Failed to save setting" (`:206-212`, `:362-374`).

#### Manage tab

`game_settings_manage_tab.dart`, row widget `lib/screens/settings_screen/new_settings_options/widgets/setting_row.dart`
- Scroll view `ClampingScrollPhysics`, padding bottom `24.r` only; rows 12.r apart (`:355-358`).
- `SettingRow`: `surface@0.5`, radius `8.r`, border width `2` (plain) `primary` when focused else transparent (note: `primary`, not `secondary`); padding l/r `12.r` t/b `6.r`; title 12.r w500 (`primary` focused / `onSurface`); gap 4.r; subtitle 9.r `onSurface@0.6`; gap 12.r; trailing control (`setting_row.dart:56-111`).
| Idx | Title | Subtitle | Control |
| --- | --- | --- | --- |
| 0 (only if cloud sync signed in) | `AppLocale.cloudSync` "Cloud Sync" | "Saves are synced to the cloud" / "Cloud sync is disabled for this game" | `CustomToggleSwitch` (`:363-400`) |
| 1 | `AppLocale.playTime` "Play Time" | `formatPlayTime` ("0s", "{n}s", "{n}m", "{n}h") | "Reset" pill (`:404-459`) |
| 2 | `AppLocale.hideGame` "Hide Game" | "Hides it from your game lists. Nothing is deleted." | "Hide" pill (`:464-511`) |
| 3 | `AppLocale.deleteGame` "Delete Game" | "Permanently removes the ROM file from disk" | "Delete" pill (`:516-559`) |
- Pills: padding h `8.r` v `3.r`, radius `4.r`, border 1.r, text 11.r w600. Reset enabled: `error@0.15` / border `error@0.4` / text `error`; disabled (play time 0): `onSurface@0.05` / `onSurface@0.1` / `onSurface@0.3`. Hide: `primary` at 0.15/0.4/1.0. Delete: `error` at 0.15/0.4/1.0. Busy: 20.r spinner.
- Toggle (`lib/widgets/custom_toggle_switch.dart:31-80`): indicator `24.r`, spacing `16.r`, height `28.r`, border `2.r` transparent; on: track `alphaBlend(primary@0.20, surface)`, knob `primary` with `Symbols.check_rounded` 12.r; off: track `surface`, knob `onSurfaceVariant` with `Symbols.close_rounded`; "ON"/"OFF" 8.r bold. Animation duration is the package default (not in source).
- Keys: default focus 0 (or 1 without cloud row); up/down clamp and skip the hidden row; A toggles / confirms reset (only if play time > 0) / hides immediately with no confirmation / opens delete (`:91-156`, `:240-245`). Hide toasts `AppLocale.gameHidden` "{name} hidden" then closes; reset toasts "Play time reset" (hardcoded).

#### Reset play time confirm and delete dialog

`lib/widgets/confirm_action_dialog.dart`, `lib/widgets/delete_game_dialog.dart`
- `AlertDialog`, `theme.cardColor`, radius `12.r`, side `error@0.3`; title icon 20.r `error` (`Symbols.timer_off_rounded` / `Symbols.delete_rounded`), gap 8.r, `titleMedium` 14.r w600 `error`.
- Reset: title `AppLocale.resetPlayTimeConfirm` "Reset Play Time"; body `AppLocale.resetPlayTimeConfirmBody` "This will permanently reset the recorded play time for this game to zero. This cannot be undone." 11.r `onSurface@0.7`; confirm "Reset".
- Delete: title "Delete Game"; body `"<name>"` 13.r w600, gap 2.r, romname 11.r `onSurface@0.5`, gap 8.r, `AppLocale.deleteGameConfirmBody` "This will permanently delete the game ROM, its scraped data, and media files. This action cannot be undone." 11.r `onSurface@0.7`; confirm `AppLocale.deleteGameConfirm` "Delete Forever" (`delete_game_dialog.dart:64-174`).
- Actions: `TextButton` with `Xbox_B_button.png` 18.r + `AppLocale.cancel` "Cancel" 12.r, both `onSurface@0.6`; `ElevatedButton` `error` bg, padding h `16.r` v `8.r`, radius `6.r`, `Xbox_A_button.png` 18.r + label 12.r w600 `onError`. A confirms, B cancels, no D-pad focus (`confirm_action_dialog.dart:74-197`, `delete_game_dialog.dart:32-39`).

#### Game achievements dialog (grid/carousel only)

`dialogs/game_achievements_dialog.dart`. Opened only by tapping the footer's achievements pill in grid/carousel (`lib/widgets/game_view_footer.dart:186-192`); no gamepad binding found.
- `Dialog(transparent)`, `insetPadding` `24.r`; box fills `70%` of screen width and height; `surface`; radius `radiusExternal`; border `outline@0.5` `1.r`; shadow `black@0.35 blur 12.r offset (0, 4.r)` (`:195-219`).
- Hosts `GameDetailsAchievementsTab` with all offsets 0 (so the tab's layout above applies), plus a BACK chip (`Xbox_B_button.png` 12.r `onPrimary`, "BACK", `primary`) after the header chips (`:221-253`). `raHash` and the snapshot total are not passed, so the hash always reads as an en dash.
- Keys: D-pad forwarded to the panel; A enters / activates chip; B closes; the panel auto-enters after each load (`:106-152`).

#### RA match picker ("Fix match")

`dialogs/ra_match_picker_dialog.dart`
- `Dialog`, `cardColor`, insets `24.r`, radius `12.r`, side `primary@0.3`; width `60%` of screen, max height `70%`, padding `12.r` (`:274-286`).
- Title: `Symbols.emoji_events_rounded` 18.r `primary`, gap 8.r, `AppLocale.raFixMatchTitle` "Choose the right game" 13.r w600 `primary`, system name right 10.r `onSurface@0.5` (`:306-334`).
- Search field (`:336-389`): `surface`, radius `6.r`, border `primary` 2.r when selected else `outline@0.4` 1.r, padding h `8.r`, search icon 14.r, text 12.r, hint `AppLocale.raFixMatchSearchHint` "Search RetroAchievements titles"; prefilled with the name minus extension and bracket tags; 300ms debounce.
- Result rows `44.r` tall, padding h `8.r`, radius `6.r`, selected `primary@0.15` + `primary` 2.r border, current match leading `check_circle_rounded` 14.r, title 11.r, `"{count} achievements"` 9.r; empty `AppLocale.raFixMatchNoResults` "No matching games found."; optional reset row `Symbols.restart_alt_rounded` + "Use automatic matching" (`:392-535`).
- Keys: up/down clamp over search, results, reset; scroll `150ms Curves.easeOut`; A focuses search / commits / applies; B unfocuses then closes (`:181-241`).

#### Unused widgets in scope

- `OptionPickerOverlay` (`game_settings_dialog/option_picker_overlay.dart`) and `GameScreenshot` / `GameScreenshotCard` (`lib/widgets/game_screenshot.dart`) have no call sites. Not needed for the mockup.

### Ambiguities and gaps

1. No left rail of round action buttons exists in this build. Comments say the vertical action rail was removed; its actions moved to the details footer (random, favourite, settings, PLAY) and the Y context menu (`lib/screens/game_screen/my_games_list/context_menu.dart:5-12`, `lib/screens/game_screen/game_details_card/widgets/game_details_footer.dart:200`).
2. Details-card tabs are switched with D-pad left/right, not LB/RB. The strip shows D-pad glyphs, not bumper glyphs. Several stale comments still say "L1/R1" or "bumpers" (`game_details_card_list.dart:352`, `:1251`; `game_details_footer.dart:801-802`). The code binds nothing to the bumpers on this screen (`lib/screens/game_screen/my_games_list/gamepad_nav.dart:86-87`).
3. The tab strip is 4 or 5 icons (achievements only on RA systems; screenshot/video hidden when a second screen is active). There is no text label on any tab.
4. The fanart background has only a flat `shadow@0.2` scrim. There is no gradient scrim and no blur on the fanart. The sidebar glass defaults to blur 0 (flat 83% tint), so the "blur" only exists if the user raises `neoglassBlur`.
5. The fanart transition scales the incoming image 1.0 -> 1.1 and leaves it at 1.1. This reads as a deliberate zoomed-in resting state, but confirm on a screenshot.
6. Carousel mode pushes the background into `SystemBackgroundProvider`, but nothing that renders that provider was found on the games route. The carousel and grid therefore appear to sit on the plain scaffold colour. Check against a real screenshot.
7. `GameUtils.formatGameName` is a no-op. The real title cleaning (region `(...)` and `[...]` tags, extension) happens at load time and only for unscraped names; scraped names are shown as scraped.
8. Rating scale: the source value is divided by 2 and shown as a whole number rounded up (details footer) or to the nearest integer (grid/carousel pill, `toStringAsFixed(0)`). The two views can disagree by 1 for .5 values (`game_details_footer.dart:826` vs `lib/widgets/game_view_footer.dart:404`).
9. "Last played" is loaded into the model but not shown anywhere on these screens.
10. The Card around the details panel uses Flutter's default margin (4 logical px), which the source does not state explicitly.
11. The random game dialog header chips advertise X (re-roll) and B (back), but not A; A launches once the PLAY button is shown.
12. LT/RT have no binding. There is no trigger letter-jump. Letter jumping is by holding the D-pad for 1200ms (list: up/down; carousel: left/right; grid: none).
13. The grid's comments mention a "Select+B reflow" and an "action-button legend", but neither is bound or rendered in this build.
14. Grid in fanart card style makes every card square (height/width ratio 1.0), even though the art is 16:9.
15. The game settings dialog plays the nav sound twice per LB/RB tab switch (dispatcher and `_switchTab`).
16. The achievements dialog (grid/carousel) never receives `raHash` or the snapshot total, so its hash line always shows an en dash.
17. Framework defaults not stated in source: `showDialog` barrier colour and fade, `AlertDialog` padding, and the toggle switch animation.
18. The music system (`folderName == 'music'`) replaces the sidebar list and details card with `MusicList` / `MusicPlayer`. That is out of scope here and was not extracted.

## Tabs - Search, Achievements, NeoSync, Scraper, RomM

Source: `misobadev/neostation-frontend` at commit d9bece5. All paths below are relative to that repo. Sizes are in source units exactly as written (`12.r`, `8.w`, `4.h`, `14.sp`, or plain logical px when unsuffixed); screenutil design size is 640x480. Colours are theme roles (`scheme` = `Theme.of(context).colorScheme`) or literal hex. English strings come from `lib/l10n/app_locale_en.dart` (cited as `en:LINE`).

Citation conventions: a bare `:LINE` (or `:A-B`) in a table or paragraph refers to the file cited most recently above it in the same subsection (the table's own header line or the subsection's opening "Files" / first full citation). `@0.6` is shorthand for `.withValues(alpha: 0.6)`. Symbols are `material_symbols_icons` `Symbols.*`. Nothing here was run; every value is read from source.

### Shared context (applies to every tab here)

#### Tab hosting

| Fact | Value | Citation |
| --- | --- | --- |
| Tab indices | systems 0, search 1, sync (NeoSync) 2, achievements 3, scraper 4, romm 5, settings 6 | `lib/screens/app_screen.dart:50-60` |
| Tab content layer | `Positioned.fill` over a `scaffoldBackgroundColor` fill; global `FixedHeader` is `Positioned(top:0)` on top of content | `lib/screens/app_screen.dart:711-735` |
| Global footer | `_buildFooterForCurrentTab()` returns `SizedBox.shrink()` - no app-level footer; tabs draw their own | `lib/screens/app_screen.dart:757-759` |
| Search tab | app-level gamepad layer deactivated post-frame; `SearchScreen` pushes its own layer | `lib/screens/app_screen.dart:769-775` |
| Sync tab | app-level layer deactivated; `NeoSyncContent` | `lib/screens/app_screen.dart:776-781` |
| Achievements tab | `RAContent()` (pushes its own layer) | `lib/screens/app_screen.dart:782-783` |
| Scraper tab | `ScraperContent()`; app-level layer stays active and delegates dpad/A/B to `NewScraperOptionsScreen` statics | `lib/screens/app_screen.dart:477-557,784-785` |
| RomM tab | app-level layer deactivated; `RommTab` | `lib/screens/app_screen.dart:786-792` |
| Tab cycling | `_cycleTab(step)` walks visible tabs with wrap at both ends; no-op when a pushed route covers AppScreen | `lib/screens/app_screen.dart:663-686` |
| App-level X | only Settings uses it; no-op on these tabs | `lib/screens/app_screen.dart:562-566` |
| App-level Start (`onSettings`) | `_handleSettings` does nothing except return on systems | `lib/screens/app_screen.dart:530-534` |

#### Physical button dispatch (`lib/utils/gamepad_nav.dart`)

| Button | Callback | Notes | Citation |
| --- | --- | --- | --- |
| A | `onSelectItem` | plays enter SFX | `:1026-1029` |
| B | `onBack` | plays back SFX | `:1031-1034` |
| Y | `onFavorite` | nav SFX | `:1036-1039` |
| X | `onXButton` | nav SFX | `:1041-1044` |
| Start | `onSettings` | nav SFX | `:1046-1049` |
| Select tap | layer's `onSelectButton`, else `globalSelectTap` (the header notification bell popup) | dispatched on release after a chord window; Select+face = `onSelectModifierA/B/X/Y` | `:260-266,295-318` |
| LB / RB | `onLeftBumper ?? onPreviousTab` / `onRightBumper ?? onNextTab` | fire on press; desktop hold-repeat starts after 400 ms, every 255 ms, max 10 s | `:1054-1057,1430-1439,158,208,213` |
| LT / RT | no case in the dispatch switch - no action | L3/R3 map to `onLeftStickClick`/`onRightStickClick` | `:1059-1071` |
| Dpad / left stick | `onNavigate*`; stick threshold 0.60 (0.65 on Windows) | hold repeat: 300 ms initial, 80 ms interval ramping to 35 ms over 14 repeats | `:940-1024,225-236` |
| Keyboard | W/Up, S/Down, A/Left, D/Right, Q = prev tab, E = next tab, Enter = A, Backspace = B, Y = favourite, Escape = settings | `:1164-1227` |
| Android + TextField focused | only LB, RB, B are processed | `:866-875` |
| Press vs release | dpad/LB/RB/RT fire on press; other buttons fire on press on Android and on release on desktop | `:914-927` |

### Search tab

Files: `lib/screens/search_screen/search_screen.dart` (UI + input), `lib/screens/search_screen/search_filter.dart` (pure filter/facet logic). `lib/utils/debounced_search.dart` defines `DebouncedSearch<T>` (debounce + stale-drop; empty term fires immediately, `lib/utils/debounced_search.dart:14-16,57-65`) but it is **not used** by the search screen - the screen runs its own 350 ms `Timer` for RomM (`lib/screens/search_screen/search_screen.dart:158,440-459`). No usages of `DebouncedSearch` found under `lib/screens/search_screen/`.

On-screen keyboard: none. The name field is a stock Material `TextField`; A on the field calls `_nameFocus.requestFocus()` "so the keyboard opens" (the OS/IME keyboard) (`lib/screens/search_screen/search_screen.dart:834-837,1622-1652`). No custom virtual keyboard widget exists in `lib/` (zero hits for `VirtualKeyboard|OnScreenKeyboard|virtual_keyboard`).

There is no footer / button-hint bar on this tab (no footer widget in `search_screen.dart`; app footer is empty, `lib/screens/app_screen.dart:757-759`).

#### Loading and first visit

| State | Look | Citation |
| --- | --- | --- |
| Loading | `Center(child: CircularProgressIndicator())` (default size/colour) for the whole tab body | `lib/screens/search_screen/search_screen.dart:1330-1331` |
| Load start | deferred 250 ms after first frame (waits for tab indicator animation) | `lib/screens/search_screen/search_screen.dart:228-234` |
| Load | all games minus `isHidden`; phase 1 shows loaded UI, phase 2 computes results/facets next frame | `lib/screens/search_screen/search_screen.dart:257-280` |
| First visit, empty query | results list shows the **whole library** (a blank query matches everything), sorted case-insensitively by `realName ?? filename` | `lib/screens/search_screen/search_filter.dart:223-228,301-311` |
| Default focus | region `search`, item 0 = the text field; filters collapsed | `lib/screens/search_screen/search_screen.dart:92-100` |
| No results | centred text `searchNoResults` = "No games found" (`en:1123`), `fontSize 14.r`, `onSurface.withValues(alpha: 0.6)` | `lib/screens/search_screen/search_screen.dart:2024-2033` |

#### Layout (top to bottom)

`Stack` > `Padding(horizontal: 12.r)` > `Column(stretch)` (`lib/screens/search_screen/search_screen.dart:1332-1349`):

| Row | Size / spacing | Citation |
| --- | --- | --- |
| Top spacer (clears the global header) | `SizedBox(height: 64.r)` | `lib/screens/search_screen/search_screen.dart:1339` |
| Search row | see below | `lib/screens/search_screen/search_screen.dart:1340,1517-1536` |
| Gap (only if filters expanded) | `6.r`, then chip row | `lib/screens/search_screen/search_screen.dart:1341-1344` |
| Gap | `8.r` | `lib/screens/search_screen/search_screen.dart:1345` |
| Results list | `Expanded` | `lib/screens/search_screen/search_screen.dart:1346` |
| Overlays | filter-value menu and result-action chooser, both `Positioned.fill` | `lib/screens/search_screen/search_screen.dart:1350-1354` |

##### Search row

`Row[ Expanded(name field), SizedBox(10.r), result count text, SizedBox(10.r), Filters toggle ]` (`lib/screens/search_screen/search_screen.dart:1518-1535`).

| Element | Spec | Citation |
| --- | --- | --- |
| Name field wrapper | `Container`, radius `12.r`, border `2.r` = `scheme.primary` when focused else transparent | `lib/screens/search_screen/search_screen.dart:1614-1621` |
| TextField | `isDense`, contentPadding `h 12.r / v 10.r`, `filled`, fill `surfaceContainerHighest.withValues(alpha: 0.5)`, `OutlineInputBorder(radius 12.r, BorderSide.none)`, `textInputAction: done` | `lib/screens/search_screen/search_screen.dart:1622-1651` |
| Hint | `searchNameHint` = "Search..." (`en:1122`) | `lib/screens/search_screen/search_screen.dart:1633` |
| Prefix icon | `Symbols.search_rounded` (default size) | `lib/screens/search_screen/search_screen.dart:1634` |
| Suffix (only when text not empty) | clear-X button: margin `h 6.r / v 4.r`, padding `4.r`, radius `10.r`, border `2.r`; focused bg `primary.withValues(alpha: 0.18)` + border `primary`, else transparent; icon `Symbols.close_rounded` `18.r`, `primary` focused else `onSurface.withValues(alpha: 0.6)` | `lib/screens/search_screen/search_screen.dart:1635-1637,1661-1687` |
| Result count | `searchResultsCount` = "{count} results" (`en:1124`), count = local result length; `fontSize 12.r`, `w600`, `onSurface.withValues(alpha: 0.6)` | `lib/screens/search_screen/search_screen.dart:1522-1531` |
| Filters toggle | padding `h 12.r / v 9.r`, radius `12.r`, border `2.r` | `lib/screens/search_screen/search_screen.dart:1546-1563` |
| Filters toggle bg | focused `primary.withValues(alpha: 0.18)`; else if active filters >0 `primary.withValues(alpha: 0.10)`; else `surface.withValues(alpha: 0.5)` | `lib/screens/search_screen/search_screen.dart:1549-1553` |
| Filters toggle border | focused `primary`; else if count>0 `primary.withValues(alpha: 0.5)`; else transparent | `lib/screens/search_screen/search_screen.dart:1556-1560` |
| Filters toggle content | `Symbols.tune_rounded` `18.r`; gap `6.r`; label `searchFilters` = "Filters" (`en:1126`) `13.r w700`; accent colour `primary` when focused or count>0 else `onSurface` | `lib/screens/search_screen/search_screen.dart:1567-1580` |
| Count badge (count>0) | gap `6.r`; padding `h 6.r / v 1.r`, bg `primary`, radius `8.r`; text `11.r w800 onPrimary` | `lib/screens/search_screen/search_screen.dart:1581-1597` |
| Chevron | gap `4.r`; `expand_less_rounded` when expanded else `expand_more_rounded`, `16.r`, `onSurface.withValues(alpha: focused ? 0.9 : 0.5)` | `lib/screens/search_screen/search_screen.dart:1599-1606` |

Active filter count = number of non-null among platform, developer, genre, year, source, achievements, plus rating (`lib/screens/search_screen/search_screen.dart:611-620`).

##### Filter chip row (only when `_filtersExpanded`)

Horizontal `SingleChildScrollView` of one `Row` - no wrapping (`lib/screens/search_screen/search_screen.dart:1474-1496`). Order: `source` (only if RomM connected), `platform`, `rating`, `developer`, `genre`, `year`, `achievements`, then `clear` (`lib/screens/search_screen/search_screen.dart:591-607`). A chip is hidden when it has no options and is not active (`lib/screens/search_screen/search_screen.dart:592-593`).

| Element | Spec | Citation |
| --- | --- | --- |
| Filter chip | margin right `8.r`; padding `h 12.r / v 8.r`; radius `12.r`; border `2.r` | `lib/screens/search_screen/search_screen.dart:1705-1723` |
| Chip bg | focused `primary.withValues(alpha: 0.18)`; active `primary.withValues(alpha: 0.10)`; else `surface.withValues(alpha: 0.5)` | `lib/screens/search_screen/search_screen.dart:1709-1713` |
| Chip border | focused `primary`; active `primary.withValues(alpha: 0.5)`; else transparent | `lib/screens/search_screen/search_screen.dart:1716-1720` |
| Label | `'$label: '` `13.r w600 onSurface.withValues(alpha: 0.7)` | `lib/screens/search_screen/search_screen.dart:1727-1734` |
| Value | max width `140.r`, ellipsis, `13.r w700`, `primary` when active or focused else `onSurface` | `lib/screens/search_screen/search_screen.dart:1735-1747` |
| Chevron | gap `4.r`; `expand_more_rounded` `16.r`, `onSurface.withValues(alpha: focused ? 0.9 : 0.4)` | `lib/screens/search_screen/search_screen.dart:1749-1754` |
| Clear chip | same box; bg focused `primary@0.18` else `surface@0.5`; icon `filter_alt_off_rounded` `16.r onSurface`; gap `6.r`; `searchClearFilters` = "Clear filters" (`en:1125`) `13.r w700 onSurface` | `lib/screens/search_screen/search_screen.dart:1761-1809` |
| Focused chip scroll | `Scrollable.ensureVisible(alignment 0.5, 140 ms, Curves.easeOut)` | `lib/screens/search_screen/search_screen.dart:1499-1510` |

Filter labels (`lib/screens/search_screen/search_screen.dart:1936-1945`): `filterSource` "Source" (`en:1140`), `filterPlatform` "Platform" (`en:1130`), `filterDeveloper` "Developer" (`en:1131`), `filterGenre` "Genre" (`en:1132`), `filterRating` "Rating" (`en:1133`), `filterYear` "Year" (`en:1134`), `filterAchievements` "Achievements" (`en:1135`). Unset value shows `filterAny` "Any" (`en:1139`).

Value display (`lib/screens/search_screen/search_screen.dart:1964-1985,1998-2021`):

| Filter | Options (after "Any") | Display |
| --- | --- | --- |
| Source | `local`, `romm` | `sourceLocal` "On this device" (`en:1141`), `rommLibrary` "RomM Library" (`en:1040`) |
| Platform | distinct `systemRealName` (plus RomM vocab), case-insensitive sort | raw |
| Developer / Genre | distinct values, merged with RomM's facet values when the RomM section is visible | raw |
| Year | distinct 4-digit years, **newest first** (`lib/screens/search_screen/search_filter.dart:213-220`) | raw |
| Rating | whole 1..10 scores present, ascending (`lib/screens/search_screen/search_filter.dart:421-430`); rating = stored 0..20 / 2, rounded, clamped 1..10 (`lib/screens/search_screen/search_filter.dart:13,20-23`) | `'★ $score'` |
| Achievements | `matched`, `noSet`, `unknown` in that fixed order, only those present (`lib/screens/search_screen/search_filter.dart:81-91,435-451`) | `raCoverageMatched` "Yes" (`en:1136`), `raCoverageNoSet` "No" (`en:1137`), `raCoverageUnknown` "Unknown" (`en:1138`) |

Facets are faceted: each dimension's options come from games matching every *other* active dimension (`lib/screens/search_screen/search_filter.dart:370-379`).

##### Results list

`ListView.builder`, `itemExtent: 68.r` (`_resultExtent`) (`lib/screens/search_screen/search_screen.dart:199,2036-2050`). Rows: local games, then (RomM only) a header, remote ROMs, and one status row (`lib/screens/search_screen/search_filter.dart:531-571`).

| Element | Spec | Citation |
| --- | --- | --- |
| Local row outer | `Padding(vertical: 3.r)` | `lib/screens/search_screen/search_screen.dart:2354-2355` |
| Local row box | padding `h 10.r / v 6.r`; radius `12.r`; border `2.r`; bg focused `primary.withValues(alpha: 0.18)` else `surface.withValues(alpha: 0.5)`; border focused `primary` else transparent | `lib/screens/search_screen/search_screen.dart:2356-2367` |
| Box art | `36.r x 46.r`, radius `6.r`, bg `surface.withValues(alpha: 0.4)`, border `1.r onSurface.withValues(alpha: 0.12)`, `BoxFit.contain`, `FilterQuality.medium`; placeholder `Symbols.videogame_asset_rounded` `18.r onSurface@0.35` | `lib/screens/search_screen/search_screen.dart:2450-2478` |
| Box art source | `GameModel.getImagePath(folder, 'box2d', ...)`, memoised per ROM | `lib/screens/search_screen/search_screen.dart:2434-2446` |
| Gap | `10.r` | `lib/screens/search_screen/search_screen.dart:2371` |
| Title | `realName ?? filename`, 1 line ellipsis, `13.r w700 onSurface` | `lib/screens/search_screen/search_screen.dart:2377-2386` |
| Subtitle | `[systemShortName ?? systemRealName, year, developer]` joined with `'  •  '`; 1 line, `11.r onSurface@0.6` | `lib/screens/search_screen/search_screen.dart:2343-2349,2387-2396` |
| Rating (if >0) | gap `8.r`, `Symbols.star_rounded` `14.r primary`, gap `2.r`, bucket number `12.r w600 onSurface@0.8` | `lib/screens/search_screen/search_screen.dart:2400-2415` |
| RomM header row (not focusable) | `rommLibrary` uppercased "ROMM LIBRARY", `10.r w800`, letterSpacing `1.1`, `primary@0.9`; optional count ("{count} results") `10.r w600 onSurface@0.5` after `6.r`; gap `8.r`; `Divider(height 1.r, thickness 1.r, onSurface@0.15)` | `lib/screens/search_screen/search_screen.dart:2060-2101` |
| Remote row | identical box to local row; cover is network image (placeholder `Symbols.cloud_rounded`); subtitle `[platformSlug, size, genre]`; trailing `8.r` gap + `check_circle_rounded` (`primary`) if downloaded else `cloud_download_rounded` (`onSurface@0.45`), `16.r` | `lib/screens/search_screen/search_screen.dart:2210-2327` |
| Size format | `>=1 GiB` "x.x GB", `>=1 MiB` "x.x MB", else "N KB" | `lib/screens/search_screen/search_screen.dart:2329-2337` |
| Status: loading | centred `18.r x 18.r` spinner, strokeWidth `2.r` | `lib/screens/search_screen/search_screen.dart:2108-2116` |
| Status: unsupported / noEquivalent | padding `h 10.r`; `Symbols.info_rounded` `15.r onSurface@0.5`; gap `6.r`; text max 2 lines `11.r onSurface@0.55`; text `searchRatingLocalOnly` "The rating filter applies to local games only" (`en:1142`) if rating set, else `searchAchievementsLocalOnly` "The achievements filter applies to local games only" (`en:1144`); or `searchNoRommEquivalent` "RomM has nothing filed under “{value}”" (`en:1146`) | `lib/screens/search_screen/search_screen.dart:2118-2153` |
| Status: error / load more (focusable) | outer `Padding(v 3.r)`; box padding `h 10.r`, centred, radius `12.r`, border `2.r`; focused bg `primary@0.18` + border `primary`; icon `error_rounded` (`scheme.error`) or `keyboard_arrow_down_rounded` (`onSurface`) `16.r`; gap `6.r`; text `12.r w600`, error colour `scheme.error` else `onSurface@0.8`; text = error message or `rommConnectionFailed` "Connection failed" (`en:1066`), or `rommLoadMore` "Load more" (`en:1094`) | `lib/screens/search_screen/search_screen.dart:2155-2206` |
| Result scroll | centres focused row: `rowPos * 68.r - (viewport - 68.r)/2`, `animateTo` 140 ms `Curves.easeOut` | `lib/screens/search_screen/search_screen.dart:1197-1216` |

RomM section only appears when RomM is connected, source != local, query not blank, and there are remote rows / loading / error (`lib/screens/search_screen/search_screen.dart:415-419`). Page size 30, debounce 350 ms (`lib/screens/search_screen/search_screen.dart:157-158`). Down within 2 rows of the end auto-loads the next page (`lib/screens/search_screen/search_screen.dart:788`).

#### Focus model

Regions: `search`, `filters`, `results`, `filterMenu`, `action` (`lib/screens/search_screen/search_screen.dart:59`). Search band items: `field`, `clearQuery` (only when text non-empty), `filters` (`lib/screens/search_screen/search_screen.dart:624-628`).

| Region | Up | Down | Left | Right | A | B | Citation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| search | nothing (top) | into chip row if expanded, else into results (if any) | previous item, clamped (no wrap) | next item, clamped | field: request focus (OS keyboard); clearQuery: clear text, focus field; filters: toggle chip row | if text field has focus: unfocus; else stay (B never leaves the tab) | `:691-697,708-713,763-764,789-797,828-837,1002-1019` |
| filters (chip row) | back to search band | into results | previous chip, **wraps** | next chip, **wraps** | chip: open value menu; Clear: reset all filters (query kept) | to search band | `:697-702,714-717,761-762,798-800,842-848,1014-1015,1153-1166` |
| results | at row 0: to filters (if expanded) else search; else previous row (no wrap) | next row, clamped (no wrap) | jump to search `field` | jump to search `filters` toggle | open action chooser (local/remote), or retry (error row) / load more | to search band | `:703-705,718-720,750-760,778-788,838-841,857-902,1012-1013` |
| filterMenu | previous value (**wraps**, "Any" slot at head), live-previewed | next value (wraps) | - | - | confirm, close menu, back to filters | cancel: restore the value from before opening | `:748-749,776-777,822-827,1010-1011,1037-1071`, `lib/screens/search_screen/search_filter.dart:575-581` |
| action chooser | previous option (**wraps**) | next option (wraps) | - | - | run option | close to results | `:741-747,771-775,818-821,1008-1009` |

Other buttons: LB/RB and `onPreviousTab`/`onNextTab` all call `AppNavigation.previousTab/nextTab` (`lib/screens/search_screen/search_screen.dart:212-217`). X, Y, Start: not bound on this layer. Select: not bound, so falls through to `globalSelectTap` (notification bell). LT/RT: nothing.

Toggling filters: opening moves focus to chip index 0; closing returns focus to the `filters` toggle; both unfocus the text field (`lib/screens/search_screen/search_screen.dart:641-659`).

Touch: first tap on a result selects it, second tap on the same row confirms (`lib/screens/search_screen/search_screen.dart:1175-1195`).

#### Filter value menu (overlay)

| Element | Spec | Citation |
| --- | --- | --- |
| Scrim | `Positioned.fill`, `Colors.black.withValues(alpha: 0.6)`; tap = cancel | `lib/screens/search_screen/search_screen.dart:1825-1829` |
| Placement | centred horizontally; vertically centred unless that would put the top above `46.r + 12.r`, then pinned there; max height = screen - `(46.r+12.r)` - `12.r` | `lib/screens/search_screen/search_screen.dart:1831-1837,2490-2521` |
| Panel | width `320.r`, padding `12.r`, `scheme.surface`, radius `16.r`, border `1.r primary.withValues(alpha: 0.4)` | `lib/screens/search_screen/search_screen.dart:1840-1850` |
| Title | filter label, padding left `4.r` bottom `8.r`, `15.r w700 onSurface` | `lib/screens/search_screen/search_screen.dart:1855-1865` |
| List | `ListView.builder`, shrinkWrap, `itemExtent 44.r` | `lib/screens/search_screen/search_screen.dart:109,1866-1879` |
| Option | margin `v 2.r`, padding `h 12.r / v 8.r`, radius `10.r`, border `2.r`; selected bg `primary@0.18` + border `primary`, else transparent; text `13.r w600`, `primary` if selected else `onSurface`; selected trailing `Symbols.check_rounded` `16.r primary` | `lib/screens/search_screen/search_screen.dart:1891-1934` |
| Scroll | centres selected entry, `animateTo` 120 ms `Curves.easeOut` | `lib/screens/search_screen/search_screen.dart:1219-1233` |

The menu has no separate cursor: moving up/down changes the filter value itself (live preview), and the "selected" row is the current value (`lib/screens/search_screen/search_screen.dart:1054-1071,1138-1149`).

#### Result action chooser (overlay)

| Element | Spec | Citation |
| --- | --- | --- |
| Scrim | `black@0.6`, tap outside = close to results | `lib/screens/search_screen/search_screen.dart:1365-1369` |
| Panel | centred, width `320.r`, padding `16.r`, `surface`, radius `16.r`, border `1.r primary@0.4` | `lib/screens/search_screen/search_screen.dart:1370-1383` |
| Title | ROM/game name, max 2 lines ellipsis, `15.r w700 onSurface`; then `SizedBox(12.r)` | `lib/screens/search_screen/search_screen.dart:1388-1398` |
| Option | margin `v 4.r`, padding `12.r` all round, radius `12.r`, border `2.r`; focused bg `primary@0.18` + border `primary`; unfocused bg `surface@0.5` + transparent; icon `18.r`, gap `8.r`, label `14.r w700`, both `primary` when focused else `onSurface` | `lib/screens/search_screen/search_screen.dart:1411-1466` |
| Options (local, or downloaded remote mapped to local) | `goTo` (`Symbols.my_location_rounded`, `searchGoToGame` "Go to game" `en:1129`), `play` (`Symbols.play_arrow_rounded`, `play` "Play" `en:28`) | `lib/screens/search_screen/search_screen.dart:864-871,895-897,1414-1422` |
| Options (remote not downloaded) | `download` (`Symbols.cloud_download_rounded`, `download` "Download" `en:18`) | `lib/screens/search_screen/search_screen.dart:897,1423-1426` |
| Default | index 0 | `lib/screens/search_screen/search_screen.dart:869,898` |

Destinations: Go to game pushes `SystemGamesList(system, initialRomPath)` via `MaterialPageRoute`; B there returns to search with query intact (`lib/screens/search_screen/search_screen.dart:1302-1320`). Play runs `launchGameWithDialog` (`lib/screens/search_screen/search_screen.dart:1235-1295`). Download shows notifications: `rommDownloading` "Downloading..." (`en:1089`), then `rommDownloadComplete` "Download complete" (`en:1091`) / `rommDownloadCancelled` "Download cancelled" (`en:1093`) / `rommNoSystemMatch` "No matching local system for this platform" (`en:1095`) / `rommNoWritableFolder` (`en:1097`) / `rommDownloadFailed` "Download failed" (`en:1092`); already-downloaded shows `rommDownloaded` "Downloaded" (`en:1090`) (`lib/screens/search_screen/search_screen.dart:951-1000`). Launch failure: `errorLaunchingGame` "Error launching game: {error}" (`en:814`) with `{error}` blanked (`lib/screens/search_screen/search_screen.dart:1284-1290`).

Platform conditions: secondary-display "Now Playing" push only on Android (`lib/screens/search_screen/search_screen.dart:237-239`).

### Achievements tab (RetroAchievements)

Files: `lib/screens/retro_achievements_screen/ra_content.dart` (signed-out form, input, offline banner), `lib/screens/retro_achievements_screen/ra_dashboard.dart` (signed-in dashboard), `lib/utils/login_form_selection.dart` (form cursor mixin), `lib/widgets/confirm_action_dialog.dart` (logout confirm). No footer / hint bar on this tab. All `Responsive` breakpoints (`handheldXS` .. `handheldXL`) render the same `_buildLandscapeLayout` (`lib/screens/retro_achievements_screen/ra_content.dart:384-390`).

Outer frame: `Padding(horizontal: 12.r)` > `Column(start)` > `SizedBox(height: 64.r)` spacer, then content (`lib/screens/retro_achievements_screen/ra_content.dart:399-404`).

#### Signed out - login form (first visit)

Row centred in a horizontal `SingleChildScrollView`, `Padding(h 16.r)`: `[ login card (maxWidth 260.r), SizedBox(16.r), info box (width 300.r) ]`, `crossAxisAlignment: start` (`lib/screens/retro_achievements_screen/ra_content.dart:406-430`). Username prefilled from last saved RA user if any (`lib/screens/retro_achievements_screen/ra_content.dart:79-87`).

##### Login card (`lib/screens/retro_achievements_screen/ra_content.dart:509-793`)

| Element | Spec | Citation |
| --- | --- | --- |
| Card | padding `16.r`; bg `theme.cardColor.withValues(alpha: 0.25)`; radius `12.r`; border `primary.withValues(alpha: 0.2)` width `1` (unscaled) | `:514-523` |
| Title | `raLogin` "RetroAchievements Login" (`en:724`), `titleMedium` bold, `primary`, `14.r` | `:528-541` |
| Gap | `12.r` | `:543` |
| Username field | maxWidth `220.r`, height `32.r`; `TextFormField`, text `11.r`; label `username` "Username" (`en:380`) `10.r onSurface@0.7`, floating label `10.r bold primary`; hint `enterUsername` "Enter your username" (`en:754`) `10.r onSurface@0.4`; filled `onSurface.withValues(alpha: 0.05)`; radius `8.r`; enabled border selected `primary` `2.r`, else `primary@0.1` `1.r`; focused border `primary` `1.r`; IME next -> API key | `:546-604` |
| Gap | `6.r` | `:605` |
| API key field | same as username, obscured by default, `enableSuggestions/autocorrect false`; label `raApiKey` "API Key" (`en:1187`); hint `raEnterApiKey` "Enter your API key" (`en:1188`); suffix `IconButton` with `visibility_rounded` (obscured) / `visibility_off_rounded`, `18.r`, `onSurface@0.5`; IME done -> connect | `:608-690` |
| Gap | `6.r` | `:691` |
| Get API key button | `OutlinedButton.icon`, maxWidth `320.r`, min size `(infinity, 32.r)`, side `primary@0.6`, radius `8.r`; icon `Symbols.key_rounded` `14.r`; label `raGetApiKey` "Get API Key" (`en:1189`) `11.r w600`; opens `https://retroachievements.org/settings?tab=applications` externally | `:695-728,222-229` |
| Gap | `4.r` | `:729` |
| Help text | `raApiKeyHelp` "Open your RetroAchievements control panel to copy your personal Web API key." (`en:1190`), centred, `bodySmall` `8.r onSurface@0.65` | `:730-737` |
| Gap | `6.r` | `:738` |
| Login button | full width, height `32.r`, `ElevatedButton` bg `primary`, fg `onPrimary`, radius `8.r`, elevation 0, padding zero; label `login` "Login" (`en:385`) `14.r bold`; while loading: `16.r` spinner stroke `2` in `onPrimary`, button disabled | `:741-789` |

Focus highlight (slot selected): fields get an outer glow `BoxShadow(primary@0.35, blur 6.r, spread 1.r)` in a radius `8.r` container plus the `2.r primary` enabled border (`lib/screens/retro_achievements_screen/ra_content.dart:488-507`); Get API key glow `primary@0.35 blur 8.r spread 1.r` (`:697-710`); Login glow `primary@0.5 blur 8.r spread 2.r` (`:743-754`).

##### Info box (`lib/screens/retro_achievements_screen/ra_content.dart:795-917`)

| Element | Spec | Citation |
| --- | --- | --- |
| Box | padding `16.r`, `cardColor@0.25`, radius `12.r`, border `primary@0.2` width `1` | `:797-806` |
| Header | `Symbols.emoji_events_rounded` `24.r primary`; gap `12.r`; `raWhatIs` "What is RetroAchievements?" (`en:727`) `titleMedium` bold `primary` `14.r` | `:810-829` |
| Gap | `6.r` | `:830` |
| Description | `raDescription` "RetroAchievements is a community effort to provide achievements for classic games using emulators." (`en:728`), `bodyMedium` `8.r onSurface@0.9` | `:831-838` |
| Gap | `6.r` | `:839` |
| Bullets (each padding bottom `8.r`; icon `12.r primary@0.7`; gap `8.r`; text `bodySmall 8.r onSurface@0.8`) | `star_outline_rounded` `raEarnPoints` "Earn hardcore points and showcase them" (`en:730`); `public_rounded` `raGlobalLeaderboards` "Global leaderboards and rankings" (`en:731`); `history_rounded` `raGameplayHistory` "Detailed gameplay history and progress" (`en:732`) | `:840-854,892-917` |
| Gap | `6.r` | `:855` |
| Footer rich text | italic `bodySmall 8.r onSurface@0.6`: `raCreateAccountAt` "Create an account at " (`en:733`) + "retroachievements.org" (`primary`, underlined, tappable) + `raToStartEarning` " to start earning." (`en:734`) | `:856-886` |

##### Signed-out button map

Slots: `[usernameFocus, apiKeyFocus, null (Get API Key), null (Login)]`; submit slot = 3 (`lib/screens/retro_achievements_screen/ra_content.dart:63-68`, `lib/utils/login_form_selection.dart:44`). Default slot 0.

| Button | Action | Citation |
| --- | --- | --- |
| Up / Down | move slot -1/+1, **wraps**; refused while a text field has focus | `lib/screens/retro_achievements_screen/ra_content.dart:246-249,262-264`, `lib/utils/login_form_selection.dart:80-88` |
| Left / Right | nothing when signed out | `lib/screens/retro_achievements_screen/ra_content.dart:288-289,300-302` |
| A | slot 0/1: focus the field (OS keyboard); slot 2: open RA control panel URL; slot 3: connect | `lib/screens/retro_achievements_screen/ra_content.dart:124-129` |
| B | unfocus text field (only); otherwise nothing | `lib/screens/retro_achievements_screen/ra_content.dart:102`, `lib/utils/login_form_selection.dart:69-71` |
| LB / RB | previous / next tab | `lib/screens/retro_achievements_screen/ra_content.dart:96-99` |
| X, Y, Start | not bound | `lib/screens/retro_achievements_screen/ra_content.dart:90-103` |
| Select | not bound - global notification bell | `lib/screens/retro_achievements_screen/ra_content.dart:90-103` |
| Repeat | `allowRepeat: false` (no hold-repeat) | `lib/screens/retro_achievements_screen/ra_content.dart:100` |

Connect results (notifications): empty fields -> `pleaseCompleteAllFields` "Please complete all fields" (`en:755`, error); success -> `successConnectedRA` "Successfully connected to RetroAchievements!" (`en:750`), or `credentialStorageUnavailable` (`en:751`, info) when not persisted; failure -> provider error text (`lib/screens/retro_achievements_screen/ra_content.dart:180-220`).

#### Signed in - dashboard

Offline banner (only `raProvider.isOffline`) sits above an `Expanded(RepaintBoundary(RADashboardHub))` (`lib/screens/retro_achievements_screen/ra_content.dart:431-444`).

| Offline banner | Spec | Citation |
| --- | --- | --- |
| Box | margin `h 16.r` + bottom `8.r`; padding `h 12.r / v 8.r`; bg `secondaryContainer@0.35`; radius `10.r`; border `secondary@0.3` `1.r` | `lib/screens/retro_achievements_screen/ra_content.dart:455-465` |
| Content | `Symbols.cloud_off_rounded` `18.r secondary`; gap `10.r`; `raOfflineBanner` "Offline [U+2014] showing your last synced achievements. Retrying…" (`en:725`; the source string contains an em dash, written here as `[U+2014]`) `bodySmall 12.r onSecondaryContainer` | `lib/screens/retro_achievements_screen/ra_content.dart:466-484` |

Dashboard body: `SingleChildScrollView(padding bottom 16.r)` > `Column[ header, SizedBox(12.r), cards ]` (`lib/screens/retro_achievements_screen/ra_dashboard.dart:362-434`). Renders nothing when `user == null` (`:360`). Loading is deferred 300 ms after tab entry; sections fetched sequentially GOTW -> recent unlocks -> recently played -> awards -> completion progress (`lib/screens/retro_achievements_screen/ra_dashboard.dart:195-214,235-244`).

##### Breakpoint (column count)

`twoColumn = constraints.maxWidth >= 720` in raw logical px (not `.r`) (`lib/screens/retro_achievements_screen/ra_dashboard.dart:370-376`).

| Width | Layout | Citation |
| --- | --- | --- |
| < 720 | one column: week card, unlocks, masteries/completions, recently played; `12.r` gaps | `lib/screens/retro_achievements_screen/ra_dashboard.dart:391-402` |
| >= 720 | two `Expanded` columns with `12.r` gap: left = week card + recently played; right = recent unlocks + masteries/completions; `crossAxisAlignment: start` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:407-430` |

There is no achievement *grid* on this dashboard - every section is a vertical list capped at 5 items (`take(5)`, `lib/screens/retro_achievements_screen/ra_dashboard.dart:967,1016-1021,1058`). At a 640-wide window the content width is 640 - 24 = 616 logical px, so a 640x480 device gets the one-column layout (derived, not stated in source).

##### Shared card pieces

| Piece | Spec | Citation |
| --- | --- | --- |
| Card decoration | bg `cardColor.withValues(alpha: 0.25)` (overridable); radius `12.r`; border `primary.withValues(alpha: 0.15)` width `1.r` (overridable) | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1454-1468` |
| Pill | padding `h 8.r / v 4.r`; bg `color@0.12`; radius `999.r`; border `color@0.22` (default width); icon `10.r color`; gap `4.r`; label `8.r w700 color` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1344-1373` |
| Section header | icon `18.r primary`; gap `8.r`; title `titleSmall` bold `primary` `11.r`; optional trailing `bodySmall 8.r onSurface@0.58` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1311-1342` |
| Loading state | box of `minHeight`, centred `22.r` spinner stroke `2.2` `primary` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1375-1392` |
| Section message | box of `minHeight`, centred text `bodySmall 9.r`, `error` or `onSurface@0.6`; optional `TextButton` `retry` "Retry" (`en:10`) after `8.r` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1394-1429` |
| Thumb | `40.r x 40.r`, radius `8.r`, `BoxFit.cover`; fallback icon `18.r primary` on `surface` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1431-1452` |
| Date format | `YYYY-MM-DD` local | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1475-1482` |
| Media URLs | relative paths prefixed `https://media.retroachievements.org`; avatar `https://retroachievements.org${userPic}` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1470-1473,482` |

##### Profile header (`lib/screens/retro_achievements_screen/ra_dashboard.dart:440-580`)

| Element | Spec | Citation |
| --- | --- | --- |
| Container | padding `h 14.r / v 12.r`, card decoration | `:464-466` |
| Avatar | `48.r` circle, border `primary@0.28` `2.r`, `ClipOval`; fallback `account_circle_rounded` `28.r primary` | `:469-496` |
| Gap | `12.r` | `:497` |
| Username | 1 line ellipsis, `titleMedium` bold `14.r` | `:502-510` |
| Gap | `4.r` | `:511` |
| Pills `Wrap(spacing 8.r, runSpacing 6.r)` | `shield_rounded` userType (`primary`); `stars_rounded` "{totalPoints} pts" (`raPointsAbbrev` "pts" `en:1165`, `primary`); `sports_esports_rounded` `raGamesPlayed` "{count} games played" (`en:1207`, count = completionProgress.total, `primary`); `flag_rounded` `raGamesBeaten` "{count} games beaten" (`en:1208`, `secondary`); `workspace_premium_rounded` "{n} Masteries" / "{n} Completions" (`raMasteriesLabel` `en:1164` / `raCompletionsLabel` `en:1163`) | `:512-553` |
| Highlight colour | casual user: completions, `#757575` (light) / `#C0C0C0` (dark); hardcore: masteries, `#B8860B` (light) / `#FFD700` (dark); beaten count uses casual vs hardcore awards to match | `:446-462` |
| Logout button | container radius `8.r`, border `2.r` = `primary` when `logoutSelected` else transparent; `IconButton` `Symbols.logout_rounded` `20.r` `scheme.error`; tooltip `logout` "Logout" (`en:369`) | `:557-576` |

##### Achievement of the week card (`lib/screens/retro_achievements_screen/ra_dashboard.dart:582-740`)

| Element | Spec | Citation |
| --- | --- | --- |
| Accent | earned this week: status colour; else owned locally: `secondary`; else `primary` | `:598-602` |
| Selectable | when the game is owned locally or a RomM match exists | `:604-605,102-104` |
| Container | `InkWell` radius `12.r`; padding `14.r`; border selected `primary` `2.r`, else `accent@0.55` (earned) / `@0.35` (owned) / `@0.15`, width `1.r`; bg `cardColor@0.40` / `@0.34` / `@0.25` | `:615-639` |
| Title row | `emoji_events_rounded` `18.r accent`; gap `8.r`; `aotw` "ACHIEVEMENT OF THE WEEK" (`en:740`) `titleSmall 11.r bold accent`; trailing status pill, or `16.r` spinner (stroke `2.r primary`) while progress loads | `:643-675` |
| Gap | `12.r` | `:676` |
| Body states | loading -> loading state `138.r`; error -> message + Retry `138.r`; none -> `raAotwNoActive` "No current Achievement of the Week" (`en:1195`) `138.r`; else details | `:677-694` |
| Details | badge `72.r x 72.r` radius `10.r` (fallback trophy `30.r accent`); gap `12.r`; game title max 2 lines `titleMedium` bold `13.r`; gap `2.r`; console `bodySmall 9.r onSurface@0.7`; gap `8.r`; achievement title max 2 lines `bodyMedium 11.r w700 accent`; gap `4.r`; description max 3 lines `bodySmall 9.r onSurface@0.78` | `:830-906` |
| Stats | gap `12.r`; `Wrap(spacing 8.r, runSpacing 8.r)` pills in accent: `stars_rounded` "{points} pts"; `monitoring_rounded` "{trueRatio} True Ratio" (`raAotwTrueRatio` `en:1203`); `groups_rounded` participation `raAotwParticipation` "{unlocks} of {players} players · {percent}%" (`en:1204`) or "{n} Unlocks" (`unlocks` `en:742`) when players <= 0; `calendar_today_rounded` `raAotwWeekStarted` "Week started {date}" (`en:1202`) if a start date | `:695-731,948-961` |
| Library action | gap `10.r`; owned: label `play_circle_rounded` `raAotwOpenLocalGame` "Open local game" (`en:1205`); RomM lookup: `progress_activity_rounded` `rommSearching` "Searching RomM..." (`en:1081`); no match: `inventory_2_rounded` `raAotwNotInLibrary` "Not in your library" (`en:1201`); label = icon `14.r` + gap `6.r` + text `bodySmall 8.r w700`, both `color@0.92` | `:732-733,742-828` |
| RomM download button | `OutlinedButton.icon`, fg accent, text `bodySmall 8.r w700`, padding `h 10.r / v 7.r`; icon `download_rounded` `15.r` or `14.r` progress ring (stroke `2.r`, value = fraction); label `raAotwDownloadFromRomm` "Download from RomM" (`en:1206`) or `rommDownloading` "Downloading..." (`en:1089`) | `:774-804` |

Status pill (`lib/screens/retro_achievements_screen/ra_dashboard.dart:908-946`):

| State | Label | Icon | Colour |
| --- | --- | --- | --- |
| earnedHardcoreThisWeek | `raAotwEarnedHardcore` "Earned this week · Hardcore" (`en:1196`) | `verified_rounded` | `#9A6700` light / `#FFD700` dark |
| earnedCasualThisWeek | `raAotwEarnedCasual` "Earned this week · Casual" (`en:1197`) | `verified_rounded` | `#666666` light / `#C0C0C0` dark |
| earnedBeforeWeek | `raAotwEarnedPreviously` "Earned before this week" (`en:1198`) | `history_rounded` | `tertiary` |
| notEarned | `raAotwNotEarned` "Not earned this week" (`en:1199`) | `flag_rounded` | `primary` |
| unknown | `raAotwStatusUnavailable` "Personal status unavailable" (`en:1200`) | `help_rounded` | `onSurface@0.68` |

##### List cards

| Card | Header | Rows | Empty / sizes | Citation |
| --- | --- | --- | --- | --- |
| Recent Unlocks | `notifications_active_rounded`, `raRecentUnlocks` "Recent Unlocks" (`en:1166`), trailing `raRecent30Days` "30 days" (`en:1210`); gap `12.r` | up to 5: thumb (badge), gap `10.r`, title `bodyMedium w700 10.r` 1 line, gap `3.r`, "{game} • {console}" `bodySmall 8.r onSurface@0.65`; gap `8.r`; right column "{points} pts" `9.r primary w700`, gap `3.r`, date `8.r onSurface@0.6`; row padding bottom `10.r` | `raNoRecentUnlocks` "No recent unlocks in the last 30 days" (`en:1192`), min height `138.r` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:963-1006,1121-1191` |
| Recent Masteries (hardcore) / Recent Completions (casual) | `workspace_premium_rounded`, `raRecentMasteries` "Recent Masteries" (`en:1168`) / `raRecentCompletions` "Recent Completions" (`en:1167`); trailing "{total} tracked games" (`raTrackedGames` `en:1171`); gap `10.r` | thumb (icon fallback `military_tech_rounded`), title, "{console} • {awardType}", trailing pill `workspace_premium_rounded` `raMasteryLabel` "Mastery" (`en:1173`) gold or `raCompletionLabel` "Completion" (`en:1172`) silver | `raNoMasteriesYet` "No masteries yet" (`en:1170`) / `raNoCompletionsYet` "No completions yet" (`en:1169`), min height `120.r` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1008-1052,1072-1119,1246-1309` |
| Recently Played | `history_rounded`, `raRecentlyPlayedTitle` "Recently Played" (`en:1193`); gap `10.r` | thumb (fallback `videogame_asset_rounded`), title, "{console} • {earned}/{total} achievements" (`raAchievementProgress` `en:1209`), trailing last-played date `8.r onSurface@0.6` | `raNoRecentlyPlayed` "No recently played games" (`en:1194`), min height `120.r` | `lib/screens/retro_achievements_screen/ra_dashboard.dart:1054-1070,1193-1244` |

##### Signed-in button map

Nothing is selected at rest (`lib/screens/retro_achievements_screen/ra_content.dart:40-47`).

| Button | Action | Citation |
| --- | --- | --- |
| Up | clears week-card selection; scroll dashboard by `-160.r` (animate 180 ms `Curves.easeOutCubic`) | `lib/screens/retro_achievements_screen/ra_content.dart:246-252,364-378` |
| Down | if nothing selected, card selectable and at top: select week card; else clear week card and scroll `+160.r` | `lib/screens/retro_achievements_screen/ra_content.dart:262-273` |
| Right | select logout (clears week card); first scrolls to top (220 ms `Curves.easeOutCubic`) | `lib/screens/retro_achievements_screen/ra_content.dart:288-294,350-362` |
| Left | from logout: step to week card if selectable (scroll to top), else just clear logout | `lib/screens/retro_achievements_screen/ra_content.dart:300-309` |
| A | on logout: open confirm dialog; on week card: owned -> push `SystemGamesList(initialRomPath)`, RomM match -> download (A again while downloading cancels); otherwise nothing | `lib/screens/retro_achievements_screen/ra_content.dart:112-123,311-334`, `lib/screens/retro_achievements_screen/ra_dashboard.dart:91-100,132-141` |
| B | only unfocuses a text field; nothing on the dashboard | `lib/screens/retro_achievements_screen/ra_content.dart:102` |
| LB / RB | previous / next tab | `lib/screens/retro_achievements_screen/ra_content.dart:96-99` |
| X, Y, Start, LT, RT | not bound | `lib/screens/retro_achievements_screen/ra_content.dart:90-103` |
| Select | global notification bell | - |
| Scrolling | any scroll away from top (>1 px) clears logout / week-card selection | `lib/screens/retro_achievements_screen/ra_content.dart:148-157` |

##### Logout confirm dialog (`ConfirmActionDialog`)

| Element | Spec | Citation |
| --- | --- | --- |
| Invocation | title `disconnectRaConfirm` "Disconnect RetroAchievements" (`en:1152`); body `disconnectRaConfirmBody` "This will sign you out and remove your saved RetroAchievements credentials from this device." (`en:1153`); confirm `logout` "Logout"; icon `logout_rounded` | `lib/screens/retro_achievements_screen/ra_content.dart:159-166` |
| Dialog | `AlertDialog`, `barrierDismissible: false`, bg `cardColor`, radius `12.r`, side `accent@0.3` (accent defaults to `scheme.error`) | `lib/widgets/confirm_action_dialog.dart:49-52,104-114` |
| Title | icon `20.r accent`; gap `8.r`; text `titleMedium 14.r w600 accent` | `lib/widgets/confirm_action_dialog.dart:115-130` |
| Body | `bodyMedium 11.r onSurface@0.7` | `lib/widgets/confirm_action_dialog.dart:131-137` |
| Cancel | `TextButton`: `Xbox_B_button.png` `18.r` tinted `onSurface@0.6`, gap `4.r`, `cancel` "Cancel" (`en:8`) `12.r onSurface@0.6` | `lib/widgets/confirm_action_dialog.dart:139-163` |
| Confirm | `ElevatedButton` bg accent, fg `onError` (or `onPrimary` for a non-error accent), padding `h 16.r / v 8.r`, radius `6.r`; `Xbox_A_button.png` `18.r`, gap `4.r`, label `12.r w600` | `lib/widgets/confirm_action_dialog.dart:164-197` |
| Buttons | A = confirm (pop true), B = cancel (pop false); no dpad focus between the two buttons | `lib/widgets/confirm_action_dialog.dart:74-81` |
| After confirm | `disconnect(clearSavedUser: true)`, selection reset, notification `disconnectedRA` "Disconnected from RetroAchievements" (`en:736`) | `lib/screens/retro_achievements_screen/ra_content.dart:167-177` |

### NeoSync tab

Files (all under `lib/screens/neo_sync_screen/login_screen/` unless noted): `neo_sync_content.dart` (shell + dashboard + signed-out info box), `lib/widgets/auth_form.dart` (login/register form), `save_list_view.dart`, `custom_save_folders_view.dart`, `custom_save_folders_panel.dart` (dialog), `plan_selection_view.dart`, `neo_sync_shared.dart` (back/logout buttons, section header), `neo_sync_dialogs.dart` (delete / success / error dialogs), `lib/widgets/core_footer.dart` (`GamepadControl` footer pill), `lib/themes/corner_radii.dart`.

Sections: `dashboard`, `saveList`, `customFolders`, `plans`; the shell swaps them in place (no route push) (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:33,240-242,426-447`). Signed-in content is wrapped in a transparent `Scaffold` (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:418-421`).

Not wired into the tab (dead code, zero call sites found): `NeoSyncControlsWidget` (`lib/widgets/neo_sync_controls_widget.dart`), `ProfileWidget` (`lib/widgets/profile_widget.dart`), `StorageInfoCard` (`lib/widgets/storage_info_card.dart`). `QuotaExceededDialog` is only reachable via `NeoSyncCore.showQuotaExceededDialog`, which has no callers (`lib/providers/neosync/neosync_core.dart:256-277`). `NeoSyncStatusIcon` is used by the game list, not this tab (`lib/screens/game_screen/game_list_view.dart:499`). All are summarised at the end of this section.

#### Shared pieces

| Piece | Spec | Citation |
| --- | --- | --- |
| `CornerRadii` tokens | theme extension; fallback `CornerRadii.m()` = external `14.r`, internal `10.r`; other presets zero 0/0, xs 3/2, s 8/5, l 16/12, xl 24/20 (all `.r`) | `lib/themes/corner_radii.dart:27-58` |
| `GamepadControl` (footer pill) | `InkWell` radius `radiusInternal` (fallback `6.r`); padding `h 6.r / v 4.r`; bg = given colour (default `onSurface@0.1`); border `lightenColor(bg, 0.05)` `1.r`; shadow `shadow@0.1 blur 4.r offset (2.r, 2.r)`; glyph image `18.r x 18.r` tinted content colour (or `12.r` icon, or `14.r` spinner stroke `2.r` when busy); gap `4.r`; label `12.r w600` letterSpacing `0.2.r`; trailing gap `4.r` | `lib/widgets/core_footer.dart:121-226` |
| `NeoSyncBackButton` | `GamepadControl` `Xbox_B_button.png`, `back` "Back" (`en:6`), bg `tertiary`, text `onTertiary`; plays back SFX | `lib/screens/neo_sync_screen/login_screen/neo_sync_shared.dart:12-31` |
| `NeoSyncLogoutButton` | `GamepadControl` `Xbox_X_button.png`, `logout` "Logout" (`en:369`), bg `error`, text `onError` | `lib/screens/neo_sync_screen/login_screen/neo_sync_shared.dart:37-56` |
| `NeoSyncSectionHeader` | outer padding `10.r`, `surface`, radius `radiusExternal`, border `outline` `1.r`, shadow `shadow@0.1 blur 4.r offset (2.r,2.r)`; inner `ClipRRect(radiusInternal)` padding `h 10.r / v 8.r`, `LinearGradient(topLeft->bottomRight, primary@0.15 -> primary@0.05)`; row: icon `18.r primary`, gap `8.r`, title `titleSmall bold 13.r onSurface` ellipsis, optional subtitle after `2.r` `bodySmall 8.r onSurface@0.6`, optional trailing | `lib/screens/neo_sync_screen/login_screen/neo_sync_shared.dart:64-150` |
| Sub-view frame | `Padding(top 52.r, left 8.r, right 8.r, bottom 8.r)` | `lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:451`, `lib/screens/neo_sync_screen/login_screen/save_list_view.dart:757-762`, `lib/screens/neo_sync_screen/login_screen/plan_selection_view.dart:226`, `lib/screens/neo_sync_screen/login_screen/custom_save_folders_view.dart:293` |
| Content panel | padding `12.r` (`6.r` for save list); `cardColor@0.25`; radius `12.r`; border `primary@0.15` `1.r` | `lib/screens/neo_sync_screen/login_screen/plan_selection_view.dart:237-246`, `lib/screens/neo_sync_screen/login_screen/save_list_view.dart:775-786`, `lib/screens/neo_sync_screen/login_screen/custom_save_folders_view.dart:320-329` |

#### Signed out (first visit)

Layout: `Column[ SizedBox(64.r), horizontal SingleChildScrollView > Padding(h 16.r) > Row(center, start, min)[ AuthForm (maxWidth 260.r), SizedBox(16.r), info box (width 300.r) ] ]` (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:391-415`). The row is not wrapped in `Center` (unlike RA), so with a narrow total width it starts at the left padding (derived).

##### AuthForm (`lib/widgets/auth_form.dart`)

Card: `SingleChildScrollView > Center > maxWidth 260.r`; padding `16.r`; bg `scaffoldBackgroundColor`; radius `12.r`; border `primary@0.2` width `1` (`lib/widgets/auth_form.dart:596-621`). Title `titleMedium` bold `primary` `14.r` (`:629-650`), then `12.r` gap (`:651`).

Titles by mode (`lib/widgets/auth_form.dart:633-641`): login `neoSyncLogin` "NeoSync Login" (`en:363`); register `joinNeoSync` "Join NeoSync" (`en:375`); forgot `forgotPassword` "Forgot Password" (`en:373`); reset `resetPassword` "Reset Password" (`en:374`); token verification `verifyEmail` "Verify Email" (`en:372`); the email-verification (resend) mode keeps the login/register title.

Input decoration (all fields) (`lib/widgets/auth_form.dart:1035-1080`): label `10.r onSurface@0.7`, floating `10.r bold primary`, hint `10.r onSurface@0.4`, contentPadding `h 12.r / v 8.r`, fill `onSurface@0.05`, radius `8.r`, enabled border `primary` `2.r` when highlighted else `primary@0.1` `1.r`, focused border `primary` `1.r`. Field text `11.r` (reset token `10.r`, `:1132`). Every field capped at maxWidth `220.r`; highlighted field glow `primary@0.35 blur 6.r spread 1.r` radius `8.r` (`:897-920`).

Login mode, top to bottom (`lib/widgets/auth_form.dart:716-877`):

| Slot | Element | Spec |
| --- | --- | --- |
| 0 | Email field | height `32.r`; label `email` "Email" (`en:382`); hint literal `you@example.com`; prefix icon arg `Symbols.email_rounded` (passed but not used by `_buildInputDecoration`, which never sets `prefixIcon`) (`:749-779,1035-1080`) |
| - | gap `6.r` | `:780` |
| 1 | Password field | height `32.r`; obscured; label `password` "Password" (`en:383`); hint `enterPassword` "Enter your password" (`en:384`); suffix eye `visibility_rounded`/`visibility_off_rounded` `18.r onSurface@0.5` (`:781-828`) |
| - | gap `6.r`; message box if any, then `8.r` | `:829-834` |
| 2 | Login button | full width, height `32.r`, bg `primary`, fg `onPrimary`, radius `8.r`, elevation 0; `login` "Login" (`en:385`) `14.r bold`; loading shows `16.r` spinner stroke `2` `white@0.8`; selected glow `primary@0.5 blur 8.r spread 2.r` (`:836-843,923-975`) |
| - | gap `6.r` | `:846` |
| 3 | Mode link | box height `24.r`; `TextButton` zero padding; `dontHaveAccount` "Don't have an account? Sign Up" (`en:387`) `8.r` `secondary@0.9`; selected = border `primary@0.6` `1.r` radius `6.r` (`:852-864,978-1016`) |
| - | gap `6.r` | `:865` |
| 4 | Forgot link | height `24.r`; `forgotPasswordQuestion` "Forgot Password?" (`en:411`) `8.r secondary@0.9` (`:866-877`) |

Register mode adds slot 0 Username (height `32.r`, label `username` "Username" `en:380`, hint `chooseUsername` "Choose a username" `en:381`) and shifts email/password/submit to 1/2/3; submit label `signUp` "Sign Up" (`en:386`); link slot 4 `alreadyHaveAccount` "Already have an account? Login" (`en:388`); no forgot link (`lib/widgets/auth_form.dart:718-748,838-843,856-860`).

Forgot-password mode: slot 0 email (hint `enterRegisteredEmail` "Enter your registered email" `en:413`), gap `16.r`, message + `12.r`, slot 1 `sendResetToken` "Send Reset Token" (`en:414`), then gap `6.r` and slot 2 `backToLogin` "Back to Login" (`en:379`) `8.r` (`lib/widgets/auth_form.dart:1082-1121,878-889`).

Reset-password mode: slot 0 `resetTokenLabel` "Reset Token" (`en:415`, hint `enterTokenFromEmail` "Enter the token from your email" `en:377`), gap `12.r`, slot 1 `newPassword` "New Password" (`en:416`, hint `atLeast8Characters` "at least 8 characters" `en:417`), gap `16.r`, slot 2 `resetPassword` "Reset Password", slot 3 "Back to Login" (`lib/widgets/auth_form.dart:1123-1194,878-889`).

Email-verification mode (after register, or login with unverified email): message box, `8.r` gap, slot 0 `resendVerificationEmail` "Resend Verification Email" (`en:378`, `10.r`), slot 1 `backToLogin` (`10.r`) (`lib/widgets/auth_form.dart:687-715`). Polls every 15 s, first check after 3 s (`:392-411`).

Message box: full width, padding `10.r`, bg `primary@0.1`, radius `8.r`, text `primary` `9.r` centred (`lib/widgets/auth_form.dart:1018-1033`).

Form validation strings: `pleaseEnterUsername` "Please enter username" (`en:389`), `pleaseEnterEmail` "Please enter email" (`en:390`), `pleaseEnterValidEmail` "Please enter a valid email" (`en:391`), `pleaseEnterPassword` "Please enter password" (`en:392`), `passwordTooShort` "Password must be at least 8 characters" (`en:393`) (`lib/widgets/auth_form.dart:736-825`).

AuthForm buttons (`lib/widgets/auth_form.dart:111-202`; layer `auth_form` pushed one frame after NeoSyncContent's so it sits on top, `:96-102`):

| Button | Action |
| --- | --- |
| Up / Down | move slot, **wraps**; refused while a field is focused (`lib/utils/login_form_selection.dart:80-88`) |
| Left / Right | not bound |
| A | on a field: focus it (OS keyboard); on a control: run it (submit / toggle register / open forgot / send token / reset / resend / back) (`:132-169`) |
| B | unfocus field first; else in forgot/reset/verification modes go back to login; in login/register nothing (`:191-202`) |
| LB / RB | previous / next tab (`:116-119`) |
| X, Y, Start | not bound on the auth layer |
| Repeat | `allowRepeat: false` (`:120`) |

##### Signed-out info box (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:977-1101`)

| Element | Spec |
| --- | --- |
| Box | padding `16.r`, bg `scaffoldBackgroundColor`, radius `12.r`, border `primary@0.2` width `1` (`:979-988`) |
| Header | `Symbols.cloud_rounded` `24.r primary`; gap `12.r`; `whatIsNeoSync` "What is NeoSync Cloud?" (`en:437`) `titleMedium` bold `primary` `14.r` (`:992-1011`) |
| Body | gap `6.r`; `neoSyncDescription` (`en:438`) "NeoSync is your unified cloud companion for NeoStation. It securely synchronizes your game saves, and game states across all your devices, ensuring your progress is never lost." `bodyMedium 8.r onSurface@0.9` (`:1012-1020`) |
| Bullets | gap `6.r`; each padding bottom `8.r`, icon `12.r primary@0.7`, gap `8.r`, text `bodySmall 8.r onSurface@0.8`: `cloud_upload_rounded` `neoSyncSavesSync` "Save files will be synced with NeoSync" (`en:367`); `devices_rounded` `crossPlatformDesc` "Pick up exactly where you left off on any device running NeoStation." (`en:441`); `security_rounded` `securePrivateDesc` "Your data is encrypted and only accessible by you." (`en:444`) (`:1021-1036,1076-1101`) |
| Footer | gap `6.r`; italic `bodySmall 8.r onSurface@0.6`: `learnMoreEcosystem` "Learn more about the ecosystem at " (`en:446`) + "neosync.cloud" (`primary`, underlined, opens `https://neosync.cloud`) (`:1037-1067`) |

#### Signed in - dashboard

`Padding(top 52.r, left 8.r, right 8.r, bottom 8.r)` > `Column(stretch)[ save-sync owner notice, Expanded(Row(start)[ SizedBox(width 240.w, header card), SizedBox(12.r), Expanded(menu list) ]), SizedBox(8.r), Align(centerRight, NeoSyncLogoutButton) ]` (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:449-483`). Note the header width is `240.w` (width-scaled), everything else `.r`.

Data load on first signed-in build: profile, quota, online files (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:320-340,380-389`); plans loaded in `initState` and sorted free, micro, mini, mega, ultra (`:72-96`).

##### Save-sync owner notice (only when NeoSync is not the active save-sync provider)

| Element | Spec | Citation |
| --- | --- | --- |
| Visibility | hidden when `activeProviderId == NeoSyncAdapter.kProviderId` | `lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:497-499` |
| Box | padding bottom `8.r`; inner padding `h 10.r / v 8.r`; bg `tertiary@0.12`; radius `radiusExternal`; border `tertiary@0.5` `1.r` | `:511-522` |
| Content | `Symbols.info_rounded` `16.r tertiary`; gap `8.r`; text `11.r onSurface`, max 2 lines ellipsis | `:523-541` |
| Text | owner signed in: `saveSyncHandledBy` "Save sync is handled by {provider}" (`en:1057`) + " · " + `saveSyncSingleProvider` "Only one provider syncs saves at a time" (`en:1058`); else `saveSyncNoneActive` "No save sync active" (`en:1059`) | `:507-510` |

##### Header card (left, `240.w`) (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:550-720`)

| Element | Spec | Citation |
| --- | --- | --- |
| Outer | padding `8.r`, `surface`, radius `radiusExternal`, border `outline` `1.r`, shadow `shadow@0.1 blur 4.r offset (2.r,2.r)` | `:557-570` |
| Inner | `ClipRRect(radiusInternal)`, padding `10.r`, gradient topLeft->bottomRight `primary@0.18` -> `primary@0.04` | `:571-584` |
| Greeting | `helloUser` "Hello, {name}!" (`en:412`), `titleMedium` bold `13.r onSurface`, ellipsis | `:589-599` |
| Plan badge | gap `3.r`; padding `h 7.r / v 2.r`; bg `secondary`; radius `6.r`; `storage_rounded` `9.r onSecondary`; gap `3.r`; text "{PLAN} {QUOTA}" (`quota` "Quota" `en:681`, uppercased) `7.r bold onSecondary` | `:600-627` |
| Quota row (if quota) | gap `10.r`; spaceBetween: used (`bodySmall 8.r w600 onSurface@0.8`), percent "x.x%" (`8.r bold`, `Colors.red.shade400` if >= 90 else `primary`), total (same as used) | `:629-665` |
| Quota bar | gap `4.r`; height `8.r`; track `surfaceContainerHighest@0.5` radius `4.r`; `LinearProgressIndicator` value = pct/100, fill `Colors.red.shade400` (>=100) / `Colors.orange.shade400` (>=90) / `primary` | `:666-689` |
| Stat tiles | gap `10.r`, then 3 tiles separated by `6.r`: `cloud_rounded` "{onlineTotal}" / `onlineSaves` "Online Saves" (`en:435`); `storage_rounded` "{pct}%" (0 dp) or "[U+2014]" (a literal em dash placeholder) / `storageLabel` "Storage" (`en:476`); last-synced save tile | `:691-714` |
| Stat tile | padding `h 8.r / v 5.r`; bg `surface@0.7`; radius `8.r`; border `primary@0.2` `1.r`; icon `12.r primary`; gap `6.r`; value `11.r bold onSurface`; label `7.r onSurface@0.6` | `:722-769` |
| Last-synced tile | same box; thumb `24.r x 24.r` radius `6.r` bg `primary@0.1`, image `https://media.neosync.cloud/games/{gameHash}.webp` cover, fallback `videogame_asset_rounded` `12.r primary`; gap `6.r`; name (gameName or fileName, or "[U+2014]" (a literal em dash placeholder)) `9.r bold onSurface` 1 line; label `lastSyncedSave` "Last synced save" (`en:477`) `7.r onSurface@0.6` | `:775-861` |

##### Menu list (right) (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:863-975`)

| # | Icon | Title | Subtitle |
| --- | --- | --- | --- |
| 0 | `cloud_rounded` | `saveListMenu` "Save List" (`en:478`) | `onlineSaves` "Online Saves" (`en:435`) |
| 1 | `folder_special_rounded` | `customSaveFoldersMenu` "Standalone Save Folders" (`en:479`) | `customSaveFoldersTitle` "Standalone save folders" (`en:1213`) |
| 2 | `payment_rounded` | `updateYourPlanMenu` "Update Your Plan" (`en:480`) | `manageYourPlan` "Manage Your {plan} Plan" (`en:447`) with `{plan}` replaced by '' (reads "Manage Your  Plan") |

| Row element | Spec | Citation |
| --- | --- | --- |
| Row | `ListView.builder`; padding bottom `6.r`; `Material` colour selected `secondary@0.12` else `surface`; radius `radiusExternal` (fallback `14.r`) | `:885-900` |
| Box | padding `h 12.r / v 8.r`; border selected `secondary@0.6` `2.r`, else `outline` `1.r` | `:908-918` |
| Icon chip | padding `6.r`, bg `primary@0.1`, radius `8.r`; icon `18.r`, `secondary` when selected else `primary` | `:921-934` |
| Text | gap `10.r`; title `titleSmall bold 12.r onSurface`; gap `1.r`; subtitle `bodySmall 9.r onSurface@0.6` | `:935-960` |
| Chevron | `chevron_right_rounded` `16.r onSurface@0.4` | `:962-966` |

Footer: `NeoSyncLogoutButton` right-aligned (X glyph, "Logout", `error` bg) (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:472-477`).

##### Dashboard button map (layer `neo_sync_content`, `lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:252-293`)

| Button | Action |
| --- | --- |
| Up | previous menu row, **wraps** to last (`:254-260`) |
| Down | next row, **wraps** (`:261-266`) |
| Left / Right | not bound |
| A | open the selected section (Save List / Standalone Save Folders / Update Your Plan) (`:267-270`) |
| Y | jump straight to plans (`:273-277`) |
| X | logout (confirm dialog) (`:278-281`) |
| Start | bound to a no-op (`:282`) |
| B | not bound on the dashboard |
| LB / RB | previous / next tab (`onPreviousTab`/`onNextTab`) (`:271-272`) |
| Select | not bound - global notification bell |

Logout confirm: `ConfirmActionDialog` with `logoutConfirm` "Logout" (`en:370`), body `neoSyncLogoutConfirmBody` "This will sign you out of your NeoSync account on this device." (`en:1155`), confirm "Logout", icon `logout_rounded`; A confirms, B cancels (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:354-368`; dialog spec in the Achievements section).

#### Save List sub-view (`save_list_view.dart`)

Layer `neo_sync_save_list`; regions `search`, `filters`, `results`, `menu` (`lib/screens/neo_sync_screen/login_screen/save_list_view.dart:23,89-133`). Filters start **expanded** (`_filtersExpanded = true`, `:59`); default region `search` item 0.

Layout: `Stack[ Padding(frame) > Column(stretch)[ search row, (6.r + chip row), SizedBox(8.r), Expanded(content panel), SizedBox(6.r), footer ], filter menu overlay ]` (`lib/screens/neo_sync_screen/login_screen/save_list_view.dart:751-823`).

| Element | Spec | Citation |
| --- | --- | --- |
| Search row | `Row[ Expanded(field), SizedBox(10.r), Filters toggle ]` (no result count) | `:825-833` |
| Field | wrapper radius `12.r`, border `2.r` `primary` when focused; `TextField` text `13.r onSurface`; hint `searchSavesHint` "Search saves..." (`en:485`) `13.r onSurface@0.5`; prefix `search_rounded` `18.r`; clear-X suffix as in Search tab; contentPadding `h 12.r / v 10.r`; fill `surfaceContainerHighest@0.5`; radius `12.r` no border | `:882-955` |
| Search debounce | 400 ms, then sets provider filter query | `:731-742` |
| Filters toggle | padding `h 12.r / v 9.r`, radius `12.r`, border `2.r`; focused bg `primary@0.18` + border `primary`, else `surface@0.5` + transparent; `tune_rounded` `18.r`, gap `6.r`, `searchFilters` "Filters" `13.r w700`, gap `4.r`, chevron `16.r` (no count badge) | `:835-880` |
| Chips | `scope`, `system`, `emulator`, `sort` (always 4, no Clear) | `:153` |
| Chip | margin right `8.r`, padding `h 12.r / v 8.r`, radius `12.r`, border `2.r`, same colour rules as Search chips; single text "{Label}: {value}" `13.r w600`, `primary` when active/focused else `onSurface`; gap `4.r`; `expand_more_rounded` `16.r` | `:979-1046` |
| Chip labels | `filterScope` "Scope" (`en:489`), `filterSystem` "System" (`en:490`), `filterEmulator` "Emulator" (`en:491`), `filterSort` "Sort" (`en:492`); unset value `filterAll` "All" (`en:486`); scope values `scopePerGame` "Per-Game" (`en:497`) / `scopeMemCards` "MemCards" (`en:498`); sort shows raw "{sort} {dir}" e.g. "modified desc" | `:491-517` |
| Sort active | active when not `modified`/`desc` | `:990-992` |

Filter menu overlay (`lib/screens/neo_sync_screen/login_screen/save_list_view.dart:1048-1156`):

| Element | Spec |
| --- | --- |
| Scrim | `black@0.6`, tap = cancel |
| Panel | centred; width `340.r`; `surface`; radius `16.r`; border `primary@0.4` `1.r` |
| Title | `key.toUpperCase()` (e.g. "SCOPE"), padding `12.r`, `13.r w700 onSurface`; then `Divider(height 1.r)` |
| List | fixed height `260.r`, `itemExtent 44.r` |
| Option | padding `h 16.r / v 8.r`; selected bg `primary@0.18`; bottom border `outline@0.1` `0.5.r`; text `13.r`, `w700 primary` when selected else `w500 onSurface`; selected `check_rounded` `16.r primary` |
| Options | scope: All / `filterPerGameSaves` "Per-Game Saves" (`en:487`) / `filterMemoryCards` "Memory Cards" (`en:488`); system / emulator: All + provider lists; sort: `sortNewest` "Newest" (`en:493`), `sortOldest` "Oldest" (`en:494`), `sortNameAsc` "Name A–Z" (`en:495`), `sortNameDesc` "Name Z–A" (`en:496`) (`:426-489`) |
| Behaviour | unlike Search, the menu has its own cursor (no live preview); A applies; menu scroll centres selection 140 ms `Curves.easeOut` (`:357-406,532-545`) |

Content panel: loading -> centred `CircularProgressIndicator`; empty -> `cloud_off_rounded` `48.sp onSurface@0.5`, gap `8.r`, `16.r onSurface@0.7` text `noSavesMatchFilters` "No saves match the filters" (`en:500`) if the account has saves, else `noOnlineSavesFound` "No online saves found" (`en:436`); else `OnlineSavesListView`; then pagination (`lib/screens/neo_sync_screen/login_screen/save_list_view.dart:787-808,1241-1270`).

Pagination (only when >1 page): padding top `2.r`; `chevron_left_rounded` / `chevron_right_rounded` `16.r` compact `IconButton`s around `pageOf` "Page {current} of {total}" (`en:499`) `10.r onSurface@0.7` (`lib/screens/neo_sync_screen/login_screen/save_list_view.dart:1196-1239`). Touch only - no gamepad binding for paging found.

Save rows (`OnlineSavesListView`, `lib/screens/neo_sync_screen/login_screen/save_list_view.dart:1281-1670`):

| Element | Spec |
| --- | --- |
| List | `ListView.builder` padding `v 4.r / h 4.w`; centred scrolling via `CenteredScrollController(centerPosition: 0.5)` (`:1310,1431-1435`) |
| Selection highlight | separate layer: `Positioned(top = sel*(56.r+4.r) + 4.r - scroll, left 4.r, right 4.r, height 56.r)`, `secondary` fill, radius `12.r`; drawn whatever region has focus (`:1396-1427`) |
| Highlight motion | tween 250 ms (120 ms while holding), scroll 360 ms (180 ms while holding), `Curves.easeOutQuart` (`:1343-1373`) |
| Row | height `56.r`, margin bottom `4.r`, padding `6.r`, radius `12.r`, border `outline@0.2` `0.5.r` (transparent when selected) (`:1539-1553`) |
| Thumb | `44.r x 44.r`, radius `10.r`, border `outline@0.25` `0.5.r`, shadow `black@0.2 blur 2.r offset (1.r,1.r)`, image `https://media.neosync.cloud/games/{gameHash}.webp`; loading `14.r` spinner; fallback `save_rounded` `22.r` on `primary@0.1` (selected: `onSecondary@0.2` bg, `onSecondary` icon) (`:1456-1524`) |
| Title | gap `8.r`; `AnimatedDefaultTextStyle` 200 ms `Curves.easeOut`, `10.r`, bold when selected else `w600`, `onSecondary` / `onSurface`; gameName or file basename (`:1557-1580`) |
| Subtitle | gap `2.r`; "{filePath} • {size}" `8.r`, `onSecondary@0.8` / `onSurface@0.6` (`:1581-1594`) |
| Badges | gap `3.r`; system (`videogame_asset_rounded`) and emulator (`memory_rounded`) badges, gap `4.r`; badge padding `h 5.r / v 1.r`, radius `4.r`, bg `onSecondary@0.15` / `primary@0.1`, icon `8.r`, gap `3.r`, text `7.r w600` (`:1595-1669`) |

Footer (right-aligned, gaps `8.r`) (`lib/screens/neo_sync_screen/login_screen/save_list_view.dart:1158-1194`): X `refresh` "Refresh" (`en:16`) / `refreshing` "Refreshing..." (`en:471`) / `refreshed` "Refreshed" (`en:472`) on `tertiaryFixed` / `onTertiaryFixed`; View(Select) glyph `Xbox_View_button.png` `delete` "Delete" (`en:14`) on `error`; B "Back" on `tertiary`.

Save List button map:

| Button | Action | Citation |
| --- | --- | --- |
| Up | menu: prev option (wrap); results: row 0 -> filters (or search), else prev row **wrapping**; filters -> search; search: none | `lib/screens/neo_sync_screen/login_screen/save_list_view.dart:238-258,554-565` |
| Down | menu: next (wrap); search -> filters (chip 0) if expanded else results; filters -> results (if any); results: next row **wrapping** | `:260-278,567-577` |
| Left / Right | menu: prev/next option; search: clamped item move; filters: chip move **wrapping**; results: jump to field / Filters toggle | `:199-236` |
| A | menu: apply; search: field focus / clear / toggle filters; filters: open menu; results: delete dialog for the selected save | `:296-314` |
| B | unfocus field; menu: cancel; results -> filters (or search item 0); filters -> search; search -> back to dashboard | `:316-335` |
| X | refresh (3 s cooldown; label shows Refreshed for 3 s) | `:112-117,675-729` |
| Y | back to dashboard | `:109-111` |
| Select | delete dialog for the selected save (500 ms throttle) | `:118,584-590` |
| Start | no-op | `:119` |
| LB / RB | previous / next tab | `:106-107` |

Delete dialog (`DeleteCloudSaveDialog`, `lib/screens/neo_sync_screen/login_screen/neo_sync_dialogs.dart:10-275`):

| Element | Spec |
| --- | --- |
| Dialog | `AlertDialog`, `barrierDismissible: false`, bg + tint `surface`, radius `12.r` (`:52-55`, `lib/screens/neo_sync_screen/login_screen/save_list_view.dart:661-670`) |
| Title | `delete_forever_rounded` `18.r error`; gap `8.r`; `deleteCloudSave` "Delete Cloud Save" (`en:466`) `15.r bold onSurface` (`:56-73`) |
| Body | `deleteCloudSaveConfirm` "Permanently delete this save file from the cloud?" (`en:467`) `12.r onSurface@0.9` height `1.3`; gap `6.r` (`:78-88`) |
| File card | padding `8.r`, bg `surfaceContainerHighest@0.2`, radius `6.r`, border `outline@0.1`; `save_rounded` `16.r primary`; gap `6.r`; file name `11.r w500`; gap `1.r`; "{size} • {YYYY-MM-DD}" `9.r onSurface@0.7` (`:89-138`) |
| Toggle card | gap `10.r`; padding `h 8.r / v 4.r`, bg `secondaryContainer@0.05`, radius `6.r`, border `secondary@0.2`; `Switch` scaled `0.7`, active thumb `secondary`, track `secondary@0.3`; gap `4.r`; `alsoDisableNeoSync` "Also disable NeoSync" (`en:469`) `12.r w500`; gap `2.r`; `preventsAutoSaves` "Prevents future auto-saves for this game." (`en:470`) `10.r onSurface@0.7` height `1.2`; trailing `SizedBox(8.h)` (`:139-203`) |
| Actions | padding right `12.r` bottom `12.r`; Cancel `TextButton` (padding `h 12.r / v 6.r`, `Xbox_B_button.png` `14.r` `onSurface@0.7`, gap `6.r`, `cancel` `12.r`); Delete `ElevatedButton` autofocus, bg `error`, fg `onError`, elevation 0, padding `h 12.r / v 6.r`, radius `8.r`, `Xbox_A_button.png` `14.r`, gap `6.r`, `delete` "Delete" `12.r bold` (`:205-272`) |
| Buttons | A = delete, B = cancel; the switch has no gamepad binding (touch only) (`:31-42`) |
| Results | `saveFileDeleted` "Save file deleted successfully" (`en:474`) / `failedToDeleteSave` "Failed to delete save file" (`en:475`) / `failedToDisableNeoSync` (`en:473`) notifications (`lib/screens/neo_sync_screen/login_screen/save_list_view.dart:605-653`) |

#### Standalone Save Folders sub-view (`custom_save_folders_view.dart`)

| Element | Spec | Citation |
| --- | --- | --- |
| Header | `NeoSyncSectionHeader` icon `folder_special_rounded`, title `customSaveFoldersTitle` "Standalone save folders" (`en:1213`), subtitle `customFoldersSubtitle` "Add a folder from a standalone emulator so its saves are synced too." (`en:481`); trailing badge padding `h 6.r / v 2.r`, bg `secondary`, radius `6.r`, `foldersConfigured` "{count} configured" (`en:484`) `8.r bold onSecondary` | `:296-317` |
| Panel | gap `8.r`; content panel (padding `12.r`) with `SingleChildScrollView`: gap `8.r`, `customSaveFolderConfiguredList` "Configured folders" (`en:1218`) `titleSmall bold 11.r`, gap `6.r` | `:318-344` |
| Empty | padding `12.r`, centred `folder_special_rounded` `40.r onSurface@0.4`, gap `8.r`, `noCustomFoldersConfigured` "No standalone folders configured" (`en:483`) `12.r onSurface@0.6` | `:345-373` |
| Row | padding bottom `6.r`; box padding `8.r`, radius `8.r`; selected bg `secondary@0.12` + border `secondary@0.6` `2.r`, else bg `primary@0.05` + border `primary@0.15` `1.r`; "{system} / {emulator}" `bodySmall bold 10.r`; gap `2.r`; path `9.r monospace onSurface@0.7` 1 line | `:375-435` |
| Footer | right-aligned, gaps `8.r`: Y `customSaveFolderConfigure` "Configure" (`en:1217`) on `tertiaryFixed`; View glyph "Delete" on `error`; B "Back" on `tertiary`; Y and Delete disabled while syncing | `:441-463` |

Buttons (`lib/screens/neo_sync_screen/login_screen/custom_save_folders_view.dart:66-89`): Up/Down move row **wrapping**; A and Y open the configure dialog; Select removes the focused folder after a `ConfirmActionDialog` (`removeCustomFolder` "Remove Folder" `en:1221`, body `removeCustomFolderConfirm` `en:1222`, icon `delete_forever_rounded`), or opens the configure dialog when the list is empty (`:102-122`); B back to dashboard; Start no-op; LB/RB tabs; Left/Right/X not bound.

Configure dialog (`CustomSaveFoldersDialog`, `lib/screens/neo_sync_screen/login_screen/custom_save_folders_panel.dart:19-229`): `AlertDialog` title `folder_special_rounded` `18.r primary`, gap `8.r`, "Standalone save folders" `titleMedium bold 13.r`; content width `340.r`: system `DropdownButtonFormField` (hint `customSaveFolderPickSystem` "Pick a system" `en:1214`, items "{realName} ({folderName})"), gap `8.r`, emulator dropdown (hint `customSaveFolderPickEmulator` "Pick an emulator" `en:1215`, standalone non-RetroArch only), gap `10.r`, full-width `FilledButton.icon` `folder_open_rounded` `14.r` + `customSaveFolderSelect` "Select folder" (`en:1216`) `11.r`; dropdown decoration dense, padding `h 10.r / v 8.r`, outline radius `8.r`, text `12.r`; actions padding `(16.r, 8.r, 16.r, 12.r)` with B `close` "Close" (`en:7`) `GamepadControl` on `tertiary`. Only B is bound on the gamepad (closes); the dropdowns are touch/focus-traversal only (`:47-54`). Folder pick: Android TV uses `TvDirectoryPicker`, else SAF picker (`lib/screens/neo_sync_screen/login_screen/custom_save_folders_view.dart:159-175`). Progress is reported through the header notification bell: `uploadingCustomFolder` "Uploading saves from {folder}..." (`en:1224`), then `customFolderUploadComplete` (`en:1225`) or `customFolderUploadFailed` (`en:1227`); invalid folder `customSaveFolderInvalid` (`en:1220`) (`:177-266`).

#### Plans sub-view (`plan_selection_view.dart`)

| Element | Spec | Citation |
| --- | --- | --- |
| Header | `NeoSyncSectionHeader` `payment_rounded`, title `manageYourPlan` "Manage Your {plan} Plan" (`en:447`) with the upper-cased plan | `:229-234` |
| Panel | gap `8.r`; content panel padding `12.r` | `:235-249` |
| Plans shown | every plan except `free`, ordered micro, mini, mega, ultra | `:53-62,184-188` |
| Loading | centred `CircularProgressIndicator(primary)`, gap `8.r`, `loadingPlans` "Loading plans..." (`en:449`) `12.r onSurface@0.7` | `:291-308` |
| Error | `error_outline_rounded` `48.r error`, gap `8.r`, message `12.r w500 error`, gap `8.r`, `ElevatedButton.icon` `refresh_rounded` `16.r` "Retry" | `:260-289` |
| Empty | `payment_rounded` `48.r onSurface@0.5`, `noPlansAvailable` "No plans available" (`en:450`), Retry | `:310-337` |
| Highlight | same layered highlight as Save List: item `64.r` + margin `8.r`, left/right `4.r`, `secondary`, radius `12.r`; tween 250 ms, scroll 360 ms, `Curves.easeOutQuart` | `:455-480,489-527` |
| Plan row | height `64.r`, margin bottom `8.r`, padding `h 12.r`; name `12.r` (bold selected / w600), `onSecondary` selected else `onSurface`; CURRENT badge (gap `6.r`, padding `h 5.r / v 1.r`, bg `primaryColor@0.15`, radius `5.r`, `currentBadge` "CURRENT" `en:452` `6.r w900` letterSpacing `0.4.r`); gap `2.r`; `cloud_rounded` `9.r` + gap `4.r` + storage `9.r`; gap `12.r`; price "${price}" `15.r bold` over "/{monthly}" (`monthly` "monthly" `en:453`) `8.r`; current plan adds gap `8.r` + `check_circle_rounded` `18.r` | `:553-673` |
| primaryColor | `onSecondary` when selected, else `primary`; secondaryColor `onSecondary@0.8` / `onSurface@0.6` | `:558-563` |
| Footer | right-aligned: A pill whose label/colour depends on the focused plan - current: `endSubscription` "End Subscription" (`en:460`) on `error`; higher rank: `upgrade` "Upgrade" (`en:455`) on `primary`; lower: `downgrade` "Downgrade" (`en:456`) on `tertiary`; gap `8.r`; B Back | `:350-384` |

Plans buttons (`lib/screens/neo_sync_screen/login_screen/plan_selection_view.dart:131-141`): Up/Down move **wrapping**; A = current plan -> cancel-subscription confirm, else checkout (`monthly`) which opens an external browser URL or refreshes the profile on in-place upgrade; B back to dashboard; Start no-op; LB/RB tabs; X/Y/Select not bound.

Cancel subscription: `ConfirmActionDialog` title/confirm `cancelSubscription` "Cancel Subscription" (`en:462`), body `cancelSubscriptionConfirm` (`en:463`), cancel label `keepSubscription` "Keep Subscription" (`en:465`), icon `cancel_rounded`; then `SuccessDialog` or `ErrorDialog` (`lib/screens/neo_sync_screen/login_screen/neo_sync_content.dart:160-236`).

Success / error dialogs (`lib/screens/neo_sync_screen/login_screen/neo_sync_dialogs.dart:278-507`): `AlertDialog` bg `surface`, radius `16.r`; title icon `check_circle_rounded` `Colors.green` / `error_rounded` `error`, `24.r`, gap `12.r`, title `18.r bold onSurface`; body `14.r onSurface@0.9` height `1.4`; one `ElevatedButton` autofocus, bg `primary`, padding `h 24.r / v 12.r`, radius `8.r`, `Xbox_A_button.png` `16.r`, gap `8.r`, `ok` "OK" (`en:9`) `14.r bold`; actions padding L/R/B `16.r`, top `8.r`; A and B both close.

#### Plan welcome / farewell modals (NeoSync notifications, not tab UI)

Shown by `NotificationService` / `AppLifecycleHandler` when the plan changes (`lib/services/notification_service.dart:90,94`, `lib/widgets/app_lifecycle_handler.dart:277,280`). `Dialog` radius `12.w`; width `0.6 x screen` max `350.w`; padding `16.w`; icon tile `40.w x 40.h` radius `20.w` bg `planColor@0.1`, icon `20.sp` (`celebration_rounded` / `sentiment_dissatisfied_rounded`); gap `12.h`; title `headlineMedium bold 16.sp planColor` (`planWelcomeTitle` "Welcome!" `en:940` / `planFarewellTitle` "Sorry to See You Go" `en:943`); gap `8.h`; rich text `bodyLarge 11.sp` (welcome: "Thank you for choosing the " + **PLAN** + " plan. Enjoy all the new features!", `en:941-942`; farewell: "We're sorry you decided to change from " + OLD + " to " + NEW + " plan. We hope to see you back soon!", `en:944-946`); farewell adds a `10.w` padded note box (radius `6.w`, border `outline@0.2`) `planUpgradeAnytime` (`en:947`) italic `10.sp`; gap `16.h`; `ElevatedButton.icon` `close_rounded` `14.sp` "Close" `11.sp` bg planColor fg white padding `h 16.w / v 8.h`; gap `8.h`; `pressToClose` "Press [ESC], [ENTER] or [SPACE] to close" (`en:949`) `9.sp onSurface@0.6`. Plan colours: free grey, micro blue, mini green, mega orange, ultra purple (`lib/widgets/plan_welcome_modal.dart:83-98,100-218`, `lib/widgets/plan_farewell_modal.dart:94-109,111-266`). Closed only by keyboard Escape/Enter/Space (`KeyboardListener`) or tap; no `GamepadNavigation` layer.

#### Unwired NeoSync widgets (for completeness)

| Widget | Summary | Citation |
| --- | --- | --- |
| `QuotaExceededDialog` | `AlertDialog` with `storage_rounded` 48 orange icon, `storageQuotaExceeded` "Storage Quota Exceeded" (`en:419`), orange warning box (`syncStoppedAfterAttempts` "Sync stopped after {count} failed attempts" `en:934`, `storageQuotaDesc` `en:420`), usage bar (minHeight 8, red >= 100 else orange), used/total/percent, three solution rows (upgrade blue, delete red, download green), actions Dismiss / Manage Files / Upgrade Your Plan. Unscaled literal sizes (16, 12, 8...). | `lib/widgets/quota_exceeded_dialog.dart:8-251` |
| `NeoSyncStatusIcon` | per-game status glyph (game list only): synced `check_circle_outline_rounded` `#79AA41`; local-only `cloud_upload_rounded` orange; cloud-only `cloud_download_rounded` lightBlue; syncing `sync_rounded` lightBlue rotating 1 s/turn; disabled `cloud_off_rounded` grey; quota `storage_rounded` redAccent; no save `save_alt_rounded` grey; missing emulator `videogame_asset_off_rounded` orange; error `error_outline_rounded` red / `#E53E3E`; chip `size.r` (default 24) with icon `0.6x` | `lib/widgets/neo_sync_status_icon.dart:67-327` |
| `NeoSyncControlsWidget`, `ProfileWidget`, `StorageInfoCard` | no call sites; unscaled literal layouts | `lib/widgets/neo_sync_controls_widget.dart`, `lib/widgets/profile_widget.dart`, `lib/widgets/storage_info_card.dart` |

### Scraper tab (ScreenScraper)

Files: `lib/widgets/scraper_content.dart` (router), `lib/screens/scraper_screen/scraper_login_screen.dart`, `lib/screens/scraper_screen/new_scraper_options_screen.dart` (master/detail), `lib/screens/scraper_screen/scraper_contents/*.dart` (one per option), `lib/screens/settings_screen/new_settings_options/settings_title.dart`, `lib/widgets/custom_toggle_switch.dart`, `lib/widgets/custom_radio_button.dart`, `lib/widgets/scraping_notification_listener.dart`, `lib/widgets/scraping_summary_dialog.dart`, `lib/providers/scraping_provider.dart`.

Router: while checking saved credentials shows `Center(CircularProgressIndicator())`; then `ScraperLoginScreen` (no credentials) or `NewScraperOptionsScreen` (`lib/widgets/scraper_content.dart:45-56`). No footer / hint bar anywhere on this tab.

Input ownership differs by state:
- Signed out: the login screen pushes its own layer `scraper_login_screen` (`lib/screens/scraper_screen/scraper_login_screen.dart:46-65`).
- Signed in: **no own layer**. The app-level `AppScreen` layer stays active and forwards Up/Down/Left/Right/A/B to static methods on `NewScraperOptionsScreen` (`lib/screens/app_screen.dart:473-557`, `lib/screens/scraper_screen/new_scraper_options_screen.dart:31-38`). LB/RB go to the app-level `onPreviousTab`/`onNextTab`; X, Y, Start do nothing here; Select goes to the global bell.

#### Signed out - ScreenScraper login

Layout: transparent `Scaffold` > `SafeArea` > `SingleChildScrollView(padding v 64.r / h 16.r)` > `Center` > horizontal scroll > `Padding(h 16.r)` > `Row(center, start, min)[ form (maxWidth 260.r), SizedBox(16.r), info box (width 300.r) ]` (`lib/screens/scraper_screen/scraper_login_screen.dart:190-222`).

| Element | Spec | Citation |
| --- | --- | --- |
| Form card | padding `16.r`, `cardColor@0.25`, radius `12.r`, border `primary@0.2` width `1` | `:348-359` |
| Title | `screenScraperLogin` "ScreenScraper Login" (`en:772`) `titleMedium` bold `primary` `14.r`; gap `12.r` | `:364-378` |
| Username | maxWidth `220.r`, height `32.r`, `TextField` text `11.r`; label `username` "Username" (`en:380`), hint `enterUsername` "Enter your username" (`en:754`); styles identical to the RA form (label `10.r onSurface@0.7`, floating `10.r bold primary`, hint `10.r onSurface@0.4`, fill `onSurface@0.05`, radius `8.r`, selected border `primary 2.r` else `primary@0.1 1.r`, focused `primary 1.r`); selected glow `primary@0.35 blur 6.r spread 1.r` | `:381-449` |
| Gap | `6.r` | `:450` |
| Password | same, `TextFormField` text `10.r`, obscured; label `password` "Password" (`en:383`), hint `enterPassword` "Enter your password" (`en:384`); eye suffix `18.r onSurface@0.5` | `:453-541` |
| Gap | `6.r` | `:542` |
| Login button | maxWidth `320.r`, full width, height `32.r`, bg `primary`, fg `onPrimary`, radius `8.r`, elevation 0; `login` "Login" `14.r bold`; loading `16.r` spinner stroke `2` `onPrimary`; selected glow `primary@0.5 blur 8.r spread 2.r` | `:545-593` |
| Info box | padding `16.r`, `cardColor@0.25`, radius `12.r`, border `primary@0.2` width `1`; `Symbols.info_rounded` `24.r primary`, gap `12.r`, `whatIsScreenScraper` "What is ScreenScraper?" (`en:764`) `titleMedium bold primary 14.r`; gap `6.r`; `screenScraperDescription` (`en:765`) "ScreenScraper is a collaborative database that provides high-quality metadata, covers, and videos for your games." `bodyMedium 8.r onSurface@0.9`; gap `6.r`; bullets (`12.r primary@0.7` icon, gap `8.r`, `8.r onSurface@0.8`, bottom `8.r`): `auto_awesome_rounded` `automaticMetadataMedia` "Automatic metadata & media" (`en:767`), `storage_rounded` `massiveDatabase` "Massive community database" (`en:768`), `verified_user_rounded` `requiresFreeAccount` "Requires a free account" (`en:769`); gap `6.r`; italic `8.r onSurface@0.6`: `createAccountAt` "Create an account at " (`en:770`) + "screenscraper.fr" (`primary` underline, opens `https://www.screenscraper.fr`) + `toGetCredentials` " to get your Account credentials." (`en:771`) | `:224-346` |

Buttons: slots `[username, password, Login]` (`:37`). Up/Down move **wrapping** (refused while typing); A focuses a field or logs in; B unfocuses a field only; LB/RB tabs; `allowRepeat: false`; nothing else bound (`:46-58,79-86`). Notifications: `pleaseCompleteAllFields` (`en:755`), `loginSuccessful` "Login successful" (`en:756`), `systemIdsSyncSuccess` (`en:757`) / `systemIdsSyncWarning` (`en:758`) / `systemIdsSyncError` (`en:759`), `errorSavingCredentials` (`en:761`), `invalidCredentials` "Invalid credentials provided" (`en:762`), `loginError` "Login error: {error}" (`en:763`) (`:88-188`).

#### Signed in - options master/detail (`new_scraper_options_screen.dart`)

Frame: transparent `Container(padding top 46.r)` > `Row[ left menu, right content ]` (`:472-490`).

| Element | Spec | Citation |
| --- | --- | --- |
| Left menu | width `MediaQuery.size.width * 0.25` (25 percent of the screen, not `.r`); bg `cardColor@0.25`; right border `primary@0.1` `1.r`; `ListView.builder` (full height) | `:492-504` |
| Menu row | padding `12.r` all round; selected bg `primary@0.15` (whether or not the menu has focus); left border `3.r`, `primary` only when selected AND menu focused, else transparent | `:524-538` |
| Menu row content | icon `20.r`; gap `12.r`; title `bodyLarge 14.r`; icon + text `primary` when selected AND menu focused, else `onSurface`; weight `w600` if selected else normal | `:539-563` |
| Right content | `Expanded`, padding `16.r`, `Alignment.topLeft` | `:573-583` |

Menu entries, in order (`lib/screens/scraper_screen/new_scraper_options_screen.dart:93-151`):

| # | Key | Icon | English |
| --- | --- | --- | --- |
| 0 | `account` | `person_rounded` | "Account" (`en:520`) |
| 1 | `scraping` | `download_rounded` | "Scraping" (`en:521`) |
| 2 | `scrapeMode` | `filter_list_rounded` | "Scrape Mode" (`en:522`) |
| 3 | `media` | `perm_media_rounded` | "Media" (`en:524`) |
| 4 | `region` | `public_rounded` | "Region" (`en:529`) |
| 5 | `language` | `language_rounded` | "Language" (`en:526`) |
| 6 | `systems` | `videogame_asset_rounded` | "Systems" (`en:536`) |

Default: menu focused, index 0 (Account) (`:42-44`).

Common detail pieces:

| Piece | Spec | Citation |
| --- | --- | --- |
| `SettingsTitle` | title `titleLarge` `14.r`; optional subtitle after `8.r`, `bodyMedium 9.r onSurface@0.6` | `lib/screens/settings_screen/new_settings_options/settings_title.dart:15-33` |
| `CustomRadioButton` row | `InkWell` radius `8.r`; padding `h 12.r / v 6.r`; bg `cardColor@0.25`; radius `8.r`; border width `2` (unscaled) `primary` when focused else transparent; title `bodyLarge w500 12.r` (`primary` when focused); optional subtitle `4.r` gap `bodyMedium 9.r onSurface@0.6`; gap `16.r`; indicator `24.r` circle, border `2.0`, selected fill+border `primary` with a `10.r` `onPrimary` dot, unselected border `outline@0.5` fill `scaffoldBackgroundColor@0.2`; indicator animates 200 ms `Curves.easeOut` | `lib/widgets/custom_radio_button.dart:24-132` |
| `CustomToggleSwitch` | `AnimatedToggleSwitch.dual`, indicator `24.r x 24.r`, height `28.r`, spacing `16.r`, borderWidth `2.r`, border transparent; ON track `alphaBlend(active@0.20, surface)`, OFF track `surface`; indicator `active` (ON) / `onSurfaceVariant` (OFF); indicator icon `check_rounded` / `close_rounded` `12.r` (`onPrimary` or `onSecondary` ON, `surface` OFF); label 'ON' / 'OFF' `8.r bold onSurfaceVariant` (literal, not localised); disabled = opacity `0.6` + ignore pointer | `lib/widgets/custom_toggle_switch.dart:21-88` |

##### Option details and values

| Menu | Detail layout | Values / items | Citation |
| --- | --- | --- | --- |
| Account | `SingleChildScrollView(BouncingScrollPhysics)`; member header card (padding `h 14.r / v 12.r`, `cardColor@0.25`, radius `12.r`, border `primary@0.15` `1.r`): `CircleAvatar` radius `24.r` bg `primary@0.2` with first letter `18.r bold primary`; gap `12.r`; username `titleMedium bold 14.r` (fallback `unknownUser` "Unknown User" `en:596`); gap `4.r`; pills `Wrap(8.r, 6.r)` (pill spec = RA pill: `h 8.r / v 4.r`, `color@0.12`, radius `999.r`, `color@0.22` border, `10.r` icon, `8.r w700` label); gap `8.r`; logout `IconButton` `logout_rounded` `20.r error` in a radius `8.r` box whose `2.r` border is `primary` when focused; tooltip `disconnectAccount` "Disconnect Account" (`en:595`). Then `12.h` gap and (if the API returned it) a quota card: padding `12.r`, same card look; label `dailyTotalRequests` "Daily Total Requests" (`en:594`) `bodySmall w600 10.sp`; "{current} / {max} ({pct}%)" `10.sp bold primary`; gap `8.h`; bar radius `2.r`, minHeight `4.h`, track `primary@0.05`; trailing `16.h` | 1 item: logout. Pills: `workspace_premium_rounded` contribution level (0 `free` "Free" `en:597`; 1 `bronze` "Bronze" `en:598` `#CD7F32`; 2 `silver` "Silver" `en:599` `#C0C0C0`; 3 `gold` "Gold" `en:600` `#FFD700`; 15 `developer` "Developer" `en:601`; other `member` "Member" `en:602`; colour defaults to `primary`); `lan_rounded` "{maxThreads}: {n}" (`maxThreads` "Max Threads" `en:593`). Loading: centred spinner while `userInfo == null` | `lib/screens/scraper_screen/scraper_contents/account_content.dart:21-283` |
| Scraping | Row: `SettingsTitle` ("Scraping"; subtitle `scraperSubtitle` "Download game metadata from ScreenScraper" `en:571`, or while running "{scrapingInProgress} {maxThreads} threads" = "Scraping in progress with 4 threads" with the word "threads" hard-coded), gap `24.r`, Start/Stop button (see in-progress section) | 1 item: Start / Stop | `lib/screens/scraper_screen/scraper_contents/scraping_content.dart:215-298` |
| Scrape Mode | `SettingsTitle` "Scrape Mode" / `scrapeModeSub` "Choose what content to scrape" (`en:523`); gap `12.r`; radio rows with bottom `8.r` | `new_only` = `newContentOnly` "New content only" (`en:545`) / `newContentOnlyDesc` "Only scrape games that haven't been fully scraped yet" (`en:552`); `all` = `allContent` "All content" (`en:546`) / `allContentDesc` "Scrape all games, including those already scraped" (`en:554`). Default `new_only` | `lib/screens/scraper_screen/scraper_contents/scrape_mode_content.dart:27-83`, `lib/screens/scraper_screen/new_scraper_options_screen.dart:600` |
| Media | `SettingsTitle` "Media" / `mediaSub` "Choose what content types to download" (`en:525`); gap `12.h`; rows: padding `h 12.r / v 6.r`, `cardColor@0.25`, radius `8.r`, border width `2` `primary` when focused; title `bodyLarge 12.r w500` (`primary` when focused); gap `4.r`; description `bodyMedium 9.r onSurface@0.6`; trailing `CustomToggleSwitch(activeColor: primary)`. Note: no vertical gap between media rows in source | 5 toggles in order: `fanart` `scrapeFanart` "Fanart" / "Download background artwork for games." (`en:560-561`); `ss` `scrapeScreenshot` "Screenshots" / "Download gameplay screenshots." (`en:562-563`); `wheel` `scrapeWheel` "Wheels" / "Download game logo wheels." (`en:564-565`); `box2D` `scrapeBox2D` "Box Art 2D" / "Download 2D box cover art." (`en:566-567`); `video` `scrapeVideo` "Videos" / "Download video previews of the games." (`en:568-569`) | `lib/screens/scraper_screen/scraper_contents/media_content.dart:27-165` |
| Region | `Column[ SettingsTitle "Region Priority" (`regionPriority` `en:531`) / `regionPrioritySub` "Higher priority regions are preferred when selecting game names, dates and media. Press A to pick up, Up/Down to move, B to drop." (`en:532`), gap `12.h`, Expanded(ReorderableListView) ]`; row bottom padding `4.h`; card `AnimatedContainer` 200 ms `Curves.easeOut`, padding `h 12.r / v 6.r`, radius `8.r`, border width `2` `primary` when focused or moving; moving bg `primary@0.2` else `cardColor@0.25`; priority circle `28.r` (moving `primary` + `onPrimary` text, else `onSurface@0.1` + `onSurface@0.6`) number `labelSmall 10.r bold`; gap `12.r`; name `bodyLarge w500 12.r` (`primary` focused); gap `4.r`; code uppercased `bodyMedium 9.r onSurface@0.4`; trailing padding `4.r`: moving -> `swap_vert_rounded` `20.r primary` + gap `4.r` + "{n}/{total}" `10.r bold primary`, else `drag_indicator_rounded` `20.r` `onSurface@0.5` (focused) / `@0.2`; drag proxy: elevation `6 + 6t`, scale `1.02 + 0.02t` (`Curves.easeInOut`), border `primary` `2.r`, radius `12.r`, shadow `primary@0.3` | Region codes and names (order from repository): `wor` World, `us` USA, `eu` Europe, `fr` France, `sp` Spain, `it` Italy, `de` Germany, `jp` Japan, `kr` Korea, `cn` China (literal English, not localised). Scroll-into-view `ensureVisible` 200 ms `Curves.easeInOut` alignment 0.5 | `lib/screens/scraper_screen/scraper_contents/region_content.dart:30-41,170-422` |
| Language | `SingleChildScrollView(Bouncing)`; `SettingsTitle` "Preferred Language" (`preferredLanguage` `en:528`) / `languageSub` "Select preferred language for game metadata" (`en:527`); gap `12.h`; radio rows bottom `8.h`; scroll keeps item visible with hard-coded item 50 / header 120 / padding 40 (unscaled), 250 ms `Curves.easeInOut` | `en` English, `es` Español, `fr` Français, `de` Deutsch, `it` Italiano, `pt` Português (native names, literal). Default `en` | `lib/screens/scraper_screen/scraper_contents/language_content.dart:35-128`, `lib/screens/scraper_screen/new_scraper_options_screen.dart:623` |
| Systems | `SingleChildScrollView(Bouncing + AlwaysScrollable)`; Row[`SettingsTitle` "Systems" / `systemsSub` "Select which systems to scrape" (`en:585`), gap `24.r`, toggle-all button]; gap `12.r`; `Wrap(spacing 6.r, runSpacing 6.r)` of cards, card width `(screenWidth*0.75 - 24.r*2 - 24.r)/5` (5 columns) | toggle-all: `ElevatedButton.icon` bg `primary` fg `Colors.white`, padding `h 16.r / v 6.r`, min height `32.r`, icon `18.r` `deselect_rounded` + `disableAll` "Disable All" (`en:586`) when all enabled, else `select_all_rounded` + `enableAll` "Enable All" (`en:587`); focus border `2.r primary` radius `8.r`. System card: padding `4.r`, radius `8.r`, bg `cardColor@0.6` (enabled) / `@0.3`; border `1.5.r`: `secondary` focused, `Colors.greenAccent` enabled, else `outline@0.1`; check circle `24.r` (enabled `greenAccent@0.25` fill + `greenAccent` border `1.5.r` + `check_rounded` `14.r greenAccent`; else `cardColor@0.25` + `outline@0.4` + `add_rounded` `onSurface@0.5`); gap `2.r`; name 1 line centred `9.r`, `onSurface@0.9 w600` enabled / `@0.5 normal` | `lib/screens/scraper_screen/scraper_contents/systems_content.dart:289-469` |

##### Signed-in button map

| Button | Menu focused | Content focused | Citation |
| --- | --- | --- | --- |
| Up | previous entry, **wraps** | Systems/Region: delegated; others: previous item, clamped (no wrap) | `lib/screens/scraper_screen/new_scraper_options_screen.dart:220-245` |
| Down | next entry, **wraps** | Systems/Region: delegated; others: next item, clamped | `:247-272` |
| Right | enter content at item 0 (if the option has items) | Systems: next column, wraps within the row; Region: nothing; others: nothing | `:304-318` |
| Left | nothing | back to menu (Systems: only from column 0 or the toggle-all button; Region: drops a picked-up item instead when moving) | `:274-302` |
| A | re-selects the entry (stays in menu; content index reset to 0) | Account: logout confirm; Scraping: start/stop; Scrape Mode/Language: select radio; Media: toggle; Region: pick up / drop; Systems: toggle-all or toggle system | `:320-326,354-373` |
| B | nothing | Region only: drop a picked-up item; otherwise nothing (B does **not** return to the menu) | `:328-336` |
| LB / RB | previous / next tab (app layer) | same | `lib/screens/app_screen.dart:149-150` |
| X, Y, Start, LT, RT | nothing | nothing | `lib/screens/app_screen.dart:530-566` |
| Select | global notification bell | same | - |

Content item counts: Account 1, Scraping 1, Scrape Mode 2, Media 5, Region = region count, Language 6, Systems = 1 + system count (`lib/screens/scraper_screen/new_scraper_options_screen.dart:338-352`). Switching menu entries resets content index to 0 (`:211-217`).

Systems grid movement (`lib/screens/scraper_screen/scraper_contents/systems_content.dart:49-140`): index 0 = toggle-all button. Down from button -> first card; Down past last row -> button (wrap). Up from button -> first card of last row; Up from first row -> button. Right wraps to the row's first column. Scroll centres the row (row height `50.r + 8.r`, header `60.r`), 300 ms `Curves.easeInOutCubic` (`:142-183`).

Region movement (`lib/screens/scraper_screen/scraper_contents/region_content.dart:76-157`): Up/Down move cursor clamped; A picks up (moving mode); while moving, Up/Down swap the item with its neighbour; A, B or Left drops and saves.

Logout (Account): `ConfirmActionDialog` title `logoutConfirm` "Logout" (`en:370`), body `logoutConfirmationDesc` "Are you sure you want to disconnect from ScreenScraper?" (`en:541`), confirm "Logout", icon `logout_rounded`; then `logoutSuccess` "Successfully logged out" (`en:543`) / `logoutError` "Error during logout" (`en:544`) and back to the login screen (`lib/screens/scraper_screen/new_scraper_options_screen.dart:375-403`). Scrape-mode change notifies "{scrapeModeUpdated} {mode}" = "Scrape mode updated to: New content only" (`en:547`) / `scrapeModeError` (`en:548`); language change `languageUpdated` (`en:549`) / `languageError` (`en:550`) (`:405-459`).

#### Scraping in progress (Scraping detail while `isScraping`)

| Element | Spec | Citation |
| --- | --- | --- |
| Start/Stop button | wrapper radius `8.r`, border width `2` (unscaled) `primary` when content focused on index 0; `ElevatedButton.icon` bg `primary` (idle) / `error` (running), fg `Colors.white`, padding `h 16.r / v 6.r`, min size `(0, 32.r)`; icon `play_arrow_rounded` / `stop_rounded` `16.r`; label `start` "Start" (`en:584`) / `stop` "Stop" (`en:19`) `10.r` | `lib/screens/scraper_screen/scraper_contents/scraping_content.dart:237-283` |
| ETA line (running, once known) | gap `4.r`; "{estimatedTimeLeft} ~{d}" = "Estimated time left: ~3m 12s" (`en:572`), `bodySmall 8.r onSurface@0.4 italic`; format `Xh Ym` / `Ym Zs` / `Zs` | `:286-297,201-213` |
| Gap | `12.r` | `:298` |
| Stat cards | `Row` of 3 `Expanded` cards with `8.r` gaps: `games_rounded` `totalGames` "Total Games" (`en:538`) "{processed} / {total}"; `check_circle_outline_rounded` `successFailed` "Success / Failed" (`en:539`) "{ok} / {failed}" (bar = ok / processed); `cloud_sync_rounded` `request` "Request" (`en:540`) "{requests} / {maxDaily}" | `:300-346` |
| Stat card | padding `8.r`, `cardColor@0.25`, radius `8.r`; icon `10.sp primary`, gap `4.w`, title `7.sp w500 onSurface@0.6`; gap `2.r`; value `10.sp bold onSurface`; gap `2.r`; bar radius `2.r` minHeight `4.h`, track `surface@0.3`, fill `Colors.orange` if > 0.8 else `primary`; gap `2.h`; "{pct}%" `7.sp w500 onSurface@0.6` | `:377-445` |
| Gap | `8.r` | `:348` |
| Worker cards | `Wrap(spacing 8.r, runSpacing 8.r)`, width `(screenWidth*0.75 - 24.r*2 - 32.r)/5` (5 columns); always **15** cards (fixed list, independent of maxThreads) | `:350-368`, `lib/providers/scraping_provider.dart:173-180` |
| Worker card | padding `6.r`, radius `6.r`, border `1.r` `threadColor` at `0.5` (done) / `0.4` (active) / `0.2`; bg `Colors.green@0.1` (done) / `cardColor@0.5` (active) / `cardColor@0.25`; threadColor `Colors.green` / `primary` / `Colors.grey` | `lib/screens/scraper_screen/scraper_contents/scraping_content.dart:447-481` |
| Worker active | game name `8.r w600 onSurface@0.9` centred 1 line; gap `2.r`; bar radius `2.r` minHeight `3.r`, track `Colors.grey@0.2`, fill `threadColor@0.9`, value = thread progress; gap `2.r`; step `8.r w500 italic threadColor@0.8`: `fetchingMetadata` "Fetching Metadata" (`en:573`), `scanningImages` "Scanning Existing Images" (`en:574`), `downloadingImages` "Downloading Images" (`en:575`), completed shows `ok` "OK" | `:185-199,486-524` |
| Worker idle | `idle` "Idle" (`en:576`) `20.r w500 italic Colors.grey@0.6` | `:525-535` |

There are no per-system rows in the in-progress view; progress is shown per worker card (each card names the game it is working on). "Current game" = each active card's `gameName`.

Background progress (header bell): on start a global notification `scraping_progress` with `scrapingInProgress` "Scraping in progress with" (`en:570`), progress 0, ongoing (`lib/screens/scraper_screen/scraper_contents/scraping_content.dart:81-87`); `ScrapingNotificationListener` (mounted in `lib/screens/main_screen.dart:15`) updates it to "{scrapingInProgress} {processed} / {total}" with progress = processed/total on every provider change (`lib/widgets/scraping_notification_listener.dart:49-65`). End states: success "{scrapingCompleted} ({p} / {t})" = "Metadata scraping completed successfully! (…)" (`en:578`) or `allGamesUpToDate` "All games are already up to date!" (`en:577`); `scrapingCancelled` (`en:579`); `syncError` (`en:581`); `metadataError` (`en:582`); `scrapeQuotaExceeded` "ScreenScraper daily scraping quota exceeded" (`en:583`) (`lib/screens/scraper_screen/scraper_contents/scraping_content.dart:93-163`). Stop shows toast `stoppingScraping` "Stopping scraping process..." (`en:580`) (`:173-183`).

#### Scraping summary dialog (`lib/widgets/scraping_summary_dialog.dart`)

Shown by `ScreenScraperService._showScrapingSummaryDialog` when a run finishes and the context is still mounted; `barrierDismissible: true` (`lib/services/screenscraper_service.dart:922-930,1184-1202`).

| Element | Spec | Citation |
| --- | --- | --- |
| Dialog | transparent `Dialog`, insetPadding `h 10.w / v 6.h`; box maxWidth `240.w`, bg `scaffoldBackgroundColor`, radius `12.r`, border `outline@0.3` `1.r`, shadow `black@0.6 blur 10.r spread 1.r` | `:63-82` |
| Header | full width, padding `v 8.h`, bg `scaffoldBackgroundColor@0.2`, bottom border `outline@0.1` `1.r`; centred `check_circle_rounded` `16.r Colors.green`, gap `6.w`, literal "Scraping Finished" (not localised) `13.r bold onSurface` | `:88-123` |
| Rows | padding `h 12.w / v 10.h`, rows gap `4.h`, each spaceBetween label/value `11.r` (value bold): "Games" total; "Success" "{n} ({rate}%)" `Colors.green`; "Failed" `Colors.orange` if >0 else `onSurface`; "Duration" "{s}s" `primary` (labels literal English) | `:124-151,183-204` |
| OK | padding L/R `12.r` bottom `10.r`; full width, height `32.h`, bg `primary`, fg white, radius `8.r`; literal "OK" `12.r bold` | `:152-175` |
| Buttons | A or B closes (own layer `scraping_summary_dialog`) | `:37-46` |

### RomM tab

Files: `lib/screens/romm_screen/romm_tab.dart` (router), `lib/screens/romm_screen/romm_connect_content.dart` (connect form), `lib/screens/romm_screen/romm_browse_screen.dart` (library browser, skimmed for top-level layout), `lib/screens/romm_screen/romm_rom_grid.dart` / `romm_rom_list.dart` / `romm_rom_card.dart` (ROM views, skimmed), `lib/widgets/romm_browse_footer.dart`, `lib/widgets/romm_sync_banner.dart`, `lib/widgets/core_footer.dart`, `lib/widgets/footer_label_pill.dart`.

Router: `connected ? RommBrowseScreen() : RommConnectContent()` (`lib/screens/romm_screen/romm_tab.dart:22-26`). `RommConnectContent` is only ever built with `onBrowse == null` (the only call site is `lib/screens/romm_screen/romm_tab.dart:25`), so its "connected" rows (Browse Library / Use RomM for save sync / Disconnect, `lib/screens/romm_screen/romm_connect_content.dart:732-799`) are **unreachable** from the tab; once connected the browser replaces the form.

#### Signed out - connect form (`romm_connect_content.dart`)

Layout: `Padding(h 12.r)` > `Column(start)[ SizedBox(64.r), Center(horizontal SingleChildScrollView(ClampingScrollPhysics) > Padding(h 16.r) > Row(center, start, min)[ form card (maxWidth 260.r), SizedBox(16.r), info box (width 300.r) ]) ]` (`:344-386`). Server URL and username are prefilled from the provider (`:116-120`).

| Element | Spec | Citation |
| --- | --- | --- |
| Form card | padding `16.r`, `cardColor@0.25`, radius `12.r`, border `primary@0.2` width `1` | `:388-399` |
| Title | `rommLogin` "RomM Login" (`en:1041`) `titleMedium bold primary 14.r`; gap `12.r` (status line only when connected) | `:403-424` |
| Field rows | maxWidth `220.r`, height `32.r`, `TextField` text `11.r`, label `10.r onSurface@0.7`, floating `10.r bold primary`, hint `10.r onSurface@0.4`, fill `onSurface@0.05`, radius `8.r`, enabled border `primary 2.r` when selected else `primary@0.1 1.r`, focused `primary 1.r`; selected glow `primary@0.35 blur 6.r spread 1.r` | `:801-879` |
| Slot 0 Server URL | label `rommServerUrl` "Server URL" (`en:1050`), hint `rommServerUrlHint` "https://romm.example.com" (`en:1051`) | `:597-604` |
| Gap | `10.r` | `:605` |
| Slot 1 auth-mode switch | maxWidth `220.r`; padding `4.r - borderWidth`; bg `onSurface@0.05`; radius `8.r`; border `primary` `2.r` selected, else `primary@0.1` `1.r`; selected glow as fields. Two `Expanded` halves: padding `v 6.r`, radius `6.r`, active bg `primary`, text `9.r` centred, active `bold onPrimary`, inactive `normal onSurface@0.7`. Labels `rommAuthPassword` "Password" (`en:1070`), `rommAuthApiKey` "API key" (`en:1071`) | `:645-730` |
| Gap | `10.r` | `:607` |
| Password mode | slot 2 username (label "Username", hint "Enter your username"), gap `8.r`, slot 3 password (obscured, label "Password", hint "Enter your password") | `:618-637` |
| API-key mode | slot 2 `rommApiKey` "API key" (`en:1072`), hint `rommApiKeyHint` "rmm_..." (`en:1073`), obscured | `:608-617` |
| Gap | `12.r` | `:638` |
| Login button (last slot) | maxWidth `320.r`, full width, height `32.r`, bg `primary`, fg `onPrimary`, radius `8.r`, elevation 0, padding zero; `login` "Login" `14.r bold`; busy `16.r` spinner stroke `2`; selected glow `primary@0.5 blur 8.r spread 2.r` | `:883-936` |
| Info box | padding `16.r`, `cardColor@0.25`, radius `12.r`, border `primary@0.2` width `1`; header `assets/images/icons/romm-light.svg` `24.r` tinted `primary` (srcIn), gap `12.r`, `rommWhatIs` "What is RomM?" (`en:1042`) `titleMedium bold primary 14.r`; gap `6.r`; `rommDescription` (`en:1043`) "RomM is a self-hosted ROM manager. Connect to your server to browse your library, download games straight to this device, and sync your saves." `bodyMedium 8.r onSurface@0.9`; gap `6.r`; bullets (`12.r primary@0.7`, gap `8.r`, `8.r onSurface@0.8`, bottom `8.r`): `grid_view_rounded` `rommInfoBrowse` "Browse and download your full game library" (`en:1046`), `cloud_sync_rounded` `rommInfoSaveSync` "Sync save files across your devices" (`en:1047`), `dns_rounded` `rommInfoSelfHosted` "Self-hosted: your collection, your server" (`en:1048`); gap `6.r`; italic `8.r onSurface@0.6` `rommLearnMoreAt` "Learn more at " (`en:1049`) + "romm.app" (`primary` underline, `https://romm.app`) | `:434-558` |

Slots: password mode `[url, switch, user, password, Login]`, API-key mode `[url, switch, apiKey, Login]` (`:73-80`).

| Button | Action | Citation |
| --- | --- | --- |
| Up / Down | move slot, **wraps** (refused while typing); scrolls the slot into view (`ensureVisible` 200 ms `Curves.easeInOut`, alignment 0.5) | `:151-159,216-226` |
| Left / Right | only on the switch slot: Left = Password, Right = API key (no-op if already set or typing) | `:105-106,193-200` |
| A | switch slot: flip mode; field: focus (OS keyboard); Login: connect | `:161-178` |
| B | unfocus a field; otherwise calls `onBrowse`, which is null here, so nothing | `:208-214` |
| LB / RB | previous / next tab | `:109-112` |
| X, Y, Start | not bound | `:102-115` |
| Repeat | `allowRepeat: false` | `:113` |

Validation / result toasts: `rommCredentialsRequired` "Enter the server URL, username and password" (`en:1068`) or `rommApiKeyRequired` "Enter the server URL and API key" (`en:1074`); success `rommConnectionSuccess` "Connection successful" (`en:1065`); failure shows the provider's error string (`:230-296`). On connect, RomM becomes the save-sync provider only if NeoSync is signed out (`:274-285`).

#### Signed in - library browser (top-level layout only)

Frame: `PopScope(canPop: false)` > `Scaffold(bg scaffoldBackgroundColor)` > `Padding(top 46.r)` > `Column[ optional title bar, Expanded(Stack[ view, sync banner at bottom kCoreFooterHeight.r ]) ]` (`lib/screens/romm_screen/romm_browse_screen.dart:900-973`). Not connected mid-session: centred `cloud_off_rounded` + `rommNotConnected` "Connect to a RomM server in Settings first" (`en:1099`) (`:932-938`). Views: `source` (root), `platforms`, `collections`, then a ROM view (`:55,939-949`). Position (view, indices, layout) is remembered across tab switches for the same server+user (`:71-84,286-313`).

| Piece | Spec | Citation |
| --- | --- | --- |
| Title bar | shown on the source menu always, and on platform/collection lists only while they are empty; height `48.r` at root (account header) else `28.r`; back `IconButton` `arrow_back_rounded` `18.r` (padding `h 8.r / v 4.r`) when not at root, else `SizedBox(12.r)` | `:982-1020` |
| Root title | `rommLibrary` "RomM Library" (`en:1040`) `16.r bold`; second line "Connected as {user}" (`rommConnectedAs` `en:1067`) + suffix " · No save sync active" / " · Save sync is handled by {provider}" when RomM is not the save-sync owner, `10.r onSurface@0.6` | `:1022-1061,1212-1224` |
| Save-sync pill (header slot 0) | padding right `6.r`; `InkWell` radius `8.r`; padding `h 8.r / v 5.r`; bg `primary@0.15` when on else transparent; border parked `primary 2.r` else `accent@0.5/0.3` `1.r`; accent `primary` (on) / `onSurface@0.6`; `cloud_sync_rounded` `16.r` (fill 1 when on); gap `6.r`; "RomM Sync · Enabled/Disabled" (`rommSaveSyncLabel` `en:1055`, `enabled` `en:588`, `disabled` `en:589`) `11.r w600 accent` | `:1088-1143` |
| Disconnect (header slot 1) | box radius `8.r`, border `2.r` `primary` when parked; `IconButton` padding `6.r`, `logout_rounded` `20.r error`, tooltip `rommDisconnect` "Disconnect" (`en:1053`); no confirm dialog; toast "Disconnect" | `:1062-1075,1146-1198` |
| List titles | `rommPlatforms` "Platforms" (`en:1075`), `rommCollections` "Collections" (`en:1077`) | `:1257-1266` |
| Focus decoration (all browse tiles) | fill `primary@0.18` focused / `surface@0.5`; radius `12.r` default; border `2.r` `primary` focused else transparent; focused glow `primary@0.3 blur 8.r spread 1.r` | `lib/screens/romm_screen/romm_rom_card.dart:707-734` |

Source menu (root) (`lib/screens/romm_screen/romm_browse_screen.dart:1273-1426`): two square cards, Collections then Platforms; side by side when usable width (`maxWidth - 24.r`) >= `320.r`, else stacked; cell = min(width fit, height fit, `240.r`); spacing `16.r`; centred `Wrap`. Card padding `8.r`; montage (`ClipRRect` `8.r`) of up to 4 tiles (collection covers / the 4 largest platforms' icons on `surface@0.5` panels; 1 = full, 2 = side by side, 3-4 = 2x2 with `2.r` gutters) or placeholder icon `34.r primary` on `surface@0.5` (`collections_bookmark_rounded` / `dashboard_rounded`); gap `8.r`; title `13.r w600`, `primary` when focused (`:2269-2320,2402-2445`).

Platform list: card grid with `cellExtent 116` (`.r`), square, spacing `10.r`, columns = floor((width - 24.r + 10.r) / (116.r + 10.r)), padding `(12.r, 10.r, 12.r, 12.r + 42.r)` (`:1431-1480,1598-1639`). Card padding `6.r`: platform icon (fills, inset `4.r`; opacity 0.4 when unsupported), gap `4.r`, name max 2 lines `12.r w600` (`primary` focused, `onSurface@0.5` unsupported), gap `2.r`, ROM count or `rommPlatformUnsupported` "Unsupported" (`en:1096`) `10.r` (`error@0.85` / `onSurface@0.6`) (`:2183-2263`). Empty: `videogame_asset_off_rounded` + `rommNoPlatforms` "No platforms found" (`en:1076`) (`:1583-1593`). Collection list: same grid with `cellExtent 150`, card padding `8.r`, montage, gap `6.r`, name `12.r w600`, gap `2.r`, count `10.r onSurface@0.6`; empty `rommNoCollections` "No collections found" (`en:1078`) (`:1484-1552,2325-2396`). Centred-message style: icon `48.r onSurface@0.4`, gap `12.r`, text `12.r onSurface@0.6` with `h 32.r` padding (`:1554-1579`).

ROM view: search row (padding `(12.r, 6.r, 12.r, 4.r)`; field border `2.r` `primary` when selected/focused, radius `12.r`, text `12.r`, hint `rommSearchHint` "Search this platform" (`en:1082`) / `rommSearchCollectionHint` "Search this collection" (`en:1083`), prefix `search_rounded` `18.r`, contentPadding `h 10.r / v 8.r`, fill `surfaceContainerHighest@0.7` focused / `@0.5`; clear button `close_rounded` `16.r`; status line `10.r`) over the grid or list; search debounced 400 ms via `DebouncedSearch` (`:1897-2035,182,210-218`). Grid columns from the local `gameGridColumns` setting: S 7, M 6, L 5, XL 4, default 6 (`lib/screens/romm_screen/romm_rom_grid.dart:298-321`); tile ratio `1.417` (`lib/screens/romm_screen/romm_rom_grid.dart:62`). List rows `98.r` tall with `8.r` separators and `12.r` padding (`lib/screens/romm_screen/romm_rom_list.dart:172,326-332`). Empty: `search_off_rounded` + `rommNoRoms` "No ROMs found" (`en:1079`) (`:1699-1709`).

Browser buttons (`lib/screens/romm_screen/romm_browse_screen.dart:219-255,614-852`):

| Button | Source menu / lists | Citation |
| --- | --- | --- |
| Dpad | `GridNavUtils`: Left/Right wrap within the row, Down past the last row wraps to the same column of row 0, Up from row 0 wraps to the last row; on the source menu Right off the row end parks on the header (slot 0 -> 1), Left walks back / drops into the grid, Up/Down leave the header | `:614-667`, `lib/utils/gamepad_nav.dart:1515-1574` |
| A | header: toggle save sync / disconnect; source card: open list; list card: open ROM view | `:768-805` |
| B | unfocus search; leave header; ROM view -> its list; list -> source menu; source menu: nothing (tabs change only with LB/RB) | `:837-852` |
| Y | lists and ROM view: sync the focused/open platform or collection (confirm dialog first; Y again cancels); source menu: nothing | `:410-457` |
| X | ROM view only: cycle grid / list | `:759-766` |
| LB / RB | previous / next tab | `:251-254` |
| Start, Select | not bound (Select -> global bell) | - |

Footer (`RommBrowseFooter`, lists and ROM view; not on the source menu): `CoreFooter` split layout, height `kCoreFooterHeight.r` = `42.r`, padding `h 12.r`, transparent bg (`lib/widgets/core_footer.dart:14,57-69,98-110`). Left: `FooterLabelPill` (padding `4.r` v, `12.r` left, `6.r`/`12.r` right; bg `tertiaryFixed`; radius `radiusExternal` or `24.r`; shadow `shadow@0.3 blur 3.r offset (2.r,2.r)`; label `14.r bold onTertiaryFixed`; count chip gap `10.r`, padding `h 8.r / v 2.r`, bg `surface`, radius `radiusInternal` or `12.r`, text `10.r w900 onSurface` letterSpacing `0.5.r`) naming the focused platform/collection with "{count} Games" (`gamesCount` `en:809`, singular `gameCount` "{count} Game" `en:810`), or the focused ROM with its platform as the chip (`lib/widgets/footer_label_pill.dart:21-93`, `lib/screens/romm_screen/romm_browse_screen.dart:2042-2062`). Right, `8.r` gaps: Y `rommSyncAll` "Sync all" (`en:1101`) / `rommSyncCancel` "Cancel sync" (`en:1102`) on `tertiaryFixed`; X `viewMode` "View Mode" (`en:646`, ROM view only) on `surfaceContainerHighest@0.3`; B `hintBack` "Back" (`en:608`) on `surfaceContainerHighest@0.3`; A "Enter" (`enter` `en:657`, lists) or "Download" (`download` `en:18`, ROM view) on `tertiary`/`onTertiary`, always far right (`lib/widgets/romm_browse_footer.dart:75-120`). Y is omitted for an unsupported platform (`lib/screens/romm_screen/romm_browse_screen.dart:1663`).

Sync banner (`RommSyncBanner`, only while a bulk sync runs; floated just above the footer): margin `h 10.r / v 6.r`; padding `h 12.r / v 8.r`; bg `surface@0.9`; radius `radiusExternal` (or `14.r`); border `outline` `1.r`; icon `cloud_download_rounded` (or `cancel_rounded` when cancelling) `18.r primary`; gap `10.r`; row: source label `bodySmall w600 onSurface` 1 line, gap `8.r`, status `bodySmall onSurfaceVariant` = `rommSyncCancelling` "Cancelling…" (`en:1116`) / `rommSyncPreparing` "Preparing…" (`en:1115`) [+ found count] / "{finished}/{total}" [+ " · {done} / {total bytes}"]; gap `6.r`; bar radius `4.r`, minHeight `4.r`, track `surfaceContainerHighest`, fill `primary`, indeterminate while preparing (`lib/widgets/romm_sync_banner.dart:37-149`). Byte format `rommFormatBytes`: B/KB/MB/GB/TB, 0 dp when >= 100 or bytes, else 1 dp (`lib/widgets/romm_sync_banner.dart:11-24`).

Sync confirm: `ConfirmActionDialog` titled `rommSyncConfirmTitle` "Sync {name}?" (`en:1103`), body lines `rommSyncConfirmPlan` "Downloads {count} games ({size}). This can take a long time." (`en:1104`), optional `rommSyncConfirmSkipped` "{count} already on this device." (`en:1106`), free-space line(s) (`en:1107-1113`), confirm "Sync all", icon `cloud_download_rounded` accent `primary` when it fits, else `warning_rounded` accent `error` (`lib/screens/romm_screen/romm_browse_screen.dart:467-543`). Outcome toasts: `rommSyncCancelled` (`en:1118`), `rommSyncFailedCount` "{count} failed" (`en:1120`), `rommSyncNothingToDo` "Everything is already downloaded" (`en:1119`), `rommSyncComplete` "Synced {count} games" (`en:1117`) (`:547-596`).


## Settings, first run, shared dialogs, notifications

Source: `misobadev/neostation-frontend` at commit `d9bece5`. All paths are relative to the repo root; every citation is `file:LINE`.
Sizes are in source units exactly as written (`12.r`, `8.w`, `4.h`, or plain logical px). Colours are theme roles or literal hex. English strings are given as `key` = "value" (from `lib/l10n/app_locale_en.dart`; the full dump is `strings-en.txt`).

### Global facts that apply to everything below

| Fact | Value | Cite |
| --- | --- | --- |
| ScreenUtil design size | `Size(640, 480)`, `minTextAdapt: true`, `splitScreenMode: true` | lib/main.dart:1021-1024 |
| `.r` / `.h` behaviour | `splitScreenMode` floors the height used for scaling at 700, so `.h` is larger than `.r` on a 480-tall screen. The splash re-implements the formula: `scaleWidth = w/640`, `scaleHeight = max(h,700)/480`, `r = min(scaleWidth, scaleHeight)` | lib/widgets/splash_status_layout.dart:64-88 |
| App font | Google Fonts **Anta** for the whole text theme (`GoogleFonts.antaTextTheme`) | lib/main.dart:1072-1075 |
| Icons | Material Symbols (`Symbols.*_rounded`), `IconThemeData(fill: 1.0)` (filled) | lib/main.dart:1076 |
| Material version | `useMaterial3: true` in every built-in theme (e.g. dark) | lib/themes/dark_theme.dart:36 |
| Text scale clamp | system text scale clamped to 0.6-1.4 | lib/main.dart:1055-1061 |
| Page transitions | `FadeUpwardsPageTransitionsBuilder` on every platform | lib/main.dart:1079-1092 |
| Default theme | `'system'` (resolves to `dark` or `light` from platform brightness) | lib/data/datasources/sqlite_service.dart:3258, lib/providers/theme_provider.dart:26-40 |
| Corner radii token | `CornerRadii` theme extension; dark/light/oled/aqua/valentine/horizon/palenight/tokyo_night = `m` (external 14, internal 10); retro/abyss = `s` (8/5); nord = `xs` (3/2); coffee = `l` (16/12); dracula = `xl` (24/20); cyberpunk = `zero`. Getters apply `.r` | lib/themes/corner_radii.dart:27-57, lib/themes/dark_theme.dart:58 |
| Keyboard focus traversal | disabled app-wide (`NoFocusTraversalPolicy`); everything is driven by the gamepad layer stack | lib/main.dart:55-83, 1027-1028 |
| Desktop window | default 1280x720, minimum 640x480; `Alt+Enter` toggles fullscreen (Windows/Linux/macOS) | lib/main.dart:219-227, 1029-1037 |
| Android | immersiveSticky, landscape only | lib/main.dart:280-291 |

---

### Settings screen (master/detail)

`lib/screens/settings_screen/new_settings_screen.dart`. It is the content of the Settings tab of the main tab strip (L1/R1 header); `AppScreen` routes the pad to it.

#### Layout

| Part | Value | Cite |
| --- | --- | --- |
| Screen container | transparent, `padding: EdgeInsets.only(top: 46.r)` (clears the fixed header), a `Row` with `crossAxisAlignment.start` | new_settings_screen.dart:500-513 |
| Footer | none - `AppScreen._buildFooterForCurrentTab` returns `SizedBox.shrink()` for every tab | lib/screens/app_screen.dart:737-759 |
| Left menu width | `MediaQuery.size.width * 0.25` (a quarter of the logical screen width, not `.r`) | new_settings_screen.dart:518 |
| Left menu fill | `theme.cardColor.withValues(alpha: 0.25)` | :520 |
| Left menu divider | right border `colorScheme.primary.withValues(alpha: 0.1)`, width `1.r` | :521-526 |
| Menu list | `ListView.builder`, not wrapped in any padding | :528 |
| Menu row padding | `EdgeInsets.symmetric(horizontal: 12.r, vertical: 12.r)` | :550 |
| Menu row height | not explicit: `12.r` + max(icon `20.r`, text line) + `12.r` | :550-588 |
| Row fill, cursor row | `colorScheme.primary.withValues(alpha: 0.15)` whenever `isSelected` (even while focus is in the detail pane) | :552-554 |
| Row fill, others | transparent | :554 |
| Row left bar | `3.r` wide, `colorScheme.primary` only when `isSelected && _focusOnMenu`; transparent otherwise (still reserves 3.r) | :555-561 |
| Icon | `20.r`; `colorScheme.primary` when selected and menu focused, else `colorScheme.onSurface` | :566-572 |
| Icon-label gap | `12.r` | :573 |
| Label | `textTheme.bodyLarge`, `fontSize: 14.r`, `FontWeight.w600` if the cursor row else `FontWeight.normal`; colour primary when selected and menu focused, else onSurface | :575-586 |
| Ripple/hover | all InkWell colours transparent; tap plays nav SFX and selects | :539-548 |
| Right pane | `Expanded`, transparent, `padding: EdgeInsets.all(16.r)` | :598-606 |
| Menu scroll | `AdaptiveScroller.ensureVisible` on the selected row after the frame | :67-73 |
| AdaptiveScroller | centres the item (`alignment 0.5`), animates `200ms` `Curves.easeInOut`; if the previous scroll was < `180ms` ago it jumps (`Duration.zero`) | lib/utils/adaptive_scroll.dart:14-17, 61-73 |

Selection motion: none. The menu highlight, the left bar and every detail-row border swap instantly (no `Animated*` widgets in these files).

#### Menu items (in order)

| # | Label key = English | Icon | Condition | Cite |
| --- | --- | --- | --- | --- |
| 1 | `general` = "General" | `Symbols.settings_rounded` | always | new_settings_screen.dart:125-132 |
| 2 | `directories` = "Directories" | `Symbols.folder_rounded` | always | :134-141 |
| 3 | `tools` = "Tools" | `Symbols.build_rounded` | always | :143-150 |
| 4 | `secondaryDisplay` = "Secondary Screen" | `Symbols.cast_rounded` | only while `SqliteConfigProvider.isSecondaryActive` (Android dual-screen); rebuilt live when it changes, cursor clamped | :121-123, 152-161, 492-498 |
| 5 | `systemsSettings` = "Systems" | `Symbols.sports_esports_rounded` | always | :163-170 |
| 6 | `themes` = "Themes" | `Symbols.palette_rounded` | always | :172-179 |
| 7 | `systemArt` = "System Art" | `Symbols.image_rounded` | always | :181-188 |
| 8 | `about` = "About" | `Symbols.info_rounded` | always | :190-197 |
| 9 | `exit` = "Exit" | `Symbols.exit_to_app_rounded` | always | :199-206 |

`LauncherSettingsContent` ("Launcher" / "Configure launcher settings (Android only)", hardcoded English) is wired in the content switch but never added to the menu, so it is unreachable. lib/screens/settings_screen/new_settings_options/launcher_settings_content.dart:30-33, new_settings_screen.dart:665-669.

Initial state: menu index 0 (General), focus on the menu, content index 0. new_settings_screen.dart:49-53.

#### Focus model and buttons

Two states: `_focusOnMenu = true` (cursor in the menu) or `false` (cursor in the detail pane). The detail pane always renders the page for the **menu cursor** row, so moving Up/Down in the menu previews each page live without pressing anything. new_settings_screen.dart:609-611.

| Input | Menu focused | Detail focused | Cite |
| --- | --- | --- | --- |
| Up / Down | move menu cursor, **wraps** top/bottom | move content index by 1, **clamped** (no wrap) and the page scrolls to it; Themes and System Art handle Up/Down themselves (grid) | new_settings_screen.dart:228-259, 285-313 |
| Right | enter the detail pane at content index 0 (only if the page has > 0 items) | Themes/System Art: move right in their grid; other pages: nothing | :347-363 |
| Left | nothing | back to menu (content index reset to 0 and the page scrolled to top). Themes: only from grid column 0 or a NeoGlass row; System Art: always | :320-344 |
| A | same as Right (enter the pane). On the Exit item, focus jumps straight to the Exit button | activate the focused row (page-specific) | :210-222, 370-379 |
| B | nothing | back to the menu in one press (never walks a grid) | :387-390 |
| X | nothing | Themes only: delete the focused imported theme | :394-402, lib/screens/app_screen.dart:561-566 |
| L1 / R1 | switch main tab (header) | same | lib/screens/app_screen.dart:149-150 |

Input routing from the global pad handler: lib/screens/app_screen.dart:143-154, 473-566.

#### Shared row widgets used by the pages

**SettingsTitle** (page header) - lib/screens/settings_screen/new_settings_options/settings_title.dart

| Part | Value | Cite |
| --- | --- | --- |
| Title | `textTheme.titleLarge` with `fontSize: 14.r` | settings_title.dart:18-21 |
| Gap | `8.r` (only if subtitle) | :23 |
| Subtitle | `textTheme.bodyMedium`, `9.r`, `onSurface.withValues(alpha: 0.6)` | :24-30 |

**SettingRow** (toggle / value rows: General, Secondary, Themes NeoGlass, System Art logos) - widgets/setting_row.dart

| Part | Value | Cite |
| --- | --- | --- |
| Fill | `colorScheme.surface.withValues(alpha: 0.5)` | setting_row.dart:82 |
| Radius | `8.r` | :83 |
| Border | `2` logical px (not `.r`), `colorScheme.primary` when focused, else transparent | :84-87 |
| Padding | left/right `12.r`, top/bottom `6.r` | :100-105 |
| Title | `bodyLarge`, `12.r`, `w500`, primary when focused else onSurface | :56-65 |
| Title-subtitle gap | `4.r` | :66 |
| Subtitle | `bodyMedium`, `9.r`, `onSurface` alpha `0.6`, no maxLines | :70-76 |
| Gap before trailing | `12.r` | :110 |
| Layout | title column `Expanded` (unless `expandTitle: false`), then trailing | :106-112 |

**SettingValueChip** (cycled value / dropdown) - widgets/setting_value_chip.dart

| Part | Value | Cite |
| --- | --- | --- |
| Padding | h `10.r`, v `6.r` | setting_value_chip.dart:24 |
| Fill | `primary` alpha `0.15` | :26 |
| Radius | `6.r` | :27 |
| Border | `primary` alpha `0.4`, width `0.5.r` | :28-31 |
| Text | `bodyMedium`, `9.r`, `w400`, `primary` | :36-43 |
| Optional trailing glyph | gap `2.r`, icon `14.r` primary | :44-47 |

**SettingsCardRow** (action cards: Tools, Systems) - widgets/settings_card_row.dart

| Part | Value | Cite |
| --- | --- | --- |
| Fill | `cardColor` alpha `0.25` | settings_card_row.dart:68 |
| Radius | `12.r` | :69 |
| Border | selected: `primary`, `2.r`; else `outline` alpha `0`, `1.r` | :59-61, 70 |
| Margin | bottom `8.r` | :72 |
| Padding | h `12.r`, v `8.r` | :82 |
| Icon | `20.r`, primary when selected, else onSurface (alpha `0.4` if disabled) | :62-64, 88 |
| Icon gap | `12.r` | :89 |
| Title | `titleSmall`, bold, `12.r`, maxLines 1 ellipsis | :94-103 |
| Subtitle | gap `2.r`, `bodySmall`, `9.r`, onSurface alpha `0.6` (`0.25` disabled), `subtitleMaxLines` (default 1) | :104-117 |
| Trailing | gap `12.r`, then control | :121-122 |

**SettingsActionButton** (round trailing button on cards) - widgets/settings_action_button.dart

| Part | Value | Cite |
| --- | --- | --- |
| Shape | circle, padding `4.r` | settings_action_button.dart:34-37 |
| Fill | `primary` (or `error` if destructive) at alpha `1.0` when row selected, `0.8` otherwise | :29-31, 36 |
| Shadow | same colour alpha `0.3`, blur `4.r`, offset `(0, 2.r)` | :38-44 |
| Icon | `16.r`, `onPrimary` | :46 |

**SettingsSectionHeader** - widgets/settings_section_header.dart

| Part | Value | Cite |
| --- | --- | --- |
| Padding | bottom `8.r`, top `4.r`, left `2.r` | settings_section_header.dart:20 |
| Accent bar | `3.r` x `14.r`, `primary`, radius `2.r` | :23-30 |
| Gap | `8.r` | :31 |
| Label | `11.r`, bold, `primary`, `letterSpacing: 0.5` (not uppercased) | :32-40 |

**CustomToggleSwitch** - lib/widgets/custom_toggle_switch.dart (package `animated_toggle_switch` 0.8.7, `AnimatedToggleSwitch.dual`)

| Part | Value | Cite |
| --- | --- | --- |
| Height | `28.r` | custom_toggle_switch.dart:47 |
| Thumb | `Size(24.r, 24.r)` | :42 |
| Spacing | `16.r` | :46 |
| Border | width `2.r`, colour transparent | :48-49 |
| Track ON | `Color.alphaBlend(activeColor.withValues(alpha: 0.20), colorScheme.surface)` | :31-34, 61 |
| Track OFF | `colorScheme.surface` | :61 |
| Thumb ON | `activeColor` (callers pass `colorScheme.primary`; default primary) | :25, 62 |
| Thumb OFF | `colorScheme.onSurfaceVariant` | :62 |
| Thumb icon | `check_rounded` ON / `close_rounded` OFF, `12.r`; colour `onPrimary` (or `onSecondary` if active colour is secondary) ON, `surface` OFF | :37-39, 64-70 |
| Track text | "ON" / "OFF" (hardcoded, not localised), `8.r`, bold, `onSurfaceVariant` | :71-80 |
| Disabled | `IgnorePointer` + `Opacity(0.6)` | :83-85 |
| SFX | enter sound when switched on, back sound when off | :52-58 |
| Animation duration/curve | package default - not set in source; package source not available locally | not found |

**CustomRadioButton** - lib/widgets/custom_radio_button.dart (not used by any settings page in this commit; listed for completeness)

| Part | Value | Cite |
| --- | --- | --- |
| Row | padding l/r `12.r`, t/b `6.r`; fill `cardColor` alpha `0.25`; radius `8.r`; border `2` primary when focused | custom_radio_button.dart:42-55 |
| Title / subtitle | `bodyLarge` `12.r` `w500` (primary when focused); gap `4.r`; `bodyMedium` `9.r` onSurface `0.6` | :63-83 |
| Indicator | gap `16.r`; `24.r` circle, border `2.0` primary (selected) or `outline` alpha `0.5`; fill primary or `scaffoldBackgroundColor` alpha `0.2`; inner dot `10.r` `onPrimary` | :88, 102-130 |
| Motion | `AnimatedContainer` `200ms` `Curves.easeOut` | :103-104 |

#### Page: General

`new_settings_options/general_settings_content.dart`. Header: `generalSettings` = "General Settings" (pinned, list scrolls under it), gap `12.r`, `SingleChildScrollView` with `ClampingScrollPhysics` and bottom padding `24.r`. Rows are `SettingRow` separated by `SizedBox(height: 12.r)`. general_settings_content.dart:513-526.
A on a toggle row flips it; the toggle itself is also tappable. Every row plays the nav sound on A (:297).

| # | Title = English | Subtitle = English | Control | Default | Platform | Cite |
| --- | --- | --- | --- | --- | --- | --- |
| a | `androidSystemSettings` = "System Settings" | `androidSystemSettingsSubtitle` = "Open android system settings" | trailing icon `open_in_new_rounded` `18.r` onSurface `0.7`; A opens Android settings | - | **Android only** | :528-550, 184-193 |
| b | `scanOnStartup` = "Scan folders on Startup" | `scanOnStartupSubtitle` = "Automatically scan ROM folders when the application starts" | toggle | ON | all | :553-575; lib/models/config_model.dart:257 |
| c | `ignoreHiddenFiles` = "Ignore hidden items" | `ignoreHiddenFilesSubtitle` = "Hide hidden files and folders during ROM scans" | toggle | ON | all | :578-601; config_model.dart:258 |
| d | `autoUpdateApp` = "Auto-update App" | `autoUpdateAppSubtitle` = "Check for new app versions on startup and prompt to update" | toggle | ON | all | :604-627; config_model.dart:279 |
| e | `autoUpdateSystems` = "Auto-update Systems & Emulators" | `autoUpdateSystemsSubtitle` = "Check for updated system and emulator configs on startup" | toggle | ON | all | :630-653; config_model.dart:280 |
| f | `sfxSounds` = "UI Navigation Sounds" | `sfxSoundsSubtitle` = "Play sound effects for gamepad, keyboard and touch navigation" | toggle | ON | all | :656-677; config_model.dart:262 |
| g | `sfxVolume` = "UI Sounds Volume" | `sfxVolumeSubtitle` = "Adjust volume and play a preview sound" | value chip, A cycles Low -> Medium -> High -> Low (`maxVolume/3`, `2/3`, `maxVolume`); whole row `Opacity(0.4)` and A inert while SFX are off, but still navigable | High (`0.75` = `SfxService.maxVolume`) | all | :64-68, 350-358, 472-495, 682-700; config_model.dart:263; lib/services/sfx_service.dart:21 |
| h | `use12HourClock` = "Use 12-Hour Clock" | `use12HourClockSubtitle` = "Show the clock in 12-hour format with AM/PM instead of 24-hour" | toggle | OFF | all | :703-726; config_model.dart:264 |
| i | `subfolderViewAll` = "Show Subfolders in Every System" | `subfolderViewAllSubtitle` = "Apply the per-system Show Subfolders setting to every system at once" | toggle; after writing, if any system had its own setting, an InfoDialog (title = row title, body `subfolderViewAllOverridesNotice`, icon `folder_rounded`) | OFF | all | :276-294, 731-750; config_model.dart:294 |
| j | `showCloudSyncIcon` = "Cloud Save Icon" | `showCloudSyncIconSubtitle` = "Show the cloud sync status beside the selected game" | toggle | ON | all | :753-776; config_model.dart:292 |
| k | `showAchievementsBadge` = "Achievement Badges" | `showAchievementsBadgeSubtitle` = "Show the achievement count on games matched to RetroAchievements" | toggle | OFF | all | :779-802; config_model.dart:291 |
| l | `raMatchOnStartup` = "Match achievements on Startup" | `raMatchOnStartupSubtitle` = "Matches new ROMs after the startup scan. To match a whole library, run Match RetroAchievements Games in Tools first." | toggle; turning ON with a backlog >= 500 un-hashed ROMs shows an InfoDialog (body `raMatchOnStartupBacklogWarning`, icon `trophy_rounded`) | OFF | all | :236, 246-268, 805-824; config_model.dart:293 |
| m | `showSearchTab` = "Show Search tab" | `showSearchTabSubtitle` = "Display the Search tab in the navigation bar" | toggle (shows `!hidden`) | ON | all | :828-856; lib/utils/nav_tabs.dart:69-77; config_model.dart:277 |
| n | `showSyncTab` = "Show NeoSync tab" | `showSyncTabSubtitle` = "Display the NeoSync tab in the navigation bar" | toggle | ON | all | nav_tabs.dart:78-85; config_model.dart:273 |
| o | `showAchievementsTab` = "Show Achievements tab" | `showAchievementsTabSubtitle` = "Display the RetroAchievements tab in the navigation bar" | toggle | ON | all | nav_tabs.dart:86-93; config_model.dart:274 |
| p | `showScraperTab` = "Show Scraper tab" | `showScraperTabSubtitle` = "Display the Scraping tab in the navigation bar" | toggle | ON | all | nav_tabs.dart:94-101; config_model.dart:275 |
| q | `showRommTab` = "Show RomM tab" | `showRommTabSubtitle` = "Display the RomM tab in the navigation bar" | toggle | ON | all | nav_tabs.dart:102-109; config_model.dart:276 |
| r | `language` = "Language" | `languageSub` = "Select preferred language for game metadata" | value chip showing the language's native name + trailing `arrow_drop_down_rounded`; A opens the language picker overlay | "English" (`'en'`) | all | :859-877, 1047-1075; lib/data/datasources/sqlite_config_service.dart:174; lib/main.dart:302 |
| s | `fullscreenMode` = "Fullscreen Mode" | `fullscreenModeSubtitle` = "Display the app in fullscreen mode" | toggle; `expandTitle: false` (title column not expanded) | ON | **Windows, Linux, macOS** (not web) | :880-905; config_model.dart:255, 341-342 |
| t | `allFilesAccess` = "All Files Access" | custom subtitle: line 1 `permissionGranted` = "Permission granted" (green) or `permissionDisabled` = "Permission disabled" (red), `bodyMedium` `9.r` bold; gap `2.r`; line 2 `allFilesAccessSubtitle` = "Required for RetroArch config and Save Sync", `8.r` onSurface `0.5` | toggle reflecting the grant; A requests the grant, or opens system settings if already granted | reflects OS | **Android only** | :158-169, 908-955 |
| u | `defaultLauncher` = "Default Launcher" | `isDefaultLauncher` = "NeoStation is your default launcher" when default, else `setAsDefaultLauncher` = "Set NeoStation as your home screen" | toggle reflecting launcher state; A opens the Android launcher chooser | reflects OS | **Android only** | :139-155, 172-181, 958-976 |
| v | `disableSecondaryScreen` = "Disable on secondary screen" | `disableSecondaryScreenSub` = "It turns off the app on secondary display" | toggle | OFF | **Android only** (shown even without a second display) | :981-1009; config_model.dart:260 |
| w | `bartopShutdown` = "BarTOP Shutdown on Exit" | `bartopShutdownSubtitle` = "Shut down the computer when exiting the application" | toggle | OFF | **Windows, Linux** (not macOS, not web) | :1012-1037; config_model.dart:256 |

Row counts: Android build = 22 rows (a, b-r, t, u, v); Linux build = 20 rows (b-r, s, w). Count logic: general_settings_content.dart:196-227.
Spacing quirk: row a is followed by a `12.r` gap and row b has none before it; on Android row t/u each end with a `12.r` gap and row v has none before it. :549, 956, 977.
Android-only resume hook: 500ms after resume, re-checks launcher and All-Files status. :92-101.

**Language picker overlay** - widgets/language_picker_overlay.dart, opened with `showGeneralDialog` (barrier transparent, `barrierDismissible: true`, child in a `FadeTransition` driven by the route animation; transition duration left at the framework default). general_settings_content.dart:1056-1070.

| Part | Value | Cite |
| --- | --- | --- |
| Width | `180.r` | language_picker_overlay.dart:109 |
| Item height | `24` then used as `24.r` | :110, 154, 179 |
| Position | right edge aligned to the row's right edge; `top = rowCentreY - (itemHeight*count+16).r / 1.5`; clamped 8 px from every screen edge | :111-117, general_settings_content.dart:1065 |
| Panel | vertical padding `8.r`, `colorScheme.surface`, radius `12.r`, border `primary` alpha `0.2` width `1`, shadow black alpha `0.25` blur `15` offset `(0,5)` | :128-143 |
| Cursor | `AnimatedPositioned` `150ms` `Curves.easeInOut`, inset left `6.r` right `4.r`, fill primary `0.15`, radius `8.r`, border primary `0.3` `0.5.r` | :147-169 |
| Item | padding h `12.r`; text `10.r`; the **current** language (not the cursor) is `secondary` + `w600` + trailing `check_rounded` `12.r` secondary; others onSurface `w400` | :196-221 |
| Entries | English, Español, Русский, 简体中文, 繁體中文, Português, Français, Deutsch, Italiano, Bahasa Indonesia, 日本語, 한국어 | lib/l10n/app_locale.dart:1346-1359 |
| Buttons | Up/Down move and **wrap**, nav SFX; A selects (enter SFX) and closes; B closes without change | :46-63, 100-103 |

#### Page: Directories

`new_settings_options/directories_settings_content.dart`. Header `configureDirectories` = "Directories", subtitle `configureRomsFolder` = "Configure ROMs folder"; gap `12.r`; then optional progress panels; then a `ListView` (header pinned). :866-878.
Loading state: header, `SizedBox(height: 24.h)`, centred `CircularProgressIndicator`. :850-861.

Rows are custom cards (same chrome as `SettingsCardRow` plus destructive variant). Card: fill `cardColor` alpha `0.25` (or `error` alpha `0.08` when a remove row is selected), radius `12.r`, border `2.r` primary (error for remove rows) when selected else `outline` alpha `0` `1.r`, margin bottom `8.r`, padding h `12.r` v `8.r`; icon `20.r` (primary/error when selected, else onSurface); gap `12.r`; title `titleSmall` bold `12.r` (remove rows: the path in `monospace` `10.r`), maxLines 2; gap `2.r`; subtitle `bodySmall` `9.r` onSurface `0.6` (error `0.7` when a remove row is selected). :925-1041.

| Order | Section header | Title = English | Subtitle = English | Leading icon | Trailing button | Condition | Cite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | (none) | `userDataLocation` = "User Data Location" | `userDataLocationSubtitle` = "Choose where scraped media, system art packs, and app data are stored" | `folder_special_rounded` | `edit_rounded` | always; current path chip below | :110-114, 1058-1062, 1089-1131 |
| 1 | (none) | `rescanAllFolders` = "Rescan All ROM Folders" | `rescanAllFoldersSubtitle` = "Manually scan for new systems and ROMs" | `refresh_rounded` | `refresh_rounded` | always | :117-121, 1053-1057 |
| - | `romDirectories` = "ROM Directories" | | | | | before item 2 | :886-891 |
| 2 | | `addRomFolder` = "Add ROM Folder" | `romsFolderSubtitle` = "Add a folder containing your ROM files" | `folder_rounded` | `add_rounded` | always; max 5 folders, else toast `maxRomFoldersReached` = "Maximum 5 ROM folders allowed" | :124-128, 477-486 |
| 3..n | | the folder path (monospace `10.r`) | `pressToRemoveFolder` = "Press confirm to remove this folder" | `folder_rounded` | `delete_outline_rounded` (destructive, error colour) | one per configured ROM folder | :131-138, 1042-1047 |
| - | `esdeImport` = "ES-DE Import" | | | | | before the first ES-DE row | :893-897 |
| n+1 | | `esdeSelectFolder` = "Select ES-DE Folder" | `esdeSelectFolderSubtitle` = "Choose the ES-DE folder containing gamelists and downloaded_media" | `folder_special_rounded` | `folder_special_rounded` | disabled (Opacity `0.4`, inert) until a ROM folder exists; path chip below once set | :142-146, 165-180, 931-933, 1083-1088 |
| n+2 | | `esdeRunImport` = "Import from ES-DE" | `esdeRunImportSubtitle` = "Fill in missing metadata and use ES-DE artwork as fallback" | `download_rounded` | `download_rounded` | disabled until a ROM folder exists **and** an ES-DE folder is set | :147-151, 175-180 |
| n+3 | | `esdeReset` = "Reset ES-DE Import" | `esdeResetSubtitle` = "Remove imported metadata and media links so the import can be re-run" | `restart_alt_rounded` | `restart_alt_rounded` (destructive) | disabled until a ROM folder exists | :152-156 |

Path chip (user data and ES-DE): `SizedBox(height: 6.r)` above; padding h `8.r` v `4.r`; fill primary alpha `0.06`; radius `6.r`; `folder_rounded` `11.r` primary `0.5`; gap `6.r`; text `9.r` onSurface `0.55` `monospace`, maxLines 2. :1086-1131, 1171-1201.

Progress panels (shown above the list; each: margin bottom `12.r`, padding `12.r`, fill primary `0.1`, radius `12.r`, border primary `0.2` `1.r`; label `titleSmall` bold `10.r` primary; percent `bodySmall` bold `10.r` primary; gap `8.r`; `LinearProgressIndicator` minHeight `6.r`, radius `4.r`, bg primary `0.1`, value primary; optional detail line gap `4.r`, `9.r`):
- User-data move: label `migratingUserData` = "Moving User Data" until 50%, then "Delete..."; file name monospace onSurface `0.5`. :708-777
- Scan: label is the provider's scan status; bar indeterminate until the system count is known; detail `scanningSystem` = "Scanning system" + " X of Y" (the " of " is hardcoded English) onSurface `0.6`. :779-844
- ES-DE import: `esdeImporting` = "Importing from ES-DE"; bar indeterminate at 0. :1203-1269
- ES-DE result summary (after a successful import): fill primary `0.06`, radius `12.r`, no border; title `esdeImportComplete` = "ES-DE import complete" bold `11.r` primary; gap `4.r`; three lines `9.5.r` onSurface `0.7`: "Systems matched: N   unmatched: N   skipped (unreadable): N / Games imported: N   no ROM match: N / Favorites / stats updated: N". :1271-1308

Actions:
- User Data Location: folder picker (see picker rules below), then **MoveUserDataDialog**; on confirm the data is migrated with the inline progress panel, then **RestartRequiredDialog** (`barrierDismissible: false`). :554-690
- Remove ROM folder: ConfirmActionDialog, title/confirm `removeRomFolder` = "Remove", body `removeRomFolderConfirmBody` = "This will remove this ROM folder from your library sources. Your files on disk are not deleted.", icon `folder_delete_rounded`, accent default (error). Then toast `romFolderRemoved` = "ROM folder removed". :521-548
- Reset ES-DE: ConfirmActionDialog, title/confirm "Reset ES-DE Import", body `esdeResetConfirmBody`, icon `restart_alt_rounded`, accent error; toast "ES-DE import reset (N)". :427-465
- Folder picker per platform: **Android TV** -> in-app `TvDirectoryPicker.show`; **Android (not TV)** -> system SAF picker, falling back to TvDirectoryPicker on `PICKER_FAILED`; **desktop (Linux/Windows/macOS)** -> `TvDirectoryPicker.pickDirectory` = OS/XDG-portal picker, falling back to the in-app browser when the portal throws (SteamOS Game Mode). :240-273, 488-510, 558-591; lib/widgets/tv_directory_picker.dart:59-76

#### Page: Tools

`new_settings_options/tools_settings_content.dart`. Header `tools` = "Tools", subtitle `toolsSubtitle` = "Tools to help organise your ROMs"; gap `12.r`; `ListView` of 3 `SettingsCardRow` (subtitle maxLines 2). :485-576

| # | Title = English | Subtitle = English | Icon / trailing | A does | Cite |
| --- | --- | --- | --- | --- | --- |
| 0 | `rematchAchievements` = "Match RetroAchievements Games" | `rematchAchievementsSubtitle` = "Check your whole library for achievement sets, instead of one game at a time" | `emoji_events_rounded`; trailing button `emoji_events_rounded`, or `pause_rounded` while running | while running: pause. Else ConfirmActionDialog (title = row title, body `rematchAchievementsWarning` + "\n\n" + `rematchAchievementsSignedOut` if RA signed out, confirm `confirm` = "Confirm", icon `emoji_events_rounded`, accent **primary**) | :423-475, 511-531 |
| 1 | `cleanOrphanedMetadata` = "Clean Orphaned Metadata" | `cleanOrphanedMetadataSubtitle` = "Remove metadata and media left behind by deleted ROMs" | `cleaning_services_rounded` (both) | nothing orphaned: InfoDialog (body `cleanOrphanedMetadataNothingFound` = "No orphaned metadata found.", icon `cleaning_services_rounded`). Else ConfirmActionDialog (body = warning + blank line + hardcoded English "Found N orphaned metadata entr(y/ies). M will be deleted from the database and disk." [+ "K ES-DE imported entr(y/ies) will be left untouched."], confirm `delete` = "Delete", accent **error**) | :250-414, 532-554 |
| 2 | `organizeMultiDiscGames` = "Organize Multi-Disc Games" | `organizeMultiDiscGamesSubtitle` = "Automatically creates .m3u files for multi disc games and organises them into folders" | `folder_managed_rounded` (both) | no ROM folders: toast `organizeMultiDiscNoRomFoldersConfigured`. Else ConfirmActionDialog (body `organizeMultiDiscWarning`, confirm "Confirm", icon `folder_managed_rounded`, accent **primary**) | :100-248, 555-576 |

Inline progress under a running tool's card (mirrors the notification of the same id): top padding `8.r`; bar minHeight `4.r`, radius `2.r`, bg `surface` alpha `0.4`, value primary; gap `8.r`; percent `10.r` `w600` primary; message gap `4.r`, `9.r` onSurface `0.6`, maxLines 1. :598-657

#### Page: Secondary Screen

`new_settings_options/secondary_settings_content.dart`. **Only exists while a secondary display is active (Android dual-screen devices)**. Header `secondaryDisplay` = "Secondary Screen" (pinned); gap `12.r`; scroll with bottom padding `24.r`. Rows are `SettingRow`, indented left `16.r` under section headers; `12.r` between rows, `24.r` before a new section. :59, 277-358

| # | Section | Title = English | Subtitle = English | Control / values | Default | Cite |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | `general` = "General" | `nowPlayingFanartDim` = "Dim fanart" | `nowPlayingFanartDimSubtitle` = "Darken the background art behind the logo so a busy fanart does not clash with it" | chip; cycles 0 -> 25 -> 50 -> 75 -> 0; 0 shows `nowPlayingDimOff` = "Off", else "N%" | 25 | :136-143, 168-170, 290-301; config_model.dart:286 |
| 1 | General | `screenshotAccess` = "Screen return & screenshots" | `screenshotAccessSubtitle` = "Restores the Now Playing screen when you close an app opened from the dock, and lets the screenshot button capture the screen (opens Android accessibility settings)" | toggle reflecting the accessibility grant; A opens Android accessibility settings | reflects OS | :253-270 |
| 2 | `secondarySectionNowPlaying` = "Now Playing panel" | `nowPlayingDimAfter` = "Dim Now Playing after" | `nowPlayingDimAfterSubtitle` = "Inactivity before the in-game panel dims on the secondary screen" | chip; cycles 1 -> 3 -> 5 -> 0; shows "1s"/"3s"/"5s", 0 = `nowPlayingDimNever` = "Never" | 3 | :47, 163-178, 305-318; config_model.dart:284 |
| 3 | Now Playing panel | `nowPlayingDimDarkness` = "Dim darkness" | `nowPlayingDimDarknessSubtitle` = "How dark the in-game panel goes when it dims" | chip; cycles 25 -> 50 -> 75 -> 100 ("N%"); Opacity `0.4` and inert while delay is Never | 100 | :51, 182-193, 320-329; config_model.dart:285 |
| 4 | `secondarySectionDock` = "App dock" | `nowPlayingDockEnabled` = "App dock" | `nowPlayingDockEnabledSubtitle` = "Show the app dock on the secondary screen" | toggle | ON | :334-342; config_model.dart:288 |
| 5 | App dock | `nowPlayingDockSlots` = "Dock slots" | `nowPlayingDockSlotsSubtitle` = "How many app slots the dock shows (1-5)" | chip "N"; cycles 1..5 then back to 1; Opacity `0.4` and inert while dock off | 3 | :146-152, 344-353; config_model.dart:11-15, 289 |

#### Page: Systems

`new_settings_options/systems_settings_content.dart`. Header `systemsSettings` = "Systems", subtitle `systemsSettingsSubtitle` = "Show or hide systems from your library"; gap `12.r`; `ListView` of `SettingsCardRow` (subtitle 1 line). Trailing is a value chip if the row has a value, else a toggle. :157-197

| # | Title = English | Subtitle | Icon | Control | Default | Condition | Cite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `hideRecentCard` = "Recent Games Card" | `hideRecentCardSubtitle` = "Show the recently played card in the systems grid" | `access_time_rounded` | toggle (ON = shown) | ON | always | :92-99; config_model.dart:270 |
| 1 | `recentCardSize` = "Recent Card Size" | `recentCardSizeSubtitle` = "Size of the recently played card in the systems grid" | `aspect_ratio_rounded` | chip toggling `recentCardSizeDefault` = "Default" / `recentCardSize2x1` = "Compact" | Default | disabled (dimmed, inert) while the recent card is hidden | :100-114; config_model.dart:271 |
| 2 | `favorite` = "Favorite" | literal `favorites` | `favorite_rounded` | toggle (ON = shown) | ON if there are favourites | disabled while there are no favourites | :115-127 |
| 3.. | each detected system's real name | its folder name | `videogame_asset_rounded` | toggle (ON = shown) | ON | one per detected system | :128-139 |

#### Page: Themes

`new_settings_options/themes_settings_content.dart`. Unlike General, the **title scrolls with the page** (one `SingleChildScrollView`, bottom padding `24.r`). :388-392

Order: header `themes` = "Themes" / `themesSubtitle` = "Personalize the appearance of your NeoStation"; gap `12.r`; group label `neoglassGroup` = "NeoGlass" (`titleMedium`, `13.r`, `w600`); gap `8.r`; three `SettingRow`s with value chips separated by `8.r`; gap `20.r`; theme grid. :395-512

| Index | Title = English | Subtitle = English | Values (cycle order) | Default | Cite |
| --- | --- | --- | --- | --- | --- |
| 0 | `neoglassBlur` = "Glass Blur" | `neoglassBlurSubtitle` = "Frost strength: Off, 1 or 2" | 0 ("Off") -> 1 -> 2 | 0 / "Off" | :60, 252-254, 410-415, 542-543; config_model.dart:296 |
| - | (when blur > 0) warning `neoglassBlurGpuWarning` = "Only enable on a powerful GPU - on low-end hardware the frosted blur may not stay smooth.", `9.r` onSurface `0.6`, h padding `12.r`, gap `4.r` above | | | | :416-430 |
| 1 | `neoglassTransparency` = "Glass Transparency" | `neoglassTransparencySubtitle` = "0 = no transparency, 30 = 50% transparency" | 0 -> 10 -> 20 -> 30 (chip shows the number) | 10 | :64, 257-260, 432-437; config_model.dart:297 |
| 2 | `neoglassBorderWidth` = "Glass Border" | `neoglassBorderWidthSubtitle` = "Width of the glass edge" | 0 ("Off") -> 1 -> 2 -> 3 -> 4 | 2 | :67, 262-267, 439-444, 546-548; config_model.dart:298 |

**Theme grid**: `GridView` (shrink-wrapped), `crossAxisSpacing: 8.r`, `mainAxisSpacing: 8.r`, `childAspectRatio: 1.05`. :448-457
Columns (`Responsive.getThemesCrossAxisCount`, logical screen width): >= 1280 -> 6; 840-1279 -> 5; 690-839 -> 4; 560-689 -> 4; < 560 -> 4. lib/responsive.dart:21-40, 87-93
Cells in order: `systemTheme` = "System"; Dark, Light, OLED, Valentine, Dracula, Nord, Coffee, Tokyo Night, Retro, Abyss, Cyberpunk, Aqua, Palenight, Horizon; then imported themes; then the Import tile (`importTheme` = "Import Theme"). :374-380; lib/providers/theme_provider.dart:50-84, 256-266

Grid navigation (index 0-2 are the NeoGlass rows, grid starts at 3): :113-202; lib/utils/gamepad_nav.dart:1515-1574
- Down from row 2 enters grid cell 0; Down on the grid's last row wraps to the top row (same column).
- Up from the grid's top row goes to NeoGlass row 2; Up from row 0 wraps to the grid's last cell.
- Right on a NeoGlass row does nothing; Right at a row end wraps to that row's start.
- Left on a NeoGlass row or grid column 0 returns to the menu; otherwise moves left.
- A on a NeoGlass row cycles it; on a theme applies it instantly; on the Import tile opens a JSON file picker (Android TV: in-app file picker; else system picker). :219-243, 274-334
- X on an imported theme: ConfirmActionDialog `deleteThemeTitle` = "Delete Theme?", body `deleteThemeConfirm` = "Remove the imported theme \"%s\"?", confirm "Delete", icon `delete_rounded`. Long-press / the card's close badge do the same. :338-366, 503-508

**ThemeCard** - lib/widgets/theme_card.dart

| Part | Value | Cite |
| --- | --- | --- |
| Preview box | `AspectRatio(4/3)`, margin vertical `4.h`, radius `8.r`, border `2.r` primary when focused else transparent | theme_card.dart:59-70 |
| Focus glow | primary alpha `0.3`, blur `8.r`, spread `1.r` (focused only) | :71-79 |
| Clip | radius `6.r` | :81-82 |
| Preview art | `CustomPaint` mock of the app in that theme's `surface`/`primary`/`secondary` (top bar 15% h, 6 nav dots with the 2nd lit, bottom bar 22% h with 11 chips, 3-card carousel) | :86-111, 203-360 |
| Active theme mark | centred `36.r` circle `Colors.greenAccent`, `check_rounded` `24.r` black | :116-131 |
| Delete badge (imported only) | top/right `4.r`, circle black alpha `0.55`, padding `3.r`, `close_rounded` `16.r` white | :153-177 |
| Label | gap `4.r`; `12.r`, centred, maxLines 1; onSurface when focused or active else onSurface `0.7`; bold only when active | :183-197 |

**ImportThemeCard**: same footprint; fill `surface` alpha `0.35`; border `2.r` primary when focused else onSurface `0.25` (solid, despite a comment saying dashed); `add_rounded` `32.r` primary (focused) or onSurface `0.6`; label bold when focused. theme_card.dart:389-454

#### Page: System Art

`new_settings_options/system_art_settings_content.dart`. Whole panel scrolls (bottom padding `24.r`). Header `systemArt` = "System Art", subtitle `systemArtSubtitle` = "Customize system card backgrounds with System Art packs"; gap `12.r`. :170-181
Single-column list: Up/Down **wrap**; Left always returns to menu; Right does nothing. :44-92

| # | Row | Detail | Cite |
| --- | --- | --- | --- |
| 0 | `SettingRow` `systemArtHideLogos` = "Hide system logos" / `systemArtHideLogosSubtitle` = "Hide the logo on system cards when the background already includes one"; toggle; default OFF; bottom padding `8.r` | :212-237; config_model.dart:295 |
| 1 | "None" tile: margin v `4.r`, padding `8.r`, fill `cardColor`, radius `12.r`, border focused `primary` `2.r` / active `Colors.greenAccent` alpha `0.7` `1.r` / else onSurface `0.12` `1.r`; `64.r` square (surface, radius `8.r`) with `block_rounded` `28.r` onSurface `0.3`; gap `12.r`; `systemArtNone` = "None" `titleSmall` `14.r` bold; gap `4.r`; `systemArtNoneSubtitle` = "Default appearance" `10.r` onSurface `0.65`; active = `check_circle_rounded` `18.r` greenAccent. A (if a pack is active): confirm dialog then clear | :113-126, 239-322 |
| 2.. | one `SystemArtPackTile` per pack from the NeoAssets catalogue (network); A opens `SystemArtPackDialog` (not covered here) | :128-133, 190-204 |

Loading state: `24.r` spinner (stroke 2, primary), gap `12.r`, `systemArtLoading` = "Loading System Art..." `11.r` onSurface `0.6`, padding `32.r`. :324-350
Downloading state: `48.r` determinate ring (stroke 3, primary, bg primary `0.15`), gap `16.r`, `systemArtDownloading` = "Downloading System Art pack..." `12.r` onSurface `0.8`, gap `4.r`, "P%  (done/total)" `14.r` `w600` primary. :352-395

Apply/clear confirm (`_ThemeConfirmDialog`, `barrierDismissible: false`): AlertDialog bg `cardColor`, radius `12.r`, side primary `0.3`; title row `image_rounded` `20.r` primary + gap `8.r` + `systemArtApplyTitle` = "Apply System Art?" (or `systemArtRedownloadTitle` = "Re-download System Art?") `titleMedium` `14.r` primary `w600`; content: quoted pack name `bodyLarge` `13.r` `w600`, and (not for None) gap `8.r` + `systemArtApplyBody`/`systemArtRedownloadBody` `11.r` onSurface `0.7`; actions identical to ConfirmActionDialog but ElevatedButton radius `8.r`, confirm label `apply` = "Apply" (or `download` = "Download"), label `12.r` without weight. A = confirm, B = cancel. :398-563

**SystemArtPackTile** (also used by the wizard) - lib/widgets/system_art_pack_tile.dart: margin v `2.r`, padding `6.r`, fill `cardColor`, radius `10.r`, border highlighted (focused or selected) primary `2.r` + glow primary `0.25` blur `8.r` spread `1.r`; active greenAccent `0.7` `1.r`; else onSurface `0.12` `1.r`. Contents: 2x2 mosaic (`mosaicSize.r`, default 56, radius `8.r`, `2.r` gutters, network images, surface placeholders), gap `10.r`, details, `chevron_right_rounded` `18.r` onSurface `0.35`. Details: name `titleSmall` `12.r` bold maxLines 1; optional "AI" pill (black `0.62`, border white `0.35` `1.r`, radius `999.r`, padding h `6.r` v `1.r`, `8.r` `w800` white, letterSpacing `0.4`); active `check_circle_rounded` `15.r` greenAccent; gap `2.r`; "by {author}  ·  v{version}" `9.r` onSurface `0.65`; gap `4.r`; chips (`systemArtSystemsCovered` = "{count} systems", `systemArtDownloads` = "{count} downloads") padding h `5.r` v `1.r`, fill onSurface `0.06`, radius `999.r`, icon `11.r` + gap `3.r` + text `8.r` onSurface `0.7`, spacing `5.r`, runSpacing `3.r`. system_art_pack_tile.dart:48-297

#### Page: About

`new_settings_options/about_settings_content.dart`. Whole page scrolls. Header only: `thankYou` = "Thank you for using NeoStation!" (no subtitle); gap `12.r`; `Padding(horizontal: 6.r)` Row: :175-319

Left column (not focusable): `64.r` logo `assets/images/logo_transparent.png`; gap `6.r`; "NeoStation" `titleMedium` bold `12.r`; `SizedBox(height: 1.h)`; "Beta v{version}" `bodySmall` `9.r` onSurface `0.6`; `1.h`; "Systems v{systemsVersion}" `8.r` onSurface `0.4`. Version fallbacks "v1.0.0" and "bundled". :74, 91, 188-231
Gap `16.r`, then an `Expanded` column of 6 cards separated by `SizedBox(height: 8.h)`. :233-313

| # | Title = English | Value line | Trailing icon | A does | Cite |
| --- | --- | --- | --- | --- | --- |
| 0 | `openSourceLicense` = "Open Source Project" | `openSourceLicenseDesc` = "Licensed under GPLv3" | `open_in_new_rounded` | opens github.com/misobadev/neostation-frontend | :238-250 |
| 1 | `supportOnKofi` = "Support us on Ko-fi" | "ko-fi.com/neostation" | `open_in_new_rounded` | opens ko-fi | :252-262 |
| 2 | `supportOnPatreon` = "Support us on Patreon" | "patreon.com/NeoStation" | `open_in_new_rounded` | opens Patreon | :264-274 |
| 3 | `joinCommunity` = "Join our community and get support" | "discord.gg/xE2kgKsRVq" | `open_in_new_rounded` | opens Discord | :276-286 |
| 4 | `visitWebsite` = "Visit our official website" | "neostation.dev" | `open_in_new_rounded` | opens neostation.dev | :288-298 |
| 5 | `exportLogs` = "Export logs" | `exportLogsDesc` = "For bug reports. Includes file paths and game names." | `share_rounded` on **Android**, `download_rounded` elsewhere | zip logs: Android share sheet; desktop save dialog, then toast `exportLogsSaved` and opens the folder | :104-142, 300-313 |

Card: padding `6.r`, fill `cardColor` alpha `0.25`, radius `12.r`, border `2` (logical) primary when focused else transparent; `SizedBox(width: 8.r)`; title `titleSmall` bold `12.r`; gap `2.r`; value `bodySmall` `9.r` `w500` **primary**; trailing icon `14.r` onSurface `0.4`. The `icon` argument each card is given (code/coffee/favorite/chat/language/bug) is **never drawn**. :325-396

#### Page: Exit (the quit confirm)

`new_settings_options/exit_settings_content.dart`. There is no quit dialog anywhere; this page is the confirm.

| Part | Value | Cite |
| --- | --- | --- |
| Header | `exitApplication` = "Exit Application", subtitle `exitConfirmation` = "Are you sure you want to exit NeoStation?" | exit_settings_content.dart:54-57 |
| Gap | `12.r`, then a centred column | :58-62 |
| Button | `ElevatedButton.icon`, width `120.r`; icon `power_settings_new_rounded` `16.r`; label `confirmExit` = "Confirm Exit" `8.r` bold | :64-75 |
| Focused | fill `colorScheme.error`, fg `Colors.white`, border error `2.r`, elevation 2 | :76-99 |
| Unfocused | fill error alpha `0.1`, fg error, border error `1.r`, elevation 0 | same |
| Shape | padding v `8.r` h `12.r`, radius `6.r`, overlay transparent | :85-102 |
| After button | `SizedBox(height: 16.r)` | :106 |

Behaviour: choosing the Exit menu item with A moves focus straight to the button (:218-221 of the screen). The screen reports 1 navigable item for Exit even though the page says 2 - there is no Cancel button drawn; B (or Left) returns to the menu. new_settings_screen.dart:424-425; exit_settings_content.dart:32-34.
A on the button: **Android** -> `SystemNavigator.pop()`; **Windows/Linux/macOS** -> if BarTOP shutdown is on, run `shutdown /s /t 0` (Windows) or `shutdown -h now` (Linux), then `exit(0)`. new_settings_screen.dart:460-483

---

### Shared dialogs

All dialogs push a gamepad layer and bind A/B themselves. None animate beyond the framework's default `showDialog` fade; barrier is the framework default (not set in source). All are opened with `barrierDismissible: false`.

#### ConfirmActionDialog

lib/widgets/confirm_action_dialog.dart. Material 3 `AlertDialog` (title/content/actions paddings, inset and elevation are framework defaults - not in source).

| Part | Value | Cite |
| --- | --- | --- |
| Buttons | A = confirm (returns true), B = cancel (false) | confirm_action_dialog.dart:74-81 |
| Accent | `accentColor ?? colorScheme.error`; on-accent = `onError` if accent is error else `onPrimary` | :104-107 |
| Surface | `backgroundColor: theme.cardColor`, radius `12.r`, side accent alpha `0.3` (default width 1) | :109-114 |
| Title row | icon `20.r` accent; gap `8.r`; title `titleMedium` `14.r` accent `w600` | :115-130 |
| Body | `bodyMedium` `11.r` onSurface `0.7` | :131-137 |
| Cancel | `TextButton`: B glyph image `assets/images/gamepad/Xbox_B_button.png` `18.r` tinted onSurface `0.6`; gap `4.r`; `cancel` = "Cancel" (or `cancelLabel`) `12.r` onSurface `0.6` | :139-163 |
| Confirm | `ElevatedButton` bg accent, fg on-accent, padding h `16.r` v `8.r`, radius `6.r`; A glyph `Xbox_A_button.png` `18.r` tinted on-accent; gap `4.r`; label `12.r` `w600` | :164-197 |

Uses in this area: remove ROM folder, reset ES-DE, delete imported theme (all error accent); the three Tools confirms (primary, primary, error).

#### InfoDialog

lib/widgets/info_dialog.dart. Same frame as ConfirmActionDialog with accent default **primary**, default icon `info_rounded`, and one ElevatedButton (A glyph + `okLabel`, fg `onPrimary`, padding h `16.r` v `8.r`, radius `6.r`, label `12.r` `w600`). A **or** B closes. info_dialog.dart:24, 59-66, 89-155

#### "Blurred card" dialogs (restart, updates, folder warnings)

Shared frame: `BackdropFilter` blur sigma `5.r`; transparent `Dialog` (elevation 0) containing a `420.r`-wide card, radius `16.r`, shadow black alpha `0.5` blur `30.r` spread `5.r`, clipped. Header strip: padding v `12.r` h `16.r`; icon tile padding `8.r`, radius `8.r`, icon `16.r`; gap `8.r`; title `titleLarge` bold `12.r`. Body: padding `16.r`. Buttons are `GamepadControl` pills.

| Dialog | Card fill / border | Header fill / accent | Icon | Title = English | Body | Buttons | Cite |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RestartRequiredDialog | surface `0.85`, border primary `0.3` `1.r` | primary `0.12`; primary | `restart_alt_rounded` | `restartRequired` = "Restart Required" | `restartRequiredBody` = "NeoStation will close now. Please reopen it to use the new location." `bodyMedium` onSurface `0.8`; gap `16.r` | one: A `ok` = "OK" (bg primary, fg onPrimary). **B is not bound**. A quits: Android `SystemNavigator.pop`, else `exit(0)` | lib/widgets/restart_required_dialog.dart:26, 43-49, 55-149 |
| UpdateDialog (app) | surface `0.85`, border primary `0.3` `1.r` | primary `0.12`; primary | `system_update_alt_rounded` | `updateAvailable` = "Update Available" + second line `updateVersion` = "Version {version}" (`bodyMedium` onSurface `0.7` `w600`); right: size pill "{N} MB" (padding h `8.r` v `2.r`, fill `surfaceContainerHighest` `0.5`, radius `16.r`, `labelSmall` bold onSurface) | info row: `info_rounded` `12.r` onSurface `0.5`, gap `6.r`, `updateCurrentVersion` = "Your current version is {version}" `bodySmall` onSurface `0.5`; gap `8.r` | Row: B `updateLater` = "LATER" (bg `tertiary`, fg onSurface, flex 1), gap `8.r`, A `updateNow` = "UPDATE NOW" (bg primary, fg onPrimary, flex 2). Downloading: bar minHeight `8.r` radius `10.r` bg primary `0.1`; gap `8.r`; `updateDownloading` = "Downloading update..." / `updatePreparingInstall` = "Preparing installation..." at 100%, and "P%" bold primary; B ignored while downloading. Failure toast titled `updateDialogError` = "Update Error", body `updateErrorAndroid` (**Android**) or `updateErrorDesktop` (else) | lib/widgets/update_dialog.dart:32-37, 62-66, 72-295, 297-327 |
| SystemsUpdateDialog | `surface` (opaque), **no border** | `surface` alpha `0.95`; primary | `system_update_alt_rounded` | `systemsUpdateAvailable` = "Systems Update Available" + `systemsUpdateNewVersion` = "New version: {version}" (`onSurfaceVariant` `w600`) | `systemsUpdateCurrentVersion` = "Current version: {version}" ("bundled" if empty), `onSurfaceVariant` | same LATER / UPDATE NOW row. Downloading: bar bg `surfaceContainerHighest`; status line (`systemsUpdateDownloading` = "Downloading system configs..." or live status) + %; then gap `12.r` and a B `cancel` = "Cancel" pill (tertiary) - B cancels (`systemsUpdateCancelling` = "Cancelling..."); hidden during the final sync (`systemsUpdateSyncing` = "Syncing systems database..."). Success toast `systemsUpdateComplete`, failure toast `systemsUpdateError` | lib/widgets/systems_update_dialog.dart:53-101, 107-310, 312-373 |
| FolderNotEmptyDialog (wizard) | surface `0.9`, border **tertiary** `0.4` `1.r` | tertiary `0.12`; tertiary | `warning_rounded` | `folderNotEmptyTitle` = "Folder Not Empty" | `folderNotEmptyBody` (with {count}); gap `10.r`; path box padding `10.r`, fill `surfaceContainerHighest` `0.4`, radius `8.r`, `11.r` monospace, maxLines 3; gap `16.r` | B `cancel` (tertiary, flex 1), gap `8.r`, A `folderNotEmptyUseAnyway` = "Use Anyway" (primary, flex 2) | lib/widgets/folder_not_empty_dialog.dart:51, 76-212 |
| MoveUserDataDialog (settings) | width **`440.r`**, surface `0.92`, border tertiary `0.4` `1.r` | tertiary `0.12`; tertiary | `drive_file_move_rounded` | `moveUserDataTitle` = "Move User Data?" | `moveUserDataBody`; gap `12.r`; from-path box; `arrow_downward_rounded` `16.r` primary with v padding `4.r`; to-path box; optional gap `10.r` + `moveUserDataDestNotEmpty` `bodySmall` tertiary; gap `16.r` | B Cancel (tertiary), A `moveUserDataConfirm` = "Move Data" (primary, flex 2) | lib/widgets/move_user_data_dialog.dart:77-243 |

When the update dialogs appear: on startup, after the scan is kicked off, if `autoUpdateApp` then `autoUpdateSystems` (both default ON) and a newer version is found. lib/screens/app_screen.dart:193-238, 348-390

**GamepadControl pill** (the button in all the blurred dialogs and the wizard) - lib/widgets/core_footer.dart:121-225

| Part | Value | Cite |
| --- | --- | --- |
| Padding | h `6.r`, v `4.r` | core_footer.dart:167 |
| Fill | `backgroundColor ?? onSurface.withValues(alpha: 0.1)` | :151-152 |
| Radius | theme `CornerRadii.radiusInternal` (dark theme: `10.r`), fallback `6.r` | :162-173 |
| Border | `lightenColor(fill, 0.05)` (HSL lightness +0.05), `1.r` | :174; lib/utils/color.dart:3-7 |
| Shadow | `colorScheme.shadow` alpha `0.1`, blur `4.r`, offset `(2.r, 2.r)` | :175-181 |
| Glyph | asset image `18.r` tinted with the text colour, or an `Icon` `12.r`, or while `busy` a `14.r` spinner (stroke `2.r`) | :186-208 |
| Label | gap `4.r`; `12.r`, `w600`, `letterSpacing: 0.2.r`; colour `textColor ?? onPrimary`; trailing gap `4.r` | :209-219 |

---

### First run

#### Boot sequence (what is on screen, in order)

1. `runApp(StartupLoadingApp())` immediately, before anything else loads. lib/main.dart:195-202
2. **Android only**: wait for the user-data volume; if it never appears, `StartupStorageErrorApp` replaces the screen until Retry / Continue. lib/main.dart:214-216, 794-818
3. Providers initialise, then `runApp(MyApp)`; its home is `PermissionCheckWrapper` -> (splash while checking) -> `SetupWizard` on first run, else the main UI. lib/main.dart:453-464, 1094-1096
4. In the main UI the Systems tab shows the scan splash while scanning, then `InitialSetupWidget` if the scan finished with no systems, else the library, cross-fading with `AnimatedSwitcher` `400ms`. lib/screens/systems_screen/system_content.dart:45-107

#### Startup scaffold (pre-ScreenUtil screens)

lib/main.dart:523-627. Runs before `ScreenUtilInit`, so sizes are design px multiplied by `scale` / `textScale` from `SplashStatusLayout` instead of `.r`.

| Part | Value | Cite |
| --- | --- | --- |
| Colours | last theme mirrored into prefs (`StartupThemeCache`); fallback background `#15191E`, foreground `#ECF9FF`, primary `#605DFF` | lib/main.dart:557-565; lib/services/startup_theme_cache.dart:31-35 |
| Loading screen | `SplashStatusLayout` (shimmering logo) with one status line | lib/main.dart:594-595, 663-690 |
| Loading text | `startupLoading` = "Preparing NeoStation. Waiting for storage and services..."; invisible (still laid out) until `1500ms`, then `AnimatedOpacity` `400ms` (default linear curve); max width `440*scale`; `GoogleFonts.anta`, `17*textScale`, foreground alpha `0.6`, letterSpacing `0.3`, centred | lib/main.dart:642, 669-686 |
| Storage error screen (**Android only**) | static logo `112*scale` square; gap `24*scale`; "NeoStation" `28*textScale` `w600` letterSpacing `1.2`; gap `24*scale`; message `startupStorageUnavailable` `16*textScale` fg `0.8` (max width `520*scale`); path `13*textScale` fg `0.55` after `12*scale`; gap `24*scale`; `ElevatedButton` `startupStorageRetry` = "Retry", gap `16*scale`, `TextButton` `startupStorageUseDefault` = "Continue without it". Outer padding `32*scale` | lib/main.dart:596-622, 727-784 |
| Error screen keys | A / Enter / Select / Space = Retry; B / Escape = Continue | lib/main.dart:709-725 |
| Language | device locale (not the saved one), falling back to English | lib/main.dart:489-514 |

#### SplashStatusLayout (logo centred, status hung below)

lib/widgets/splash_status_layout.dart. Used by the loading screen, the permission-check gap (`children: []`), and the scan splash.

| Constant | Value | Cite |
| --- | --- | --- |
| Logo width | `280` design px x `scale` | splash_status_layout.dart:39 |
| Logo aspect | `772 / 510` | :42 |
| Max logo width | 55% of screen width | :46 |
| Max logo height | 40% of screen height | :51 |
| Logo -> status gap | `16` x scale | :54 |
| Bottom inset | `12` x scale | :57 |
| Status side padding | `32` x scale; max status width `480` x scale | :61-62 |
| `scale` | `max(1, min(w/640, max(h,700)/480))` | :82-88 |
| `textScale` | `sqrt(max(1, scale/1.4))` | :98, 109-110 |
| Layout | logo `Center`ed; status block `Positioned(top: h/2 + logoH/2 + gap, bottom: bottomInset)`, `FittedBox(scaleDown, topCenter)` | :147-173 |

#### ShimmeringLogo

lib/widgets/shimmering_logo.dart. `assets/images/logo_transparent.png` at the given width, `FilterQuality.medium`, with a `ShaderMask` (`BlendMode.srcATop`) glint.

| Part | Value | Cite |
| --- | --- | --- |
| Gradient | `LinearGradient` from `Alignment(-1.0, -0.4)` to `Alignment(1.0, 0.4)`; colours white alpha `0, 0, 0.55, 0, 0`; stops `0.0, 0.38, 0.5, 0.62, 1.0` | shimmering_logo.dart:114-130 |
| Travel | translate x by `bounds.width * (progress * 3.2 - 1.6)` (band fully clears both edges) | :152-161 |
| Ambient sweep | controller `2000ms`, `repeat()` (linear, restarts from the left) | :44-52 |
| Progress mode | eases to the reported value, `250ms` `Curves.easeOut`; resumes the ambient repeat when progress goes null | :85-102 |
| Repaint throttle | only repaints after `0.0075` of travel | :39, 75-82 |

#### Scan splash (Systems tab while scanning)

lib/screens/systems_screen/system_content.dart:110-240. `SplashStatusLayout` with `progress` = scan (or RA match) progress once > 0, else ambient sweep. Status block: `LinearProgressIndicator` width `220.r`, minHeight `3.r`, radius `2.r`, bg onSurface `0.12`; gap `16.r`; text `17 * textScale`, onSurface `0.6`, centred, maxLines 1 = live scan status or `scanningSystemsRoms` = "Scanning systems and ROMs..."; during the startup RA pass the text is `raMatchProgressCounted` = "Matching RetroAchievements... {done}/{total}" or `raMatchProgressBusy`.

#### FloatingShapesBackground

lib/utils/floating_shapes_background.dart. **Not referenced anywhere else in `lib/`** in this commit (zero hits outside its own file), so it is not on any first-run screen. For reference: 20 shapes (circle / rounded square radius `size*0.2` / triangle), random x 0-500, y 0-100, speed +-0.75 px/frame, size 10-35, rotation speed +-0.025 rad/frame, white alpha 0.05-0.15, wrap at edges, over `baseColor`; controller `10s` repeat just to tick frames. :84-101, 112-170

#### PermissionCheckWrapper (decides whether the wizard shows)

lib/widgets/permission_check_wrapper.dart. While checking: `Scaffold(body: SplashStatusLayout(children: []))`. Skip the wizard if SharedPreferences `setup_completed_prefs` is true, or the config already has a ROM folder, or `setupCompleted`; otherwise show `SetupWizard`. On finish: `completeSetup()`, set the prefs flag, show the app. :13, 39-89, 103-141

#### Setup wizard

lib/widgets/setup_wizard.dart. One screen with a step indicator; no transitions between steps (instant swap via `setState`).

**Steps (platform-conditional)** - setup_wizard.dart:95-108, 353-358

| Step | Android (6 steps) | Linux / Windows / macOS (5 steps) |
| --- | --- | --- |
| User data location | 1 | 1 |
| Permissions | 2 | - |
| ROM folder | 3 | 2 |
| Scanning | 4 | 3 |
| ES-DE import (optional) | 5 | 4 |
| System Art Pack (optional) | 6 | 5 |

There is no "previous step"; B only ever skips forward.

**Frame** - both devices in scope are landscape, so the landscape layout applies (`MediaQuery.orientation`). :361-398, 465-566

| Part | Value | Cite |
| --- | --- | --- |
| Scaffold | `scaffoldBackgroundColor`; non-OLED themes add a full-bleed container of the same colour (the "fluid shader" comment is stale) | :374-388 |
| Outer padding | `16.r` in a `SafeArea` | :466-467 |
| Left card | flex 2; padding `24.r`; fill `surface` alpha `0.1`; radius `24.r`; border primary `0.1` `1.r` | :471-482 |
| Left contents | logo `64.r` square; gap `12.r`; `welcomeNeoStation` = "Welcome to NeoStation!" `14.r` bold onSurface centred; gap `8.r`; `letsGetSetup` = "Let's get you set up" `10.r` onSurface `0.7`; gap `16.r`; vertical step indicator in `FittedBox(scaleDown)` | :486-522 |
| Gap | `16.r` | :528 |
| Right card | flex 3; padding `16.r`; fill surface alpha `0.05`; radius `24.r`; border primary `0.05` `1.r` | :531-542 |
| Right contents | step content centred, `maxWidth: 400.w`; gap `8.r`; button row | :543-559 |
| Vertical indicator | per step a `24.r` circle, border `2.r`; done/current fill+border primary, future transparent with border primary `0.3`; content: done = `check_rounded` `14.r` white, else the number `10.r` bold (white if current, primary `0.5` if future); connectors `2.r` x `18.r`, primary if the step above is done else primary `0.2` | :568-625 |
| Portrait (not used on these devices) | card max width `600.w`, padding `32.r`, radius `32.r`; logo `120.r`; title `28.r`; subtitle `16.r`; gap `48.r`; horizontal indicator of `40.r` circles (`18.r` numbers, `24.r` check) joined by `40.r` x `2.r` lines; gap `32.r`; content; gap `24.r`; buttons | :400-463, 627-688 |

In landscape the step bodies use the small sizes: icon `48.r`, title `14.r` (steps 1 and 3) or `16.r` (scanning/ES-DE/art), body `10.r` or `12.r`. Portrait: icon `80.r`, title `24.r`, body `14.r`.

**Button row** - :1724-1807. `Row(spaceBetween)`: left = Skip pill (only on skippable steps) else `SizedBox(width: 64.r)`; right = primary pill.
- Skip pill: `GamepadControl` B glyph, `skipForNow` = "Skip for now", default fill (onSurface `0.1`), text onSurface `0.6`.
- Primary pill: A glyph, bg primary, fg onPrimary; disabled while picking a folder / importing / downloading; shows a spinner while picking a folder or while the art catalogue is still loading.
- Skip pill shown on: ES-DE and Art steps (all platforms); Permissions and ROM folder steps **on Android only**. :1755-1759
- Scanning step instead shows only a right-aligned A `next` = "Next" pill, active once the scan completes. :1728-1748

**Buttons per step**

| Step | Primary label | A does | B does | Cite |
| --- | --- | --- | --- | --- |
| User data | `next` = "Next" | advance; on Android, skip the Permissions step automatically if both grants are already satisfied | nothing | :1810, 1853-1866, 277-315 |
| Permissions (**Android**) | `grantAccess` = "Grant Access" until all satisfied, then "Next" | request All-Files first; then (dual-screen only) open accessibility settings; then advance. Pad input is suspended while away; re-armed after 3s if nothing opened, and 600ms after return | skip to ROM folder (always allowed) | :1811-1817, 1911-1955, 284-287 |
| ROM folder | `selectFolder` = "Select Folder" | open the folder picker; on success advance to Scanning and start the scan | skip to Scanning and start a scan. **Note:** B does this on every platform, but the Skip pill is only drawn on Android | :1818-1820, 1957-2023, 289-302 |
| Scanning | "Next" | only after the scan completes: advance | nothing | :188-195, 1878-1882 |
| ES-DE | `esdeRunImport` = "Import from ES-DE", or "Next" after a successful import | pick the ES-DE folder and import; after success, advance | skip to Art | :1821-1826, 1884-1892, 307-310, 1515-1672 |
| Art pack | `download` = "Download" while the selected pack is not the active one, else `finish` = "Finish" | download + apply the selected pack, then finish setup; if the download fails stay on the step | finish setup (no art) | :1827-1837, 1894-1905, 311-314, 1676-1722 |

D-pad Up/Down only does anything on the Art step (moves the pack selection, clamped, scrolls it to centre over `200ms` `Curves.easeInOut`). :206-243

**Step bodies**

1. User data location - :712-804. Icon `folder_special_rounded` (primary, or primary `0.6` before the path loads); gap `16.r`; title `userDataLocation` = "User Data Location" bold; gap `8.r`; `userDataLocationSubtitle` onSurface `0.7` line height `1.3` centred; if known, gap `8.r` + path box (padding `10.r`, fill primary `0.08`, radius `8.r`, border primary `0.2`, `folder_rounded` `16.r` primary, gap `8.r`, `11.r` monospace onSurface, maxLines 3); gap `12.r`; inline pill: `folder_rounded` icon + `selectUserDataFolder` = "Select User Data Folder", text primary, default fill, spinner while picking. Picker per platform: Android TV in-app browser; Android SAF (fallback in-app); desktop OS picker (fallback in-app). Unwritable folder -> error notification `userDataFolderNotWritable` (+ `userDataFolderGrantAllFiles` on **Android**); non-empty folder -> FolderNotEmptyDialog. :806-935
2. Permissions (**Android only**) - :940-1061. Stretch column of rows; accessibility row only when a secondary display is present (`Platform.isAndroid && _hasSecondaryDisplay`), `12.r` between rows. Row: padding `12.r`; fill onSurface `0.04`; radius `16.r`; border green `0.5` when granted else onSurface `0.1`; leading icon `28.r` (green when granted, else primary); gap `12.r`; title `13.r` bold; gap `4.r`; description `9.r` onSurface `0.7` height `1.3`, replaced by `enabled` = "Enabled" in green once granted; optional hint (gap `6.r`, `9.r` `w600` primary); gap `8.r`; status icon `20.r` `check_circle_rounded` green or `radio_button_unchecked_rounded` onSurface `0.3`.
   - Row A: `security_rounded`, `storagePermission` = "Storage Permission", `storagePermissionDesc`.
   - Row B: `settings_accessibility_rounded`, `screenReturnAccess` = "Screen Return Access", `screenReturnAccessDesc`, hint `screenReturnAccessHint` = "Turn on NeoStation, then tap Allow".
3. ROM folder - :1063-1107. Icon `folder_open_rounded` (green once chosen, else primary); gap `16.r`; `selectRomFolder` = "Select ROM Folder" bold; gap `8.r`; `chooseRomFolderDesc` = "Choose the folder where your ROM files are stored.\n\nNeoStation will scan this folder for games." or, once chosen, `romFolderSelected` = "ROM folder selected!" + "\n\n" + path.
4. Scanning - :1109-1263. `48.r` circle (primary `0.1`) holding a `24.r` spinner (stroke `3.r`) or a green `check_circle_rounded`; gap `4.r`; `scanningRoms` = "Scanning ROMs" / `wizardScanComplete` = "Scan complete" `16.r` bold; gap `4.r`; status line `12.r` onSurface `0.7` (fallback `scanningSystemsRoms`); while counting: gap `4.r`, bar minHeight `8.r` radius `8.r` bg primary `0.1`, gap `8.r`, row of `ofSystems` = "{scanned} of {total} systems" (`12.r - 2.r`, onSurface `0.6`) and "P%" (primary bold). Done: gap `4.r`, green box (padding `12.r`, fill green `0.1`, radius `12.r`, border green `0.3` `1.r`, check `20.r`, gap `12.r`, text `12.r` `Colors.green[700]`: `foundSystemsWithGames` = "Found {count} systems with games!" + newline + `wizardTapNextToContinue` = "Tap Next to continue").
5. ES-DE import - :1269-1385. Icon `download_for_offline_rounded` (or green check after success); gap `16.r`; `wizardEsdeStepTitle` = "Import from ES-DE" `16.r` bold; gap `8.r`; `wizardEsdeStepDesc` `12.r` onSurface `0.7`; importing: gap `12.r`, `220.r` bar (minHeight `8.r`, radius `8.r`, indeterminate at 0), optional label `12.r - 2.r` onSurface `0.6`; result: gap `12.r`, green box with "ES-DE import complete\nN games, M systems".
6. System Art Pack - :1391-1511. Icon `palette_rounded` (or green check when a pack is active) at `48.r * 0.7`; gap `10.r`; `wizardArtPackTitle` = "Get a System Art Pack" `16.r` bold; gap `6.r`; text `12.r` onSurface `0.7`: `wizardArtPackDesc`, or `wizardArtPackInstalled` once active, or `wizardArtPackUnavailable` if the catalogue is empty; then gap `10.r` and one `SystemArtPackTile` per pack (`mosaicSize: 48` landscape / `56` portrait; `isSelected` = selected pack, default the first non-AI pack); while downloading instead: gap `12.r`, `220.r` bar, gap `8.r`, "P%" `12.r` primary bold.

Secondary display during the wizard (**Android dual-screen**): shows "Welcome to NeoStation!" as the system name and parks the dock. :255-275

#### InitialSetupWidget (Systems tab, no systems found)

lib/screens/systems_screen/my_systems_section/initial_setup_widget.dart. Shown when the scan completed but found no systems (system_content.dart:65-69). Sizes here are **plain logical px** (no ScreenUtil suffixes).

| Part | Value | Cite |
| --- | --- | --- |
| Breakpoint | width < 690 (XS/Small) -> single card; >= 690 -> card + help card side by side (max width 720, gap 16, flex 1:1). Outer padding 8 all round | initial_setup_widget.dart:61-95; lib/responsive.dart:21-31 |
| Card | max width 420, padding 32, fill `surface`, radius 32, border primary `0.2` width 1.5, shadow black `0.1` blur 20 offset (0,10) | :107-125 |
| Badge | padding 20, circle fill primary `0.15`, border primary `0.3` width 2, image `assets/images/icons/folder-add-bulk.png` 60x60 tinted primary | :131-149 |
| Title | gap 24; `setupLibrary` = "Setup Your Library", `headlineMedium` `w900` 28 letterSpacing -0.5 onSurface centred | :151-162 |
| Body | gap 12; `chooseRomFolderOrganize` `bodyLarge` 15 onSurface `0.8` height 1.4 centred | :164-174 |
| Button | gap 32; always-on focus ring (padding 4, radius 22, border primary 2) around a 64-high full-width button, fill primary, radius 18, shadow primary `0.3` blur 12 offset (0,4); label `selectRomFolderButton` = "SELECT ROM FOLDER" (or `changeFolder` = "CHANGE FOLDER") 16 `w800` letterSpacing 1.2 onPrimary | :176-182, 238-292 |
| Scanning button | 64 high, radius 18, fill primary `0.3`; 24 spinner (stroke 3) + gap 16 + `scanningButton` = "SCANNING..." 16 `w800` letterSpacing 1.2 primary | :200-235 |
| Feedback | gap 24; error box (padding 16, `errorContainer`, radius 12, warning icon 20, gap 12, `onErrorContainer` text) or success box (padding 16, primary `0.1`, radius 12, check icon 20, `configurationComplete` = "Configuration Complete!" `titleMedium` bold primary, gap 8, `foundSystemsInFolder`, optional gap 4 + `lastScanLabel` `bodySmall` onSurface `0.6`) | :184-192, 295-395 |
| Help card (>= 690 wide) | `Card` elevation 0, `surfaceContainerHighest` alpha `0.666`, padding 20; lightbulb icon 20 + gap 12 + `howItWorks` = "How it works" `titleMedium` bold; gap 16; 4 items (bottom padding 12: title `bodyMedium` `w600`, gap 4, desc `bodySmall` onSurface `0.7`): step1SelectFolder/step1Desc ... step4ReadyToPlay/step4Desc | :398-488 |
| Buttons | A (routed from AppScreen) opens the ROM folder picker; inert while loading/scanning | :28, 51-55; lib/screens/app_screen.dart:545-552 |

#### TvDirectoryPicker (layout only)

lib/widgets/tv_directory_picker.dart. In-app folder/file browser. Used on **Android TV** always, on **Android** when SAF fails, and on **desktop/Linux** when the OS portal throws (e.g. SteamOS Game Mode). :31-85

| Part | Value | Cite |
| --- | --- | --- |
| Dialog | `insetPadding: 24.r`, bg `scaffoldBackgroundColor`, radius `16.r`, max `700.w` x `500.h` | tv_directory_picker.dart:565-573 |
| Structure | header / 1 px divider (`dividerColor`) / body / 1 px divider / footer | :574-582 |
| Header | padding h `16.r` v `12.r`; icon `20.r` primary (`storage_rounded` on the volume list, `folder_open_rounded` in a folder); gap `8.r`; `selectStorage` = "Select Storage" or the current path in monospace, `titleSmall` `12.r` | :589-617 |
| Row height | `44.r` (`60.r` in executable mode) | :131-132 |
| Volume row | padding h `16.r`; focused: fill primary `0.15` + left bar primary `3.r`; icon `20.r` (`phone_android_rounded` on **Android** internal, `computer_rounded` on desktop internal, `sd_card_rounded` removable); gap `12.r`; name `12.r` (bold + primary when focused) height `1.15`; gap `4.r`; path `9.r` onSurface `0.45`; `chevron_right_rounded` `16.r` onSurface `0.4` | :705-805 |
| Folder list (directory mode) | row 0 "Set this directory" (`setThisDirectory`; fill primary `0.2` focused / `0.05`, left bar primary `3.r`/`1.r`, bottom border primary `0.2`, `check_circle_outline_rounded` `18.r`, `12.r` bold primary); row 1 ".." (`drive_folder_upload_rounded` `18.r`, monospace; focused fill onSurface `0.1` + bar onSurface `0.5` `3.r`); then folders (`folder_rounded` `18.r`, name `12.r`, chevron `16.r`; focused fill primary `0.15` + bar primary `3.r`, bold primary) | :898-1054 |
| Footer | padding h `16.r` v `10.r`; hint chips "A" + (`select` / `hintSelectFile` / `hintEnterSetDir` = "Enter / Set dir / Parent") and "B" + (`cancel` on the volume list, else `hintBack` = "Back"), gap `12.r`; right: secondary "Cancel" button | :1056-1093 |
| Hint chip | padding h `6.r` v `2.r`, fill primary `0.15`, radius `4.r`, border primary `0.3`, letter `10.r` bold primary; gap `4.r`; text `10.r` onSurface `0.6` | :1118-1159 |
| Button | padding h `14.r` v `8.r`, radius `8.r`, `AnimatedContainer` `100ms`; secondary: transparent/surface, border outline `0.5`; primary: primary fill; border `2.r` focused else `1.r`; text `12.r` `w600` | :1161-1224 |
| Pad | Up/Down move (clamped), scrolls to centre over `120ms` `Curves.easeOut`; A activates (ignored for the first `500ms`); B goes up a folder, then to the volume list, then closes | :141-143, 154-260 |
| Linux volumes | Home (`homeFolder`), `/run/media/$USER/*`, `/media/$USER/*`, `/run/media/*`, `/media/*`, `/mnt/*`, Filesystem root (`filesystemRoot`) | :268-300 |

#### DatabaseStatsWidget and StorageInfoCard

Both files exist but **nothing in `lib/` references them** in this commit (zero hits outside their own files). They use plain Material `Card`s with hardcoded English ("Database Stats", "Systems", "Games", "Favorites", "Played", "Last updated: ...", "{n} Files") and plain logical px (padding 16, gaps 12/8/2). lib/widgets/database_stats_widget.dart:10-130; lib/widgets/storage_info_card.dart:15-60

---

### Notifications (there are no toasts)

`AppNotification.showNotification` (lib/widgets/custom_notification.dart:45-67) forwards to `GlobalNotificationService`, which keeps a list and **draws nothing on its own**: "There is no floating overlay; every notification lives in the dropdown." Notifications **never auto-dismiss**. lib/services/global_notification_service.dart:39-49

| Fact | Value | Cite |
| --- | --- | --- |
| Types | info / success / error | global_notification_service.dart:5 |
| Same id | replaced in place and moved to the end | :60-93 |
| `update` | no-op if the id is gone; `ongoing` resets to false unless passed | :95-131 |
| Clear all | removes every entry that is not `ongoing` | :133-146 |

**Where they appear**: the header's bell (`NotificationBell`) and its dropdown. lib/widgets/notification_bell.dart

| Part | Value | Cite |
| --- | --- | --- |
| Bell icon | `14.r`; `notifications_active_rounded` in `warningColor` when the list is non-empty, else `notifications_rounded` onSurface | notification_bell.dart:151-162 |
| Badge dot | `5.r` circle `warningColor`, border `surface` `0.8.r`, top-right | :163-179 |
| Arrival pulse | opacity 1.0 -> 0.4, `1200ms` `Curves.easeInOut`, `repeat(reverse: true, count: 6)` (3 round trips), only when the count grows | :45-61, 103-121 |
| Opens with | tapping the bell, or **Select** from anywhere the header is on screen (not over a dialog/pushed route) | :77, 86-90 |
| Dropdown position | overlay; `top = bell bottom + 14`, `right: 8` (logical px) | :40-43, 212-216 |
| Dropdown panel | `Material` `surface`, elevation 6, shadow `shadow` `0.3`, radius `CornerRadii.radiusExternal`, side outline `0.3`; constraints `minWidth 200.r`, `maxWidth 300.r`, `maxHeight 360.r` | :401-421 |
| Header | padding h `12.r` v `10.r`; `notifications` = "Notifications" `12.r` bold onSurface; right: `clearAll` = "Clear all" `10.r` `w600` primary in a pill (padding h `6.r` v `2.r`, radius `radiusInternal`, fill primary `0.15` when highlighted), only when a non-ongoing entry exists | :426-479 |
| Empty | padding `16.r`, `noActiveNotifications` = "No active notifications" `11.r` onSurface `0.6` | :480-494 |
| Separator | `Divider` height `1.r`, outline `0.2` | :502-507 |
| Entry | padding h `12.r` v `10.r`; highlight fill primary `0.15`; icon `16.r` (success `check_circle_rounded` `Colors.green.shade400`, error `error_rounded` error, info `info_rounded` primary); gap `8.r`; optional title `11.r` bold maxLines 1; message `10.r` onSurface `0.8` maxLines 6; optional progress (gap `6.r`, minHeight `3.r`, radius `2.r`, icon colour on its `0.2`); gap `8.r`; `close_rounded` `14.r` onSurface `0.5` | :552-641 |
| Pad in dropdown | Up/Down wrap (no key repeat), nav SFX, scroll to centre `160ms` `Curves.easeOut`; A = dismiss highlighted (or Clear all), closes when empty; B or Select closes | :277-387 |

---

### Ambiguities and gaps (for the porter)

- `animated_toggle_switch` animation duration and curve are package defaults; the package source is not in the repo, so they are not recorded here.
- `showDialog` barrier colour, dialog enter/exit animation and M3 `AlertDialog` paddings/elevation are Flutter framework defaults; none are overridden in source.
- The language picker `top` mixes a `.r` height with an unscaled `+16` and an unscaled 8 px clamp. language_picker_overlay.dart:111-117.
- Theme colours (`cardColor`, `surface`, `primary`, `tertiary`, `warningColor` ...) come from `lib/themes/*.dart`, not covered in this file.
- `SystemArtPackDialog` (opened from System Art pack rows) and the header/tab strip that sits in the settings screen's `46.r` top padding are outside this area.
