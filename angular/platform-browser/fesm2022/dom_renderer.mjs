/**
 * @license Angular v0.0.0
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { DOCUMENT, ɵgetDOM as _getDOM } from '@angular/common';
import * as i0 from '@angular/core';
import { InjectionToken, ɵRuntimeError as _RuntimeError, Injectable, Inject, APP_ID, CSP_NONCE, PLATFORM_ID, Optional, ɵgetLContext as _getLContext, ɵunwrapRNode as _unwrapRNode, ɵHOST as _HOST, ɵPARENT as _PARENT, ViewEncapsulation, ɵTracingService as _TracingService, RendererStyleFlags2, ɵallLeavingAnimations as _allLeavingAnimations } from '@angular/core';

/**
 * The injection token for plugins of the `EventManager` service.
 *
 * @publicApi
 */
const EVENT_MANAGER_PLUGINS = new InjectionToken(ngDevMode ? 'EventManagerPlugins' : '');
/**
 * An injectable service that provides event management for Angular
 * through a browser plug-in.
 *
 * @publicApi
 */
class EventManager {
    _zone;
    _plugins;
    _eventNameToPlugin = new Map();
    /**
     * Initializes an instance of the event-manager service.
     */
    constructor(plugins, _zone) {
        this._zone = _zone;
        plugins.forEach((plugin) => {
            plugin.manager = this;
        });
        this._plugins = plugins.slice().reverse();
    }
    /**
     * Registers a handler for a specific element and event.
     *
     * @param element The HTML element to receive event notifications.
     * @param eventName The name of the event to listen for.
     * @param handler A function to call when the notification occurs. Receives the
     * event object as an argument.
     * @param options Options that configure how the event listener is bound.
     * @returns  A callback function that can be used to remove the handler.
     */
    addEventListener(element, eventName, handler, options) {
        const plugin = this._findPluginFor(eventName);
        return plugin.addEventListener(element, eventName, handler, options);
    }
    /**
     * Retrieves the compilation zone in which event listeners are registered.
     */
    getZone() {
        return this._zone;
    }
    /** @internal */
    _findPluginFor(eventName) {
        let plugin = this._eventNameToPlugin.get(eventName);
        if (plugin) {
            return plugin;
        }
        const plugins = this._plugins;
        plugin = plugins.find((plugin) => plugin.supports(eventName));
        if (!plugin) {
            throw new _RuntimeError(5101 /* RuntimeErrorCode.NO_PLUGIN_FOR_EVENT */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
                `No event manager plugin found for event ${eventName}`);
        }
        this._eventNameToPlugin.set(eventName, plugin);
        return plugin;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: EventManager, deps: [{ token: EVENT_MANAGER_PLUGINS }, { token: i0.NgZone }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: EventManager });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: EventManager, decorators: [{
            type: Injectable
        }], ctorParameters: () => [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [EVENT_MANAGER_PLUGINS]
                }] }, { type: i0.NgZone }] });
/**
 * The plugin definition for the `EventManager` class
 *
 * It can be used as a base class to create custom manager plugins, i.e. you can create your own
 * class that extends the `EventManagerPlugin` one.
 *
 * @publicApi
 */
class EventManagerPlugin {
    _doc;
    // TODO: remove (has some usage in G3)
    constructor(_doc) {
        this._doc = _doc;
    }
    // Using non-null assertion because it's set by EventManager's constructor
    manager;
}

/** The style elements attribute name used to set value of `APP_ID` token. */
const APP_ID_ATTRIBUTE_NAME = 'ng-app-id';
/**
 * Removes all provided elements from the document.
 * @param elements An array of HTML Elements.
 */
function removeElements(elements) {
    for (const element of elements) {
        element.remove();
    }
}
/**
 * Creates a `style` element with the provided inline style content.
 * @param style A string of the inline style content.
 * @param doc A DOM Document to use to create the element.
 * @returns An HTMLStyleElement instance.
 */
function createStyleElement(style, doc) {
    const styleElement = doc.createElement('style');
    styleElement.textContent = style;
    return styleElement;
}
/**
 * Searches a DOM document's head element for style elements with a matching application
 * identifier attribute (`ng-app-id`) to the provide identifier and adds usage records for each.
 * @param doc An HTML DOM document instance.
 * @param appId A string containing an Angular application identifer.
 * @param inline A Map object for tracking inline (defined via `styles` in component decorator) style usage.
 * @param external A Map object for tracking external (defined via `styleUrls` in component decorator) style usage.
 */
function addServerStyles(doc, appId, inline, external) {
    const elements = doc.head?.querySelectorAll(`style[${APP_ID_ATTRIBUTE_NAME}="${appId}"],link[${APP_ID_ATTRIBUTE_NAME}="${appId}"]`);
    if (elements) {
        for (const styleElement of elements) {
            styleElement.removeAttribute(APP_ID_ATTRIBUTE_NAME);
            if (styleElement instanceof HTMLLinkElement) {
                // Only use filename from href
                // The href is build time generated with a unique value to prevent duplicates.
                external.set(styleElement.href.slice(styleElement.href.lastIndexOf('/') + 1), {
                    usage: 0,
                    elements: [styleElement],
                });
            }
            else if (styleElement.textContent) {
                inline.set(styleElement.textContent, { usage: 0, elements: [styleElement] });
            }
        }
    }
}
/**
 * Creates a `link` element for the provided external style URL.
 * @param url A string of the URL for the stylesheet.
 * @param doc A DOM Document to use to create the element.
 * @returns An HTMLLinkElement instance.
 */
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
    /**
     * Provides usage information for active inline style content and associated HTML <style> elements per host.
     * Embedded styles typically originate from the `styles` metadata of a rendered component.
     */
    inline = new Map();
    /**
     * Provides usage information for active external style URLs and the associated HTML <link> elements per host.
     * External styles typically originate from the `ɵɵExternalStylesFeature` of a rendered component.
     */
    external = new Map();
    /**
     * Set of host DOM nodes that will have styles attached.
     */
    standardShadowHosts = new Set();
    isolatedShadowRoots = [];
    constructor(doc, appId, nonce, 
    // Cannot remove it due to backward compatibility
    // (it seems some TGP targets might be calling this constructor directly).
    platformId = {}) {
        this.doc = doc;
        this.appId = appId;
        this.nonce = nonce;
        // Initialize maps for document head
        const inlineMap = new Map();
        const externalMap = new Map();
        this.inline.set(doc.head, inlineMap);
        this.external.set(doc.head, externalMap);
        addServerStyles(doc, appId, inlineMap, externalMap);
        this.standardShadowHosts.add(doc.head);
    }
    /**
     * Adds embedded styles to the DOM via HTML `style` elements.
     *
     * Modified to support IsolatedShadowDom by accepting a specific target shadow root.
     * This ensures styles are only added where they're actually needed rather than broadcasting
     * to all active shadow roots.
     *
     * @param styles An array of style content strings.
     * @param urls An optional array of external stylesheet URL strings.
     * @param shadowRoot Optional shadow root to add styles to. If provided, styles go only to this shadow root.
     *                   If not provided, styles go to document head and all standard shadow DOM hosts.
     */
    addStyles(styles, urls, shadowRoot) {
        for (const style of styles) {
            this.addUsage(style, this.inline, createStyleElement, shadowRoot);
        }
        urls?.forEach((url) => this.addUsage(url, this.external, createLinkElement, shadowRoot));
    }
    /**
     * Removes embedded styles from the DOM that were added as HTML `style` elements.
     * @param styles An array of style content strings.
     * @param urls An optional array of external stylesheet URL strings to remove.
     * @param shadowRoot Optional shadow root to remove styles from (for IsolatedShadowDom).
     */
    removeStyles(styles, urls, shadowRoot) {
        for (const value of styles) {
            this.removeUsage(value, this.inline, shadowRoot);
        }
        urls?.forEach((value) => this.removeUsage(value, this.external, shadowRoot));
    }
    /**
     * Handle timing issues with projected components. When adding styles to an
     * IsolatedShadowDom shadow root, we check if the same styles were previously added to doc.head
     * due to timing issues (renderer creation before DOM attachment). If so, we clean up the
     * incorrect doc.head styles to prevent duplication.
     */
    addUsage(value, usagesMap, creator, targetShadowRoot) {
        if (targetShadowRoot) {
            // Styles are targeted to a specific shadow root
            this.addUsageToTarget(value, usagesMap, creator, targetShadowRoot);
        }
        else {
            // Global mode: add to document head and all standard shadow DOM hosts
            this.addUsageToTarget(value, usagesMap, creator, this.doc.head, true);
        }
    }
    /**
     * Helper method that handles adding styles to a specific target container
     * while managing usage tracking and deduplication.
     *
     * @param shouldAddToHosts When true and styleRoot is document head, creates elements for all hosts
     *                         (preserves original behavior for standard ShadowDom encapsulation)
     */
    addUsageToTarget(value, usagesMap, creator, styleRoot, shouldAddToHosts = false) {
        let usages = usagesMap.get(styleRoot);
        if (!usages) {
            usages = new Map();
            usagesMap.set(styleRoot, usages);
        }
        const record = usages.get(value);
        if (record) {
            if ((typeof ngDevMode === 'undefined' || ngDevMode) && record.usage === 0) {
                record.elements.forEach((element) => element.setAttribute('ng-style-reused', ''));
            }
            record.usage++;
            return;
        }
        // Create new usage record
        const elements = [];
        // HISTORICAL CONTEXT: This behavior exists for backwards compatibility with standard ShadowDom.
        //
        // When Angular originally implemented ShadowDom encapsulation, it had a design flaw:
        // styles from emulated/none-encapsulated components were added to document.head AND
        // also broadcast to ALL existing shadow roots. This meant that emulated component styles
        // would "leak" into unrelated shadow DOM components, breaking true encapsulation.
        //
        // While this is technically incorrect behavior (shadow DOM should be isolated),
        // changing it would break existing applications that accidentally depend on this
        // style leakage. Therefore, we preserve this flawed behavior for standard ShadowDom.
        //
        if (shouldAddToHosts && styleRoot === this.doc.head && this.standardShadowHosts.size > 0) {
            // For document head, create elements for all hosts (original behavior for standard ShadowDom)
            for (const host of this.standardShadowHosts) {
                elements.push(this.addElement(host, creator(value, this.doc)));
            }
        }
        else {
            // For shadow roots or when not adding to hosts, create element for the specific target
            elements.push(this.addElement(styleRoot, creator(value, this.doc)));
        }
        usages.set(value, { usage: 1, elements });
    }
    /**
     * Removal logic to match the new precise targeting approach.
     * Previously removed styles from all active shadow roots, now removes only from
     * the specific target. This prevents accidental removal of styles from unrelated
     * IsolatedShadowDom components.
     */
    removeUsage(value, usagesMap, targetShadowRoot) {
        if (targetShadowRoot) {
            // Remove from specific shadow root
            this.removeUsageFromTarget(value, usagesMap, targetShadowRoot);
        }
        else {
            // Remove from document head only
            this.removeUsageFromTarget(value, usagesMap, this.doc.head);
        }
    }
    /**
     * Helper method for removing styles from a specific target container.
     */
    removeUsageFromTarget(value, usagesMap, styleRoot) {
        const usages = usagesMap.get(styleRoot);
        if (!usages)
            return;
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
            for (const [, { elements }] of usages) {
                removeElements(elements);
            }
        }
        this.standardShadowHosts.clear();
    }
    /**
     * Adds a host node to the set of style hosts and adds all existing style usage to
     * the newly added host node.
     *
     * This is currently only used for Shadow DOM encapsulation mode.
     */
    addHost(hostNode) {
        this.standardShadowHosts.add(hostNode);
        // Add existing styles to new host (original behavior, adapted for nested structure)
        const headInline = this.inline.get(this.doc.head);
        const headExternal = this.external.get(this.doc.head);
        if (headInline) {
            for (const [style, { elements }] of headInline) {
                elements.push(this.addElement(hostNode, createStyleElement(style, this.doc)));
            }
        }
        if (headExternal) {
            for (const [url, { elements }] of headExternal) {
                elements.push(this.addElement(hostNode, createLinkElement(url, this.doc)));
            }
        }
    }
    removeHost(hostNode) {
        this.standardShadowHosts.delete(hostNode);
        // Clean up usage maps for removed host
        const hostKey = hostNode;
        const inlineUsages = this.inline.get(hostKey);
        const externalUsages = this.external.get(hostKey);
        if (inlineUsages) {
            for (const { elements } of inlineUsages.values()) {
                removeElements(elements);
            }
            this.inline.delete(hostKey);
        }
        if (externalUsages) {
            for (const { elements } of externalUsages.values()) {
                removeElements(elements);
            }
            this.external.delete(hostKey);
        }
    }
    addElement(host, element) {
        if (this.nonce) {
            element.setAttribute('nonce', this.nonce);
        }
        // Add application identifier when on the server to support client-side reuse
        if (typeof ngServerMode !== 'undefined' && ngServerMode) {
            element.setAttribute(APP_ID_ATTRIBUTE_NAME, this.appId);
        }
        host.appendChild(element);
        return element;
    }
    addShadowRoot(shadowRoot) {
        // Throw error if using isolated shadow roots in SSR mode
        if (typeof ngServerMode !== 'undefined' && ngServerMode) {
            throw new Error('IsolatedShadowRoot is not supported in SSR mode until declarative shadow DOM is supported.');
        }
        // Check if ShadowRoot is supported in this environment
        if (typeof ShadowRoot === 'undefined') {
            throw new Error('ShadowRoot is not supported in this environment.');
        }
        if (typeof ngDevMode !== 'undefined' &&
            ngDevMode &&
            this.isolatedShadowRoots.includes(shadowRoot)) {
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
        // Clean up usage maps for removed shadow root
        const inlineUsages = this.inline.get(shadowRoot);
        const externalUsages = this.external.get(shadowRoot);
        if (inlineUsages) {
            for (const { elements } of inlineUsages.values()) {
                removeElements(elements);
            }
            this.inline.delete(shadowRoot);
        }
        if (externalUsages) {
            for (const { elements } of externalUsages.values()) {
                removeElements(elements);
            }
            this.external.delete(shadowRoot);
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: SharedStylesHost, deps: [{ token: DOCUMENT }, { token: APP_ID }, { token: CSP_NONCE, optional: true }, { token: PLATFORM_ID }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: SharedStylesHost });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: SharedStylesHost, decorators: [{
            type: Injectable
        }], ctorParameters: () => [{ type: Document, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [APP_ID]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CSP_NONCE]
                }, {
                    type: Optional
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }] });

/**
 * Service that tracks active shadow DOM contexts and determines where styles should be applied
 * for IsolatedShadowDom encapsulation.
 */
class IsolatedStyleScopeService {
    // Track isolated shadow roots with their host elements
    isolatedShadowRoots = new Map();
    // Track standard shadow roots with their host elements
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
    /**
     * Determines where styles should be applied by checking the shadow DOM context.
     * Uses Angular's LView hierarchy combined with DOM checks for robustness.
     */
    determineStyleTargets(element) {
        if (typeof ShadowRoot === 'undefined') {
            return [];
        }
        // Check if element is already inside a shadow root
        const elementRoot = element.getRootNode();
        if (elementRoot instanceof ShadowRoot && this.isRegisteredShadowRoot(elementRoot)) {
            return this.getShadowRootsForContext(elementRoot);
        }
        // Try Angular's LView hierarchy with DOM ancestor checking
        try {
            const result = this.findShadowRootViaLView(element);
            if (result) {
                return result;
            }
        }
        catch (e) {
            // LView not available, return empty to use broadcast behavior
        }
        return [];
    }
    /**
     * Finds shadow root hosts using Angular's LView hierarchy.
     *
     * Note: With IsolatedShadowDom, ng-content projection is disabled and native <slot>
     * elements are used instead. This means projected content stays in the light DOM,
     * so we only need to check the LView hierarchy - no DOM walking required.
     */
    findShadowRootViaLView(element) {
        const context = _getLContext(element);
        if (!context || !context.lView) {
            return null;
        }
        // Traverse LView hierarchy to find component hosts
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
            }
            else {
                break;
            }
        }
        return null;
    }
    /**
     * Checks if the given element is a shadow root host and returns appropriate shadow roots.
     */
    checkIfShadowRootHost(element) {
        for (const [shadowRoot, host] of [...this.isolatedShadowRoots, ...this.standardShadowRoots]) {
            if (host === element) {
                return this.getShadowRootsForContext(shadowRoot);
            }
        }
        return null;
    }
    /**
     * Returns the appropriate shadow roots based on whether it's isolated or standard.
     */
    getShadowRootsForContext(shadowRoot) {
        if (this.isIsolatedShadowRoot(shadowRoot)) {
            return [shadowRoot];
        }
        else {
            return Array.from(this.standardShadowRoots.keys());
        }
    }
    isRegisteredShadowRoot(shadowRoot) {
        return this.isolatedShadowRoots.has(shadowRoot) || this.standardShadowRoots.has(shadowRoot);
    }
    /**
     * Check if a shadow root is registered as an isolated shadow root
     */
    isIsolatedShadowRoot(shadowRoot) {
        return this.isolatedShadowRoots.has(shadowRoot);
    }
    /**
     * Check if a shadow root is registered as a standard shadow root
     */
    isStandardShadowRoot(shadowRoot) {
        return this.standardShadowRoots.has(shadowRoot);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: IsolatedStyleScopeService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: IsolatedStyleScopeService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: IsolatedStyleScopeService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

const NAMESPACE_URIS = {
    'svg': 'http://www.w3.org/2000/svg',
    'xhtml': 'http://www.w3.org/1999/xhtml',
    'xlink': 'http://www.w3.org/1999/xlink',
    'xml': 'http://www.w3.org/XML/1998/namespace',
    'xmlns': 'http://www.w3.org/2000/xmlns/',
    'math': 'http://www.w3.org/1998/Math/MathML',
};
const COMPONENT_REGEX = /%COMP%/g;
const SOURCEMAP_URL_REGEXP = /\/\*#\s*sourceMappingURL=(.+?)\s*\*\//;
const PROTOCOL_REGEXP = /^https?:/;
const COMPONENT_VARIABLE = '%COMP%';
const HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
const CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;
/**
 * The default value for the `REMOVE_STYLES_ON_COMPONENT_DESTROY` DI token.
 */
const REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT = true;
/**
 * A DI token that indicates whether styles
 * of destroyed components should be removed from DOM.
 *
 * By default, the value is set to `true`.
 * @publicApi
 */
const REMOVE_STYLES_ON_COMPONENT_DESTROY = new InjectionToken(ngDevMode ? 'RemoveStylesOnCompDestroy' : '', {
    providedIn: 'root',
    factory: () => REMOVE_STYLES_ON_COMPONENT_DESTROY_DEFAULT,
});
function shimContentAttribute(componentShortId) {
    return CONTENT_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimHostAttribute(componentShortId) {
    return HOST_ATTR.replace(COMPONENT_REGEX, componentShortId);
}
function shimStylesContent(compId, styles) {
    return styles.map((s) => s.replace(COMPONENT_REGEX, compId));
}
/**
 * Prepends a baseHref to the `sourceMappingURL` within the provided CSS content.
 * If the `sourceMappingURL` contains an inline (encoded) map, the function skips processing.
 *
 * @note For inline stylesheets, the `sourceMappingURL` is relative to the page's origin
 * and not the provided baseHref. This function is needed as when accessing the page with a URL
 * containing two or more segments.
 * For example, if the baseHref is set to `/`, and you visit a URL like `http://localhost/foo/bar`,
 * the map would be requested from `http://localhost/foo/bar/comp.css.map` instead of what you'd expect,
 * which is `http://localhost/comp.css.map`. This behavior is corrected by modifying the `sourceMappingURL`
 * to ensure external source maps are loaded relative to the baseHref.
 *

 * @param baseHref - The base URL to prepend to the `sourceMappingURL`.
 * @param styles - An array of CSS content strings, each potentially containing a `sourceMappingURL`.
 * @returns The updated array of CSS content strings with modified `sourceMappingURL` values,
 * or the original content if no modification is needed.
 */
function addBaseHrefToCssSourceMap(baseHref, styles) {
    if (!baseHref) {
        return styles;
    }
    const absoluteBaseHrefUrl = new URL(baseHref, 'http://localhost');
    return styles.map((cssContent) => {
        if (!cssContent.includes('sourceMappingURL=')) {
            return cssContent;
        }
        return cssContent.replace(SOURCEMAP_URL_REGEXP, (_, sourceMapUrl) => {
            if (sourceMapUrl[0] === '/' ||
                sourceMapUrl.startsWith('data:') ||
                PROTOCOL_REGEXP.test(sourceMapUrl)) {
                return `/*# sourceMappingURL=${sourceMapUrl} */`;
            }
            const { pathname: resolvedSourceMapUrl } = new URL(sourceMapUrl, absoluteBaseHrefUrl);
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
        if (typeof ngServerMode !== 'undefined' &&
            ngServerMode &&
            (type.encapsulation === ViewEncapsulation.ShadowDom ||
                type.encapsulation === ViewEncapsulation.IsolatedShadowDom)) {
            // Domino does not support shadow DOM.
            type = { ...type, encapsulation: ViewEncapsulation.Emulated };
        }
        const renderer = this.getOrCreateRenderer(element, type);
        // Renderers have different logic due to different encapsulation behaviours.
        // Ex: for emulated, an attribute is added to the element.
        if (renderer instanceof EmulatedEncapsulationDomRenderer2) {
            renderer.applyToHost(element);
        }
        else if (renderer instanceof NoneEncapsulationDomRenderer) {
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
    /**
     * Used during HMR to clear any cached data about a component.
     * @param componentId ID of the component that is being replaced.
     */
    componentReplaced(componentId) {
        this.rendererByCompId.delete(componentId);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: DomRendererFactory2, deps: [{ token: EventManager }, { token: SharedStylesHost }, { token: APP_ID }, { token: REMOVE_STYLES_ON_COMPONENT_DESTROY }, { token: DOCUMENT }, { token: PLATFORM_ID }, { token: i0.NgZone }, { token: CSP_NONCE }, { token: _TracingService, optional: true }, { token: IsolatedStyleScopeService }], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: DomRendererFactory2 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "0.0.0", ngImport: i0, type: DomRendererFactory2, decorators: [{
            type: Injectable
        }], ctorParameters: () => [{ type: EventManager }, { type: SharedStylesHost }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [APP_ID]
                }] }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [REMOVE_STYLES_ON_COMPONENT_DESTROY]
                }] }, { type: Document, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: Object, decorators: [{
                    type: Inject,
                    args: [PLATFORM_ID]
                }] }, { type: i0.NgZone }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [CSP_NONCE]
                }] }, { type: i0.ɵTracingService, decorators: [{
                    type: Inject,
                    args: [_TracingService]
                }, {
                    type: Optional
                }] }, { type: IsolatedStyleScopeService }] });
class DefaultDomRenderer2 {
    eventManager;
    doc;
    ngZone;
    platformIsServer;
    tracingService;
    data = Object.create(null);
    /**
     * By default this renderer throws when encountering synthetic properties
     * This can be disabled for example by the AsyncAnimationRendererFactory
     */
    throwOnSyntheticProps = true;
    constructor(eventManager, doc, ngZone, platformIsServer, tracingService) {
        this.eventManager = eventManager;
        this.doc = doc;
        this.ngZone = ngZone;
        this.platformIsServer = platformIsServer;
        this.tracingService = tracingService;
    }
    destroy() { }
    destroyNode = null;
    createElement(name, namespace) {
        if (namespace) {
            // TODO: `|| namespace` was added in
            // https://github.com/angular/angular/commit/2b9cc8503d48173492c29f5a271b61126104fbdb to
            // support how Ivy passed around the namespace URI rather than short name at the time. It did
            // not, however extend the support to other parts of the system (setAttribute, setAttribute,
            // and the ServerRenderer). We should decide what exactly the semantics for dealing with
            // namespaces should be and make it consistent.
            // Related issues:
            // https://github.com/angular/angular/issues/44028
            // https://github.com/angular/angular/issues/44883
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
        // child was removed
        oldChild.remove();
    }
    selectRootElement(selectorOrNode, preserveContent) {
        let el = typeof selectorOrNode === 'string' ? this.doc.querySelector(selectorOrNode) : selectorOrNode;
        if (!el) {
            throw new _RuntimeError(-5104 /* RuntimeErrorCode.ROOT_NODE_NOT_FOUND */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
                `The selector "${selectorOrNode}" did not match any elements`);
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
            }
            else {
                el.setAttribute(name, value);
            }
        }
        else {
            el.setAttribute(name, value);
        }
    }
    removeAttribute(el, name, namespace) {
        if (namespace) {
            const namespaceUri = NAMESPACE_URIS[namespace];
            if (namespaceUri) {
                el.removeAttributeNS(namespaceUri, name);
            }
            else {
                el.removeAttribute(`${namespace}:${name}`);
            }
        }
        else {
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
        }
        else {
            el.style[style] = value;
        }
    }
    removeStyle(el, style, flags) {
        if (flags & RendererStyleFlags2.DashCase) {
            // removeProperty has no effect when used on camelCased properties.
            el.style.removeProperty(style);
        }
        else {
            el.style[style] = '';
        }
    }
    setProperty(el, name, value) {
        if (el == null) {
            return;
        }
        (typeof ngDevMode === 'undefined' || ngDevMode) &&
            this.throwOnSyntheticProps &&
            checkNoSyntheticProp(name, 'property');
        el[name] = value;
    }
    setValue(node, value) {
        node.nodeValue = value;
    }
    listen(target, event, callback, options) {
        (typeof ngDevMode === 'undefined' || ngDevMode) &&
            this.throwOnSyntheticProps &&
            checkNoSyntheticProp(event, 'listener');
        if (typeof target === 'string') {
            target = _getDOM().getGlobalEventTarget(this.doc, target);
            if (!target) {
                throw new _RuntimeError(5102 /* RuntimeErrorCode.UNSUPPORTED_EVENT_TARGET */, (typeof ngDevMode === 'undefined' || ngDevMode) &&
                    `Unsupported event target ${target} for event ${event}`);
            }
        }
        let wrappedCallback = this.decoratePreventDefault(callback);
        if (this.tracingService?.wrapEventListener) {
            wrappedCallback = this.tracingService.wrapEventListener(target, event, wrappedCallback);
        }
        return this.eventManager.addEventListener(target, event, wrappedCallback, options);
    }
    decoratePreventDefault(eventHandler) {
        // `DebugNode.triggerEventHandler` needs to know if the listener was created with
        // decoratePreventDefault or is a listener added outside the Angular context so it can handle
        // the two differently. In the first case, the special '__ngUnwrap__' token is passed to the
        // unwrap the listener (see below).
        return (event) => {
            // Ivy uses '__ngUnwrap__' as a special token that allows us to unwrap the function
            // so that it can be invoked programmatically by `DebugNode.triggerEventHandler`. The
            // debug_node can inspect the listener toString contents for the existence of this special
            // token. Because the token is a string literal, it is ensured to not be modified by compiled
            // code.
            if (event === '__ngUnwrap__') {
                return eventHandler;
            }
            // Run the event handler inside the ngZone because event handlers are not patched
            // by Zone on the server. This is required only for tests.
            const allowDefaultBehavior = typeof ngServerMode !== 'undefined' && ngServerMode
                ? this.ngZone.runGuarded(() => eventHandler(event))
                : eventHandler(event);
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
        throw new _RuntimeError(5105 /* RuntimeErrorCode.UNEXPECTED_SYNTHETIC_PROPERTY */, `Unexpected synthetic ${nameKind} ${name} found. Please make sure that:
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
        // Only create shadow root in browser environments
        if (!platformIsServer) {
            this.shadowRoot = hostEl.attachShadow({ mode: 'open' });
        }
        else {
            // In SSR or environments without shadow DOM support, throw
            throw new Error('IsolatedShadowRoot is not supported in SSR mode until declarative shadow DOM is supported.');
        }
        // Determine if this is isolated based on component encapsulation
        const isIsolated = component.encapsulation === ViewEncapsulation.IsolatedShadowDom;
        // Register shadow root with StyleScopeService for style targeting (only if service available and in browser)
        if (this.styleScopeService) {
            if (isIsolated) {
                this.styleScopeService.registerIsolatedShadowRoot(this.shadowRoot);
                this.sharedStylesHost.addShadowRoot(this.shadowRoot);
            }
            else {
                this.styleScopeService.registerStandardShadowRoot(this.shadowRoot);
                this.sharedStylesHost.addHost(this.shadowRoot);
            }
        }
        let styles = component.styles;
        if (ngDevMode) {
            // We only do this in development, as for production users should not add CSS sourcemaps to components.
            const baseHref = _getDOM().getBaseHref(doc) ?? '';
            styles = addBaseHrefToCssSourceMap(baseHref, styles);
        }
        if (isIsolated && !platformIsServer) {
            // For IsolatedShadowDom, use SharedStylesHost with shadowRoot targeting
            this.sharedStylesHost.addStyles(styles, component.getExternalStyles?.(), this.shadowRoot);
        }
        else {
            // For standard ShadowDom or SSR, use original approach
            styles = shimStylesContent(component.id, styles);
            for (const style of styles) {
                const styleEl = doc.createElement('style');
                if (nonce) {
                    styleEl.setAttribute('nonce', nonce);
                }
                styleEl.textContent = style;
                this.shadowRoot.appendChild(styleEl);
            }
            // Apply any external component styles to the shadow root for the component's element.
            // The ShadowDOM renderer uses an alternative execution path for component styles that
            // does not use the SharedStylesHost that other encapsulation modes leverage. Much like
            // the manual addition of embedded styles directly above, any external stylesheets
            // must be manually added here to ensure ShadowDOM components are correctly styled.
            // TODO: Consider reworking the DOM Renderers to consolidate style handling.
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
        // Query the service to determine what type this shadow root is (only if service available and in browser)
        if (!this.platformIsServer) {
            if (this.styleScopeService.isIsolatedShadowRoot(this.shadowRoot)) {
                this.styleScopeService.deregisterIsolatedShadowRoot(this.shadowRoot);
                this.sharedStylesHost.removeShadowRoot(this.shadowRoot);
            }
            else if (this.styleScopeService.isStandardShadowRoot(this.shadowRoot)) {
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
            // We only do this in development, as for production users should not add CSS sourcemaps to components.
            const baseHref = _getDOM().getBaseHref(doc) ?? '';
            styles = addBaseHrefToCssSourceMap(baseHref, styles);
        }
        this.styles = compId ? shimStylesContent(compId, styles) : styles;
        this.styleUrls = component.getExternalStyles?.(compId);
    }
    applyStyles(element) {
        // Check if we should target specific shadow roots (only if service and element available)
        if (element && !this.platformIsServer) {
            const targetShadowRoots = this.styleScopeService.determineStyleTargets(element);
            if (targetShadowRoots.length > 0) {
                for (const shadowRoot of targetShadowRoots) {
                    this.sharedStylesHost.addStyles(this.styles, this.styleUrls, shadowRoot);
                }
                return;
            }
        }
        // Default behavior: apply to document head and all standard shadow hosts
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
        // Use inherited applyStyles method to handle shadow root targeting and fallback
        this.applyStyles(element);
        this.setAttribute(element, this.hostAttr, '');
    }
    createElement(parent, name) {
        const el = super.createElement(parent, name);
        super.setAttribute(el, this.contentAttr, '');
        return el;
    }
}

export { DomRendererFactory2, EVENT_MANAGER_PLUGINS, EventManager, EventManagerPlugin, IsolatedStyleScopeService, REMOVE_STYLES_ON_COMPONENT_DESTROY, SharedStylesHost };
//# sourceMappingURL=dom_renderer.mjs.map
