/* eslint-disable @next/next/no-img-element */
"use client"

import Image from "next/image";
import styles from "./page.module.css";

import { MdCrop } from "react-icons/md";
import { MdOutlineCircle } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { SVGViewer } from "./Viewer";


function renderImage(image : HTMLImageElement, ctx : CanvasRenderingContext2D, size: { width: number, height: number }, offset: { x: number, y: number }, scale: number) {
    let s = scale;
    
    ctx.drawImage(image, 0, 0, image.width, image.height, offset.x + (size.width - image.width * s) / 2, offset.y + (size.height - image.height * s) / 2, s * image.width, s * image.height);       
}




export interface Size {
    width: number, height: number
};
export interface Vector {
    x: number, y: number
};

export type ClientCoord = Vector;
export type ViewportCoord = Vector;
export type ImageCoord = Vector;
export type RelativeCoord = Vector;

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



export function useResize(element : MutableRefObject<HTMLElement>, callback: (size: { width: number, height: number}) => void) {
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




function dist(a: Vector, b: Vector) {
    return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));
}



export default function ImageViewer() {

    const [ currentTool, setCurrentTool ] = useState("none");
    const image = useRef<HTMLImageElement>(null!);

    const mouseState = useRef("none");

    const [ annotations, setAnnotations ] = useState<any[]>([]);

    return (<main className={styles["main"]}>

        <ul className={styles["toolbar"]}>
            <li className={(currentTool === "box" ? styles["selected"] : "")}
                onClick={() => {
                    if(currentTool === "box") {
                        setCurrentTool("none");
                        // mouseState.current = "none";
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
                        // mouseState.current = "none";
                    }
                    else setCurrentTool("circle")
                }}
                >
                <MdOutlineCircle size="70%"/>
            </li>
        </ul>

        <SVGViewer
            annotations={annotations}
            onMouseDown={(pos, e) => {
                if(currentTool === "box") {
                    mouseState.current = "create-box-corner";
                    const copy = annotations.map(a => a);
                    copy.push({
                        type: "box",
                        corners: [
                            pos,
                            pos
                        ],
                        color: `hsl(${360 * Math.random()} 80% 70%)`,
                        label: "rat"
                    });
                    setAnnotations(copy);
                    return true;
                }else if(currentTool === "circle") {
                    mouseState.current = "create-circle-radius";
                    const copy = annotations.map(a => a);
                    copy.push({
                        type: "circle",
                        center: pos,
                        radius: 0,
                        label: "rat",
                        color: `hsl(${360 * Math.random()} 80% 70%)`,
                    });
                    setAnnotations(copy);
                    return true;
                }
                return false;
            }}
            onMouseMove={(pos, e) => {
                if(mouseState.current === "create-box-corner") {
                    const copy = annotations.map(a => a);
                    copy[copy.length - 1].corners[1] = pos;
                    setAnnotations(copy);
                    return true;
                }else if(mouseState.current === "create-circle-radius") {
                    const copy = annotations.map(a => a);
                    copy[copy.length - 1].radius = dist(copy[copy.length - 1].center, pos);
                    setAnnotations(copy);
                    return true;
                }
                return false;
            }}
            onMouseUp={(pos, e) => {
                if(mouseState.current === "create-box-corner") {
                    mouseState.current = "none";
                    return true;
                }else if(mouseState.current === "create-circle-radius") {
                    mouseState.current = "none";
                    return true;
                }
                return false;
            }}
        
        />


        <div className={styles["inspector"]}>
            <section className={styles["annotation-list"]}>
                <h2>Annotations</h2>
                <ul>
                    {annotations.map((annotation, i) => {
                        return <li key={i}>
                            <div>
                                {annotation.label}
                            </div>
                            <div>
                                <MdCrop/>
                            </div>
                        </li>
                    })}
                </ul>
            </section>
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
