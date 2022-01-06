

export enum FilterType {

    Nearest = 0,
    Linear = 1
};


export class Bitmap {

    private texture : WebGLTexture;
    private framebuffer : WebGLFramebuffer;

    public readonly width : number;
    public readonly height : number;


    constructor(gl : WebGLRenderingContext, image : HTMLImageElement, 
        data = <Uint8Array>null, width = 0, height = 0, makeFramebuffer = false,
        filterType = FilterType.Linear) {

        const FILTERS = [gl.NEAREST, gl.LINEAR];

        this.texture = gl.createTexture();

        let filter = FILTERS[Number(filterType)];

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
        if (image != null) {

            gl.texImage2D(gl.TEXTURE_2D, 
                0, gl.RGBA, gl.RGBA, 
                gl.UNSIGNED_BYTE, image);

            this.width = image.width;
            this.height = image.height;
        }
        else {

            gl.texImage2D(gl.TEXTURE_2D, 
                0, gl.RGBA, width, height, 0, 
                gl.RGBA, gl.UNSIGNED_BYTE, data);

            this.width = width;
            this.height = height;
                
            if (makeFramebuffer) {

                this.framebuffer = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
                gl.framebufferTexture2D(
                    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, 
                    gl.TEXTURE_2D, this.texture, 0);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
            else {

                this.framebuffer = null;
            }
        }
        
    }


    public bind(gl : WebGLRenderingContext) {

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }


    public drawTo(gl : WebGLRenderingContext, func : (gl : WebGLRenderingContext) => void) {

        if (this.framebuffer == null) return;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        func(gl);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}
