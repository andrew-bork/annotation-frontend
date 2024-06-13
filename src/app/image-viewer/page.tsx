/* eslint-disable @next/next/no-img-element */
"use client"

import Image from "next/image";
import styles from "./page.module.css";

import { MdCrop } from "react-icons/md";
import { MdOutlineCircle } from "react-icons/md";
import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";


function renderImage(image : HTMLImageElement, ctx : CanvasRenderingContext2D, size: { width: number, height: number }, offset: { x: number, y: number }, scale: number) {
    let s = scale;
    
    ctx.drawImage(image, 0, 0, image.width, image.height, offset.x + (size.width - image.width * s) / 2, offset.y + (size.height - image.height * s) / 2, s * image.width, s * image.height);       
}




interface Vector {
    x: number, y: number
};

type ClientCoord = Vector;
type ViewportCoord = Vector;
type ImageCoord = Vector;
type RelativeCoord = Vector;














function useAnimationFrame(render: (dt: number) => void) {
    const renderRef = useRef(render);
    renderRef.current = render;
    useEffect(() => {
        let then = 0;
        let frame = 0;
        const update = (now : number) => {
            const dt = (now - then) * 0.001;
            then = now;
            renderRef.current(dt);
            frame = requestAnimationFrame(update);
        }

        frame = requestAnimationFrame((now) => {
            renderRef.current(0);
            then = now;
            frame = requestAnimationFrame(update);
        });

        return () => {
            cancelAnimationFrame(frame)
        }
    }, []);
}


function useWindowResize(callback: () => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const listener = () => {
            callbackRef.current();
        }
        window.addEventListener("resize", listener);
        return () => {
            window.removeEventListener("resize", listener);
        }
    }, []);
}

function clamp(x: number, a: number, b: number) {
    return Math.max(Math.min(x, b), a);
}



function useResize(element : MutableRefObject<HTMLElement>, callback: (size: { width: number, height: number}) => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            callbackRef.current({
                width: element.current.clientWidth,
                height: element.current.clientHeight
            });    
        });

        observer.observe(element.current);
        
        return () => {
            observer.disconnect();
        }
    }, [element]);
}








export default function ImageViewer() {

    const [ currentTool, setCurrentTool ] = useState("none");
    const image = useRef<HTMLImageElement>(null!);
    const viewport = useRef<HTMLDivElement>(null!);
    const imageLayerElement = useRef<HTMLCanvasElement>(null!);
    const annotationLayerElement = useRef<HTMLCanvasElement>(null!);

    const imageLayer = useRef<CanvasRenderingContext2D|null>(null);
    const annotationLayer = useRef<CanvasRenderingContext2D|null>(null);


    const [ size, setSize ] = useState({ width: 300, height: 150 });
    const [ offset, setOffset ] = useState<ViewportCoord>({ x: 0, y: 0 });
    const [ mousePosition, setMousePosition ] = useState<ViewportCoord>({ x: 0, y: 0 });
    const [ zoomLevel, setZoomLevel ] = useState(0);
    const scale = Math.pow(10, zoomLevel);
    // const [ scale, setScale ] = useState(1);

    const mouseState = useRef("none");



    const [ corner1, setCorner1 ] = useState<ImageCoord|null>(null);
    const [ corner2, setCorner2 ] = useState<ImageCoord|null>(null);

    const [ center, setCenter ] = useState<ImageCoord|null>(null);
    const [ radius, setRadius ] = useState<number|null>(null);



    useEffect(() => {
        imageLayer.current = imageLayerElement.current.getContext("2d");
        annotationLayer.current = annotationLayerElement.current.getContext("2d");

        imageLayerElement.current.width = 
            annotationLayerElement.current.width = 
            viewport.current.clientWidth;
        imageLayerElement.current.height = 
            annotationLayerElement.current.height = 
            viewport.current.clientHeight;

        setSize({ width: viewport.current.clientWidth, height: viewport.current.clientHeight });

    }, [ setSize ]);


    useResize(viewport, (size) => {
        imageLayerElement.current.width = 
            annotationLayerElement.current.width = 
            size.width;
        imageLayerElement.current.height = 
            annotationLayerElement.current.height = 
            size.height;
        
        if(imageLayer.current) {
            renderImage(image.current, imageLayer.current, size, offset, scale);
        }

        setSize(size);
    });

    useAnimationFrame(() => {
        if(imageLayer.current) {
            imageLayer.current.clearRect(0, 0, size.width, size.height);
            renderImage(image.current, imageLayer.current, size, offset, scale);
        }
        if(annotationLayer.current) {
            annotationLayer.current.clearRect(0, 0, size.width, size.height);

            if(corner1 && corner2) {
                annotationLayer.current.strokeStyle = "#0000ff";
                annotationLayer.current.lineWidth = 4;
                const a = corner1.x * scale + offset.x + size.width/2, 
                    b = corner1.y * scale + offset.y + size.height/2,
                    c = corner2.x * scale + offset.x + size.width/2,
                    d = corner2.y * scale + offset.y + size.height/2;
                annotationLayer.current.strokeRect(a, b, c - a, d - b);
            }else if(corner1) {
                const a = corner1.x * image.current.width * scale + offset.x + size.width/2, 
                    b = corner1.y * scale + offset.y + size.height/2;
                
                
                annotationLayer.current.strokeStyle = "#0000ff";
                annotationLayer.current.lineWidth = 4;
                annotationLayer.current.beginPath();
                annotationLayer.current.ellipse(a, b, 6, 6,0, 0, 2 * Math.PI);
                annotationLayer.current.stroke();

            }


            if(center && radius) {
                const a = center.x * scale + offset.x + size.width/2, 
                    b = center.y * scale + offset.y + size.height/2;
                
                
                annotationLayer.current.strokeStyle = "#ffff00";
                annotationLayer.current.lineWidth = 4;
                annotationLayer.current.beginPath();
                annotationLayer.current.ellipse(a, b, radius * scale, radius * scale, 0, 0, 2 * Math.PI);
                annotationLayer.current.stroke();
            }else if(center) {
                const a = center.x * scale + offset.x + size.width/2, 
                    b = center.y * scale + offset.y + size.height/2;
                annotationLayer.current.strokeStyle = "#ffff00";
                annotationLayer.current.lineWidth = 4;
                annotationLayer.current.beginPath();
                annotationLayer.current.ellipse(a, b, 6, 6,0, 0, 2 * Math.PI);
                annotationLayer.current.stroke();

            }
        }
    });


    useWindowResize(() => {
        console.log("resize!");
    });

    const imageToRelative = (v: ImageCoord) => {
        return {
            x: v.x / image.current.width,
            y: v.y / image.current.height,
        };
    }

    const viewportToImage = (v: ViewportCoord) => {
        return {
            x: (v.x - offset.x) / scale,
            y: (v.y - offset.y) /scale,
        };
    };

    const clientToViewport = (v : ClientCoord) =>  {
        const rect = viewport.current.getBoundingClientRect();
        return {
            x: v.x - rect.left - size.width/2,
            y: v.y - rect.top - size.height/2,
        };
    }

    const clampOffsets = (v: ViewportCoord) => {
        return {
            x: clamp(v.x, -image.current.width * scale * 0.5, image.current.width * scale * 0.5),
            y: clamp(v.y, -image.current.height * scale * 0.5, image.current.height * scale * 0.5),
        }
    };


    return (<main className={styles["main"]}>

        <ul className={styles["toolbar"]}>
            <li className={(currentTool === "box" ? styles["selected"] : "")}
                onClick={() => {
                    if(currentTool === "box") {
                        setCurrentTool("none");
                        mouseState.current = "none";
                    }
                    else setCurrentTool("box")
                }}
                >
                <MdCrop size="70%"/>
            </li>
            <li className={(currentTool === "circle" ? styles["selected"] : "")}
                onClick={() => {
                    if(currentTool === "circle") {
                        setCurrentTool("none");
                        mouseState.current = "none";
                    }
                    else setCurrentTool("circle")
                }}
                >
                <MdOutlineCircle size="70%"/>
            </li>
        </ul>

        <div className={styles["viewport"]} ref={viewport}
            onMouseDown={(e) => {
                if(mouseState.current === "drop-circle-radius") {
                    if(center) {
                    const b = viewportToImage(clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    }));
                    const r = Math.sqrt((b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y));
                    console.log(r);
                    setRadius(r);

                    mouseState.current = "none";

                    setCurrentTool("none");
                }
                }else if(mouseState.current === "drop-box-corner") {
                    setCorner2((viewportToImage(clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    }))));
                    mouseState.current = "none";

                    setCurrentTool("none");
                }else if(currentTool === "circle") {
                    mouseState.current = "create-circle-radius";

                    setCenter((viewportToImage(clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    }))));
                    console.log("Fasdfasd");

                    setRadius(null);
                }else if(currentTool === "box") {
                    mouseState.current = "create-box-corner";
                    setCorner1((viewportToImage(clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    }))));
                    setCorner2(null);
                }else if(mouseState.current === "none") {
                    mouseState.current = "pan";
                }
            }}

            onMouseMove={(e) => {
                if(mouseState.current === "pan") {
                    setOffset((offset) => clampOffsets({ x: offset.x + e.movementX, y: offset.y + e.movementY }));
                }else if(mouseState.current === "create-box-corner") {
                    setCorner2((viewportToImage(clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    }))));
                    mouseState.current = "drag-box-corner";
                }else if(mouseState.current === "drag-box-corner") {
                    setCorner2((viewportToImage(clientToViewport({
                        x: e.clientX,
                        y: e.clientY
                    }))));
                }else if(mouseState.current === "create-circle-radius") {
                    if(center) {
                        const b = viewportToImage(clientToViewport({
                            x: e.clientX,
                            y: e.clientY
                        }));
                        const r = Math.sqrt((b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y));
                        setRadius(r);
                        mouseState.current = "drag-circle-radius";
                    }
                }else if(mouseState.current === "drag-circle-radius") {
                    if(center) {
                        const b = viewportToImage(clientToViewport({
                            x: e.clientX,
                            y: e.clientY
                        }));
                        const r = Math.sqrt((b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y));
                        setRadius(r);
                    }
                }
                setMousePosition(clientToViewport({
                    x: e.clientX,
                    y: e.clientY
                }));
            }}
            
            onMouseUp={(e) => {
                if(mouseState.current === "pan") {
                    mouseState.current = "none";
                }else if(mouseState.current === "drag-box-corner") {
                    mouseState.current = "none";
                    setCurrentTool("none");
                }else if(mouseState.current === "create-box-corner") {
                    mouseState.current = "drop-box-corner";
                }else if(mouseState.current === "drag-circle-radius") {
                    mouseState.current = "none";
                    setCurrentTool("none");
                }else if(mouseState.current === "create-circle-radius") {
                    mouseState.current = "drop-circle-radius";
                }

            }}
            onWheel={(e) => {
                const newZoomLevel = Math.max(Math.min(zoomLevel - e.deltaY * 0.0001, 3) , -1);
                setZoomLevel(newZoomLevel);

                const mouse = clientToViewport({
                    x: e.clientX,
                    y: e.clientY
                });

                const newZoom = Math.pow(10, newZoomLevel);
                const a = newZoom / scale;
                
                setOffset((offset) => clampOffsets({ 
                    x: mouse.x + (offset.x - mouse.x) * a, 
                    y: mouse.y + (offset.y - mouse.y) * a, 
                }));
            }}
        >
            
            
            <canvas ref={imageLayerElement}/>
            <canvas ref={annotationLayerElement}/>



            <div>
            <span>({mousePosition.x},{mousePosition.y})</span><br/>
            <span>({offset.x},{offset.y})</span><br/>
            {(image.current ? 
                <>
                    <span>({image.current.width},{image.current.height})</span><br/>
                </>
            : <></>)}
            </div>
        </div>


        <div className={styles["inspector"]}>

        </div>


        <img
            onLoadedData={() => {
                console.log("image loaded");
                // requestAnimationFrame(renderImage);
            }}
            ref={image}
            src={"rat.jpg"}
            alt="alt"
            hidden
        />
    </main>
    );
}
