import { Shader } from "./gl-utils/shader";
import * as ShaderManager from "./gl-utils/shader-manager";

import "./page-interface-generated";


enum ELoadingState {
    NOT_LOADED,
    LOADING,
    LOADED,
}

let shaderIndex = 0;

class LazyShader {
    private readonly fragmentShaderName: string;
    private readonly vertexShaderName: string;

    private readonly errorKey: string;
    private readonly errorMessage: string;

    private _shader: Shader;
    private loadingState: ELoadingState;

    private injected: { [key: string]: string };

    public constructor(fragmentShaderName: string, vertexShaderName: string, name: string) {
        this.fragmentShaderName = fragmentShaderName;
        this.vertexShaderName = vertexShaderName;
        this.errorKey = `shader_fail_${shaderIndex++}`;
        this.errorMessage = `Failed to load or build the shader '${name}'.`;

        this.loadingState = ELoadingState.NOT_LOADED;
        this.injected = {};
    }

    public get shader(): Shader | null {
        if (this.loadingState === ELoadingState.NOT_LOADED) {
            this.requestLoading();
        }

        if (this._shader) {
            return this._shader;
        }
        return null;
    }

    public reset(newInjected: { [key: string]: string }): void {
        this.loadingState = ELoadingState.NOT_LOADED;

        this.injected = newInjected;

        if (this._shader) {
            this._shader.freeGLResources();
            this._shader = null;
        }
    }

    private requestLoading(): void {
        this.loadingState = ELoadingState.LOADING;

        ShaderManager.buildShader({
            fragmentFilename: this.fragmentShaderName,
            vertexFilename: this.vertexShaderName,
            injected: this.injected,
        }, (builtShader: Shader | null) => {
            this.loadingState = ELoadingState.LOADED;

            if (builtShader !== null) {
                this._shader = builtShader;
            } else {
                Page.Demopage.setErrorMessage(this.errorKey, this.errorMessage);
            }
        });
    }
}

export {
    LazyShader,
};
