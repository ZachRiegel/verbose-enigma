import React, { useRef, useState, useCallback, useEffect } from "react";
import { GameState } from "src/types";
import styled from "@emotion/styled";

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
    ".   p3a   .   p3b . p4a .   p4b ."
    ".   .     .   .   . .   tbe .   ."
    ".   p3d   .   p3c . p4d .   p4c ."
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

const GameView = ({ gameState }: { gameState: GameState }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [cameraPosition, _setCameraPosition] = useState<CameraPosition>({
    translateX: 0,
    translateY: 0,
    zoom: 0.5,
  });

  const cameraRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const setCameraPosition = useCallback(
    (func: (previous: CameraPosition) => CameraPosition) => {
      _setCameraPosition((previous) => {
        const desiredPosition = func(previous);

        if (!cameraRef.current || !tableRef.current) return previous;
        const { offsetWidth: cameraWidth, offsetHeight: cameraHeight } =
          cameraRef.current;
        const { offsetWidth: baseTableWidth, offsetHeight: baseTableHeight } =
          tableRef.current;
        const tableWidth = baseTableWidth * desiredPosition.zoom;
        const tableHeight = baseTableHeight * desiredPosition.zoom;

        const minX = Math.min(0, cameraWidth - tableWidth);
        const maxX = 0;
        const minY = Math.min(0, cameraWidth * 0.51 - tableHeight);
        const maxY = 0;

        let targetX = desiredPosition.translateX;
        let targetY = desiredPosition.translateY;
        let targetZoom = Math.max(0.5, Math.min(1, desiredPosition.zoom));

        if (
          targetZoom !== previous.zoom &&
          targetX === previous.translateX &&
          targetY === previous.translateY
        ) {
          // When zooming,

          const percentDiff = (1 - targetZoom / previous.zoom) / 2;
          targetX += tableWidth * percentDiff;
          targetY += tableHeight * percentDiff;
        }

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

  const isTrackpad = true; // Make users specify this in their personal config at some point
  const handleWheelEvent = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (isTrackpad) {
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
        // do mouse things
      }
    },
    [isTrackpad, setCameraPosition],
  );

  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    camera.addEventListener("wheel", handleWheelEvent, { passive: false });
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
          style={{
            ["--grid-area" as any]: "p1a / p1a / p1c / p1c",
            ["--playerColor" as any]: "var(--blue)",
          }}
        />
        <PlayerBoard
          style={{
            ["--grid-area" as any]: "p2a / p2a / p2c / p2c",
            ["--playerColor" as any]: "var(--red)",
          }}
        />
        <PlayerBoard
          style={{
            ["--grid-area" as any]: "p3a / p3a / p3c / p3c",
            ["--playerColor" as any]: "var(--yellow)",
          }}
        />
        <PlayerBoard
          style={{
            ["--grid-area" as any]: "p4a / p4a / p4c / p4c",
            ["--playerColor" as any]: "var(--green)",
          }}
        />
        <Tablet />
      </Table>
    </Camera>
  );
};

export default GameView;
