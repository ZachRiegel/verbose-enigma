import React, {useRef, useState, useCallback, useEffect} from "react";
import {GameState} from "src/types";
import styled from "@emotion/styled";
import _ from "lodash";

const Camera = styled.div`
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  outline: none;
`;

enum Quadrant {
  topLeft,
  topRight,
  bottomRight,
  bottomLeft
}

const QUADRANT_TO_CAMERA_UNIT = {
  [Quadrant.topLeft]: [0, 0],
  [Quadrant.topRight]: [1, 0],
  [Quadrant.bottomRight]: [1, 1],
  [Quadrant.bottomLeft]: [0, 1],
}

const makeCubicBezier = (p0: number, p1: number, p2: number, p3: number) => (t: number) =>
  (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + (1 - t) * t ** 2 * p2 + t ** 3 * p3;

const cameraEasing = makeCubicBezier(.17, .67, .7, .14);
const AVERAGE_CAMERA_SPEED = 200;

const Table = styled.div`
  display: grid;
  background-color: var(--black);
  min-width: 200vw;
  grid-template-areas:
    "obs .     .   .   . .   .   .   ."
    ".   p1a   .   p1b . p2a .   p2b ."
    ".   .     tbs .   . .   .   .   ."
    ".   p1d   .   p1c . p2d .   p2c   ."
    ".   .     .   .   c .   .   .   ."
    ".   p4a   .   p4b . p3a .   p3b ."
    ".   .     .   .   . .   tbe .   ."
    ".   p4d   .   p4c . p3d .   p3c ."
    ".   .     .   .   . .   .   .   obe";
  grid-template-columns: 1cqw 74cqw 2cqw 22cqw 2cqw 22cqw 2cqw 74cqw 1cqw; // 200
  grid-template-rows: 1cqw 1fr max-content max-content 2cqw max-content max-content 1fr 1cqw; // 94
  transform-origin: top left;
`;

const PlayerBoard = styled.div`
  grid-area: var(--grid-area);
  background-color: var(--playerColor);
  width: 100%;
  aspect-ratio: 16/8;
  border-radius: 1vw;
`;

const Tablet = styled.div`
  background-color: var(--black);
  grid-area: tbs / tbs / tbe / tbe;
  border-radius: 1vw;
  aspect-ratio: 16/8;
`;

type CameraPosition = {
  translateX: number;
  translateY: number;
  zoom: number; // 0.5 to 1
};

declare global {
  interface Window {
    isTrackpad: boolean;
  }
}

window.isTrackpad = true; // Make users specify this in their personal config at some point

const GameView = ({gameState}: { gameState: GameState }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [cameraPosition, _setCameraPosition] = useState<CameraPosition>({
    translateX: 0,
    translateY: 0,
    zoom: 0.5,
  });

  const cameraRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const lastKnownQuadrant = useRef<Quadrant>(Quadrant.topLeft);
  const startingZoomPosition = useRef<CameraPosition | null>(null);

  const updateQuadrant = useCallback(_.memoize(
    (quadrant: Quadrant) =>
      () => {
        if (!startingZoomPosition.current) lastKnownQuadrant.current = quadrant
      }), []);

  const setCameraPosition = useCallback(
    (func: (previous: CameraPosition) => CameraPosition) => {
      _setCameraPosition((previous) => {
        const desiredPosition = func(previous);
        let targetZoom = Math.max(0.5, Math.min(1, desiredPosition.zoom));

        if (!cameraRef.current || !tableRef.current) return previous;
        const {offsetWidth: cameraWidth, offsetHeight: cameraHeight} =
          cameraRef.current;
        const {offsetWidth: baseTableWidth, offsetHeight: baseTableHeight} =
          tableRef.current;
        const tableWidth = baseTableWidth * targetZoom;
        const tableHeight = baseTableHeight * targetZoom;

        const minX = Math.min(0, cameraWidth - tableWidth);
        const maxX = 0;
        const minY = Math.min(0, cameraWidth * 0.51 - tableHeight);
        const maxY = 0;

        let targetX = desiredPosition.translateX;
        let targetY = desiredPosition.translateY;

        if (
          targetZoom > previous.zoom &&
          targetX === previous.translateX &&
          targetY === previous.translateY
        ) {
          if (!startingZoomPosition.current) startingZoomPosition.current = previous;
          // If we're zooming in and no translation is requested, try to focus
          // on the current selected quadrant
          const endingLocationX = QUADRANT_TO_CAMERA_UNIT[lastKnownQuadrant.current][0] * cameraWidth;
          const startEndXDifference = endingLocationX - (-1 * startingZoomPosition.current.translateX);
          const xMod = cameraEasing((targetZoom - .5) * 2) * startEndXDifference;
          targetX -= xMod;

          const endingLocationY = QUADRANT_TO_CAMERA_UNIT[lastKnownQuadrant.current][1] * cameraWidth;
          const startEndYDifference = endingLocationY -
            (-1 * startingZoomPosition.current.translateY) +
            (QUADRANT_TO_CAMERA_UNIT[lastKnownQuadrant.current][1] === 1
                ? (tableHeight - .51 * cameraWidth)
                : 0
            );
          const yMod = cameraEasing((targetZoom - .5) * 2) * startEndYDifference;
          targetY -= yMod;
        } else startingZoomPosition.current = null;

        return {
          translateX: Math.max(minX, Math.min(maxX, targetX)),
          translateY: Math.max(minY, Math.min(maxY, targetY)),
          zoom: targetZoom,
        };
      });
    },
    [],
  );

  const startDragging = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
  }, []);

  const dragCamera = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setCameraPosition((previous) => ({
        translateX: e.movementX + previous.translateX,
        translateY: e.movementY + previous.translateY,
        zoom: previous.zoom,
      }));
    },
    [isDragging, setCameraPosition],
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheelEvent = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (window.isTrackpad) {
        // Cntrl meta indicates pinch to zoom
        if (e.ctrlKey) {
          setCameraPosition((previous) => ({
            ...previous,
            zoom: previous.zoom - e.deltaY * 0.007,
          }));
        } else {
          setCameraPosition((previous) => ({
            translateX: previous.translateX - e.deltaX,
            translateY: previous.translateY - e.deltaY,
            zoom: previous.zoom,
          }));
        }
      } else {
        setCameraPosition((previous) => ({
          ...previous,
          zoom: previous.zoom - e.deltaY * 0.007,
        }));
      }
    },
    [setCameraPosition],
  );

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.addEventListener("wheel", handleWheelEvent, {passive: false});
    return () => {
      camera.removeEventListener("wheel", handleWheelEvent);
    };
  }, [handleWheelEvent]);

  return (
    <Camera
      ref={cameraRef}
      onPointerMove={dragCamera}
      onPointerUp={stopDragging}
      onPointerLeave={stopDragging}
      onPointerDown={startDragging}
      tabIndex={0}
    >
      <Table
        ref={tableRef}
        style={{
          cursor: isDragging ? "grab" : "default",
          transform: `translateX(${cameraPosition.translateX}px)  translateY(${cameraPosition.translateY}px) scale(${cameraPosition.zoom})`,
        }}
      >
        <PlayerBoard
          onMouseMove={updateQuadrant(Quadrant.topLeft)}
          style={{
            ["--grid-area" as any]: "p1a / p1a / p1c / p1c",
            ["--playerColor" as any]: "var(--blue)",
          }}
        />
        <PlayerBoard
          onMouseMove={updateQuadrant(Quadrant.topRight)}
          style={{
            ["--grid-area" as any]: "p2a / p2a / p2c / p2c",
            ["--playerColor" as any]: "var(--red)",
          }}
        />
        <PlayerBoard
          onMouseMove={updateQuadrant(Quadrant.bottomRight)}
          style={{
            ["--grid-area" as any]: "p3a / p3a / p3c / p3c",
            ["--playerColor" as any]: "var(--yellow)",
          }}
        />
        <PlayerBoard
          onMouseMove={updateQuadrant(Quadrant.bottomLeft)}
          style={{
            ["--grid-area" as any]: "p4a / p4a / p4c / p4c",
            ["--playerColor" as any]: "var(--green)",
          }}
        />
        <Tablet/>
      </Table>
    </Camera>
  );
};

export default GameView;
