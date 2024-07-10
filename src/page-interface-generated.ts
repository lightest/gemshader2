/* tslint:disable */
declare namespace Page.Demopage {
    function setErrorMessage(id: string, message: string): void;
    function removeErrorMessage(id: string): void;
}

declare namespace Page.Helpers {
    type SelectionBase = Document | HTMLElement;
    export namespace Utils {
        function selectorAll<T extends HTMLElement>(base: SelectionBase, selector: string): T[];
        /** @throws if no element was found */
        function selector<T extends HTMLElement>(base: SelectionBase, selector: string): T;
        function touchArray(touchList: TouchList): Touch[];
        function findFirst<T>(array: T[], predicate: (e: T) => boolean): number;
    }
    export namespace URL {
        function loopOnParameters(prefix: string, callback: (name: string, value: string) => unknown): void;
        function setQueryParameter(prefix: string, name: string, value: string | null): void;
        function removeQueryParameter(prefix: string, name: string): void;
    }
    export namespace Events {
        function callAfterDOMLoaded(callback: () => unknown): void;
    }
    interface ICacheable {
        id: string;
    }
    type LoadObjectsFunction<T> = () => T[];
    export class Cache<T extends ICacheable> {
        private readonly objectsName;
        private readonly loadObjectsFunction;
        private cacheObject;
        constructor(objectsName: string, loadObjectsFunction: LoadObjectsFunction<T>);
        /** @throws An Error if the ID is unknown */
        getById(id: string): T;
        /** @returns null if the ID is unknown */
        getByIdSafe(id: string): T | null;
        load(): void;
        private get safeCacheObject();
        private loadCacheObject;
    }
    interface IStorable {
        id: string;
    }
    export class Storage<T extends IStorable> {
        private readonly prefix;
        private readonly serialize;
        private readonly tryDeserialize;
        constructor(prefix: string, serialize: (control: T) => string | null, tryDeserialize: (controlId: string, serializedValue: string) => boolean);
        storeState(control: T): void;
        clearStoredState(control: T): void;
        applyStoredState(): void;
    }
    export {};
}


declare namespace Page.Controls {
    function setVisibility(id: string, visible: boolean): void;
}
declare namespace Page.Sections {
    function setVisibility(id: string, visible: boolean): void;
}


declare namespace Page.Picker {
    type PickerObserver = (selectedValue: string | null) => unknown;
    function addObserver(id: string, observer: PickerObserver): void;
    function getValue(id: string): string | null;
    function setValue(id: string, value: string): void;
    function storeState(id: string): void;
    function clearStoredState(id: string): void;
}


declare namespace Page.Range {
    type RangeObserver = (rangeValue: number) => unknown;
    function addObserver(rangeId: string, observer: RangeObserver): void;
    /**
     * Callback will be called only when the value stops changing.
     */
    function addLazyObserver(rangeId: string, observer: RangeObserver): void;
    function getValue(rangeId: string): number;
    function setValue(rangeId: string, value: number): void;
    function storeState(rangeId: string): void;
    function clearStoredState(rangeId: string): void;
}


declare namespace Page.ColorPicker {
    namespace ColorSpace {
        interface IRGB {
            r: number;
            g: number;
            b: number;
        }
        interface IHSV {
            h: number;
            s: number;
            v: number;
        }
        type Hexa = string;
        function parseHexa(value: string): Hexa | null;
        function hsvToRgb(hsv: IHSV): IRGB;
        function rgbToHsv(rgb: IRGB): IHSV;
        function rgbToHex(rgb: IRGB): Hexa;
        function hexToRgb(hex: Hexa): IRGB;
    }
    export type OnChangeObserver = (newValue: ColorSpace.IRGB) => unknown;
    export function addObserver(id: string, observer: OnChangeObserver): void;
    export function getValue(id: string): ColorSpace.IRGB;
    export function getValueHex(id: string): ColorSpace.Hexa;
    /**
     * @param id control id
     * @param r integer in [0, 255]
     * @param g integer in [0, 255]
     * @param b integer in [0, 255]
     */
    export function setValue(id: string, r: number, g: number, b: number): void;
    export function storeState(id: string): void;
    export function clearStoredState(id: string): void;
    export {};
}


declare namespace Page.Checkbox {
    type CheckboxObserver = (isChecked: boolean) => unknown;
    function addObserver(checkboxId: string, observer: CheckboxObserver): void;
    function setChecked(checkboxId: string, value: boolean): void;
    function isChecked(checkboxId: string): boolean;
    function storeState(checkboxId: string): void;
    function clearStoredState(checkboxId: string): void;
}


declare namespace Page.Tabs {
    type TabsObserver = (selectedValues: string[]) => unknown;
    function addObserver(tabsId: string, observer: TabsObserver): void;
    function getValues(tabsId: string): string[];
    function setValues(tabsId: string, values: string[], updateURLStorage?: boolean): void;
    function storeState(tabsId: string): void;
    function clearStoredState(tabsIdd: string): void;
}

declare namespace Page {
    const version: string;
}


declare namespace Page.Canvas {
    type CanvasResizeObserver = (newWidth: number, newHeight: number) => unknown;
    type FullscreenObserver = (isFullscreen: boolean) => unknown;
    type MouseDownObserver = () => unknown;
    type MouseUpObserver = () => unknown;
    type MouseDragObserver = (deltaX: number, deltaY: number) => unknown;
    type MouseMoveObserver = (newX: number, newY: number) => unknown;
    type MouseEnterObserver = () => unknown;
    type MouseLeaveObserver = () => unknown;
    type MouseWheelObserver = (delta: number, mousePosition: [number, number]) => unknown;
    export const Observers: Readonly<{
        canvasResize: CanvasResizeObserver[];
        fullscreenToggle: FullscreenObserver[];
        mouseDown: MouseDownObserver[];
        mouseDrag: MouseDragObserver[];
        mouseEnter: MouseEnterObserver[];
        mouseLeave: MouseLeaveObserver[];
        mouseMove: MouseMoveObserver[];
        mouseWheel: MouseWheelObserver[];
        mouseUp: MouseUpObserver[];
    }>;
    export function getAspectRatio(): number;
    export function getCanvas(): HTMLCanvasElement | null;
    export function getCanvasContainer(): HTMLElement | null;
    export function getSize(): [number, number];
    export function getMousePosition(): [number, number];
    export function isFullScreen(): boolean;
    export function isMouseDown(): boolean;
    export function setIndicatorText(id: string, text: string): void;
    export function setIndicatorVisibility(id: string, visible: boolean): void;
    export function setIndicatorsVisibility(visible: boolean): void;
    export function setMaxSize(newMaxWidth: number, newMaxHeight: number): void;
    export function setResizable(resizable: boolean): void;
    export function setLoaderText(text: string): void;
    export function showLoader(show: boolean): void;
    export function toggleFullscreen(fullscreen: boolean): void;
    export {};
}

