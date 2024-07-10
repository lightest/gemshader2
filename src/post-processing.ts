import { VBO } from "./gl-utils/vbo";
import { LazyShader } from "./lazy-shader";
import { Parameters } from "./parameters";


interface ITexture {
    texture: WebGLTexture;
    framebuffer: WebGLFramebuffer;
    width: number;
    height: number;
}

const SQUARE = new Float32Array([
    -1, -1,
    +1, -1,
    -1, +1,
    +1, +1,
]);

class PostProcessing {
    private readonly gl: WebGLRenderingContext;
    private readonly squareVBO: VBO;

    private readonly downsizingShader: LazyShader;
    private readonly downsizedTexture: ITexture;

    private readonly blurShader: LazyShader;
    private readonly downsizedBlurredTexture: ITexture;

    private readonly compositingShader: LazyShader;
    private readonly fullSizeTexture: ITexture;

    public constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        this.squareVBO = new VBO(gl, SQUARE, 2, gl.FLOAT, true);

        this.downsizingShader = new LazyShader("post-processing/downsizing.frag", "post-processing/fullscreen.vert", "post-processing downsizing");
        this.blurShader = new LazyShader("post-processing/blur.frag", "post-processing/fullscreen.vert", "post-processing blur");
        this.blurShader.reset({
            BLUR_INSTRUCTIONS: PostProcessing.buildGlowInstructions1D(3), // || PostProcessing.buildGlowInstructions2D(10),
        });
        this.compositingShader = new LazyShader("post-processing/compositing.frag", "post-processing/fullscreen.vert", "post-processing downsizing");

        this.fullSizeTexture = this.createTexture();
        this.downsizedTexture = this.createTexture();
        this.downsizedBlurredTexture = this.createTexture();
    }

    public isReady(): boolean {
        // avoid lazy evaluation to force shader loading asap
        const downsizingIsReady = !!this.downsizingShader.shader;
        const blurIsReady = !!this.blurShader.shader;
        const compositingIsReady = !!this.compositingShader.shader;
        return downsizingIsReady && blurIsReady && compositingIsReady;
    }

    public prepare(): void {
        const dpiScaling = Parameters.highDPI ? window.devicePixelRatio : 1;
        const smallerTextureScaling = 1 / (8 * dpiScaling);

        this.initializeTexture(this.fullSizeTexture, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.initializeTexture(this.downsizedTexture, smallerTextureScaling * this.fullSizeTexture.width, smallerTextureScaling * this.fullSizeTexture.height);
        this.initializeTexture(this.downsizedBlurredTexture, this.downsizedTexture.width, this.downsizedTexture.height);

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fullSizeTexture.framebuffer);
        this.gl.viewport(0, 0, this.fullSizeTexture.width, this.fullSizeTexture.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    public apply(): void {
        const downsizingShader = this.downsizingShader.shader;
        const blurShader = this.blurShader.shader;
        const compositingShader = this.compositingShader.shader;
        if (downsizingShader && blurShader && compositingShader) {
            // downsize
            {
                downsizingShader.a["aCorner"].VBO = this.squareVBO;
                downsizingShader.u["uTexture"].value = this.fullSizeTexture.texture;

                downsizingShader.use();
                downsizingShader.bindUniformsAndAttributes();

                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.downsizedTexture.framebuffer);
                this.gl.viewport(0, 0, this.downsizedTexture.width, this.downsizedTexture.height);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            }

            // blur
            {
                blurShader.a["aCorner"].VBO = this.squareVBO;
                blurShader.u["uTexture"].value = this.downsizedTexture.texture;
                blurShader.u["uTexelSize"].value = [1 / this.downsizedTexture.width, 1 / this.downsizedTexture.height];

                blurShader.use();
                blurShader.bindUniformsAndAttributes();

                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.downsizedBlurredTexture.framebuffer);
                this.gl.viewport(0, 0, this.downsizedBlurredTexture.width, this.downsizedBlurredTexture.height);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            }

            // compositing
            {
                compositingShader.a["aCorner"].VBO = this.squareVBO;
                compositingShader.u["uFullsizeTexture"].value = this.fullSizeTexture.texture;
                compositingShader.u["uFullsizeTextureTexelSize"].value = [1 / this.fullSizeTexture.width, 1 / this.fullSizeTexture.height];
                compositingShader.u["uBlurredTexture"].value = this.downsizedBlurredTexture.texture;

                compositingShader.use();
                compositingShader.bindUniformsAndAttributes();

                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
                this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
                this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            }
        }
    }

    private initializeTexture(texture: ITexture, wantedWidth: number, wantedHeight: number): void {
        wantedWidth = Math.ceil(wantedWidth);
        wantedHeight = Math.ceil(wantedHeight);

        if (texture.width !== wantedWidth || texture.height !== wantedHeight) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);

            const format = this.gl.RGBA;
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, wantedWidth, wantedHeight, 0, format, this.gl.UNSIGNED_BYTE, null);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, texture.framebuffer);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture.texture, 0);
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

            this.gl.bindTexture(this.gl.TEXTURE_2D, null);

            texture.width = wantedWidth;
            texture.height = wantedHeight;
        }
    }

    private createTexture(): ITexture {
        return {
            texture: this.gl.createTexture(),
            framebuffer: this.gl.createFramebuffer(),
            width: -1,
            height: -1,
        };
    }

    // private static buildGlowInstructions2D(radius: number): string {
    //     const sigma = 2;
    //     function factor(x: number, y: number): number {
    //         return Math.exp(-(x * x + y * y) / (2 * sigma * sigma)) / (2 * Math.PI * sigma * sigma);
    //     }

    //     let total = factor(0, 0);
    //     for (let iY = -radius; iY <= radius; iY++) {
    //         for (let iX = -radius; iX <= radius; iX++) {
    //             if (iX !== 0 || iY !== 0) {
    //                 total += factor(iX, iY);
    //             }
    //         }
    //     }

    //     const instructions: string[] = [];
    //     instructions.push(`glow += ${factor(0, 0) / total} * contribution(vSamplingPosition);`);
    //     for (let iY = -radius; iY <= radius; iY++) {
    //         for (let iX = -radius; iX <= radius; iX++) {
    //             if (iX !== 0 || iY !== 0) {
    //                 instructions.push(`glow += ${factor(iX, iY) / total} * contribution(vSamplingPosition + vec2(${iX}, ${iY}) * uTexelSize);`);
    //             }
    //         }
    //     }
    //     return instructions.join("\n\t");
    // }

    private static buildGlowInstructions1D(radius: number): string {
        const sigma = 8;
        function factor(x: number): number {
            return Math.exp(-(x * x) / (2 * sigma * sigma)) / Math.sqrt(2 * Math.PI * sigma * sigma);
        }

        let total = 0;
        for (let i = -radius - 0.5; i <= radius; i++) {
            total += factor(i);
        }

        const instructions: string[] = [];
        for (let i = -radius - 0.5; i <= radius + 0.5; i++) {
            instructions.push(`blurred += ${factor(i) / total} * contribution(vec2(${i}, ${i}));`);
            instructions.push(`blurred += ${factor(i) / total} * contribution(vec2(${i}, ${-i}));`);
        }
        instructions.push(`blurred *= 0.5;`); // normalize
        instructions.push(`blurred *= 0.5;`);
        return instructions.join("\n\t");
    }
}

export { PostProcessing };
