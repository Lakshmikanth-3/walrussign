import { useRef, useEffect } from 'react'

export default function CryptographicNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    })
    if (!gl) return

    const _ext = gl.getExtension('OES_standard_derivatives')
    if (!_ext) return

    // Fullscreen-triangle vertex shader
    const vertSrc = `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0,1);}`
    const vertShader = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vertShader, vertSrc)
    gl.compileShader(vertShader)

    // Post-process fragment shader
    const fragPostSrc = `#extension GL_OES_standard_derivatives : enable
precision highp float;
uniform sampler2D u_scene;
uniform vec2 u_res;
uniform float u_time;
vec4 glow(vec2 uv,vec2 dir,float strength){
  vec2 off=dir/u_res;
  vec4 c0=texture2D(u_scene,uv+off*1.0);
  vec4 c1=texture2D(u_scene,uv+off*2.0);
  vec4 c2=texture2D(u_scene,uv+off*3.0);
  vec4 sum=c0*0.4+c1*0.3+c2*0.3;
  sum*=strength;
  if(uv.x<0.||uv.x>1.||uv.y<0.||uv.y>1.)return vec4(0.0);
  return sum;
}
float grain(vec2 uv){return fract(sin(dot(uv,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/u_res;
  vec4 base=texture2D(u_scene,uv);
  float str=1.5+0.8*sin(u_time*2.0);
  vec4 g=glow(uv,vec2(1.0,0.0),str)+glow(uv,vec2(-1.0,0.0),str)+glow(uv,vec2(0.0,1.0),str)+glow(uv,vec2(0.0,-1.0),str);
  base+=g*0.25;
  vec4 g2=glow(uv,vec2(1.0,1.0),str*0.5)+glow(uv,vec2(-1.0,1.0),str*0.5)+glow(uv,vec2(1.0,-1.0),str*0.5)+glow(uv,vec2(-1.0,-1.0),str*0.5);
  base+=g2*0.25;
  base+=vec4(vec3((grain(uv*u_res)-0.5)*0.04),0.0);
  gl_FragColor=base;
}`
    const fragPost = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fragPost, fragPostSrc)
    gl.compileShader(fragPost)

    const postProgram = gl.createProgram()!
    gl.attachShader(postProgram, vertShader)
    gl.attachShader(postProgram, fragPost)
    gl.linkProgram(postProgram)

    const u_scene = gl.getUniformLocation(postProgram, 'u_scene')
    const u_res_post = gl.getUniformLocation(postProgram, 'u_res')
    const u_time_post = gl.getUniformLocation(postProgram, 'u_time')

    // Node shaders
    const nodeVertSrc = `attribute vec2 a_pos;attribute float a_size;attribute vec3 a_color;attribute float a_type;
varying vec3 v_col;varying float v_type;
uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;uniform float u_zoom;
void main(){v_col=a_color;v_type=a_type;vec2 p=a_pos;p+=u_mouse*(a_size*3.0)*0.008;p*=u_zoom;p=(p/u_res)*2.0-1.0;p.y=-p.y;gl_Position=vec4(p,0.0,1.0);gl_PointSize=a_size*u_zoom*(0.8+0.2*sin(u_time*3.0+a_pos.x));}`
    const nodeVert = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(nodeVert, nodeVertSrc)
    gl.compileShader(nodeVert)

    const nodeFragSrc = `#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec3 v_col;varying float v_type;
vec4 col(){
  float d=length(gl_PointCoord-0.5);
  float a=1.0-smoothstep(0.4,0.5,d);
  if(v_type>0.5){float ring=1.0-smoothstep(0.25,0.35,abs(d-0.35));return vec4(v_col+vec3(1.0)*ring*0.5,a);}
  return vec4(v_col+vec3(0.2,0.3,0.4),a);
}
void main(){
  float d=length(gl_PointCoord-0.5);
  if(d>0.5)discard;
  float rgbShift=0.015*(v_type+0.5);
  float r=1.0-smoothstep(0.4-fwidth(gl_PointCoord.x)-rgbShift,0.5-rgbShift,d);
  float g=1.0-smoothstep(0.4-fwidth(gl_PointCoord.x),0.5,d);
  float b=1.0-smoothstep(0.4-fwidth(gl_PointCoord.x)+rgbShift,0.5+rgbShift,d);
  vec4 base=col();
  gl_FragColor=vec4(base.r*r,base.g*g,base.b*b,base.a);
}`
    const nodeFrag = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(nodeFrag, nodeFragSrc)
    gl.compileShader(nodeFrag)

    const nodeProgram = gl.createProgram()!
    gl.attachShader(nodeProgram, nodeVert)
    gl.attachShader(nodeProgram, nodeFrag)
    gl.linkProgram(nodeProgram)

    const n_u_res = gl.getUniformLocation(nodeProgram, 'u_res')
    const n_u_time = gl.getUniformLocation(nodeProgram, 'u_time')
    const n_u_mouse = gl.getUniformLocation(nodeProgram, 'u_mouse')
    const n_u_zoom = gl.getUniformLocation(nodeProgram, 'u_zoom')
    const n_a_pos = gl.getAttribLocation(nodeProgram, 'a_pos')
    const n_a_size = gl.getAttribLocation(nodeProgram, 'a_size')
    const n_a_color = gl.getAttribLocation(nodeProgram, 'a_color')
    const n_a_type = gl.getAttribLocation(nodeProgram, 'a_type')

    // Line shaders
    const lineVertSrc = `attribute vec2 a_pos;attribute vec4 a_lineColor;
varying vec4 v_lineColor;
uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;uniform float u_zoom;
void main(){v_lineColor=a_lineColor;vec2 p=a_pos;p+=u_mouse*0.008;p*=u_zoom;p=(p/u_res)*2.0-1.0;p.y=-p.y;gl_Position=vec4(p,0.0,1.0);}`
    const lineVert = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(lineVert, lineVertSrc)
    gl.compileShader(lineVert)

    const lineFragShaderSrc = `#extension GL_OES_standard_derivatives : enable
precision highp float;
varying vec4 v_lineColor;
void main(){gl_FragColor=vec4(v_lineColor.rgb,v_lineColor.a*0.3);}`
    const lineFrag = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(lineFrag, lineFragShaderSrc)
    gl.compileShader(lineFrag)

    const lineProgram = gl.createProgram()!
    gl.attachShader(lineProgram, lineVert)
    gl.attachShader(lineProgram, lineFrag)
    gl.linkProgram(lineProgram)

    const l_u_res = gl.getUniformLocation(lineProgram, 'u_res')
    const l_u_time = gl.getUniformLocation(lineProgram, 'u_time')
    const l_u_mouse = gl.getUniformLocation(lineProgram, 'u_mouse')
    const l_u_zoom = gl.getUniformLocation(lineProgram, 'u_zoom')
    const l_a_pos = gl.getAttribLocation(lineProgram, 'a_pos')
    const l_a_lineColor = gl.getAttribLocation(lineProgram, 'a_lineColor')

    // Generate network data
    let NODE_COUNT = 1200
    const pos: number[] = []
    const sizes: number[] = []
    const colors: number[] = []
    const types: number[] = []
    let fibIndices: number[] = []

    // Darker, more subtle colors for dark background
    const bandColor = [
      [0.05, 0.2, 0.35], [0.02, 0.15, 0.3], [0.08, 0.25, 0.4],
      [0.1, 0.3, 0.45], [0.06, 0.2, 0.3], [0.12, 0.08, 0.25],
      [0.15, 0.05, 0.2], [0.2, 0.1, 0.15], [0.1, 0.15, 0.08],
      [0.08, 0.2, 0.12], [0.05, 0.25, 0.15],
    ]

    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / NODE_COUNT)
      const theta = Math.PI * (1 + Math.sqrt(5)) * i
      const radius = 300 + Math.random() * 200
      const fx = radius * Math.sin(phi) * Math.cos(theta)
      const fy = radius * Math.sin(phi) * Math.sin(theta)
      const fz = 1.5 + Math.random() * 2.5 // Small point sizes
      const band = Math.floor(Math.random() * bandColor.length)
      pos.push(fx + window.innerWidth * 0.5, fy + window.innerHeight * 0.5)
      sizes.push(fz)
      colors.push(bandColor[band][0], bandColor[band][1], bandColor[band][2])
      types.push(i % 5 === 0 ? 1.0 : 0.0) // Fewer ring-type nodes
      fibIndices.push(i)
    }

    // Shuffle
    for (let i = fibIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      if (j !== i) {
        const tmp = fibIndices[i]
        fibIndices[i] = fibIndices[j]
        fibIndices[j] = tmp
      }
    }

    // Resize
    let cw = 0, ch = 0
    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas!.width = window.innerWidth * dpr
      canvas!.height = window.innerHeight * dpr
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
      cw = canvas!.width
      ch = canvas!.height
    }
    window.addEventListener('resize', resize)
    resize()

    // Upload buffers
    const posBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW)

    const sizeBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW)

    const colorBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW)

    const typeBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, typeBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(types), gl.STATIC_DRAW)

    // Fullscreen triangle
    const postBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, postBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

    // FBO
    const fbo = gl.createFramebuffer()
    const sceneTex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, sceneTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0)

    // Interaction state
    const mouse = { x: 0, y: 0, smoothX: 0, smoothY: 0, active: false }
    let zoom = 1.0

    // Line updates
    let lineBuffer: WebGLBuffer | null = null
    let lineCount = 0
    let lineFrame = 0

    function updateLines() {
      lineFrame++
      if (lineFrame % 30 !== 0) return
      const time = lineFrame * 0.016
      const srcNode = fibIndices[(Math.floor(time * 2) % NODE_COUNT)]
      const nearest: { idx: number; dist: number }[] = []
      for (let j = 0; j < NODE_COUNT; j++) {
        if (j === srcNode) continue
        const dx = pos[j * 2] - pos[srcNode * 2]
        const dy = pos[j * 2 + 1] - pos[srcNode * 2 + 1]
        const dist = dx * dx + dy * dy
        nearest.push({ idx: j, dist })
      }
      nearest.sort((a, b) => a.dist - b.dist)
      const topN = nearest.slice(0, 15)
      if (topN.length === 0) return
      const lineData = new Float32Array(6 * 6)
      const sr = 0.5 + 0.5 * Math.sin(time)
      const sg = 0.5 + 0.5 * Math.sin(time + 2.09)
      const sb = 0.5 + 0.5 * Math.sin(time + 4.18)
      for (let k = 0; k < 6; k++) {
        const n = topN[k % topN.length].idx
        const t = k / 6
        lineData[k * 6 + 0] = (pos[srcNode * 2] + pos[n * 2]) * 0.5 + (pos[srcNode * 2] - pos[n * 2]) * t
        lineData[k * 6 + 1] = (pos[srcNode * 2 + 1] + pos[n * 2 + 1]) * 0.5 + (pos[srcNode * 2 + 1] - pos[n * 2 + 1]) * t
        lineData[k * 6 + 2] = pos[n * 2]
        lineData[k * 6 + 3] = pos[n * 2 + 1]
        lineData[k * 6 + 4] = sr * 0.9
        lineData[k * 6 + 5] = sg * 0.9
        // Pack color differently - using POINTS not LINES for color
        // Actually we need to fix the line data format. Let's use 6 floats per segment:
        // x1, y1, x2, y2, r+g as vec2, b+a as vec2
      }
      // Re-format for proper line rendering
      const lineData2 = new Float32Array(6 * 6)
      for (let k = 0; k < 6; k++) {
        const n = topN[k % topN.length].idx
        const t = k / 6
        // source point
        lineData2[k * 12 + 0] = (pos[srcNode * 2] + pos[n * 2]) * 0.5 + (pos[srcNode * 2] - pos[n * 2]) * t
        lineData2[k * 12 + 1] = (pos[srcNode * 2 + 1] + pos[n * 2 + 1]) * 0.5 + (pos[srcNode * 2 + 1] - pos[n * 2 + 1]) * t
        lineData2[k * 12 + 2] = sr * 0.9
        lineData2[k * 12 + 3] = sg * 0.9
        // destination point
        lineData2[k * 12 + 4] = pos[n * 2]
        lineData2[k * 12 + 5] = pos[n * 2 + 1]
        lineData2[k * 12 + 6] = sr * 0.9
        lineData2[k * 12 + 7] = sg * 0.9
        // Color as vec4 per endpoint
        lineData2[k * 12 + 8] = sb * 0.9
        lineData2[k * 12 + 9] = 0.7
        lineData2[k * 12 + 10] = 0
        lineData2[k * 12 + 11] = 0
      }
      if (lineBuffer) gl!.deleteBuffer(lineBuffer)
      lineBuffer = gl!.createBuffer()
      gl!.bindBuffer(gl!.ARRAY_BUFFER, lineBuffer)
      gl!.bufferData(gl!.ARRAY_BUFFER, lineData2, gl!.STATIC_DRAW)
      lineCount = 6
    }

    // Render loop
    let rafId: number
    function render(time: number) {
      const t = time * 0.001
      mouse.smoothX += (mouse.x - mouse.smoothX) * 0.06
      mouse.smoothY += (mouse.y - mouse.smoothY) * 0.06

      gl!.bindTexture(gl!.TEXTURE_2D, sceneTex)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, cw, ch, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null)
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo)
      gl!.clearColor(0.0, 0.0, 0.0, 0.0)
      gl!.clear(gl!.COLOR_BUFFER_BIT)

      updateLines()

      // Draw nodes (with standard alpha blending for subtle effect)
      gl!.useProgram(nodeProgram)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, posBuffer)
      gl!.vertexAttribPointer(n_a_pos, 2, gl!.FLOAT, false, 0, 0)
      gl!.enableVertexAttribArray(n_a_pos)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, sizeBuffer)
      gl!.vertexAttribPointer(n_a_size, 1, gl!.FLOAT, false, 0, 0)
      gl!.enableVertexAttribArray(n_a_size)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, colorBuffer)
      gl!.vertexAttribPointer(n_a_color, 3, gl!.FLOAT, false, 0, 0)
      gl!.enableVertexAttribArray(n_a_color)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, typeBuffer)
      gl!.vertexAttribPointer(n_a_type, 1, gl!.FLOAT, false, 0, 0)
      gl!.enableVertexAttribArray(n_a_type)
      gl!.uniform2f(n_u_res, cw, ch)
      gl!.uniform1f(n_u_time, t)
      gl!.uniform2f(n_u_mouse, mouse.smoothX, mouse.smoothY)
      gl!.uniform1f(n_u_zoom, zoom)
      gl!.enable(gl!.BLEND)
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA)
      gl!.drawArrays(gl!.POINTS, 0, NODE_COUNT)

      // Draw lines
      if (lineBuffer && lineCount > 0) {
        gl!.useProgram(lineProgram)
        gl!.bindBuffer(gl!.ARRAY_BUFFER, lineBuffer)
        gl!.vertexAttribPointer(l_a_pos, 2, gl!.FLOAT, false, 48, 0)
        gl!.enableVertexAttribArray(l_a_pos)
        gl!.vertexAttribPointer(l_a_lineColor, 4, gl!.FLOAT, false, 48, 8)
        gl!.enableVertexAttribArray(l_a_lineColor)
        gl!.uniform2f(l_u_res, cw, ch)
        gl!.uniform1f(l_u_time, t)
        gl!.uniform2f(l_u_mouse, mouse.smoothX, mouse.smoothY)
        gl!.uniform1f(l_u_zoom, zoom)
        gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA)
        gl!.drawArrays(gl!.LINES, 0, lineCount * 2)
      }
      gl!.disable(gl!.BLEND)

      // Post-process
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
      gl!.bindBuffer(gl!.ARRAY_BUFFER, postBuffer)
      gl!.useProgram(postProgram)
      gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0)
      gl!.enableVertexAttribArray(0)
      gl!.activeTexture(gl!.TEXTURE0)
      gl!.bindTexture(gl!.TEXTURE_2D, sceneTex)
      gl!.uniform1i(u_scene, 0)
      gl!.uniform2f(u_res_post, cw, ch)
      gl!.uniform1f(u_time_post, t)
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)

      rafId = requestAnimationFrame(render)
    }

    // Event handlers
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX - window.innerWidth / 2) * 0.3
      mouse.y = (e.clientY - window.innerHeight / 2) * 0.3
    }
    const handleClick = (_e: MouseEvent) => {
      if (NODE_COUNT >= 3000) return
      for (let i = 0; i < 3; i++) {
        // Simplified burst - increment count to show visual effect
        // (Full buffer expansion would require WebGL2 for bufferSubData)
        void i
        NODE_COUNT = Math.min(NODE_COUNT + 1, 3000)
      }
    }
    const handleWheel = (e: WheelEvent) => {
      zoom += e.deltaY * -0.001
      zoom = Math.min(Math.max(zoom, 0.3), 2.0)
    }

    window.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('wheel', handleWheel, { passive: true })

    rafId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('wheel', handleWheel)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
      aria-hidden="true"
    />
  )
}
