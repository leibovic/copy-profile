const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/Services.jsm");

var gNativeWindow;
var gMenuId;

function LOG(msg) {
  Services.console.logStringMessage("Copy Profile Add-On -- " + msg);
}

// Copies the current profile to the sdcard
function copyProfile() {
  // If we previously copied the profile to the sdcard, remove it first.
  let sdcardProfileDir = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
  sdcardProfileDir.initWithPath("/sdcard/mozilla_profile");

  if (sdcardProfileDir.exists()) {
    sdcardProfileDir.remove(true);
    LOG("Removed /sdcard/mozilla_profile");
  }

  let sdcardDir = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsILocalFile);
  sdcardDir.initWithPath("/sdcard");

  let profileDir = FileUtils.getDir("ProfD", [], false);
  profileDir.copyTo(sdcardDir, "mozilla_profile");

  LOG("Profile copied to /sdcard/mozilla_profile");
  gNativeWindow.toast.show("Profile copied to /sdcard/mozilla_profile", "short");
}


function loadIntoWindow(window) {
  gNativeWindow = window.NativeWindow;

  // Add "Copy Profile" menu item
  gMenuId = gNativeWindow.menu.add({
    name: "Copy Profile",
    callback: copyProfile,
    parent: gNativeWindow.menu.toolsMenuID
  });
}

function unloadFromWindow(window) {
  gNativeWindow.menu.remove(gMenuId);
}

/**
 * bootstrap.js API
 */
var windowListener = {
  onOpenWindow: function(aWindow) {
    // Wait for the window to finish loading
    let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
    domWindow.addEventListener("load", function() {
      domWindow.removeEventListener("load", arguments.callee, false);
      loadIntoWindow(domWindow);
    }, false);
  },
  
  onCloseWindow: function(aWindow) {
  },
  
  onWindowTitleChange: function(aWindow, aTitle) {
  }
};

function startup(aData, aReason) {
  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Load into any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    loadIntoWindow(domWindow);
  }

  // Load into any new windows
  wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (aReason == APP_SHUTDOWN)
    return;

  let wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

  // Stop listening for new windows
  wm.removeListener(windowListener);

  // Unload from any existing windows
  let windows = wm.getEnumerator("navigator:browser");
  while (windows.hasMoreElements()) {
    let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
    unloadFromWindow(domWindow);
  }
}

function install(aData, aReason) {
}

function uninstall(aData, aReason) {
}
