import React, { useCallback, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect as KonvaRect,
  Image as KonvaImage,
  Circle as KonvaCircle,
  Line as KonvaLine,
  Arrow as KonvaArrow,
  Transformer,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { SketchPicker } from "react-color";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react";
import { Download, Upload, XLg } from "react-bootstrap-icons";
import { PAINT_OPTIONS, DrawAction } from "./Paint.constants"; // assuming this contains your paint options and draw actions

const downloadURI = (uri, name) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri || "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const SIZE = 100;

export const Paint = React.memo(function Paint() {
  const [color, setColor] = useState("#000");
  const [drawAction, setDrawAction] = useState(DrawAction.Select);
  const [scribbles, setScribbles] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [image, setImage] = useState(null);

  const onImportImageSelect = useCallback((e) => {
    if (e.target.files?.[0]) {
      const imageUrl = URL.createObjectURL(e.target.files?.[0]);
      const image = new Image(SIZE / 2, SIZE / 2);
      image.src = imageUrl;
      setImage(image);
    }
    e.target.files = null;
  }, []);

  const fileRef = useRef(null);
  const onImportImageClick = useCallback(() => {
    fileRef?.current && fileRef?.current?.click();
  }, []);

  const stageRef = useRef(null);

  const onExportClick = useCallback(() => {
    const dataUri = stageRef?.current?.toDataURL({ pixelRatio: 3 });
    downloadURI(dataUri, "image.png");
  }, []);

  const onClear = useCallback(() => {
    setRectangles([]);
    setCircles([]);
    setScribbles([]);
    setArrows([]);
    setImage(null);
  }, []);

  const isPaintRef = useRef(false);

  const onStageMouseUp = useCallback(() => {
    isPaintRef.current = false;
  }, []);

  const currentShapeRef = useRef(null);

  const onStageMouseDown = useCallback(
    (e) => {
      if (drawAction === DrawAction.Select) return;
      isPaintRef.current = true;
      const stage = stageRef?.current;
      const pos = stage?.getPointerPosition();
      const x = pos?.x || 0;
      const y = pos?.y || 0;
      const id = uuidv4();
      currentShapeRef.current = id;

      switch (drawAction) {
        case DrawAction.Scribble: {
          setScribbles((prevScribbles) => [
            ...prevScribbles,
            {
              id,
              points: [x, y],
              color,
            },
          ]);
          break;
        }
        case DrawAction.Circle: {
          setCircles((prevCircles) => [
            ...prevCircles,
            {
              id,
              radius: 1,
              x,
              y,
              color,
            },
          ]);
          break;
        }
        case DrawAction.Rectangle: {
          setRectangles((prevRectangles) => [
            ...prevRectangles,
            {
              id,
              height: 1,
              width: 1,
              x,
              y,
              color,
            },
          ]);
          break;
        }
        case DrawAction.Arrow: {
          setArrows((prevArrows) => [
            ...prevArrows,
            {
              id,
              points: [x, y, x, y],
              color,
            },
          ]);
          break;
        }
      }
    },
    [drawAction, color]
  );

  const onStageMouseMove = useCallback(() => {
    if (drawAction === DrawAction.Select || !isPaintRef.current) return;

    const stage = stageRef?.current;
    const id = currentShapeRef.current;
    const pos = stage?.getPointerPosition();
    const x = pos?.x || 0;
    const y = pos?.y || 0;

    switch (drawAction) {
      case DrawAction.Scribble: {
        setScribbles((prevScribbles) =>
          prevScribbles?.map((prevScribble) =>
            prevScribble.id === id
              ? {
                  ...prevScribble,
                  points: [...prevScribble.points, x, y],
                }
              : prevScribble
          )
        );
        break;
      }
      case DrawAction.Circle: {
        setCircles((prevCircles) =>
          prevCircles?.map((prevCircle) =>
            prevCircle.id === id
              ? {
                  ...prevCircle,
                  radius:
                    ((x - prevCircle.x) ** 2 + (y - prevCircle.y) ** 2) ** 0.5,
                }
              : prevCircle
          )
        );
        break;
      }
      case DrawAction.Rectangle: {
        setRectangles((prevRectangles) =>
          prevRectangles?.map((prevRectangle) =>
            prevRectangle.id === id
              ? {
                  ...prevRectangle,
                  height: y - prevRectangle.y,
                  width: x - prevRectangle.x,
                }
              : prevRectangle
          )
        );
        break;
      }
      case DrawAction.Arrow: {
        setArrows((prevArrows) =>
          prevArrows.map((prevArrow) =>
            prevArrow.id === id
              ? {
                  ...prevArrow,
                  points: [prevArrow.points[0], prevArrow.points[1], x, y],
                }
              : prevArrow
          )
        );
        break;
      }
    }
  }, [drawAction]);

  const transformerRef = useRef(null);

  const onShapeClick = useCallback(
    (e) => {
      if (drawAction !== DrawAction.Select) return;
      const currentTarget = e.currentTarget;
      transformerRef?.current?.node(currentTarget);
    },
    [drawAction]
  );

  const isDraggable = drawAction === DrawAction.Select;

  const onBgClick = useCallback(() => {
    transformerRef?.current?.nodes([]);
  }, [drawAction]);

  return (
    <Box m={4} width={`${SIZE}px`}>
      <Flex justifyContent={"space-between"} alignItems="center">
        <ButtonGroup size="sm" isAttached variant="solid">
          {PAINT_OPTIONS.map(({ id, label, icon }) => (
            <IconButton
              aria-label={label}
              icon={icon}
              onClick={() => setDrawAction(id)}
              colorScheme={id === drawAction ? "whatsapp" : undefined}
            />
          ))}
          <Popover>
            <PopoverTrigger>
              <Box
                bg={color}
                h={"32px"}
                w={"32px"}
                borderRadius="sm"
                cursor="pointer"
              ></Box>
            </PopoverTrigger>
            <PopoverContent width="300">
              <PopoverArrow />
              <PopoverCloseButton />
              <SketchPicker
                color={color}
                onChangeComplete={(selectedColor) =>
                  setColor(selectedColor.hex)
                }
              />
            </PopoverContent>
          </Popover>
          <IconButton aria-label={"Clear"} icon={<XLg />} onClick={onClear} />
        </ButtonGroup>
        <Flex gap={4} alignItems="center" height="100%">
          <input
            type="file"
            ref={fileRef}
            onChange={onImportImageSelect}
            style={{ display: "none" }}
            accept="image/*"
          />
          <Button
            leftIcon={<Upload />}
            variant="solid"
            onClick={onImportImageClick}
            size="sm"
          >
            Import Image
          </Button>
          <Button
            leftIcon={<Download />}
            colorScheme="whatsapp"
            variant="solid"
            onClick={onExportClick}
            size="sm"
          >
            Export
          </Button>
        </Flex>
      </Flex>

      <Box
        width={`${SIZE}px`}
        height={`${SIZE}px`}
        border="1px solid black"
        mt={4}
        overflow="hidden"
      >
        <Stage
          height={SIZE}
          width={SIZE}
          ref={stageRef}
          onMouseUp={onStageMouseUp}
          onMouseDown={onStageMouseDown}
          onMouseMove={onStageMouseMove}
        >
          <Layer>
            <KonvaRect
              x={0}
              y={0}
              height={SIZE}
              width={SIZE}
              fill="white"
              id="bg"
              onClick={onBgClick}
            />
            {image && (
              <KonvaImage
                image={image}
                height={SIZE}
                width={SIZE}
                draggable={isDraggable}
                onClick={onShapeClick}
              />
            )}
            {scribbles?.map(({ id, points, color }) => (
              <KonvaLine
                id={id}
                key={id}
                points={points}
                stroke={color}
                strokeWidth={2}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
              />
            ))}
            {rectangles?.map(({ id, x, y, width, height, color }) => (
              <KonvaRect
                id={id}
                key={id}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={color}
                onClick={onShapeClick}
                draggable={isDraggable}
              />
            ))}
            {circles?.map(({ id, radius, x, y, color }) => (
              <KonvaCircle
                id={id}
                key={id}
                radius={radius}
                x={x}
                y={y}
                fill={color}
                onClick={onShapeClick}
                draggable={isDraggable}
              />
            ))}
            {arrows?.map(({ id, points, color }) => (
              <KonvaArrow
                id={id}
                key={id}
                points={points}
                fill={color}
                stroke={color}
                strokeWidth={4}
                pointerLength={10}
                pointerWidth={8}
                onClick={onShapeClick}
                draggable={isDraggable}
              />
            ))}
            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>
      </Box>
    </Box>
  );
});

export default Paint;
