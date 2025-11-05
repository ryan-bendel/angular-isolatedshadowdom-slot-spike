/**
 * @license Angular v0.0.0
 * (c) 2010-2025 Google LLC. https://angular.dev/
 * License: MIT
 */

import { DOCUMENT, ɵgetDOM as _getDOM } from '@angular/common';
import * as i0 from '@angular/core';
import { Injectable, Inject, InjectionToken, ɵRuntimeError as _RuntimeError, APP_ID, CSP_NONCE, PLATFORM_ID, Optional, ɵgetLContext as _getLContext, ɵunwrapRNode as _unwrapRNode, ɵHOST as _HOST, ɵPARENT as _PARENT, ViewEncapsulation, ɵTracingService as _TracingService, RendererStyleFlags2, ɵallLeavingAnimations as _allLeavingAnimations } from '@angular/core';

class EventManagerPlugin {
  _doc;
  constructor(_doc) {
    this._doc = _doc;
  }
  manager;
}

class DomEventsPlugin extends EventManagerPlugin {
  constructor(doc) {
    super(doc);
  }
  supports(eventName) {
    return true;
  }
  addEventListener(element, eventName, handler, options) {
    element.addEventListener(eventName, handler, options);
    return () => this.removeEventListener(element, eventName, handler, options);
  }
  removeEventListener(target, eventName, callback, options) {
    return target.removeEventListener(eventName, callback, options);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: DomEventsPlugin,
    deps: [{
      token: DOCUMENT
    }],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: DomEventsPlugin
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "0.0.0",
  ngImport: i0,
  type: DomEventsPlugin,
  decorators: [{
    type: Injectable
  }],
  ctorParameters: () => [{
    type: undefined,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }]
});

const EVENT_MANAGER_PLUGINS = new InjectionToken(typeof ngDevMode !== undefined && ngDevMode ? 'EventManagerPlugins' : '');
class EventManager {
  _zone;
  _plugins;
  _eventNameToPlugin = new Map();
  constructor(plugins, _zone) {
    this._zone = _zone;
    plugins.forEach(plugin => {
      plugin.manager = this;
    });
    const otherPlugins = plugins.filter(p => !(p instanceof DomEventsPlugin));
    this._plugins = otherPlugins.slice().reverse();
    const domEventPlugin = plugins.find(p => p instanceof DomEventsPlugin);
    if (domEventPlugin) {
      this._plugins.push(domEventPlugin);
    }
  }
  addEventListener(element, eventName, handler, options) {
    const plugin = this._findPluginFor(eventName);
    return plugin.addEventListener(element, eventName, handler, options);
  }
  getZone() {
    return this._zone;
  }
  _findPluginFor(eventName) {
    let plugin = this._eventNameToPlugin.get(eventName);
    if (plugin) {
      return plugin;
    }
    const plugins = this._plugins;
    plugin = plugins.find(plugin => plugin.supports(eventName));
    if (!plugin) {
      throw new _RuntimeError(5101, (typeof ngDevMode === 'undefined' || ngDevMode) && `No event manager plugin found for event ${eventName}`);
    }
    this._eventNameToPlugin.set(eventName, plugin);
    return plugin;
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: EventManager,
    deps: [{
      token: EVENT_MANAGER_PLUGINS
    }, {
      token: i0.NgZone
    }],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: EventManager
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "0.0.0",
  ngImport: i0,
  type: EventManager,
  decorators: [{
    type: Injectable
  }],
  ctorParameters: () => [{
    type: undefined,
    decorators: [{
      type: Inject,
      args: [EVENT_MANAGER_PLUGINS]
    }]
  }, {
    type: i0.NgZone
  }]
});

const APP_ID_ATTRIBUTE_NAME = 'ng-app-id';
function removeElements(elements) {
  for (const element of elements) {
    element.remove();
  }
}
function createStyleElement(style, doc) {
  const styleElement = doc.createElement('style');
  styleElement.textContent = style;
  return styleElement;
}
function addServerStyles(doc, appId, inline, external) {
  const elements = doc.head?.querySelectorAll(`style[${APP_ID_ATTRIBUTE_NAME}="${appId}"],link[${APP_ID_ATTRIBUTE_NAME}="${appId}"]`);
  if (elements) {
    for (const styleElement of elements) {
      styleElement.removeAttribute(APP_ID_ATTRIBUTE_NAME);
      if (styleElement instanceof HTMLLinkElement) {
        external.set(styleElement.href.slice(styleElement.href.lastIndexOf('/') + 1), {
          usage: 0,
          elements: [styleElement]
        });
      } else if (styleElement.textContent) {
        inline.set(styleElement.textContent, {
          usage: 0,
          elements: [styleElement]
        });
      }
    }
  }
}
function createLinkElement(url, doc) {
  const linkElement = doc.createElement('link');
  linkElement.setAttribute('rel', 'stylesheet');
  linkElement.setAttribute('href', url);
  return linkElement;
}
class SharedStylesHost {
  doc;
  appId;
  nonce;
  inline = new Map();
  external = new Map();
  standardShadowHosts = new Set();
  isolatedShadowRoots = [];
  constructor(doc, appId, nonce, platformId = {}) {
    this.doc = doc;
    this.appId = appId;
    this.nonce = nonce;
    const inlineMap = new Map();
    const externalMap = new Map();
    this.inline.set(doc.head, inlineMap);
    this.external.set(doc.head, externalMap);
    addServerStyles(doc, appId, inlineMap, externalMap);
    this.standardShadowHosts.add(doc.head);
  }
  addStyles(styles, urls, shadowRoot) {
    for (const style of styles) {
      this.addUsage(style, this.inline, createStyleElement, shadowRoot);
    }
    urls?.forEach(url => this.addUsage(url, this.external, createLinkElement, shadowRoot));
  }
  removeStyles(styles, urls, shadowRoot) {
    for (const value of styles) {
      this.removeUsage(value, this.inline, shadowRoot);
    }
    urls?.forEach(value => this.removeUsage(value, this.external, shadowRoot));
  }
  addUsage(value, usagesMap, creator, targetShadowRoot) {
    if (targetShadowRoot) {
      this.addUsageToTarget(value, usagesMap, creator, targetShadowRoot);
    } else {
      this.addUsageToTarget(value, usagesMap, creator, this.doc.head, true);
    }
  }
  addUsageToTarget(value, usagesMap, creator, styleRoot, shouldAddToHosts = false) {
    let usages = usagesMap.get(styleRoot);
    if (!usages) {
      usages = new Map();
      usagesMap.set(styleRoot, usages);
    }
    const record = usages.get(value);
    if (record) {
      if ((typeof ngDevMode === 'undefined' || ngDevMode) && record.usage === 0) {
        record.elements.forEach(element => element.setAttribute('ng-style-reused', ''));
      }
      record.usage++;
      return;
    }
    const elements = [];
    if (shouldAddToHosts && styleRoot === this.doc.head && this.standardShadowHosts.size > 0) {
      for (const host of this.standardShadowHosts) {
        elements.push(this.addElement(host, creator(value, this.doc)));
      }
    } else {
      elements.push(this.addElement(styleRoot, creator(value, this.doc)));
    }
    usages.set(value, {
      usage: 1,
      elements
    });
  }
  removeUsage(value, usagesMap, targetShadowRoot) {
    if (targetShadowRoot) {
      this.removeUsageFromTarget(value, usagesMap, targetShadowRoot);
    } else {
      this.removeUsageFromTarget(value, usagesMap, this.doc.head);
    }
  }
  removeUsageFromTarget(value, usagesMap, styleRoot) {
    const usages = usagesMap.get(styleRoot);
    if (!usages) return;
    const record = usages.get(value);
    if (record) {
      record.usage--;
      if (record.usage <= 0) {
        removeElements(record.elements);
        usages.delete(value);
      }
    }
  }
  ngOnDestroy() {
    for (const usages of [...this.inline.values(), ...this.external.values()]) {
      for (const [, {
        elements
      }] of usages) {
        removeElements(elements);
      }
    }
    this.standardShadowHosts.clear();
  }
  addHost(hostNode) {
    this.standardShadowHosts.add(hostNode);
    const headInline = this.inline.get(this.doc.head);
    const headExternal = this.external.get(this.doc.head);
    if (headInline) {
      for (const [style, {
        elements
      }] of headInline) {
        elements.push(this.addElement(hostNode, createStyleElement(style, this.doc)));
      }
    }
    if (headExternal) {
      for (const [url, {
        elements
      }] of headExternal) {
        elements.push(this.addElement(hostNode, createLinkElement(url, this.doc)));
      }
    }
  }
  removeHost(hostNode) {
    this.standardShadowHosts.delete(hostNode);
    const hostKey = hostNode;
    const inlineUsages = this.inline.get(hostKey);
    const externalUsages = this.external.get(hostKey);
    if (inlineUsages) {
      for (const {
        elements
      } of inlineUsages.values()) {
        removeElements(elements);
      }
      this.inline.delete(hostKey);
    }
    if (externalUsages) {
      for (const {
        elements
      } of externalUsages.values()) {
        removeElements(elements);
      }
      this.external.delete(hostKey);
    }
  }
  addElement(host, element) {
    if (this.nonce) {
      element.setAttribute('nonce', this.nonce);
    }
    if (typeof ngServerMode !== 'undefined' && ngServerMode) {
      element.setAttribute(APP_ID_ATTRIBUTE_NAME, this.appId);
    }
    host.appendChild(element);
    return element;
  }
  addShadowRoot(shadowRoot) {
    if (typeof ngServerMode !== 'undefined' && ngServerMode) {
      throw new Error('IsolatedShadowRoot is not supported in SSR mode until declarative shadow DOM is supported.');
    }
    if (typeof ShadowRoot === 'undefined') {
      throw new Error('ShadowRoot is not supported in this environment.');
    }
    if (typeof ngDevMode !== 'undefined' && ngDevMode && this.isolatedShadowRoots.includes(shadowRoot)) {
      throw new Error('Shadow root is already registered.');
    }
    this.isolatedShadowRoots.push(shadowRoot);
  }
  removeShadowRoot(shadowRoot) {
    const index = this.isolatedShadowRoots.indexOf(shadowRoot);
    if (typeof ngDevMode !== 'undefined' && ngDevMode && ngDevMode && index === -1) {
      throw new Error('Attempted to remove shadow root that was not previously added.');
    }
    this.isolatedShadowRoots.splice(index, 1);
    const inlineUsages = this.inline.get(shadowRoot);
    const externalUsages = this.external.get(shadowRoot);
    if (inlineUsages) {
      for (const {
        elements
      } of inlineUsages.values()) {
        removeElements(elements);
      }
      this.inline.delete(shadowRoot);
    }
    if (externalUsages) {
      for (const {
        elements
      } of externalUsages.values()) {
        removeElements(elements);
      }
      this.external.delete(shadowRoot);
    }
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: SharedStylesHost,
    deps: [{
      token: DOCUMENT
    }, {
      token: APP_ID
    }, {
      token: CSP_NONCE,
      optional: true
    }, {
      token: PLATFORM_ID
    }],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: SharedStylesHost
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "0.0.0",
  ngImport: i0,
  type: SharedStylesHost,
  decorators: [{
    type: Injectable
  }],
  ctorParameters: () => [{
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: undefined,
    decorators: [{
      type: Inject,
      args: [APP_ID]
    }]
  }, {
    type: undefined,
    decorators: [{
      type: Inject,
      args: [CSP_NONCE]
    }, {
      type: Optional
    }]
  }, {
    type: undefined,
    decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }]
  }]
});

class IsolatedStyleScopeService {
  isolatedShadowRoots = new Map();
  standardShadowRoots = new Map();
  registerIsolatedShadowRoot(shadowRoot) {
    this.isolatedShadowRoots.set(shadowRoot, shadowRoot.host);
  }
  registerStandardShadowRoot(shadowRoot) {
    this.standardShadowRoots.set(shadowRoot, shadowRoot.host);
  }
  deregisterIsolatedShadowRoot(shadowRoot) {
    this.isolatedShadowRoots.delete(shadowRoot);
  }
  deregisterStandardShadowRoot(shadowRoot) {
    this.standardShadowRoots.delete(shadowRoot);
  }
  determineStyleTargets(element) {
    if (typeof ShadowRoot === 'undefined') {
      return [];
    }
    const elementRoot = element.getRootNode();
    if (elementRoot instanceof ShadowRoot && this.isRegisteredShadowRoot(elementRoot)) {
      return this.getShadowRootsForContext(elementRoot);
    }
    try {
      const result = this.findShadowRootViaLView(element);
      if (result) {
        return result;
      }
    } catch (e) {}
    return [];
  }
  findShadowRootViaLView(element) {
    const context = _getLContext(element);
    if (!context || !context.lView) {
      return null;
    }
    let lView = context.lView;
    const visited = new Set();
    while (lView && !visited.has(lView)) {
      visited.add(lView);
      const hostRNode = lView[_HOST];
      if (hostRNode) {
        const hostElement = _unwrapRNode(hostRNode);
        if (hostElement instanceof Element) {
          const shadowRoots = this.checkIfShadowRootHost(hostElement);
          if (shadowRoots) {
            return shadowRoots;
          }
        }
      }
      const parentLView = lView[_PARENT];
      if (parentLView && Array.isArray(parentLView) && parentLView[_HOST] !== undefined) {
        lView = parentLView;
      } else {
        break;
      }
    }
    return null;
  }
  checkIfShadowRootHost(element) {
    for (const [shadowRoot, host] of [...this.isolatedShadowRoots, ...this.standardShadowRoots]) {
      if (host === element) {
        return this.getShadowRootsForContext(shadowRoot);
      }
    }
    return null;
  }
  getShadowRootsForContext(shadowRoot) {
    if (this.isIsolatedShadowRoot(shadowRoot)) {
      return [shadowRoot];
    } else {
      return Array.from(this.standardShadowRoots.keys());
    }
  }
  isRegisteredShadowRoot(shadowRoot) {
    return this.isolatedShadowRoots.has(shadowRoot) || this.standardShadowRoots.has(shadowRoot);
  }
  isIsolatedShadowRoot(shadowRoot) {
    return this.isolatedShadowRoots.has(shadowRoot);
  }
  isStandardShadowRoot(shadowRoot) {
    return this.standardShadowRoots.has(shadowRoot);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: IsolatedStyleScopeService,
    deps: [],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: IsolatedStyleScopeService,
    providedIn: 'root'
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "0.0.0",
  ngImport: i0,
  type: IsolatedStyleScopeService,
  decorators: [{
    type: Injectable,
    args: [{
      providedIn: 'root'
    }]
  }]
});

const NAMESPACE_URIS = {
  'svg': 'http://www.w3.org/2000/svg',
  'xhtml': 'http://www.w3.org/1999/xhtml',
  'xlink': 'http://www.w3.org/1999/xlink',
  'xml': 'http://www.w3.org/XML/1998/namespace',
  'xmlns': 'http://www.w3.org/2000/xmlns/',
  'math': 'http://www.w3.org/1998/Math/MathML'
};
const COMPONENT_REGEX = /%COMP%/g;
const SOURCEMAP_URL_REGEXP = /\/\*#\s*sourceMappingURL=(.+?)\s*\*\//;
const PROTOCOL_REGEXP = /^https?:/;
const COMPONENT_VARIABLE = '%COMP%';
const HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
const CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;
const REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT = true;
const REMOVE_STYLES_ON_COMPONENT_DESTROY = new InjectionToken(ngDevMode ? 'RemoveStylesOnCompDestroy' : '', {
  providedIn: 'root',
  factory: () => REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT
});
function shimContentAttribute(componentShortId) {
  return CONTENT_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimHostAttribute(componentShortId) {
  return HOST_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimStylesContent(compId, styles) {
  return styles.map(s => s.replace(COMPONENT_REGEX, compId));
}
function addBaseHrefToCssSourceMap(baseHref, styles) {
  if (!baseHref) {
    return styles;
  }
  const absoluteBaseHrefUrl = new URL(baseHref, 'http://localhost');
  return styles.map(cssContent => {
    if (!cssContent.includes('sourceMappingURL=')) {
      return cssContent;
    }
    return cssContent.replace(SOURCEMAP_URL_REGEXP, (_, sourceMapUrl) => {
      if (sourceMapUrl[0] === '/' || sourceMapUrl.startsWith('data:') || PROTOCOL_REGEXP.test(sourceMapUrl)) {
        return `/*# sourceMappingURL=${sourceMapUrl} */`;
      }
      const {
        pathname: resolvedSourceMapUrl
      } = new URL(sourceMapUrl, absoluteBaseHrefUrl);
      return `/*# sourceMappingURL=${resolvedSourceMapUrl} */`;
    });
  });
}
class DomRendererFactory2 {
  eventManager;
  sharedStylesHost;
  appId;
  removeStylesOnCompDestroy;
  doc;
  platformId;
  ngZone;
  nonce;
  tracingService;
  styleScopeService;
  rendererByCompId = new Map();
  defaultRenderer;
  platformIsServer;
  constructor(eventManager, sharedStylesHost, appId, removeStylesOnCompDestroy, doc, platformId, ngZone, nonce = null, tracingService = null, styleScopeService) {
    this.eventManager = eventManager;
    this.sharedStylesHost = sharedStylesHost;
    this.appId = appId;
    this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
    this.doc = doc;
    this.platformId = platformId;
    this.ngZone = ngZone;
    this.nonce = nonce;
    this.tracingService = tracingService;
    this.styleScopeService = styleScopeService;
    this.platformIsServer = typeof ngServerMode !== 'undefined' && ngServerMode;
    this.defaultRenderer = new DefaultDomRenderer2(eventManager, doc, ngZone, this.platformIsServer, this.tracingService);
  }
  createRenderer(element, type) {
    if (!element || !type) {
      return this.defaultRenderer;
    }
    if (typeof ngServerMode !== 'undefined' && ngServerMode && (type.encapsulation === ViewEncapsulation.ShadowDom || type.encapsulation === ViewEncapsulation.IsolatedShadowDom)) {
      type = {
        ...type,
        encapsulation: ViewEncapsulation.Emulated
      };
    }
    const renderer = this.getOrCreateRenderer(element, type);
    if (renderer instanceof EmulatedEncapsulationDomRenderer2) {
      renderer.applyToHost(element);
    } else if (renderer instanceof NoneEncapsulationDomRenderer) {
      renderer.applyStyles(element);
    }
    return renderer;
  }
  getOrCreateRenderer(element, type) {
    const rendererByCompId = this.rendererByCompId;
    let renderer = rendererByCompId.get(type.id);
    if (!renderer) {
      const doc = this.doc;
      const ngZone = this.ngZone;
      const eventManager = this.eventManager;
      const sharedStylesHost = this.sharedStylesHost;
      const removeStylesOnCompDestroy = this.removeStylesOnCompDestroy;
      const platformIsServer = this.platformIsServer;
      const tracingService = this.tracingService;
      switch (type.encapsulation) {
        case ViewEncapsulation.Emulated:
          renderer = new EmulatedEncapsulationDomRenderer2(eventManager, sharedStylesHost, type, this.appId, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, this.styleScopeService);
          break;
        case ViewEncapsulation.ShadowDom:
        case ViewEncapsulation.IsolatedShadowDom:
          return new ShadowDomRenderer(eventManager, element, type, doc, ngZone, this.nonce, platformIsServer, tracingService, sharedStylesHost, this.styleScopeService);
        default:
          renderer = new NoneEncapsulationDomRenderer(eventManager, sharedStylesHost, type, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, this.styleScopeService, undefined);
          break;
      }
      rendererByCompId.set(type.id, renderer);
    }
    return renderer;
  }
  ngOnDestroy() {
    this.rendererByCompId.clear();
  }
  componentReplaced(componentId) {
    this.rendererByCompId.delete(componentId);
  }
  static ɵfac = i0.ɵɵngDeclareFactory({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: DomRendererFactory2,
    deps: [{
      token: EventManager
    }, {
      token: SharedStylesHost
    }, {
      token: APP_ID
    }, {
      token: REMOVE_STYLES_ON_COMPONENT_DESTROY
    }, {
      token: DOCUMENT
    }, {
      token: PLATFORM_ID
    }, {
      token: i0.NgZone
    }, {
      token: CSP_NONCE
    }, {
      token: _TracingService,
      optional: true
    }, {
      token: IsolatedStyleScopeService
    }],
    target: i0.ɵɵFactoryTarget.Injectable
  });
  static ɵprov = i0.ɵɵngDeclareInjectable({
    minVersion: "12.0.0",
    version: "0.0.0",
    ngImport: i0,
    type: DomRendererFactory2
  });
}
i0.ɵɵngDeclareClassMetadata({
  minVersion: "12.0.0",
  version: "0.0.0",
  ngImport: i0,
  type: DomRendererFactory2,
  decorators: [{
    type: Injectable
  }],
  ctorParameters: () => [{
    type: EventManager
  }, {
    type: SharedStylesHost
  }, {
    type: undefined,
    decorators: [{
      type: Inject,
      args: [APP_ID]
    }]
  }, {
    type: undefined,
    decorators: [{
      type: Inject,
      args: [REMOVE_STYLES_ON_COMPONENT_DESTROY]
    }]
  }, {
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: Object,
    decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }]
  }, {
    type: i0.NgZone
  }, {
    type: undefined,
    decorators: [{
      type: Inject,
      args: [CSP_NONCE]
    }]
  }, {
    type: i0.ɵTracingService,
    decorators: [{
      type: Inject,
      args: [_TracingService]
    }, {
      type: Optional
    }]
  }, {
    type: IsolatedStyleScopeService
  }]
});
class DefaultDomRenderer2 {
  eventManager;
  doc;
  ngZone;
  platformIsServer;
  tracingService;
  data = Object.create(null);
  throwOnSyntheticProps = true;
  constructor(eventManager, doc, ngZone, platformIsServer, tracingService) {
    this.eventManager = eventManager;
    this.doc = doc;
    this.ngZone = ngZone;
    this.platformIsServer = platformIsServer;
    this.tracingService = tracingService;
  }
  destroy() {}
  destroyNode = null;
  createElement(name, namespace) {
    if (namespace) {
      return this.doc.createElementNS(NAMESPACE_URIS[namespace] || namespace, name);
    }
    return this.doc.createElement(name);
  }
  createComment(value) {
    return this.doc.createComment(value);
  }
  createText(value) {
    return this.doc.createTextNode(value);
  }
  appendChild(parent, newChild) {
    const targetParent = isTemplateNode(parent) ? parent.content : parent;
    targetParent.appendChild(newChild);
  }
  insertBefore(parent, newChild, refChild) {
    if (parent) {
      const targetParent = isTemplateNode(parent) ? parent.content : parent;
      targetParent.insertBefore(newChild, refChild);
    }
  }
  removeChild(_parent, oldChild) {
    oldChild.remove();
  }
  selectRootElement(selectorOrNode, preserveContent) {
    let el = typeof selectorOrNode === 'string' ? this.doc.querySelector(selectorOrNode) : selectorOrNode;
    if (!el) {
      throw new _RuntimeError(-5104, (typeof ngDevMode === 'undefined' || ngDevMode) && `The selector "${selectorOrNode}" did not match any elements`);
    }
    if (!preserveContent) {
      el.textContent = '';
    }
    return el;
  }
  parentNode(node) {
    return node.parentNode;
  }
  nextSibling(node) {
    return node.nextSibling;
  }
  setAttribute(el, name, value, namespace) {
    if (namespace) {
      name = namespace + ':' + name;
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.setAttributeNS(namespaceUri, name, value);
      } else {
        el.setAttribute(name, value);
      }
    } else {
      el.setAttribute(name, value);
    }
  }
  removeAttribute(el, name, namespace) {
    if (namespace) {
      const namespaceUri = NAMESPACE_URIS[namespace];
      if (namespaceUri) {
        el.removeAttributeNS(namespaceUri, name);
      } else {
        el.removeAttribute(`${namespace}:${name}`);
      }
    } else {
      el.removeAttribute(name);
    }
  }
  addClass(el, name) {
    el.classList.add(name);
  }
  removeClass(el, name) {
    el.classList.remove(name);
  }
  setStyle(el, style, value, flags) {
    if (flags & (RendererStyleFlags2.DashCase | RendererStyleFlags2.Important)) {
      el.style.setProperty(style, value, flags & RendererStyleFlags2.Important ? 'important' : '');
    } else {
      el.style[style] = value;
    }
  }
  removeStyle(el, style, flags) {
    if (flags & RendererStyleFlags2.DashCase) {
      el.style.removeProperty(style);
    } else {
      el.style[style] = '';
    }
  }
  setProperty(el, name, value) {
    if (el == null) {
      return;
    }
    (typeof ngDevMode === 'undefined' || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(name, 'property');
    el[name] = value;
  }
  setValue(node, value) {
    node.nodeValue = value;
  }
  listen(target, event, callback, options) {
    (typeof ngDevMode === 'undefined' || ngDevMode) && this.throwOnSyntheticProps && checkNoSyntheticProp(event, 'listener');
    if (typeof target === 'string') {
      target = _getDOM().getGlobalEventTarget(this.doc, target);
      if (!target) {
        throw new _RuntimeError(5102, (typeof ngDevMode === 'undefined' || ngDevMode) && `Unsupported event target ${target} for event ${event}`);
      }
    }
    let wrappedCallback = this.decoratePreventDefault(callback);
    if (this.tracingService?.wrapEventListener) {
      wrappedCallback = this.tracingService.wrapEventListener(target, event, wrappedCallback);
    }
    return this.eventManager.addEventListener(target, event, wrappedCallback, options);
  }
  decoratePreventDefault(eventHandler) {
    return event => {
      if (event === '__ngUnwrap__') {
        return eventHandler;
      }
      const allowDefaultBehavior = typeof ngServerMode !== 'undefined' && ngServerMode ? this.ngZone.runGuarded(() => eventHandler(event)) : eventHandler(event);
      if (allowDefaultBehavior === false) {
        event.preventDefault();
      }
      return undefined;
    };
  }
}
const AT_CHARCODE = (() => '@'.charCodeAt(0))();
function checkNoSyntheticProp(name, nameKind) {
  if (name.charCodeAt(0) === AT_CHARCODE) {
    throw new _RuntimeError(5105, `Unexpected synthetic ${nameKind} ${name} found. Please make sure that:
  - Make sure \`provideAnimationsAsync()\`, \`provideAnimations()\` or \`provideNoopAnimations()\` call was added to a list of providers used to bootstrap an application.
  - There is a corresponding animation configuration named \`${name}\` defined in the \`animations\` field of the \`@Component\` decorator (see https://angular.dev/api/core/Component#animations).`);
  }
}
function isTemplateNode(node) {
  return node.tagName === 'TEMPLATE' && node.content !== undefined;
}
class ShadowDomRenderer extends DefaultDomRenderer2 {
  hostEl;
  component;
  sharedStylesHost;
  styleScopeService;
  shadowRoot;
  constructor(eventManager, hostEl, component, doc, ngZone, nonce, platformIsServer, tracingService, sharedStylesHost, styleScopeService) {
    super(eventManager, doc, ngZone, platformIsServer, tracingService);
    this.hostEl = hostEl;
    this.component = component;
    this.sharedStylesHost = sharedStylesHost;
    this.styleScopeService = styleScopeService;
    if (!platformIsServer) {
      this.shadowRoot = hostEl.attachShadow({
        mode: 'open'
      });
    } else {
      throw new Error('IsolatedShadowRoot is not supported in SSR mode until declarative shadow DOM is supported.');
    }
    const isIsolated = component.encapsulation === ViewEncapsulation.IsolatedShadowDom;
    if (this.styleScopeService) {
      if (isIsolated) {
        this.styleScopeService.registerIsolatedShadowRoot(this.shadowRoot);
        this.sharedStylesHost.addShadowRoot(this.shadowRoot);
      } else {
        this.styleScopeService.registerStandardShadowRoot(this.shadowRoot);
        this.sharedStylesHost.addHost(this.shadowRoot);
      }
    }
    let styles = component.styles;
    if (ngDevMode) {
      const baseHref = _getDOM().getBaseHref(doc) ?? '';
      styles = addBaseHrefToCssSourceMap(baseHref, styles);
    }
    if (isIsolated && !platformIsServer) {
      this.sharedStylesHost.addStyles(styles, component.getExternalStyles?.(), this.shadowRoot);
    } else {
      styles = shimStylesContent(component.id, styles);
      for (const style of styles) {
        const styleEl = doc.createElement('style');
        if (nonce) {
          styleEl.setAttribute('nonce', nonce);
        }
        styleEl.textContent = style;
        this.shadowRoot.appendChild(styleEl);
      }
      const styleUrls = component.getExternalStyles?.();
      if (styleUrls) {
        for (const styleUrl of styleUrls) {
          const linkEl = createLinkElement(styleUrl, doc);
          if (nonce) {
            linkEl.setAttribute('nonce', nonce);
          }
          this.shadowRoot.appendChild(linkEl);
        }
      }
    }
  }
  nodeOrShadowRoot(node) {
    return node === this.hostEl ? this.shadowRoot : node;
  }
  appendChild(parent, newChild) {
    return super.appendChild(this.nodeOrShadowRoot(parent), newChild);
  }
  insertBefore(parent, newChild, refChild) {
    return super.insertBefore(this.nodeOrShadowRoot(parent), newChild, refChild);
  }
  removeChild(_parent, oldChild) {
    return super.removeChild(null, oldChild);
  }
  parentNode(node) {
    return this.nodeOrShadowRoot(super.parentNode(this.nodeOrShadowRoot(node)));
  }
  destroy() {
    if (!this.platformIsServer) {
      if (this.styleScopeService.isIsolatedShadowRoot(this.shadowRoot)) {
        this.styleScopeService.deregisterIsolatedShadowRoot(this.shadowRoot);
        this.sharedStylesHost.removeShadowRoot(this.shadowRoot);
      } else if (this.styleScopeService.isStandardShadowRoot(this.shadowRoot)) {
        this.styleScopeService.deregisterStandardShadowRoot(this.shadowRoot);
        this.sharedStylesHost.removeHost(this.shadowRoot);
      }
    }
  }
}
class NoneEncapsulationDomRenderer extends DefaultDomRenderer2 {
  sharedStylesHost;
  removeStylesOnCompDestroy;
  styleScopeService;
  styles;
  styleUrls;
  constructor(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, styleScopeService, compId) {
    super(eventManager, doc, ngZone, platformIsServer, tracingService);
    this.sharedStylesHost = sharedStylesHost;
    this.removeStylesOnCompDestroy = removeStylesOnCompDestroy;
    this.styleScopeService = styleScopeService;
    let styles = component.styles;
    if (ngDevMode) {
      const baseHref = _getDOM().getBaseHref(doc) ?? '';
      styles = addBaseHrefToCssSourceMap(baseHref, styles);
    }
    this.styles = compId ? shimStylesContent(compId, styles) : styles;
    this.styleUrls = component.getExternalStyles?.(compId);
  }
  applyStyles(element) {
    if (element && !this.platformIsServer) {
      const targetShadowRoots = this.styleScopeService.determineStyleTargets(element);
      if (targetShadowRoots.length > 0) {
        for (const shadowRoot of targetShadowRoots) {
          this.sharedStylesHost.addStyles(this.styles, this.styleUrls, shadowRoot);
        }
        return;
      }
    }
    this.sharedStylesHost.addStyles(this.styles, this.styleUrls);
  }
  destroy() {
    if (!this.removeStylesOnCompDestroy) {
      return;
    }
    if (_allLeavingAnimations.size === 0) {
      this.sharedStylesHost.removeStyles(this.styles, this.styleUrls);
    }
  }
}
class EmulatedEncapsulationDomRenderer2 extends NoneEncapsulationDomRenderer {
  contentAttr;
  hostAttr;
  constructor(eventManager, sharedStylesHost, component, appId, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, styleScopeService) {
    const compId = appId + '-' + component.id;
    super(eventManager, sharedStylesHost, component, removeStylesOnCompDestroy, doc, ngZone, platformIsServer, tracingService, styleScopeService, compId);
    this.contentAttr = shimContentAttribute(compId);
    this.hostAttr = shimHostAttribute(compId);
  }
  applyToHost(element) {
    this.applyStyles(element);
    this.setAttribute(element, this.hostAttr, '');
  }
  createElement(parent, name) {
    const el = super.createElement(parent, name);
    super.setAttribute(el, this.contentAttr, '');
    return el;
  }
}

export { DomEventsPlugin, DomRendererFactory2, EVENT_MANAGER_PLUGINS, EventManager, EventManagerPlugin, IsolatedStyleScopeService, REMOVE_STYLES_ON_COMPONENT_DESTROY, SharedStylesHost };
//# sourceMappingURL=_dom_renderer-chunk.mjs.map
