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
import { Arrow, Circle, Rectangle, Scribble } from "./Paint.types";
import { DrawAction, PAINT_OPTIONS } from "./Paint.constants";
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

const SIZE = 500;

const downloadURI = (uri, name) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri || "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const PaintDemo = React.memo(function Paint() {
  const currentShapeRef = useRef();
  const isPaintRef = useRef(false);
  const stageRef = useRef(null);

  const transformerRef = useRef(null);

  const [scribbles, setScribbles] = useState([]);
  const [rectangles, setRectangles] = useState([]);
  const [circles, setCircles] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [image, setImage] = useState();

  const [color, setColor] = useState("#000");
  const [backgroundColor, setBackgroundColor] = useState("#fff"); // Initial background color state
  const [drawAction, setDrawAction] = useState(DrawAction.Scribble);
  const [isBgColorMode, setIsBgColorMode] = useState(false); // Toggle background color mode

  const checkDeselect = useCallback((e) => {
    const clickedOnEmpty = e.target === stageRef?.current?.find("#bg")?.[0];
    if (clickedOnEmpty) {
      transformerRef?.current?.nodes([]);
    }
  }, []);

  const onStageMouseUp = useCallback(() => {
    isPaintRef.current = false;
  }, []);

  const onStageMouseDown = useCallback(
    (e) => {
      checkDeselect(e);

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
    [checkDeselect, drawAction, color]
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

  const diagramRef = useRef(null);

  const onShapeClick = useCallback(
    (e) => {
      if (drawAction !== DrawAction.Select) return;
      const currentTarget = e.currentTarget;
      transformerRef?.current?.node(currentTarget);
    },
    [drawAction]
  );

  const isDraggable = drawAction === DrawAction.Select;

  const onImportImageSelect = useCallback(
    (e) => {
      if (e.target.files?.[0]) {
        const imageURL = URL.createObjectURL(e.target.files[0]);
        const image = new Image(SIZE / 2, SIZE / 2);
        image.src = imageURL;
        setImage(image);
      }
      e.target.files = null;
    },
    []
  );

  const fileRef = useRef(null);

  const onImportImageClick = useCallback(() => {
    fileRef?.current && fileRef?.current?.click();
  }, []);

  const onExportClick = useCallback(() => {
    const dataURL = stageRef?.current?.toDataURL({ pixelRatio: 3 });
    downloadURI(dataURL, "image.png");
  }, []);

  const onClear = useCallback(() => {
    setRectangles([]);
    setCircles([]);
    setArrows([]);
    setScribbles([]);
    setImage(undefined);
  }, []);

  const onBackgroundColorChange = (color) => {
    setBackgroundColor(color.hex); // Update background color
    window.selectedColor = color.hex; // Store globally
  };

  const toggleBackgroundColorMode = () => {
    setIsBgColorMode((prevMode) => !prevMode); // Toggle background color mode
  };

  return (
    <Box m={4} width={`${SIZE}px`}>
      <Flex justifyContent={"space-between"} alignItems="center">
        <ButtonGroup size="sm" isAttached variant="solid">
          {PAINT_OPTIONS.map(({ id, label, icon }) => (
            <IconButton
              key={id}
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
          <IconButton aria-label="Upload image" onClick={onImportImageClick}>
            <Upload />
          </IconButton>
          <input
            ref={fileRef}
            type="file"
            style={{ display: "none" }}
            onChange={onImportImageSelect}
          />
        </ButtonGroup>
        <ButtonGroup>
          <IconButton onClick={onExportClick} aria-label="Export">
            <Download />
          </IconButton>
          <IconButton onClick={onClear} aria-label="Clear canvas">
            <XLg />
          </IconButton>
          <Popover>
            <PopoverTrigger>
              <IconButton
                id="background-color-icon"
                aria-label="Toggle Background Color"
                icon={<Box bg={backgroundColor} h={"32px"} w={"32px"} />}
              />
            </PopoverTrigger>
            <PopoverContent width="200px" >
              <SketchPicker
                color={backgroundColor}
                onChangeComplete={onBackgroundColorChange} // Handle color change
              />
            </PopoverContent>
          </Popover>
        </ButtonGroup>
      </Flex>
      <Box
        border="1px solid black"
        mt={4}
        overflow="hidden"
        bg={backgroundColor}
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
              fill={backgroundColor} 
              id="bg"
              
            />
            {image && (
              <KonvaImage
                ref={diagramRef}
                image={image}
                x={0}
                y={0}
                height={SIZE / 2}
                width={SIZE / 2}
                onClick={onShapeClick}
                draggable={isDraggable}
              />
            )}
            {rectangles?.map((rectangle) => (
              <KonvaRect
                key={rectangle.id}
                x={rectangle?.x}
                y={rectangle?.y}
                onClick={onShapeClick}
                height={rectangle?.height}
                width={rectangle?.width}
                stroke={rectangle?.color}
                id={rectangle?.id}
                strokeWidth={4}
                draggable={isDraggable}
              />
            ))}
            {circles?.map((circle) => (
              <KonvaCircle
                key={circle.id}
                id={circle.id}
                x={circle?.x}
                y={circle?.y}
                radius={circle?.radius}
                stroke={circle?.color}
                strokeWidth={4}
                draggable={isDraggable}
                onClick={onShapeClick}
              />
            ))}
            {scribbles.map((scribble) => (
              <KonvaLine
                key={scribble.id}
                id={scribble.id}
                lineCap="round"
                lineJoin="round"
                stroke={scribble?.color}
                strokeWidth={4}
                points={scribble.points}
                name={DrawAction.Scribble}
                onClick={onShapeClick}
                draggable={isDraggable}
              />
            ))}
            {arrows.map((arrow) => (
              <KonvaArrow
                key={arrow.id}
                id={arrow.id}
                points={arrow.points}
                fill={arrow.color}
                stroke={arrow.color}
                strokeWidth={4}
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
