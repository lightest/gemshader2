import "./page-interface-generated";


/* === IDs ============================================================ */
const controlId = {
    CUT_PICKER_ID: "gem-cut-picker-id",
    REFRACTION_RANGE_ID: "refraction-range-id",
    GEM_COLOR_PICKER: "gem-color-picker-id",
    GEM_ABSOPTION_RANGE_ID: "absorption-range-id",
    DISPERSION_RANGE_ID: "dispersion-range-id",
    RAY_DEPTH_RANGE_ID: "ray-depth-range-id",
    REFLECTION: "reflection-checkbox-id",

    DISPLAY_SKYBOX_CHECKBOX_ID: "display-skybox-checkbox-id",
    BACKGROUND_COLOR_PICKER: "background-color-picker-id",
    PROJECTION_TABS_ID: "projection-tabs-id",
    GEOMETRY_ONLY_CHECKBOX_ID: "only-normals-checkbox-id",
    AUTO_ROTATE_CHECKBOX_ID: "auto-rotate-checkbox-id",
    POST_PROCESSING_CHECKBOX_ID: "post-processing-checkbox-id",
    HIGH_DPI_CHEKBOX_ID: "high-dpi-checkbox-id",

    LIGHT_TYPE_TABS_ID: "light-type-tabs-id",
    LIGHT_DIRECTION_TABS_ID: "light-direction-tabs-id",

    DISPLAY_INDICATORS: "display-indicators-checkbox-id",
    RAYTRACED_VOLUME: "raytraced-volume-checkbox-id",
    DISPLAY_NORMALS: "display-normals-checkbox-id",
    VERBOSE: "verbose-checkbox-id",

    CUSTOM_CUT_CROWN_HEIGHT: "custom-cut-crown-height-range-id",
    CUSTOM_CUT_CROWN_TABLE: "custom-cut-crown-table-range-id",
    CUSTOM_CUT_CROWN_RATIO: "custom-cut-crown-ratio-range-id",
    CUSTOM_CUT_GIRDLE_THICKNESS: "custom-cut-girdle-thickness-range-id",
    CUSTOM_CUT_GIRDLE_ROUNDNESS: "custom-cut-girdle-roundness-range-id",
    CUSTOM_CUT_PAVILLION_HEIGHT: "custom-cut-pavillion-height-range-id",
    CUSTOM_CUT_PAVILLION_RATIO: "custom-cut-pavillion-ratio-range-id",
};

enum ELightType {
    WHITE = "white",
    ASET = "aset",
}

enum ELightDirection {
    DOWNWARD = "downward",
    UPWARD = "upward",
}

enum EProjection {
    PERSPECTIVE = "perspective",
    ORTHOGRAPHIC = "orthographic",
}

interface IRGB {
    r: number;
    g: number;
    b: number;
}

type Observer = () => unknown;

function callObservers(observers: Observer[]): void {
    for (const observer of observers) {
        observer();
    }
}

const cutChangeObservers: Observer[] = [];
const callCutChangeObservers = () => { callObservers(cutChangeObservers); };
Page.Picker.addObserver(controlId.CUT_PICKER_ID, callCutChangeObservers);
Page.Range.addLazyObserver(controlId.CUSTOM_CUT_CROWN_HEIGHT, callCutChangeObservers);
Page.Range.addLazyObserver(controlId.CUSTOM_CUT_CROWN_TABLE, callCutChangeObservers);
Page.Range.addLazyObserver(controlId.CUSTOM_CUT_CROWN_RATIO, callCutChangeObservers);
Page.Range.addLazyObserver(controlId.CUSTOM_CUT_GIRDLE_THICKNESS, callCutChangeObservers);
Page.Range.addLazyObserver(controlId.CUSTOM_CUT_GIRDLE_ROUNDNESS, callCutChangeObservers);
Page.Range.addLazyObserver(controlId.CUSTOM_CUT_PAVILLION_HEIGHT, callCutChangeObservers);
Page.Range.addLazyObserver(controlId.CUSTOM_CUT_PAVILLION_RATIO, callCutChangeObservers);

const recomputeShaderObservers: Observer[] = [];
const callRecomputeShaderObservers = () => { callObservers(recomputeShaderObservers); };
Page.Range.addLazyObserver(controlId.RAY_DEPTH_RANGE_ID, callRecomputeShaderObservers);

const canvasResizeObservers: Observer[] = [];
const callCanvasResizeObservers = () => { callObservers(canvasResizeObservers); };
Page.Canvas.Observers.canvasResize.push(callCanvasResizeObservers);
Page.Checkbox.addObserver(controlId.HIGH_DPI_CHEKBOX_ID, callCanvasResizeObservers);

const cameraChangeObservers: Observer[] = [];
const callCameraChangeObservers = () => { callObservers(cameraChangeObservers); };
Page.Tabs.addObserver(controlId.PROJECTION_TABS_ID, callCameraChangeObservers);

const backgroundColorChangeObservers: Observer[] = [];
const backgroundColor: IRGB = { r: 0, g: 0, b: 0 };
function updateBackgroundColor(): void {
    const rgb = Page.ColorPicker.getValue(controlId.BACKGROUND_COLOR_PICKER);
    backgroundColor.r = rgb.r;
    backgroundColor.g = rgb.g;
    backgroundColor.b = rgb.b;

    callObservers(backgroundColorChangeObservers);
}
Page.ColorPicker.addObserver(controlId.BACKGROUND_COLOR_PICKER, updateBackgroundColor);
updateBackgroundColor();

const gemColor: IRGB = { r: 0, g: 0, b: 0 };
function updateGemColor(): void {
    const rgb = Page.ColorPicker.getValue(controlId.GEM_COLOR_PICKER);
    gemColor.r = rgb.r;
    gemColor.g = rgb.g;
    gemColor.b = rgb.b;
}
Page.ColorPicker.addObserver(controlId.GEM_COLOR_PICKER, updateGemColor);
updateGemColor();

abstract class Parameters {
    public static get cut(): string {
        return Page.Picker.getValue(controlId.CUT_PICKER_ID);
    }

    public static get refractionIndex(): number {
        return Page.Range.getValue(controlId.REFRACTION_RANGE_ID);
    }

    public static get displaySkybox(): boolean {
        return Page.Checkbox.isChecked(controlId.DISPLAY_SKYBOX_CHECKBOX_ID);
    }

    public static get backgroundColor(): IRGB {
        return backgroundColor;
    }

    public static get gemColor(): IRGB {
        return gemColor;
    }

    public static get absorption(): number {
        return Page.Range.getValue(controlId.GEM_ABSOPTION_RANGE_ID);
    }

    public static get dispersion(): number {
        return Page.Range.getValue(controlId.DISPERSION_RANGE_ID);
    }

    public static get rayDepth(): number {
        return Math.ceil(Page.Range.getValue(controlId.RAY_DEPTH_RANGE_ID));
    }

    public static get displayReflection(): boolean {
        return Page.Checkbox.isChecked(controlId.REFLECTION);
    }

    public static get displayRaytracedVolume(): boolean {
        return Page.Checkbox.isChecked(controlId.RAYTRACED_VOLUME);
    }

    public static get displayNormals(): boolean {
        return Page.Checkbox.isChecked(controlId.DISPLAY_NORMALS);
    }

    public static get verbose(): boolean {
        return Page.Checkbox.isChecked(controlId.VERBOSE);
    }

    public static get projection(): EProjection {
        return Page.Tabs.getValues(controlId.PROJECTION_TABS_ID)[0] as EProjection;
    }

    public static get geometryOnly(): boolean {
        return Page.Checkbox.isChecked(controlId.GEOMETRY_ONLY_CHECKBOX_ID);
    }

    public static get autoRotate(): boolean {
        return Page.Checkbox.isChecked(controlId.AUTO_ROTATE_CHECKBOX_ID);
    }

    public static get postProcessing(): boolean {
        return Page.Checkbox.isChecked(controlId.POST_PROCESSING_CHECKBOX_ID);
    }

    public static get highDPI(): boolean {
        return Page.Checkbox.isChecked(controlId.HIGH_DPI_CHEKBOX_ID);
    }

    public static get lightType(): ELightType {
        return Page.Tabs.getValues(controlId.LIGHT_TYPE_TABS_ID)[0] as ELightType;
    }
    public static get lightDirection(): ELightDirection {
        return Page.Tabs.getValues(controlId.LIGHT_DIRECTION_TABS_ID)[0] as ELightDirection;
    }

    public static get customCutCrownHeight(): number {
        return Page.Range.getValue(controlId.CUSTOM_CUT_CROWN_HEIGHT);
    }
    public static get customCutCrownTable(): number {
        return Page.Range.getValue(controlId.CUSTOM_CUT_CROWN_TABLE);
    }
    public static get customCutCrownRatio(): number {
        return Page.Range.getValue(controlId.CUSTOM_CUT_CROWN_RATIO);
    }
    public static get customCutGirdleThickness(): number {
        return Page.Range.getValue(controlId.CUSTOM_CUT_GIRDLE_THICKNESS);
    }
    public static get customCutGirdleRoundess(): number {
        return Page.Range.getValue(controlId.CUSTOM_CUT_GIRDLE_ROUNDNESS);
    }
    public static get customCutPavillionHeight(): number {
        return Page.Range.getValue(controlId.CUSTOM_CUT_PAVILLION_HEIGHT);
    }
    public static get customCutPavillionRati(): number {
        return Page.Range.getValue(controlId.CUSTOM_CUT_PAVILLION_RATIO);
    }

    public static addCutChangeObserver(observer: Observer): void {
        cutChangeObservers.push(observer);
    }

    public static addBackgroundColorObserver(observer: Observer): void {
        backgroundColorChangeObservers.push(observer);
    }

    public static addRecomputeShaderObservers(observer: Observer): void {
        recomputeShaderObservers.push(observer);
    }

    public static addCanvasResizeObservers(observer: Observer): void {
        canvasResizeObservers.push(observer);
    }

    public static addCameraChangeObservers(observer: Observer): void {
        cameraChangeObservers.push(observer);
    }
}

function updateCustomCutSection(): void {
    Page.Sections.setVisibility("custom-cut-section", Parameters.cut === "CUSTOM CUT");
}
Parameters.addCutChangeObserver(updateCustomCutSection);
updateCustomCutSection();

Page.Controls.setVisibility(controlId.HIGH_DPI_CHEKBOX_ID, window.devicePixelRatio > 1);

function updateIndicatorsVisibility(): void {
    const visible = Page.Checkbox.isChecked(controlId.DISPLAY_INDICATORS);
    Page.Canvas.setIndicatorsVisibility(visible);
}
Page.Checkbox.addObserver(controlId.DISPLAY_INDICATORS, updateIndicatorsVisibility);
updateIndicatorsVisibility();

function updateBackgroundVisibility(): void {
    Page.Controls.setVisibility(controlId.BACKGROUND_COLOR_PICKER, !Parameters.displaySkybox);
}
Page.Checkbox.addObserver(controlId.DISPLAY_SKYBOX_CHECKBOX_ID, updateBackgroundVisibility);
updateBackgroundVisibility();

{
    let isInDebug = false;
    if (typeof URLSearchParams !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        isInDebug = urlParams.get('debug') === "1";
    }
    Page.Sections.setVisibility("debug-section-id", isInDebug);
}

export {
    ELightDirection,
    ELightType,
    EProjection,
    Parameters,
};
