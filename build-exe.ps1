$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDirectory = Join-Path $projectRoot 'dist'
$executablePath = if ($env:CHITKVEST_EXE_PATH) {
  $env:CHITKVEST_EXE_PATH
} else {
  Join-Path $outputDirectory 'ChitKvest.exe'
}
$webView2Version = '1.0.4129.50'
$webView2PackagePath = Join-Path $env:TEMP "Microsoft.Web.WebView2.$webView2Version.nupkg"
$webView2PackageUrl = "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/$webView2Version/microsoft.web.webview2.$webView2Version.nupkg"
$assetNames = @('index.html', 'styles.css', 'cart.js', 'cart-checkout.js', 'auth.js', 'script.js', 'subscription-song.mp3')
$optionalAssetNames = @('subscription-song.mp3')

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

if (-not (Test-Path -LiteralPath $webView2PackagePath -PathType Leaf)) {
  Invoke-WebRequest -Uri $webView2PackageUrl -OutFile $webView2PackagePath
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$webView2Archive = [IO.Compression.ZipFile]::OpenRead($webView2PackagePath)
try {
  $coreAssemblyEntry = $webView2Archive.GetEntry('lib/net462/Microsoft.Web.WebView2.Core.dll')
  $winFormsAssemblyEntry = $webView2Archive.GetEntry('lib/net462/Microsoft.Web.WebView2.WinForms.dll')
  $nativeLoaderEntry = $webView2Archive.GetEntry('runtimes/win-x64/native/WebView2Loader.dll')
  $licenseEntry = $webView2Archive.GetEntry('LICENSE.txt')
  if (-not $coreAssemblyEntry -or -not $winFormsAssemblyEntry -or -not $nativeLoaderEntry -or -not $licenseEntry) {
    throw "WebView2 SDK package $webView2Version is missing required files."
  }

  $webView2AssemblyDirectory = Join-Path $env:TEMP "ChitKvest.WebView2.$webView2Version"
  New-Item -ItemType Directory -Path $webView2AssemblyDirectory -Force | Out-Null
  foreach ($entry in @($coreAssemblyEntry, $winFormsAssemblyEntry)) {
    $target = Join-Path $webView2AssemblyDirectory ([IO.Path]::GetFileName($entry.FullName))
    [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
  }

  $coreAssemblyPath = Join-Path $webView2AssemblyDirectory 'Microsoft.Web.WebView2.Core.dll'
  $winFormsAssemblyPath = Join-Path $webView2AssemblyDirectory 'Microsoft.Web.WebView2.WinForms.dll'
  $nativeLoader = New-Object IO.MemoryStream
  $nativeLoaderStream = $nativeLoaderEntry.Open()
  try {
    $nativeLoaderStream.CopyTo($nativeLoader)
  } finally {
    $nativeLoaderStream.Dispose()
  }
  $nativeLoaderBase64 = [Convert]::ToBase64String($nativeLoader.ToArray())
  $nativeLoader.Dispose()

  $licenseReader = New-Object IO.StreamReader($licenseEntry.Open())
  try {
    $webView2LicenseBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($licenseReader.ReadToEnd()))
  } finally {
    $licenseReader.Dispose()
  }
} finally {
  $webView2Archive.Dispose()
}

$embeddedAssets = foreach ($assetName in $assetNames) {
  $assetPath = Join-Path $projectRoot $assetName
  if (-not (Test-Path -LiteralPath $assetPath -PathType Leaf)) {
    if ($optionalAssetNames -contains $assetName) {
      Write-Warning "Optional audio file is not bundled yet: $assetName"
      continue
    }
    throw "Required site file is missing: $assetName"
  }

  $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($assetPath))
  '      {{ "{0}", "{1}" }},' -f $assetName, $base64
}
$embeddedAssets = @($embeddedAssets)
$embeddedAssets += '      {{ "__webview2_core__", "{0}" }},' -f [Convert]::ToBase64String([IO.File]::ReadAllBytes($coreAssemblyPath))
$embeddedAssets += '      {{ "__webview2_winforms__", "{0}" }},' -f [Convert]::ToBase64String([IO.File]::ReadAllBytes($winFormsAssemblyPath))

$source = @'
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Web;
using System.Windows.Forms;
using System.Web.Script.Serialization;
using Microsoft.Win32;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

public static class ChitKvestLauncher
{
    private const string WebView2LoaderBase64 = "__WEBVIEW2_LOADER__";
    private const string WebView2LicenseBase64 = "__WEBVIEW2_LICENSE__";
    private const string DefaultGoogleClientId = "1055031722656-fp4lj2ua2d8i0m7pr1sque0ljc5lhq4d.apps.googleusercontent.com";

    private sealed class Product
    {
        public string Name { get; private set; }
        public string Url { get; private set; }

        public Product(string name, string url)
        {
            Name = name;
            Url = url;
        }
    }

    private sealed class RequestPayload
    {
        public string email { get; set; }
        public string token { get; set; }
        public string[] productIds { get; set; }
        public string credential { get; set; }
    }

    private sealed class AuthRegisterPayload
    {
        public string username { get; set; }
        public string password { get; set; }
        public string email { get; set; }
    }

    private sealed class AuthLoginPayload
    {
        public string login { get; set; }
        public string password { get; set; }
    }

    private sealed class PremiumSubscriptionPayload
    {
        public int days { get; set; }
    }

    private sealed class GoogleCredentialPayload
    {
        public string credential { get; set; }
    }

    private sealed class AuthUser
    {
        public string id { get; set; }
        public string username { get; set; }
        public string email { get; set; }
        public string passwordHash { get; set; }
        public string passwordSalt { get; set; }
        public string name { get; set; }
        public string picture { get; set; }
        public string status { get; set; }
        public string role { get; set; }
        public string tier { get; set; }
        public string createdAt { get; set; }
        public string lastLoginAt { get; set; }
        public Dictionary<string, object> settings { get; set; }
    }

    private sealed class GoogleSigningKey
    {
        public string kid { get; set; }
        public string kty { get; set; }
        public string n { get; set; }
        public string e { get; set; }
    }

    private sealed class RateLimit
    {
        public DateTime StartedAt;
        public int Count;
    }

    private sealed class AppsScriptResponseException : Exception
    {
        public AppsScriptResponseException(string message) : base(message) { }
    }

    private static readonly JavaScriptSerializer Json = new JavaScriptSerializer();
    private static readonly Dictionary<string, string> Assets = new Dictionary<string, string>
    {
__EMBEDDED_ASSETS__
    };
    private static readonly Dictionary<string, Product> Products = new Dictionary<string, Product>(StringComparer.Ordinal)
    {
        { "sodium", new Product("Sodium", "https://modrinth.com/mod/sodium") },
        { "lithium", new Product("Lithium", "https://modrinth.com/mod/lithium") },
        { "ferrite-core", new Product("FerriteCore", "https://modrinth.com/mod/ferrite-core") },
        { "entityculling", new Product("Entity Culling", "https://modrinth.com/mod/entityculling") },
        { "jei", new Product("Just Enough Items", "https://modrinth.com/mod/jei") },
        { "rei", new Product("Roughly Enough Items", "https://modrinth.com/mod/rei") },
        { "jade", new Product("Jade", "https://modrinth.com/mod/jade") },
        { "appleskin", new Product("AppleSkin", "https://modrinth.com/mod/appleskin") },
        { "xaeros-minimap", new Product("Xaero's Minimap", "https://modrinth.com/mod/xaeros-minimap") },
        { "xaeros-world-map", new Product("Xaero's World Map", "https://modrinth.com/mod/xaeros-world-map") },
        { "mouse-tweaks", new Product("Mouse Tweaks", "https://modrinth.com/mod/mouse-tweaks") },
        { "controlling", new Product("Controlling", "https://modrinth.com/mod/controlling") },
        { "iris", new Product("Iris Shaders", "https://modrinth.com/mod/iris") },
        { "modmenu", new Product("Mod Menu", "https://modrinth.com/mod/modmenu") },
        { "betterf3", new Product("BetterF3", "https://modrinth.com/mod/betterf3") },
        { "shulkerboxtooltip", new Product("ShulkerBoxTooltip", "https://modrinth.com/mod/shulkerboxtooltip") },
        { "natures-compass", new Product("Nature's Compass", "https://modrinth.com/mod/natures-compass") },
        { "waystones", new Product("Waystones", "https://modrinth.com/mod/waystones") },
        { "clumps", new Product("Clumps", "https://modrinth.com/mod/clumps") },
        { "fallingtree", new Product("FallingTree", "https://modrinth.com/mod/fallingtree") },
        { "valorant-esp-1", new Product("Precision X", null) },
        { "valorant-aim-1", new Product("AimSense Pro", null) },
        { "valorant-wall-1", new Product("Ghost Vision", null) },
        { "valorant-trigger-1", new Product("Reflex Core", null) },
        { "valorant-skin-1", new Product("Style Shift", null) },
        { "valorant-phantom-protocol", new Product("Phantom Protocol", null) },
        { "valorant-range-echo", new Product("Range Echo", null) },
        { "cs2-radar-1", new Product("CounterScan", null) },
        { "cs2-trigger-1", new Product("QuickFire", null) },
        { "cs2-wall-1", new Product("SmokeSignal", null) },
        { "cs2-recoil-1", new Product("SteadyHands", null) },
        { "cs2-mirage-console", new Product("Mirage Console", null) },
        { "cs2-spray-myth", new Product("Spray Myth", null) },
        { "dota-esp-1", new Product("LaneWatch", null) },
        { "dota-loot-1", new Product("Map Insight", null) },
        { "dota-skin-1", new Product("Arcana Preview", null) },
        { "dota-rune-oracle", new Product("Rune Oracle", null) },
        { "dota-draft-echo", new Product("Draft Echo", null) },
        { "apex-aim-1", new Product("TargetLock", null) },
        { "apex-esp-1", new Product("RingScope", null) },
        { "apex-drop-phantom", new Product("Drop Phantom", null) },
        { "apex-ring-mirage", new Product("Ring Mirage", null) },
        { "gta-esp-1", new Product("CityView X", null) },
        { "gta-skin-1", new Product("StreetStyle", null) },
        { "gta-sunset-stories", new Product("Sunset Stories", null) },
        { "gta-neon-garage", new Product("Neon Garage", null) },
        { "warzone-aim-1", new Product("DropSight", null) },
        { "warzone-wall-1", new Product("Tactical Vision", null) },
        { "warzone-radar-1", new Product("ZoneTracker", null) },
        { "warzone-supply-mirage", new Product("Supply Mirage", null) },
        { "warzone-ghost-loadout", new Product("Ghost Loadout", null) }
    };
    private static readonly Dictionary<string, RateLimit> RequestLimits = new Dictionary<string, RateLimit>();
    private static readonly Dictionary<string, RateLimit> AuthRequestLimits = new Dictionary<string, RateLimit>();
    private static readonly object RateLimitLock = new object();
    private static readonly object AuthRequestLimitLock = new object();
    private static readonly object AuthUsersLock = new object();
    private static readonly object GoogleSigningKeysLock = new object();
    private const int MaxBodyBytes = 10 * 1024;
    private const int MaxRequests = 5;
    private const int MaxAuthRequests = 20;
    private const int AuthSessionDurationSeconds = 30 * 24 * 60 * 60;
    private static string AppsScriptUrl;
    private static string AppsScriptToken;
    private static string GoogleClientId;
    private static string AuthDataDirectory;
    private static string AuthUsersFile;
    private static string AuthSessionKeyFile;
    private static byte[] AuthSessionKey;
    private static List<GoogleSigningKey> GoogleSigningKeys;
    private static DateTime GoogleSigningKeysExpiresAt;
    private static HttpListener SiteListener;
    private static string HomeUrl;

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool SetDllDirectory(string pathName);

    [STAThread]
    public static int Main(string[] args)
    {
        AppsScriptUrl = GetUserSetting("GOOGLE_APPS_SCRIPT_URL");
        AppsScriptToken = GetUserSetting("GOOGLE_APPS_SCRIPT_TOKEN");
        GoogleClientId = GetUserSetting("GOOGLE_OAUTH_CLIENT_ID");
        if (String.IsNullOrEmpty(GoogleClientId))
        {
            GoogleClientId = DefaultGoogleClientId;
        }
        AuthDataDirectory = GetUserSetting("CHITKVEST_DATA_DIR");
        if (String.IsNullOrEmpty(AuthDataDirectory))
        {
            AuthDataDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".chitkvest");
        }
        AuthUsersFile = Path.Combine(AuthDataDirectory, "users.json");
        AuthSessionKeyFile = Path.Combine(AuthDataDirectory, "session.key");
        InitializeAuthSessionKey();

        SiteListener = null;
        int port = 0;
        for (int candidate = 8001; candidate <= 8020; candidate++)
        {
            try
            {
                SiteListener = new HttpListener();
                SiteListener.Prefixes.Add("http://127.0.0.1:" + candidate + "/");
                SiteListener.Start();
                port = candidate;
                break;
            }
            catch (HttpListenerException)
            {
                if (SiteListener != null)
                {
                    SiteListener.Close();
                    SiteListener = null;
                }
            }
        }

        if (SiteListener == null)
        {
            MessageBox.Show(
                "Не вдалося запустити програму: порти 8001–8020 зайняті. Закрий попереднє вікно ЧитКвест і спробуй ще раз.",
                "ЧитКвест",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }

        HomeUrl = "http://127.0.0.1:" + port + "/index.html";
        WriteErrorToLog("Starting embedded app on " + HomeUrl);
        string runtimeDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ChitKvest",
            "WebView2");
        Directory.CreateDirectory(runtimeDirectory);
        File.WriteAllBytes(
            Path.Combine(runtimeDirectory, "Microsoft.Web.WebView2.Core.dll"),
            Convert.FromBase64String(Assets["__webview2_core__"]));
        File.WriteAllBytes(
            Path.Combine(runtimeDirectory, "Microsoft.Web.WebView2.WinForms.dll"),
            Convert.FromBase64String(Assets["__webview2_winforms__"]));
        File.WriteAllBytes(
            Path.Combine(runtimeDirectory, "WebView2Loader.dll"),
            Convert.FromBase64String(WebView2LoaderBase64));
        SetDllDirectory(runtimeDirectory);
        AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs eventArgs)
        {
            string requestedName = new AssemblyName(eventArgs.Name).Name;
            if (requestedName == "Microsoft.Web.WebView2.Core" ||
                requestedName == "Microsoft.Web.WebView2.WinForms")
            {
                return Assembly.LoadFrom(Path.Combine(runtimeDirectory, requestedName + ".dll"));
            }
            return null;
        };

        Thread listenerThread = new Thread(ListenForRequests);
        listenerThread.IsBackground = true;
        listenerThread.Start();

        try
        {
            return RunApplication();
        }
        catch (Exception exception)
        {
            WriteErrorToLog("Application startup failed: " + exception);
            SiteListener.Stop();
            MessageBox.Show(
                "Не вдалося відкрити вікно програми. Перевір, що Microsoft Edge WebView2 Runtime встановлений.\n\n" + exception.Message,
                "ЧитКвест",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            return 1;
        }
    }

    private static int RunApplication()
    {
        string runtimeDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "ChitKvest",
            "WebView2");
        Assembly.LoadFrom(Path.Combine(runtimeDirectory, "Microsoft.Web.WebView2.Core.dll"));
        Assembly.LoadFrom(Path.Combine(runtimeDirectory, "Microsoft.Web.WebView2.WinForms.dll"));

        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        using (Form form = new Form())
        using (TabControl browserTabs = new TabControl())
        {
            form.Text = "ЧитКвест";
            form.StartPosition = FormStartPosition.CenterScreen;
            form.MinimumSize = new System.Drawing.Size(900, 620);
            form.Size = new System.Drawing.Size(1280, 820);
            browserTabs.Dock = DockStyle.Fill;
            TabPage homeTab = new TabPage("ЧитКвест");
            WebView2 browser = new WebView2();
            browser.Dock = DockStyle.Fill;
            homeTab.Controls.Add(browser);
            browserTabs.TabPages.Add(homeTab);
            form.Controls.Add(browserTabs);
            MenuStrip menu = new MenuStrip();
            ToolStripMenuItem helpMenu = new ToolStripMenuItem("Довідка");
            ToolStripMenuItem licenseItem = new ToolStripMenuItem("Ліцензії");
            licenseItem.Click += delegate { ShowLicenses(); };
            helpMenu.DropDownItems.Add(licenseItem);
            menu.Items.Add(helpMenu);
            form.MainMenuStrip = menu;
            form.Controls.Add(menu);
            form.FormClosed += delegate
            {
                WriteErrorToLog("Main window closed.");
                if (SiteListener != null && SiteListener.IsListening)
                {
                    SiteListener.Stop();
                }
            };
            form.Shown += async delegate
            {
                try
                {
                    WriteErrorToLog("Initializing embedded browser.");
                    CoreWebView2Environment environment = await CoreWebView2Environment.CreateAsync(
                        null,
                        Path.Combine(
                            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                            "ChitKvest",
                            "WebView2Profile"));
                    await browser.EnsureCoreWebView2Async(environment);
                    Action<WebView2, TabPage> configureBrowser = null;
                    configureBrowser = delegate(WebView2 tabBrowser, TabPage tabPage)
                    {
                        tabBrowser.CoreWebView2.DocumentTitleChanged += delegate
                        {
                            string title = String.IsNullOrEmpty(tabBrowser.CoreWebView2.DocumentTitle)
                                ? "Нова вкладка"
                                : tabBrowser.CoreWebView2.DocumentTitle;
                            tabPage.Text = title.Length > 30 ? title.Substring(0, 27) + "..." : title;
                            if (browserTabs.SelectedTab == tabPage)
                            {
                                form.Text = title;
                            }
                        };
                        tabBrowser.CoreWebView2.NavigationCompleted += delegate(object sender, CoreWebView2NavigationCompletedEventArgs eventArgs)
                        {
                            WriteErrorToLog(
                                "Embedded navigation completed: success=" + eventArgs.IsSuccess +
                                ", status=" + eventArgs.WebErrorStatus);
                        };
                        tabBrowser.CoreWebView2.NavigationStarting += delegate(object sender, CoreWebView2NavigationStartingEventArgs eventArgs)
                        {
                            Uri destination;
                            if (!Uri.TryCreate(eventArgs.Uri, UriKind.Absolute, out destination) ||
                                (destination.Scheme != Uri.UriSchemeHttp && destination.Scheme != Uri.UriSchemeHttps))
                            {
                                eventArgs.Cancel = true;
                            }
                        };
                        tabBrowser.CoreWebView2.NewWindowRequested += async delegate(object sender, CoreWebView2NewWindowRequestedEventArgs eventArgs)
                        {
                            CoreWebView2Deferral deferral = eventArgs.GetDeferral();
                            TabPage newTab = null;
                            try
                            {
                                Uri destination;
                                if (!Uri.TryCreate(eventArgs.Uri, UriKind.Absolute, out destination) ||
                                    (destination.Scheme != Uri.UriSchemeHttp && destination.Scheme != Uri.UriSchemeHttps))
                                {
                                    eventArgs.Handled = true;
                                    return;
                                }

                                newTab = new TabPage("Нова вкладка");
                                WebView2 newBrowser = new WebView2();
                                newBrowser.Dock = DockStyle.Fill;
                                newTab.Controls.Add(newBrowser);
                                browserTabs.TabPages.Add(newTab);
                                browserTabs.SelectedTab = newTab;
                                await newBrowser.EnsureCoreWebView2Async(environment);
                                configureBrowser(newBrowser, newTab);
                                eventArgs.NewWindow = newBrowser.CoreWebView2;
                                eventArgs.Handled = true;
                            }
                            catch (Exception exception)
                            {
                                if (newTab != null && browserTabs.TabPages.Contains(newTab))
                                {
                                    browserTabs.TabPages.Remove(newTab);
                                    newTab.Dispose();
                                }
                                eventArgs.Handled = true;
                                WriteErrorToLog("Не вдалося відкрити вкладку в програмі: " + exception);
                                MessageBox.Show(
                                    "Не вдалося відкрити посилання у вкладці програми.\n\n" + exception.Message,
                                    "ЧитКвест",
                                    MessageBoxButtons.OK,
                                    MessageBoxIcon.Error);
                            }
                            finally
                            {
                                deferral.Complete();
                            }
                        };
                    };
                    configureBrowser(browser, homeTab);
                    browserTabs.SelectedIndexChanged += delegate
                    {
                        TabPage selectedTab = browserTabs.SelectedTab;
                        if (selectedTab != null)
                        {
                            WebView2 selectedBrowser = selectedTab.Controls.Count > 0
                                ? selectedTab.Controls[0] as WebView2
                                : null;
                            form.Text = selectedBrowser != null &&
                                selectedBrowser.CoreWebView2 != null &&
                                !String.IsNullOrEmpty(selectedBrowser.CoreWebView2.DocumentTitle)
                                ? selectedBrowser.CoreWebView2.DocumentTitle
                                : selectedTab.Text;
                        }
                    };
                    browser.CoreWebView2.Navigate(HomeUrl);
                }
                catch (Exception exception)
                {
                    WriteErrorToLog("Не вдалося ініціалізувати WebView2: " + exception);
                    MessageBox.Show(
                        "Не вдалося відкрити вікно програми. Перевір, що Microsoft Edge WebView2 Runtime встановлений.\n\n" + exception.Message,
                        "ЧитКвест",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    form.Close();
                }
            };

            Application.Run(form);
        }

        return 0;
    }

    private static void ShowLicenses()
    {
        using (Form dialog = new Form())
        using (TextBox licenseText = new TextBox())
        {
            dialog.Text = "Ліцензії сторонніх компонентів";
            dialog.StartPosition = FormStartPosition.CenterParent;
            dialog.Size = new System.Drawing.Size(800, 600);
            licenseText.Multiline = true;
            licenseText.ReadOnly = true;
            licenseText.ScrollBars = ScrollBars.Both;
            licenseText.WordWrap = false;
            licenseText.Dock = DockStyle.Fill;
            licenseText.Text = Encoding.UTF8.GetString(Convert.FromBase64String(WebView2LicenseBase64));
            dialog.Controls.Add(licenseText);
            dialog.ShowDialog();
        }
    }

    private static void ListenForRequests()
    {
        try
        {
            WriteErrorToLog("HTTP listener thread started.");
            while (SiteListener.IsListening)
            {
                HttpListenerContext context = SiteListener.GetContext();
                try
                {
                    HandleRequest(context);
                }
                catch (Exception exception)
                {
                    WriteErrorToLog("Помилка запиту: " + exception.Message);
                    TryWriteJson(context.Response, 500, new Dictionary<string, object>
                    {
                        { "error", "Внутрішня помилка сервера." }
                    });
                }
            }
        }
        catch (HttpListenerException exception)
        {
            WriteErrorToLog("HTTP listener stopped: " + exception);
        }
        finally
        {
            SiteListener.Close();
            WriteErrorToLog("HTTP listener closed.");
        }
    }

    private static void OpenExternalLink(string url)
    {
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch (Exception exception)
        {
            WriteErrorToLog("Не вдалося відкрити зовнішнє посилання: " + exception.Message);
        }
    }

    private static void WriteErrorToLog(string message)
    {
        try
        {
            string logPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "ChitKvest",
                "launcher.log");
            Directory.CreateDirectory(Path.GetDirectoryName(logPath));
            File.AppendAllText(logPath, DateTime.UtcNow.ToString("o") + " " + message + Environment.NewLine);
        }
        catch
        {
        }
    }

    private static string GetUserSetting(string name)
    {
        string value = Environment.GetEnvironmentVariable(name);
        if (!String.IsNullOrEmpty(value))
        {
            return value;
        }

        return Registry.GetValue(@"HKEY_CURRENT_USER\Environment", name, null) as string;
    }

    private static void HandleRequest(HttpListenerContext context)
    {
        string path = context.Request.Url.AbsolutePath;
        if (path == "/api/auth/config" || path == "/api/auth/me" ||
            path == "/api/auth/google" || path == "/api/auth/logout" ||
            path == "/api/auth/login" || path == "/api/auth/register" ||
            path == "/api/auth/premium")
        {
            HandleAuthRequest(context);
            return;
        }

        if (path == "/api/send-download-links")
        {
            if (context.Request.HttpMethod != "POST")
            {
                context.Response.Headers["Allow"] = "POST";
                WriteJson(context.Response, 405, new Dictionary<string, object>
                {
                    { "error", "Метод не підтримується." }
                });
                return;
            }

            HandleEmailRequest(context);
            return;
        }

        if (context.Request.HttpMethod != "GET" && context.Request.HttpMethod != "HEAD")
        {
            WriteJson(context.Response, 405, new Dictionary<string, object>
            {
                { "error", "Метод не підтримується." }
            });
            return;
        }

        string assetName = path == "/" ? "index.html" : path.TrimStart('/');
        string encoded;
        if (!Assets.TryGetValue(assetName, out encoded))
        {
            WriteJson(context.Response, 404, new Dictionary<string, object>
            {
                { "error", "Файл не знайдено." }
            });
            return;
        }

        byte[] content = Convert.FromBase64String(encoded);
        context.Response.StatusCode = 200;
        context.Response.ContentType = GetContentType(assetName);
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["Cache-Control"] = "no-cache";
        context.Response.ContentLength64 = content.Length;
        if (context.Request.HttpMethod != "HEAD")
        {
            context.Response.OutputStream.Write(content, 0, content.Length);
        }
        context.Response.Close();
    }

    private static void HandleAuthRequest(HttpListenerContext context)
    {
        string path = context.Request.Url.AbsolutePath;
        if (path == "/api/auth/register")
        {
            if (context.Request.HttpMethod != "POST")
            {
                context.Response.Headers["Allow"] = "POST";
                WriteJson(context.Response, 405, new Dictionary<string, object>
                {
                    { "error", "Метод не підтримується." }
                });
                return;
            }

            HandleRegister(context);
            return;
        }

        if (path == "/api/auth/login")
        {
            if (context.Request.HttpMethod != "POST")
            {
                context.Response.Headers["Allow"] = "POST";
                WriteJson(context.Response, 405, new Dictionary<string, object>
                {
                    { "error", "Метод не підтримується." }
                });
                return;
            }

            HandleLogin(context);
            return;
        }

        if (path == "/api/auth/config")
        {
            if (context.Request.HttpMethod != "GET")
            {
                context.Response.Headers["Allow"] = "GET";
                WriteJson(context.Response, 405, new Dictionary<string, object>
                {
                    { "error", "Метод не підтримується." }
                });
                return;
            }

            WriteJson(context.Response, 200, new Dictionary<string, object>
            {
                { "clientId", String.IsNullOrEmpty(GoogleClientId) ? null : GoogleClientId }
            });
            return;
        }

        if (path == "/api/auth/me")
        {
            if (context.Request.HttpMethod != "GET")
            {
                context.Response.Headers["Allow"] = "GET";
                WriteJson(context.Response, 405, new Dictionary<string, object>
                {
                    { "error", "Метод не підтримується." }
                });
                return;
            }

            HandleAuthMe(context);
            return;
        }

        if (path == "/api/auth/premium")
        {
            if (context.Request.HttpMethod != "POST")
            {
                context.Response.Headers["Allow"] = "POST";
                WriteJson(context.Response, 405, new Dictionary<string, object>
                {
                    { "error", "Метод не підтримується." }
                });
                return;
            }

            HandlePremiumSubscription(context);
            return;
        }

        if (path == "/api/auth/google")
        {
            if (context.Request.HttpMethod != "POST")
            {
                context.Response.Headers["Allow"] = "POST";
                WriteJson(context.Response, 405, new Dictionary<string, object>
                {
                    { "error", "Метод не підтримується." }
                });
                return;
            }

            HandleGoogleSignIn(context);
            return;
        }

        if (context.Request.HttpMethod != "POST")
        {
            context.Response.Headers["Allow"] = "POST";
            WriteJson(context.Response, 405, new Dictionary<string, object>
            {
                { "error", "Метод не підтримується." }
            });
            return;
        }

        if (!HasSameOrigin(context.Request))
        {
            WriteJson(context.Response, 403, new Dictionary<string, object>
            {
                { "error", "Запит відхилено." }
            });
            return;
        }

        context.Response.AppendHeader("Set-Cookie", SerializeSessionCookie("", 0));
        WriteJson(context.Response, 200, new Dictionary<string, object>
        {
            { "success", true }
        });
    }

    private static string HashPassword(string password, string salt)
    {
        byte[] saltBytes = Convert.FromBase64String(salt);
        using (Rfc2898DeriveBytes pbkdf2 = new Rfc2898DeriveBytes(password, saltBytes, 10000))
        {
            return Convert.ToBase64String(pbkdf2.GetBytes(32));
        }
    }

    private static string GenerateSalt()
    {
        byte[] salt = new byte[16];
        using (RNGCryptoServiceProvider rng = new RNGCryptoServiceProvider())
        {
            rng.GetBytes(salt);
        }
        return Convert.ToBase64String(salt);
    }

    private static bool VerifyPassword(string password, string hash, string salt)
    {
        if (String.IsNullOrEmpty(password) || String.IsNullOrEmpty(hash) || String.IsNullOrEmpty(salt))
        {
            return false;
        }
        try
        {
            string computed = HashPassword(password, salt);
            return String.Equals(computed, hash, StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }

    private static void SaveAuthUsers(List<AuthUser> users)
    {
        string temporaryFile = AuthUsersFile + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            File.WriteAllText(temporaryFile, Json.Serialize(users), new UTF8Encoding(false));
            if (File.Exists(AuthUsersFile))
            {
                File.Replace(temporaryFile, AuthUsersFile, null);
            }
            else
            {
                File.Move(temporaryFile, AuthUsersFile);
            }
        }
        finally
        {
            if (File.Exists(temporaryFile))
            {
                File.Delete(temporaryFile);
            }
        }
    }

    private static void HandleRegister(HttpListenerContext context)
    {
        AuthRegisterPayload payload;
        using (StreamReader reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
        {
            try
            {
                payload = Json.Deserialize<AuthRegisterPayload>(reader.ReadToEnd());
            }
            catch
            {
                payload = null;
            }
        }

        if (payload == null || String.IsNullOrWhiteSpace(payload.username) || String.IsNullOrWhiteSpace(payload.password))
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Будь ласка, вкажіть логін та пароль." }
            });
            return;
        }

        string username = payload.username.Trim();
        if (username.Length < 3 || username.Length > 32)
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Логін має містити від 3 до 32 символів." }
            });
            return;
        }

        string password = payload.password;
        if (password.Length < 4)
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Пароль має містити щонайменше 4 символи." }
            });
            return;
        }

        string email = String.IsNullOrWhiteSpace(payload.email) ? (username + "@local") : payload.email.Trim();

        lock (AuthUsersLock)
        {
            List<AuthUser> users = LoadAuthUsers();
            AuthUser existingUser = users.Find(delegate(AuthUser entry)
            {
                return (entry.username != null && String.Equals(entry.username, username, StringComparison.OrdinalIgnoreCase)) ||
                       (entry.email != null && String.Equals(entry.email, email, StringComparison.OrdinalIgnoreCase));
            });

            if (existingUser != null)
            {
                // Сумісність: якщо користувач вже зареєстрований раніше (наприклад через Google)
                // і ще не має встановленого пароля — прив'язуємо логін і пароль без втрати даних
                if (String.IsNullOrEmpty(existingUser.passwordHash))
                {
                    string salt = GenerateSalt();
                    string hash = HashPassword(password, salt);
                    existingUser.username = username;
                    if (String.IsNullOrEmpty(existingUser.email)) existingUser.email = email;
                    existingUser.passwordSalt = salt;
                    existingUser.passwordHash = hash;

                    if (String.IsNullOrEmpty(existingUser.status)) existingUser.status = "Базовий";
                    if (String.IsNullOrEmpty(existingUser.role)) existingUser.role = "Користувач";
                    if (String.IsNullOrEmpty(existingUser.tier)) existingUser.tier = "Базовий";
                    if (existingUser.settings == null)
                    {
                        existingUser.settings = new Dictionary<string, object>
                        {
                            { "theme", "dark" },
                            { "notifications", true },
                            { "cabinetVersion", 2 }
                        };
                    }
                    existingUser.lastLoginAt = DateTime.UtcNow.ToString("o");

                    SaveAuthUsers(users);

                    context.Response.AppendHeader(
                        "Set-Cookie",
                        SerializeSessionCookie(GetSessionToken(existingUser.id), AuthSessionDurationSeconds));

                    WriteJson(context.Response, 200, new Dictionary<string, object>
                    {
                        { "success", true },
                        { "message", "Пароль успішно прив'язано до вашого акаунту. Ви увійшли." },
                        { "user", GetPublicUser(existingUser) }
                    });
                    return;
                }

                // Якщо акаунт вже має пароль
                WriteJson(context.Response, 409, new Dictionary<string, object>
                {
                    { "error", "Користувач із таким логіном або email вже зареєстрований. Перейдіть на вкладку «Вхід», щоб увійти." },
                    { "code", "USER_ALREADY_EXISTS" }
                });
                return;
            }

            string newSalt = GenerateSalt();
            string newHash = HashPassword(password, newSalt);
            string now = DateTime.UtcNow.ToString("o");

            AuthUser newUser = new AuthUser
            {
                id = "usr_" + Guid.NewGuid().ToString("N"),
                username = username,
                email = email,
                name = username,
                passwordSalt = newSalt,
                passwordHash = newHash,
                status = "Базовий",
                role = "Користувач",
                tier = "Базовий",
                createdAt = now,
                lastLoginAt = now,
                settings = new Dictionary<string, object>
                {
                    { "theme", "dark" },
                    { "notifications", true },
                    { "cabinetVersion", 2 }
                }
            };

            users.Add(newUser);
            SaveAuthUsers(users);

            context.Response.AppendHeader(
                "Set-Cookie",
                SerializeSessionCookie(GetSessionToken(newUser.id), AuthSessionDurationSeconds));

            WriteJson(context.Response, 200, new Dictionary<string, object>
            {
                { "success", true },
                { "message", "Акаунт створено з базовим статусом. Ви увійшли." },
                { "user", GetPublicUser(newUser) }
            });
        }
    }

    private static void HandleLogin(HttpListenerContext context)
    {
        AuthLoginPayload payload;
        using (StreamReader reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
        {
            try
            {
                payload = Json.Deserialize<AuthLoginPayload>(reader.ReadToEnd());
            }
            catch
            {
                payload = null;
            }
        }

        if (payload == null || String.IsNullOrWhiteSpace(payload.login) || String.IsNullOrWhiteSpace(payload.password))
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Введіть логін та пароль." }
            });
            return;
        }

        string login = payload.login.Trim();
        string password = payload.password;

        lock (AuthUsersLock)
        {
            List<AuthUser> users = LoadAuthUsers();
            AuthUser user = users.Find(delegate(AuthUser entry)
            {
                return (entry.username != null && String.Equals(entry.username, login, StringComparison.OrdinalIgnoreCase)) ||
                       (entry.email != null && String.Equals(entry.email, login, StringComparison.OrdinalIgnoreCase));
            });

            if (user == null)
            {
                WriteJson(context.Response, 401, new Dictionary<string, object>
                {
                    { "error", "Користувача не знайдено. Перевірте логін або зареєструйтесь." },
                    { "code", "USER_NOT_FOUND" }
                });
                return;
            }

            // Якщо користувач зареєстрований через Google і ще не має пароля
            if (String.IsNullOrEmpty(user.passwordHash) || String.IsNullOrEmpty(user.passwordSalt))
            {
                WriteJson(context.Response, 401, new Dictionary<string, object>
                {
                    { "error", "Цей акаунт створено через Google. Увійдіть через Google або створіть пароль на вкладці «Реєстрація»." },
                    { "code", "GOOGLE_USER_NO_PASSWORD" }
                });
                return;
            }

            if (!VerifyPassword(password, user.passwordHash, user.passwordSalt))
            {
                WriteJson(context.Response, 401, new Dictionary<string, object>
                {
                    { "error", "Невірний пароль. Спробуйте ще раз." },
                    { "code", "INVALID_PASSWORD" }
                });
                return;
            }

            // Сумісність: підтягуємо дефолтні значення для раніше створених акаунтів
            if (String.IsNullOrEmpty(user.status)) user.status = "Базовий";
            if (String.IsNullOrEmpty(user.role)) user.role = "Користувач";
            if (String.IsNullOrEmpty(user.tier)) user.tier = "Базовий";
            if (user.settings == null)
            {
                user.settings = new Dictionary<string, object>
                {
                    { "theme", "dark" },
                    { "notifications", true },
                    { "cabinetVersion", 2 }
                };
            }
            user.lastLoginAt = DateTime.UtcNow.ToString("o");

            SaveAuthUsers(users);

            context.Response.AppendHeader(
                "Set-Cookie",
                SerializeSessionCookie(GetSessionToken(user.id), AuthSessionDurationSeconds));

            WriteJson(context.Response, 200, new Dictionary<string, object>
            {
                { "success", true },
                { "message", "Ви успішно увійшли." },
                { "user", GetPublicUser(user) }
            });
        }
    }

    private static void HandleAuthMe(HttpListenerContext context)
    {
        string userId = GetSessionUserId(context.Request);
        if (String.IsNullOrEmpty(userId))
        {
            WriteJson(context.Response, 200, new Dictionary<string, object>
            {
                { "user", null }
            });
            return;
        }

        try
        {
            AuthUser user = LoadAuthUsers().Find(delegate(AuthUser entry)
            {
                return String.Equals(entry.id, userId, StringComparison.Ordinal);
            });
            WriteJson(context.Response, 200, new Dictionary<string, object>
            {
                { "user", GetPublicUser(user) }
            });
        }
        catch (Exception exception)
        {
            WriteErrorToLog("Could not load signed-in account: " + exception);
            WriteJson(context.Response, 500, new Dictionary<string, object>
            {
                { "error", "Не вдалося завантажити акаунт." }
            });
        }
    }

    private static void HandlePremiumSubscription(HttpListenerContext context)
    {
        if (!HasSameOrigin(context.Request))
        {
            WriteJson(context.Response, 403, new Dictionary<string, object>
            {
                { "error", "Запит відхилено." }
            });
            return;
        }

        string userId = GetSessionUserId(context.Request);
        if (String.IsNullOrEmpty(userId))
        {
            WriteJson(context.Response, 401, new Dictionary<string, object>
            {
                { "error", "Увійди в акаунт, щоб зберегти підписку." }
            });
            return;
        }

        PremiumSubscriptionPayload payload;
        using (StreamReader reader = new StreamReader(context.Request.InputStream, Encoding.UTF8))
        {
            try
            {
                payload = Json.Deserialize<PremiumSubscriptionPayload>(reader.ReadToEnd());
            }
            catch
            {
                payload = null;
            }
        }

        int[] allowedDurations = new int[] { 1, 30, 90, 180, 365, 1200000 };
        if (payload == null || Array.IndexOf(allowedDurations, payload.days) < 0)
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Обери один із доступних термінів підписки." }
            });
            return;
        }

        lock (AuthUsersLock)
        {
            try
            {
                List<AuthUser> users = LoadAuthUsers();
                AuthUser user = users.Find(delegate(AuthUser entry)
                {
                    return String.Equals(entry.id, userId, StringComparison.Ordinal);
                });
                if (user == null)
                {
                    WriteJson(context.Response, 401, new Dictionary<string, object>
                    {
                        { "error", "Акаунт не знайдено. Увійди знову." }
                    });
                    return;
                }

                DateTime purchasedAt = DateTime.UtcNow;
                if (user.settings == null)
                {
                    user.settings = new Dictionary<string, object>();
                }
                user.status = "Преміум користувач";
                user.tier = "Преміум";
                user.settings["premiumSearchSubscription"] = new Dictionary<string, object>
                {
                    { "days", payload.days },
                    { "purchasedAt", purchasedAt.ToString("o") },
                    { "expiresAt", purchasedAt.AddDays(payload.days).ToString("o") }
                };
                SaveAuthUsers(users);

                WriteJson(context.Response, 200, new Dictionary<string, object>
                {
                    { "success", true },
                    { "user", GetPublicUser(user) }
                });
            }
            catch (Exception exception)
            {
                WriteErrorToLog("Could not save premium subscription: " + exception);
                WriteJson(context.Response, 500, new Dictionary<string, object>
                {
                    { "error", "Не вдалося зберегти преміум-статус. Спробуй ще раз." }
                });
            }
        }
    }

    private static void HandleGoogleSignIn(HttpListenerContext context)
    {
        if (String.IsNullOrEmpty(GoogleClientId))
        {
            WriteJson(context.Response, 503, new Dictionary<string, object>
            {
                { "error", "Google-вхід не налаштовано. Додай GOOGLE_OAUTH_CLIENT_ID у змінні користувача Windows." }
            });
            return;
        }

        if (IsAuthRateLimited(context.Request.RemoteEndPoint.Address.ToString()))
        {
            WriteJson(context.Response, 429, new Dictionary<string, object>
            {
                { "error", "Забагато спроб входу. Спробуй пізніше." }
            });
            return;
        }

        string contentType = context.Request.ContentType ?? "";
        bool isPopupRequest = contentType.StartsWith("application/json", StringComparison.OrdinalIgnoreCase);
        string credential;
        if (isPopupRequest)
        {
            if (!HasSameOrigin(context.Request))
            {
                WriteJson(context.Response, 403, new Dictionary<string, object>
                {
                    { "error", "Запит відхилено." }
                });
                return;
            }

            try
            {
                byte[] body = ReadRequestBody(context.Request);
                GoogleCredentialPayload payload =
                    Json.Deserialize<GoogleCredentialPayload>(Encoding.UTF8.GetString(body));
                credential = payload == null ? null : payload.credential;
            }
            catch
            {
                WriteJson(context.Response, 400, new Dictionary<string, object>
                {
                    { "error", "Перевір формат запиту." }
                });
                return;
            }
        }
        else if (contentType.StartsWith("application/x-www-form-urlencoded", StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                byte[] body = ReadRequestBody(context.Request);
                System.Collections.Specialized.NameValueCollection form =
                    HttpUtility.ParseQueryString(Encoding.UTF8.GetString(body));
                Cookie csrfCookie = context.Request.Cookies["g_csrf_token"];
                string csrfField = form["g_csrf_token"];
                if (csrfCookie == null || String.IsNullOrEmpty(csrfCookie.Value) ||
                    String.IsNullOrEmpty(csrfField) ||
                    !String.Equals(csrfCookie.Value, csrfField, StringComparison.Ordinal))
                {
                    WriteJson(context.Response, 403, new Dictionary<string, object>
                    {
                        { "error", "Запит відхилено." }
                    });
                    return;
                }
                credential = form["credential"];
            }
            catch
            {
                WriteJson(context.Response, 400, new Dictionary<string, object>
                {
                    { "error", "Перевір формат запиту." }
                });
                return;
            }
        }
        else
        {
            WriteJson(context.Response, 415, new Dictionary<string, object>
            {
                { "error", "Формат запиту не підтримується." }
            });
            return;
        }

        if (String.IsNullOrEmpty(credential))
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Не отримано підтвердження входу Google." }
            });
            return;
        }

        try
        {
            AuthUser profile = VerifyGoogleCredential(credential);
            bool accountCreated;
            AuthUser user = UpsertAuthUser(profile, out accountCreated);
            context.Response.AppendHeader(
                "Set-Cookie",
                SerializeSessionCookie(GetSessionToken(user.id), AuthSessionDurationSeconds));
            if (isPopupRequest)
            {
                WriteJson(context.Response, 200, new Dictionary<string, object>
                {
                    { "user", GetPublicUser(user) },
                    { "accountCreated", accountCreated }
                });
            }
            else
            {
                RedirectAuthResult(context.Response, accountCreated ? "created" : "success");
            }
        }
        catch (InvalidGoogleCredentialException)
        {
            if (isPopupRequest)
            {
                WriteJson(context.Response, 401, new Dictionary<string, object>
                {
                    { "error", "Підтвердження від Google недійсне або застаріле. Спробуй ще раз." }
                });
            }
            else
            {
                RedirectAuthResult(context.Response, "error");
            }
        }
        catch (Exception exception)
        {
            WriteErrorToLog("Google sign-in failed: " + exception);
            if (isPopupRequest)
            {
                WriteJson(context.Response, 500, new Dictionary<string, object>
                {
                    { "error", "Не вдалося завершити вхід через Google. Спробуй ще раз." }
                });
            }
            else
            {
                RedirectAuthResult(context.Response, "error");
            }
        }
    }

    private static void RedirectAuthResult(HttpListenerResponse response, string result)
    {
        response.StatusCode = 303;
        response.Headers["Location"] = "/?auth=" + Uri.EscapeDataString(result);
        response.Headers["Cache-Control"] = "no-store";
        response.Close();
    }

    private static bool HasSameOrigin(HttpListenerRequest request)
    {
        string origin = request.Headers["Origin"];
        Uri originUri;
        return !String.IsNullOrEmpty(origin) &&
            Uri.TryCreate(origin, UriKind.Absolute, out originUri) &&
            String.Equals(originUri.Authority, request.Url.Authority, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsAuthRateLimited(string address)
    {
        lock (AuthRequestLimitLock)
        {
            DateTime now = DateTime.UtcNow;
            RateLimit limit;
            if (!AuthRequestLimits.TryGetValue(address, out limit) ||
                now - limit.StartedAt >= TimeSpan.FromMinutes(10))
            {
                AuthRequestLimits[address] = new RateLimit { StartedAt = now, Count = 1 };
                return false;
            }

            limit.Count++;
            return limit.Count > MaxAuthRequests;
        }
    }

    private static AuthUser VerifyGoogleCredential(string credential)
    {
        if (credential.Length > 10000)
        {
            throw new InvalidGoogleCredentialException();
        }

        string[] parts = credential.Split('.');
        if (parts.Length != 3)
        {
            throw new InvalidGoogleCredentialException();
        }

        Dictionary<string, object> header;
        Dictionary<string, object> claims;
        try
        {
            header = Json.Deserialize<Dictionary<string, object>>(
                Encoding.UTF8.GetString(FromBase64Url(parts[0])));
            claims = Json.Deserialize<Dictionary<string, object>>(
                Encoding.UTF8.GetString(FromBase64Url(parts[1])));
        }
        catch
        {
            throw new InvalidGoogleCredentialException();
        }

        if (header == null || claims == null ||
            GetStringClaim(header, "alg") != "RS256")
        {
            throw new InvalidGoogleCredentialException();
        }

        string keyId = GetStringClaim(header, "kid");
        GoogleSigningKey signingKey = GetGoogleSigningKey(keyId, false);
        if (signingKey == null)
        {
            signingKey = GetGoogleSigningKey(keyId, true);
        }
        if (signingKey == null)
        {
            throw new InvalidGoogleCredentialException();
        }

        bool signatureValid;
        try
        {
            using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider())
            {
                rsa.ImportParameters(new RSAParameters
                {
                    Modulus = FromBase64Url(signingKey.n),
                    Exponent = FromBase64Url(signingKey.e)
                });
                signatureValid = rsa.VerifyData(
                    Encoding.ASCII.GetBytes(parts[0] + "." + parts[1]),
                    CryptoConfig.MapNameToOID("SHA256"),
                    FromBase64Url(parts[2]));
            }
        }
        catch (CryptographicException)
        {
            throw new InvalidGoogleCredentialException();
        }
        catch (FormatException)
        {
            throw new InvalidGoogleCredentialException();
        }

        string issuer = GetStringClaim(claims, "iss");
        string subject = GetStringClaim(claims, "sub");
        string email = GetStringClaim(claims, "email");
        object verifiedValue;
        claims.TryGetValue("email_verified", out verifiedValue);
        bool emailVerified = (verifiedValue is bool && (bool)verifiedValue) ||
            String.Equals(verifiedValue as string, "true", StringComparison.OrdinalIgnoreCase);
        long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        long expiration = GetUnixTimeClaim(claims, "exp");
        long issuedAt = GetUnixTimeClaim(claims, "iat");
        if (!signatureValid ||
            !GoogleAudienceMatches(claims, GoogleClientId) ||
            (issuer != "https://accounts.google.com" && issuer != "accounts.google.com") ||
            String.IsNullOrEmpty(subject) ||
            expiration <= now ||
            issuedAt <= 0 ||
            issuedAt > now + 60 ||
            String.IsNullOrEmpty(email) ||
            email.Length > 254 ||
            !System.Text.RegularExpressions.Regex.IsMatch(email, @"^[^\s@]+@[^\s@]+\.[^\s@]+$") ||
            !emailVerified)
        {
            throw new InvalidGoogleCredentialException();
        }

        string name = GetStringClaim(claims, "name");
        return new AuthUser
        {
            id = subject,
            email = email.ToLowerInvariant(),
            name = String.IsNullOrEmpty(name) ? email : name,
            picture = GetStringClaim(claims, "picture")
        };
    }

    private static bool GoogleAudienceMatches(Dictionary<string, object> claims, string expectedAudience)
    {
        object audience;
        if (!claims.TryGetValue("aud", out audience))
        {
            return false;
        }

        if (String.Equals(audience as string, expectedAudience, StringComparison.Ordinal))
        {
            return true;
        }

        IEnumerable audiences = audience as IEnumerable;
        if (audiences != null && !(audience is string))
        {
            foreach (object value in audiences)
            {
                if (String.Equals(value as string, expectedAudience, StringComparison.Ordinal))
                {
                    return true;
                }
            }
        }
        return false;
    }

    private static long GetUnixTimeClaim(Dictionary<string, object> claims, string name)
    {
        object value;
        if (!claims.TryGetValue(name, out value))
        {
            return 0;
        }

        try
        {
            return Convert.ToInt64(value, System.Globalization.CultureInfo.InvariantCulture);
        }
        catch
        {
            return 0;
        }
    }

    private static string GetStringClaim(Dictionary<string, object> claims, string name)
    {
        object value;
        return claims.TryGetValue(name, out value) ? value as string : null;
    }

    private static List<GoogleSigningKey> GetGoogleSigningKeys(bool refresh)
    {
        lock (GoogleSigningKeysLock)
        {
            if (!refresh && GoogleSigningKeys != null && GoogleSigningKeysExpiresAt > DateTime.UtcNow)
            {
                return GoogleSigningKeys;
            }

            HttpWebRequest request = (HttpWebRequest)WebRequest.Create("https://www.googleapis.com/oauth2/v3/certs");
            request.Method = "GET";
            request.Timeout = 10000;
            request.ReadWriteTimeout = 10000;
            using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
            using (StreamReader reader = new StreamReader(response.GetResponseStream()))
            {
                Dictionary<string, object> result =
                    Json.Deserialize<Dictionary<string, object>>(reader.ReadToEnd());
                object rawKeys;
                IEnumerable keyEntries;
                if (result == null || !result.TryGetValue("keys", out rawKeys) ||
                    (keyEntries = rawKeys as IEnumerable) == null ||
                    rawKeys is string)
                {
                    throw new InvalidDataException("Google returned an invalid signing key list.");
                }

                List<GoogleSigningKey> keys = new List<GoogleSigningKey>();
                foreach (object entry in keyEntries)
                {
                    Dictionary<string, object> values = entry as Dictionary<string, object>;
                    if (values == null)
                    {
                        continue;
                    }

                    GoogleSigningKey key = new GoogleSigningKey
                    {
                        kid = GetStringClaim(values, "kid"),
                        kty = GetStringClaim(values, "kty"),
                        n = GetStringClaim(values, "n"),
                        e = GetStringClaim(values, "e")
                    };
                    if (key.kty == "RSA" && !String.IsNullOrEmpty(key.kid) &&
                        !String.IsNullOrEmpty(key.n) && !String.IsNullOrEmpty(key.e))
                    {
                        keys.Add(key);
                    }
                }

                if (keys.Count == 0)
                {
                    throw new InvalidDataException("Google returned no RSA signing keys.");
                }
                GoogleSigningKeys = keys;
                GoogleSigningKeysExpiresAt = DateTime.UtcNow.AddMinutes(5);
                return GoogleSigningKeys;
            }
        }
    }

    private static GoogleSigningKey GetGoogleSigningKey(string keyId, bool refresh)
    {
        if (String.IsNullOrEmpty(keyId))
        {
            return null;
        }

        List<GoogleSigningKey> keys = GetGoogleSigningKeys(refresh);
        return keys.Find(delegate(GoogleSigningKey key)
        {
            return String.Equals(key.kid, keyId, StringComparison.Ordinal);
        });
    }

    private static byte[] FromBase64Url(string value)
    {
        if (String.IsNullOrEmpty(value) || value.IndexOf('=') >= 0)
        {
            throw new FormatException("Invalid base64url value.");
        }

        string base64 = value.Replace('-', '+').Replace('_', '/');
        switch (base64.Length % 4)
        {
            case 0:
                break;
            case 2:
                base64 += "==";
                break;
            case 3:
                base64 += "=";
                break;
            default:
                throw new FormatException("Invalid base64url value.");
        }
        return Convert.FromBase64String(base64);
    }

    private static string ToBase64Url(byte[] value)
    {
        return Convert.ToBase64String(value).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static void InitializeAuthSessionKey()
    {
        Directory.CreateDirectory(AuthDataDirectory);
        if (!File.Exists(AuthSessionKeyFile))
        {
            try
            {
                using (FileStream stream = new FileStream(
                    AuthSessionKeyFile,
                    FileMode.CreateNew,
                    FileAccess.Write,
                    FileShare.None))
                {
                    byte[] key = new byte[32];
                    using (RandomNumberGenerator generator = RandomNumberGenerator.Create())
                    {
                        generator.GetBytes(key);
                    }
                    stream.Write(key, 0, key.Length);
                    stream.Flush(true);
                }
            }
            catch (IOException)
            {
                if (!File.Exists(AuthSessionKeyFile))
                {
                    throw;
                }
            }
        }

        AuthSessionKey = File.ReadAllBytes(AuthSessionKeyFile);
        if (AuthSessionKey.Length != 32)
        {
            throw new InvalidDataException("The saved authentication session key has an invalid length.");
        }
    }

    private static string GetSessionToken(string userId)
    {
        string payload = ToBase64Url(Encoding.UTF8.GetBytes(Json.Serialize(new Dictionary<string, object>
        {
            { "userId", userId },
            { "expiresAt", DateTimeOffset.UtcNow.ToUnixTimeSeconds() + AuthSessionDurationSeconds }
        })));
        byte[] signature;
        using (HMACSHA256 hmac = new HMACSHA256(AuthSessionKey))
        {
            signature = hmac.ComputeHash(Encoding.ASCII.GetBytes(payload));
        }
        return payload + "." + ToBase64Url(signature);
    }

    private static string GetSessionUserId(HttpListenerRequest request)
    {
        Cookie cookie = request.Cookies["chitkvest_session"];
        if (cookie == null || String.IsNullOrEmpty(cookie.Value))
        {
            return null;
        }

        string[] parts = cookie.Value.Split('.');
        if (parts.Length != 2)
        {
            return null;
        }

        try
        {
            byte[] expectedSignature;
            using (HMACSHA256 hmac = new HMACSHA256(AuthSessionKey))
            {
                expectedSignature = hmac.ComputeHash(Encoding.ASCII.GetBytes(parts[0]));
            }
            byte[] actualSignature = FromBase64Url(parts[1]);
            if (actualSignature.Length != expectedSignature.Length)
            {
                return null;
            }
            int difference = 0;
            for (int i = 0; i < actualSignature.Length; i++)
            {
                difference |= actualSignature[i] ^ expectedSignature[i];
            }
            if (difference != 0)
            {
                return null;
            }

            Dictionary<string, object> session = Json.Deserialize<Dictionary<string, object>>(
                Encoding.UTF8.GetString(FromBase64Url(parts[0])));
            string userId = GetStringClaim(session, "userId");
            if (String.IsNullOrEmpty(userId) ||
                GetUnixTimeClaim(session, "expiresAt") <= DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            {
                return null;
            }
            return userId;
        }
        catch
        {
            return null;
        }
    }

    private static string SerializeSessionCookie(string value, int maxAge)
    {
        string cookie = "chitkvest_session=" + value +
            "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" + maxAge.ToString(
                System.Globalization.CultureInfo.InvariantCulture);
        if (maxAge > 0)
        {
            DateTime expires = DateTime.UtcNow.AddSeconds(maxAge);
            cookie += "; Expires=" + expires.ToString("R", System.Globalization.CultureInfo.InvariantCulture);
        }
        else
        {
            cookie += "; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        return cookie;
    }

    private static List<AuthUser> LoadAuthUsers()
    {
        if (!File.Exists(AuthUsersFile))
        {
            return new List<AuthUser>();
        }

        List<AuthUser> users = Json.Deserialize<List<AuthUser>>(File.ReadAllText(AuthUsersFile, Encoding.UTF8));
        if (users == null)
        {
            throw new InvalidDataException("Stored account data must be an array.");
        }
        foreach (AuthUser entry in users)
        {
            if (entry != null)
            {
                if (String.IsNullOrEmpty(entry.status)) entry.status = "Базовий";
                if (String.IsNullOrEmpty(entry.role)) entry.role = "Користувач";
                if (String.IsNullOrEmpty(entry.tier)) entry.tier = "Базовий";
                if (entry.settings == null)
                {
                    entry.settings = new Dictionary<string, object>
                    {
                        { "theme", "dark" },
                        { "notifications", true },
                        { "cabinetVersion", 2 }
                    };
                }
            }
        }
        return users;
    }

    private static AuthUser UpsertAuthUser(AuthUser profile, out bool accountCreated)
    {
        lock (AuthUsersLock)
        {
            List<AuthUser> users = LoadAuthUsers();
            AuthUser user = users.Find(delegate(AuthUser entry)
            {
                return String.Equals(entry.id, profile.id, StringComparison.Ordinal);
            });
            accountCreated = user == null;
            string now = DateTime.UtcNow.ToString("o");
            if (accountCreated)
            {
                user = profile;
                user.createdAt = now;
                user.status = "Базовий";
                user.role = "Користувач";
                user.tier = "Базовий";
                user.settings = new Dictionary<string, object>
                {
                    { "theme", "dark" },
                    { "notifications", true },
                    { "cabinetVersion", 2 }
                };
                users.Add(user);
            }
            else
            {
                user.email = profile.email;
                user.name = profile.name;
                user.picture = profile.picture;

                // Сумісність: підтягуємо дефолтні значення для раніше зареєстрованих користувачів
                if (String.IsNullOrEmpty(user.status)) user.status = "Базовий";
                if (String.IsNullOrEmpty(user.role)) user.role = "Користувач";
                if (String.IsNullOrEmpty(user.tier)) user.tier = "Базовий";
                if (user.settings == null)
                {
                    user.settings = new Dictionary<string, object>
                    {
                        { "theme", "dark" },
                        { "notifications", true },
                        { "cabinetVersion", 2 }
                    };
                }
                else
                {
                    if (!user.settings.ContainsKey("theme")) user.settings["theme"] = "dark";
                    if (!user.settings.ContainsKey("notifications")) user.settings["notifications"] = true;
                    if (!user.settings.ContainsKey("cabinetVersion")) user.settings["cabinetVersion"] = 2;
                }
            }
            user.lastLoginAt = now;

            string temporaryFile = AuthUsersFile + "." + Guid.NewGuid().ToString("N") + ".tmp";
            try
            {
                File.WriteAllText(temporaryFile, Json.Serialize(users), new UTF8Encoding(false));
                if (File.Exists(AuthUsersFile))
                {
                    File.Replace(temporaryFile, AuthUsersFile, null);
                }
                else
                {
                    File.Move(temporaryFile, AuthUsersFile);
                }
            }
            finally
            {
                if (File.Exists(temporaryFile))
                {
                    File.Delete(temporaryFile);
                }
            }
            return user;
        }
    }

    private static object GetPublicUser(AuthUser user)
    {
        if (user == null)
        {
            return null;
        }
        return new Dictionary<string, object>
        {
            { "id", user.id },
            { "username", user.username ?? "" },
            { "email", user.email },
            { "name", user.name ?? user.username ?? user.email },
            { "picture", user.picture },
            { "status", user.status ?? "Базовий" },
            { "role", user.role ?? "Користувач" },
            { "tier", user.tier ?? "Базовий" },
            { "createdAt", user.createdAt },
            { "lastLoginAt", user.lastLoginAt },
            { "settings", user.settings ?? new Dictionary<string, object>() }
        };
    }

    private sealed class InvalidGoogleCredentialException : Exception
    {
    }

    private static string GetContentType(string fileName)
    {
        if (fileName.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            return "text/html; charset=utf-8";
        }
        if (fileName.EndsWith(".css", StringComparison.OrdinalIgnoreCase))
        {
            return "text/css; charset=utf-8";
        }
        if (fileName.EndsWith(".mp3", StringComparison.OrdinalIgnoreCase))
        {
            return "audio/mpeg";
        }
        return "text/javascript; charset=utf-8";
    }

    private static void HandleEmailRequest(HttpListenerContext context)
    {
        if (IsRateLimited(context.Request.RemoteEndPoint.Address.ToString()))
        {
            WriteJson(context.Response, 429, new Dictionary<string, object>
            {
                { "error", "Забагато запитів. Спробуй пізніше." }
            });
            return;
        }

        string origin = context.Request.Headers["Origin"];
        if (!String.IsNullOrEmpty(origin))
        {
            Uri originUri;
            if (!Uri.TryCreate(origin, UriKind.Absolute, out originUri) ||
                !String.Equals(originUri.Authority, context.Request.Url.Authority, StringComparison.OrdinalIgnoreCase))
            {
                WriteJson(context.Response, 403, new Dictionary<string, object>
                {
                    { "error", "Запит відхилено." }
                });
                return;
            }
        }

        if (String.IsNullOrEmpty(AppsScriptUrl) || String.IsNullOrEmpty(AppsScriptToken))
        {
            WriteJson(context.Response, 503, new Dictionary<string, object>
            {
                { "error", "Надсилання email не налаштовано." }
            });
            return;
        }

        if (context.Request.ContentLength64 > MaxBodyBytes)
        {
            WriteJson(context.Response, 413, new Dictionary<string, object>
            {
                { "error", "Запит завеликий." }
            });
            return;
        }

        RequestPayload payload;
        try
        {
            byte[] body = ReadRequestBody(context.Request);
            payload = Json.Deserialize<RequestPayload>(Encoding.UTF8.GetString(body));
        }
        catch
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Перевір формат запиту." }
            });
            return;
        }

        if (payload == null || String.IsNullOrEmpty(payload.email) ||
            payload.email.Length > 254 || !System.Text.RegularExpressions.Regex.IsMatch(payload.email.Trim(), @"^[^\s@]+@[^\s@]+\.[^\s@]+$") ||
            payload.productIds == null || payload.productIds.Length == 0 || payload.productIds.Length > Products.Count)
        {
            WriteJson(context.Response, 400, new Dictionary<string, object>
            {
                { "error", "Перевір email і вибрані товари." }
            });
            return;
        }

        List<string> uniqueIds = new List<string>();
        foreach (string id in payload.productIds)
        {
            if (String.IsNullOrEmpty(id) || !Products.ContainsKey(id))
            {
                WriteJson(context.Response, 400, new Dictionary<string, object>
                {
                    { "error", "Перевір email і вибрані товари." }
                });
                return;
            }
            if (!uniqueIds.Contains(id))
            {
                uniqueIds.Add(id);
            }
        }

        try
        {
            string message = SendDownloadEmail(payload.email.Trim(), uniqueIds);
            WriteJson(context.Response, 200, new Dictionary<string, object>
            {
                { "message", message }
            });
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine("Google Apps Script не підтвердив email: " + exception.Message);
            WriteErrorToLog("Email send failed: " + exception);
            WriteJson(context.Response, 502, new Dictionary<string, object>
            {
                {
                    "error",
                    exception is AppsScriptResponseException
                        ? exception.Message
                        : "Google Apps Script не підтвердив надсилання. Перевір URL, токен і квоти Gmail."
                }
            });
        }
    }

    private static string GetAppsScriptFailureMessage(object rawErrorCode)
    {
        string errorCode = rawErrorCode as string;
        if (errorCode == "EMAIL_PERMISSION_REQUIRED")
        {
            return "Google Apps Script не має дозволу надсилати email. Запусти authorizeEmail у редакторі Apps Script і підтверди доступ.";
        }
        if (errorCode == "EMAIL_QUOTA_EXCEEDED")
        {
            return "Вичерпано денну квоту надсилання Google Apps Script. Спробуй пізніше.";
        }
        if (errorCode == "EMAIL_SEND_FAILED")
        {
            return "Apps Script не зміг надіслати лист. Перевір журнал виконань (Executions) у Google Apps Script.";
        }
        if (errorCode == "EMAIL_STORAGE_FAILED")
        {
            return "Google Apps Script працює зі старою версією, яка зупиняє надсилання через помилку таблиці. Онови код із google-apps-script.gs, запусти setupEmailSpreadsheet, надай дозволи й розгорни нову версію вебзастосунку.";
        }
        return null;
    }

    private static byte[] ReadRequestBody(HttpListenerRequest request)
    {
        using (MemoryStream body = new MemoryStream())
        {
            byte[] buffer = new byte[2048];
            int read;
            while ((read = request.InputStream.Read(buffer, 0, buffer.Length)) > 0)
            {
                if (body.Length + read > MaxBodyBytes)
                {
                    throw new InvalidDataException("Request body is too large.");
                }
                body.Write(buffer, 0, read);
            }
            return body.ToArray();
        }
    }

    private static bool IsRateLimited(string address)
    {
        lock (RateLimitLock)
        {
            DateTime now = DateTime.UtcNow;
            RateLimit limit;
            if (!RequestLimits.TryGetValue(address, out limit) || now - limit.StartedAt >= TimeSpan.FromMinutes(10))
            {
                RequestLimits[address] = new RateLimit { StartedAt = now, Count = 1 };
                return false;
            }

            limit.Count++;
            return limit.Count > MaxRequests;
        }
    }

    private static string SendDownloadEmail(string email, List<string> productIds)
    {
        Uri serviceUri;
        if (!Uri.TryCreate(AppsScriptUrl, UriKind.Absolute, out serviceUri) ||
            serviceUri.Scheme != Uri.UriSchemeHttps ||
            !String.Equals(serviceUri.Host, "script.google.com", StringComparison.OrdinalIgnoreCase) ||
            !serviceUri.AbsolutePath.StartsWith("/macros/s/", StringComparison.Ordinal) ||
            !serviceUri.AbsolutePath.EndsWith("/exec", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("The Apps Script URL is invalid.");
        }

        Dictionary<string, object> payload = new Dictionary<string, object>
        {
            { "token", AppsScriptToken },
            { "email", email },
            { "productIds", productIds.ToArray() }
        };
        byte[] body = Encoding.UTF8.GetBytes(Json.Serialize(payload));
        HttpWebRequest request = (HttpWebRequest)WebRequest.Create(serviceUri);
        request.Method = "POST";
        request.ContentType = "application/json";
        request.AllowAutoRedirect = true;
        request.Timeout = 60000;
        request.ReadWriteTimeout = 60000;
        request.ContentLength = body.Length;
        using (Stream stream = request.GetRequestStream())
        {
            stream.Write(body, 0, body.Length);
        }

        string responseText;
        using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
        using (StreamReader reader = new StreamReader(response.GetResponseStream()))
        {
            responseText = reader.ReadToEnd();
        }

        Dictionary<string, object> result;
        try
        {
            result = Json.Deserialize<Dictionary<string, object>>(responseText);
        }
        catch
        {
            throw new AppsScriptResponseException(
                "Google Apps Script повернув не JSON. Перевір, що вебзастосунок розгорнуто " +
                "з доступом «Усі» і дозвіл на надсилання листів надано.");
        }

        object success;
        if (result == null || !result.TryGetValue("success", out success) || !(success is bool) || !(bool)success)
        {
            object errorCode = null;
            object errorText = null;
            if (result != null)
            {
                result.TryGetValue("errorCode", out errorCode);
                result.TryGetValue("error", out errorText);
            }

            string failureMessage = GetAppsScriptFailureMessage(errorCode);
            if (String.IsNullOrEmpty(failureMessage) && !String.IsNullOrEmpty(errorText as string))
            {
                failureMessage = (string)errorText;
            }
            if (String.IsNullOrEmpty(failureMessage))
            {
                failureMessage = "Google Apps Script не підтвердив надсилання. Перевір URL, токен і квоти Gmail.";
            }
            throw new AppsScriptResponseException(failureMessage);
        }

        return "Лист зі списком товарів надіслано на " + email + ". Адресу збережено.";
    }

    private static void WriteJson(HttpListenerResponse response, int status, object payload)
    {
        byte[] content = Encoding.UTF8.GetBytes(Json.Serialize(payload));
        response.StatusCode = status;
        response.ContentType = "application/json; charset=utf-8";
        response.Headers["Cache-Control"] = "no-store";
        response.Headers["X-Content-Type-Options"] = "nosniff";
        response.ContentLength64 = content.Length;
        response.OutputStream.Write(content, 0, content.Length);
        response.Close();
    }

    private static void TryWriteJson(HttpListenerResponse response, int status, object payload)
    {
        try
        {
            if (response.OutputStream.CanWrite)
            {
                WriteJson(response, status, payload);
            }
        }
        catch
        {
        }
    }
}
'@

$source = $source.Replace('__EMBEDDED_ASSETS__', ($embeddedAssets -join [Environment]::NewLine))
$source = $source.Replace('__WEBVIEW2_LOADER__', $nativeLoaderBase64)
$source = $source.Replace('    private const string WebView2LicenseBase64 = "__WEBVIEW2_LICENSE__";', ('    private const string WebView2LicenseBase64 = "' + $webView2LicenseBase64 + '";'))
Add-Type `
  -TypeDefinition $source `
  -OutputType WindowsApplication `
  -OutputAssembly $executablePath `
  -ReferencedAssemblies @(
    'System.dll',
    'System.Core.dll',
    'System.Drawing.dll',
    'System.Security.dll',
    'System.Web.dll',
    'System.Windows.Forms.dll',
    'System.Web.Extensions.dll',
    $coreAssemblyPath,
    $winFormsAssemblyPath
  )

Write-Output "Built single-file app: $executablePath"
