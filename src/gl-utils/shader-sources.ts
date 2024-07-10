import shaderFrag from "../shaders/shader.frag";
import shaderVert from "../shaders/shader.vert";
import skyboxFrag from "../shaders/skybox.frag";
import skyboxVert from "../shaders/skybox.vert";
import shaderMulticolorFrag from "../shaders/shader-multicolor.frag";
import raytracedVolumeFrag from "../shaders/raytracedVolume.frag";
import raytracedVolumeVert from "../shaders/raytracedVolume.vert";
import normalsFrag from "../shaders/normals.frag";
import _skyboxFrag from "../shaders/_skybox.frag";
import _skyboxMonoFrag from "../shaders/_skybox-monochrome.frag";

import blurFrag from "../shaders/post-processing/blur.frag";
import compositingFrag from "../shaders/post-processing/compositing.frag";
import downsizingFrag from "../shaders/post-processing/downsizing.frag";
import fullScreenVert from "../shaders/post-processing/fullscreen.vert";

const SHADERS = {
    "shader.frag": shaderFrag,
    "shader.vert": shaderVert,
    "skybox.frag": skyboxFrag,
    "skybox.vert": skyboxVert,
    "shader-multicolor.frag": shaderMulticolorFrag,
    "raytracedVolume.frag": raytracedVolumeFrag,
    "raytracedVolume.vert": raytracedVolumeVert,
    "normals.frag": normalsFrag,
    "_skybox.frag": _skyboxFrag,
    "_skybox-monochrome.frag": _skyboxMonoFrag,
    "post-processing/blur.frag": blurFrag,
    "post-processing/compositing.frag": compositingFrag,
    "post-processing/downsizing.frag": downsizingFrag,
    "post-processing/fullscreen.vert": fullScreenVert,
};

type LoadCallback = (success: boolean) => void;

interface ICachedSource {
    text: string;
    pending: boolean;
    failed: boolean;
    callbacks: LoadCallback[];
}

const cachedSources: { [id: string]: ICachedSource } = {};

/* Fetches asynchronously the shader source from server and stores it in cache. */
function loadSource(filename: string, callback: LoadCallback): void {
    function callAndClearCallbacks(cached: ICachedSource): void {
        for (const cachedCallback of cached.callbacks) {
            cachedCallback(!cached.failed);
        }

        cached.callbacks = [];
    }

    if (typeof cachedSources[filename] === "undefined") {
        cachedSources[filename] = {
            callbacks: [callback],
            failed: false,
            pending: true,
            text: null,
        };
        const cached = cachedSources[filename];

        if (SHADERS[filename])
        {
            cached.pending = false;
            cached.failed = false;
            cached.text = SHADERS[filename];
            callAndClearCallbacks(cached);
            return;
        }
        else
        {
            console.warn(`No preloaded shader for ${filename}, fetching.`);
        }

        let url = "./shaders/" + filename;
        if (typeof Page.version !== "undefined") {
            url += `?v=${Page.version}`;
        }
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = () => {
            if (xhr.readyState === 4) {
                cached.pending = false;

                if (xhr.status === 200) {
                    cached.text = xhr.responseText;
                    cached.failed = false;
                } else {
                    console.error(`Cannot load '${filename}' shader source: ${xhr.statusText}`);
                    cached.failed = true;
                }

                callAndClearCallbacks(cached);
            }
        };
        xhr.onerror = () => {
            console.error(`Cannot load '${filename}' shader source: ${xhr.statusText}`);
            cached.pending = false;
            cached.failed = true;
            callAndClearCallbacks(cached);
        };

        xhr.send(null);
    } else {
        const cached = cachedSources[filename];

        if (cached.pending === true) {
            cached.callbacks.push(callback);
        } else {
            cached.callbacks = [callback];
            callAndClearCallbacks(cached);
        }
    }
}

function getSource(filename: string): string {
    return cachedSources[filename].text;
}

export {
    getSource,
    loadSource,
};
