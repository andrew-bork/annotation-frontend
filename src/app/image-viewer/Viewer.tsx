import { useRef, useState } from "react";
import styles from "./page.module.css";
import { Size, Vector, useResize } from "./page";




function BoxAnnotation({ scale, corners, label, color } : { scale: number, corners: Vector[], label: string, color: string }) {
    const bottomRight = {
        x: Math.max(corners[0].x, corners[1].x) * scale,
        y: Math.max(corners[0].y, corners[1].y) * scale,
    }
    const width = (corners[1].x-corners[0].x) * scale;
    const height = (corners[1].y-corners[0].y) * scale;
    return <>
        <rect strokeWidth={0.005} stroke={color} fill="none" x={corners[0].x*scale} y={corners[0].y*scale} width={width} height={height}></rect>
        {
            (width > 0.1 ? 
                <>
                    <text x={bottomRight.x} y={bottomRight.y + 0.005} fontSize={Math.min(0.2 * (width - 0.1), 0.04)} textAnchor="end" dominantBaseline="hanging">{label}</text>
                </> :
                <></>
            )
        }
    </>
}
function CircleAnnotation({ scale, center, radius, label, color } : { scale: number, center: Vector, radius: number, label: string , color: string}) {
    // const bottomRight = {
    //     x: Math.max(corners[0].x, corners[1].x) * scale,
    //     y: Math.max(corners[0].y, corners[1].y) * scale,
    // }
    const width = radius * scale;
    // const height = (corners[1].y-corners[0].y) * scale;
    return <>
        <ellipse strokeWidth={0.005} stroke={color} fill="none" cx={center.x*scale} cy={center.y*scale} rx={radius * scale} ry={radius * scale}></ellipse>
        {
            (width > 0.1 ? 
                <>
                    {/* <text x={bottomRight.x} y={bottomRight.y + 0.005} fontSize={Math.min(0.2 * (width - 0.1), 0.04)} textAnchor="end" dominantBaseline="hanging">{label}</text> */}
                </> :
                <></>
            )
        }
    </>
}



export function SVGViewer({ onMouseDown, onMouseMove, onMouseUp, annotations = [] } : { 
        onMouseDown: (pos: Vector, e: MouseEvent) => boolean, 
        onMouseMove: (pos: Vector, e: MouseEvent) => boolean, 
        onMouseUp: (pos: Vector, e: MouseEvent) => boolean, 
        annotations: any[]
    }) {
    const viewport = useRef<HTMLDivElement>(null!);
    const mouseState = useRef("none");
    const [ transform, setTransform ] = useState<Vector&{scale:number}>({ x:0, y: 0, scale: 1 });
    const [ mouse, setMouse ] = useState<Vector>({ x:0, y: 0 });

    const [ size, setSize ] = useState<Size>({width: 300, height: 300});
    const aspect = size.height / size.width;

    useResize(viewport, (size) => {
        setSize(size);
    });

    // const annotations = [
    //     {
    //         label: "Rat",
    //         type: "box",
    //         corners: [
    //             { x: 0, y: 0 },
    //             { x: 0.1, y: 0.1 }
    //         ]
    //     }
    // ]


    const left = -1;
    const width = 2;
    const top = left * aspect;
    const height = width * aspect;


    const clampTransform = (tranform : Vector&{scale:number}) => {
        return {
            x: Math.max(Math.min(tranform.x, transform.scale), -transform.scale),
            y: Math.max(Math.min(tranform.y, transform.scale), -transform.scale),
            scale: Math.max(Math.min(tranform.scale, 100), 0.1),
        };
    };

    const viewportToImage = (v : Vector) => {
        return {
            x: (v.x - transform.x) / transform.scale,
            y: (v.y - transform.y) / transform.scale,
        }
    }
    
    const clientToViewport = (v : Vector) =>  {
        const rect = viewport.current.getBoundingClientRect();
        return {
            x: width * ((v.x - rect.left) / size.width - 0.5),
            y: height * ((v.y - rect.top) / size.height - 0.5),
        };
    }

    return <div className={styles["viewport"]} ref={viewport}

                onMouseDown={(e  ) => {
                    const mouse = clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    });
                    if(mouseState.current === "none") {
                        if(onMouseDown(viewportToImage(mouse), e as unknown as MouseEvent)) return;
                        mouseState.current = "pan";
                    }
                }}
                onMouseMove={(e) => {
                    const mouse = clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    });

                    setMouse(mouse);
                    if(mouseState.current === "pan") {
                        setTransform((transform) => {
                            return clampTransform({
                                x: transform.x + 2 * e.movementX / size.width,
                                y: transform.y + 2 * e.movementY / size.height,
                                scale: transform.scale,
                            });
                        });
                    }else {
                        if(onMouseMove(viewportToImage(mouse), e as unknown as MouseEvent)) return;
                    }

                }}
                onMouseUp={(e) => {

                    const mouse = clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    });
                    if(mouseState.current === "pan") {
                        mouseState.current = "none";
                    }else {
                        if(onMouseUp(viewportToImage(mouse), e as unknown as MouseEvent)) return;

                    }
                }}
                onWheel={(e) => {
                    setTransform((transform) => {
                        // const newZoomLevel = Math.max(Math.min( - e.deltaY * 0.0001, 3) , -1);
        
                        const mouse = clientToViewport({
                            x: e.clientX,
                            y: e.clientY
                        });
        
                        // const newZoom = Math.pow(10, newZoomLevel - transform.zoomLevel) / Math.pow(10, transform.zoomLevel);
                        const a = Math.pow(10, -e.deltaY * 0.0001);

                        return clampTransform({
                            x: mouse.x + (transform.x - mouse.x) * a, 
                            y: mouse.y + (transform.y - mouse.y) * a, 
                            scale: transform.scale * a
                        });
                    });
                }}
            >
                <svg version="1.1"
                        width="100%" height={size.height * 0.99}
                        xmlns="http://www.w3.org/2000/svg"
                        style={{pointerEvents: "none"}}
                        viewBox={`${left} ${top} ${width} ${height}`}>
                    <g transform={`translate(${transform.x},${transform.y})`}>
                        <g transform={`scale(${transform.scale})`}>
                            <image
                                href="rat.jpg"
                                width={2}
                                height={2}
                                preserveAspectRatio="true"
                                x={-1}
                                y={-1}
                            ></image>
                        </g>

                        {annotations.map((annotation, i) => {
                            if(annotation.type === "box") {
                                return <BoxAnnotation key={i} scale={transform.scale} corners={annotation.corners} label={annotation.label} color={annotation.color}/>
                            }else if(annotation.type === "circle") {
                                return <CircleAnnotation key={i} scale={transform.scale} center={annotation.center} radius={annotation.radius} label={annotation.label} color={annotation.color}/>
                            }
                            return <></>
                        })}
                    </g>

                </svg>


            <div>
                <span>({mouse.x.toFixed(1)},{mouse.y.toFixed(1)})</span><br/>
                <span>({transform.x.toFixed(1)},{transform.y.toFixed(1)})</span><br/>
                {/* {(image.current ? 
                    <>
                        <span>({image.current.width},{image.current.height})</span><br/>
                    </>
                : <></>)} */}
            </div>
        </div>

}