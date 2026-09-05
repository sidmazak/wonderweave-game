/**
 * Expo WebView compatibility layer.
 * Injected as the first parser-blocking script in the packaged index.html.
 * Does not modify the original Next.js source tree.
 */
(function installWonderweaveCompat(global) {
  if (global.__WW_COMPAT_INSTALLED__) return
  global.__WW_COMPAT_INSTALLED__ = true

  var PERSIST_PREFIX = 'ww-'
  // Must match rewritten script src attributes (relative ./_next prefix).
  // An absolute file:// base makes turbopack wait on absolute URLs while
  // registerChunk resolves relative script src attributes — hydration deadlocks.
  global.TURBOPACK_CHUNK_BASE_PATH = './_next/'

  function post(msg) {
    try {
      if (global.ReactNativeWebView && typeof global.ReactNativeWebView.postMessage === 'function') {
        global.ReactNativeWebView.postMessage(JSON.stringify(msg))
      }
    } catch {
      /* native bridge unavailable (browser preview) */
    }
  }

  function applyHydrate(data) {
    if (!data || typeof data !== 'object') return
    try {
      var ls = global.localStorage
      if (!ls) return
      Object.keys(data).forEach(function (key) {
        if (typeof data[key] !== 'string') return
        if (ls.getItem(key) == null) ls.setItem(key, data[key])
      })
    } catch {
      /* private mode / disabled storage */
    }
  }

  applyHydrate(global.__WW_HYDRATE__)

  /**
   * React's inline RSC/Flight payload must ship byte-identical (rewriting inside it
   * desyncs the Flight row bookkeeping → error #412), so it still carries
   * root-absolute asset paths like "/_next/static/chunks/x.js". Under file:// those
   * resolve to the device root (file:///_next/...) → ERR_FILE_NOT_FOUND →
   * ChunkLoadError → React never hydrates and the loader sticks at 0% forever.
   *
   * Fix the URLs at the point of use instead of in the payload: any root-absolute
   * packaged-asset path becomes document-relative before the WebView requests it.
   */
  ;(function installAbsoluteAssetPathFix() {
    if (global.__WW_ABS_PATH_FIX__) return
    global.__WW_ABS_PATH_FIX__ = true

    var PACKAGED_ROOT = /^\/(?:_next|game|icons)\//

    function fixUrl(value) {
      if (typeof value !== 'string') return value
      return PACKAGED_ROOT.test(value) ? '.' + value : value
    }

    // Chunk/CSS/font loads go through element src/href assignment.
    var patchTargets = [
      ['HTMLScriptElement', 'src'],
      ['HTMLLinkElement', 'href'],
      ['HTMLImageElement', 'src'],
    ]
    patchTargets.forEach(function (pair) {
      var ctor = global[pair[0]]
      if (!ctor || !ctor.prototype) return
      var desc = Object.getOwnPropertyDescriptor(ctor.prototype, pair[1])
      if (!desc || typeof desc.set !== 'function') return
      try {
        Object.defineProperty(ctor.prototype, pair[1], {
          configurable: true,
          enumerable: desc.enumerable,
          get: desc.get,
          set: function (value) {
            desc.set.call(this, fixUrl(value))
          },
        })
      } catch {
        /* descriptor locked down — attribute patch below still applies */
      }
    })

    if (global.Element && global.Element.prototype) {
      var origSetAttribute = global.Element.prototype.setAttribute
      global.Element.prototype.setAttribute = function (name, value) {
        if (name === 'src' || name === 'href') value = fixUrl(value)
        return origSetAttribute.call(this, name, value)
      }
    }

    // Direct XHR callers (including the fetch polyfill below) get the same fix.
    if (global.XMLHttpRequest && global.XMLHttpRequest.prototype) {
      var origOpen = global.XMLHttpRequest.prototype.open
      global.XMLHttpRequest.prototype.open = function (method, url) {
        var args = Array.prototype.slice.call(arguments)
        args[1] = fixUrl(url)
        return origOpen.apply(this, args)
      }
    }

    global.__WW_FIX_URL__ = fixUrl
  })()

  /**
   * Android WebView blocks window.fetch() for file:// URLs (TypeError: Failed to fetch)
   * while XMLHttpRequest succeeds. Next.js App Router hydration uses fetch for flight /
   * module wiring, so without this polyfill the splash stays at 0% forever.
   */
  ;(function installFileFetchPolyfill() {
    if (global.__WW_FETCH_POLY__) return
    global.__WW_FETCH_POLY__ = true
    var nativeFetch = typeof global.fetch === 'function' ? global.fetch.bind(global) : null

    function resolveUrl(input) {
      var fix = global.__WW_FIX_URL__ || function (v) { return v }
      if (typeof input === 'string') return fix(input)
      if (input && typeof input.url === 'string') return fix(input.url)
      return fix(String(input))
    }

    function needsXhr(url) {
      var s = String(url || '')
      if (!s) return true
      if (/^https?:/i.test(s) || /^blob:/i.test(s) || /^data:/i.test(s)) return false
      return true
    }

    function headersFromXhr(xhr) {
      var headers = new Headers()
      var raw = xhr.getAllResponseHeaders() || ''
      raw
        .trim()
        .split(/\r?\n/)
        .forEach(function (line) {
          var idx = line.indexOf(':')
          if (idx > 0) {
            try {
              headers.append(line.slice(0, idx).trim(), line.slice(idx + 1).trim())
            } catch {
              /* ignore invalid header lines */
            }
          }
        })
      return headers
    }

    function applyRequestHeaders(xhr, headers) {
      if (!headers) return
      if (typeof headers.forEach === 'function') {
        headers.forEach(function (value, key) {
          try {
            xhr.setRequestHeader(key, value)
          } catch {
            /* forbidden header names */
          }
        })
        return
      }
      if (typeof headers === 'object') {
        Object.keys(headers).forEach(function (key) {
          try {
            xhr.setRequestHeader(key, headers[key])
          } catch {
            /* ignore */
          }
        })
      }
    }

    function xhrFetch(input, init) {
      init = init || {}
      var url = resolveUrl(input)
      var method = String(init.method || (input && input.method) || 'GET').toUpperCase()
      var headers = init.headers || (input && input.headers) || null
      var body = init.body != null ? init.body : input && input.body != null ? input.body : null
      var signal = init.signal || (input && input.signal) || null

      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest()
        var settled = false
        function fail(err) {
          if (settled) return
          settled = true
          reject(err)
        }
        function ok(value) {
          if (settled) return
          settled = true
          resolve(value)
        }
        try {
          xhr.open(method, url, true)
        } catch (err) {
          fail(err)
          return
        }
        xhr.responseType = 'arraybuffer'
        applyRequestHeaders(xhr, headers)
        if (signal) {
          if (signal.aborted) {
            fail(new DOMException('The operation was aborted.', 'AbortError'))
            return
          }
          signal.addEventListener('abort', function () {
            try {
              xhr.abort()
            } catch {
              /* ignore */
            }
            fail(new DOMException('The operation was aborted.', 'AbortError'))
          })
        }
        xhr.onload = function () {
          var status = xhr.status === 0 ? 200 : xhr.status
          var response
          try {
            response = new Response(xhr.response, {
              status: status,
              statusText: xhr.statusText || '',
              headers: headersFromXhr(xhr),
            })
          } catch (err) {
            fail(err)
            return
          }
          try {
            Object.defineProperty(response, 'url', { value: url, configurable: true })
          } catch {
            /* Response.url may be non-configurable */
          }
          ok(response)
        }
        xhr.onerror = function () {
          fail(new TypeError('Failed to fetch: ' + url))
        }
        xhr.onabort = function () {
          fail(new DOMException('The operation was aborted.', 'AbortError'))
        }
        try {
          xhr.send(method === 'GET' || method === 'HEAD' ? null : body)
        } catch (err) {
          fail(err)
        }
      })
    }

    global.fetch = function (input, init) {
      var url = resolveUrl(input)
      if (!needsXhr(url) && nativeFetch) {
        return nativeFetch(input, init).catch(function () {
          return xhrFetch(input, init)
        })
      }
      return xhrFetch(input, init)
    }
  })()

  try {
    var ls = global.localStorage
    if (ls && !global.__WW_LS_WRAPPED__) {
      global.__WW_LS_WRAPPED__ = true
      var rawSet = ls.setItem.bind(ls)
      var rawRemove = ls.removeItem.bind(ls)
      var rawClear = ls.clear.bind(ls)
      ls.setItem = function (key, value) {
        rawSet(key, value)
        if (typeof key === 'string' && key.indexOf(PERSIST_PREFIX) === 0) {
          post({ type: 'SAVE_DATA', payload: { key: String(key), value: String(value) } })
        }
      }
      ls.removeItem = function (key) {
        rawRemove(key)
        if (typeof key === 'string' && key.indexOf(PERSIST_PREFIX) === 0) {
          post({ type: 'SAVE_DATA', payload: { key: String(key), value: null } })
        }
      }
      ls.clear = function () {
        rawClear()
        post({ type: 'SAVE_DATA', payload: { key: 'ww-__clear__', value: null } })
      }
    }
  } catch {
    /* ignore */
  }

  var origVibrate = global.navigator && global.navigator.vibrate
  if (global.navigator) {
    global.navigator.vibrate = function (pattern) {
      post({ type: 'HAPTIC', payload: { pattern: pattern } })
      if (typeof origVibrate === 'function') {
        try {
          return origVibrate.call(global.navigator, pattern)
        } catch {
          return false
        }
      }
      return true
    }
  }

  var nativeHidden = false
  try {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: function () {
        return nativeHidden || false
      },
    })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: function () {
        return nativeHidden ? 'hidden' : 'visible'
      },
    })
  } catch {
    /* some webviews freeze these */
  }

  function ensureNativeShellStyles() {
    if (document.getElementById('ww-native-insets')) return
    try {
      document.documentElement.classList.add('ww-native-shell')
    } catch {
      /* ignore */
    }
    var style = document.createElement('style')
    style.id = 'ww-native-insets'
    // Mobile app shell: kill the desktop 480px letterbox so the game fills device width.
    // Optimistic loader motion so the prerendered splash never looks frozen before hydration.
    style.textContent =
      'html.ww-native-shell,html.ww-native-shell body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#101d13;}' +
      'html.ww-native-shell [aria-label="Wonderweave game"]{width:100% !important;max-width:none !important;margin:0 !important;}' +
      'html.ww-native-shell .ww-app-root{' +
      'max-width:none !important;width:100% !important;margin:0 !important;margin-inline:0 !important;' +
      'box-shadow:none !important;' +
      'padding-left:max(env(safe-area-inset-left,0px),var(--ww-inset-left,0px)) !important;' +
      'padding-right:max(env(safe-area-inset-right,0px),var(--ww-inset-right,0px)) !important;' +
      '}' +
      'html.ww-native-shell .ww-app-root--play{max-width:none !important;width:100% !important;}' +
      'html.ww-native-shell .screen-header{' +
      'padding-top:max(0.75rem,var(--ww-inset-top,0px)) !important;' +
      'align-items:center !important;' +
      '}' +
      'html.ww-native-shell .screen-header-ribbon{padding:0 !important;}' +
      'html.ww-native-shell .screen-header .ribbon-wrap.ribbon-fluid{' +
      'width:auto !important;max-width:min(17.5rem,100%) !important;' +
      'padding-left:1rem !important;padding-right:1rem !important;margin-inline:auto !important;' +
      '}' +
      'html.ww-native-shell .screen-header .ribbon.ribbon-sm{' +
      'width:auto !important;min-width:0 !important;max-width:100% !important;' +
      '}' +
      'html.ww-native-shell .screen-header .ribbon::before,' +
      'html.ww-native-shell .screen-header .ribbon::after{width:18px !important;}' +
      'html.ww-native-shell .screen-header .ribbon::before{left:-14px !important;}' +
      'html.ww-native-shell .screen-header .ribbon::after{right:-14px !important;}' +
      'html.ww-native-shell .bottom-nav{padding-bottom:max(8px,var(--ww-inset-bottom,0px)) !important;}' +
      'html.ww-native-shell body.ww-modal-open{overscroll-behavior:none;}'
    // NOTE: no synthetic loader animation here. The fill width is bound to real
    // preload progress in LoadingScreen; a CSS animation would override that
    // inline width (and `forwards` would pin it), desyncing the bar from the
    // percentage. The built-in shine keeps it alive before hydration.
    ;(document.head || document.documentElement).appendChild(style)
  }

  function applyInsets(insets) {
    ensureNativeShellStyles()
    if (!insets || typeof insets !== 'object') return
    var root = document.documentElement
    var top = Math.max(0, Number(insets.top) || 0)
    var bottom = Math.max(0, Number(insets.bottom) || 0)
    var left = Math.max(0, Number(insets.left) || 0)
    var right = Math.max(0, Number(insets.right) || 0)
    root.style.setProperty('--ww-inset-top', top + 'px')
    root.style.setProperty('--ww-inset-bottom', bottom + 'px')
    root.style.setProperty('--ww-inset-left', left + 'px')
    root.style.setProperty('--ww-inset-right', right + 'px')
  }

  ensureNativeShellStyles()

  function clickFirst(selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i])
      if (el && typeof el.click === 'function') {
        el.click()
        return selectors[i]
      }
    }
    return null
  }

  function handleBack() {
    var acted = clickFirst([
      '[aria-label^="Dismiss discovery"]',
      '[aria-label="Close pause menu"]',
      '[aria-label="Close and return home"]',
      '.dialog-close-btn',
      'button[aria-label="Close"]',
      'button[aria-label="Back"]',
      'button[aria-label="Back to Atlas"]',
      'button[aria-label="Back to Home"]',
      'button[aria-label="Pause"]',
    ])
    if (acted) {
      post({ type: 'BACK_RESULT', payload: { handled: true, via: acted } })
      return
    }
    var homeCurrent = document.querySelector(
      'nav[aria-label="Main navigation"] button[aria-label="Home"][aria-current="page"]',
    )
    var splash = document.querySelector('[aria-label^="Loading Wonderweave"]')
    if (homeCurrent || splash) {
      post({ type: 'EXIT_REQUEST' })
      post({ type: 'BACK_RESULT', payload: { handled: true, via: 'exit' } })
      return
    }
    var homeNav = document.querySelector('nav[aria-label="Main navigation"] button[aria-label="Home"]')
    if (homeNav && typeof homeNav.click === 'function') {
      homeNav.click()
      post({ type: 'BACK_RESULT', payload: { handled: true, via: 'home-nav' } })
      return
    }
    post({ type: 'EXIT_REQUEST' })
    post({ type: 'BACK_RESULT', payload: { handled: false } })
  }

  function onNativeMessage(raw) {
    var data = raw
    if (typeof raw === 'string') {
      try {
        data = JSON.parse(raw)
      } catch {
        return
      }
    }
    if (!data || typeof data !== 'object' || typeof data.type !== 'string') return
    switch (data.type) {
      case 'HYDRATE':
        applyHydrate(data.payload)
        break
      case 'BACK':
        handleBack()
        break
      case 'SAFE_AREA':
        applyInsets(data.payload)
        break
      case 'LIFECYCLE':
        nativeHidden = data.payload === 'background'
        try {
          document.dispatchEvent(new Event('visibilitychange'))
        } catch {
          /* ignore */
        }
        break
      default:
        break
    }
  }

  function attachMessageListener() {
    document.addEventListener('message', function (ev) {
      onNativeMessage(ev.data)
    })
    global.addEventListener('message', function (ev) {
      onNativeMessage(ev.data)
    })
  }
  attachMessageListener()
  global.__WW_ON_NATIVE_MESSAGE__ = onNativeMessage

  function lockGestures() {
    document.addEventListener(
      'gesturestart',
      function (e) {
        e.preventDefault()
      },
      { passive: false },
    )
    document.addEventListener(
      'dblclick',
      function (e) {
        e.preventDefault()
      },
      { passive: false },
    )
    var lastTouch = 0
    document.addEventListener(
      'touchend',
      function (e) {
        var now = Date.now()
        if (now - lastTouch <= 300) e.preventDefault()
        lastTouch = now
      },
      { passive: false },
    )
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', lockGestures)
  } else {
    lockGestures()
  }

  global.addEventListener('error', function (ev) {
    post({
      type: 'ERROR',
      payload: { message: String((ev && ev.message) || 'error'), source: 'window.error' },
    })
  })
  global.addEventListener('unhandledrejection', function (ev) {
    post({
      type: 'ERROR',
      payload: { message: String((ev && ev.reason) || 'rejection'), source: 'unhandledrejection' },
    })
  })

  function announceReady() {
    var root = document.querySelector('[aria-label="Wonderweave game"]')
    var splash = document.querySelector('[aria-label^="Loading Wonderweave"]')
    post({
      type: 'READY',
      payload: { hasRoot: !!root, splash: !!splash, href: String(location.href || '') },
    })
  }
  if (document.readyState === 'complete') announceReady()
  else global.addEventListener('load', announceReady)

  global.__WW_COMPAT__ = {
    post: post,
    handleBack: handleBack,
    applyHydrate: applyHydrate,
    applyInsets: applyInsets,
  }
})(typeof window !== 'undefined' ? window : globalThis)
